import type { Site, SocialObjects } from "./types";

// Set SITE_URL when the hosting address is known. Local builds omit canonical URLs.
const website = import.meta.env.SITE_URL || "http://localhost:4321/";
export const SITE: Site = {
  domain: new URL(website).hostname,
  website,
  baseUrl: "/",
  author: "Kevin Zheng, Yue Zhang and Jingjin Yu",
  desc: "A half-day hands-on MAPF lab at AAAI 2027: explore path planning, robot motion, task scheduling and execution uncertainty.",
  title: "Hands-on Multi-Agent Path Finding and Emerging Trends",
  ogImage: "images/landing-social-preview.jpg",
  lightAndDarkMode: true,
  postPerPage: 10,
  scheduledPostMargin: 15 * 60 * 1000,
};
export const LOCALE = { lang: "en", langTag: [] } as const;
export const LOGO_IMAGE = { enable: false, svg: true, width: 144, height: 16 };
export const SOCIALS: SocialObjects = [];
