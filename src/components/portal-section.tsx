import { StudentPortal } from "@/components/student-portal";

export function PortalSection({ section }: { section: string }) {
  return <StudentPortal initialSection={section} />;
}
