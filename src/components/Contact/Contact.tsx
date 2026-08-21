import { useState, type FormEvent } from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { sendContactMessage } from "../../lib/api/messages";
import { ApiError } from "../../lib/api/client";
import ScrollReveal from "../ScrollReveal/ScrollReveal";
import "./Contact.css";

export default function Contact() {
  const settings = useSiteSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // Hidden from real visitors via CSS — see .contact__honeypot. A filled
  // value means whatever submitted this almost certainly isn't a person.
  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await sendContactMessage({
        name,
        email,
        subject: subject.trim() || undefined,
        message,
        website: website || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setFormError("Too many messages sent from here — please try again in a few minutes.");
      } else {
        setFormError("Something went wrong sending that — please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section contact">
      <div className="container">
        <ScrollReveal className="contact__panel">
          <p className="eyebrow">04 / Contact</p>
          <h2 className="contact__headline">
            <span>Let's Build</span>
            <span className="contact__headline-dim">Something Useful.</span>
          </h2>
          <p className="contact__sub">Tell me what you're working on and let's talk.</p>

          <div className="contact__actions">
            {settings.telegram ? (
              <a
                href={settings.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Contact Me
              </a>
            ) : settings.email ? (
              <a href={`mailto:${settings.email}`} className="btn btn-primary">
                Email Me
              </a>
            ) : null}
            <a href="#projects" className="btn btn-ghost">
              View Projects
            </a>
          </div>

          {(settings.telegram || settings.email || settings.github) && (
            <ul className="contact__channels">
              {settings.telegram && (
                <li>
                  <a href={settings.telegram} target="_blank" rel="noopener noreferrer">
                    Telegram ↗
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              )}
              {settings.github && (
                <li>
                  <a href={settings.github} target="_blank" rel="noopener noreferrer">
                    GitHub ↗
                  </a>
                </li>
              )}
            </ul>
          )}

          <div className="contact__divider">
            <span>or send a message</span>
          </div>

          {submitted ? (
            <p className="contact__success">
              Thanks — your message is in. I'll get back to you soon.
            </p>
          ) : (
            <form className="contact__form" onSubmit={handleSubmit}>
              {formError && (
                <p className="contact__error" role="alert">
                  {formError}
                </p>
              )}

              <div className="contact__form-row">
                <label className="contact__field">
                  <span>Name</span>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </label>

                <label className="contact__field">
                  <span>Email</span>
                  <input
                    type="email"
                    required
                    maxLength={200}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
              </div>

              <label className="contact__field">
                <span>Subject (optional)</span>
                <input
                  type="text"
                  maxLength={200}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </label>

              <label className="contact__field">
                <span>Message</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              <div className="contact__honeypot" aria-hidden="true">
                <label>
                  Company
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}
