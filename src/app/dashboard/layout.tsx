import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "F.AVA AI | Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] overflow-y-auto lg:overflow-hidden relative">
      {children}
    </div>
  );
}
