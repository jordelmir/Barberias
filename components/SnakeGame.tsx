import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scissors, Trophy, Play, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Target } from 'lucide-react';

interface Point {
    x: number;
    y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Difficulty = 'EASY' | 'NORMAL';

const GRID_SIZE = 20;
const INITIAL_SPEED = {
    EASY: 200,
    NORMAL: 120
};

export const SnakeGame: React.FC = () => {
    const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Point>({ x: 5, y: 5 });
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [bestScore, setBestScore] = useState(0);

    const gameLoopRef = useRef<NodeJS.Timeout>();

    const generateFood = useCallback((currentSnake: Point[]) => {
        let newFood;
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
            if (!onSnake) break;
        }
        return newFood;
    }, []);

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setDirection('RIGHT');
        setIsGameOver(false);
        setScore(0);
        setLevel(1);
        setIsPlaying(true);
        setFood(generateFood([{ x: 10, y: 10 }]));
    };

    const handleLevelUp = (newScore: number) => {
        const newLevel = Math.min(12, Math.floor(newScore / 5) + 1);
        if (newLevel !== level) {
            setLevel(newLevel);
        }
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

            // Boundary and self-collision checks
            if (
                newHead.x < 0 || newHead.x >= GRID_SIZE ||
                newHead.y < 0 || newHead.y >= GRID_SIZE ||
                prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
            ) {
                setIsGameOver(true);
                setIsPlaying(false);
                if (score > bestScore) setBestScore(score);
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Food collision
            if (newHead.x === food.x && newHead.y === food.y) {
                const newScore = score + 1;
                setScore(newScore);
                handleLevelUp(newScore);
                setFood(generateFood(newSnake));
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [direction, food, isGameOver, isPlaying, score, bestScore, generateFood, level]);

    useEffect(() => {
        if (isPlaying && !isGameOver && difficulty) {
            const speed = INITIAL_SPEED[difficulty] - (level * 5);
            gameLoopRef.current = setInterval(moveSnake, Math.max(speed, 50));
        } else {
            clearInterval(gameLoopRef.current);
        }
        return () => clearInterval(gameLoopRef.current);
    }, [isPlaying, isGameOver, moveSnake, difficulty, level]);

    const handleKeydown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
            case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
            case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
            case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [direction]);

    if (!difficulty) {
        return (
            <div className="bg-dark-800/50 border border-white/5 rounded-3xl p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Juegue mientras espera</h2>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Desbloquea los 12 niveles de maestría</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => { setDifficulty('EASY'); setIsPlaying(true); }}
                        className="bg-dark-900/80 border border-white/5 p-6 rounded-2xl hover:border-emerald-500/50 transition-all group active:scale-95"
                    >
                        <Zap className="text-emerald-500 mb-2 mx-auto group-hover:animate-pulse" size={32} />
                        <span className="block text-white font-black uppercase tracking-widest text-xs">Fácil</span>
                        <span className="text-[10px] text-gray-500 mt-1 block">Velocidad Relajada</span>
                    </button>
                    <button
                        onClick={() => { setDifficulty('NORMAL'); setIsPlaying(true); }}
                        className="bg-dark-900/80 border border-white/5 p-6 rounded-2xl hover:border-brand-500/50 transition-all group active:scale-95"
                    >
                        <Target className="text-brand-500 mb-2 mx-auto group-hover:animate-bounce" size={32} />
                        <span className="block text-white font-black uppercase tracking-widest text-xs">Normal</span>
                        <span className="text-[10px] text-gray-500 mt-1 block">Reto Estándar</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* GAME HEADER */}
            <div className="flex items-center justify-between bg-dark-800/40 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                        <Trophy className="text-brand-500" size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Nivel {level}/12</p>
                        <p className="text-xl font-black text-white tracking-tighter">{score * 10}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Mejor Racha</p>
                    <p className="text-xl font-black text-brand-500 tracking-tighter">{bestScore * 10}</p>
                </div>
            </div>

            {/* BOARD */}
            <div className="relative aspect-square w-full max-w-sm mx-auto bg-dark-950 rounded-2xl border-4 border-dark-800 shadow-2xl overflow-hidden group">
                {/* GRID OVERLAY */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }} />

                {/* GAME ELEMENTS */}
                <div className="absolute inset-0 p-1">
                    {/* Snake Body */}
                    {snake.map((segment, i) => (
                        <div
                            key={i}
                            className={`absolute w-[18px] h-[18px] rounded-sm transition-all duration-100 ${i === 0 ? 'bg-brand-500 z-10 shadow-[0_0_10px_rgba(202,168,111,0.5)]' : 'bg-brand-500/40'
                                }`}
                            style={{
                                left: `${segment.x * 20}px`,
                                top: `${segment.y * 20}px`,
                                borderRadius: i === 0 ? '4px' : '2px'
                            }}
                        />
                    ))}
                    {/* Food (Scissors) */}
                    <div
                        className="absolute w-[18px] h-[18px] flex items-center justify-center animate-bounce text-emerald-400"
                        style={{ left: `${food.x * 20}px`, top: `${food.y * 20}px` }}
                    >
                        <Scissors size={14} strokeWidth={3} />
                    </div>
                </div>

                {/* OVERLAYS */}
                {isGameOver && (
                    <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">¡GAME OVER!</h3>
                        <p className="text-gray-400 text-sm mb-6">Alcanzaste el Nivel {level} con {score * 10} puntos.</p>
                        <button
                            onClick={resetGame}
                            className="bg-brand-500 text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-400 active:scale-95 transition-all"
                        >
                            <RotateCcw size={18} />
                            Reintentar
                        </button>
                    </div>
                )}

                {!isPlaying && !isGameOver && (
                    <div className="absolute inset-0 bg-dark-950/60 flex items-center justify-center">
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 active:scale-90 transition-all"
                        >
                            <Play fill="currentColor" size={32} />
                        </button>
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-4">
                <div />
                <button
                    onClick={() => direction !== 'DOWN' && setDirection('UP')}
                    className="h-16 bg-dark-800 rounded-2xl border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-500/10 hover:border-brand-500/30 transition-all active:scale-90"
                >
                    <ChevronUp size={32} />
                </button>
                <div />

                <button
                    onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}
                    className="h-16 bg-dark-800 rounded-2xl border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-500/10 hover:border-brand-500/30 transition-all active:scale-90"
                >
                    <ChevronLeft size={32} />
                </button>
                <button
                    onClick={() => direction !== 'UP' && setDirection('DOWN')}
                    className="h-16 bg-dark-800 rounded-2xl border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-500/10 hover:border-brand-500/30 transition-all active:scale-90"
                >
                    <ChevronDown size={32} />
                </button>
                <button
                    onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}
                    className="h-16 bg-dark-800 rounded-2xl border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-500/10 hover:border-brand-500/30 transition-all active:scale-90"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            <button
                onClick={() => setDifficulty(null)}
                className="w-full py-3 text-[10px] text-gray-600 font-bold uppercase tracking-widest hover:text-gray-400 transition-colors"
            >
                Cambiar Dificultad
            </button>
        </div>
    );
};
