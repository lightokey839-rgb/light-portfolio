import "./ThemeToggle.css";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
  className?: string;
}

// Purely presentational — takes its theme value and toggle handler as
// props rather than reading a context directly. That's what lets the
// public site (useTheme()) and the admin dashboard (useAdminTheme(), a
// fully separate context/storage key) both use this exact component
// without sharing any state. See Navbar.tsx and AdminLayout.tsx for the
// two call sites.
export default function ThemeToggle({ theme, onToggle, className = "" }: ThemeToggleProps) {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={onToggle}
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <span className="theme-toggle__track">
        <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M17 11.2A7.2 7.2 0 0 1 8.8 3a7.2 7.2 0 1 0 8.2 8.2Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M10 1.6v2M10 16.4v2M18.4 10h-2M3.6 10h-2M15.6 4.4l-1.4 1.4M5.8 14.2l-1.4 1.4M15.6 15.6l-1.4-1.4M5.8 5.8 4.4 4.4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="theme-toggle__thumb" aria-hidden="true" />
      </span>
    </button>
  );
}
