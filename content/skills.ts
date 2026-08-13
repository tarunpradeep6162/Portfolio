export interface SkillDomain {
  domain: string;
  items: string[];
}

/**
 * Grouped by engineering domain, not scored (spec §8: no percentage bars,
 * star ratings, "expert" labels, or unverified years of experience).
 */
export const skillDomains: SkillDomain[] = [
  {
    domain: "Cloud platforms",
    items: [
      "AWS EC2",
      "AWS S3",
      "AWS IAM",
      "AWS VPC",
      "AWS ALB",
      "AWS Auto Scaling",
      "AWS RDS",
      "AWS Route 53",
      "AWS Elastic Beanstalk",
      "AWS Lambda",
      "AWS API Gateway",
      "AWS DynamoDB",
      "AWS CloudWatch",
      "AWS SNS",
      "AWS CodePipeline",
      "AWS CodeCommit",
      "Microsoft Azure administration",
    ],
  },
  {
    domain: "DevOps and delivery",
    items: [
      "Jenkins",
      "GitHub Actions",
      "Docker",
      "Docker Compose",
      "Git and GitHub",
      "CI/CD pipeline design",
      "Trivy image scanning",
      "Nginx",
      "PM2",
    ],
  },
  {
    domain: "Systems and networking",
    items: [
      "Linux and Ubuntu administration",
      "Windows administration",
      "DNS, DHCP, and Active Directory Services",
      "Router configuration",
      "IP and MAC binding",
      "FortiGate firewall",
      "Office 365 and Google Workspace",
      "Synology NAS",
      "Virtualization",
      "Level-2 network support",
    ],
  },
  {
    domain: "Application and data",
    items: [
      "Node.js and Express deployment",
      "Python application deployment",
      "MySQL and MSSQL",
      "React, Vite, and Tailwind CSS",
      "Kubernetes fundamentals (kind)",
    ],
  },
  {
    domain: "Engineering practice",
    items: [
      "Monitoring and logging",
      "Incident troubleshooting",
      "Security policy documentation",
      "Data migration",
      "Backup and recovery workflows",
      "Technical reporting and documentation",
    ],
  },
];
