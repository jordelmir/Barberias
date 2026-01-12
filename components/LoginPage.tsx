
import React, { useState } from 'react';
import { Scissors, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Shield, User, Terminal, Zap } from 'lucide-react';
import { MatrixRain } from './MatrixRain';

interface LoginPageProps {
    onLogin: (identity: string, code: string) => Promise<void>;
    error?: string | null;
    isConfigured?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error, isConfigured = true }) => {
    const [identity, setIdentity] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCode, setShowCode] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identity || !code) return;

        setIsLoading(true);
        // Simulate network delay for realism
        setTimeout(async () => {
            await onLogin(identity, code);
            setIsLoading(false);
        }, 800);
    };

    const handleIdentityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove spaces immediately for ID
        setIdentity(e.target.value.trim());
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ALLOW ALL CHARACTERS (Hybrid Mode: PIN or Admin Password)
        const val = e.target.value;
        setCode(val);
    };

    // If it's the master ID or contains letters/symbols or is long -> Password Mode
    const isPasswordMode = identity === '000000000' || code.length > 6 || /[^0-9]/.test(code);

    return (
        <div className="fixed inset-0 bg-[#050505] font-sans overflow-hidden">
            {/* BACKGROUND LAYER - Fixed */}
            <MatrixRain theme="GOLD" opacity={0.35} speed={0.8} />

            {/* CONTENT LAYER - Scrollable */}
            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-6 md:p-12 flex flex-col">
                <div className="m-auto w-full max-w-md py-8">
                    {/* Header */}
                    <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-3 mb-6 glass-morphism px-4 py-2 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <Scissors size={20} className="text-brand-500" />
                            <span className="text-xs font-mono text-brand-100 tracking-widest uppercase font-bold">Chronos Secure Access</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 drop-shadow-2xl">
                            Bienvenido
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">
                            Ingresa tus credenciales para acceder al sistema.
                        </p>
                    </div>

                    {/* Login Form Container - GLASS MORPHISM APPLIED */}
                    <div className="glass-morphism rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-start gap-3 animate-in shake">
                                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-red-200">{error}</p>
                                </div>
                            )}

                            {!isConfigured && (
                                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-3 animate-in fade-in duration-1000">
                                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-amber-500 uppercase">Configuración Incompleta</p>
                                        <p className="text-[10px] text-amber-200/70 leading-relaxed">
                                            El sistema no detecta las llaves de Supabase. Verifica las variables de entorno en Vercel.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Cédula o Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={16} className="text-gray-500 group-focus-within:text-brand-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={identity}
                                        onChange={handleIdentityChange}
                                        className="w-full bg-black/20 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all font-mono"
                                        placeholder="Ej. 101110222 o admin@..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">
                                        {isPasswordMode ? 'Contraseña de Administrador' : 'Código de Acceso'}
                                    </label>
                                    {isPasswordMode && (
                                        <span className="text-[9px] text-brand-500 font-mono uppercase bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">Admin Mode</span>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {isPasswordMode ? (
                                            <Shield size={16} className="text-brand-500 animate-pulse" />
                                        ) : (
                                            <Zap size={16} className="text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                                        )}
                                    </div>
                                    <input
                                        type={showCode ? "text" : "password"}
                                        value={code}
                                        onChange={handleCodeChange}
                                        className={`w-full bg-black/20 border rounded-xl py-3 pl-10 pr-10 text-white placeholder-gray-600 focus:outline-none transition-all font-mono tracking-widest ${isPasswordMode ? 'border-brand-500/50 focus:border-brand-500' : 'border-dark-600 focus:border-brand-500 text-center text-lg'}`}
                                        placeholder={isPasswordMode ? "Contraseña..." : "• • • • • •"}
                                        // Removed maxLength to allow complex passwords
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCode(!showCode)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || identity.length < 1 || code.length < 6}
                                className="w-full bg-brand-500 text-black font-bold py-3.5 rounded-xl hover:bg-brand-400 shadow-[0_0_20px_rgba(240,180,41,0.3)] hover:shadow-[0_0_30px_rgba(240,180,41,0.5)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? (
                                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        Ingresar al Sistema <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest bg-black/40 px-2 py-1 rounded inline-block backdrop-blur-sm">
                            Protected by Chronos Security™
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
