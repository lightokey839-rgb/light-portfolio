import { useEffect, useState } from "react";
import { socials } from "../../data/site";
import { getSettings } from "../../lib/api/settings";
import lightProfileWebp from "../../assets/images/light-profile.webp";
import lightProfilePng from "../../assets/images/light-profile.png";
import "./Hero.css";

// Matches the seeded SiteSettings values, so there's no visible flash from
// fallback -> fetched text for a fresh install — only an admin who's
// actually edited these in /admin/settings will see something different.
const FALLBACK_NAME = "LIGHT";
const FALLBACK_TITLE = "Web3 Developer & Builder";

export default function Hero() {
  const [name, setName] = useState(FALLBACK_NAME);
  const [title, setTitle] = useState(FALLBACK_TITLE);

  useEffect(() => {
    let cancelled = false;

    getSettings()
      .then(({ settings }) => {
        if (cancelled) return;
        if (settings.name) setName(settings.name);
        if (settings.title) setTitle(settings.title);
      })
      .catch((err) => {
        console.error("Failed to load site settings:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="home" className="hero">
      <div className="hero__ambient" aria-hidden="true">
        <span className="hero__ambient-blob hero__ambient-blob--a" />
        <span className="hero__ambient-blob hero__ambient-blob--b" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <p className="eyebrow">Available for new projects</p>

          <h1 className="hero__name">{name}</h1>
          <p className="hero__title">{title}</p>

          <p className="hero__headline">
            I build websites, Telegram bots &amp; Mini Apps for Web3 projects.
          </p>

          <p className="hero__sub">
            Building practical Web3 products with a focus on clean interfaces,
            useful functionality, automation, and community growth.
          </p>

          <div className="hero__actions">
            <a href="#projects" className="btn btn-primary">
              View Projects
            </a>
            <a href="#contact" className="btn btn-ghost">
              Contact Me
            </a>
          </div>

          <div className="hero__socials">
            <a
              href={socials.x.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hero__social-link"
            >
              {socials.x.label}
            </a>
            <span className="hero__social-divider" aria-hidden="true" />
            <a
              href={socials.telegram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hero__social-link"
            >
              {socials.telegram.label}
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__portrait-wrap">
            <div className="hero__portrait-glow" aria-hidden="true" />
            <span className="hero__frame-corner hero__frame-corner--tl" aria-hidden="true" />
            <span className="hero__frame-corner hero__frame-corner--tr" aria-hidden="true" />
            <span className="hero__frame-corner hero__frame-corner--bl" aria-hidden="true" />
            <span className="hero__frame-corner hero__frame-corner--br" aria-hidden="true" />

            <div className="hero__portrait-frame">
              <picture>
                <source srcSet={lightProfileWebp} type="image/webp" />
                <img
                  src={lightProfilePng}
                  alt="Portrait of LIGHT, a Web3 developer, working among multiple monitors at night"
                  className="hero__portrait-img"
                  width={960}
                  height={960}
                  loading="eager"
                  decoding="async"
                />
              </picture>
            </div>

            <div className="hero__chip glass">
              <span className="hero__chip-dot" aria-hidden="true" />
              Web3 · Bots · Mini Apps
            </div>
          </div>
        </div>
      </div>

      <a href="#about" className="hero__scroll-cue" aria-label="Scroll to About section">
        <span />
      </a>
    </section>
  );
}
