import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "F.AVA AI | Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
