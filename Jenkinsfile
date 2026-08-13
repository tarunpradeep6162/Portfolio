// Secondary/manual validator only. GitHub Actions (.github/workflows/) is
// the primary CI/CD system for this repository - this pipeline exists so
// the same checks can be run from a self-hosted Jenkins controller without
// GitHub as a dependency, reusing the exact same package scripts and
// scripts/ci/ helpers rather than reimplementing their logic. It never
// deploys to production and never runs the full release pipeline
// (Docker image publish, Vercel promotion, tagging) - those stay exclusive
// to .github/workflows/release.yml.
//
// Requires a Jenkins agent labeled 'portfolio-docker' with Node 20 and
// Docker available. Trigger manually (Build Now) or point an SCM webhook
// at it - this file makes no assumption about how it's triggered.

pipeline {
    agent { label 'portfolio-docker' }

    options {
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(daysToKeepStr: '14'))
    }

    environment {
        CI_BASE_URL = 'http://localhost:3600'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Repository safety check') {
            steps {
                sh '''
                    set -e
                    if git ls-files | grep -E '^\\.env($|\\.)'; then
                        echo "ERROR: .env file(s) tracked in repository" >&2
                        exit 1
                    fi
                    if git ls-files | grep -E '\\.(pem|key)$|credentials\\.json$'; then
                        echo "ERROR: credential-shaped file(s) tracked in repository" >&2
                        exit 1
                    fi
                '''
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Fast validation') {
            steps {
                sh 'npm run lint'
                sh 'npm run typecheck'
                sh 'npm run test:ci'
            }
        }

        stage('Production build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker build') {
            steps {
                sh "docker build -t tarun-portfolio:jenkins-${env.BUILD_NUMBER} ."
            }
        }

        stage('Trivy image scan') {
            steps {
                sh '''
                    if command -v trivy >/dev/null 2>&1; then
                        trivy image --severity CRITICAL,HIGH --ignore-unfixed \
                            tarun-portfolio:jenkins-${BUILD_NUMBER} | tee trivy-jenkins-report.txt
                    else
                        echo "trivy not installed on this agent - scan skipped, not fabricated" | tee trivy-jenkins-report.txt
                    fi
                '''
            }
        }

        stage('Run candidate container') {
            steps {
                sh '''
                    docker rm -f jenkins-candidate 2>/dev/null || true
                    docker run -d --name jenkins-candidate -p 3600:3600 -e PORT=3600 \
                        tarun-portfolio:${BUILD_NUMBER:-jenkins}
                '''
            }
        }

        stage('Verify candidate') {
            steps {
                sh 'node scripts/ci/verify-health.mjs "$CI_BASE_URL" 60000'
                sh 'node scripts/ci/verify-routes.mjs "$CI_BASE_URL"'
                sh 'node scripts/ci/verify-headers.mjs "$CI_BASE_URL" /'
            }
        }

        stage('Targeted Playwright (not the full suite)') {
            steps {
                sh 'npx playwright install --with-deps chromium'
                sh 'PLAYWRIGHT_TEST_BASE_URL="$CI_BASE_URL" npx playwright test tests/e2e/routes.spec.ts --workers=1'
            }
        }
    }

    post {
        always {
            sh 'docker rm -f jenkins-candidate 2>/dev/null || true'
            archiveArtifacts artifacts: 'trivy-jenkins-report.txt, playwright-report/**', allowEmptyArchive: true
        }
    }
}
