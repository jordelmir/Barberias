
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Cell } from 'recharts';
import { Metrics, Appointment, Service } from '../types';
import { getHourlyLoad, getServiceBreakdown, calculateRevenueStats, RevenueStats, getRevenueTrend, TimeFrame } from '../services/timeEngine';
import { TrendingUp, AlertOctagon, Banknote, Activity, Clock, PieChart, Info } from 'lucide-react';

interface MetricsPanelProps {
  metrics: Metrics;
  appointments: Appointment[];
  services: Service[]; 
  currentDate: Date;
  openHour: number;
  closeHour: number;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, appointments, services, currentDate, openHour, closeHour }) => {
  
  const [revenueView, setRevenueView] = useState<TimeFrame>('daily');

  // Real-time chart data derivation
  const hourlyData = useMemo(() => getHourlyLoad(appointments, currentDate, openHour, closeHour), [appointments, currentDate, openHour, closeHour]);
  
  // Pass dynamic services to the breakdown calculator
  const serviceData = useMemo(() => getServiceBreakdown(appointments, services), [appointments, services]);

  // Calculate total services for percentage
  const totalServicesCount = useMemo(() => serviceData.reduce((acc, curr) => acc + curr.value, 0), [serviceData]);

  // Comprehensive Revenue Calculation
  const revenueStats: RevenueStats = useMemo(() => calculateRevenueStats(appointments, currentDate), [appointments, currentDate]);
  
  // Revenue Trend Data (Bar Chart)
  const revenueTrendData = useMemo(() => getRevenueTrend(appointments, revenueView, currentDate, openHour, closeHour), [appointments, revenueView, currentDate, openHour, closeHour]);

  // --- OPPORTUNITY COST CALCULATION ---
  // Calculate average price per minute of services to monetize dead time
  const opportunityCost = useMemo(() => {
      if (services.length === 0) return 0;
      const totalPpm = services.reduce((acc, s) => acc + (s.price / s.durationMinutes), 0);
      const avgPpm = totalPpm / services.length;
      return Math.round(metrics.deadTimeMinutes * avgPpm);
  }, [metrics.deadTimeMinutes, services]);

  const getRevenueDisplay = () => {
      switch(revenueView) {
          case 'daily': return { label: 'Ingreso Diario', value: revenueStats.daily, sub: 'hoy' };
          case 'weekly': return { label: 'Ingreso Semanal', value: revenueStats.weekly, sub: 'esta semana' };
          case 'monthly': return { label: 'Ingreso Mensual', value: revenueStats.monthly, sub: 'este mes' };
          case 'yearly': return { label: 'Ingreso Anual', value: revenueStats.yearly, sub: 'este año' };
      }
  };

  const revenueDisplay = getRevenueDisplay();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 p-3 rounded-lg shadow-xl">
          <p className="text-gray-300 text-xs font-bold mb-1 uppercase">{label}</p>
          <p className="text-emerald-400 font-mono font-bold text-sm">
            ₡{payload[0].value.toLocaleString('es-CR')}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Service Mix to show Percentage
  const ServiceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = totalServicesCount > 0 ? ((value / totalServicesCount) * 100).toFixed(1) : 0;
      
      return (
        <div className="bg-dark-900 border border-purple-500/30 p-3 rounded-lg shadow-2xl backdrop-blur-md">
          <p className="text-white text-xs font-bold mb-1 border-b border-white/10 pb-1">{label}</p>
          <div className="flex justify-between items-center gap-4 mt-1">
             <p className="text-gray-400 text-xs">Cantidad:</p>
             <p className="text-purple-400 font-mono font-bold text-sm">{value}</p>
          </div>
          <div className="flex justify-between items-center gap-4">
             <p className="text-gray-400 text-xs">Share:</p>
             <p className="text-white font-mono font-bold text-xs">{percentage}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-6">
        
        {/* Top Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* 1. OCCUPANCY */}
            <div className="glass-morphism p-5 rounded-xl shadow-lg relative overflow-hidden group hover:border-brand-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity size={80} className="text-white"/>
                </div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-brand-500"/> Ocupación Real
                </h3>
                <div className="flex items-end gap-2 mt-4">
                    <span className="text-4xl font-black text-white font-mono">{metrics.dailyOccupancy}%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 mb-4 font-medium">Capacidad utilizada hoy</div>
                <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden border border-white/10">
                    <div className="bg-brand-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(240,180,41,0.5)]" style={{width: `${metrics.dailyOccupancy}%`}}></div>
                </div>
            </div>

            {/* 2. OPPORTUNITY COST (FORMERLY DEAD TIME) */}
            <div className="glass-morphism p-5 rounded-xl shadow-lg relative overflow-hidden group hover:border-red-500/30 transition-colors">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertOctagon size={80} className="text-red-500"/>
                </div>
                <h3 className="text-red-400/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <AlertOctagon size={14} /> Capacidad Monetizable
                </h3>
                <div className="flex flex-col mt-3 relative z-10">
                    <span className="text-2xl font-black text-red-500 font-mono tracking-tight">₡{opportunityCost.toLocaleString('es-CR')}</span>
                    <span className="text-[10px] text-red-400/60 font-bold uppercase tracking-wide mt-0.5">Lucro Cesante Estimado</span>
                </div>
                <div className="mt-4 flex items-center gap-2 p-2 bg-red-900/10 rounded-lg border border-red-900/20">
                    <div className="text-red-400 font-mono font-bold text-lg leading-none">{metrics.deadTimeMinutes}</div>
                    <div className="text-[9px] text-gray-400 leading-tight">minutos disponibles para venta hoy.</div>
                </div>
            </div>

            {/* 3. REVENUE CONTROLLER */}
            <div className="glass-morphism rounded-xl shadow-lg relative overflow-hidden flex flex-col hover:border-emerald-500/30 transition-colors">
                <div className="p-5 flex-1 relative z-10 flex flex-col h-full">
                    {/* Header: Improved wrapping and alignment */}
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                            <Banknote size={14} className="text-emerald-500" />
                            {revenueDisplay.label}
                        </h3>
                        
                        {/* Compact Selector - Resized for 'A' visibility */}
                        <div className="flex bg-dark-900 rounded-lg p-0.5 border border-white/10 shrink-0">
                            {['daily', 'weekly', 'monthly', 'yearly'].map((v) => (
                                <button 
                                    key={v}
                                    onClick={() => setRevenueView(v as TimeFrame)} 
                                    className={`w-8 h-7 text-[10px] font-bold rounded flex items-center justify-center uppercase transition-all pt-0.5 leading-none ${revenueView === v ? 'bg-emerald-500 text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {v === 'daily' ? 'D' : v === 'weekly' ? 'S' : v === 'monthly' ? 'M' : 'A'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-auto">
                        <div className="flex items-baseline gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300" key={revenueView}>
                            <span className="text-xl font-bold text-emerald-600">₡</span>
                            <span className="text-4xl font-black text-white font-mono tracking-tighter">{revenueDisplay.value.toLocaleString('es-CR')}</span>
                        </div>
                    </div>
                </div>
                {/* Graph Decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none flex items-end justify-between px-1 gap-1">
                    {[40, 70, 50, 90, 60, 80, 50].map((h, i) => (
                        <div key={i} className="w-full bg-emerald-500 rounded-t-sm" style={{height: `${h}%`}}></div>
                    ))}
                </div>
            </div>

            {/* 4. WORKFLOW */}
            <div className="glass-morphism p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} className="text-blue-500" /> Flujo de Citas
                </h3>
                
                <div className="flex items-center justify-between mt-4">
                    <div>
                        <div className="text-4xl font-black text-white">{metrics.appointmentsCompleted}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold mt-1">Completadas</div>
                    </div>
                    <div className="text-right opacity-50">
                        <div className="text-2xl font-bold text-gray-400">{metrics.appointmentsTotal}</div>
                        <div className="text-[10px] text-gray-600 uppercase font-bold mt-1">Agendadas</div>
                    </div>
                </div>

                <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden mt-4 border border-white/10">
                    <div 
                        className="bg-blue-500 h-full transition-all duration-1000" 
                        style={{width: metrics.appointmentsTotal > 0 ? `${(metrics.appointmentsCompleted / metrics.appointmentsTotal) * 100}%` : '0%'}}
                    ></div>
                </div>
            </div>
        </div>

        {/* New Revenue Trend Chart Row */}
        <div className="glass-morphism p-5 rounded-xl shadow-lg h-64 animate-in fade-in slide-in-from-top-4 duration-500">
             <h3 className="text-gray-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Tendencia Financiera ({revenueView === 'daily' ? 'Por Hora' : revenueView === 'weekly' ? 'Por Día' : revenueView === 'monthly' ? 'Por Día' : 'Por Mes'})
                <TrendingUp size={14} className="text-emerald-500 ml-auto opacity-50"/>
            </h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="#6B7280" 
                        tick={{fontSize: 10, fill: '#6B7280'}} 
                        tickLine={false} 
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <Tooltip cursor={{fill: 'rgba(16, 185, 129, 0.05)'}} content={<CustomTooltip />} />
                    <Bar 
                        dataKey="value" 
                        fill="#10B981" 
                        radius={[4, 4, 0, 0]} 
                        animationDuration={800}
                        maxBarSize={60}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Existing Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-morphism p-5 rounded-xl shadow-lg h-72">
                <h3 className="text-gray-400 text-xs font-bold uppercase mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(240,180,41,0.5)]"></span>
                    Mapa de Calor (Carga por Hora)
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={hourlyData}>
                    <defs>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f0b429" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f0b429" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#4B5563" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4B5563" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2D2D2D', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                        itemStyle={{ color: '#f0b429' }}
                        cursor={{ stroke: '#4B5563', strokeDasharray: '5 5' }}
                    />
                    <Area type="monotone" dataKey="occupancy" stroke="#f0b429" strokeWidth={2} fillOpacity={1} fill="url(#colorOccupancy)" animationDuration={1000} />
                </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* --- UPDATED: MIX DE SERVICIOS --- */}
            <div className="glass-morphism p-5 rounded-xl shadow-lg h-72 flex flex-col">
                <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                        Mix de Servicios
                    </span>
                    <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">Top Rendimiento</span>
                </h3>
                
                {serviceData.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <PieChart size={32} className="mb-2"/>
                        <p className="text-xs font-mono uppercase">Sin datos suficientes</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={serviceData} 
                            layout="vertical" 
                            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                stroke="#9CA3AF" 
                                tick={{fontSize: 10, fill: '#D1D5DB', fontWeight: 500}} 
                                tickLine={false} 
                                axisLine={false} 
                                width={120} // Increased width for longer names
                            />
                            <Tooltip cursor={{fill: 'rgba(168, 85, 247, 0.05)'}} content={<ServiceTooltip />} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000}>
                                {serviceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#a855f7' : '#7e22ce'} fillOpacity={1 - (index * 0.15)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    </div>
  );
};
