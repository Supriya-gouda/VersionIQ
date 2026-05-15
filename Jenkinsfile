pipeline {
  agent any

  options {
    timeout(time: 1, unit: 'HOURS')
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()
  }

  environment {
    COMPOSE_DOCKER_CLI_BUILD = "1"
    DOCKER_BUILDKIT         = "1"
    NODE_ENV                = "production"

    // Resolved at runtime — never empty
    BUILD_TIMESTAMP = """${sh(script: 'date -u +"%Y-%m-%dT%H:%M:%SZ"', returnStdout: true).trim()}"""

    // ── Networking ────────────────────────────────────────────────────────
    //
    // IMPORTANT: how Jenkins reaches the app containers depends on WHERE
    // Jenkins itself is running.
    //
    // Case A — Jenkins runs directly on the Docker HOST (bare-metal or VM,
    //           not inside a container).  The compose ports are published to
    //           the host, so localhost works:
    //
    //   BACKEND_URL  = "http://localhost:4000"
    //   FRONTEND_URL = "http://localhost:3000"
    //
    // Case B — Jenkins runs INSIDE a Docker container on the same host.
    //           "localhost" inside the Jenkins container is the Jenkins
    //           container itself — the app containers are NOT reachable that
    //           way.  Use host.docker.internal (Docker Desktop / Docker 20.10+)
    //           or the host's gateway IP instead:
    //
    //   BACKEND_URL  = "http://host.docker.internal:4000"
    //   FRONTEND_URL = "http://host.docker.internal:3000"
    //
    // Case C — Jenkins and the app stack share the SAME Docker Compose
    //           network (jenkins service added to docker-compose.yml).
    //           Use the compose service names directly:
    //
    //   BACKEND_URL  = "http://backend:4000"
    //   FRONTEND_URL = "http://frontend:3000"
    //
    // The default below is Case A (Jenkins on host).
    // Override via Jenkins → Manage Jenkins → System → Global properties
    // or set JENKINS_CASE=B / JENKINS_CASE=C in the job environment.
    // ─────────────────────────────────────────────────────────────────────
    BACKEND_URL  = "${env.BACKEND_URL  ?: 'http://localhost:4000'}"
    FRONTEND_URL = "${env.FRONTEND_URL ?: 'http://localhost:3000'}"
  }

  parameters {
    choice(
      name: 'ENVIRONMENT',
      choices: ['staging', 'production'],
      description: 'Deployment environment'
    )
    booleanParam(name: 'SKIP_TESTS',  defaultValue: false, description: 'Skip test suite')
    booleanParam(name: 'SKIP_DOCKER', defaultValue: false, description: 'Skip Docker build & deploy')
    choice(
      name: 'JENKINS_NETWORK_MODE',
      choices: ['host-agent', 'docker-container', 'shared-compose-network'],
      description: '''Where is Jenkins running?
  host-agent            → Jenkins on the Docker host; use localhost URLs
  docker-container      → Jenkins in a container; use host.docker.internal
  shared-compose-network → Jenkins in the same compose network; use service names'''
    )
  }

  stages {

    // ─────────────────────────────────────────────────────────────────────
    stage('Checkout') {
      steps {
        checkout scm
        sh '''
          echo "================================================"
          echo "  VersionIQ CI/CD Pipeline"
          echo "================================================"
          echo "Build     : ${BUILD_NUMBER}"
          echo "Branch    : ${GIT_BRANCH}"
          echo "Commit    : ${GIT_COMMIT}"
          echo "Timestamp : ${BUILD_TIMESTAMP}"
          echo "Env       : ${ENVIRONMENT}"
          echo "Network   : ${JENKINS_NETWORK_MODE}"
          echo "Backend   : ${BACKEND_URL}"
          echo "Frontend  : ${FRONTEND_URL}"
          echo "================================================"
          git log --oneline -3
        '''
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Resolve the correct health-check URLs based on the network mode
    // parameter.  This stage sets RESOLVED_BACKEND_URL and
    // RESOLVED_FRONTEND_URL as environment variables for downstream stages.
    // ─────────────────────────────────────────────────────────────────────
    stage('Resolve Network URLs') {
      steps {
        script {
          switch (params.JENKINS_NETWORK_MODE) {
            case 'docker-container':
              // Jenkins is inside a container; reach the host via
              // host.docker.internal (Docker Desktop) or the gateway IP.
              env.RESOLVED_BACKEND_URL  = 'http://host.docker.internal:4000'
              env.RESOLVED_FRONTEND_URL = 'http://host.docker.internal:3000'
              break
            case 'shared-compose-network':
              // Jenkins is in the same compose network; use service names.
              env.RESOLVED_BACKEND_URL  = 'http://backend:4000'
              env.RESOLVED_FRONTEND_URL = 'http://frontend:3000'
              break
            default:
              // host-agent: Jenkins runs on the Docker host directly.
              env.RESOLVED_BACKEND_URL  = env.BACKEND_URL  ?: 'http://localhost:4000'
              env.RESOLVED_FRONTEND_URL = env.FRONTEND_URL ?: 'http://localhost:3000'
          }
          echo "Resolved backend  URL: ${env.RESOLVED_BACKEND_URL}"
          echo "Resolved frontend URL: ${env.RESOLVED_FRONTEND_URL}"
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Install Dependencies') {
      parallel {
        stage('Frontend: npm ci') {
          steps {
            sh '''
              echo "Installing frontend dependencies..."
              npm ci --no-optional --no-audit --no-fund
              echo "✓ Frontend dependencies installed"
            '''
          }
        }
        stage('Backend: npm ci') {
          steps {
            dir('backend') {
              sh '''
                echo "Installing backend dependencies..."
                npm ci --no-optional --no-audit --no-fund
                echo "✓ Backend dependencies installed"
              '''
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Lint & Syntax Check') {
      parallel {
        stage('Frontend: ESLint') {
          steps {
            sh '''
              echo "Running frontend lint..."
              npm run lint -- --max-warnings=0 || {
                echo "⚠ Frontend lint warnings/errors detected"
                exit 1
              }
              echo "✓ Frontend lint passed"
            '''
          }
        }
        stage('Backend: Node syntax') {
          steps {
            dir('backend') {
              sh '''
                echo "Checking backend syntax..."
                node --check src/server.js
                node --check src/app.js
                for f in src/routes/*.js src/controllers/*.js src/services/*.js src/models/*.js src/middleware/*.js src/utils/*.js src/config/*.js; do
                  node --check "$f" || exit 1
                done
                echo "✓ Backend syntax valid"
              '''
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Tests') {
      when {
        expression { !params.SKIP_TESTS }
      }
      steps {
        dir('backend') {
          sh '''
            echo "Running backend test suite..."
            npm test
            echo "✓ Backend tests passed"
          '''
        }
      }
      post {
        failure {
          echo "❌ Tests failed — pipeline will not proceed to build/deploy"
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Build') {
      parallel {
        stage('Frontend: vite build') {
          steps {
            sh '''
              echo "Building frontend..."
              npm run build
              echo "Build output:"
              ls -lh dist/ 2>/dev/null || ls -lh .output/ 2>/dev/null || true
              echo "✓ Frontend build successful"
            '''
          }
        }
        stage('Backend: validate') {
          steps {
            dir('backend') {
              sh '''
                echo "Validating backend entry point..."
                node --check src/server.js
                echo "✓ Backend validation passed"
              '''
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Security Audit') {
      steps {
        // Use dir() instead of cd so each audit runs in the correct directory
        sh 'echo "Running frontend security audit..."'
        sh 'npm audit --production --audit-level=high || echo "⚠ Frontend audit warnings (non-blocking)"'
        dir('backend') {
          sh 'npm audit --production --audit-level=high || echo "⚠ Backend audit warnings (non-blocking)"'
        }
        sh 'echo "✓ Security audit completed"'
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Docker: Build Images') {
      when {
        expression { !params.SKIP_DOCKER }
      }
      steps {
        sh '''
          echo "Building Docker images..."
          docker compose build --progress=plain --no-cache
          echo "Built images:"
          docker images | grep version-vault || true
          echo "✓ Docker images built"
        '''
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Docker: Deploy Stack') {
      when {
        expression { !params.SKIP_DOCKER }
      }
      steps {
        sh '''
          echo "Stopping any existing containers..."
          docker compose down --remove-orphans || true

          echo "Starting full stack..."
          docker compose up -d mongodb backend frontend

          echo "Waiting for services to initialise (30s)..."
          sleep 30

          echo "Container status:"
          docker compose ps
        '''
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Health Checks') {
      when {
        expression { !params.SKIP_DOCKER }
      }
      steps {
        sh '''
          echo "================================================"
          echo "  Running Health Checks"
          echo "  Backend  : ${RESOLVED_BACKEND_URL}"
          echo "  Frontend : ${RESOLVED_FRONTEND_URL}"
          echo "================================================"

          # ── Backend /health ──────────────────────────────────────────────
          echo "Checking backend /health ..."
          BACKEND_OK=0
          for i in 1 2 3 4 5 6; do
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
              --connect-timeout 5 --max-time 10 \
              "${RESOLVED_BACKEND_URL}/health" || echo "000")
            if [ "$HTTP_CODE" = "200" ]; then
              echo "✓ Backend /health OK (HTTP $HTTP_CODE)"
              BACKEND_OK=1
              break
            fi
            echo "  Attempt $i: HTTP $HTTP_CODE — retrying in 10s..."
            sleep 10
          done

          if [ "$BACKEND_OK" = "0" ]; then
            echo "❌ Backend health check failed after 6 attempts"
            echo "=== Backend container logs ==="
            docker compose logs backend --tail=80 || true
            echo ""
            echo "HINT: If Jenkins is running inside a Docker container, set"
            echo "  JENKINS_NETWORK_MODE=docker-container  (uses host.docker.internal)"
            echo "  or add Jenkins to the version-vault-network in docker-compose.yml"
            exit 1
          fi

          # ── Backend /api/health (alias) ──────────────────────────────────
          echo "Checking backend /api/health ..."
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            --connect-timeout 5 --max-time 10 \
            "${RESOLVED_BACKEND_URL}/api/health" || echo "000")
          if [ "$HTTP_CODE" = "200" ]; then
            echo "✓ Backend /api/health OK"
          else
            echo "⚠ /api/health returned HTTP $HTTP_CODE (non-critical)"
          fi

          # ── Frontend ─────────────────────────────────────────────────────
          echo "Checking frontend ..."
          FRONTEND_OK=0
          for i in 1 2 3 4; do
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
              --connect-timeout 5 --max-time 10 \
              "${RESOLVED_FRONTEND_URL}/" || echo "000")
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
              echo "✓ Frontend OK (HTTP $HTTP_CODE)"
              FRONTEND_OK=1
              break
            fi
            echo "  Attempt $i: HTTP $HTTP_CODE — retrying in 10s..."
            sleep 10
          done

          if [ "$FRONTEND_OK" = "0" ]; then
            echo "⚠ Frontend not responding after 4 attempts (non-critical)"
            docker compose logs frontend --tail=40 || true
          fi

          echo "================================================"
          echo "  Health Checks Complete"
          echo "================================================"
        '''
      }
      post {
        failure {
          sh '''
            echo "=== Backend logs ==="
            docker compose logs backend --tail=100 || true
            echo "=== MongoDB logs ==="
            docker compose logs mongodb --tail=50 || true
          '''
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    stage('Record Pipeline Status') {
      steps {
        sh '''
          echo "================================================"
          echo "  Recording pipeline result to VersionIQ"
          echo "================================================"

          PAYLOAD=$(printf '{
  "buildNumber": %s,
  "pipeline": "VersionIQ",
  "branch": "%s",
  "commit": "%s",
  "author": "%s",
  "status": "success",
  "durationMs": 0,
  "startedAt": "%s",
  "source": "jenkins"
}' "${BUILD_NUMBER}" "${GIT_BRANCH}" "${GIT_COMMIT}" \
   "${GIT_AUTHOR_NAME:-Jenkins}" "${BUILD_TIMESTAMP}")

          curl -sf -X POST "${RESOLVED_BACKEND_URL}/pipelines/webhook" \
            -H "Content-Type: application/json" \
            -H "X-Jenkins-Token: ${JENKINS_WEBHOOK_SECRET:-}" \
            -d "$PAYLOAD" \
            && echo "✓ Pipeline status recorded" \
            || echo "⚠ Could not reach pipeline webhook (non-fatal)"

          echo "================================================"
          echo "  Pipeline Summary"
          echo "================================================"
          echo "  Status    : SUCCESS"
          echo "  Build     : ${BUILD_NUMBER}"
          echo "  Branch    : ${GIT_BRANCH}"
          echo "  Commit    : ${GIT_COMMIT}"
          echo "  Timestamp : ${BUILD_TIMESTAMP}"
          echo "  Env       : ${ENVIRONMENT}"
          echo "================================================"
        '''
      }
    }

  } // end stages

  // ─────────────────────────────────────────────────────────────────────
  post {
    success {
      echo "✅ Pipeline #${BUILD_NUMBER} completed successfully"
    }

    failure {
      sh '''
        echo "❌ Pipeline #${BUILD_NUMBER} FAILED"
        echo "Check console output: ${BUILD_URL}console"

        PAYLOAD=$(printf '{
  "buildNumber": %s,
  "pipeline": "VersionIQ",
  "branch": "%s",
  "commit": "%s",
  "author": "%s",
  "status": "failed",
  "durationMs": 0,
  "startedAt": "%s",
  "source": "jenkins"
}' "${BUILD_NUMBER}" "${GIT_BRANCH}" "${GIT_COMMIT}" \
   "${GIT_AUTHOR_NAME:-Jenkins}" "${BUILD_TIMESTAMP}")

        curl -sf -X POST "${RESOLVED_BACKEND_URL}/pipelines/webhook" \
          -H "Content-Type: application/json" \
          -H "X-Jenkins-Token: ${JENKINS_WEBHOOK_SECRET:-}" \
          -d "$PAYLOAD" || true
      '''
    }

    aborted {
      echo "⚠ Pipeline #${BUILD_NUMBER} was aborted"
    }

    always {
      sh 'docker compose down --remove-orphans 2>/dev/null || true'
      cleanWs()
    }
  }
}
