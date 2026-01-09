
import React, { useEffect, useRef } from 'react';

// Léxico de Dominio Chronos Barber System
const SYSTEM_WORDS = [
    'CHRONOS', 'PRECISION', 'TIEMPO', 'ESTILO', 'FLUJO', 
    'MASTER', 'FADE', 'SHARP', 'CONTROL', 'ELITE',
    'DATA', 'OPTIMIZAR', 'CORTE', 'DESIGN', 'SYSTEM'
];

interface Column {
    x: number;
    y: number;
    speed: number;
    chars: string[];
    isWordActive: boolean;
    activeWord: string | null;
    wordCharIndex: number;
    color: string;
}

export const MatrixBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const columnsRef = useRef<Column[]>([]);
    const lastPulseRef = useRef<number>(Date.now());

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        let width = 0;
        let height = 0;
        
        // Caracteres técnicos + Katakana para estética High-Tech
        const matrixChars = '0123456789ABCDEF:.<>|/'.split('');
        const fontSize = 14; 

        // Paleta Chronos: Gold, White, Dark Gray
        const colors = [
            '#f0b429',   // Brand Gold
            '#ffffff',   // Pure Data
            '#4b5563'    // Gray Structure
        ];

        const initCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
            
            const columnCount = Math.ceil(width / (fontSize / 2)); // Alta densidad
            columnsRef.current = Array.from({ length: columnCount }, (_, i) => ({
                x: i * (fontSize / 2),
                y: Math.random() * (height / fontSize),
                speed: 0.05 + Math.random() * 0.15, // Velocidad controlada
                chars: matrixChars,
                isWordActive: false,
                activeWord: null,
                wordCharIndex: 0,
                color: colors[i % colors.length]
            }));
        };

        initCanvas();

        const triggerSystemPulse = () => {
            columnsRef.current.forEach(col => {
                if (Math.random() > 0.98) { 
                    col.isWordActive = true;
                    col.activeWord = SYSTEM_WORDS[Math.floor(Math.random() * SYSTEM_WORDS.length)];
                    col.wordCharIndex = 0;
                    col.speed = 0.03; 
                }
            });
        };

        const draw = () => {
            // Fondo oscuro profundo (#050505) con trail suave
            ctx.fillStyle = 'rgba(5, 5, 5, 0.18)'; 
            ctx.fillRect(0, 0, width, height);

            ctx.font = `bold ${fontSize}px "Fira Code", monospace`;
            ctx.textBaseline = 'top';

            const now = Date.now();
            // Pulso de palabras cada 90 segundos
            if (now - lastPulseRef.current > 90000) {
                triggerSystemPulse();
                lastPulseRef.current = now;
            }

            columnsRef.current.forEach((col) => {
                let char = '';
                
                if (col.isWordActive && col.activeWord) {
                    char = col.activeWord[col.wordCharIndex];
                    ctx.fillStyle = '#f0b429'; // Gold highlight para palabras
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(240, 180, 41, 0.5)';
                } else {
                    char = col.chars[Math.floor(Math.random() * col.chars.length)];
                    ctx.fillStyle = col.color;
                    ctx.shadowBlur = 0;
                    if (col.color === '#f0b429') {
                         ctx.shadowBlur = 4;
                         ctx.shadowColor = 'rgba(240, 180, 41, 0.3)';
                    }
                }

                // Opacidad técnica
                ctx.globalAlpha = col.isWordActive ? 1.0 : 0.15;
                ctx.fillText(char, col.x, col.y * fontSize);
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 0;

                col.y += col.speed;

                if (col.isWordActive) {
                    if (Math.random() > 0.90) {
                        col.wordCharIndex++;
                        if (col.wordCharIndex >= (col.activeWord?.length || 0)) {
                            col.isWordActive = false;
                            col.activeWord = null;
                            col.speed = 0.05 + Math.random() * 0.15;
                        }
                    }
                }

                if (col.y * fontSize > height) {
                    col.y = -1;
                    // Probabilidad baja de generar palabra al reiniciar ciclo
                    if (!col.isWordActive && Math.random() > 0.998) {
                        col.isWordActive = true;
                        col.activeWord = SYSTEM_WORDS[Math.floor(Math.random() * SYSTEM_WORDS.length)];
                        col.wordCharIndex = 0;
                        col.speed = 0.03;
                    }
                }
            });

            requestAnimationFrame(draw);
        };

        const animationId = requestAnimationFrame(draw);

        const handleResize = () => {
            initCanvas();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none bg-[#050505]">
            <canvas ref={canvasRef} className="absolute inset-0" />
            {/* Overlay para viñeta y textura scanline */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-80"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
        </div>
    );
};
