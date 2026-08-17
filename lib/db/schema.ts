// Database schema for portfolio/consulting business

export interface ConsultationRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  industry?: string;
  projectType: string;
  timeline: string;
  budget?: string;
  message: string;
  status: "new" | "contacted" | "scheduled" | "completed" | "closed";
  source: "form" | "chat" | "landing_page" | "email";
  consultationDate?: string;
  notes?: string;
  assignedTo?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  consultationId?: string;
  email: string;
  name: string;
  serviceType: string;
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  paymentMethod?: string;
  receiptUrl?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  consultationId?: string;
  email: string;
  name: string;
  serviceType: string;
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue";
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  author: string;
  tags: string[];
  category: string;
  status: "draft" | "published" | "archived";
  views: number;
  likes: number;
  featured: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: "subscribed" | "unsubscribed" | "bounced";
  preferences: {
    weekly: boolean;
    productUpdates: boolean;
    events: boolean;
  };
  engagementScore: number;
  lastEmailSentAt?: string;
  subscribedAt: string;
  unsubscribedAt?: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  templateId: string;
  subject: string;
  status: "sent" | "failed" | "bounced" | "opened" | "clicked";
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  errorMessage?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "admin" | "consultant" | "user";
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  userId?: string;
  referrer?: string;
  pageUrl: string;
  timestamp: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  type: "cta" | "pricing" | "hero" | "funnel" | "copy";
  status: "draft" | "active" | "completed";
  variants: {
    id: string;
    name: string;
    weight: number;
    conversions: number;
    views: number;
  }[];
  startDate: string;
  endDate?: string;
  winnerVariantId?: string;
  confidence?: number;
}

export interface ProjectRecord {
  id: string;
  consultationId: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed" | "archived";
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  deliverables: string[];
  milestones: {
    name: string;
    dueDate: string;
    completed: boolean;
  }[];
  clientFeedback?: string;
  caseStudyPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceDownload {
  id: string;
  resourceId: string;
  email: string;
  name?: string;
  source: string;
  downloadedAt: string;
}
