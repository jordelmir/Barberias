
import React, { useState } from 'react';
import { GlobalStyleOptions, StyleCategory } from '../types';
import { X, Plus, Trash2, Hash, Scissors, Smile, Zap, Save, Tag, FolderPlus, Grid } from 'lucide-react';

interface StyleOptionsEditorProps {
  currentOptions: GlobalStyleOptions;
  onSave: (newOptions: GlobalStyleOptions) => void;
  onClose: () => void;
}

export const StyleOptionsEditor: React.FC<StyleOptionsEditorProps> = ({ currentOptions, onSave, onClose }) => {
  const [categories, setCategories] = useState<GlobalStyleOptions>(currentOptions);
  
  // State for new item inputs inside categories
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  
  // State for Creating a NEW CATEGORY
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // --- Category Management ---

  const handleCreateCategory = () => {
      if (!newCatName.trim()) return;
      const id = newCatName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      // Avoid duplicate IDs
      if (categories.find(c => c.id === id)) {
          alert('Ya existe una categoría similar.');
          return;
      }

      const newCategory: StyleCategory = {
          id,
          label: newCatName,
          items: []
      };

      setCategories([...categories, newCategory]);
      setNewCatName('');
      setIsAddingCategory(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
      if (confirm('¿Eliminar esta categoría y todas sus opciones? Esto no borrará datos históricos de clientes, pero no podrán seleccionarla en el futuro.')) {
          setCategories(prev => prev.filter(c => c.id !== categoryId));
      }
  };

  // --- Item Management ---

  const handleAddItem = (categoryId: string) => {
      const val = newItemInputs[categoryId]?.trim();
      if (!val) return;
      
      setCategories(prev => prev.map(cat => {
          if (cat.id === categoryId) {
              if (cat.items.includes(val)) return cat; // No duplicates
              return { ...cat, items: [...cat.items, val] };
          }
          return cat;
      }));

      setNewItemInputs(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleRemoveItem = (categoryId: string, itemToRemove: string) => {
      setCategories(prev => prev.map(cat => {
          if (cat.id === categoryId) {
              return { ...cat, items: cat.items.filter(i => i !== itemToRemove) };
          }
          return cat;
      }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleAddItem(categoryId);
      }
  };

  // Helper to resolve icon based on ID (Legacy support + Dynamic fallback)
  const getIcon = (id: string) => {
      switch(id) {
          case 'sides': return Hash;
          case 'top': return Scissors;
          case 'beard': return Smile;
          case 'finish': return Zap;
          default: return Tag; // Generic for custom categories
      }
  };

  const handleSave = () => {
      onSave(categories);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-dark-800 rounded-xl border border-dark-600 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
            <div className="flex items-center gap-3">
                <div className="bg-brand-500/20 p-2 rounded-lg text-brand-500">
                    <Grid size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Catálogo de Estilos</h2>
                    <p className="text-xs text-gray-500">Define las categorías y opciones disponibles para las fichas técnicas.</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-dark-900/20">
            
            {/* New Category Toolbar */}
            <div className="mb-6 flex justify-end">
                {isAddingCategory ? (
                    <div className="flex items-center gap-2 bg-dark-700 p-2 rounded-lg border border-brand-500/50 animate-in slide-in-from-right-4 w-full md:w-auto">
                        <FolderPlus size={18} className="text-brand-500 ml-2" />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Nombre de Nueva Categoría (ej. Color)" 
                            className="bg-transparent border-none focus:outline-none text-white text-sm w-64"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                        />
                        <button onClick={handleCreateCategory} className="bg-brand-500 text-black px-3 py-1 rounded text-xs font-bold hover:bg-brand-400">Crear</button>
                        <button onClick={() => setIsAddingCategory(false)} className="text-gray-400 hover:text-white px-2"><X size={16}/></button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingCategory(true)}
                        className="flex items-center gap-2 text-brand-500 hover:text-brand-400 font-bold text-xs uppercase tracking-wide border border-brand-500/30 hover:border-brand-500/60 bg-brand-500/5 px-4 py-2 rounded-lg transition-all"
                    >
                        <Plus size={16} /> Nueva Categoría
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {categories.map((category) => {
                    const Icon = getIcon(category.id);
                    return (
                        <div key={category.id} className="bg-dark-700/30 p-4 rounded-xl border border-dark-600 flex flex-col h-full group relative hover:border-brand-500/20 transition-all">
                            
                            {/* Category Header */}
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                                <h3 className="text-sm font-bold text-gray-200 uppercase flex items-center gap-2">
                                    <Icon size={16} className="text-brand-500" /> {category.label}
                                </h3>
                                <button 
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-dark-500 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Eliminar Categoría"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            
                            {/* Input Area */}
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    placeholder={`Añadir opción...`}
                                    className="flex-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
                                    value={newItemInputs[category.id] || ''}
                                    onChange={(e) => setNewItemInputs({ ...newItemInputs, [category.id]: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, category.id)}
                                />
                                <button 
                                    onClick={() => handleAddItem(category.id)}
                                    className="bg-brand-500 text-black p-2 rounded-lg hover:bg-brand-400 disabled:opacity-50 transition-colors"
                                    disabled={!newItemInputs[category.id]}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Tags List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-48">
                                <div className="flex flex-wrap gap-2">
                                    {category.items.map(item => (
                                        <div key={item} className="flex items-center gap-1.5 bg-dark-800 border border-dark-600 px-2 py-1.5 rounded-lg group/item hover:border-red-500/50 transition-colors">
                                            <span className="text-xs text-gray-300 font-medium">{item}</span>
                                            <button 
                                                onClick={() => handleRemoveItem(category.id, item)}
                                                className="text-dark-500 group-hover/item:text-red-500 transition-colors p-0.5"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {category.items.length === 0 && (
                                        <div className="flex flex-col items-center justify-center w-full py-4 opacity-30">
                                            <Tag size={20} />
                                            <p className="text-[10px] italic mt-1">Sin opciones</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
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