import React from 'react';
import { SnakeGame } from './SnakeGame';
import { ChevronLeft, Gamepad2, Trophy, Target, Zap } from 'lucide-react';

export const ArcadePage: React.FC<{ onBack: () => void; playerName: string }> = ({ onBack, playerName }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-dark-950 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-700">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(202,168,111,0.05)_0%,transparent_70%)]" />

            {/* NAVIGATION HEADER */}
            <div className="absolute top-0 inset-x-0 p-8 flex items-center justify-between z-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-3 text-gray-500 hover:text-white transition-all group"
                >
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-brand-500/40 transition-all">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Salir a la Barbería</span>
                </button>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Jugador Activo</p>
                        <p className="text-sm font-black text-white italic uppercase tracking-tighter">{playerName}</p>
                    </div>
                    <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                        <Gamepad2 className="text-brand-500" size={20} />
                    </div>
                </div>
            </div>

            {/* DEDICATED GAME AREA */}
            <div className="w-full max-w-5xl h-full flex flex-col items-center justify-center p-4 pt-20">
                <div className="w-full h-full glass-morphism rounded-[3rem] border border-white/5 relative overflow-hidden p-4 sm:p-12 flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <SnakeGame isFullScreen={true} onClose={onBack} />
                    </div>

                    {/* PRO ARCADE FOOTER */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-black/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                <Zap className="text-emerald-500" size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Power-ups</h4>
                                <p className="text-[9px] text-gray-500 font-bold leading-tight">La tijera dorada otorga multiplicadores y habilidades.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20">
                                <Trophy className="text-brand-500" size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Competición</h4>
                                <p className="text-[9px] text-gray-500 font-bold leading-tight">Próximamente: Torneos semanales por cortes gratis.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                <Target className="text-indigo-500" size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Dominio</h4>
                                <p className="text-[9px] text-gray-500 font-bold leading-tight">Alcanza los 10,000 puntos para desbloquear el modo Chronos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DECORATIVE ELEMENTS */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/5 blur-[100px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none" />
        </div>
    );
};
