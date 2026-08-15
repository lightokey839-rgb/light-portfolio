import { useEffect, useState } from "react";
import { navLinks } from "../../data/site";
import { useActiveSection } from "../../hooks/useActiveSection";
import { useScrolled } from "../../hooks/useScrolled";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import "./Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled(20);
  const activeId = useActiveSection(navLinks.map((l) => l.href.replace("#", "")));

  // lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLinkClick = () => setMenuOpen(false);

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        <a href="#home" className="navbar__logo" aria-label="LIGHT — home">
          LIGHT
        </a>

        <nav className="navbar__links" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`navbar__link ${
                activeId === link.href.replace("#", "") ? "is-active" : ""
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar__actions">
          <ThemeToggle className="navbar__theme-toggle" />
          <a href="#contact" className="btn btn-primary btn-sm navbar__cta">
            Let's Build
          </a>
          <button
            type="button"
            className={`navbar__toggle ${menuOpen ? "is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`navbar__mobile ${menuOpen ? "is-open" : ""}`}
      >
        <nav className="navbar__mobile-links" aria-label="Mobile">
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              style={{ transitionDelay: `${i * 40}ms` }}
              className={activeId === link.href.replace("#", "") ? "is-active" : ""}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="navbar__mobile-footer">
          <ThemeToggle />
          <a href="#contact" className="btn btn-primary" onClick={handleLinkClick}>
            Let's Build
          </a>
        </div>
      </div>
    </header>
  );
}
