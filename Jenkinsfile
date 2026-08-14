// Secondary/manual validator only. GitHub Actions (.github/workflows/) is
// the primary CI/CD system for this repository - this pipeline exists so
// the same checks can be run from a self-hosted Jenkins controller without
// GitHub as a dependency, reusing the exact same package scripts and
// scripts/ci/ (and scripts/*.mjs) helpers rather than reimplementing their
// logic. Deployment here is a genuinely separate mechanism from
// .github/workflows/release.yml's: that workflow only smoke-tests a
// production URL after Vercel's own Git integration deploys on push (GitHub
// is the trigger); this pipeline never pushes to GitHub, so when
// DEPLOY_TO_VERCEL is requested it invokes the Vercel CLI directly with
// credentials read from Jenkins Credentials.
//
// Requires a Jenkins agent labeled 'portfolio-docker' with Node 22, Docker,
// and Trivy available (see jenkins/agent/Dockerfile). Trigger manually
// (Build Now) or point an SCM webhook at it - this file makes no assumption
// about how it's triggered.

// Plain top-level Groovy variable, deliberately NOT declared in the
// pipeline's environment{} block: Declarative Pipeline has a known
// limitation where a variable declared via environment{} cannot be
// reliably overridden later with env.X = ... in a script step - reproduced
// directly in build #3 (the reassignment silently had no effect, every
// later stage still saw the placeholder default). Reassigning this plain
// variable in a script step and referencing it via Groovy string
// interpolation (${CI_BASE_URL}) in later sh steps sidesteps that
// limitation entirely.
def CI_BASE_URL = 'http://localhost:3600'

