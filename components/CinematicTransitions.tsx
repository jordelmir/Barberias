import React, { useEffect, useState } from 'react';
import { Role } from '../types';
import { Crown, Scissors, Gem, Zap } from 'lucide-react';

interface CinematicTransitionsProps {
    type: 'LOGIN' | 'LOGOUT';
    profile?: Role;
    userName?: string;
    onComplete?: () => void;
}

export const CinematicTransitions: React.FC<CinematicTransitionsProps> = ({ type, profile, userName, onComplete }) => {
    const [phase, setPhase] = useState<'INIT' | 'REVEAL' | 'EXIT'>('INIT');

    useEffect(() => {
        // Sequence Timing
        const timer1 = setTimeout(() => setPhase('REVEAL'), 500); // Start Reveal
        const timer2 = setTimeout(() => setPhase('EXIT'), 4000); // Start Exit (Fade out)

        // Total Duration 5500ms
        const timer3 = setTimeout(() => {
            if (onComplete) onComplete();
        }, 5500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    // --- LOGOUT ANIMATION (TV TURN OFF Effect) ---
    if (type === 'LOGOUT') {
        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
                {/* 1. The White Line Flash (The collapsed CRT beam) */}
                <div className="absolute w-full h-[2px] bg-white animate-tv-line-flash z-50 shadow-[0_0_50px_rgba(255,255,255,0.8)]" />

                {/* 2. The Final Black Screen (Fades in slightly delayed to hide the collapsed app) */}
                <div className="absolute inset-0 bg-black animate-fade-in-delayed z-40" style={{ animationDelay: '0.5s', animationDuration: '0.2s', animationFillMode: 'forwards' }} />
            </div>
        );
    }

    // --- LOGIN ANIMATIONS ---

    // Theme Config based on Role
    const getTheme = () => {
        switch (profile) {
            case Role.ADMIN:
                return {
                    bg: 'bg-black',
                    accent: 'text-brand-500', // Gold
                    gradient: 'from-brand-500/20 to-transparent',
                    icon: <Crown size={80} strokeWidth={1} className="animate-spin-slow-3d text-brand-500 drop-shadow-[0_0_25px_rgba(240,180,41,0.8)]" />,
                    title: 'S Y S T E M   A U T H O R I T Y',
                    subtitle: 'The Architect',
                    particleColor: '#F0B429'
                };
            case Role.BARBER:
                return {
                    bg: 'bg-[#0f0f0f]',
                    accent: 'text-amber-600', // Bronze/Amber
                    gradient: 'from-amber-600/20 to-transparent',
                    icon: <Scissors size={80} strokeWidth={1} className="animate-pulse-slow text-amber-500 drop-shadow-[0_0_25px_rgba(217,119,6,0.8)] transform -rotate-45" />,
                    title: 'M A S T E R   B A R B E R',
                    subtitle: 'The Artisan',
                    particleColor: '#D97706'
                };
            case Role.CLIENT:
            default:
                return {
                    bg: 'bg-white', // LUXURY WHITE THEME
                    accent: 'text-black', // High Contrast
                    gradient: 'from-gray-200 to-transparent',
                    icon: <Gem size={80} strokeWidth={1} className="animate-float text-black drop-shadow-[0_0_25px_rgba(0,0,0,0.3)]" />,
                    title: 'P R E M I U M   E X P E R I E N C E',
                    subtitle: 'The VIP Guest',
                    particleColor: '#000000'
                };
        }
    };

    const theme = getTheme();
    const isClient = profile === Role.CLIENT;

    return (
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${theme.bg} ${phase === 'EXIT' ? 'opacity-0' : 'opacity-100'}`}>

            {/* Background Effects */}
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${theme.gradient} animate-pulse-slow`}></div>

            {/* Spotlight Beam */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full ${isClient ? 'bg-gradient-to-b from-black/20 via-black/5 to-transparent' : 'bg-gradient-to-b from-brand-500/0 via-brand-500/20 to-brand-500/0'} opacity-50`}></div>

            {/* Main Content */}
            <div className={`relative z-10 flex flex-col items-center justify-center scale-100 transition-transform duration-[3000ms] ease-out ${phase === 'INIT' ? 'scale-95 blur-sm' : 'scale-100 blur-0'}`}>

                {/* ICON */}
                <div className="mb-12 relative">
                    <div className={`absolute inset-0 ${isClient ? 'bg-black' : 'bg-brand-500'} blur-[60px] opacity-20 animate-pulse`}></div>
                    {theme.icon}
                </div>

                {/* TEXT REVEAL */}
                <div className="overflow-hidden mb-4">
                    <h1 className={`${isClient ? 'text-black' : 'text-white'} text-3xl md:text-5xl font-black tracking-[0.5em] uppercase transform transition-all duration-1000 ${phase === 'REVEAL' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        {theme.title}
                    </h1>
                </div>

                {/* USERNAME & ROLE */}
                <div className="overflow-hidden">
                    <div className={`flex flex-col items-center gap-2 transform transition-all duration-1000 delay-300 ${phase === 'REVEAL' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div className={`w-12 h-[1px] ${isClient ? 'bg-black' : 'bg-brand-500'} mb-4`}></div>
                        <p className={`${isClient ? 'text-gray-500' : 'text-gray-400'} text-sm uppercase tracking-[0.3em] font-medium`}>
                            {theme.subtitle}
                        </p>
                        {userName && (
                            <p className={`${theme.accent} text-xl md:text-2xl font-serif italic tracking-wide`}>
                                {userName}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Cinematic Borders (Letterbox) */}
            <div className="absolute top-0 left-0 w-full h-[10vh] bg-black z-20 transition-transform duration-1000 delay-100 origin-top transform scale-y-100"></div>
            <div className="absolute bottom-0 left-0 w-full h-[10vh] bg-black z-20 transition-transform duration-1000 delay-100 origin-bottom transform scale-y-100"></div>

        </div>
    );
};
