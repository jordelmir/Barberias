
import React, { useState } from 'react';
import { X, Save, AlertCircle, FileText, Clock, Settings, Grid } from 'lucide-react';

interface ShopSettingsEditorProps {
  currentRules: string;
  currentOpenHour: number;
  currentCloseHour: number;
  currentTimeSlice: number; // New Prop
  onSave: (settings: { rules: string; openHour: number; closeHour: number; timeSlice: number }) => void;
  onClose: () => void;
}

export const ShopRulesEditor: React.FC<ShopSettingsEditorProps> = ({ currentRules, currentOpenHour, currentCloseHour, currentTimeSlice, onSave, onClose }) => {
  const [rules, setRules] = useState(currentRules);
  const [openHour, setOpenHour] = useState(currentOpenHour);
  const [closeHour, setCloseHour] = useState(currentCloseHour);
  const [timeSlice, setTimeSlice] = useState(currentTimeSlice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (openHour >= closeHour) {
        alert("La hora de cierre debe ser posterior a la de apertura.");
        return;
    }
    onSave({ rules, openHour, closeHour, timeSlice });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-dark-800 rounded-xl border border-dark-600 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
            <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                    <Settings size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Configuración General</h2>
                    <p className="text-xs text-gray-500">Horarios, grilla y reglas del negocio</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Hours Configuration */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide border-b border-dark-700 pb-2">
                    <Clock size={16} className="text-brand-500" /> Horario y Agenda
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-dark-700/30 p-4 rounded-xl border border-dark-600">
                        <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Apertura</label>
                        <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                min="0" 
                                max="23"
                                value={openHour}
                                onChange={(e) => setOpenHour(Number(e.target.value))}
                                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2 text-center text-white font-mono font-bold text-lg focus:border-brand-500 outline-none"
                             />
                             <span className="text-xs text-gray-500">hrs</span>
                        </div>
                    </div>

                    <div className="bg-dark-700/30 p-4 rounded-xl border border-dark-600">
                        <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Cierre</label>
                        <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                min="1" 
                                max="24"
                                value={closeHour}
                                onChange={(e) => setCloseHour(Number(e.target.value))}
                                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2 text-center text-white font-mono font-bold text-lg focus:border-brand-500 outline-none"
                             />
                             <span className="text-xs text-gray-500">hrs</span>
                        </div>
                    </div>

                    <div className="bg-dark-700/30 p-4 rounded-xl border border-brand-500/30 relative overflow-hidden">
                        <label className="text-xs text-brand-400 uppercase font-bold mb-2 block flex items-center gap-1">
                            <Grid size={12}/> Periodicidad
                        </label>
                        <select 
                            value={timeSlice}
                            onChange={(e) => setTimeSlice(Number(e.target.value))}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2 text-white font-mono font-bold text-lg focus:border-brand-500 outline-none appearance-none"
                        >
                            <option value="15">15 Min</option>
                            <option value="30">30 Min</option>
                            <option value="45">45 Min</option>
                            <option value="60">60 Min</option>
                        </select>
                        <p className="text-[9px] text-gray-500 mt-2">Intervalo de bloques en la agenda.</p>
                    </div>
                </div>
            </div>

            {/* Rules Configuration */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide border-b border-dark-700 pb-2">
                    <FileText size={16} className="text-blue-500" /> Reglas del Negocio
                </h3>

                <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl flex gap-3">
                    <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-gray-300 leading-relaxed">
                        Este texto aparecerá a los clientes <strong>antes de confirmar su cita</strong> y en su perfil. 
                        Úsalo para evitar retrasos (ej. pedir cabello lavado, sin productos, puntualidad).
                    </p>
                </div>

                <div className="space-y-2">
                    <textarea 
                        className="w-full bg-dark-900 border border-dark-600 rounded-xl p-4 text-sm text-white focus:border-brand-500 focus:outline-none resize-none h-48 custom-scrollbar leading-relaxed"
                        placeholder="Ej: 1. Por favor llegar 5 minutos antes.&#10;2. Venir con el cabello lavado y sin gel.&#10;3. Si cancelas, avisa con 2 horas de antelación."
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    className="bg-brand-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-brand-400 shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Save size={18} /> Guardar Configuración
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};