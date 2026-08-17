export function generateArticleSchema(article: {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: article.author
      ? {
          "@type": "Person",
          name: article.author,
        }
      : undefined,
    url: article.url,
  };
}

export function generatePersonSchema(person: {
  name: string;
  description: string;
  image: string;
  url: string;
  email: string;
  sameAs: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    description: person.description,
    image: person.image,
    url: person.url,
    email: person.email,
    sameAs: person.sameAs,
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateOrganizationSchema(org: {
  name: string;
  logo: string;
  url: string;
  description: string;
  sameAs: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    logo: org.logo,
    url: org.url,
    description: org.description,
    sameAs: org.sameAs,
  };
}
