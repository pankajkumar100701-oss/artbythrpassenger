import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSettings } from "@/lib/artworks";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { contact } = await getSettings();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader tagline={contact.tagline} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
