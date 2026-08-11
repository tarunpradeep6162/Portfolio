import type { Certification } from "./types";

const noLink = { status: "needs-input", note: "No issuer link supplied yet." } as const;
const noId = { status: "needs-input", note: "No credential ID supplied yet." } as const;

/** Ordered most role-relevant first, per spec §7. */
export const certifications: Certification[] = [
  {
    name: "Microsoft Certified: Azure Administrator Associate",
    completed: "June 2026",
    issuerLink: noLink,
    credentialId: noId,
  },
  { name: "Google IT Support Certificate", issuerLink: noLink, credentialId: noId },
  { name: "Accenture Technology Consulting Virtual Experience Certificate", issuerLink: noLink, credentialId: noId },
  { name: "IBM Cognitive Class Certificate", issuerLink: noLink, credentialId: noId },
  { name: "Linux & Python Module for Cloud & DevOps", issuerLink: noLink, credentialId: noId },
  { name: "CCNA Network Essentials Course Student Certificate", issuerLink: noLink, credentialId: noId },
  { name: "Server Application & Virtualization Module for Cloud & DevOps", issuerLink: noLink, credentialId: noId },
  {
    name: "Data Migration & Resilience Module for Cloud & DevOps",
    completed: "March 2026",
    issuerLink: noLink,
    credentialId: noId,
  },
];
