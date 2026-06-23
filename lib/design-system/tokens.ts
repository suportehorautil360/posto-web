/** posto-web — Design System Tokens (marca FleetFuel, paleta laranja do comboio). */

export const brand = {
  name: "FleetFuel",
  tagline: "Operador do Posto",
  description: "Sistema do operador do posto — confirmação de pagamentos FleetFuel.",
} as const;

export const colors = {
  brand: {
    orange: { hex: "#f97316", label: "Safety Orange", usage: "CTAs, foco, marca" },
    navy: { hex: "#0a0e17", label: "Deep Navy", usage: "Background principal" },
    slate: { hex: "#161b26", label: "Surface Slate", usage: "Cards e superfícies" },
  },
  semantic: {
    success: { css: "var(--success)", label: "Sucesso" },
    warning: { css: "var(--warning)", label: "Alerta" },
    destructive: { css: "var(--destructive)", label: "Erro / Destrutivo" },
    info: { css: "var(--info)", label: "Informação" },
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '"Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif',
    mono: '"Geist Mono", "Geist Mono Fallback", ui-monospace, monospace',
  },
} as const;

export const radius = { default: "0.625rem" } as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
