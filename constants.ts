
import { Barber, Service, Appointment, AppointmentStatus, Client, BookingHistoryItem, GlobalStyleOptions } from './types';


// Default Fallbacks
export const DEFAULT_OPEN_HOUR = 8; // Reset to standard 8am
export const DEFAULT_CLOSE_HOUR = 20; // Reset to standard 8pm
export const TIME_SLICE_MINUTES = 30; // Standardized to 30 mins as requested

export const DEFAULT_STYLE_OPTIONS: GlobalStyleOptions = [
    {
        id: 'sides',
        label: 'Lados / Degradado',
        items: ['Tijera Clásico', 'Bajo (Low Fade)', 'Medio (Mid Fade)', 'Alto (High Fade)', 'Rapado (Skin)', 'Taper Fade']
    },
    {
        id: 'top',
        label: 'Parte Superior',
        items: ['Solo Puntas', 'Texturizado', 'Largo / Peinado', 'Corto Militar', 'Hacia Atrás', 'Crop Top']
    },
    {
        id: 'beard',
        label: 'Barba & Rostro',
        items: ['Sin Barba', 'Solo Bigote', 'Perfilado', 'Rebajar Volumen', 'Leñador', 'Candado']
    },
    {
        id: 'finish',
        label: 'Acabado Final',
        items: ['Natural (Nada)', 'Cera Mate', 'Gel / Brillo', 'Polvo Textura', 'Pomada Clásica']
    }
];

// No longer exporting mock arrays to prevent accidental usage.
// Role-specific data is now strictly loaded from Supabase.