export interface CaseStudy {
  slug: string;
  title: string;
  description: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
    icon: string;
  }[];
  technologies: string[];
  timeline: string;
  client?: string;
  featured: boolean;
  image?: string;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "kubernetes-migration",
    title: "Enterprise Kubernetes Migration",
    description:
      "Led migration of monolithic architecture to Kubernetes, reducing infrastructure costs by 40% and improving deployment frequency.",
    challenge:
      "Legacy application running on VMs with manual deployments taking 4+ hours per release. High operational overhead and scaling limitations.",
    solution:
      "Designed and implemented containerized microservices architecture using Kubernetes. Established CI/CD pipeline with GitOps workflows. Implemented observability stack with Prometheus and ELK.",
    results: [
      { metric: "Cost Reduction", value: "40%", icon: "TrendingDown" },
      { metric: "Deployment Time", value: "4h → 15min", icon: "Zap" },
      { metric: "Uptime SLA", value: "99.95%", icon: "Check" },
      { metric: "Team Velocity", value: "+65%", icon: "Rocket" },
    ],
    technologies: [
      "Kubernetes",
      "Docker",
      "Helm",
      "GitLab CI",
      "Prometheus",
      "ELK Stack",
    ],
    timeline: "6 months",
    client: "Enterprise Tech Company",
    featured: true,
  },
  {
    slug: "devops-automation",
    title: "DevOps Automation & Infrastructure as Code",
    description:
      "Implemented Infrastructure as Code reducing manual configuration by 95% and enabling repeatable deployments across AWS.",
    challenge:
      "Manual infrastructure provisioning prone to human error. No version control for infrastructure. Difficult disaster recovery.",
    solution:
      "Implemented Terraform for infrastructure management. Created reusable modules for common patterns. Automated disaster recovery with automated backups and failover testing.",
    results: [
      { metric: "Manual Work", value: "-95%", icon: "Zap" },
      { metric: "Recovery Time", value: "2h → 15min", icon: "Clock" },
      { metric: "Config Consistency", value: "100%", icon: "Check" },
      { metric: "Infrastructure Errors", value: "-98%", icon: "TrendingDown" },
    ],
    technologies: ["Terraform", "AWS", "Python", "Ansible", "GitOps"],
    timeline: "3 months",
    client: "SaaS Startup",
    featured: true,
  },
];
