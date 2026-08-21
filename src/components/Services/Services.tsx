import { useEffect, useState } from "react";
import { listServices } from "../../lib/api/services";
import type { Service } from "../../lib/api/types";
import ScrollReveal from "../ScrollReveal/ScrollReveal";
import "./Services.css";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let cancelled = false;

    listServices()
      .then(({ services }) => {
        if (!cancelled) setServices(services);
      })
      .catch((err) => {
        // A failed fetch here just means an empty section, not a broken
        // page — the rest of the portfolio doesn't depend on this content.
        console.error("Failed to load services:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="services" className="section services">
      <div className="container">
        <div className="section-head-row">
          <ScrollReveal>
            <p className="eyebrow">What I Build</p>
            <h2 className="section-heading">
              Four kinds of builds, one focus: things that actually work.
            </h2>
          </ScrollReveal>
        </div>

        <div className="services__list">
          {services.map((service, i) => (
            <ScrollReveal key={service.id} delay={i * 70} className="service-row" as="div">
              <span className="service-row__index big-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="service-row__body">
                <h3 className="service-row__title">{service.title}</h3>
                <p className="service-row__desc">{service.description}</p>
              </div>
              <span className="service-row__icon" aria-hidden="true">
                {service.icon}
              </span>
              <span className="service-row__arrow" aria-hidden="true">
                →
              </span>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
