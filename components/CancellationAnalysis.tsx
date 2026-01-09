
import React, { useMemo } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { X, PieChart, AlertCircle, Calendar } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip } from 'recharts';

interface CancellationAnalysisProps {
    appointments: Appointment[];
    onClose: () => void;
}

export const CancellationAnalysis: React.FC<CancellationAnalysisProps> = ({ appointments, onClose }) => {
    
    // Derived Data
    const cancellationStats = useMemo(() => {
        const cancelled = appointments.filter(a => a.status === AppointmentStatus.CANCELLED);
        const total = cancelled.length;
        
        const reasons: Record<string, number> = {};
        cancelled.forEach(a => {
            const r = a.cancellationReason || 'Sin motivo especificado';
            reasons[r] = (reasons[r] || 0) + 1;
        });

        const chartData = Object.entries(reasons).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
        
        // Calculate Lost Revenue
        const lostRevenue = cancelled.reduce((acc, curr) => acc + curr.price, 0);

        return { total, chartData, lostRevenue };
    }, [appointments]);

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#3b82f6', '#6366f1'];

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dark-800 w-full max-w-4xl h-[80vh] rounded-2xl border border-dark-600 shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <AlertCircle className="text-red-500" /> Analítica de Retención
                        </h2>
                        <p className="text-xs text-gray-500">Desglose de motivos de cancelación</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-dark-700/30 p-4 rounded-xl border border-white/5">
                            <div className="text-xs text-gray-500 uppercase font-bold">Total Cancelaciones</div>
                            <div className="text-3xl font-black text-white mt-1">{cancellationStats.total}</div>
                        </div>
                        <div className="bg-dark-700/30 p-4 rounded-xl border border-white/5">
                            <div className="text-xs text-gray-500 uppercase font-bold">Ingreso Perdido (Est.)</div>
                            <div className="text-3xl font-black text-red-500 mt-1 font-mono">₡{cancellationStats.lostRevenue.toLocaleString()}</div>
                        </div>
                         <div className="bg-dark-700/30 p-4 rounded-xl border border-white/5">
                            <div className="text-xs text-gray-500 uppercase font-bold">Motivo Principal</div>
                            <div className="text-lg font-bold text-orange-400 mt-2 truncate">
                                {cancellationStats.chartData[0]?.name || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                        {/* Donut Chart */}
                        <div className="bg-dark-900/50 rounded-xl p-4 border border-white/5 flex flex-col">
                            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                                <PieChart size={14} className="text-brand-500"/> Distribución de Causas
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePie>
                                        <Pie
                                            data={cancellationStats.chartData}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {cancellationStats.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </RePie>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* List Breakdown */}
                        <div className="bg-dark-900/50 rounded-xl p-4 border border-white/5 overflow-y-auto custom-scrollbar">
                            <h3 className="text-sm font-bold text-gray-300 mb-4">Detalle de Incidencias</h3>
                            <div className="space-y-3">
                                {cancellationStats.chartData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg border border-dark-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                                            <span className="text-sm text-gray-200">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 bg-dark-900 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full" 
                                                    style={{
                                                        width: `${(item.value / cancellationStats.total) * 100}%`,
                                                        backgroundColor: COLORS[idx % COLORS.length]
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-mono font-bold text-gray-400">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
