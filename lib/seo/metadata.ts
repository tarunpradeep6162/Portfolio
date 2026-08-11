import { site } from "@/content/site";

/**
 * Hand-rolled Person JSON-LD (spec §17). No schema-dts dependency: the
 * shape is small and stable enough that a typed literal is simpler than
 * pulling in a schema-validation package for one object.
 */
export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: "Cloud Engineer and DevOps Professional",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    addressCountry: "IN",
  },
  email: `mailto:${site.email}`,
  url: site.url,
  sameAs: [site.github, site.linkedin],
} as const;
