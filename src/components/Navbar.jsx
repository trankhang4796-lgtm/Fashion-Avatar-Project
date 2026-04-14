import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/avatar", label: "Avatar" },
  { href: "/wardrobe", label: "Wardrobe" },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__container">
        <nav className="navbar__links" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="navbar__link">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/login" className="navbar__button">
          Login / Sign Up
        </Link>
      </div>
    </header>
  );
}
