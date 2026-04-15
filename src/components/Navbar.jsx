import Link from "next/link";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/avatar", label: "Avatar" },
  { href: "/wardrobe", label: "Wardrobe" },
];

export default function Navbar() {
  return (
    <header className="w-full bg-cream border-b border-slate-200">
      <div className="mx-auto flex w-full max-w-[1900px] items-center justify-between px-6 py-4 md:px-12">
        {/* Logo - Far Left */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <img
            src="/logo-icon.svg"
            alt="F.AVA AI Icon"
            className="h-10 w-10 transition-transform hover:scale-105"
          />
          <img
            src="/logo-text.svg"
            alt="F.AVA AI"
            className="hidden h-10 w-auto md:block"
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
              className="text-base font-medium text-slate-700 transition-colors hover:text-brand-mint"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Login Button - Far Right */}
        <Link
          href="/login"
          className="font-jakarta rounded-lg bg-brand-mint px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-forest"
        >
          Login / Sign Up
        </Link>
      </div>
    </header>
  );
}
