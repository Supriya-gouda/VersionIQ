pipeline {
  agent any

  properties([
    githubProjectProperty(projectUrlStr: 'https://github.com/Supriya-gouda/VersionIQ/')
  ])

  options {
    timeout(time: 1, unit: 'HOURS')
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()
  }

  triggers {
    githubPush()
  }

  environment {
    COMPOSE_DOCKER_CLI_BUILD = "1"
    DOCKER_BUILDKIT           = "1"
    NODE_ENV                  = "production"
    COMPOSE_FILES             = "-p version-vault-pro -f docker-compose.yml -f docker-compose.jenkins.yml"
  }

  parameters {
    choice(
      name: 'ENVIRONMENT',
      choices: ['staging', 'production'],
      description: 'Deployment environment'
    )

    booleanParam(
      name: 'SKIP_TESTS',
      defaultValue: false,
      description: 'Skip test suite'
    )

    booleanParam(
      name: 'SKIP_DOCKER',
      defaultValue: false,
      description: 'Skip Docker build & deploy'
    )

    choice(
      name: 'JENKINS_NETWORK_MODE',
      choices: ['shared-compose-network', 'docker-container', 'host-agent'],
      description: '''Where Jenkins is running:
shared-compose-network → Jenkins is in the same Docker network as the app
docker-container       → Jenkins runs in a container but not same compose network
host-agent             → Jenkins runs directly on the host'''
    )
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.BUILD_TIMESTAMP = sh(
            script: 'date -u +"%Y-%m-%dT%H:%M:%SZ"',
            returnStdout: true
          ).trim()
        }
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
          echo "================================================"
          git log --oneline -3 || true
        '''
      }
    }

    stage('Resolve Network URLs') {
      steps {
        script {
          switch (params.JENKINS_NETWORK_MODE) {
            case 'docker-container':
              // Use host.docker.internal to reach the backend running on your Windows host
              env.RESOLVED_BACKEND_URL  = 'http://host.docker.internal:4000'
              env.RESOLVED_FRONTEND_URL = 'http://host.docker.internal:3000'
              env.RESOLVED_MONGODB_URI  = 'mongodb://admin:changeme@host.docker.internal:27017/version_vault?authSource=admin'
              break

            case 'shared-compose-network':
              // Use service names when everything is inside the same Docker network
              env.RESOLVED_BACKEND_URL  = 'http://backend:4000'
              env.RESOLVED_FRONTEND_URL = 'http://frontend:3000'
              env.RESOLVED_MONGODB_URI  = 'mongodb://admin:changeme@mongodb:27017/version_vault?authSource=admin'
              break

            default:
              // Fallback for host-agent or local dev
              env.RESOLVED_BACKEND_URL  = 'http://localhost:4000'
              env.RESOLVED_FRONTEND_URL = 'http://localhost:3000'
              env.RESOLVED_MONGODB_URI  = 'mongodb://admin:changeme@localhost:27017/version_vault?authSource=admin'
          }

          echo "================================================"
          echo "  Network Configuration"
          echo "  Mode    : ${params.JENKINS_NETWORK_MODE}"
          echo "  Backend : ${env.RESOLVED_BACKEND_URL}"
          echo "  Frontend: ${env.RESOLVED_FRONTEND_URL}"
          echo "================================================"
        }
      }
    }

    stage('Install Dependencies') {
      parallel {
        stage('Frontend: npm ci') {
          steps {
            sh '''
              echo "Installing frontend dependencies..."
              npm ci --include=dev --no-audit --no-fund
              echo "✓ Frontend dependencies installed"
            '''
          }
        }

        stage('Backend: npm ci') {
          steps {
            dir('backend') {
              sh '''
                echo "Installing backend dependencies..."
                npm ci --include=dev --no-audit --no-fund
                echo "✓ Backend dependencies installed"
              '''
            }
          }
        }
      }
    }

    stage('Lint & Syntax Check') {
      parallel {
        stage('Frontend: ESLint') {
          steps {
            sh '''
              echo "Running frontend lint..."
              npm run lint
              echo "✓ Frontend lint passed"
            '''
          }
        }

        stage('Backend: Node syntax') {
          steps {
            dir('backend') {
              sh '''
                echo "Checking backend syntax..."
                for f in $(find src -type f -name "*.js" | sort); do
                  node --check "$f"
                done
                echo "✓ Backend syntax valid"
              '''
            }
          }
        }
      }
    }

    stage('Tests') {
      when {
        expression { !params.SKIP_TESTS }
      }
      steps {
        dir('backend') {
          sh '''
            echo "Running backend test suite..."
            export MONGODB_URI="${RESOLVED_MONGODB_URI}"
            npm test
            echo "✓ Backend tests passed"
          '''
        }
      }
      post {
        failure {
          echo "Tests failed — pipeline will not proceed to build/deploy"
        }
      }
    }

    stage('Build') {
      parallel {
        stage('Frontend: build') {
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

    stage('Security Audit') {
      steps {
        sh '''
          echo "Running frontend security audit..."
          npm audit --omit=dev --audit-level=high || echo "⚠ Frontend audit warnings (non-blocking)"
        '''
        dir('backend') {
          sh '''
            echo "Running backend security audit..."
            npm audit --omit=dev --audit-level=high || echo "⚠ Backend audit warnings (non-blocking)"
          '''
        }
        sh 'echo "✓ Security audit completed"'
      }
    }

    stage('Docker: Build Images') {
      when {
        expression { !params.SKIP_DOCKER }
      }
      steps {
        sh '''
          echo "Building Docker images..."
          docker compose ${COMPOSE_FILES} build --progress=plain backend frontend
          echo "Built images:"
          docker images | grep version-vault || true
          echo "✓ Docker images built"
        '''
      }
    }

    stage('Docker: Deploy Stack') {
      when {
        expression { !params.SKIP_DOCKER }
      }
      steps {
        sh '''
          echo "Starting full stack..."
          docker compose ${COMPOSE_FILES} up -d --remove-orphans mongodb backend frontend

          echo "Waiting for services to initialise (30s)..."
          sleep 30

          echo "Container status:"
          docker compose ${COMPOSE_FILES} ps
        '''
      }
      post {
        failure {
          sh 'docker compose ${COMPOSE_FILES} logs --tail=100 || true'
        }
      }
    }

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
            echo "❌ Backend health check failed after retries"
            echo "=== Backend container logs ==="
            docker compose ${COMPOSE_FILES} logs backend --tail=80 || true
            exit 1
          fi

          echo "Checking backend /api/health ..."
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            --connect-timeout 5 --max-time 10 \
            "${RESOLVED_BACKEND_URL}/api/health" || echo "000")
          if [ "$HTTP_CODE" = "200" ]; then
            echo "✓ Backend /api/health OK"
          else
            echo "⚠ /api/health returned HTTP $HTTP_CODE (non-critical)"
          fi

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
            echo "⚠ Frontend not responding after retries (non-critical)"
            docker compose ${COMPOSE_FILES} logs frontend --tail=40 || true
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
            docker compose ${COMPOSE_FILES} logs backend --tail=100 || true
            echo "=== MongoDB logs ==="
            docker compose ${COMPOSE_FILES} logs mongodb --tail=50 || true
          '''
        }
      }
    }

    stage('Record Pipeline Status') {
      when {
        expression { !params.SKIP_DOCKER }
      }
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
        '''
      }
    }
  }

  post {
    success {
      echo "Pipeline #${BUILD_NUMBER} completed successfully"
    }

    failure {
      sh '''
        echo "Pipeline #${BUILD_NUMBER} FAILED"
        echo "Check console output: ${BUILD_URL}console"

        if [ -n "${RESOLVED_BACKEND_URL:-}" ]; then
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
        fi
      '''
    }

    aborted {
      echo "Pipeline #${BUILD_NUMBER} was aborted"
    }

    always {
      deleteDir()
    }
  }
}