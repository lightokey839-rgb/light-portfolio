import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { navLinks } from "../../data/site";
import { useScrolled } from "../../hooks/useScrolled";
import { useTheme } from "../../context/ThemeContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import "./Navbar.css";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled(20);
  const { theme, toggleTheme } = useTheme();
  const settings = useSiteSettings();
  const location = useLocation();

  // lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // close the mobile menu automatically on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLinkClick = () => setMenuOpen(false);

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__float">
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo" aria-label={`${settings.name} — home`}>
            {settings.name}
          </Link>

          <nav className="navbar__links" aria-label="Primary">
            {navLinks.map((link) => {
              const active = isActivePath(location.pathname, link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`navbar__link ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="navbar__actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} className="navbar__theme-toggle" />
            <Link to="/contact" className="btn btn-primary btn-sm navbar__cta">
              Let's Build
            </Link>
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
      </div>

      <div id="mobile-menu" className={`navbar__mobile ${menuOpen ? "is-open" : ""}`}>
        <nav className="navbar__mobile-links" aria-label="Mobile">
          {navLinks.map((link, i) => {
            const active = isActivePath(location.pathname, link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={handleLinkClick}
                style={{ transitionDelay: `${i * 40}ms` }}
                className={active ? "is-active" : ""}
                aria-current={active ? "page" : undefined}
              >
                <span className="navbar__mobile-index">{String(i + 1).padStart(2, "0")}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="navbar__mobile-footer">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <Link to="/contact" className="btn btn-primary" onClick={handleLinkClick}>
            Let's Build
          </Link>
        </div>
      </div>
    </header>
  );
}
