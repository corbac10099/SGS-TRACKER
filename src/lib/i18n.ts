// ==================== Système de Traduction i18n (Dynamique via DOM) ====================
// Fichier centralisé gérant les traductions de l'interface utilisateur automatiquement via MutationObserver.

import { useState, useEffect } from 'react';

export type LanguageInfo = {
  id: string;
  label: string;
  flag: string;
  code?: string;
};

export type Locale = string;
export const LOCALES: LanguageInfo[] = [];

let currentLanguage: string = 'french';
let languagesList: LanguageInfo[] = [];
let translations: Record<string, string> = {};
let isInitialized: boolean = false;
let translationRegex: RegExp | null = null;

// Default French translations keyed by internal keys used across the app.
const DEFAULT_FR_TRANSLATIONS: Record<string, string> = {
  news_title: "ACTUALITÉS",
  news_filter_all: "Tout",
  news_filter_updates: "Mises à jour",
  news_filter_esports: "Esports",
  news_filter_community: "Communauté",
  match_filter_all: "Tout",
  match_filter_competitive: "Classé",
  match_filter_unrated: "Non Classé",
  match_filter_other: "Autres",
  smart_rating: "Notation Intelligente",
  visual_indicators_desc: "Affiche des indicateurs visuels sur les stats en dessous de la moyenne.",
  video_loop: "Lecture vidéo en boucle",
  video_loop_desc: "Rejoue automatiquement les vidéos des compétences d'agents.",
  video_delay: "Délai avant répétition",
  back_to_profile: "Retour au profil",
  save_settings: "Sauvegarder",
  cancel: "Annuler",
  profile_privacy: "Confidentialité du profil",
  profile_privacy_desc: "Gérez la visibilité de votre profil et de vos statistiques par les autres utilisateurs.",
  public_profile: "Profil Public",
  public_profile_desc: "Votre profil et vos statistiques sont visibles par n'importe quel utilisateur qui recherche votre nom.",
  private_profile: "Profil Privé",
  private_profile_desc: "Seul vous pouvez consulter vos statistiques lorsque vous êtes connecté. Les autres utilisateurs verront un message indiquant que votre profil est privé.",
  stats_visibility: "Visibilité des Statistiques",
  stats_visibility_desc: "Décochez les statistiques que vous ne souhaitez pas voir sur votre propre profil.",
  stat_kills: "Kills",
  stat_deaths: "Morts",
  stat_assists: "Assists",
  stat_kd: "K/D Ratio",
  stat_adr: "Dégâts/Tour (ADR)",
  stat_hs: "Headshot %",
  stat_winrate: "Win Rate",
  stat_acs: "ACS Moyen",
  stat_fb: "Premiers sangs",
  stat_ace: "ACE",
  stat_kast: "KAST",
  stat_dd: "DDΔ / Round",
  stat_wins: "Victoires",
  apply_to_visitors: "Appliquer aux visiteurs",
  apply_to_visitors_desc: "Si coché, les visiteurs verront exactement les mêmes stats que vous.",
  ui_theme: "Thème de l'interface",
  ui_theme_desc: "Choisissez un thème visuel pour l'application.",
  theme_dark: "Sombre",
  theme_light: "Clair",
  theme_midnight: "Midnight",
  theme_crimson: "Crimson",
  theme_ocean: "Océan",
  theme_custom: "Personnalisé",
  color_customization: "Personnalisation des couleurs",
  accent_color: "Couleur d'accentuation",
  bg_color: "Couleur de fond",
  banner_customization: "Personnalisation de la Bannière",
  banner_default: "Défaut",
  see_more: "Voir plus",
  vertical_crop: "Cadrage vertical (Hauteur)",
  preview: "Aperçu",
  avatar: "Avatar",
  live_preview: "Aperçu en direct",
  live_preview_desc: "Glissez le curseur pour voir l'image s'ajuster en temps réel dans le cadre ci-dessus.",
  footer_desc: "Application de suivi de performances pour Valorant. Utilise l'API officielle de Riot Games.",
  footer_legal: "SGS-Tracker n'est pas affilié à Riot Games et ne reflète pas les opinions de Riot Games ni de toute personne impliquée dans la production ou la gestion des propriétés de Riot Games. Riot Games et toutes les propriétés associées sont des marques commerciales ou des marques déposées de Riot Games, Inc.",
  role_duelist: "Duelliste",
  role_initiator: "Initiateur",
  role_controller: "Contrôleur",
  role_sentinel: "Sentinelle",
  logout_button: "Déconnexion",
  tab_performance: "Performances",
  tab_agents: "Agents",
  tab_history: "Historique",
  match_all_seasons: "Toutes les saisons"
};

