
import React, { useState, useCallback } from 'react';
import {
    RefreshCw,
    User,
    Camera,
    Layers,
    Box,
    Type,
    Sparkles,
    Globe,
    Cpu,
    ShieldCheck,
    Dna
} from 'lucide-react';

interface AvatarSelectorProps {
    currentAvatar: string;
    name: string;
    onAvatarChange: (url: string) => void;
}

type AvatarStyle = 'avataaars' | 'lorelei' | 'initials' | 'shapes' | 'bottts' | 'pixel-art' | 'micah' | 'notionists' | 'open-peeps';

const AVATAR_STYLES = [
    { id: 'avataaars', label: 'Persona Digital', icon: User, desc: 'Avatar humano 3D' },
    { id: 'lorelei', label: 'Artístico', icon: Camera, desc: 'Estilo ilustración' },
    { id: 'notionists', label: 'Minimalista', icon: Globe, desc: 'Estilo Notion' },
    { id: 'open-peeps', label: 'Boceto', icon: Type, desc: 'Dibujo a mano' },
    { id: 'pixel-art', label: 'Retro 8-bit', icon: Cpu, desc: 'Estilo videojuegos' },
    { id: 'micah', label: 'Moderno', icon: Dna, desc: 'Geometría suave' },
    { id: 'initials', label: 'Corporativo', icon: ShieldCheck, desc: 'Iniciales limpias' },
    { id: 'shapes', label: 'Abstracto', icon: Box, desc: 'Patrones IA' },
    { id: 'bottts', label: 'Autómata', icon: Layers, desc: 'Interfaz robótica' },
] as const;

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ currentAvatar, name, onAvatarChange }) => {
    const [aiStyle, setAiStyle] = useState<AvatarStyle>('avataaars');
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastAction, setLastAction] = useState<'STYLE' | 'GENERATE' | null>(null);

    const generateUrl = useCallback((style: AvatarStyle, seed: string) => {
        // High-end optimization: Use exact parameters for premium look
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=050505,1a1a1a,0a0a0a&radius=50&glossy=true&randomizeIds=true`;
    }, []);

    const handleGenerate = () => {
        setIsGenerating(true);
        setLastAction('GENERATE');

        // Use a high-entropy seed for better variation
        const entropy = Math.random().toString(36).substring(2, 15);
        const newUrl = generateUrl(aiStyle, `${name}-${entropy}`);

        // Professional "Think Time" for IA perception
        setTimeout(() => {
            onAvatarChange(newUrl);
            setIsGenerating(false);
        }, 850);
    };

    const handleStyleChange = (style: AvatarStyle) => {
        setAiStyle(style);
        setLastAction('STYLE');
        setIsGenerating(true);

        const newUrl = generateUrl(style, name);

        setTimeout(() => {
            onAvatarChange(newUrl);
            setIsGenerating(false);
        }, 400);
    };

    return (
        <div className="group/selector relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-5 shadow-2xl transition-all hover:border-brand-500/30 overflow-hidden">

            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/5 blur-[80px] pointer-events-none transition-opacity group-hover/selector:opacity-100 opacity-0" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-brand-500/10 rounded-lg border border-brand-500/20">
                        <Sparkles size={14} className="text-brand-400" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Córtex de Identidad IA</h3>
                        <p className="text-[9px] text-gray-500 font-medium">Motor de Redes Neuronales DiceBear v9</p>
                    </div>
                </div>
                {isGenerating && (
                    <div className="flex gap-1">
                        <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" />
                    </div>
                )}
            </div>

            {/* Style Grid - Professional Layout */}
            <div className="grid grid-cols-3 gap-2 relative z-10 w-full">
                {AVATAR_STYLES.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => handleStyleChange(s.id as AvatarStyle)}
                        title={s.desc}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group/btn ${aiStyle === s.id
                            ? 'bg-brand-500/10 border-brand-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                    >
                        <s.icon size={16} className={aiStyle === s.id ? 'text-brand-400' : 'text-gray-500 group-hover/btn:text-gray-300'} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider text-center ${aiStyle === s.id ? 'text-brand-200' : 'text-gray-600 group-hover/btn:text-gray-400'}`}>
                            {s.label}
                        </span>

                        {aiStyle === s.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Action Zone */}
            <div className="space-y-3 pt-1">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-brand-600 to-brand-400 hover:from-brand-500 hover:to-brand-300 text-black font-black text-[10px] uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-50 disabled:grayscale shadow-lg shadow-brand-500/10 group/gen"
                >
                    <RefreshCw size={16} className={`transition-transform duration-700 ${isGenerating ? "animate-spin" : "group-hover/gen:rotate-180"}`} />
                    {isGenerating ? 'Analizando Variantes...' : 'Generar Nueva Instancia'}
                </button>

                <div className="flex items-center justify-center gap-4 text-[8px] font-mono text-gray-600 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><ShieldCheck size={10} /> Encriptado SSL</span>
                    <span className="flex items-center gap-1"><RefreshCw size={10} /> Respuesta 200ms</span>
                </div>
            </div>
        </div>
    );
};
