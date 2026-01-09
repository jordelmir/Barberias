
import React, { useState } from 'react';
import { GlobalStyleOptions } from '../types';
import { X, Plus, Trash2, Hash, Scissors, Smile, Zap, Save, Tag } from 'lucide-react';

interface StyleOptionsEditorProps {
  currentOptions: GlobalStyleOptions;
  onSave: (newOptions: GlobalStyleOptions) => void;
  onClose: () => void;
}

export const StyleOptionsEditor: React.FC<StyleOptionsEditorProps> = ({ currentOptions, onSave, onClose }) => {
  const [options, setOptions] = useState<GlobalStyleOptions>(currentOptions);
  
  // Local state for new inputs
  const [newInputs, setNewInputs] = useState({
      sides: '',
      top: '',
      beard: '',
      finish: ''
  });

  const handleAdd = (category: keyof GlobalStyleOptions) => {
      const val = newInputs[category].trim();
      if (!val) return;
      
      // Avoid duplicates
      if (options[category].includes(val)) {
          setNewInputs({ ...newInputs, [category]: '' });
          return;
      }

      setOptions(prev => ({
          ...prev,
          [category]: [...prev[category], val]
      }));
      setNewInputs({ ...newInputs, [category]: '' });
  };

  const handleRemove = (category: keyof GlobalStyleOptions, itemToRemove: string) => {
      setOptions(prev => ({
          ...prev,
          [category]: prev[category].filter(item => item !== itemToRemove)
      }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: keyof GlobalStyleOptions) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleAdd(category);
      }
  };

  const handleSave = () => {
      onSave(options);
      onClose();
  };

  // Helper to render a category section
  const renderSection = (category: keyof GlobalStyleOptions, title: string, icon: React.ElementType) => {
      const Icon = icon;
      return (
          <div className="bg-dark-700/30 p-4 rounded-xl border border-dark-600 flex flex-col h-full">
              <h3 className="text-sm font-bold text-gray-200 uppercase mb-3 flex items-center gap-2">
                  <Icon size={16} className="text-brand-500" /> {title}
              </h3>
              
              {/* Input Area */}
              <div className="flex gap-2 mb-3">
                  <input 
                      type="text" 
                      placeholder={`Agregar a ${title}...`}
                      className="flex-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
                      value={newInputs[category]}
                      onChange={(e) => setNewInputs({ ...newInputs, [category]: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, category)}
                  />
                  <button 
                      onClick={() => handleAdd(category)}
                      className="bg-brand-500 text-black p-2 rounded-lg hover:bg-brand-400 disabled:opacity-50"
                      disabled={!newInputs[category]}
                  >
                      <Plus size={16} />
                  </button>
              </div>

              {/* Tags List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-48">
                  <div className="flex flex-wrap gap-2">
                      {options[category].map(item => (
                          <div key={item} className="flex items-center gap-1.5 bg-dark-800 border border-dark-600 px-2 py-1.5 rounded-lg group hover:border-red-500/50 transition-colors">
                              <span className="text-xs text-gray-300 font-medium">{item}</span>
                              <button 
                                  onClick={() => handleRemove(category, item)}
                                  className="text-dark-500 group-hover:text-red-500 transition-colors p-0.5"
                              >
                                  <X size={12} />
                              </button>
                          </div>
                      ))}
                      {options[category].length === 0 && (
                          <p className="text-[10px] text-gray-600 italic w-full text-center py-2">Sin opciones configuradas</p>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-dark-800 rounded-xl border border-dark-600 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
            <div className="flex items-center gap-3">
                <div className="bg-brand-500/20 p-2 rounded-lg text-brand-500">
                    <Tag size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Catálogo de Estilos</h2>
                    <p className="text-xs text-gray-500">Define las opciones predeterminadas para las guías de los clientes</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {renderSection('sides', 'Lados / Degradado', Hash)}
                {renderSection('top', 'Parte Superior', Scissors)}
                {renderSection('beard', 'Barba', Smile)}
                {renderSection('finish', 'Acabado / Producto', Zap)}
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-dark-700 bg-dark-900/50 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSave}
                className="bg-brand-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-brand-400 shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-transform active:scale-95"
            >
                <Save size={18} /> Guardar Cambios
            </button>
        </div>

      </div>
    </div>
  );
};
