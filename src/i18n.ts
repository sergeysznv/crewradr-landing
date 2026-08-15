"use client";

// Minimal i18n for the static landing site: flat dictionaries + client-side
// locale resolution (no next-intl needed for this surface). The share-map
// Pages Function (functions/share/[[token]].js) keeps its own dictionaries
// because it runs outside Next.js.

export const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "ru", label: "Русский", dir: "ltr" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const LOCALE_DIRS: Record<LocaleCode, "ltr" | "rtl"> = {
  en: "ltr", es: "ltr", fr: "ltr", ar: "rtl", zh: "ltr", ru: "ltr",
};

const strings = {
  toggleTheme: {
    en: "Toggle theme", es: "Cambiar tema", fr: "Changer de thème",
    ar: "تبديل المظهر", zh: "切换主题", ru: "Переключить тему",
  },
  headingPart1: {
    en: "CrewRadr is", es: "CrewRadr está", fr: "CrewRadr arrive",
    ar: "CrewRadr قادم", zh: "CrewRadr 即将", ru: "CrewRadr уже",
  },
  headingPart2: {
    en: "coming soon", es: "llegando pronto", fr: "bientôt",
    ar: "قريباً", zh: "上线", ru: "совсем скоро",
  },
  subtitle: {
    en: "Real-time location sharing for trusted crews. We're putting the finishing touches on something great.",
    es: "Comparte tu ubicación en tiempo real con tu equipo de confianza. Estamos dando los últimos retoques a algo grande.",
    fr: "Partage de position en temps réel pour vos équipes de confiance. Nous mettons la touche finale à quelque chose de grand.",
    ar: "مشاركة الموقع في الوقت الفعلي لطواقمك الموثوقة. نضع اللمسات الأخيرة على شيء رائع.",
    zh: "为值得信赖的团队提供实时位置共享。我们正在为即将推出的出色产品做最后的润色。",
    ru: "Обмен местоположением в реальном времени для надёжных команд. Мы наносим последние штрихи на что-то большое.",
  },
  language: {
    en: "Language", es: "Idioma", fr: "Langue",
    ar: "اللغة", zh: "语言", ru: "Язык",
  },
  privacy: {
    en: "Privacy", es: "Privacidad", fr: "Confidentialité",
    ar: "الخصوصية", zh: "隐私政策", ru: "Конфиденциальность",
  },
  terms: {
    en: "Terms", es: "Términos", fr: "Conditions",
    ar: "الشروط", zh: "服务条款", ru: "Условия",
  },
} as const;

export type MessageKey = keyof typeof strings;

export function t(locale: LocaleCode, key: MessageKey): string {
  return strings[key][locale];
}

export function resolveLocale(searchParams?: string): LocaleCode {
  // ?lang= override
  if (typeof searchParams === "string") {
    const m = /[?&]lang=([a-z]{2})/i.exec(searchParams);
    if (m && (LOCALES as readonly { code: string }[]).some((l) => l.code === m[1])) {
      return m[1] as LocaleCode;
    }
  }
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("lang");
    if (saved && (LOCALES as readonly { code: string }[]).some((l) => l.code === saved)) {
      return saved as LocaleCode;
    }
    const nav = window.navigator.language.toLowerCase();
    const prefix = nav.slice(0, 2);
    if ((LOCALES as readonly { code: string }[]).some((l) => l.code === prefix)) {
      return prefix as LocaleCode;
    }
  }
  return "en";
}

export function applyLocale(locale: LocaleCode) {
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALE_DIRS[locale];
  window.localStorage.setItem("lang", locale);
}
