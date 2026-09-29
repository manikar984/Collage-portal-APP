import { PortalSection } from "@/components/portal-section";

export default function Page({ searchParams }: { searchParams?: { section?: string | string[] } }) {
  const raw = searchParams?.section;
  const section = (Array.isArray(raw) ? raw[0] : raw) || "home";
  return <PortalSection section={section} />;
}
