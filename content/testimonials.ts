export interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
  project?: string;
  metrics?: string;
  featured?: boolean;
}

export const testimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "Engineering Director",
    company: "TechCorp",
    content:
      "Working with Tarun on our cloud infrastructure migration was transformative. Their expertise in DevOps and systems architecture helped us reduce deployment time by 60% while improving reliability.",
    rating: 5,
    project: "Kubernetes Migration",
    metrics: "60% faster deployments, 99.95% uptime",
    featured: true,
  },
  {
    name: "Michael Chen",
    role: "CTO",
    company: "StartupXYZ",
    content:
      "Tarun's ability to architect scalable solutions and communicate complex technical concepts made them invaluable during our scaling phase. Highly recommend for any infrastructure-heavy project.",
    rating: 5,
    project: "Infrastructure Design",
    metrics: "Scaled from 10k to 1M requests/day",
    featured: true,
  },
  {
    name: "Emily Rodriguez",
    role: "Product Manager",
    company: "DataFlow",
    content:
      "The automation solutions Tarun implemented saved our team hundreds of hours annually. Their attention to detail and focus on reliability excellence set a new standard for our operations.",
    rating: 5,
    project: "DevOps Automation",
    metrics: "95% manual work eliminated",
    featured: true,
  },
  {
    name: "David Kim",
    role: "VP Engineering",
    company: "CloudSystems",
    content:
      "Exceptional problem-solver with deep knowledge of distributed systems. Tarun's contributions to our Kubernetes infrastructure have been critical to our success.",
    rating: 5,
    project: "Container Orchestration",
    metrics: "40% cost reduction",
    featured: true,
  },
  {
    name: "Jessica Martinez",
    role: "Chief Technology Officer",
    company: "FinanceFlow",
    content:
      "Tarun brought order to our chaotic infrastructure. The IaC implementation and observability setup transformed how we operate. Professional, thorough, and results-driven.",
    rating: 5,
    project: "Infrastructure as Code",
    metrics: "100% config consistency",
    featured: false,
  },
  {
    name: "Alex Wong",
    role: "DevOps Lead",
    company: "TravelTech",
    content:
      "Best investment we made was getting Tarun's expertise. The CI/CD pipeline they set up is rock solid. Our deployment confidence has never been higher.",
    rating: 5,
    project: "CI/CD Pipeline",
    metrics: "15 min deployments, 99.95% success rate",
    featured: false,
  },
  {
    name: "Rachel Foster",
    role: "Infrastructure Manager",
    company: "RetailPro",
    content:
      "Tarun went beyond the scope to ensure everything was bulletproof. The level of care taken in security hardening and disaster recovery planning is unmatched.",
    rating: 5,
    project: "Security & Disaster Recovery",
    metrics: "Zero security incidents, RTO < 15min",
    featured: false,
  },
  {
    name: "Marcus Johnson",
    role: "Principal Engineer",
    company: "EdTech Solutions",
    content:
      "Working with a true systems expert. Tarun's knowledge of production patterns and architectural decisions elevated our entire platform. Highly recommend.",
    rating: 5,
    project: "System Architecture",
    metrics: "Handled 10x traffic growth",
    featured: false,
  },
];
