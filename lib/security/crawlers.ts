/**
 * Crawler policy, in one place so robots.txt and the firewall runbook
 * (docs/security/FIREWALL.md) stay in sync.
 *
 * robots.txt is a published preference, not an access control: compliant
 * crawlers honour it, others ignore it, and user agents can be spoofed.
 * Enforcement for verified bots is Vercel Firewall's "AI Bots" managed
 * rule. Neither stops a person from opening the public site in a browser
 * or pasting it into an AI assistant.
 */

/**
 * Tokens of crawlers that collect content for AI model training or AI
 * datasets (documented by their operators). Google-Extended and
 * Applebot-Extended are robots.txt-only tokens: they opt the site out of
 * AI training without affecting Google/Apple search crawling.
 */
export const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Meta-ExternalAgent",
  "meta-externalagent",
  "FacebookBot",
  "PerplexityBot",
  "cohere-ai",
  "cohere-training-data-crawler",
  "Diffbot",
  "AI2Bot",
  "Ai2Bot-Dolma",
  "Omgilibot",
  "Timpibot",
  "ImagesiftBot",
  "Amazonbot",
  "YouBot",
] as const;

/**
 * Explicitly allowed: search engines and link-preview fetchers recruiters
 * rely on when a portfolio link is shared. Listed for documentation and the
 * firewall bypass list; robots.txt already allows everyone else.
 */
export const ALLOWED_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "YandexBot",
  "LinkedInBot",
  "Twitterbot",
  "facebookexternalhit",
  "Slackbot",
  "Discordbot",
  "WhatsApp",
] as const;
