import { useSiteSettings } from "../../context/SiteSettingsContext";
import lightProfileWebp from "../../assets/images/light-profile.webp";
import lightProfilePng from "../../assets/images/light-profile.png";
import "./Hero.css";

export default function Hero() {
  const settings = useSiteSettings();
  const { name, title } = settings;

  // Split the CMS-driven title into a two-line oversized headline —
  // first word bright, remainder dimmed — so editing Site Settings in
  // /admin still drives this without hardcoding copy here.
  const titleWords = title.trim().split(/\s+/).filter(Boolean);
  const headlineTop = titleWords[0] ?? "WEB3";
  const headlineBottom = titleWords.slice(1).join(" ") || "DEVELOPER";

  return (
    <section id="home" className="hero">
      <div className="hero__field" aria-hidden="true">
        <svg
          className="hero__field-svg"
          viewBox="0 0 800 700"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="hero-field-fade" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g fill="none" stroke="url(#hero-field-fade)" strokeWidth="1">
            {Array.from({ length: 22 }).map((_, i) => {
              const y = 40 + i * 28;
              const amp = 18 + (i % 5) * 6;
              const d = `M 60 ${y} C 260 ${y - amp}, 460 ${y + amp}, 760 ${y}`;
              return <path key={i} d={d} opacity={0.14 + (i % 4) * 0.05} />;
            })}
          </g>
          <g fill="currentColor" opacity="0.5">
            {Array.from({ length: 60 }).map((_, i) => {
              const cx = 80 + ((i * 53) % 680);
              const cy = 30 + ((i * 97) % 640);
              const r = (i % 3) + 0.6;
              return <circle key={i} cx={cx} cy={cy} r={r} />;
            })}
          </g>
        </svg>
        <div className="hero__field-fade" />
      </div>

      <div className="container hero__inner">
        <p className="hero__eyebrow mono-label">
          <span className="hero__availability-dot" aria-hidden="true" />
          Available for Web3 projects
        </p>

        <h1 className="hero__headline">
          <span className="hero__headline-line hero__headline-line--bright">
            {headlineTop}
          </span>
          <span className="hero__headline-line hero__headline-line--dim">
            {headlineBottom}
          </span>
        </h1>

        <div className="hero__meta">
          <p className="hero__meta-name">
            {name} <span aria-hidden="true">/</span> {title}
          </p>

          <div className="hero__meta-right">
            <div className="hero__tagline">
              <span className="hero__tagline-slashes" aria-hidden="true">
                //
              </span>
              I Build Web3 Products That Actually Ship.
            </div>

            <p className="hero__sub">
              Web3 websites, Telegram bots, mini apps, and community
              solutions built for real projects.
            </p>

            <div className="hero__socials">
              {settings.twitter && (
                <a
                  href={settings.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero__social-link"
                >
                  X (Twitter)
                </a>
              )}
              {settings.twitter && settings.telegram && (
                <span className="hero__social-divider" aria-hidden="true" />
              )}
              {settings.telegram && (
                <a
                  href={settings.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero__social-link"
                >
                  Telegram
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="hero__portrait-chip" aria-hidden="true">
          <picture>
            <source srcSet={lightProfileWebp} type="image/webp" />
            <img
              src={lightProfilePng}
              alt=""
              className="hero__portrait-img"
              width={120}
              height={120}
              loading="eager"
              decoding="async"
            />
          </picture>
        </div>

        <div className="hero__bottom">
          <a href="#projects" className="hero__explore">
            Explore My Work
            <span aria-hidden="true">↓</span>
          </a>

          <div className="hero__actions">
            <a href="#projects" className="btn btn-primary">
              View My Work
            </a>
            <a href="#contact" className="btn btn-ghost">
              Let's Work Together
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
