
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  Settings,
  LogOut
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { LanguageProvider, useTranslation } from "./components/utils/i18n";

function LayoutContent({ children }) {
  const location = useLocation();

  // ✅ Routes 100% publiques
  const PUBLIC_PREFIXES = ['/rent', '/rentdetails', '/garage'];

  const navRef = useRef(null);
  const effectFilterRef = useRef(null);
  const effectTextRef = useRef(null);

  const { t } = useTranslation();

  // ✅ Détection robuste de pages publiques (évite "garages-xxx", etc.)
  const pathname = location.pathname.toLowerCase();
  const isPublicPage = PUBLIC_PREFIXES.some(p => pathname.startsWith(p));

  const navigationItems = [
    {
      title: t('nav_dashboard'),
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard
    },
    {
      title: t('nav_vehicles'),
      url: createPageUrl("Vehicles"),
      icon: Car
    },
    {
      title: t('nav_clients'),
      url: createPageUrl("Clients"),
      icon: Users
    },
    {
      title: t('nav_reservations'),
      url: createPageUrl("Reservations"),
      icon: Calendar
    },
    {
      title: t('nav_settings'),
      url: createPageUrl("Settings"),
      icon: Settings,
      adminOnly: true
    }
  ];

  // Appeler tous les hooks AVANT tout early return
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: !isPublicPage,              // ❗ aucune requête d’auth sur pages publiques
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    onError: (error) => {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      // ❗ Jamais de redirection si page publique
      if (isPublicPage) return;
      if (!location.pathname.includes('Auth') && !location.pathname.includes('Onboarding')) {
        window.location.href = createPageUrl("Auth");
      }
    }
  });

  const { data: organization, isLoading: organizationLoading } = useQuery({
    queryKey: ['organization', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return null;
      const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
      return orgs.length > 0 ? orgs[0] : null;
    },
    enabled: !!user?.organization_id && !isPublicPage,   // ❗ rien côté public
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const isAdmin = user?.organization_role === 'admin';
  const visibleNavigationItems = navigationItems.filter((item) =>
    !item.adminOnly || isAdmin
  );

  useEffect(() => {
    // ✅ Sur page publique, ne jamais vérifier ni rediriger
    if (isPublicPage || userLoading) return;

    if (location.pathname.includes('Auth') || location.pathname.includes('Onboarding')) {
      return;
    }

    if (!user) {
      console.log("[Layout] Pas d'utilisateur -> Auth");
      window.location.href = createPageUrl("Auth");
      return;
    }

    const pendingToken = sessionStorage.getItem('pending_invite_token');
    if (pendingToken) {
      console.log("[Layout] Token d'invitation en attente, redirection vers Auth");
      window.location.href = createPageUrl("Auth");
      return;
    }

    if (!user.organization_id) {
      console.log("[Layout] Utilisateur sans organisation -> Onboarding");
      window.location.href = createPageUrl("Onboarding");
      return;
    }

  }, [user, userLoading, location.pathname, isPublicPage]);

  useEffect(() => {
    // ❗ Pas d’effet de particules sur pages publiques
    if (isPublicPage) return;
    if (navRef.current && effectFilterRef.current && effectTextRef.current) {
      initParticleEffect();
    }
  }, [location.pathname, isPublicPage]);

  // ✅ Early return pour pages publiques AVANT tout rendu de layout privé
  if (isPublicPage) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    base44.auth.logout();
    window.location.href = createPageUrl("Auth");
  };

  const initParticleEffect = () => {
    const nav = navRef.current;
    const effectEl = effectFilterRef.current;
    const textEl = effectTextRef.current;

    if (!nav || !effectEl || !textEl) return;

    let animationTime = 600;
    let pCount = 15;
    const colors = [1, 2, 3, 1, 2, 3, 1, 4];
    const timeVariance = 300;

    function noise(n = 1) {
      return n / 2 - Math.random() * n;
    }

    function getXY(distance, pointIndex, totalPoints) {
      const x = distance * Math.cos((360 + noise(8)) / totalPoints * pointIndex * Math.PI / 180);
      const y = distance * Math.sin((360 + noise(8)) / totalPoints * pointIndex * Math.PI / 180);
      return [x, y];
    }

    function makeParticles($el) {
      const d = [90, 10];
      const r = 100;

      const bubbleTime = animationTime * 2 + timeVariance;
      $el.style.setProperty('--time', bubbleTime + 'ms');

      for (let i = 0; i < pCount; i++) {
        const t = animationTime * 2 + noise(timeVariance * 2);
        const p = createParticle(i, t, d, r);
        const $place = $el;
        if ($place) {
          $place.classList.remove('active');
          setTimeout(() => {
            const $particle = document.createElement('span');
            const $point = document.createElement('span');
            $particle.classList.add('particle');
            $particle.style = `
              --start-x: ${p.start[0]}px;
              --start-y: ${p.start[1]}px;
              --end-x: ${p.end[0]}px;
              --end-y: ${p.end[1]}px;
              --time: ${p.time}ms;
              --scale: ${p.scale};
              --color: var(--color-${p.color}, white);
              --rotate: ${p.rotate}deg;
            `;
            $point.classList.add('point');
            $particle.append($point);
            $place.append($particle);
            requestAnimationFrame(() => {
              $place.classList.add('active');
            });
            setTimeout(() => {
              try {
                $place.removeChild($particle);
              } catch (e) {}
            }, t);
          }, 30);
        }
      }
    }

    function createParticle(i, t, d, r) {
      let rotate = noise(r / 10);
      let minDistance = d[0];
      let maxDistance = d[1];
      return {
        start: getXY(minDistance, pCount - i, pCount),
        end: getXY(maxDistance + noise(7), pCount - i, pCount),
        time: t,
        scale: 1 + noise(0.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
      };
    }

    function updateEffectPosition(element) {
      const pos = element.getBoundingClientRect();
      const styles = {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${pos.width}px`,
        height: `${pos.height}px`
      };

      Object.assign(effectEl.style, styles);
      Object.assign(textEl.style, styles);
      textEl.classList.remove('hidden');
      textEl.innerText = element.innerText;
    }

    const activate = ($el) => {
      updateEffectPosition($el);

      if (!$el.classList.contains('active-nav')) {
        nav.querySelectorAll('.nav-item').forEach(($item) => {
          $item.classList.remove('active-nav');
        });
        effectEl.querySelectorAll('.particle').forEach(($particle) => {
          try {
            effectEl.removeChild($particle);
          } catch (e) {}
        });
        $el.classList.add('active-nav');
        textEl.classList.remove('active');

        setTimeout(() => {
          textEl.classList.add('active');
        }, 100);

        makeParticles(effectEl);
      }
    };

    const activeItem = nav.querySelector(`[href="${location.pathname}"]`)?.parentElement;
    if (activeItem) {
      setTimeout(() => {
        activate(activeItem);
      }, 200);
    }

    const resizeObserver = new ResizeObserver(() => {
      const activeEl = nav.querySelector('.active-nav');
      if (activeEl) {
        updateEffectPosition(activeEl);
      }
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  };

  // Si Onboarding/Auth ou chargement user, on affiche juste le contenu (pas le layout privé)
  if (userLoading || location.pathname.includes('Onboarding') || location.pathname.includes('Auth')) {
    return <>{children}</>;
  }

  const logoUrl = organization?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex flex-col">
      {/* SVG Filter for Glass Distortion */}
      <svg style={{ display: 'none' }}>
        <filter id="glass-distortion">
          <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="77" />
        </filter>
      </svg>

      <style jsx global>{`
        /* Liquid Glass Design System */
        :root {
          --radius: 24px;
          --color-1: rgba(139, 92, 246, 0.8);
          --color-2: rgba(99, 102, 241, 0.8);
          --color-3: rgba(59, 130, 246, 0.8);
          --color-4: rgba(147, 51, 234, 0.8);
        }

        body {
          padding-bottom: env(safe-area-inset-bottom);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes liquidGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          box-shadow:
            0 8px 32px 0 rgba(31, 38, 135, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.5) inset,
            0 2px 4px 0 rgba(255, 255, 255, 0.6) inset;
        }

        .glass-card-dark {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
        }

        .glass-button {
          position: relative;
          padding: 14px 28px;
          border-radius: 9999px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          letter-spacing: -0.01em;
          box-shadow:
            0 8px 32px rgba(31, 38, 135, 0.15),
            0 2px 8px rgba(255, 255, 255, 0.3) inset,
            0 -2px 8px rgba(0, 0, 0, 0.05) inset;
        }

        .glass-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 40px rgba(31, 38, 135, 0.2),
            0 2px 8px rgba(255, 255, 255, 0.4) inset,
            0 -2px 8px rgba(0, 0, 0, 0.05) inset;
        }

        .glass-button:active {
          transform: translateY(0);
        }

        .glass-filter {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.2) 100%
          );
          filter: url(#glass-distortion);
          opacity: 0.6;
          mix-blend-mode: overlay;
        }

        .glass-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.2) 100%
          );
          opacity: 0.8;
        }

        .glass-specular {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0) 100%
          );
          opacity: 0.6;
          border-radius: 9999px 9999px 0 0;
        }

        .glass-content {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .effect {
          position: fixed;
          z-index: 40;
          pointer-events: none;
          transition: all 0.3s ease-out;
        }

        .effect.filter {
          overflow: visible;
        }

        .effect.text {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 9px;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          opacity: 0;
          transform: scale(0.9);
          transition: all 0.2s ease;
        }

        .effect.text.active {
          opacity: 1;
          transform: scale(1);
        }

        .effect.text.hidden {
          display: none;
        }

        .particle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%) translate(var(--start-x), var(--start-y)) scale(0) rotate(var(--rotate));
          opacity: 0;
        }

        .effect.active .particle {
          animation: particleMove var(--time) ease-out forwards;
        }

        @keyframes particleMove {
          0% {
            transform: translate(-50%, -50%) translate(var(--start-x), var(--start-y)) scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--end-x), var(--end-y)) scale(var(--scale)) rotate(var(--rotate));
            opacity: 0;
          }
        }

        .particle .point {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--color);
          box-shadow: 0 0 10px var(--color);
        }

        .rounded-xl, .rounded-2xl, .rounded-3xl {
          border-radius: 24px !important;
        }

        input, textarea, select {
          background: rgba(255, 255, 255, 0.6) !important;
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255, 255, 255, 0.5) !important;
          border-radius: 16px !important;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        input:focus, textarea:focus, select:focus {
          background: rgba(255, 255, 255, 0.8) !important;
          border-color: rgba(99, 102, 241, 0.5) !important;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
          transform: translateY(-1px);
        }

        .badge {
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 9999px !important;
        }

        .shadow-lg {
          box-shadow:
            0 10px 40px -10px rgba(99, 102, 241, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.3) inset;
        }

        .shadow-xl {
          box-shadow:
            0 20px 50px -15px rgba(99, 102, 241, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.4) inset;
        }

        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }

        .glow-effect {
          box-shadow:
            0 0 20px rgba(99, 102, 241, 0.2),
            0 0 40px rgba(99, 102, 241, 0.1);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .float-animation {
          animation: float 6s ease-in-out infinite;
        }

        .shine-effect {
          position: relative;
          overflow: hidden;
        }

        .shine-effect::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          transform: rotate(45deg);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      `}</style>

      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/20 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt={t('logo_alt')}
              className="w-10 h-10 rounded-xl shadow-md" />

            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {t('app_name')}
              </h1>
              {organization?.name &&
                <p className="text-xs text-slate-500 dark:text-slate-400">{organization.name}</p>
              }
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex items-center space-x-6">
            {visibleNavigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                              ${isActive ?
                    'bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm' :
                    'text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'}`
                  }>

                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.title}</span>
                </Link>);

            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">{t('logout')}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden mt-4 mx-4 px-4 py-2.5 rounded-[100px] glass-card sticky top-0 z-50 border-b-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {organization?.logo_url ?
              <div className="relative">
                <img
                  src={organization.logo_url}
                  alt={t('logo_alt')}
                  className="w-10 h-10 object-cover rounded-full shadow-lg ring-2 ring-white/50"
                  loading="lazy" />

                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
              </div> :

              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 shine-effect">
                <Car className="w-5 h-5 text-white" />
              </div>
            }
            <div>
              <h1 className="font-bold text-slate-800 text-base tracking-tight dark:text-slate-100">
                {organization?.name || t('app_name')}
              </h1>
              <p className="text-[10px] text-slate-500 font-medium dark:text-slate-300">{t('mobile_subtitle')}</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 glass-card-dark rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
            <span className="text-[10px] text-slate-700 font-semibold dark:text-slate-900">{t('status_online')}</span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 px-2 md:px-0">
        <div className="min-h-full max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Particle Effect Elements */}
      <div ref={effectFilterRef} className="effect filter"></div>
      <div ref={effectTextRef} className="effect text hidden"></div>

      {/* Bottom Navigation - Mobile */}
      <nav ref={navRef} className="md:hidden fixed bottom-4 left-4 right-4 glass-card z-50 rounded-[28px] shadow-2xl">
        <div className="px-1 py-1.5 rounded-[100px] flex items-center justify-around active-nav">
          {visibleNavigationItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className="nav-item relative flex flex-col items-center justify-center px-2 py-1 rounded-2xl transition-all duration-300 min-w-0 flex-1 group">

                <item.icon className="w-5 h-5 mb-0.5 flex-shrink-0 transition-all duration-300 relative z-10 
             text-slate-500 dark:text-slate-100 
             group-hover:text-indigo-500 group-hover:scale-105"
                  strokeWidth={isActive ? 2.5 : 2} />

                <span className="text-[8px] font-semibold leading-tight text-center truncate w-full transition-all duration-300 relative z-10 text-slate-500 group-hover:text-indigo-500 dark:text-slate-100">
                  {item.title}
                </span>
              </Link>);

          })}
        </div>
      </nav>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}

