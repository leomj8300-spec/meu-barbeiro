export const TEMA_CORES = [
  "neutro",
  "laranja",
  "vermelho",
  "azul",
  "verde",
  "roxo",
  "dourado",
  "rosa",
  "cobre",
  "marfim",
  "aco",
] as const;

export type TemaCor = (typeof TEMA_CORES)[number];

export const TEMA_LABELS: Record<TemaCor, string> = {
  neutro: "Preto",
  laranja: "Laranja",
  vermelho: "Vermelho",
  azul: "Azul",
  verde: "Verde",
  roxo: "Roxo",
  dourado: "Dourado",
  rosa: "Rosa",
  cobre: "Cobre",
  marfim: "Marfim",
  aco: "Aço",
};

export const TEMA_MODOS = ["claro", "escuro", "automatico"] as const;

export type TemaModo = (typeof TEMA_MODOS)[number];

export const TEMA_MODO_LABELS: Record<TemaModo, string> = {
  claro: "Claro",
  escuro: "Escuro",
  automatico: "Automático",
};

interface TemaTokensPorFundo {
  /** Cor de destaque principal — fundo de botão de ação, estado selecionado, sinal de atenção. */
  accent: string;
  /** Texto/ícone sobre um fundo pintado com `accent`. */
  onAccent: string;
  /** Texto/label na cor do accent sobre superfície escura (bloco "ink", sempre quase-preto). */
  accentText: string;
  /** Texto/label na cor do accent sobre o fundo padrão do app (varia com o tema). */
  accentOnLight: string;
  /** Fundo pálido pro estado selecionado. */
  accentSoft: string;
  /** Borda pálida pro estado selecionado. */
  accentBorder: string;
}

interface TemaTokens {
  light: TemaTokensPorFundo;
  dark: TemaTokensPorFundo;
}

/**
 * Um accent por barbeiro/dono, independente dos outros da mesma barbearia —
 * cada cor tem uma variante pro tema claro e uma pro escuro (ver
 * src/app/layout.tsx, que escolhe a variante certa na hora de montar o
 * <style> inline). "neutro", "laranja" e "vermelho" vêm do documento de
 * design aprovado; as outras seguem a mesma saturação/contraste (nunca cor
 * livre, pra não deixar combinação feia).
 */
