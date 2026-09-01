import type { SVGProps } from "react";

/**
 * Ícones desenhados à mão pro tema da barbearia — nada de biblioteca
 * genérica de dashboard (sem nuvem, gráfico de pizza ou engrenagem).
 * Todos: stroke=currentColor, grid 24x24, sem preenchimento.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconScissors(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="6.5" r="2.6" />
      <circle cx="6" cy="17.5" r="2.6" />
      <path d="M20 4 L8.3 15.5" />
      <path d="M8.3 8.5 L20 20" />
    </svg>
  );
}

export function IconComb(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 5 H21 V8 H3 Z" />
      <path d="M5 8 V19 M8.2 8 V19 M11.4 8 V19 M14.6 8 V19 M17.8 8 V19" />
    </svg>
  );
}

export function IconTagClock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11 3 H19 A2 2 0 0 1 21 5 V13 L12 21 L3 12 L11 3 Z" />
      <circle cx="15.5" cy="8.5" r="2.4" />
      <path d="M15.5 7.3 V8.5 L16.3 9.1" strokeWidth={1.3} />
    </svg>
  );
}

export function IconCoin(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 V16.5 M9.7 15.2 C10.1 16 11 16.5 12 16.5 C13.4 16.5 14.3 15.7 14.3 14.6 C14.3 12.3 9.7 12.7 9.7 10.4 C9.7 9.3 10.6 8.5 12 8.5 C13 8.5 13.9 9 14.3 9.8" strokeWidth={1.4} />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20 C3.5 15.8 6 13.5 9 13.5 C12 13.5 14.5 15.8 14.5 20" />
      <circle cx="17.5" cy="9" r="2.4" />
      <path d="M15 20 C15 16.8 16.2 15 17.9 14.6" />
    </svg>
  );
}

export function IconSliders(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6 H20" />
      <circle cx="9" cy="6" r="1.9" fill="var(--color-bg, #0a0a0a)" />
      <path d="M4 12 H20" />
      <circle cx="16" cy="12" r="1.9" fill="var(--color-bg, #0a0a0a)" />
      <path d="M4 18 H20" />
      <circle cx="12" cy="18" r="1.9" fill="var(--color-bg, #0a0a0a)" />
    </svg>
  );
}

export function IconDoor(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13 4 H6 V20 H13" />
      <path d="M13 3.5 L19 5 V19 L13 20.5 Z" />
      <path d="M9.5 21 L15 15 M15 15 L11.5 13.5 M15 15 L13.5 18.2" strokeWidth={1.7} />
    </svg>
  );
}

export function IconBottle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3 H14 V6.5 L16 9 V20 A1 1 0 0 1 15 21 H9 A1 1 0 0 1 8 20 V9 L10 6.5 Z" />
      <path d="M8.5 13 H15.5" />
    </svg>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3.5 H19 V20.5 L16.5 19 L14 20.5 L11.5 19 L9 20.5 L6.5 19 L5 20.5 Z" />
      <path d="M8 8 H16 M8 11.5 H16 M8 15 H13" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M3 7 L12 13 L21 7" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="11" width="17" height="10" rx="2.5" />
      <path d="M7.5 11 V7.5 a4.5 4.5 0 0 1 9 0 V11" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="7.5" r="3.8" />
      <path d="M4.5 20.5 C4.5 16.4 7.6 13.5 12 13.5 C16.4 13.5 19.5 16.4 19.5 20.5" />
    </svg>
  );
}

export function IconHelp(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5 H20 V15 H10.5 L6 19 V15 H4 Z" />
      <path d="M9.7 9.4 C9.7 8.1 10.7 7.1 12 7.1 C13.3 7.1 14.3 8.1 14.3 9.4 C14.3 10.6 13.3 10.9 12.5 11.6 C12.2 11.9 12 12.2 12 12.6" strokeWidth={1.5} />
      <path d="M12 14.4 V14.5" strokeWidth={2.2} />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3 V5.2 M12 18.8 V21 M3 12 H5.2 M18.8 12 H21 M5.6 5.6 L7.2 7.2 M16.8 16.8 L18.4 18.4 M18.4 5.6 L16.8 7.2 M7.2 16.8 L5.6 18.4" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19.5 14.3 C17.9 15.3 16.1 15.8 14.2 15.5 C10.3 14.9 7.6 11.3 8.2 7.4 C8.4 6.1 8.9 4.9 9.7 3.9 C6 4.7 3.3 8 3.3 12 C3.3 16.7 7.1 20.5 11.8 20.5 C15.4 20.5 18.5 18.2 19.7 15 C19.6 14.8 19.6 14.5 19.5 14.3 Z" />
    </svg>
  );
}

export function IconContrast(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5 A8.5 8.5 0 0 1 12 20.5 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16 L20.5 20.5" />
    </svg>
  );
}
