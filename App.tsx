
import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_APPOINTMENTS, BARBERS as INITIAL_BARBERS, SERVICES as DEFAULT_SERVICES, DEFAULT_OPEN_HOUR, DEFAULT_CLOSE_HOUR, INITIAL_CLIENTS, MOCK_ADMIN_USER, DEFAULT_STYLE_OPTIONS } from './constants';
import { Appointment, Role, AppointmentStatus, Metrics, Client, BookingHistoryItem, Service, CutPreferences, Barber, GlobalStyleOptions } from './types';
import { Timeline } from './components/Timeline';
import { MetricsPanel } from './components/MetricsPanel';
import { BarberDashboard } from './components/BarberDashboard';
import { BookingWizard } from './components/BookingWizard';
import { ServiceManager } from './components/ServiceManager';
import { BarberManager } from './components/BarberManager';
import { ClientManager } from './components/ClientManager';
import { AppointmentEditor } from './components/AppointmentEditor';
import { UserProfile } from './components/UserProfile';
import { ShopRulesEditor } from './components/ShopRulesEditor';
import { StyleOptionsEditor } from './components/StyleOptionsEditor';
import { LoginPage } from './components/LoginPage';
import { MatrixBackground } from './components/MatrixBackground'; // Visual Upgrade
import { calculateEndTime, canClientCancel } from './services/timeEngine';
import { CancellationAnalysis } from './components/CancellationAnalysis'; // New Component
import { Scissors, User, LayoutDashboard, Menu, Plus, Settings, FileText, Users, ChevronDown, Bell, LogOut, Briefcase, Lock, Tag, Gauge, BarChart3, AlertCircle, Gamepad2, Zap, X } from 'lucide-react';
import { SnakeGame } from './components/SnakeGame';
import { ArcadePage } from './components/ArcadePage';
import { CinematicTransitions } from './components/CinematicTransitions';
import { useRealtimeAppointments } from './hooks/useRealtimeAppointments';
export default function App() {
    const [appointments, setAppointments] = useState<Appointment[]>(() => {
        const saved = localStorage.getItem('barberia_appointments');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.map((a: any) => ({
                ...a,
                startTime: new Date(a.startTime),
                expectedEndTime: new Date(a.expectedEndTime),
                actualStartTime: a.actualStartTime ? new Date(a.actualStartTime) : undefined,
                actualEndTime: a.actualEndTime ? new Date(a.actualEndTime) : undefined,
                cancellationDate: a.cancellationDate ? new Date(a.cancellationDate) : undefined
            }));
        }
        return INITIAL_APPOINTMENTS;
    });

    const [services, setServices] = useState<Service[]>(() => {
        const saved = localStorage.getItem('barberia_services');
        return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
    });

    // Persistence Layer (LocalStorage)
    const [adminProfile, setAdminProfile] = useState<Client>(() => {
        const saved = localStorage.getItem('barberia_admin_profile');
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...parsed, joinDate: new Date(parsed.joinDate) };
        }
        return MOCK_ADMIN_USER;
    });

    const [clients, setClients] = useState<Client[]>(() => {
        const saved = localStorage.getItem('barberia_clients');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.map((c: any) => ({ ...c, joinDate: new Date(c.joinDate) }));
        }
        return INITIAL_CLIENTS;
    });

    const [barbers, setBarbers] = useState<Barber[]>(() => {
        const saved = localStorage.getItem('barberia_barbers');
        return saved ? JSON.parse(saved) : INITIAL_BARBERS;
    });

    // Save triggers
    useEffect(() => {
        localStorage.setItem('barberia_admin_profile', JSON.stringify(adminProfile));
    }, [adminProfile]);

    useEffect(() => {
        localStorage.setItem('barberia_clients', JSON.stringify(clients));
    }, [clients]);

    useEffect(() => {
        localStorage.setItem('barberia_barbers', JSON.stringify(barbers));
    }, [barbers]);

    useEffect(() => {
        localStorage.setItem('barberia_appointments', JSON.stringify(appointments));
    }, [appointments]);

    useEffect(() => {
        localStorage.setItem('barberia_services', JSON.stringify(services));
    }, [services]);

    const [loggedInUser, setLoggedInUser] = useState<Client>(adminProfile);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [role, setRole] = useState<Role>(Role.ADMIN);
    const [organizationId, setOrganizationId] = useState<string | null>(null);

    // ⚡ ENABLE REALTIME
    useRealtimeAppointments(organizationId, setAppointments);
    // Removed duplicate state initializations
    const [styleOptions, setStyleOptions] = useState<GlobalStyleOptions>(DEFAULT_STYLE_OPTIONS);

    // Shop Settings State (Dynamic)
    const [shopRules, setShopRules] = useState<string>("1. Venir con el cabello lavado y sin gel.\n2. Llegar 5 minutos antes de la cita.\n3. Avisar cancelaciones con antelación.");
    const [openHour, setOpenHour] = useState<number>(DEFAULT_OPEN_HOUR);
    const [closeHour, setCloseHour] = useState<number>(DEFAULT_CLOSE_HOUR);
    // NEW: Dynamic Time Slice State
    const [timeSliceMinutes, setTimeSliceMinutes] = useState<number>(30); // Default to 30 mins as requested

    // UI State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isServiceManagerOpen, setIsServiceManagerOpen] = useState(false);
    const [isBarberManagerOpen, setIsBarberManagerOpen] = useState(false);
    const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isShopRulesOpen, setIsShopRulesOpen] = useState(false);
    const [isStyleEditorOpen, setIsStyleEditorOpen] = useState(false);
    const [isCancellationReportOpen, setIsCancellationReportOpen] = useState(false); // New state for report
    const [isGamingMode, setIsGamingMode] = useState(false); // NEW: Full-screen theater mode
    const [isArcadePageOpen, setIsArcadePageOpen] = useState(false); // DEDICATED PAGE
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // ADMIN SPECIFIC STATE: View Mode (Dashboard vs Workstation)
    const [adminViewMode, setAdminViewMode] = useState<'DASHBOARD' | 'WORKSTATION'>('DASHBOARD');

    // --- Cinematic State ---
    const [loginTransition, setLoginTransition] = useState<{ profile: Role, name: string } | null>(null);
    const [isTVTurningOff, setIsTVTurningOff] = useState(false);

    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // --- Derived State for Access Control ---

    // If role is BARBER, they only see themselves.
    // If role is ADMIN, they see ALL, UNLESS they are in "Workstation Mode" where they might want to focus on their own queue (or a specific barber).
    const visibleBarbers = useMemo(() => {
        if (role === Role.BARBER) {
            return barbers.filter(b => b.id === loggedInUser.id);
        }
        return barbers;
    }, [barbers, role, loggedInUser.id]);

    // If role is BARBER, they only see their appointments.
    // Admin sees all.
    const visibleAppointments = useMemo(() => {
        if (role === Role.BARBER) {
            return appointments.filter(a => a.barberId === loggedInUser.id);
        }
        return appointments;
    }, [appointments, role, loggedInUser.id]);


    // --- Login Handler (Secure: Supabase Auth + Legacy Fallback) ---
    const handleLogin = async (identity: string, code: string) => {
        setAuthError(null);

        // 1. Try Supabase Auth (Administrator / Authenticated User)
        try {
            // Attempt proper authentication first
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: identity,
                password: code,
            });

            if (authData.session) {
                // Determine User Role from Profile
                // Note: The new script ensures admins have a linked profile in 'profiles' table
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                if (profileError) {
                    console.error("❌ Auth SUCCESS but Profile Load FAILED:", profileError.message);
                    console.error("This is likely an RLS Policy issue. The user cannot read their own profile row.");
                }

                if (profile) {
                    const roleName = profile.role || Role.ADMIN; // Default to Admin if auth succeeds but role missing

                    setLoginTransition({ profile: roleName as Role, name: profile.name || 'Administrador' });

                    setTimeout(() => {
                        setRole(roleName as Role);

                        // Construct user object
                        const adminUser: Client = {
                            id: profile.id,
                            name: profile.name || 'Admin',
                            email: profile.email || identity,
                            phone: profile.phone || '',
                            identification: 'ADMIN',
                            accessCode: '******',
                            bookingHistory: [],
                            joinDate: new Date(),
                            points: 0,
                            avatar: profile.avatar || '',
                            role: Role.ADMIN // Important for permission checks
                        };

                        setAdminProfile(adminUser); // Sync admin state
                        setLoggedInUser(adminUser);
                        setIsAuthenticated(true);
                        setLoginTransition(null);
                    }, 3000);
                    return;
                }
            }
        } catch (err) {
            // Ignore error and fallthrough to legacy checks (Simulated Users)
            console.log("Auth attempt failed (or RLS blocked profile), checking legacy local users...", err);
        }

        // 2. Fallback: Legacy / Simulated Checks (Barbers & Clients with PINs)

        // 2.1 Check Admin (Legacy Local State)
        if (
            (identity === adminProfile.identification || identity === adminProfile.email) &&
            code === adminProfile.accessCode
        ) {
            setLoginTransition({ profile: Role.ADMIN, name: adminProfile.name });
            setTimeout(() => {
                setRole(Role.ADMIN);
                setLoggedInUser(adminProfile);
                setIsAuthenticated(true);
                setLoginTransition(null);
            }, 3000);
            return;
        }

        // 2.2 Check Barbers
        const barberFound = barbers.find(b =>
            (b.identification === identity || b.email === identity) && b.accessCode === code
        );

        if (barberFound) {
            setLoginTransition({ profile: Role.BARBER, name: barberFound.name });
            setTimeout(() => {
                setRole(Role.BARBER); // CORRECT: Set specific Barber Role

                // Create a "Client-like" object for the barber to satisfy the User interface
                const barberAsUser: Client = {
                    id: barberFound.id,
                    name: barberFound.name,
                    phone: '',
                    email: barberFound.email,
                    identification: barberFound.identification,
                    accessCode: barberFound.accessCode,
                    bookingHistory: [],
                    joinDate: new Date(),
                    points: 0,
                    avatar: barberFound.avatar,
                    sticker: barberFound.sticker,
                    notes: `Staff: ${barberFound.tier}`
                };
                setLoggedInUser(barberAsUser);
                setIsAuthenticated(true);
                setLoginTransition(null);
            }, 5500); // Allow full 5.5s animation
            return;
        }

        // 2.3 Check Clients
        const clientFound = clients.find(c =>
            (c.identification === identity || c.email === identity) && c.accessCode === code
        );

        if (clientFound) {
            setLoginTransition({ profile: Role.CLIENT, name: clientFound.name });
            setTimeout(() => {
                setRole(Role.CLIENT);
                setLoggedInUser(clientFound);
                setIsAuthenticated(true);
                setLoginTransition(null);
            }, 3500);
            return;
        }

        setAuthError("Credenciales inválidas. Verifica tu Cédula/Email y Código.");
    };

    const handleLogout = () => {
        setIsTVTurningOff(true); // START TV OFF ANIMATION
        setTimeout(() => {
            setIsAuthenticated(false);
            setRole(Role.ADMIN); // Reset to default for safety
            setAuthError(null);
            setAdminViewMode('DASHBOARD'); // Reset admin view
            setIsTVTurningOff(false);
        }, 1500); // Wait for white line flash
    };

    // Calculate Metrics Real-time (Scoped by visibleAppointments)
    const metrics: Metrics = useMemo(() => {
        // Only calculate for the currently selected day
        const todaysAppointments = visibleAppointments.filter(a =>
            a.startTime.getDate() === currentDate.getDate() &&
            a.status !== AppointmentStatus.CANCELLED
        );

        // Use visibleBarbers length for capacity
        const totalMinutesAvailable = (closeHour - openHour) * 60 * visibleBarbers.length;

        let bookedMinutes = 0;
        let completedCount = 0;
        let revenue = 0;

        todaysAppointments.forEach(apt => {
            const duration = (apt.expectedEndTime.getTime() - apt.startTime.getTime()) / 60000;
            bookedMinutes += duration;
            revenue += apt.price;
            if (apt.status === AppointmentStatus.COMPLETED) completedCount++;
        });

        const deadTime = Math.max(0, totalMinutesAvailable - bookedMinutes);

        return {
            dailyOccupancy: totalMinutesAvailable > 0 ? Math.round((bookedMinutes / totalMinutesAvailable) * 100) : 0,
            deadTimeMinutes: Math.round(deadTime),
            revenue,
            appointmentsCompleted: completedCount,
            appointmentsTotal: todaysAppointments.length
        };
    }, [visibleAppointments, currentDate, visibleBarbers.length, openHour, closeHour]);

    const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
        setAppointments(prev => prev.map(a => {
            if (a.id !== id) return a;

            const updates: any = { status: newStatus };

            // TIME TRACKING LOGIC
            if (newStatus === AppointmentStatus.IN_PROGRESS) {
                updates.actualStartTime = new Date(); // Start the stopwatch
            } else if (newStatus === AppointmentStatus.COMPLETED) {
                updates.actualEndTime = new Date(); // Stop the stopwatch

                // Calculate actual duration in minutes
                if (a.actualStartTime) {
                    const diffMs = updates.actualEndTime.getTime() - a.actualStartTime.getTime();
                    updates.durationMinutes = Math.round(diffMs / 60000); // Update record with REAL duration
                }
            }

            return { ...a, ...updates };
        }));

        // Update Client Stats if appointment is completed
        if (newStatus === AppointmentStatus.COMPLETED) {
            const apt = appointments.find(a => a.id === id);

            if (apt && apt.status !== AppointmentStatus.COMPLETED) {
                const service = services.find(s => s.id === apt.serviceId);
                const barber = barbers.find(b => b.id === apt.barberId);

                if (service && barber) {
                    const historyItem: BookingHistoryItem = {
                        id: `hist-${Math.random().toString(36).substr(2, 9)}`,
                        date: apt.startTime,
                        serviceName: service.name,
                        barberName: barber.name,
                        price: apt.price,
                        notes: apt.notes ? `Nota de cita: ${apt.notes}` : undefined
                    };

                    setClients(prevClients => prevClients.map(c =>
                        c.id === apt.clientId
                            ? {
                                ...c,
                                bookingHistory: [historyItem, ...c.bookingHistory],
                                lastVisit: new Date(),
                                points: c.points + 1
                            }
                            : c
                    ));
                }
            }
        }
    };

    const handleUpdateAppointment = (id: string, updates: { price: number; durationMinutes: number; startTime?: Date }) => {
        setAppointments(prev => prev.map(apt => {
            if (apt.id !== id) return apt;

            const startToUse = updates.startTime || apt.startTime;
            const newEndTime = new Date(startToUse.getTime() + updates.durationMinutes * 60000);

            return {
                ...apt,
                price: updates.price,
                durationMinutes: updates.durationMinutes,
                startTime: startToUse,
                expectedEndTime: newEndTime
            };
        }));
        setEditingAppointment(null);
    };

    // --- CANCELLATION HANDLER ---
    const handleCancelAppointment = (appointmentId: string, reason?: string) => {
        const apt = appointments.find(a => a.id === appointmentId);
        if (!apt) return;

        // Ensure reason is captured
        const updates: any = {
            status: AppointmentStatus.CANCELLED,
            cancellationReason: reason || 'Cancelada por usuario',
            cancellationDate: new Date()
        };

        setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, ...updates } : a));
    };

    // --- CRUD Handlers (Simplified) ---
    const handleCreateClient = (clientData: Omit<Client, 'id' | 'bookingHistory' | 'points' | 'joinDate'>): Client => {
        const newClient: Client = {
            id: `c${clients.length + 1}`,
            ...clientData,
            bookingHistory: [],
            points: 0,
            joinDate: new Date()
        };
        setClients(prev => [...prev, newClient]);
        return newClient;
    };

    const handleUpdateClient = (updatedClient: Client) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        // Sync Session if needed
        if (loggedInUser.id === updatedClient.id) {
            setLoggedInUser(updatedClient);
        }
    };

    const handleDeleteClient = (clientId: string) => {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setAppointments(prev => prev.filter(a => a.clientId !== clientId));
    };

    // Profile Updater (Polymorphic: Handles Barber or Client)
    const handleUpdateProfile = async (updatedData: Partial<Client>) => {
        try {
            // 1. Update Core Profile (Supabase)
            if (loggedInUser.id) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update(updatedData)
                    .eq('id', loggedInUser.id);

                if (profileError) console.error('Error updating profile:', profileError);

                // 2. Propagate to specific tables (Barbers/Clients) for data consistency
                // Note: Triggers ideally handle this, but explicit update ensures immediate consistency for this UI
                if (role === Role.BARBER || role === Role.ADMIN) {
                    await supabase
                        .from('barbers')
                        .update(updatedData)
                        .eq('profile_id', loggedInUser.id);
                } else if (role === Role.CLIENT) {
                    // For clients, if the ID matches the auth ID
                    await supabase
                        .from('clients')
                        .update(updatedData)
                        .eq('profile_id', loggedInUser.id); // Assuming linked via profile_id or id
                }
            }
        } catch (err) {
            console.error('Failed to persist profile update:', err);
        }

        // 3. Local State Optimistic Update
        if (role === Role.CLIENT) {
            const updatedClient = { ...loggedInUser, ...updatedData };
            handleUpdateClient(updatedClient);
        } else if (role === Role.BARBER) {
            // If it's a barber, we must update the Barber list AND the current user session wrapper
            const barber = barbers.find(b => b.id === loggedInUser.id)!;
            const updatedBarber: Barber = {
                ...barber,
                ...(updatedData as Partial<Barber>)
            };

            handleUpdateBarber(updatedBarber);

            // Update Session
            setLoggedInUser(prev => ({ ...prev, ...updatedData }));
        } else if (role === Role.ADMIN) {
            const updatedAdmin = { ...adminProfile, ...updatedData };
            setAdminProfile(updatedAdmin);
            setLoggedInUser(updatedAdmin);
        }
    };


    const handleUpdatePreferences = (clientId: string, prefs: CutPreferences) => setClients(prev => prev.map(c => c.id === clientId ? { ...c, preferences: prefs } : c));
    const handleAddService = (serviceData: Omit<Service, 'id'>) => setServices(prev => [...prev, { id: `s-${Math.random()}`, ...serviceData }]);
    const handleUpdateService = (updatedService: Service) => setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
    const handleDeleteService = (serviceId: string) => setServices(prev => prev.filter(s => s.id !== serviceId));
    const handleAddBarber = (barberData: Omit<Barber, 'id'>) => setBarbers(prev => [...prev, { id: `b-${Math.random()}`, ...barberData }]);

    const handleUpdateBarber = (updatedBarber: Barber) => {
        setBarbers(prev => prev.map(b => b.id === updatedBarber.id ? updatedBarber : b));
        // Sync Session if needed
        if (loggedInUser.id === updatedBarber.id) {
            setLoggedInUser(prev => ({ ...prev, avatar: updatedBarber.avatar, name: updatedBarber.name }));
        }
    };

    const handleDeleteBarber = (barberId: string) => setBarbers(prev => prev.filter(b => b.id !== barberId));

    // Updated Settings Handler to include Time Slice
    const handleUpdateSettings = (settings: { rules: string; openHour: number; closeHour: number; timeSlice: number }) => {
        setShopRules(settings.rules);
        setOpenHour(settings.openHour);
        setCloseHour(settings.closeHour);
        setTimeSliceMinutes(settings.timeSlice);
    };
    const handleUpdateStyles = (newStyles: GlobalStyleOptions) => {
        setStyleOptions(newStyles);
    };

    // --- Booking ---
    const handleBook = (clientId: string, clientName: string, barberId: string, serviceId: string, time: Date) => {
        const barber = barbers.find(b => b.id === barberId)!;
        const service = services.find(s => s.id === serviceId)!;

        const realDuration = Math.ceil(service.durationMinutes * barber.speedFactor);
        const endTime = calculateEndTime(time, service.durationMinutes, barber.speedFactor);

        const newAppointment: Appointment = {
            id: Math.random().toString(36).substr(2, 9),
            clientId,
            clientName,
            barberId,
            serviceId,
            startTime: time,
            expectedEndTime: endTime,
            status: AppointmentStatus.SCHEDULED,
            price: service.price,
            durationMinutes: realDuration
        };

        setAppointments(prev => [...prev, newAppointment]);
        setIsBookingModalOpen(false);
        setCurrentDate(time);
    };

    // --- RENDER ---

    if (!isAuthenticated) {
        return (
            <>
                {isTVTurningOff && <CinematicTransitions type="LOGOUT" />}
                {loginTransition && <CinematicTransitions type="LOGIN" profile={loginTransition.profile} userName={loginTransition.name} />}
                <LoginPage onLogin={handleLogin} error={authError} />
            </>
        );
    }

    // Define Layout Logic
    const showAdminDashboard = role === Role.ADMIN || role === Role.BARBER;

    const currentBarber = role === Role.BARBER
        ? barbers.find(b => b.id === loggedInUser.id)
        : (role === Role.ADMIN && adminViewMode === 'WORKSTATION')
            ? barbers[0] // Assume Admin acts as the first barber (Master)
            : null;

    return (
        <>
            {/* --- CINEMATIC TRANSITION OVERLAYS (OUTSIDE THE SHRINKING CONTENT) --- */}
            {/* GLOBAL OVERLAYS - Fixed Position, Z-Index 9999+ */}
            {loginTransition && (
                <CinematicTransitions
                    type="LOGIN"
                    profile={loginTransition.profile}
                    userName={loginTransition.name}
                />
            )}

            {/* TV LOGOUT OVERLAY */}
            {isTVTurningOff && (
                <CinematicTransitions type="LOGOUT" />
            )}

            {/* MAIN APP CONTENT - THIS IS WHAT SHRINKS LIKE A TV */}
            <div className={`min-h-screen text-gray-100 font-sans selection:bg-brand-500/30 relative origin-center transition-all duration-1000 ${isTVTurningOff ? 'animate-tv-turn-off pointer-events-none' : ''}`}>

                {/* HIGH TECH BACKGROUND LAYER */}
                <MatrixBackground />

                {/* CONTENT LAYER - Z-Index 10 ensures it floats above the canvas */}
                <div className="relative z-10 min-h-screen flex flex-col">

                    {/* Navigation Bar - NOW WITH GLASS MORPHISM */}
                    <nav className="glass-morphism h-16 fixed top-0 w-full z-50 flex items-center justify-between px-4 md:px-6 shadow-lg border-b-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-500 p-1.5 rounded-lg text-black shadow-[0_0_15px_rgba(240,180,41,0.4)]">
                                <Scissors size={20} strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white hidden sm:inline">CHRONOS<span className="text-brand-500">.BARBER</span></span>
                        </div>

                        <div className="flex items-center gap-4">

                            {role === Role.ADMIN && (
                                <div className="flex items-center gap-2 glass-morphism-inner p-1 rounded-full border border-white/5">
                                    <button
                                        onClick={() => setAdminViewMode('DASHBOARD')}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${adminViewMode === 'DASHBOARD' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        <BarChart3 size={14} />
                                        <span className="hidden sm:inline">Panel</span>
                                    </button>
                                    <button
                                        onClick={() => setAdminViewMode('WORKSTATION')}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${adminViewMode === 'WORKSTATION' ? 'bg-brand-500 text-black shadow-[0_0_10px_rgba(202,168,111,0.4)]' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        <Scissors size={14} />
                                        <span className="hidden sm:inline">Workstation</span>
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pl-4 border-l border-white/10 h-8">
                                <div className="text-right hidden sm:block leading-tight">
                                    <div className="text-xs font-bold text-white">{loggedInUser.name}</div>
                                    <div className="text-[10px] text-brand-500 font-mono tracking-wide uppercase">
                                        {role === Role.ADMIN ? 'Administrador' : role === Role.BARBER ? 'Barbero' : 'Cliente'}
                                    </div>
                                </div>

                                {/* Show Config Button for Barbers as well */}
                                {(role === Role.BARBER || role === Role.ADMIN) && (
                                    <button
                                        onClick={() => setIsShopRulesOpen(true)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors mr-1"
                                        title="Configuración de Agenda"
                                    >
                                        <Settings size={18} />
                                    </button>
                                )}

                                <button
                                    onClick={() => setIsProfileOpen(true)}
                                    className="group relative flex items-center gap-2 rounded-full hover:bg-white/10 transition-all p-0.5 pr-1 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                    title="Abrir Perfil"
                                >
                                    <div className="relative w-10 h-10 rounded-full bg-dark-600 border-2 border-dark-500 group-hover:border-brand-500 transition-colors shadow-lg overflow-hidden">
                                        {loggedInUser.avatar ? (
                                            <img src={loggedInUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-600 to-brand-400">
                                                <User size={18} className="text-black" />
                                            </div>
                                        )}
                                    </div>
                                    <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors mr-1" />
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* Main Content Area - with padding for navbar */}
                    <main className="pt-24 px-4 md:px-6 flex-1 flex flex-col pb-4">

                        {showAdminDashboard ? (
                            <>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div>
                                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 drop-shadow-lg">
                                            {role === Role.BARBER && <Lock size={20} className="text-gray-500" />}
                                            {role === Role.BARBER ? `Estación de Trabajo` : `Centro de Operaciones`}
                                        </h1>
                                        <p className="text-gray-400 text-sm mt-1 font-medium">
                                            {role === Role.BARBER
                                                ? `Barbero: ${loggedInUser.name}`
                                                : adminViewMode === 'WORKSTATION'
                                                    ? 'Modo Operativo Activo (Vista de Barbero)'
                                                    : 'Gestión de rendimiento y agenda global'
                                            }
                                        </p>
                                    </div>

                                    {/* Management Toolbar - Only for ADMIN */}
                                    {role === Role.ADMIN && adminViewMode === 'DASHBOARD' && (
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => setIsCancellationReportOpen(true)}
                                                className="flex items-center gap-2 glass-morphism-inner text-red-400 px-4 py-2 rounded-lg font-bold hover:bg-red-900/20 hover:text-red-300 border border-red-900/30 backdrop-blur transition-all"
                                            >
                                                <AlertCircle size={18} />
                                                Reporte Cancelaciones
                                            </button>
                                            {/* Settings moved to nav bar for barbers, but kept here for explicit Admin Access */}
                                            <button
                                                onClick={() => setIsShopRulesOpen(true)}
                                                className="flex items-center gap-2 glass-morphism-inner text-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur transition-all"
                                            >
                                                <Settings size={18} />
                                                Configuración
                                            </button>
                                            <button
                                                onClick={() => setIsStyleEditorOpen(true)}
                                                className="flex items-center gap-2 glass-morphism-inner text-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur transition-all"
                                            >
                                                <Tag size={18} />
                                                Estilos
                                            </button>
                                            <button
                                                onClick={() => setIsBarberManagerOpen(true)}
                                                className="flex items-center gap-2 glass-morphism-inner text-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur transition-all"
                                            >
                                                <Briefcase size={18} />
                                                Staff
                                            </button>
                                            <button
                                                onClick={() => setIsClientManagerOpen(true)}
                                                className="flex items-center gap-2 glass-morphism-inner text-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur transition-all"
                                            >
                                                <Users size={18} />
                                                Clientes
                                            </button>
                                            <button
                                                onClick={() => setIsServiceManagerOpen(true)}
                                                className="flex items-center gap-2 glass-morphism-inner text-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur transition-all"
                                            >
                                                <Scissors size={18} />
                                                Servicios
                                            </button>
                                            <button
                                                onClick={() => setIsBookingModalOpen(true)}
                                                className="flex items-center gap-2 bg-brand-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-brand-400 shadow-[0_4px_20px_-5px_rgba(240,180,41,0.4)] transition-all transform hover:scale-105"
                                            >
                                                <Plus size={18} strokeWidth={3} />
                                                Nueva Cita
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* CONDITIONAL DASHBOARD: BARBER vs ADMIN (Dashboard vs Workstation) */}
                                {(role === Role.BARBER || (role === Role.ADMIN && adminViewMode === 'WORKSTATION')) ? (
                                    <BarberDashboard
                                        barberId={role === Role.BARBER ? loggedInUser.id : 'b1'}
                                        currentBarber={currentBarber || undefined}
                                        barbers={barbers}
                                        appointments={visibleAppointments}
                                        services={services}
                                        onStatusChange={handleStatusChange}
                                        onUpdateBarber={handleUpdateBarber}
                                        openHour={openHour}
                                        closeHour={closeHour}
                                    />
                                ) : (
                                    <MetricsPanel
                                        metrics={metrics}
                                        appointments={visibleAppointments}
                                        currentDate={currentDate}
                                        services={services}
                                        openHour={openHour}
                                        closeHour={closeHour}
                                    />
                                )}

                                <div className="glass-morphism rounded-xl shadow-2xl flex flex-col relative overflow-visible mt-6">
                                    <Timeline
                                        barbers={visibleBarbers}
                                        appointments={visibleAppointments}
                                        services={services}
                                        currentDate={currentDate}
                                        openHour={openHour}
                                        closeHour={closeHour}
                                        timeSliceMinutes={timeSliceMinutes} // Passed down for dynamic grid
                                        onStatusChange={handleStatusChange}
                                        onDateChange={setCurrentDate}
                                        onEditAppointment={setEditingAppointment}
                                    />
                                </div>
                            </>
                        ) : (
                            // CLIENT VIEW
                            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-500">
                                {/* PROFESSIONAL CLIENT HUB */}
                                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                                    {/* LEFT: QUICK BOOKING BOX (Col 1-5) */}
                                    <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
                                        <div className="glass-morphism-inner p-8 rounded-[2.5rem] border border-white/10 space-y-8 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                            <div className="relative">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Citas Disponibles</span>
                                                </div>
                                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-[0.9] mb-4">Reserva tu<br />Experiencia</h2>
                                                <p className="text-gray-400 text-xs font-medium leading-relaxed mb-6">Elige el servicio que mejor se adapte a tu estilo y asegura tu lugar con los expertos.</p>
                                            </div>

                                            <div className="glass-morphism rounded-2xl border border-white/5 overflow-hidden">
                                                <BookingWizard
                                                    barbers={barbers}
                                                    services={services}
                                                    clients={clients}
                                                    existingAppointments={appointments}
                                                    shopRules={shopRules}
                                                    openHour={openHour}
                                                    closeHour={closeHour}
                                                    timeSliceMinutes={timeSliceMinutes}
                                                    currentUser={loggedInUser}
                                                    currentRole={role}
                                                    onBook={handleBook}
                                                    onCancel={() => { }}
                                                    onCreateClient={handleCreateClient}
                                                    onUpdateClient={handleUpdateClient}
                                                    onDeleteClient={handleDeleteClient}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats for Trust */}
                                        <div className="grid grid-cols-3 gap-4 px-4">
                                            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <p className="text-xl font-black text-white">{barbers.length}</p>
                                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Expertos</p>
                                            </div>
                                            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <p className="text-xl font-black text-white">{services.length}</p>
                                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Estilos</p>
                                            </div>
                                            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <p className="text-xl font-black text-white">100%</p>
                                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Calidad</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: ARCADE & PROFILE (Col 6-12) */}
                                    <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
                                        {/* WELCOME BANNER */}
                                        <div className="glass-morphism-inner p-6 rounded-2xl flex items-center justify-between backdrop-blur-md border border-brand-500/20">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                                    <User className="text-brand-500" size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Bienvenido de nuevo</p>
                                                    <h3 className="text-xl font-black text-white italic">{loggedInUser.name}</h3>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Sesión Segura</span>
                                            </div>
                                        </div>

                                        {/* ARCADE THEATER TEASER */}
                                        <div className="glass-morphism rounded-[2.5rem] border border-white/10 overflow-hidden group/game relative">
                                            {/* Dynamic Gradient Background */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-emerald-500/5 to-transparent opacity-0 group-hover/game:opacity-100 transition-opacity duration-1000" />

                                            <div className="relative p-8">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover/game:border-brand-500/40 transition-all duration-500 group-hover/game:shadow-[0_0_30px_rgba(202,168,111,0.2)]">
                                                            <Gamepad2 className="text-brand-500 group-hover/game:scale-110 transition-transform" size={28} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="w-1 h-1 bg-brand-500 rounded-full animate-ping" />
                                                                <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em]">Entertainment Hub</p>
                                                            </div>
                                                            <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">Chronos Arcade</h3>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 rounded-full border border-brand-500/20">
                                                        <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                                                        <span className="text-[9px] text-brand-500 font-black uppercase tracking-widest">Interactive Teaser</span>
                                                    </div>
                                                </div>

                                                <div className="bg-dark-950/80 rounded-3xl border border-white/5 p-6 relative group/screen overflow-hidden">
                                                    {/* Ambient Screen Glow */}
                                                    <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover/screen:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                                    <SnakeGame />
                                                    <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover/game:opacity-100 transition-opacity">
                                                        <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                                                            Usa las flechas para jugar • Clic para Pantalla Completa
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                {/* Admin Booking Modal (Only for Admin to create appointments for others) */}
                {isBookingModalOpen && role === Role.ADMIN && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-lg transform transition-all scale-100 glass-morphism rounded-xl">
                            <BookingWizard
                                barbers={barbers}
                                services={services}
                                clients={clients}
                                existingAppointments={appointments}
                                shopRules={shopRules}
                                openHour={openHour}
                                closeHour={closeHour}
                                timeSliceMinutes={timeSliceMinutes} // Passed down
                                currentUser={loggedInUser}
                                currentRole={Role.ADMIN}
                                onBook={handleBook}
                                onCancel={() => setIsBookingModalOpen(false)}
                                onCreateClient={handleCreateClient}
                                onUpdateClient={handleUpdateClient}
                                onDeleteClient={handleDeleteClient}
                            />
                        </div>
                    </div>
                )}

                {/* Modals - Only render if user has permission (ADMIN or BARBER for specific ones) */}

                {/* Services Manager - Admin Only */}
                {role === Role.ADMIN && isServiceManagerOpen && (
                    <ServiceManager
                        services={services}
                        onAdd={handleAddService}
                        onUpdate={handleUpdateService}
                        onDelete={handleDeleteService}
                        onClose={() => setIsServiceManagerOpen(false)}
                    />
                )}

                {/* Barber Manager - Admin Only */}
                {role === Role.ADMIN && isBarberManagerOpen && (
                    <BarberManager
                        barbers={barbers}
                        onAdd={handleAddBarber}
                        onUpdate={handleUpdateBarber}
                        onDelete={handleDeleteBarber}
                        onClose={() => setIsBarberManagerOpen(false)}
                    />
                )}

                {/* Client Manager - Admin Only */}
                {role === Role.ADMIN && isClientManagerOpen && (
                    <ClientManager
                        clients={clients}
                        onAdd={handleCreateClient}
                        onUpdate={handleUpdateClient}
                        onDelete={handleDeleteClient}
                        onClose={() => setIsClientManagerOpen(false)}
                    />
                )}

                {/* Shop Rules / Time Slice Settings - Available to Admin AND Barber (as requested) */}
                {(role === Role.ADMIN || role === Role.BARBER) && isShopRulesOpen && (
                    <ShopRulesEditor
                        currentRules={shopRules}
                        currentOpenHour={openHour}
                        currentCloseHour={closeHour}
                        currentTimeSlice={timeSliceMinutes}
                        onSave={handleUpdateSettings}
                        onClose={() => setIsShopRulesOpen(false)}
                    />
                )}

                {/* Style Editor - Admin Only */}
                {role === Role.ADMIN && isStyleEditorOpen && (
                    <StyleOptionsEditor
                        currentOptions={styleOptions}
                        onSave={handleUpdateStyles}
                        onClose={() => setIsStyleEditorOpen(false)}
                    />
                )}

                {/* Cancellation Report - Admin Only */}
                {role === Role.ADMIN && isCancellationReportOpen && (
                    <CancellationAnalysis
                        appointments={appointments}
                        onClose={() => setIsCancellationReportOpen(false)}
                    />
                )}

                {/* Appointment Editor (Available to Admin and Barber) */}
                {editingAppointment && (
                    <AppointmentEditor
                        appointment={editingAppointment}
                        allAppointments={appointments}
                        serviceName={services.find(s => s.id === editingAppointment.serviceId)?.name || 'Servicio'}
                        onClose={() => setEditingAppointment(null)}
                        onSave={handleUpdateAppointment}
                    />
                )}

                {/* User Profile / Dashboard Drawer */}
                {isProfileOpen && loggedInUser && (
                    <UserProfile
                        client={loggedInUser}
                        shopRules={shopRules}
                        globalOptions={styleOptions}
                        userRole={role}
                        userAppointments={appointments.filter(a => a.clientId === loggedInUser.id && a.status !== AppointmentStatus.CANCELLED)}
                        onClose={() => setIsProfileOpen(false)}
                        onUpdatePreferences={handleUpdatePreferences}
                        onUpdateProfile={handleUpdateProfile} // Added profile update handler
                        onCancelAppointment={handleCancelAppointment}
                    />
                )}

                {/* WORLD-CLASS DEDICATED ARCADE PAGE */}
                {isArcadePageOpen && (
                    <ArcadePage
                        playerName={loggedInUser?.name || 'Invitado'}
                        onBack={() => setIsArcadePageOpen(false)}
                    />
                )}
                {/* End of Main App Content Wrapper */}
            </div >
        </>
    );
}