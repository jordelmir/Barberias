
import React, { useState } from 'react';
import { Service } from '../types';
import { X, Plus, Edit2, Trash2, Save, Clock, Settings } from 'lucide-react';

interface ServiceManagerProps {
  services: Service[];
  onAdd: (service: Omit<Service, 'id'>) => void;
  onUpdate: (service: Service) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({ services, onAdd, onUpdate, onDelete, onClose }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({ name: '', durationMinutes: 30, price: 0 });

  const resetForm = () => {
      setFormData({ name: '', durationMinutes: 30, price: 0 });
      setEditingId(null);
  };

  const handleEditClick = (service: Service) => {
      setEditingId(service.id);
      setFormData({ name: service.name, durationMinutes: service.durationMinutes, price: service.price });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || formData.durationMinutes <= 0) return;

      if (editingId) {
          onUpdate({ id: editingId, ...formData });
      } else {
          onAdd(formData);
      }
      resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-dark-800 rounded-xl border border-dark-600 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
            <div className="flex items-center gap-3">
                <div className="bg-brand-500/20 p-2 rounded-lg text-brand-500">
                    <Settings size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Configuración de Servicios</h2>
                    <p className="text-xs text-gray-500">Gestionar oferta, duración y precios</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-dark-700/30 p-4 rounded-xl border border-dark-600 mb-6">
                <h3 className="text-sm font-bold text-gray-300 uppercase mb-3 flex items-center gap-2">
                    {editingId ? <Edit2 size={14}/> : <Plus size={14}/>} 
                    {editingId ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6">
                        <input 
                            type="text" 
                            placeholder="Nombre del Servicio (ej. Corte Desvanecido)" 
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-brand-500 focus:outline-none text-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="md:col-span-3 relative">
                        <Clock size={14} className="absolute left-3 top-3 text-gray-500" />
                        <input 
                            type="number" 
                            placeholder="Mins" 
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-9 pr-3 py-2 text-white focus:border-brand-500 focus:outline-none text-sm"
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData({...formData, durationMinutes: parseInt(e.target.value) || 0})}
                            min="5"
                            step="5"
                            required
                        />
                    </div>
                    <div className="md:col-span-3 relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₡</span>
                        <input 
                            type="number" 
                            placeholder="Precio" 
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-9 pr-3 py-2 text-white focus:border-brand-500 focus:outline-none text-sm"
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                            min="0"
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                    {editingId && (
                        <button type="button" onClick={resetForm} className="text-xs text-gray-400 hover:text-white px-3 py-2">
                            Cancelar
                        </button>
                    )}
                    <button type="submit" className="bg-brand-500 text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-400 flex items-center gap-2">
                        <Save size={14} /> {editingId ? 'Actualizar Servicio' : 'Agregar al Menú'}
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-2">
                {services.map(service => (
                    <div key={service.id} className="group flex items-center justify-between p-3 rounded-lg border border-dark-700 bg-dark-800/50 hover:border-dark-500 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded bg-dark-700 flex items-center justify-center text-gray-400 font-bold text-xs">
                                {service.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-medium text-white text-sm">{service.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-3">
                                    <span className="flex items-center gap-1"><Clock size={10}/> {service.durationMinutes} min</span>
                                    <span className="flex items-center gap-1 font-mono font-medium"><span className="text-[10px] font-bold">₡</span>{service.price.toLocaleString('es-CR')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEditClick(service)}
                                className="p-2 text-gray-400 hover:text-brand-500 hover:bg-dark-700 rounded-lg"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => onDelete(service.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-900/20 rounded-lg"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </div>
      </div>
    </div>
  );
};
