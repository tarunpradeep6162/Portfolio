import type { Project } from "./types";

/**
 * Facts transcribed verbatim from the spec (§9). Nothing here is invented -
 * screenshots and lab links that don't exist yet are Field<> "needs-input",
 * never a stock mockup or a fabricated URL.
 */
export const projects: Project[] = [
  {
    kind: "flagship",
    slug: "aws-ecr-java-delivery",
    title: "Container Delivery with Amazon ECR, IAM Roles and Jenkins",
    categories: ["Cloud", "DevOps"],
    spineStages: ["commit", "build", "test", "container", "cloud"],
    featured: true,
    summary:
      "A Java 21 service built with Maven, shipped as versioned Docker images through a private Amazon ECR registry, deployed to a second EC2 host with a pull-only IAM role, and published by a parameterised Jenkins pipeline.",
    context:
      "A Java application needed a complete, credential-safe delivery path: versioned images in a private registry, vulnerability scanning and retention controls on that registry, a deployment host that can only pull, and CI that publishes new versions without editing the pipeline.",
    responsibility:
      "Built the Maven/Docker packaging, created the private ECR repository, designed separate build/push and pull-only IAM roles, deployed version 1.1 on a second EC2 instance, configured scan-on-push and a lifecycle policy, and wrote the Jenkins pipeline that built and pushed version 1.2.",
    flow: "Git -> Maven Build -> Docker Build -> ECR Login -> ECR Push -> Scan on Push -> EC2 Pull and Run",
    implementationDecisions: [
      "EC2 instance roles instead of access keys: EC2-ECR-Build-Push-Role on the build/Jenkins host, AmazonEC2ContainerRegistryPullOnly on the deployment host - no AWS keys stored anywhere.",
      "Registry-level BASIC scanning with SCAN_ON_PUSH, so every pushed tag is checked automatically.",
      "A lifecycle policy that keeps the latest 5 images and expires the rest, so the registry can't grow unbounded.",
      "IMAGE_TAG as a Jenkins string parameter, validated against a version pattern before any build runs, so new versions need no Jenkinsfile change.",
      "APP_VERSION passed as a Docker build argument so each image reports the version it was built as.",
    ],
    toolsAndServices: [
      "Java 21",
      "Maven",
      "Docker",
      "Amazon ECR",
      "AWS IAM",
      "AWS EC2",
      "AWS CLI",
      "Jenkins",
    ],
    challengeAndResolution:
      "The first ECR commands failed with NoCredentials because the instance had no role attached yet. Rather than adding access keys, I attached the build/push role and confirmed the assumed role with aws sts get-caller-identity - then verified the Jenkins service account itself had Docker, role and ECR access before running the pipeline.",
    outcome:
      "Images 1.0 and 1.1 pushed manually, 1.1 pulled and running on a separate EC2 host, scan-on-push producing real findings (4 critical, 27 high on 1.1), a keep-latest-5 lifecycle policy, and Jenkins building and pushing 1.2 end to end.",
    links: [],
    screenshot: {
      status: "ready",
      value: {
        src: "/work/aws-ecr-java-delivery/architecture.webp",
        alt: "Architecture: a Jenkins build EC2 pushes to the private ECR repository team-java-app, and a deployment EC2 with a pull-only IAM role pulls and runs version 1.1.",
      },
    },
    evidence: [
      {
        src: "/work/aws-ecr-java-delivery/pipeline.webp",
        alt: "Pipeline stages: Checkout, Maven Build, Docker Build, ECR Login, Docker Tag, Docker Push.",
        caption: "The Jenkins pipeline - IMAGE_TAG selects the version with no Jenkinsfile edit.",
      },
      {
        src: "/work/aws-ecr-java-delivery/jenkins-image-tag.webp",
        alt: "Jenkins 'Build with Parameters' screen for team-java-app-ecr with IMAGE_TAG set to 1.2.",
        caption: "Build with Parameters: IMAGE_TAG = 1.2.",
      },
      {
        src: "/work/aws-ecr-java-delivery/ecr-tags.webp",
        alt: "aws ecr list-images output showing tags 1.0, 1.1 and 1.2 with their digests.",
        caption: "ECR holds 1.0, 1.1 and the Jenkins-built 1.2.",
      },
      {
        src: "/work/aws-ecr-java-delivery/scan-findings.webp",
        alt: "aws ecr describe-image-scan-findings output: 4 critical, 27 high, 28 medium, 13 low, 5 undefined.",
        caption: "Scan-on-push findings - actionable results, not a checkbox.",
      },
    ],
  },
  {
    kind: "flagship",
    slug: "jenkins-sonarqube-quality-gates",
    title: "SonarQube Quality Gates in Jenkins for Python and Node.js",
    categories: ["DevOps"],
    spineStages: ["commit", "build", "test", "container"],
    featured: true,
    summary:
      "Two CI pipelines - Python (pytest) and Node.js (Jest) - that test, measure coverage, run SonarQube analysis and only build and run the Docker image when the Quality Gate passes.",
    context:
      "Tests passing is not the same as code being fit to ship. The pipelines needed an enforced quality bar - coverage and duplication thresholds - that stops a build before anything gets containerised.",
    responsibility:
      "Set up SonarScanner CLI and the Jenkins SonarQube integration, stored analysis tokens as Jenkins credentials, wired the SonarQube webhook back to Jenkins, wrote both pipelines and Dockerfiles, created custom Quality Gates, and deliberately produced both passing and failing runs.",
    flow: "Git -> Tests and Coverage -> SonarScanner -> SonarQube -> Quality Gate -> Docker Build -> Docker Test",
    implementationDecisions: [
      "waitForQualityGate() as a hard stop: Gate OK continues to Docker; Gate ERROR fails the pipeline and the Docker stages are skipped.",
      "Coverage fed to SonarQube in each language's native format - coverage.xml (Cobertura) for Python, LCOV for Node.js.",
      "Custom gates: overall coverage below 80% or duplicated lines above 3% fails the build.",
      "SonarQube tokens stored only as Jenkins secret-text credentials (sonar-python-token, sonar-nodejs-token), never in the Jenkinsfile or repository.",
      "A SonarQube webhook to Jenkins (/sonarqube-webhook/) so the pipeline is told the gate result instead of polling for it.",
    ],
    toolsAndServices: [
      "Jenkins",
      "SonarQube",
      "SonarScanner CLI",
      "Python",
      "pytest",
      "Node.js",
      "Jest",
      "Docker",
      "AWS EC2",
    ],
    challengeAndResolution:
      "Proving the gate actually blocks was the point. I cut each test suite down to a single test so the tests still passed but coverage fell to 50% - SonarQube returned ERROR, Jenkins failed, and both Docker stages were skipped. Restoring the full suites brought coverage back to 100% and the gate back to OK. The Node.js analysis also needed its project key aligned exactly with the key SonarQube displayed.",
    outcome:
      "Both pipelines implemented end to end: tests, coverage, SonarQube analysis, webhook-driven Quality Gate, and Docker build/run only after a passing gate - demonstrated with both PASS and FAIL runs.",
    links: [
      { label: "Python repository", href: "https://github.com/tarunpradeep6162/python-sonarqube-jenkins" },
      { label: "Node.js repository", href: "https://github.com/tarunpradeep6162/nodejs-sonarqube-jenkins" },
    ],
    screenshot: {
      status: "ready",
      value: {
        src: "/work/jenkins-sonarqube-quality-gates/python-gate-passed.webp",
        alt: "Jenkins python-sonarqube-pipeline page showing the SonarQube Quality Gate as Passed.",
      },
    },
    evidence: [
      {
        src: "/work/jenkins-sonarqube-quality-gates/nodejs-gate-passed.webp",
        alt: "Jenkins nodejs-sonarqube-pipeline page showing the SonarQube Quality Gate as Passed, with an earlier failed build in history.",
        caption: "Node.js pipeline: gate Passed - and the deliberately failed build (#3) still in history.",
      },
      {
        src: "/work/jenkins-sonarqube-quality-gates/gate-conditions.webp",
        alt: "SonarQube custom Quality Gate conditions including coverage below 80% and duplicated lines above 3%.",
        caption: "The custom gate: coverage < 80% or duplication > 3% fails.",
      },
      {
        src: "/work/jenkins-sonarqube-quality-gates/credentials.webp",
        alt: "Jenkins credentials list showing sonar-python-token and sonar-nodejs-token.",
        caption: "Analysis tokens live in Jenkins credentials, not in code.",
      },
    ],
  },
  {
    kind: "flagship",
    slug: "project-aurora",
    title: "Project Aurora: Containerised Application on AWS EC2",
    featured: true,
    categories: ["Cloud", "DevOps"],
    spineStages: ["commit", "build", "container", "cloud"],
    summary:
      "A React/Vite frontend and supporting services, containerised with multi-stage Docker builds and deployed to AWS EC2.",
    context:
      "A React/Vite frontend needed a repeatable, production-style deployment path instead of a manual one-off setup.",
    responsibility:
      "Containerised the application, defined the service composition, and deployed and validated the stack on EC2.",
    flow: "Git -> Build -> Image -> Compose Network -> App/MySQL -> Nginx -> EC2",
    implementationDecisions: [
      "Multi-stage Docker builds to keep the production image lean.",
      "Nginx for production serving of the built frontend.",
      "Docker Compose for service networking, persistent volumes, and environment configuration.",
      "MySQL integration within the same Compose network.",
    ],
    toolsAndServices: [
      "React",
      "Vite",
      "Docker",
      "Docker Compose",
      "Nginx",
      "MySQL",
      "AWS EC2",
    ],
    challengeAndResolution:
      "Tested application updates, downtime behaviour, and redeployment approaches to confirm the stack could be updated without ad hoc manual steps.",
    outcome:
      "A repeatable container-based deployment on EC2, verified end to end from build through redeployment.",
    links: [
      {
        label: "Repository",
        href: "https://github.com/tarunpradeep6162/ProjectAurora/",
      },
    ],
    screenshot: {
      status: "needs-input",
      note: "No screenshot supplied yet for Project Aurora.",
    },
  },
  {
    kind: "flagship",
    slug: "distributed-jenkins-controller",
    title: "Distributed Jenkins Controller and Linux Build Agent",
    categories: ["DevOps", "Systems"],
    spineStages: ["commit", "build", "test"],
    summary:
      "Jenkins on Ubuntu with a dedicated Linux build agent connected over SSH, separating orchestration from build execution.",
    context:
      "A single Jenkins controller running builds directly does not scale and couples orchestration to execution.",
    responsibility:
      "Installed and configured Jenkins, connected a dedicated Linux agent over SSH, and configured credentials, labels, executors, and the remote working directory.",
    flow: "Commit -> Build (on agent) -> Test",
    implementationDecisions: [
      "Separated the Jenkins controller from build execution by routing jobs to a dedicated Linux agent.",
      "Configured SSH-based agent connection with scoped credentials.",
      "Set executor labels so jobs are pinned to the correct agent.",
    ],
    toolsAndServices: ["Jenkins", "Ubuntu", "SSH"],
    challengeAndResolution:
      "Verified pipeline execution actually ran on the agent rather than the controller, confirming the separation held under real jobs.",
    outcome:
      "Orchestration and build execution running on separate hosts, improving maintainability and giving a path to scale build capacity independently of the controller.",
    links: [],
    screenshot: {
      status: "needs-input",
      note: "No screenshot supplied yet for the Jenkins controller/agent setup.",
    },
  },
  {
    kind: "flagship",
    slug: "secure-aws-production-architecture",
    title: "Secure AWS Production Architecture",
    featured: true,
    categories: ["Cloud"],
    spineStages: ["network", "cloud", "observe", "recover"],
    summary:
      "An IAM, VPC, load-balanced compute, and RDS architecture designed around least privilege, tiered network access, and monitored recovery.",
    context:
      "A production-style AWS environment needed IAM, network, compute, database, and monitoring decisions made deliberately rather than defaulted.",
    responsibility:
      "Designed IAM users, groups, and roles under least privilege; the public/private VPC tiers and security groups; the ALB, compute tier, and RDS configuration; and the CloudWatch/SNS monitoring layer.",
    flow: "Network -> Cloud -> Observe -> Recover",
    implementationDecisions: [
      "Least-privilege IAM users, groups, and roles rather than broad standing permissions.",
      "Public and private VPC tiers with security groups scoped to actual traffic needs.",
      "Application Load Balancer in front of the compute tier.",
      "RDS engine selection with Multi-AZ availability, read replicas, encryption, and a defined backup/restore strategy.",
      "CloudWatch metrics and logs with alarms routed to SNS.",
    ],
    toolsAndServices: [
      "AWS IAM",
      "AWS VPC",
      "Application Load Balancer",
      "Amazon RDS",
      "CloudWatch",
      "SNS",
    ],
    challengeAndResolution:
      "Worked through RDS engine, Multi-AZ, and backup/restore tradeoffs, and validated that CloudWatch alarms actually fired to SNS as configured.",
    outcome:
      "A documented, security-and-recovery-aware AWS architecture with monitoring wired through to alerting.",
    links: [],
    screenshot: {
      status: "needs-input",
      note: "No architecture diagram screenshot supplied yet.",
    },
    labelNote:
      "Architecture / learning implementation, not used for a real production client.",
  },
  {
    kind: "flagship",
    slug: "nodejs-auth-mysql-rds",
    title: "Node.js Authentication Application with MySQL and Amazon RDS",
    categories: ["Cloud", "DevOps"],
    // Deliberately no "container" stage: this project's own flow ("Build ->
    // Container-free deploy -> Cloud (EC2 + RDS) -> Observe") and its real
    // toolsAndServices (no Docker anywhere) both confirm PM2-on-EC2 process
    // management, not a containerized deploy - the previous ["build",
    // "container", "cloud", "observe"] value contradicted the project's own
    // "Container-free deploy" text one field below it, and was corrected to
    // match the verified architecture rather than the other way around.
    spineStages: ["build", "cloud", "observe"],
    summary:
      "A Node.js/Express app on Ubuntu EC2 with bcrypt-hashed authentication against MySQL on Amazon RDS, managed by PM2.",
    context:
      "An authentication flow needed a real deployment target rather than running only in a local dev environment.",
    responsibility:
      "Deployed the Node.js/Express app on Ubuntu EC2, connected it to MySQL via mysql2/promise pooling, implemented bcrypt-based registration and login, and managed the process with PM2.",
    flow: "Build -> Container-free deploy -> Cloud (EC2 + RDS) -> Observe",
    implementationDecisions: [
      "mysql2/promise connection pooling instead of per-request connections.",
      "bcrypt password hashing for registration and login.",
      "Environment variables for database and session configuration.",
      "PM2 for process management on the EC2 instance.",
    ],
    toolsAndServices: [
      "Node.js",
      "Express",
      "MySQL",
      "Amazon RDS",
      "bcrypt",
      "PM2",
      "AWS EC2",
    ],
    challengeAndResolution:
      "Verified database connectivity, application response, registration, login, and stored records end to end after deployment.",
    outcome:
      "A working authentication application deployed and process-managed on EC2 against a managed RDS database.",
    links: [],
    screenshot: {
      status: "needs-input",
      note: "No screenshot supplied yet for the Node.js auth application.",
    },
  },
  {
    kind: "flagship",
    slug: "jenkins-ec2-control-multi-agent",
    title: "Jenkins EC2 Control and Multi-Agent Pipelines",
    categories: ["DevOps", "Cloud"],
    spineStages: ["build", "container", "cloud", "recover"],
    summary:
      "A parameterised Jenkins pipeline that starts, stops or restarts the DEV, QA or PROD EC2 instance through the AWS CLI, plus a pipeline that routes Docker and Maven work to dedicated, label-matched agents.",
    context:
      "Operators needed to control environment instances without console access or long-lived keys, and build workloads needed isolating so Docker and Maven jobs run on machines prepared for them.",
    responsibility:
      "Tagged the environment instances, attached an IAM role to the Jenkins controller, wrote the EC2 control pipeline with validation and before/after state reporting, provisioned docker-agent and maven-agent over SSH, and wrote the label-routed multi-agent pipeline.",
    flow: "Choose ENVIRONMENT and ACTION -> Validate -> Find by Tag -> AWS CLI Action -> State After -> Label-routed Agents",
    implementationDecisions: [
      "Instances are discovered by their Environment tag (DEV, QA, PROD) instead of hardcoded IDs.",
      "ENVIRONMENT and ACTION are choice parameters; nothing about the target or the action is hardcoded.",
      "Fail safe: no matching instance, more than one match, or an invalid parameter stops the pipeline before any action runs.",
      "aws ec2 wait instance-running / instance-stopped, so the reported 'after' state is the settled state.",
      "The controller authenticates through an EC2 IAM role (Jenkins-EC2-Control-Role) - no IAM user.",
      "agent none at pipeline level with per-stage labels: Docker stages on docker-agent, Maven stages on maven-agent.",
    ],
    toolsAndServices: ["Jenkins", "AWS CLI", "AWS EC2", "AWS IAM", "Docker", "Maven", "Java 21", "SSH"],
    challengeAndResolution:
      "Operating on the wrong instance is the real risk with automated stop/start. The pipeline refuses to act unless exactly one instance matches the selected tag, records the state before acting and prints a before/after summary - so every run is both safe and auditable.",
    outcome:
      "EC2 instances controlled per environment through Build with Parameters, and a multi-agent pipeline that ran each stage on the right agent: docker-agent = SUCCESS, maven-agent = SUCCESS.",
    links: [],
    screenshot: {
      status: "ready",
      value: {
        src: "/work/jenkins-ec2-control-multi-agent/multi-agent-success.webp",
        alt: "Jenkins console output for multi-agent-pipeline ending with MULTIPLE AGENT PIPELINE SUCCESSFUL, docker-agent = SUCCESS, maven-agent = SUCCESS.",
      },
    },
    evidence: [
      {
        src: "/work/jenkins-ec2-control-multi-agent/tagged-instances.webp",
        alt: "AWS EC2 console listing three t3.micro instances, two running and one stopped.",
        caption: "The three environment instances the control pipeline operates on.",
      },
      {
        src: "/work/jenkins-ec2-control-multi-agent/multi-agent-job.webp",
        alt: "Jenkins multi-agent-pipeline job page with a successful build.",
        caption: "The multi-agent pipeline job - first run green.",
      },
    ],
  },
  {
    kind: "flagship",
    slug: "jenkins-build-with-parameters",
    title: "Parameterised CI/CD for a Spring Boot Service",
    categories: ["DevOps"],
    spineStages: ["commit", "build", "test", "container"],
    summary:
      "One Jenkins pipeline that uses every parameter type - image tag, branch, run-tests and run-container switches, and target environment - to build a Spring Boot app and deploy it to DEV, QA or PROD.",
    context:
      "Editing a Jenkinsfile for every branch, tag or environment doesn't scale. The same pipeline needed to serve different branches and environments, with optional stages controlled at build time.",
    responsibility:
      "Prepared the Jenkins host (Docker access for the Jenkins user, swap on a small EC2 instance), set up master/develop/release branches, wrote the parameterised Jenkinsfile, and ran and documented four parameter combinations.",
    flow: "Parameters -> Branch Checkout -> Maven Test -> Maven Package -> Docker Build -> Environment Deploy -> Verify",
    implementationDecisions: [
      "String IMAGE_TAG, choice GIT_BRANCH (master/develop/release), booleans RUN_TESTS and RUN_CONTAINER, choice DEPLOY_ENV (DEV/QA/PROD) - every one used by the pipeline.",
      "Declarative when conditions skip Maven tests or container deployment instead of failing, so skipped stages are visible as skipped.",
      "Separate host ports per environment (DEV 8081, QA 8082, PROD 8083) so all three containers can run side by side.",
      "Parameter values printed at the start of every build (no secrets) for an auditable console log.",
      "A 1 GiB swap file on the small EC2 instance to keep Maven and Docker builds from being OOM-killed.",
    ],
    toolsAndServices: ["Jenkins", "Spring Boot", "Java 17", "Maven", "Docker", "Git", "AWS EC2"],
    challengeAndResolution:
      "On a low-memory EC2 instance, Jenkins, Maven and Docker builds compete for RAM. Adding swap and checking memory and disk before runs kept builds stable, and a fourth run (RUN_CONTAINER=false) proved the image still builds while every deployment stage is skipped.",
    outcome:
      "Four documented runs: dev-v1 from master to DEV with tests, qa-v2 from develop to QA with tests skipped, prod-v3 from release to PROD, and no-container-v4 building the image without deploying.",
    links: [{ label: "Repository", href: "https://github.com/tarunpradeep6162/gs-spring-boot-docker" }],
    screenshot: {
      status: "ready",
      value: {
        src: "/work/jenkins-build-with-parameters/parameter-console.webp",
        alt: "Jenkins console for build #3 printing the selected parameter values: IMAGE_TAG, GIT_BRANCH, RUN_TESTS, RUN_CONTAINER.",
      },
    },
    evidence: [
      {
        src: "/work/jenkins-build-with-parameters/branch-choice.webp",
        alt: "Jenkins job configuration: choice parameter GIT_BRANCH with master, develop and release.",
        caption: "GIT_BRANCH choice parameter.",
      },
      {
        src: "/work/jenkins-build-with-parameters/image-tag-string.webp",
        alt: "Jenkins job configuration: string parameter IMAGE_TAG with default v1.0.",
        caption: "IMAGE_TAG string parameter.",
      },
      {
        src: "/work/jenkins-build-with-parameters/jenkinsfile.webp",
        alt: "The declarative Jenkinsfile in the job configuration, starting with its parameters block.",
        caption: "The declarative pipeline and its parameters block.",
      },
    ],
  },
  {
    kind: "flagship",
    slug: "jenkins-docker-portfolio-deploy",
    title: "Deploying This Portfolio with Jenkins and Docker",
    categories: ["DevOps"],
    spineStages: ["commit", "build", "container", "cloud"],
    summary:
      "A Jenkins pipeline on EC2 that checks out this portfolio, builds it with its own multi-stage Dockerfile, replaces the running container and verifies the site responds.",
    context:
      "Deploying by hand meant repeating the same clone, build, stop and run commands every release. The goal was a repeatable pipeline that replaces the old release automatically.",
    responsibility:
      "Prepared the Jenkins controller and its Docker access, wrote the six-stage pipeline, mapped host port 8085 to the Next.js container's port 3500, and verified the deployment with docker ps, curl and a browser.",
    flow: "GitHub -> Jenkins Checkout -> Docker Build -> Remove Old Container -> Run Container -> Verify",
    implementationDecisions: [
      "Reused the repository's production multi-stage Dockerfile (Node 22 Alpine, npm ci, Next.js standalone output, non-root user, health check) instead of a generic one.",
      "docker rm -f ... || true, so the first deployment and every redeployment use the same pipeline.",
      "Host port 8085 mapped to container port 3500, with the security group scoped to the access actually needed.",
      "A verification stage (docker ps, then curl -I) so a deployment only counts as done when the site answers.",
    ],
    toolsAndServices: ["Jenkins", "Docker", "Next.js", "Node.js", "GitHub", "AWS EC2"],
    challengeAndResolution:
      "The classroom example generated a tiny Express Dockerfile, but this site is a Next.js app with its own hardened production image. Building with the repository's Dockerfile kept the deployed image identical to the one the project is designed to ship.",
    outcome:
      "A one-click Jenkins deployment: new image built, previous container replaced, and the portfolio serving from the EC2 host on port 8085.",
    links: [{ label: "Repository", href: "https://github.com/tarunpradeep6162/Portfolio" }],
    screenshot: {
      status: "ready",
      value: {
        src: "/work/jenkins-docker-portfolio-deploy/pipeline.webp",
        alt: "Completed Jenkins pipeline flow: Checkout, Check Files, Build Image, Remove Old, Run Container, Verify.",
      },
    },
    evidence: [
      {
        src: "/work/jenkins-docker-portfolio-deploy/architecture.webp",
        alt: "Deployment architecture: GitHub Portfolio repository to Jenkins Pipeline to Docker image to running container.",
        caption: "Source to running container.",
      },
      {
        src: "/work/jenkins-docker-portfolio-deploy/port-mapping.webp",
        alt: "Port mapping diagram: EC2 host port 8085 forwarded to the Next.js container's port 3500.",
        caption: "-p 8085:3500 - host to container.",
      },
      {
        src: "/work/jenkins-docker-portfolio-deploy/verification.webp",
        alt: "Deployment verification checklist: Jenkins build, Docker image, container, port mapping, HTTP test and browser test all passed.",
        caption: "Verification checklist - all six checks passed.",
      },
    ],
  },
  {
    kind: "lab",
    slug: "serverless-employee-api",
    title: "Serverless Employee API",
    categories: ["Cloud"],
    summary:
      "A serverless API built on Lambda, API Gateway, and DynamoDB, deployed via CodePipeline.",
    toolsAndServices: [
      "AWS Lambda",
      "API Gateway",
      "DynamoDB",
      "IAM",
      "Python",
      "CodeCommit",
      "CodePipeline",
    ],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "s3-static-website-cicd",
    title: "S3 Static Website CI/CD",
    categories: ["Cloud", "DevOps"],
    summary:
      "S3 static website hosting deployed via GitHub Actions, including an AWS region correction learned during troubleshooting.",
    toolsAndServices: ["Amazon S3", "GitHub Actions"],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "jenkins-persistence-docker-volumes",
    title: "Jenkins Persistence with Docker Volumes",
    categories: ["DevOps"],
    summary:
      "Removed and recreated a Jenkins container while preserving jobs, plugins, and configuration through a named Docker volume.",
    toolsAndServices: ["Jenkins", "Docker", "Docker Volumes"],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "vpc-networking-lab",
    title: "VPC Networking Lab",
    categories: ["Cloud", "Systems"],
    summary:
      "Public/private subnets, an Internet Gateway, a NAT Gateway, security groups, NACLs, and an S3 VPC endpoint.",
    toolsAndServices: [
      "AWS VPC",
      "Internet Gateway",
      "NAT Gateway",
      "Security Groups",
      "NACLs",
      "S3 VPC Endpoint",
    ],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "alb-auto-scaling-lab",
    title: "ALB and Auto Scaling Lab",
    categories: ["Cloud"],
    summary:
      "Apache instances behind a target group with health checks, an ALB, and Auto Scaling.",
    toolsAndServices: [
      "Apache",
      "Application Load Balancer",
      "Target Groups",
      "Auto Scaling",
    ],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "elastic-beanstalk-cicd",
    title: "Elastic Beanstalk CI/CD",
    categories: ["Cloud", "DevOps"],
    summary:
      "A PHP environment deployed on Elastic Beanstalk, connected to a pipeline workflow.",
    toolsAndServices: ["AWS Elastic Beanstalk", "PHP", "CI/CD Pipeline"],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "kubernetes-fundamentals",
    title: "Kubernetes Fundamentals",
    categories: ["Cloud", "Systems"],
    summary:
      "A kind cluster with a resolved Flannel networking issue, verified pods, and tested port forwarding.",
    toolsAndServices: ["Kubernetes", "kind", "Flannel"],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "cinematic-web-experience",
    title: "Cinematic Web Experience",
    categories: ["Creative Engineering"],
    summary:
      "A React/Vite/Three.js/R3F experience with Framer Motion and GSAP, automated testing, and a Vercel deployment.",
    toolsAndServices: [
      "React",
      "Vite",
      "Three.js",
      "React Three Fiber",
      "Framer Motion",
      "GSAP",
      "Vercel",
    ],
    links: {
      status: "needs-input",
      note: "Live URL withheld until confirmed that its personal content and access controls are appropriate for a professional portfolio.",
    },
  },
];
