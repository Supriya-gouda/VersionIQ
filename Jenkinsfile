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
    // Resolved at runtime so the variable is never empty
    BUILD_TIMESTAMP         = """${sh(script: 'date -u +"%Y-%m-%dT%H:%M:%SZ"', returnStdout: true).trim()}"""
    BACKEND_URL             = "http://localhost:4000"
    FRONTEND_URL            = "http://localhost:3000"
  }

  parameters {
    choice(
      name: 'ENVIRONMENT',
      choices: ['staging', 'production'],
      description: 'Deployment environment'
    )
    booleanParam(name: 'SKIP_TESTS',  defaultValue: false, description: 'Skip test suite')
    booleanParam(name: 'SKIP_DOCKER', defaultValue: false, description: 'Skip Docker build & deploy')
  }

  stages {

    // ─────────────────────────────────────────────────────────────────────────
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
          echo "================================================"
          git log --oneline -3
        '''
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    stage('Security Audit') {
      steps {
        sh '''
          echo "Running npm security audit..."
          npm audit --production --audit-level=high || echo "⚠ Audit warnings (non-blocking)"
          cd backend && npm audit --production --audit-level=high || echo "⚠ Backend audit warnings (non-blocking)"
          echo "✓ Security audit completed"
        '''
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    stage('Health Checks') {
      when {
        expression { !params.SKIP_DOCKER }
      }
      steps {
        sh '''
          echo "================================================"
          echo "  Running Health Checks"
          echo "================================================"

          # Backend /health
          echo "Checking backend /health ..."
          for i in 1 2 3 4 5; do
            if curl -sf "${BACKEND_URL}/health" > /dev/null; then
              echo "✓ Backend /health OK"
              break
            fi
            echo "  Attempt $i failed, retrying in 10s..."
            sleep 10
            if [ $i -eq 5 ]; then
              echo "❌ Backend health check failed after 5 attempts"
              docker compose logs backend --tail=50
              exit 1
            fi
          done

          # Backend /api/health (alias)
          echo "Checking backend /api/health ..."
          curl -sf "${BACKEND_URL}/api/health" > /dev/null && echo "✓ Backend /api/health OK" || echo "⚠ /api/health not available"

          # Frontend
          echo "Checking frontend ..."
          for i in 1 2 3; do
            if curl -sf "${FRONTEND_URL}/" > /dev/null; then
              echo "✓ Frontend OK"
              break
            fi
            echo "  Attempt $i failed, retrying in 10s..."
            sleep 10
            if [ $i -eq 3 ]; then
              echo "⚠ Frontend not responding (non-critical)"
            fi
          done

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

    // ─────────────────────────────────────────────────────────────────────────
    stage('Record Pipeline Status') {
      steps {
        sh '''
          echo "================================================"
          echo "  Recording pipeline result to VersionIQ"
          echo "================================================"

          # Push build result to the VersionIQ pipeline webhook endpoint.
          # This stores the run in MongoDB so the DevOps dashboard shows it
          # even when Jenkins is offline.
          PAYLOAD=$(cat <<ENDJSON
{
  "buildNumber": ${BUILD_NUMBER},
  "pipeline": "VersionIQ",
  "branch": "${GIT_BRANCH}",
  "commit": "${GIT_COMMIT}",
  "author": "${GIT_AUTHOR_NAME:-Jenkins}",
  "status": "success",
  "durationMs": 0,
  "startedAt": "${BUILD_TIMESTAMP}",
  "source": "jenkins"
}
ENDJSON
)

          # Try to POST to the webhook; failure is non-fatal
          curl -sf -X POST "${BACKEND_URL}/pipelines/webhook" \
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

  // ─────────────────────────────────────────────────────────────────────────
  post {
    success {
      echo "✅ Pipeline #${BUILD_NUMBER} completed successfully"
    }

    failure {
      sh '''
        echo "❌ Pipeline #${BUILD_NUMBER} FAILED"
        echo "Check console output: ${BUILD_URL}console"

        # Attempt to record failure in VersionIQ
        PAYLOAD=$(cat <<ENDJSON
{
  "buildNumber": ${BUILD_NUMBER},
  "pipeline": "VersionIQ",
  "branch": "${GIT_BRANCH}",
  "commit": "${GIT_COMMIT}",
  "author": "${GIT_AUTHOR_NAME:-Jenkins}",
  "status": "failed",
  "durationMs": 0,
  "startedAt": "${BUILD_TIMESTAMP}",
  "source": "jenkins"
}
ENDJSON
)
        curl -sf -X POST "${BACKEND_URL}/pipelines/webhook" \
          -H "Content-Type: application/json" \
          -H "X-Jenkins-Token: ${JENKINS_WEBHOOK_SECRET:-}" \
          -d "$PAYLOAD" || true
      '''
    }

    aborted {
      echo "⚠ Pipeline #${BUILD_NUMBER} was aborted"
    }

    always {
      sh '''
        echo "Cleaning workspace..."
        docker compose down --remove-orphans 2>/dev/null || true
      '''
      cleanWs()
    }
  }
}
