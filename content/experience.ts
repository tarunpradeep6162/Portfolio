import type { ExperienceRole } from "./types";

/**
 * Uses the corrected timeline (Stackly, then Vaata Smart) per spec §7's
 * data-integrity note, not the outdated timeline from the source resume.
 * The Stackly role's achievements are genuinely unverified - rendered as
 * needs-input, never invented.
 */
export const experience: ExperienceRole[] = [
  {
    role: "Cloud Engineer",
    org: "Stackly",
    dates: "May 2026 - Present",
    location: "Chennai",
    achievements: {
      status: "needs-input",
      note: "Detailed responsibilities and verified achievements for this role have not been supplied yet.",
    },
  },
  {
    role: "Cloud Engineer / System Administrator",
    org: "Vaata Smart Private Limited",
    dates: "February 2024 - May 2026",
    achievements: {
      status: "ready",
      value: [
        "Resolved complex hardware and software issues, with 99% issue resolution within SLA timelines.",
        "Led a Google Workspace migration to improve collaboration and productivity.",
        "Configured and maintained printers and networks to reduce operational disruption.",
        "Drafted and enforced IT security policies.",
        "Conducted staff training to improve technology adoption.",
        "Worked with Amazon S3 Glacier storage and CloudBerry Explorer for backup file upload and download workflows.",
      ],
    },
  },
  {
    role: "Associate Systems Engineer",
    org: "Precision / SportsMechanics",
    dates: "September 2021 - February 2023",
    achievements: {
      status: "ready",
      value: [
        "Monitored system resource availability, troubleshot user accounts and system access, issued case tickets, and supported developers implementing internal systems.",
        "Provided emergency on-call support for network maintenance, system upgrades, service packs, patches, hot fixes, and security configurations after reviewing system and application logs.",
        "Installed and troubleshot hardware including SMPS, RAM, HDD, motherboards, processors, and operating systems.",
        "Configured Windows services and infrastructure including DNS, DHCP, and Active Directory Services.",
        "Configured router IP and MAC binding to mitigate ARP spoofing and prevent unauthorized devices from accessing the network.",
      ],
    },
  },
];
