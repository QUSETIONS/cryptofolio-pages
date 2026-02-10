(function initThemeTokens() {
  const AppThemeTokens = {
    color: {
      bgMain: "#fff4ee",
      bgSurface: "#ffffff",
      bgSoft: "#fff8f4",
      border: "#edd9cc",
      textMain: "#221612",
      textStrong: "#140d0b",
      textMuted: "#7a655b",
      accent: "#ff5c00",
      accentStrong: "#e55300",
      positive: "#10b981",
      danger: "#ef4444",
      info: "#3b82f6",
      neutral: "#53615a",
      warning: "#c77b00"
    },
    space: {
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      5: "20px",
      6: "24px"
    },
    radius: {
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "22px"
    },
    motion: {
      fast: "160ms",
      base: "240ms"
    },
    zIndex: {
      toast: 1000,
      modal: 1100
    }
  };

  window.AppThemeTokens = AppThemeTokens;
})();
