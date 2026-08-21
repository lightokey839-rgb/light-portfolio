import { Link } from "react-router-dom";
import { socials } from "../../data/site";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import "./Footer.css";

export default function Footer() {
  const settings = useSiteSettings();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/#home" className="footer__logo">
            {settings.name}
          </Link>
          <p className="footer__tagline">{settings.title}</p>
        </div>

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