export const TEMA_TOKENS: Record<TemaCor, TemaTokens> = {
  neutro: {
    light: {
      accent: "#111111",
      onAccent: "#FAFAF8",
      accentText: "#FAFAF8",
      accentOnLight: "#111111",
      accentSoft: "#F1EFEA",
      accentBorder: "#111111",
    },
    dark: {
      accent: "#F2F0EA",
      onAccent: "#15130E",
      accentText: "#FAFAF8",
      accentOnLight: "#F2F0EA",
      accentSoft: "#2A2721",
      accentBorder: "#F2F0EA",
    },
  },
  laranja: {
    light: {
      accent: "#FF6A1F",
      onAccent: "#1A0D04",
      accentText: "#FF8A4C",
      accentOnLight: "#D6520F",
      accentSoft: "#FFF2E9",
      accentBorder: "#FFC7A3",
    },
    dark: {
      accent: "#FF8A4C",
      onAccent: "#1A0D04",
      accentText: "#FF8A4C",
      accentOnLight: "#FF8A4C",
      accentSoft: "#3A2015",
      accentBorder: "#7A3C1E",
    },
  },
  vermelho: {
    light: {
      accent: "#D92D20",
      onAccent: "#FFF5F4",
      accentText: "#F07068",
      accentOnLight: "#B4231A",
      accentSoft: "#FDEDEB",
      accentBorder: "#F5BCB7",
    },
    dark: {
      accent: "#F07068",
      onAccent: "#210805",
      accentText: "#F07068",
      accentOnLight: "#F07068",
      accentSoft: "#3A1815",
      accentBorder: "#7A322B",
    },
  },
  azul: {
    light: {
      accent: "#2A63E0",
      onAccent: "#F4F8FF",
      accentText: "#6E9CFF",
      accentOnLight: "#1E46A8",
      accentSoft: "#EBF1FF",
      accentBorder: "#B9CDFA",
    },
    dark: {
      accent: "#6E9CFF",
      onAccent: "#06132B",
      accentText: "#6E9CFF",
      accentOnLight: "#6E9CFF",
      accentSoft: "#16233F",
      accentBorder: "#2C4677",
    },
  },
  verde: {
    light: {
      accent: "#2F9E52",
      onAccent: "#F3FBF5",
      accentText: "#67C787",
      accentOnLight: "#1F7A3D",
      accentSoft: "#EAF7EE",
      accentBorder: "#BEE6C9",
    },
    dark: {
      accent: "#67C787",
      onAccent: "#07200F",
      accentText: "#67C787",
      accentOnLight: "#67C787",
      accentSoft: "#14291B",
      accentBorder: "#295C39",
    },
  },
  roxo: {
    light: {
      accent: "#7C3FE0",
      onAccent: "#FAF7FF",
      accentText: "#A98CF5",
      accentOnLight: "#5B2BB0",
      accentSoft: "#F3EEFE",
      accentBorder: "#D8C7F9",
    },
    dark: {
      accent: "#A98CF5",
      onAccent: "#160B2E",
      accentText: "#A98CF5",
      accentOnLight: "#A98CF5",
      accentSoft: "#251C3D",
      accentBorder: "#4C3A79",
    },
  },
  dourado: {
    light: {
      accent: "#C9922E",
      onAccent: "#1E1602",
      accentText: "#E0B65C",
      accentOnLight: "#916B1E",
      accentSoft: "#FBF3E1",
      accentBorder: "#EAD094",
    },
    dark: {
      accent: "#E0B65C",
      onAccent: "#1E1602",
      accentText: "#E0B65C",
      accentOnLight: "#E0B65C",
      accentSoft: "#332812",
      accentBorder: "#6B5320",
    },
  },
  rosa: {
    light: {
      accent: "#D63C7C",
      onAccent: "#FFF5FA",
      accentText: "#F17BAC",
      accentOnLight: "#AC2361",
      accentSoft: "#FDECF3",
      accentBorder: "#F4B7D1",
    },
    dark: {
      accent: "#F17BAC",
      onAccent: "#2B0A18",
      accentText: "#F17BAC",
      accentOnLight: "#F17BAC",
      accentSoft: "#3A1826",
      accentBorder: "#7A3350",
    },
  },
  cobre: {
    light: {
      accent: "#B15A2E",
      onAccent: "#FCF3ED",
      accentText: "#D68556",
      accentOnLight: "#8A431F",
      accentSoft: "#FBEEE5",
      accentBorder: "#E9C1A4",
    },
    dark: {
      accent: "#D68556",
      onAccent: "#20100A",
      accentText: "#D68556",
      accentOnLight: "#D68556",
      accentSoft: "#33211A",
      accentBorder: "#6B4531",
    },
  },
  marfim: {
    light: {
      accent: "#8C7A54",
      onAccent: "#FFFDF7",
      accentText: "#C4B48C",
      accentOnLight: "#6B5C3D",
      accentSoft: "#F7F3E9",
      accentBorder: "#E2D8BE",
    },
    dark: {
      accent: "#C4B48C",
      onAccent: "#1D1A10",
      accentText: "#C4B48C",
      accentOnLight: "#C4B48C",
      accentSoft: "#2E2A1E",
      accentBorder: "#5C543C",
    },
  },
  aco: {
    light: {
      accent: "#5B7387",
      onAccent: "#F5F8FA",
      accentText: "#8FA7B8",
      accentOnLight: "#3F5567",
      accentSoft: "#EBF0F3",
      accentBorder: "#C1D0D9",
    },
    dark: {
      accent: "#8FA7B8",
      onAccent: "#101A21",
      accentText: "#8FA7B8",
      accentOnLight: "#8FA7B8",
      accentSoft: "#1E2A31",
      accentBorder: "#3C5361",
    },
  },
};

export const TEMA_PADRAO: { temaCor: TemaCor; temaModo: TemaModo } = {
  temaCor: "neutro",
  temaModo: "claro",
};
