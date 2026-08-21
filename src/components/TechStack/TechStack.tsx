import { useEffect, useMemo, useState } from "react";
import { listTechnologies } from "../../lib/api/technologies";
import type { Technology } from "../../lib/api/types";
import ScrollReveal from "../ScrollReveal/ScrollReveal";
import "./TechStack.css";

// Technology has no explicit sort field in the database, so this is just a
// display-order hint matching the original hand-picked ordering — any
// category not listed here still renders, just alphabetically after these.
const KNOWN_CATEGORY_ORDER = [
  "Frontend",
  "Backend",
  "Databases & Infrastructure",
  "Web3 & Integrations",
  "Tools",
];

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function TechStack() {
  const [technologies, setTechnologies] = useState<Technology[]>([]);

  useEffect(() => {
    let cancelled = false;

    listTechnologies()
      .then(({ technologies }) => {
        if (!cancelled) setTechnologies(technologies);
      })
      .catch((err) => {
        console.error("Failed to load technologies:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const byCategory = new Map<string, Technology[]>();
    for (const tech of technologies) {
      const list = byCategory.get(tech.category) ?? [];
      list.push(tech);
      byCategory.set(tech.category, list);
    }

    const categories = Array.from(byCategory.keys()).sort((a, b) => {
      const ai = KNOWN_CATEGORY_ORDER.indexOf(a);
      const bi = KNOWN_CATEGORY_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

    return categories.map((category) => ({
      category,
      items: byCategory.get(category)!,
    }));
  }, [technologies]);

  return (
    <section id="stack" className="section stack">
      <div className="container">
        <ScrollReveal>
          <p className="eyebrow">03 / Technologies</p>
          <h2 className="section-heading">Tools I reach for, grouped by what they're for.</h2>
        </ScrollReveal>

        <div className="stack__grid">
          {groups.map((group, gi) => (
            <ScrollReveal key={group.category} delay={gi * 80} className="stack__group">
              <h3 className="stack__group-title mono-label">{group.category}</h3>
              <div className="stack__items">
                {group.items.map((tech) => (
                  <div className="stack__item" key={tech.id}>
                    <span className="stack__item-badge" aria-hidden="true">
                      {tech.icon || initials(tech.name)}
                    </span>
                    {tech.name}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