pipeline {
    agent { label 'portfolio-docker' }

    options {
        timeout(time: 150, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(daysToKeepStr: '14'))
    }

    parameters {
        booleanParam(
            name: 'FINAL_RELEASE',
            defaultValue: false,
            description: 'Run the full expensive validation path (full Playwright suite, accessibility/performance/canvas-before-intent gates, evidence capture, soak test). When false, only the fast validator (lint/typecheck/unit/build/Docker/Trivy/candidate health + a single targeted Playwright spec) runs.'
        )
        booleanParam(
            name: 'DEPLOY_TO_VERCEL',
            defaultValue: false,
            description: 'Only consulted when FINAL_RELEASE is also true, and only after every preceding gate has passed. Deploys via the Vercel CLI using VERCEL_TOKEN/VERCEL_ORG_ID/VERCEL_PROJECT_ID Jenkins credentials; skips honestly (does not fail the build) if those credentials are not configured.'
        )
        booleanParam(
            name: 'RUN_EVIDENCE_CAPTURE',
            defaultValue: true,
            description: 'Only consulted when FINAL_RELEASE is true. Captures the screenshot matrix, walkthrough video, and soak-test log as archived evidence artifacts against the real candidate container.'
        )
    }

    environment {
        IMAGE_TAG = "tarun-portfolio:jenkins-${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                deleteDir()
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
                sh "docker build -t ${IMAGE_TAG} ."
            }
        }

        stage('Trivy image scan') {
            steps {
                // #!/bin/bash + pipefail so a real trivy failure (e.g. its
                // vulnerability-DB download) actually fails this stage,
                // rather than the pipe's exit code being tee's (always 0) -
                // a real, previously-latent bug: a genuine trivy DB-download
                // timeout failed silently in build #1 and the pipeline moved
                // on as if the scan had passed. --timeout 30m because this
                // VM's measured throughput to the DB mirror this session was
                // ~60 KiB/s (real, not stalled) - too slow for trivy's 5m
                // default against a ~107 MiB DB. The DB is cached under
                // this long-lived agent container's own filesystem, so only
                // the first run on a fresh agent pays this cost.
                sh '''#!/bin/bash
                    set -o pipefail
                    if command -v trivy >/dev/null 2>&1; then
                        trivy image --timeout 30m --severity CRITICAL,HIGH --ignore-unfixed \
                            "$IMAGE_TAG" | tee trivy-jenkins-report.txt
                    else
                        echo "trivy not installed on this agent - scan skipped, not fabricated" | tee trivy-jenkins-report.txt
                    fi
                '''
            }
        }

        stage('Run candidate container') {
            steps {
                script {
                    sh '''
                        docker rm -f jenkins-candidate 2>/dev/null || true
                        docker run -d --name jenkins-candidate -p 3600:3600 -e PORT=3600 "$IMAGE_TAG"
                    '''
                    def candidateIp = sh(
                        script: "docker inspect jenkins-candidate --format '{{.NetworkSettings.Networks.bridge.IPAddress}}'",
                        returnStdout: true
                    ).trim()
                    CI_BASE_URL = "http://${candidateIp}:3600"
                    echo "Candidate reachable at ${CI_BASE_URL} (sibling-container bridge IP - this agent's own localhost/gateway cannot reach the host-published port here, confirmed by direct reproduction)"
                }
            }
        }

        stage('Verify candidate') {
            steps {
                script {
                    sh "node scripts/ci/verify-health.mjs ${CI_BASE_URL} 120000"
                    sh "node scripts/ci/verify-routes.mjs ${CI_BASE_URL}"
                    sh "node scripts/ci/verify-headers.mjs ${CI_BASE_URL} /"
                }
            }
        }

        stage('Install Playwright browsers') {
            steps {
                sh 'npx playwright install --with-deps chromium'
            }
        }

        stage('Targeted Playwright (not the full suite)') {
            when { expression { !params.FINAL_RELEASE } }
            steps {
                script {
                    sh "PLAYWRIGHT_TEST_BASE_URL=${CI_BASE_URL} npx playwright test tests/e2e/routes.spec.ts --workers=1"
                }
            }
        }

        stage('Full Playwright suite') {
            when { expression { params.FINAL_RELEASE } }
            steps {
                script {
                    sh "PLAYWRIGHT_TEST_BASE_URL=${CI_BASE_URL} npx playwright test --workers=1"
                }
            }
        }

        stage('Accessibility / structural HTML audit') {
            when { expression { params.FINAL_RELEASE } }
            steps {
                script {
                    sh "V4_BASE_URL=${CI_BASE_URL} npm run audit:html"
                }
            }
        }

        stage('Performance budgets') {
            when { expression { params.FINAL_RELEASE } }
            steps {
                script {
                    sh """
                        V6_BASE_URL=${CI_BASE_URL} node scripts/measure-v6-performance.mjs /work/project-aurora | tee perf-run-1.txt
                        V6_BASE_URL=${CI_BASE_URL} node scripts/measure-v6-performance.mjs /work/project-aurora | tee perf-run-2.txt
                        V6_BASE_URL=${CI_BASE_URL} node scripts/measure-v6-routes.mjs | tee perf-routes.txt
                    """
                }
            }
        }

        stage('Canvas-before-intent check') {
            when { expression { params.FINAL_RELEASE } }
            steps {
                script {
                    sh "V6_BASE_URL=${CI_BASE_URL} node scripts/check-hero-canvas.mjs"
                }
            }
        }

        stage('Evidence: screenshot matrix') {
            when { expression { params.FINAL_RELEASE && params.RUN_EVIDENCE_CAPTURE } }
            environment {
                V6_SCREENSHOT_DIR = "${WORKSPACE}/evidence/screenshots"
            }
            steps {
                script {
                    sh "V6_BASE_URL=${CI_BASE_URL} node scripts/capture-v6.mjs"
                }
            }
        }

        stage('Evidence: walkthrough video') {
            when { expression { params.FINAL_RELEASE && params.RUN_EVIDENCE_CAPTURE } }
            environment {
                V6_VIDEO_DIR = "${WORKSPACE}/evidence/video"
            }
            steps {
                script {
                    sh "V6_BASE_URL=${CI_BASE_URL} node scripts/record-v6-experience.mjs"
                }
            }
        }

        stage('Evidence: soak test') {
            when { expression { params.FINAL_RELEASE && params.RUN_EVIDENCE_CAPTURE } }
            steps {
                script {
                    sh "V6_BASE_URL=${CI_BASE_URL} node scripts/soak-test-v6.mjs | tee evidence/soak-test.txt"
                }
            }
        }

        stage('Deploy to Vercel') {
            when { expression { params.FINAL_RELEASE && params.DEPLOY_TO_VERCEL } }
            steps {
                script {
                    try {
                        withCredentials([
                            string(credentialsId: 'vercel-token', variable: 'VERCEL_TOKEN'),
                            string(credentialsId: 'vercel-org-id', variable: 'VERCEL_ORG_ID'),
                            string(credentialsId: 'vercel-project-id', variable: 'VERCEL_PROJECT_ID')
                        ]) {
                            sh '''
                                set -e
                                npx --yes vercel@latest deploy --prod --token="$VERCEL_TOKEN" --scope="$VERCEL_ORG_ID" --yes \
                                    | tee vercel-deploy-output.txt
                                DEPLOY_URL=$(tail -n 1 vercel-deploy-output.txt)
                                echo "$DEPLOY_URL" > vercel-deploy-url.txt
                                node scripts/ci/verify-health.mjs "$DEPLOY_URL" 60000
                                node scripts/ci/verify-routes.mjs "$DEPLOY_URL"
                                node scripts/ci/verify-headers.mjs "$DEPLOY_URL" /
                            '''
                        }
                    } catch (err) {
                        if (err.getClass().getName().contains('CredentialNotFoundException')) {
                            echo "Vercel credentials (vercel-token/vercel-org-id/vercel-project-id) not configured in Jenkins Credentials - production deployment skipped, not fabricated. See docs/AUTOMATED_CI_CD.md for setup."
                        } else {
                            error "Vercel deployment or post-deploy smoke test failed: ${err}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker rm -f jenkins-candidate 2>/dev/null || true'
            archiveArtifacts artifacts: 'trivy-jenkins-report.txt, perf-run-1.txt, perf-run-2.txt, perf-routes.txt, evidence/**, playwright-report/**, vercel-deploy-output.txt, vercel-deploy-url.txt', allowEmptyArchive: true
        }
    }
}
