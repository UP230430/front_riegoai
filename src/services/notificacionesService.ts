import { colores } from '@/theme/tokens';
import type { NotificacionApp, TipoNotificacion } from '@/types';
import { Platform } from 'react-native';
import { espera } from './bd';
 
// Notificaciones locales de demostración. La app registra un canal en
// Android y muestra la notificación directamente en primer plano.
//
// IMPORTANTE: 'expo-notifications' se carga con require dentro de try/catch
// y NO con un import estático. Si el módulo nativo no existe en el entorno
// (por ejemplo, Expo Go con otra versión), la app arranca igual y las
// notificaciones locales simplemente se omiten.
 
type ModuloNotificaciones = typeof import('expo-notifications');
 
let Notifications: ModuloNotificaciones | null = null;
try {
  Notifications = require('expo-notifications') as ModuloNotificaciones;
} catch (e) {
  console.warn('expo-notifications no disponible en este entorno:', e);
}
 
// Handler global: cómo se muestra la notificación mientras la app está abierta.
try {
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('No se pudo configurar el handler de notificaciones:', e);
}
 
export type EstadoPermisos = 'granted' | 'denied' | 'undetermined';
 
export async function consultarPermisos(): Promise<EstadoPermisos> {
  if (!Notifications) return 'undetermined';
  try {
    const ajustes = await Notifications.getPermissionsAsync();
    return ajustes.status === 'granted' ? 'granted' : ajustes.canAskAgain ? 'denied' : 'undetermined';
  } catch {
    return 'undetermined';
  }
}
 
export async function solicitarPermisos(): Promise<EstadoPermisos> {
  if (!Notifications) return 'undetermined';
  try {
    const ajustes = await Notifications.requestPermissionsAsync();
    return ajustes.status === 'granted' ? 'granted' : 'undetermined';
  } catch {
    return 'undetermined';
  }
}
 
/** Canal Android (obligatorio en API 33+ para notificaciones locales). */
export async function inicializarCanal(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications) return;
  try {
    await Notifications.setNotificationChannelAsync('riegosmart-demo', {
      name: 'RiegoSmart IA · Demo',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: colores.primary,
    });
  } catch (e) {
    console.warn('No se pudo crear el canal de notificaciones:', e);
  }
}
 
export async function enviarLocal(
  tipo: TipoNotificacion,
  titulo: string,
  cuerpo: string,
): Promise<void> {
  try {
    await Notifications?.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo, sound: true },
      trigger: null,
    });
  } catch (e) {
    console.warn('No se pudo enviar la notificación local:', e);
  }
  // La notificación dentro de la app se registra siempre, haya o no módulo nativo.
  anadirApp(tipo, titulo, cuerpo);
}
 
// ---- Notificaciones dentro de la app (lista demo, en memoria) ----
 
const notificaciones: NotificacionApp[] = [
  {
    id: 'n-seed-1',
    tipo: 'enfermedad_detectada',
    titulo: 'Enfermedad detectada',
    cuerpo: 'Mildiu en hojas basales de Tomate Cherry · confianza 91%.',
    fecha: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    leida: false,
  },
  {
    id: 'n-seed-2',
    tipo: 'riego_realizado',
    titulo: 'Riego realizado',
    cuerpo: 'Bomba GPIO 17 suministró 180 mL en Albahaca #1.',
    fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    leida: false,
  },
  {
    id: 'n-seed-3',
    tipo: 'dispositivo_desconectado',
    titulo: 'Dispositivo desconectado',
    cuerpo: 'RPi Offline durante 3 min · riego automático pausado.',
    fecha: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    leida: true,
  },
];
 
function listarNotificacionesDemo(): NotificacionApp[] {
  return [...notificaciones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}
 
function anadirApp(tipo: TipoNotificacion, titulo: string, cuerpo: string): NotificacionApp {
  const n: NotificacionApp = {
    id: `n-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
    tipo,
    titulo,
    cuerpo,
    fecha: new Date().toISOString(),
    leida: false,
  };
  notificaciones.unshift(n);
  if (notificaciones.length > 50) notificaciones.length = 50;
  return n;
}
 
export function marcarLeida(id: string): void {
  const n = notificaciones.find((x) => x.id === id);
  if (n) n.leida = true;
}
 
export function marcarTodasLeidas(): void {
  notificaciones.forEach((n) => {
    n.leida = true;
  });
}
 
/** Listado con latencia simulada para useQuery. */
export async function listarNotificaciones(): Promise<NotificacionApp[]> {
  await espera(200);
  return listarNotificacionesDemo();
}