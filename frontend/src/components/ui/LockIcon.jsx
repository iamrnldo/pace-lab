// src/components/ui/LockIcon.jsx
// Ikon gembok untuk menandai menu yang terkunci (profil belum lengkap).
export default function LockIcon({ className = "", title }) {
  const isDecorative = !title;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={isDecorative ? "presentation" : "img"}
      aria-hidden={isDecorative ? "true" : undefined}
      aria-label={title}
      focusable="false"
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="1.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v3" />
    </svg>
  );
}