const listeners = new Set<() => void>();
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'alt', 'aria-label'];
const OBSERVED_ATTRIBUTES = [
  ...TRANSLATABLE_ATTRIBUTES,
  ...TRANSLATABLE_ATTRIBUTES.map(attr => `data-original-${attr}`),
];

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function tr(frenchString: string): string {
  // If the passed value is an internal key (e.g. 'stat_kills'), prefer the default French mapping
  if (currentLanguage === 'french') {
    if (DEFAULT_FR_TRANSLATIONS[frenchString]) return DEFAULT_FR_TRANSLATIONS[frenchString];
    return frenchString;
  }

  // For non-french languages, try direct lookup by the provided string (which might be either
  // an internal key or a French literal). First try the translations map using the key,
  // then try using the French literal as a lookup key (common in existing JSON files),
  // finally fallback to the input string.
  return translations[frenchString] ?? translations[DEFAULT_FR_TRANSLATIONS[frenchString] || ''] ?? frenchString;
}

export function t(frenchString: string, _locale?: string): string {
  // `t()` historically expected a French literal string. The app often passes internal keys
  // like 'tab_agents' or 'stat_kills'. Support both:
  // - If translations contain the key, return it.
  // - If current language is french, map the key to the default French label.
  // - Otherwise, try using the French literal as lookup into translations.

  // If translations already contains this exact key, return it.
  if (translations[frenchString]) return translations[frenchString];

  // If the provided value looks like an internal key and we have a French default, use it
  const frenchDefault = DEFAULT_FR_TRANSLATIONS[frenchString];
  if (currentLanguage === 'french') {
    return frenchDefault ?? frenchString;
  }

  // Non-french: prefer translations by key, then by french literal
  if (frenchDefault && translations[frenchDefault]) return translations[frenchDefault];
  return tr(frenchString);
}

export function trFormat(frenchString: string, values: Record<string, string | number>): string {
  return tr(frenchString).replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export function getCurrentLanguage(): string { return currentLanguage; }
export function getLanguagesList(): LanguageInfo[] { return languagesList; }

export async function loadLanguagesList(): Promise<LanguageInfo[]> {
  try {
    const res = await fetch('/locales/languages.json');
    if (!res.ok) throw new Error('Failed to load languages.json');
    
    const data = await res.json();
    languagesList = data.languages;
    
    const savedLang = typeof window !== 'undefined' ? localStorage.getItem('app_language') : null;
    const defaultLang = data.default || 'french';
    
    if (!isInitialized) {
      isInitialized = true;
      await setLanguage(savedLang || defaultLang);
    }
    
    return languagesList;
  } catch (error) {
    console.error('Error loading languages list:', error);
    return [];
  }
}

export async function setLanguage(langId: string): Promise<void> {
  // Normalize common short codes (fr/en/es/ja/etc.) to the language ids declared in languages.json
  let requested = langId;
  const availableIds = languagesList.map(l => l.id);
  if (!availableIds.includes(requested)) {
    const byPrefix = languagesList.find(l => l.id.toLowerCase().startsWith((langId || '').toLowerCase()));
    if (byPrefix) requested = byPrefix.id;
    else {
      const CODE_MAP: Record<string, string> = {
        fr: 'french',
        en: 'english',
        es: 'español',
        ja: '日本語',
        jp: '日本語',
        de: 'de',
        pt: 'pt',
        it: 'it',
        ko: 'ko'
      };
      if (CODE_MAP[langId]) requested = CODE_MAP[langId];
    }
  }

  currentLanguage = requested;

  if (typeof window !== 'undefined') {
    localStorage.setItem('app_language', requested);
  }

  if (requested === 'french') {
    translations = {};
    notifyListeners();
    translateDOM(); // Revert back to original texts (stored in attributes)
    return;
  }

  try {
    const res = await fetch(`/locales/${requested}.json`);
    if (!res.ok) throw new Error(`Failed to load ${requested}.json`);
    
    const data = await res.json();
    translations = data.translations || {};
  } catch (error) {
    console.error(`Error loading translations for ${requested}:`, error);
    translations = {};
  }

  // Build regex for partial translation matches
  const keys = Object.keys(translations)
    .filter(k => k.length > 3)
    .sort((a, b) => b.length - a.length);

  if (keys.length > 0) {
    const escapedKeys = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    translationRegex = new RegExp(`(${escapedKeys.join('|')})`, 'g');
  } else {
    translationRegex = null;
  }
  
  notifyListeners();
  translateDOM();
}

// ==================== DOM TRANSLATOR ====================

function translateDOM() {
  if (typeof window === 'undefined') return;
  
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    translateNode(node as Text);
  }

  document.body.querySelectorAll<HTMLElement>('*').forEach(translateElementAttributes);
}

