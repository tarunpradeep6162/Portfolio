import type { Project } from "./types";

/**
 * Facts transcribed verbatim from the spec (§9). Nothing here is invented -
 * screenshots and lab links that don't exist yet are Field<> "needs-input",
 * never a stock mockup or a fabricated URL.
 */
export const projects: Project[] = [
  {
    kind: "flagship",
    slug: "project-aurora",
    title: "Project Aurora: Containerised Application on AWS EC2",
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
    toolsAndServices: ["React", "Vite", "Docker", "Docker Compose", "Nginx", "MySQL", "AWS EC2"],
    challengeAndResolution:
      "Tested application updates, downtime behaviour, and redeployment approaches to confirm the stack could be updated without ad hoc manual steps.",
    outcome:
      "A repeatable container-based deployment on EC2, verified end to end from build through redeployment.",
    links: [{ label: "Repository", href: "https://github.com/tarunpradeep6162/ProjectAurora/" }],
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
    toolsAndServices: ["AWS IAM", "AWS VPC", "Application Load Balancer", "Amazon RDS", "CloudWatch", "SNS"],
    challengeAndResolution:
      "Worked through RDS engine, Multi-AZ, and backup/restore tradeoffs, and validated that CloudWatch alarms actually fired to SNS as configured.",
    outcome:
      "A documented, security-and-recovery-aware AWS architecture with monitoring wired through to alerting.",
    links: [],
    screenshot: {
      status: "needs-input",
      note: "No architecture diagram screenshot supplied yet.",
    },
    labelNote: "Architecture / learning implementation, not used for a real production client.",
  },
  {
    kind: "flagship",
    slug: "nodejs-auth-mysql-rds",
    title: "Node.js Authentication Application with MySQL and Amazon RDS",
    categories: ["Cloud", "DevOps"],
    spineStages: ["build", "container", "cloud", "observe"],
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
    toolsAndServices: ["Node.js", "Express", "MySQL", "Amazon RDS", "bcrypt", "PM2", "AWS EC2"],
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
    kind: "lab",
    slug: "serverless-employee-api",
    title: "Serverless Employee API",
    categories: ["Cloud"],
    summary: "A serverless API built on Lambda, API Gateway, and DynamoDB, deployed via CodePipeline.",
    toolsAndServices: ["AWS Lambda", "API Gateway", "DynamoDB", "IAM", "Python", "CodeCommit", "CodePipeline"],
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
    toolsAndServices: ["AWS VPC", "Internet Gateway", "NAT Gateway", "Security Groups", "NACLs", "S3 VPC Endpoint"],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "alb-auto-scaling-lab",
    title: "ALB and Auto Scaling Lab",
    categories: ["Cloud"],
    summary: "Apache instances behind a target group with health checks, an ALB, and Auto Scaling.",
    toolsAndServices: ["Apache", "Application Load Balancer", "Target Groups", "Auto Scaling"],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "elastic-beanstalk-cicd",
    title: "Elastic Beanstalk CI/CD",
    categories: ["Cloud", "DevOps"],
    summary: "A PHP environment deployed on Elastic Beanstalk, connected to a pipeline workflow.",
    toolsAndServices: ["AWS Elastic Beanstalk", "PHP", "CI/CD Pipeline"],
    links: { status: "needs-input", note: "No repository link supplied yet." },
  },
  {
    kind: "lab",
    slug: "kubernetes-fundamentals",
    title: "Kubernetes Fundamentals",
    categories: ["Cloud", "Systems"],
    summary: "A kind cluster with a resolved Flannel networking issue, verified pods, and tested port forwarding.",
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
    toolsAndServices: ["React", "Vite", "Three.js", "React Three Fiber", "Framer Motion", "GSAP", "Vercel"],
    links: {
      status: "needs-input",
      note:
        "Live URL withheld until confirmed that its personal content and access controls are appropriate for a professional portfolio.",
    },
  },
];
