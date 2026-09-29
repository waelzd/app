import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { I18nManager } from "react-native";

import { storage } from "@/src/utils/storage";
import { Lang, translations, TranslationKey } from "@/src/i18n/translations";

type LanguageContextType = {
  lang: Lang;
  isRTL: boolean;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey) => string;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);
const LANG_KEY = "malaeb_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    storage.getItem<Lang>(LANG_KEY, "en").then((saved) => {
      if (saved === "ar" || saved === "en") setLangState(saved);
    });
  }, []);

  const applyLang = useCallback((l: Lang) => {
    setLangState(l);
    storage.setItem(LANG_KEY, l);
    // Soft RTL hint for native layout mirroring where supported.
    try {
      I18nManager.allowRTL(l === "ar");
    } catch {}
  }, []);

  const t = useCallback((key: TranslationKey) => translations[lang][key] ?? key, [lang]);

  const isRTL = lang === "ar";

  return (
    <LanguageContext.Provider
      value={{
        lang,
        isRTL,
        dir: isRTL ? "rtl" : "ltr",
        t,
        setLang: applyLang,
        toggle: () => applyLang(lang === "en" ? "ar" : "en"),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
