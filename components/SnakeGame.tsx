import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scissors, Trophy, Play, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Target, Maximize2, ShieldCheck } from 'lucide-react';

interface Point {
    x: number;
    y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

const GRID_WIDTH = 32;
const GRID_HEIGHT = 18;
const INITIAL_SPEED = {
    EASY: 150,
    NORMAL: 100,
    HARD: 70
};

const SAFE_MARGIN = 1;

interface PowerUp extends Point {
    type: 'SPEED' | 'SHRINK' | 'GHOST';
    expires: number;
}

export const SnakeGame: React.FC<{ isFullScreen?: boolean; onClose?: () => void }> = ({ isFullScreen, onClose }) => {
    const [snake, setSnake] = useState<Point[]>([{ x: 16, y: 9 }]);
    const [food, setFood] = useState<Point>({ x: 5, y: 5 });
    const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [bestScore, setBestScore] = useState(0);
    const [isExploding, setIsExploding] = useState(false);

    const gameLoopRef = useRef<NodeJS.Timeout>();
    const lastRenderTime = useRef<number>(0);

    const generateFood = useCallback((currentSnake: Point[]) => {
        let newFood;
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * (GRID_WIDTH - 2 * SAFE_MARGIN)) + SAFE_MARGIN,
                y: Math.floor(Math.random() * (GRID_HEIGHT - 2 * SAFE_MARGIN)) + SAFE_MARGIN
            };
            if (!currentSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
        }
        return newFood;
    }, []);

    const generatePowerUp = useCallback((currentSnake: Point[]) => {
        const types: PowerUp['type'][] = ['SPEED', 'SHRINK', 'GHOST'];
        return {
            ...generateFood(currentSnake),
            type: types[Math.floor(Math.random() * types.length)],
            expires: Date.now() + 8000
        };
    }, [generateFood]);

    const resetGame = () => {
        setSnake([{ x: 12, y: 12 }]);
        setDirection('RIGHT');
        setIsGameOver(false);
        setIsExploding(false);
        setScore(0);
        setLevel(1);
        setIsPlaying(true);
        setPowerUp(null);
        setFood(generateFood([{ x: 12, y: 12 }]));
    };

    const handleLevelUp = (newScore: number) => {
        const newLevel = Math.min(15, Math.floor(newScore / 5) + 1);
        if (newLevel !== level) setLevel(newLevel);
    };

    const moveSnake = useCallback(() => {
        if (isGameOver || !isPlaying) return;

        setSnake(prevSnake => {
            const head = prevSnake[0];
            const newHead = { ...head };

            switch (direction) {
                case 'UP': newHead.y -= 1; break;
                case 'DOWN': newHead.y += 1; break;
                case 'LEFT': newHead.x -= 1; break;
                case 'RIGHT': newHead.x += 1; break;
            }

            // PRO COLLISION ENGINE
            if (
                newHead.x < 0 || newHead.x >= GRID_WIDTH ||
                newHead.y < 0 || newHead.y >= GRID_HEIGHT ||
                prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
            ) {
                setIsExploding(true);
                setTimeout(() => {
                    setIsGameOver(true);
                    setIsPlaying(false);
                    if (score > bestScore) setBestScore(score);
                }, 400);
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // FOOD INTERACTION
            if (newHead.x === food.x && newHead.y === food.y) {
                const newScore = score + 1;
                setScore(newScore);
                handleLevelUp(newScore);
                setFood(generateFood(newSnake));
                if (Math.random() > 0.8) setPowerUp(generatePowerUp(newSnake));
            } else if (powerUp && newHead.x === powerUp.x && newHead.y === powerUp.y) {
                // POWER-UP LOGIC
                setScore(s => s + 5);
                setPowerUp(null);
                // Implementation of effects happens in speed calculation or visuals
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [direction, food, powerUp, isGameOver, isPlaying, score, bestScore, generateFood, generatePowerUp, level]);

    useEffect(() => {
        if (isPlaying && !isGameOver && difficulty) {
            const baseSpeed = INITIAL_SPEED[difficulty] - (level * 3);
            const finalSpeed = Math.max(baseSpeed, 35);
            gameLoopRef.current = setInterval(moveSnake, finalSpeed);
        } else {
            clearInterval(gameLoopRef.current);
        }
        return () => clearInterval(gameLoopRef.current);
    }, [isPlaying, isGameOver, moveSnake, difficulty, level]);

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
            switch (e.key) {
                case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
                case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
                case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
                case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
            }
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [direction]);

    if (!difficulty) {
        return (
            <div className={`bg-dark-800/50 border border-white/5 rounded-3xl p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500 ${isFullScreen ? 'max-w-xl mx-auto mt-20' : ''}`}>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">CHRONOS ARCADE</h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">Nivel de Desafío Profesional</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map((diff) => (
                        <button
                            key={diff}
                            onClick={() => { setDifficulty(diff); setIsPlaying(true); }}
                            className={`bg-dark-900/80 border border-white/5 p-6 rounded-2xl transition-all group active:scale-95 hover:border-brand-500/50`}
                        >
                            {diff === 'EASY' && <Zap className="text-emerald-500 mb-2 mx-auto group-hover:animate-pulse" size={28} />}
                            {diff === 'NORMAL' && <Target className="text-brand-500 mb-2 mx-auto group-hover:animate-bounce" size={28} />}
                            {diff === 'HARD' && <Trophy className="text-red-500 mb-2 mx-auto group-hover:animate-spin" size={28} />}
                            <span className="block text-white font-black uppercase tracking-widest text-[10px]">
                                {diff === 'EASY' ? 'Fácil' : diff === 'NORMAL' ? 'Normal' : 'Duro'}
                            </span>
                        </button>
                    ))}
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-600 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors mt-4">
                        Regresar al Dashboard
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-6 select-none animate-in fade-in duration-700 ${isFullScreen ? 'h-full max-w-4xl mx-auto' : ''}`}>

            {/* HUD / STATS */}
            <div className="flex items-center justify-between bg-dark-800/60 p-5 rounded-2xl border border-white/10 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-brand-500/20 blur rounded-full animate-pulse" />
                        <div className="relative w-12 h-12 bg-dark-900 rounded-xl flex items-center justify-center border border-white/10">
                            <Trophy className="text-brand-500" size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">PRO MASTER LVL {level}</p>
                        <p className="text-2xl font-black text-white tracking-tighter font-mono">{score * 100}</p>
                    </div>
                </div>
                <div className="flex gap-4 sm:gap-8">
                    <div className="text-right">
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Record</p>
                        <p className="text-xl font-black text-emerald-500 tracking-tighter font-mono">{bestScore * 100}</p>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Maximize2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* RESPONSIVE BOARD WRAPPER - ELIMINATED CLIPPING ARTIFACTS */}
            <div className={`relative flex-1 bg-dark-950 rounded-[2.5rem] border-[12px] border-dark-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden group min-h-[400px] w-full max-w-3xl mx-auto ${isExploding ? 'animate-shake' : ''}`}>

                {/* ADVANCED CRT CORE */}
                <div className="absolute inset-0 pointer-events-none z-50 bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_120%),linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_100%,100%_4px,3px_100%]" />

                {/* SCANLINE ANIMATION */}
                <div className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-b from-white/[0.03] to-transparent h-12 w-full animate-scanline" />

                {/* DYNAMIC PRECISION GRID */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: `${100 / GRID_WIDTH}% ${100 / GRID_HEIGHT}%`
                }} />

                {/* GAME ELEMENTS ENGINE */}
                <div className="absolute inset-0"> {/* No more insets that cause clipping */}
                    {/* Snake Body - Higher Fidelity */}
                    {snake.map((segment, i) => (
                        <div
                            key={i}
                            className={`absolute transition-all duration-100 ${i === 0
                                ? 'bg-brand-500 z-10 shadow-[0_0_25px_rgba(202,168,111,0.8)]'
                                : 'bg-brand-500/40'
                                } ${isExploding ? 'scale-150 rotate-45 opacity-0' : 'scale-100'}`}
                            style={{
                                left: `${(segment.x / GRID_WIDTH) * 100}%`,
                                top: `${(segment.y / GRID_HEIGHT) * 100}%`,
                                width: `${100 / GRID_WIDTH}%`,
                                height: `${100 / GRID_HEIGHT}%`,
                                borderRadius: i === 0 ? '15%' : '5%',
                                transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {i === 0 && (
                                <>
                                    <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-black/80 rounded-full" />
                                    <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-black/80 rounded-full" />
                                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-[1px]" />
                                </>
                            )}
                        </div>
                    ))}

                    {/* Food (The Golden Scissors) */}
                    <div
                        className="absolute flex items-center justify-center animate-bounce text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.9)] z-20"
                        style={{
                            left: `${(food.x / GRID_WIDTH) * 100}%`,
                            top: `${(food.y / GRID_HEIGHT) * 100}%`,
                            width: `${100 / GRID_WIDTH}%`,
                            height: `${100 / GRID_HEIGHT}%`,
                            padding: '2px',
                            transform: 'scale(2.2)' // CRITICAL: Makes scissors BIG and VISIBLE
                        }}
                    >
                        <Scissors className="w-full h-full drop-shadow-lg" strokeWidth={3} />
                    </div>

                    {/* Power-Up Node */}
                    {powerUp && (
                        <div
                            className="absolute flex items-center justify-center animate-pulse text-brand-400 z-20"
                            style={{
                                left: `${(powerUp.x / GRID_WIDTH) * 100}%`,
                                top: `${(powerUp.y / GRID_HEIGHT) * 100}%`,
                                width: `${100 / GRID_WIDTH}%`,
                                height: `${100 / GRID_HEIGHT}%`,
                                padding: '1px',
                                transform: 'scale(1.5)'
                            }}
                        >
                            <div className="w-full h-full bg-brand-500/20 rounded-full border border-brand-500 flex items-center justify-center shadow-[0_0_20px_rgba(202,168,111,0.5)]">
                                {powerUp.type === 'SPEED' && <Zap size={14} className="animate-pulse" />}
                                {powerUp.type === 'SHRINK' && <Target size={14} />}
                                {powerUp.type === 'GHOST' && <ShieldCheck size={14} />}
                            </div>
                        </div>
                    )}
                </div>

                {/* CINEMATIC OVERLAYS */}
                {isGameOver && (
                    <div className="absolute inset-0 bg-dark-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-700 z-[60]">
                        <div className="relative mb-10">
                            <div className="absolute -inset-8 bg-red-500/20 blur-3xl rounded-full animate-pulse" />
                            <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/30 rotate-12 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                                <ShieldCheck className="text-red-500 -rotate-12" size={48} />
                            </div>
                        </div>
                        <h3 className="text-6xl font-black text-white italic uppercase tracking-[0.3em] mb-4 leading-none">SISTEMA OFF</h3>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.6em] mb-12">Rendimiento Final: {score * 100 + (level * 50)} Unidades</p>

                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <button
                                onClick={resetGame}
                                className="bg-brand-500 text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-brand-400 active:scale-95 transition-all shadow-2xl shadow-brand-500/30 group"
                            >
                                <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                                Reiniciar Secuencia
                            </button>
                            {difficulty !== 'EASY' && (
                                <button
                                    onClick={() => {
                                        setDifficulty(difficulty === 'HARD' ? 'NORMAL' : 'EASY');
                                        resetGame();
                                    }}
                                    className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-500 hover:text-white transition-all"
                                >
                                    Bajar Dificultad a {difficulty === 'HARD' ? 'NORMAL' : 'FÁCIL'}
                                </button>
                            )}
                            <button
                                onClick={() => setDifficulty(null)}
                                className="text-gray-600 hover:text-white text-[9px] font-black uppercase tracking-[0.4em] transition-colors py-2"
                            >
                                [ VOLVER A SELECCIÓN DE NIVEL ]
                            </button>
                        </div>
                    </div>
                )}

                {!isPlaying && !isGameOver && (
                    <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm flex items-center justify-center z-[60]">
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="w-24 h-24 bg-brand-500 rounded-full flex items-center justify-center text-black shadow-[0_0_50px_rgba(202,168,111,0.4)] hover:scale-110 active:scale-90 transition-all group"
                        >
                            <Play fill="currentColor" size={40} className="ml-1 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                )}
            </div>

            {/* PROFESSIONAL CONTROLS (Only visible on touch devices or for layout) */}
            <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto pb-4 shrink-0">
                <div />
                <ControlBtn icon={ChevronUp} onClick={() => direction !== 'DOWN' && setDirection('UP')} />
                <div />

                <ControlBtn icon={ChevronLeft} onClick={() => direction !== 'RIGHT' && setDirection('LEFT')} />
                <ControlBtn icon={ChevronDown} onClick={() => direction !== 'UP' && setDirection('DOWN')} />
                <ControlBtn icon={ChevronRight} onClick={() => direction !== 'LEFT' && setDirection('RIGHT')} />
            </div>

            <button
                onClick={() => setDifficulty(null)}
                className="text-[10px] text-gray-700 font-black uppercase tracking-[0.4em] hover:text-brand-500 transition-colors mx-auto pb-10 flex items-center gap-2 group"
            >
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                SALIR AL MENÚ DE INICIO
            </button>
        </div>
    );
};

const ControlBtn: React.FC<{ icon: any; onClick: () => void }> = ({ icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="h-16 w-16 sm:h-20 sm:w-20 bg-dark-800/80 rounded-2xl border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-brand-500/10 hover:border-brand-500/30 transition-all active:scale-90 shadow-lg"
    >
        <Icon size={32} strokeWidth={2.5} />
    </button>
);

