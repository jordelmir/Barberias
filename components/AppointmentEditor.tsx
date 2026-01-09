
import React, { useState, useMemo } from 'react';
import { Appointment, Service } from '../types';
import { isSlotAvailable, formatTime } from '../services/timeEngine';
import { X, Clock, Save, AlertTriangle, CalendarDays, ArrowRight } from 'lucide-react';

interface AppointmentEditorProps {
  appointment: Appointment;
  allAppointments: Appointment[];
  serviceName: string;
  onSave: (id: string, updates: { price: number; durationMinutes: number; startTime?: Date }) => void;
  onClose: () => void;
}

export const AppointmentEditor: React.FC<AppointmentEditorProps> = ({ appointment, allAppointments, serviceName, onSave, onClose }) => {
  const [price, setPrice] = useState(appointment.price);
  const [duration, setDuration] = useState(appointment.durationMinutes);
  
  // Rescheduling State
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newTimeStr, setNewTimeStr] = useState(formatTime(appointment.startTime)); 
  const [dateError, setDateError] = useState<string | null>(null);

  // Time manipulation helper for input type="time"
  const getTimeString = (date: Date) => {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const [timeInput, setTimeInput] = useState(getTimeString(appointment.startTime));

  const isCollision = useMemo(() => {
      if (!isRescheduling) return false;
      
      const [hours, minutes] = timeInput.split(':').map(Number);
      const newStart = new Date(appointment.startTime);
      newStart.setHours(hours, minutes, 0, 0);
      const newEnd = new Date(newStart.getTime() + duration * 60000);

      // Check against ALL appointments except this one
      return !isSlotAvailable(newStart, newEnd, appointment.barberId, allAppointments, appointment.id);
  }, [timeInput, duration, appointment, allAppointments, isRescheduling]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let newStartDate = undefined;
    
    if (isRescheduling) {
        if (isCollision) {
            if (!confirm("ADVERTENCIA: Hay un conflicto de horario con otra cita. ¿Deseas forzar el cambio?")) {
                return;
            }
        }
        const [hours, minutes] = timeInput.split(':').map(Number);
        newStartDate = new Date(appointment.startTime);
        newStartDate.setHours(hours, minutes, 0, 0);
    }

    onSave(appointment.id, { 
        price, 
        durationMinutes: duration,
        startTime: newStartDate
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-dark-800 rounded-xl border border-dark-600 shadow-2xl w-full max-w-md overflow-hidden">
        
        <div className="p-4 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
          <h3 className="font-bold text-white text-lg">Gestión de Cita</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            <div className="bg-dark-700/30 p-3 rounded-lg border border-dark-600">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Cliente</div>
                <div className="text-white font-medium">{appointment.clientName}</div>
                <div className="text-sm text-brand-400">{serviceName}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-brand-500"/> Duración
                    </label>
                    <div className="relative">
                        <input 
                            type="number"
                            min="5"
                            step="5"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none font-mono text-lg"
                        />
                        <div className="absolute right-3 top-3.5 text-xs text-gray-500">min</div>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-2 mb-2">
                        <span className="text-green-500 font-bold text-sm">₡</span> Precio
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-gray-500 font-mono">₡</span>
                        <input 
                            type="number"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 pl-8 text-white focus:border-brand-500 focus:outline-none font-mono text-lg"
                        />
                    </div>
                </div>
            </div>

            {/* MANUAL MOVE SECTION */}
            <div className="pt-2 border-t border-dark-700">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-2">
                        <CalendarDays size={14} className="text-blue-500"/> Reagendar Hora
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            name="toggle" 
                            id="toggle" 
                            checked={isRescheduling}
                            onChange={() => setIsRescheduling(!isRescheduling)}
                            className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-brand-500"
                        />
                        <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-700 cursor-pointer checked:bg-brand-500"></label>
                    </div>
                </div>

                {isRescheduling && (
                    <div className={`p-3 rounded-lg border transition-all ${isCollision ? 'bg-red-900/10 border-red-500/50' : 'bg-dark-900 border-dark-600'}`}>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Hora Actual</div>
                                <div className="font-mono text-gray-400 line-through">{getTimeString(appointment.startTime)}</div>
                            </div>
                            <ArrowRight size={16} className="text-gray-500" />
                            <div className="flex-1">
                                <div className="text-[10px] uppercase text-brand-500 font-bold mb-1">Nueva Hora</div>
                                <input 
                                    type="time" 
                                    value={timeInput}
                                    onChange={(e) => setTimeInput(e.target.value)}
                                    className="bg-transparent text-white font-mono text-lg outline-none w-full cursor-pointer"
                                />
                            </div>
                        </div>
                        {isCollision && (
                            <div className="mt-2 text-[10px] text-red-400 flex items-center gap-1 font-bold">
                                <AlertTriangle size={10} /> CONFLICTO: Ya existe una cita en este horario.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                    Cancelar
                </button>
                <button type="submit" className={`flex-1 py-2.5 text-sm font-bold text-black rounded-lg transition-all flex items-center justify-center gap-2 ${isCollision ? 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/20' : 'bg-brand-500 hover:bg-brand-400 shadow-lg shadow-brand-500/20'}`}>
                    <Save size={16} /> {isCollision ? 'Forzar Cambio' : 'Guardar'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
