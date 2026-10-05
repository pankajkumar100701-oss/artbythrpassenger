// Fixed brand details. Copy the host can change (tagline, contact, About, Letters, Book)
// lives in content/site.json and is edited from Studio → Site content.

export const site = {
  name: "Art by the Passenger",
  url: "https://www.artbythepassenger.com",
  artist: "Bao Han",
  owner: "Restless Monks Private Limited",
};

export const nav = [
  { href: "/gallery", label: "Gallery" },
  { href: "/who-i-am", label: "Who I Am" },
  { href: "/letters", label: "Letters" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

export const legalNav = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export const portrait = { src: "/profile/han-portrait.webp", width: 516, height: 868 };

/** Builds a /contact link with the subject pre-filled. */
export const contactHref = (subject: string) => `/contact?subject=${encodeURIComponent(subject)}`;

/** "@handle" from an Instagram profile URL, for display. */
export const instagramHandle = (url: string) => `@${url.replace(/\/+$/, "").split("/").pop() ?? ""}`;
