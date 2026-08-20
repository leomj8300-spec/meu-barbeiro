export const TEMA_CORES = [
  "neutro",
  "laranja",
  "vermelho",
  "azul",
  "verde",
  "roxo",
  "dourado",
  "rosa",
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
};

interface TemaTokens {
  /** Cor de destaque principal — fundo de botão de ação, estado selecionado, sinal de atenção. */
  accent: string;
  /** Texto/ícone sobre um fundo pintado com `accent`. */
  onAccent: string;
  /** Texto/label na cor do accent sobre superfície escura (bloco "ink", sempre quase-preto). */
  accentText: string;
  /** Texto/label na cor do accent sobre o fundo claro padrão do app. */
  accentOnLight: string;
  /** Fundo pálido pro estado selecionado. */
  accentSoft: string;
  /** Borda pálida pro estado selecionado. */
  accentBorder: string;
}

/**
 * Um accent por barbeiro/dono, independente dos outros da mesma barbearia.
 * "neutro", "laranja" e "vermelho" vêm do documento de design aprovado; as
 * outras 5 seguem a mesma saturação/contraste pra completar o conjunto de
 * 6-8+ opções prontas (nunca cor livre, pra não deixar combinação feia).
 */
export const TEMA_TOKENS: Record<TemaCor, TemaTokens> = {
  neutro: {
    accent: "#111111",
    onAccent: "#FAFAF8",
    accentText: "#FAFAF8",
    accentOnLight: "#111111",
    accentSoft: "#F1EFEA",
    accentBorder: "#111111",
  },
  laranja: {
    accent: "#FF6A1F",
    onAccent: "#1A0D04",
    accentText: "#FF8A4C",
    accentOnLight: "#D6520F",
    accentSoft: "#FFF2E9",
    accentBorder: "#FFC7A3",
  },
  vermelho: {
    accent: "#D92D20",
    onAccent: "#FFF5F4",
    accentText: "#F07068",
    accentOnLight: "#B4231A",
    accentSoft: "#FDEDEB",
    accentBorder: "#F5BCB7",
  },
  azul: {
    accent: "#2A63E0",
    onAccent: "#F4F8FF",
    accentText: "#6E9CFF",
    accentOnLight: "#1E46A8",
    accentSoft: "#EBF1FF",
    accentBorder: "#B9CDFA",
  },
  verde: {
    accent: "#2F9E52",
    onAccent: "#F3FBF5",
    accentText: "#67C787",
    accentOnLight: "#1F7A3D",
    accentSoft: "#EAF7EE",
    accentBorder: "#BEE6C9",
  },
  roxo: {
    accent: "#7C3FE0",
    onAccent: "#FAF7FF",
    accentText: "#A98CF5",
    accentOnLight: "#5B2BB0",
    accentSoft: "#F3EEFE",
    accentBorder: "#D8C7F9",
  },
  dourado: {
    accent: "#C9922E",
    onAccent: "#1E1602",
    accentText: "#E0B65C",
    accentOnLight: "#916B1E",
    accentSoft: "#FBF3E1",
    accentBorder: "#EAD094",
  },
  rosa: {
    accent: "#D63C7C",
    onAccent: "#FFF5FA",
    accentText: "#F17BAC",
    accentOnLight: "#AC2361",
    accentSoft: "#FDECF3",
    accentBorder: "#F4B7D1",
  },
};

export const TEMA_PADRAO: { temaCor: TemaCor } = {
  temaCor: "neutro",
};
