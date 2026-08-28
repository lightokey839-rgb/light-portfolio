import type { CSSProperties } from "react";
import "./ImageFrame.css";

interface ImageFrameProps {
  src?: string | null;
  alt: string;
  /** anything stable per-item (id, slug, index) — seeds the placeholder hue */
  seed?: string | number;
  /** shown only when there's no src */
  placeholderLabel?: string;
  ratio?: "16/10" | "16/9" | "4/3" | "1/1" | "3/4";
  className?: string;
  loading?: "eager" | "lazy";
}

function hueFromSeed(seed: string | number): number {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 360;
  }
  // Keep the generated hue inside the site's blue → violet → cyan family
  // rather than the full wheel, so placeholders never clash with the palette.
  return 190 + (hash % 110);
}

export default function ImageFrame({
  src,
  alt,
  seed = alt,
  placeholderLabel = "Preview coming soon",
  ratio = "16/10",
  className = "",
  loading = "lazy",
}: ImageFrameProps) {
  const hue = hueFromSeed(seed);

  return (
    <div
      className={`image-frame ${className}`.trim()}
      style={{ aspectRatio: ratio.replace("/", " / ") } as CSSProperties}
    >
      <span className="image-frame__corner image-frame__corner--tl" aria-hidden="true" />
      <span className="image-frame__corner image-frame__corner--tr" aria-hidden="true" />
      <span className="image-frame__corner image-frame__corner--bl" aria-hidden="true" />
      <span className="image-frame__corner image-frame__corner--br" aria-hidden="true" />

      {src ? (
        <img src={src} alt={alt} loading={loading} decoding="async" className="image-frame__img" />
      ) : (
        <div
          className="image-frame__placeholder"
          style={{ "--placeholder-hue": hue } as CSSProperties}
        >
          <svg className="image-frame__placeholder-lines" viewBox="0 0 200 140" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <path
                key={i}
                d={`M ${-20 + i * 10} 150 L ${120 + i * 14} -10`}
                stroke="currentColor"
                strokeWidth="1"
                opacity={0.12 + (i % 3) * 0.05}
              />
            ))}
          </svg>
          {placeholderLabel && <span className="image-frame__placeholder-label">{placeholderLabel}</span>}
        </div>
      )}
    </div>
  );
}
