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

/** Marca do app — poste de barbearia. Selo do cabeçalho/login/onboarding. */
export function IconBarberPole(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 5 H18" />
      <path d="M6 19 H18" />
      <path d="M8.5 5 V19 M15.5 5 V19" />
      <path d="M8.5 8 L15.5 11 M8.5 12 L15.5 15 M8.5 16 L15.5 19" />
    </svg>
  );
}

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

export function IconPercent(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="7" cy="7" r="2.6" />
      <circle cx="17" cy="17" r="2.6" />
      <path d="M18.5 5.5 L5.5 18.5" />
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

export function IconCalendarCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="0.5" />
      <path d="M3.5 9.5 H20.5" />
      <path d="M8 3 V6.5 M16 3 V6.5" />
      <path d="M8 14 L10.5 16.5 L16 11.5" />
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
