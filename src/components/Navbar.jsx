import Link from "next/link";
import AccountMenu from "@/src/account/AccountMenu";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/avatar", label: "Avatar" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/community", label: "Community" },
];

export default function Navbar() {
  return (
    <header className="w-full bg-brand-cream border-b border-border-theme">
      <div className="mx-auto flex w-full max-w-[1900px] items-center justify-between px-6 py-4 md:px-12">
        {/* Logo - Far Left */}
        <Link
          href="/"
          className="flex items-center gap-1"
        >
          {/* Icon (Stays the same in both modes) */}
          <img
            src="/logo-icon.svg"
            alt="F.AVA AI Icon"
            className="h-10 w-10 transition-transform hover:scale-105"
          />

          {/* Light Mode Text Logo */}
          <img
            src="/logo-text.svg"
            alt="F.AVA AI"
            className="hidden h-15 w-auto -mt-3 md:block dark:hidden"
          />

          {/* Dark Mode Text Logo */}
          <img
            src="/logo-text-dark.svg"
            alt="F.AVA AI"
            className="hidden h-15 w-auto -mt-3 dark:md:block"
          />
        </Link>

        {/* Center Links */}
        <nav
          className="font-jakarta hidden items-center gap-15 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium text-foreground transition-colors hover:text-brand-mint"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Login Button - Far Right */}
        <AccountMenu />
      </div>
    </header>
  );
}