function translateElementAttributes(element: HTMLElement) {
  if (
    element.tagName === 'SCRIPT' ||
    element.tagName === 'STYLE' ||
    element.closest('[translate="no"]') ||
    element.closest('.notranslate') ||
    element.closest('.rich-text-renderer')
  ) {
    return;
  }

  TRANSLATABLE_ATTRIBUTES.forEach(attr => {
    const rawValue = element.getAttribute(attr);
    if (!rawValue || !rawValue.trim()) return;

    const originalAttr = `data-original-${attr}`;
    if (!element.hasAttribute(originalAttr)) {
      element.setAttribute(originalAttr, rawValue);
    }

    const original = element.getAttribute(originalAttr) || rawValue;
    const stripped = original.trim();
    const translated = currentLanguage === 'french' ? original : original.replace(stripped, translations[stripped] || stripped);

    if (element.getAttribute(attr) !== translated) {
      element.setAttribute(attr, translated);
    }
  });
}

function translateNode(node: Text) {
  // Ignore scripts, styles, and elements specifically marked as notranslate or rich-text-renderer
  if (node.parentElement && (
      node.parentElement.tagName === 'SCRIPT' || 
      node.parentElement.tagName === 'STYLE' ||
      node.parentElement.closest('[translate="no"]') ||
      node.parentElement.closest('.notranslate') ||
      node.parentElement.closest('.rich-text-renderer')
  )) {
    return;
  }

  const rawText = node.nodeValue || '';
  if (!rawText.trim()) return;

  // Initialize original text if not present
  if (!(node as any)._originalText) {
    (node as any)._originalText = rawText;
  }
  
  const original = (node as any)._originalText;
  const stripped = original.trim();
  
  if (currentLanguage === 'french') {
    if (node.nodeValue !== original) {
      node.nodeValue = original;
    }
    return;
  }

  // 1. Exact match on trimmed string (highest priority & cleanest)
  if (translations[stripped]) {
    const translated = original.replace(stripped, translations[stripped]);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
    return;
  }
  
  let translatedStr = original;

  // 2. Partial match via Regex for mixed text nodes
  if (translationRegex) {
    translatedStr = translatedStr.replace(translationRegex, (match: string) => {
      return translations[match] || match;
    });
  }

  if (node.nodeValue !== translatedStr) {
    node.nodeValue = translatedStr;
  }
}

export function useLanguage() {
  const [lang, setLang] = useState<string>(currentLanguage);

  useEffect(() => {
    if (languagesList.length === 0 && !isInitialized) {
      loadLanguagesList();
    }

    const listener = () => setLang(currentLanguage);
    listeners.add(listener);
    
    // Set up DOM MutationObserver
    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              translateNode(node as Text);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              translateElementAttributes(el);
              el.querySelectorAll('*').forEach(child => translateElementAttributes(child as HTMLElement));
              
              const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
              let child;
              while ((child = walker.nextNode())) {
                translateNode(child as Text);
              }
            }
          });
        } else if (mutation.type === 'attributes') {
          translateElementAttributes(mutation.target as HTMLElement);
        } else if (mutation.type === 'characterData') {
          // If React overrides a text node, characterData triggers.
          // However, if we modified it, characterData might trigger. We check if it changed to something other than our translation
          const node = mutation.target as Text;
          if (node.nodeValue && node.parentElement && !node.parentElement.closest('.notranslate')) {
             // Reset original text if React explicitly wrote something new (that is not our translation)
             const currentStripped = node.nodeValue.trim();
             const originalStripped = (node as any)._originalText?.trim();
             const translatedStripped = translations[originalStripped];
             
             if (currentStripped !== translatedStripped && currentStripped !== originalStripped) {
               (node as any)._originalText = node.nodeValue;
               translateNode(node);
             }
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: OBSERVED_ATTRIBUTES
    });
    
    // Initial pass
    translateDOM();

    return () => {
      listeners.delete(listener);
      observer.disconnect();
    };
  }, []);

  return {
    lang,
    tr,
    trFormat,
    setLanguage,
    languagesList,
    currentLanguage
  };
}

export default {
  tr,
  trFormat,
  useLanguage,
  loadLanguagesList,
  setLanguage,
  getCurrentLanguage,
  getLanguagesList
};
