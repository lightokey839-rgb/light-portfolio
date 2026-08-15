import { navLinks, socials } from "../../data/site";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="#home" className="footer__logo">
            LIGHT
          </a>
          <p className="footer__tagline">Web3 Developer &amp; Builder</p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="footer__socials">
          <a href={socials.x.url} target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a href={socials.telegram.url} target="_blank" rel="noopener noreferrer">
            Telegram
          </a>
          <a
            href={socials.telegramChannel.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram Channel
          </a>
        </div>
      </div>

      <div className="container">
        <p className="footer__copy">© 2026 LIGHT. Built with code &amp; curiosity.</p>
      </div>
    </footer>
  );
}
