import type { SVGProps } from "react";

/**
 * Official WhatsApp glyph as a stroke-only outline. Inherits color via
 * `currentColor` so it can be tinted with Tailwind text utilities.
 */
export function WhatsAppIcon({
  className,
  strokeWidth = 1.75,
  ...props
}: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Speech bubble silhouette with bottom-left tail */}
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05.02C5.5.02.18 5.34.18 11.89c0 2.09.55 4.13 1.6 5.93L.05 24l6.36-1.67a11.86 11.86 0 0 0 5.64 1.43h.01c6.55 0 11.87-5.32 11.87-11.87 0-3.17-1.23-6.15-3.41-8.41Z" />
      {/* Inner handset curve */}
      <path d="M9.13 7.4c-.2-.45-.41-.46-.6-.47-.15 0-.33-.01-.51-.01a.98.98 0 0 0-.71.33c-.24.27-.93.91-.93 2.22 0 1.31.96 2.58 1.09 2.76.13.18 1.86 2.97 4.6 4.04 2.28.9 2.74.72 3.24.67.5-.04 1.6-.65 1.83-1.28.23-.62.23-1.16.16-1.27-.07-.11-.25-.18-.52-.31-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.6.14-.18.27-.69.88-.85 1.06-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.16-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.59-1.46-.83-1.99Z" />
    </svg>
  );
}