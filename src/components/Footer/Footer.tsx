import { Link } from "react-router-dom";
import { navLinks, socials } from "../../data/site";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import MagneticButton from "../shared/MagneticButton";
import "./Footer.css";

export default function Footer() {
  const settings = useSiteSettings();

  return (
    <footer className="footer">
      <div className="container footer__cta">
        <p className="eyebrow">Get in touch</p>
        <h2 className="footer__cta-heading">
          Have a Web3 product to <span className="text-accent">build</span>?
        </h2>
        <MagneticButton>
          <Link to="/contact" className="btn btn-primary footer__cta-btn">
            Start a conversation →
          </Link>
        </MagneticButton>
      </div>

      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            {settings.name}
          </Link>
          <p className="footer__tagline">{settings.title}</p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="footer__socials">
          {settings.twitter && (
            <a href={settings.twitter} target="_blank" rel="noopener noreferrer">
              X
            </a>
          )}
          {settings.telegram && (
            <a href={settings.telegram} target="_blank" rel="noopener noreferrer">
              Telegram
            </a>
          )}
          {settings.github && (
            <a href={settings.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          )}
          {/* No CMS field for this one — a secondary/bonus link, not a
              core contact channel, so it stays static. */}
          <a href={socials.telegramChannel.url} target="_blank" rel="noopener noreferrer">
            Telegram Channel
          </a>
        </div>
      </div>

      <div className="container">
        <p className="footer__copy">© 2026 {settings.name}. Built with code &amp; curiosity.</p>
      </div>
    </footer>
  );
}
