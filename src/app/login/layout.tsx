import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "F.AVA AI | Login / Sign Up",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
