'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage, loadLanguagesList, LanguageInfo } from '@/lib/i18n';
import { trackPageView } from '@/lib/analytics';

// 5 Theme options with background and accent previews
const THEMES = [
  {
    id: 'dark',
    name: 'Sombre',
    bg: '#0a0e13',
    surface: '#0f1923',
    accent: '#ff4655',
    border: 'rgba(255, 70, 85, 0.2)',
  },
  {
    id: 'light',
    name: 'Clair',
    bg: '#f0f1f5',
    surface: '#ffffff',
    accent: '#0f1923',
    border: 'rgba(15, 25, 35, 0.2)',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bg: '#0d0b1a',
    surface: '#140f28',
    accent: '#8c64ff',
    border: 'rgba(140, 100, 255, 0.2)',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    bg: '#120808',
    surface: '#1e0a0a',
    accent: '#ff2e43',
    border: 'rgba(255, 46, 67, 0.2)',
  },
  {
    id: 'ocean',
    name: 'Océan',
    bg: '#071014',
    surface: '#0a1923',
    accent: '#32c8b4',
    border: 'rgba(50, 200, 180, 0.2)',
  },
];

// Riot Games Inline SVG Fist Logo
function RiotGamesLogo({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M211.9 44.5L107.5 94.6v270.8l104.4-38.2V44.5zm192.6 0l-104.4 38.2v282.7l104.4 38.2V44.5zM107.5 385.9l104.4 38.2v43.4L107.5 431v-45.1zm192.6 0v45.1l104.4 36.5v-43.4l-104.4-38.2z" />
    </svg>
  );
}

function OnboardingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTestMode = searchParams.get('test') === '1' || searchParams.get('preview') === '1';

  const { lang: currentLang, setLanguage: setAppLanguage, tr, trFormat } = useLanguage();

  // State tracking
  const initialStepParam = searchParams.get('step');
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const s = parseInt(initialStepParam || '1', 10);
    return isNaN(s) || s < 1 || s > 4 ? 1 : s;
  });
  const [languages, setLanguages] = useState<LanguageInfo[]>([
    { id: 'french', label: 'Français', flag: '🇫🇷' },
    { id: 'english', label: 'English', flag: '' },
  ]);
  const [language, setLanguage] = useState<string>(currentLang || 'french');
  const [theme, setTheme] = useState<string>('dark');
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [streamerMode, setStreamerMode] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Data Retention states
  const [consentRetention, setConsentRetention] = useState<boolean>(true);
  const [dataRetentionPolicy, setDataRetentionPolicy] = useState<string>('1_season');
  const [dataRetentionCustomDays, setDataRetentionCustomDays] = useState<number>(90);

  // Search and display toggle for languages
  const [languageSearchQuery, setLanguageSearchQuery] = useState<string>('');
  const [showAllLanguages, setShowAllLanguages] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("spycam_guest_mode") === "true") {
      setIsGuest(true);
    }
  }, []);

  // Load available languages from i18n
  useEffect(() => {
    trackPageView('Onboarding (1ère Connexion)', '/onboarding');
    loadLanguagesList().then((list) => {
      if (list && list.length > 0) {
        setLanguages(list);
      }
    });
  }, []);

  // Synchronize language state with current i18n language
  useEffect(() => {
    if (currentLang && currentLang !== language) {
      setLanguage(currentLang);
    }
  }, [currentLang]);

  // Authentication check (ignored in test mode or guest mode)
  useEffect(() => {
    const isGuestSession = isGuest || (typeof window !== "undefined" && sessionStorage.getItem("spycam_guest_mode") === "true");
    if (!isTestMode && !isGuestSession && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, isTestMode, isGuest]);

  // Dynamically apply selected theme class for live preview
  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-midnight', 'theme-crimson', 'theme-ocean');
    if (theme !== 'dark') {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  // Handle language selection
  const handleSelectLanguage = (langId: string) => {
    setLanguage(langId);
    setAppLanguage(langId);
  };

  // Filter languages based on search query
  const filteredLanguages = languages.filter((l) => {
    if (!languageSearchQuery.trim()) return true;
    const q = languageSearchQuery.toLowerCase();
    return (l.label || '').toLowerCase().includes(q) || (l.id || '').toLowerCase().includes(q);
  });

  const displayedLanguages = languageSearchQuery.trim() || showAllLanguages
    ? filteredLanguages
    : filteredLanguages.slice(0, 5);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < 4) {
      setDirection('next');
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('prev');
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Complete Onboarding - POST to /api/auth/onboarding
  const handleComplete = async () => {
    if (isSubmitting) return;

    const isGuest = typeof window !== "undefined" && sessionStorage.getItem("spycam_guest_mode") === "true";
    const guestId = typeof window !== "undefined" ? sessionStorage.getItem("spycam_guest_id") : null;

    if (isTestMode && !session && !isGuest) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        alert(`✅ Configuration testée avec succès !\n\n• Langue choisie : ${language}\n• Thème choisi : ${theme}\n• Profil public : ${isPublic ? 'Oui' : 'Non'}\n• Conservation activée : ${consentRetention ? 'Oui' : 'Non'}\n• Rétention des données : ${dataRetentionPolicy} (${dataRetentionPolicy === 'custom' ? dataRetentionCustomDays + ' jours' : ''})`);
      }, 500);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const calculatedDays = !consentRetention
      ? 0
      : dataRetentionPolicy === 'custom'
      ? dataRetentionCustomDays
      : dataRetentionPolicy === '30_days'
      ? 30
      : dataRetentionPolicy === '1_season'
      ? 90
      : dataRetentionPolicy === '3_seasons'
      ? 270
      : dataRetentionPolicy === '1_year'
      ? 365
      : 9999;

    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({
          language,
          theme,
          isPublic,
          dataRetentionPolicy: consentRetention ? dataRetentionPolicy : 'none',
          dataRetentionDays: calculatedDays,
          guestId: guestId || undefined,
        }),
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("spycam_streamer_mode", String(streamerMode));
        }
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || "Une erreur s'est produite lors de la finalisation.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Erreur de connexion au serveur.');
      setIsSubmitting(false);
    }
  };

  // Loading state during session check (only when not in test mode and not in guest mode)
  const isGuestActive = isGuest || (typeof window !== "undefined" && sessionStorage.getItem("spycam_guest_mode") === "true");

  if (!isTestMode && !isGuestActive && status === 'loading') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--color-background)]">
        <img
          src="/sgs-icon.jpg"
          alt="SGS Logo"
          className="w-16 h-16 object-contain rounded-2xl animate-pulse drop-shadow-[0_0_30px_rgba(255,70,85,0.7)] mb-4"
        />
        <div className="text-[var(--color-text-secondary)] text-sm font-bold uppercase tracking-widest animate-pulse">
          Chargement...
        </div>
      </div>
    );
  }

  // If unauthenticated and not test mode and not guest mode, do not flash content before redirect
  if (!isTestMode && !isGuestActive && status === 'unauthenticated') {
    return null;
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* Test Mode Floating Banner */}
      {isTestMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#161b22]/90 border border-[var(--color-val-red)]/50 shadow-[0_0_25px_rgba(255,70,85,0.35)] text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-3 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-val-red)] animate-pulse"></span>
          <span>Mode Test AppControl (Prévisualisation)</span>
          <div className="flex gap-1.5 ml-2 border-l border-white/20 pl-3">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setDirection(s > currentStep ? 'next' : 'prev');
                  setCurrentStep(s);
                }}
                className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black transition-colors cursor-pointer ${
                  currentStep === s
                    ? 'bg-[var(--color-val-red)] text-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-gray-300'
                }`}
              >
                Étape {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Valorant ambient background glows */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-[var(--color-val-red)] opacity-10 blur-[130px] rounded-full pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-[var(--color-val-red)] opacity-10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header / Progress Indicator (4 Steps) */}
      <div className="w-full max-w-xl mb-8 flex flex-col items-center z-10">
        {/* Logo and Protocol subtitle */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,70,85,0.4)] bg-black">
            <img src="/sgs-icon.jpg" alt="SGS Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[var(--color-text-secondary)]">
            SGS-TRACKER // ONBOARDING
          </span>
        </div>

        {/* 4 Steps Dots Progress Bar */}
        <div className="w-full relative px-8">
          {/* Background line aligned exactly to vertical center of the 44px buttons */}
          <div className="absolute left-14 right-14 top-[22px] -translate-y-1/2 h-[2px] bg-[var(--color-border)] z-0">
            <div
              className="h-full bg-[var(--color-val-red)] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,70,85,0.5)]"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '33.3%' : currentStep === 3 ? '66.6%' : '100%',
              }}
            />
          </div>

          {/* Dots */}
          <div className="flex items-start justify-between w-full relative z-10">
            {[1, 2, 3, 4].map((step) => {
              const isActive = currentStep === step;
              const isCompleted = currentStep > step;

              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (step < currentStep || isTestMode) {
                        setDirection(step < currentStep ? 'prev' : 'next');
                        setCurrentStep(step);
                      }
                    }}
                    disabled={!isTestMode && step > currentStep}
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-[var(--color-val-red)] text-white shadow-[0_0_25px_rgba(255,70,85,0.7)] scale-110 ring-4 ring-[#ff4655]/20 cursor-default'
                        : isCompleted
                        ? 'bg-[var(--color-val-red)] text-white shadow-[0_0_12px_rgba(255,70,85,0.4)] cursor-pointer hover:scale-105'
                        : isTestMode
                        ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] cursor-pointer hover:border-[var(--color-val-red)]'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step
                    )}
                  </button>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'text-[var(--color-val-red)]'
                        : isCompleted
                        ? 'text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {step === 1 ? tr("Langue") : step === 2 ? tr("Thème") : step === 3 ? tr("Riot Games") : tr("Rétention")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Card Container */}
      <div
        key={currentStep}
        className={`w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl z-10 relative overflow-hidden transition-all ${
          direction === 'next' ? 'animate-slide-right' : 'animate-slide-left'
        }`}
      >
        {/* STEP 1 - LANGUE (Identique et liée aux Paramètres) */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-val-red)] mb-2">
              Étape 01 sur 04
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[var(--color-text-primary)] mb-2">
              {"Choisissez votre langue"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-6">
              {"Sélectionnez la langue dans laquelle vous souhaitez afficher l'interface."}
            </p>

            {/* Language Search Input */}
            <div className="w-full mb-6 relative">
              <input
                type="text"
                value={languageSearchQuery}
                onChange={(e) => setLanguageSearchQuery(e.target.value)}
                placeholder={tr("Rechercher une langue...")}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 pl-11 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 focus:border-[var(--color-val-red)] focus:outline-none transition-colors"
              />
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {languageSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLanguageSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Language options grid with background cover image + dark gradient overlay (Exact same design as Settings) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full mb-8 text-left">
              {displayedLanguages.map((l) => {
                const isSelected = (language || 'french') === l.id;
                const isImageFlag = l.flag && (l.flag.startsWith('/') || l.flag.startsWith('http') || l.flag.includes('.'));
                
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleSelectLanguage(l.id)}
                    className={`relative overflow-hidden rounded-2xl p-5 border-2 transition-all duration-300 flex items-center justify-between text-left group min-h-[90px] cursor-pointer ${
                      isSelected
                        ? 'border-[var(--color-val-red)] shadow-[0_0_25px_rgba(255,70,85,0.4)] scale-[1.02] bg-[var(--color-val-red)]/10'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] hover:scale-[1.01] bg-[#0a0e13]'
                    }`}
                  >
                    {/* Image background with dark gradient to the right with transparency */}
                    {isImageFlag ? (
                      <>
                        <img
                          src={l.flag}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 pointer-events-none"></div>
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-[var(--color-surface)] pointer-events-none"></div>
                    )}

                    {/* Content with high contrast text */}
                    <div className="relative z-10 flex items-center gap-3.5">
                      {!isImageFlag && (
                        <span className="text-3xl filter drop-shadow-md select-none">{l.flag || '🌐'}</span>
                      )}
                      <div className="flex flex-col">
                        <span className="font-black text-base text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                          {l.label}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                          {l.id}
                        </span>
                      </div>
                    </div>

                    {/* Check badge when selected */}
                    {isSelected && (
                      <div className="relative z-10 w-6 h-6 rounded-full bg-[var(--color-val-red)] flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Toggle Afficher plus / Afficher moins if > 5 languages and no active search query */}
            {!languageSearchQuery.trim() && filteredLanguages.length > 5 && (
              <div className="w-full flex justify-center mb-8">
                <button
                  type="button"
                  onClick={() => setShowAllLanguages(!showAllLanguages)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>{showAllLanguages ? tr("Afficher moins") : trFormat("Afficher plus (+{count})", { count: filteredLanguages.length - 5 })}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${showAllLanguages ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
            )}

            {/* Suivant Button */}
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto px-8 py-3.5 bg-[var(--color-val-red)] hover:bg-[#ff5a67] text-white font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,70,85,0.4)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <span>{tr("Suivant")}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 - THÈME */}
        {currentStep === 2 && (
          <div className="flex flex-col items-center text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-val-red)] mb-2">
              Étape 02 sur 04
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[var(--color-text-primary)] mb-2">
              {"Choisissez votre thème"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-8">
              {"Personnalisez l'apparence visuelle de votre tableau de bord."}
            </p>

            {/* Theme options grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full mb-10">
              {THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`relative rounded-2xl p-3.5 flex flex-col items-center gap-3 border-2 transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'border-[var(--color-val-red)] bg-[var(--color-val-red)]/10 shadow-[0_0_20px_rgba(255,70,85,0.25)] scale-[1.03]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-text-secondary)]/30'
                    }`}
                  >
                    {/* Visual Color Preview */}
                    <div
                      className="w-full aspect-[4/3] rounded-xl overflow-hidden flex flex-col p-1.5 shadow-inner border border-white/5 relative"
                      style={{ backgroundColor: t.bg }}
                    >
                      <div className="h-2 w-full rounded-sm mb-1 opacity-80" style={{ backgroundColor: t.accent }} />
                      <div
                        className="flex-1 rounded-md p-1 flex flex-col justify-between"
                        style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
                      >
                        <div className="w-1/2 h-1.5 rounded bg-white/20 mb-1" />
                        <div className="w-full h-2 rounded" style={{ backgroundColor: t.accent, opacity: 0.8 }} />
                      </div>
                    </div>

                    {/* Theme Label */}
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {t.name}
                    </span>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--color-val-red)] rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons: Retour & Suivant */}
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>{tr("Retour")}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3.5 bg-[var(--color-val-red)] hover:bg-[#ff5a67] text-white font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,70,85,0.4)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <span>{tr("Suivant")}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 - CONNEXION RIOT */}
        {currentStep === 3 && (
          <div className="flex flex-col items-center text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-val-red)] mb-2">
              Étape 03 sur 04
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[var(--color-text-primary)] mb-2">
              {"Connectez votre compte Riot Games"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-8 max-w-md leading-relaxed">
              {"Liez votre compte pour accéder à vos vraies statistiques de jeu."}
            </p>

            {/* Big Central Card */}
            <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 mb-8 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
              {/* Subtle ambient light */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--color-val-red)]/10 blur-3xl rounded-full pointer-events-none" />

              {/* Riot SVG Fist Icon */}
              <div className="w-20 h-20 bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/30 rounded-2xl flex items-center justify-center mb-6 text-[var(--color-val-red)] shadow-[0_0_30px_rgba(255,70,85,0.2)]">
                <RiotGamesLogo className="w-12 h-12" />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-2">
                Riot Games Sign-On (RSO)
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6 max-w-sm">
                {"Synchronisez automatiquement vos rangs, historiques de parties et statistiques d'agents directement depuis Riot."}
              </p>

              {/* Privacy Checkbox */}
              <div className="w-full max-w-md mb-4 flex items-start gap-3 bg-[var(--color-background)]/50 p-4 rounded-xl border border-[var(--color-border)] text-left">
                <input 
                  type="checkbox" 
                  id="privacy-opt-in" 
                  checked={isPublic} 
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-val-red)] focus:ring-[var(--color-val-red)] focus:ring-offset-[var(--color-surface)]"
                />
                <label htmlFor="privacy-opt-in" className="text-xs text-[var(--color-text-secondary)] leading-relaxed cursor-pointer">
                  <strong className="text-[var(--color-text-primary)] block mb-1">{"J'accepte de rendre mon profil public"}</strong>
                  {"En cochant cette case, j'accepte que mes statistiques Valorant puissent être recherchées et vues par les autres utilisateurs de la plateforme."}
                </label>
              </div>

              {/* Streamer Mode Checkbox */}
              <div className="w-full max-w-md mb-6 flex items-start gap-3 bg-[var(--color-background)]/50 p-4 rounded-xl border border-[var(--color-border)] text-left">
                <input 
                  type="checkbox" 
                  id="streamer-mode-opt" 
                  checked={streamerMode} 
                  onChange={(e) => setStreamerMode(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-val-red)] focus:ring-[var(--color-val-red)] focus:ring-offset-[var(--color-surface)]"
                />
                <label htmlFor="streamer-mode-opt" className="text-xs text-[var(--color-text-secondary)] leading-relaxed cursor-pointer">
                  <strong className="text-[var(--color-text-primary)] block mb-1">{"Activer le Mode Streamer"}</strong>
                  {"Masque automatiquement votre pseudo et tag public pour préserver votre anonymat lors de vos diffusions en direct ou vidéos."}
                </label>
              </div>

              {/* Connect Riot Button */}
              <button
                type="button"
                onClick={handleNext}
                className="w-full max-w-md py-4 bg-[var(--color-val-red)] hover:bg-[#ff5a67] text-white font-black uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(255,70,85,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer mb-4 text-xs sm:text-sm"
              >
                <RiotGamesLogo className="w-5 h-5 flex-shrink-0" />
                <span>{"Connecter mon compte Riot (Bientôt disponible)"}</span>
              </button>

              {/* Link / Button below: Passer cette étape */}
              <button
                type="button"
                onClick={handleNext}
                className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-4 transition-colors cursor-pointer"
              >
                {"Passer cette étape"}
              </button>
            </div>

            {/* Navigation button: Retour & Suivant */}
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>{tr("Retour")}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-[var(--color-val-red)] hover:bg-[#ff5a67] text-white font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,70,85,0.4)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <span>{"Étape Suivante : Conservation des Données"}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 - CONSERVATION ET RÉTENTION DES DONNÉES (ANTI-RATE LIMITS RIOT & HISTORIQUE INFINI) */}
        {currentStep === 4 && (
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/30 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-val-red)] mb-3">
              <span>🛡️ Protection API Riot & Historique Cumulé</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[var(--color-text-primary)] mb-2">
              {"Conservation & Historique de Matchs"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-6 max-w-xl leading-relaxed">
              {"Soulagez l'API Riot Games et évitez les rate limits (erreurs 429). SGS Tracker peut sauvegarder et cumuler votre historique de match à l'infini sur nos serveurs sécurisés Neon DB afin de ne jamais perdre vos parties au-delà des 10 à 15 matchs imposés par Riot."}
            </p>

            {/* Consent Toggle Card */}
            <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/30 flex items-center justify-center text-xl">
                  💾
                </div>
                <div>
                  <div className="font-black text-sm text-[var(--color-text-primary)]">
                    Sauvegarder et cumuler mon historique sur Neon DB
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">
                    Allonge l'historique de matchs à l'infini et soulage les quotas d'API Riot.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={consentRetention}
                  onChange={(e) => setConsentRetention(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-val-red)]"></div>
              </label>
            </div>

            {/* Explanatory Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-6 text-left">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-2">
                <div className="text-xl">⚡</div>
                <div className="text-xs font-black uppercase text-[var(--color-text-primary)] tracking-wide">
                  Anti-Rate Limits (429)
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  Requêtes allégées : vos parties passées sont servies instantanément depuis Neon sans saturer Riot.
                </div>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-2">
                <div className="text-xl">♾️</div>
                <div className="text-xs font-black uppercase text-[var(--color-text-primary)] tracking-wide">
                  Historique Cumulé Infini
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  Riot limite l'accès aux 10-15 derniers matchs. SGS Tracker conserve vos parties sur la durée choisie.
                </div>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-2">
                <div className="text-xl">📍</div>
                <div className="text-xs font-black uppercase text-[var(--color-text-primary)] tracking-wide">
                  Télémétrie & Spikes
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  Cartographie des poses, sorts utilisés et ping moyen pour calculer vos heatmaps et scores SPI.
                </div>
              </div>
            </div>

            {/* Retention Selector Options */}
            <div className={`w-full mb-8 text-left transition-opacity ${consentRetention ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <label className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)] block mb-3">
                {"Durée de conservation souhaitée sur le serveur Neon :"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  {
                    id: '30_days',
                    title: '30 Jours',
                    desc: '~1 mois de parties. Idéal pour garder uniquement vos matchs récents.',
                  },
                  {
                    id: '1_season',
                    title: '1 Saison en cours',
                    desc: '~90 jours. Idéal pour garder des statistiques fraîches sans surcharger votre profil.',
                    badge: 'Recommandé',
                  },
                  {
                    id: '1_year',
                    title: '1 An complet',
                    desc: '365 jours de données archivées pour un suivi longitudinal approfondi.',
                  },
                  {
                    id: 'forever',
                    title: 'À l\'infini / Illimité',
                    desc: 'Toutes vos parties restent archivées sans aucune suppression automatique.',
                    badge: 'Infini',
                  },
                ].map((opt) => {
                  const isSelected = dataRetentionPolicy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDataRetentionPolicy(opt.id)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col text-left relative cursor-pointer ${
                        isSelected
                          ? 'border-[var(--color-val-red)] bg-[var(--color-val-red)]/10 shadow-[0_0_20px_rgba(255,70,85,0.25)]'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-sm text-[var(--color-text-primary)]">
                          {opt.title}
                        </span>
                        {opt.badge && (
                          <span className="text-[9px] font-black uppercase bg-[var(--color-val-red)] text-white px-2 py-0.5 rounded-full">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Duration Button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setDataRetentionPolicy('custom')}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer ${
                    dataRetentionPolicy === 'custom'
                      ? 'border-[var(--color-val-red)] bg-[var(--color-val-red)]/10'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)]/40'
                  }`}
                >
                  <div>
                    <span className="font-black text-sm text-[var(--color-text-primary)] block">
                      Durée personnalisée
                    </span>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      Définissez vous-même le nombre exact de jours de rétention.
                    </span>
                  </div>
                  {dataRetentionPolicy === 'custom' && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        min="7"
                        max="730"
                        value={dataRetentionCustomDays}
                        onChange={(e) => setDataRetentionCustomDays(Math.max(7, parseInt(e.target.value) || 30))}
                        className="w-20 px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-bold text-center text-white focus:border-[var(--color-val-red)] focus:outline-none"
                      />
                      <span className="text-xs font-bold text-[var(--color-text-secondary)]">jours</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl w-full">
                {error}
              </div>
            )}

            {/* Navigation buttons: Retour & Terminer */}
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>{tr("Retour")}</span>
              </button>

              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-[var(--color-val-red)] hover:bg-[#ff5a67] text-white font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(255,70,85,0.5)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{"Valider & Accéder au Tracker"}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Inline Keyframes CSS for Slide Transitions */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(35px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-35px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-slide-right {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-left {
          animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0e13] text-white">
        <div className="w-14 h-14 bg-[#ff4655] rounded-2xl flex items-center justify-center font-black text-2xl animate-pulse mb-3">V</div>
        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Chargement...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
