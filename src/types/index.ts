// Tipos de dominio de RiegoSmart IA.
// Corresponden a los definidos en el brief; toda la capa de servicios habla estos lenguajes.

export type Rol = 'admin' | 'operador';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatarUrl?: string;
}

export type EstadoSaludPlanta = 'sana' | 'estres_hidrico' | 'hoja_enferma_plaga';

export interface Diagnostico {
  /** Porcentaje de vigor biológico (0-100). */
  vigorPct: number;
  estado: EstadoSaludPlanta;
  descripcion: string;
  /** Fecha de la última inspección IA en ISO. */
  fecha: string;
  /** Humedad de suelo que acompaña al diagnóstico, para correlación. */
  humedadSueloPct: number;
}

export interface Planta {
  id: string;
  nombre: string;
  nombreCientifico: string;
  sector: string;
  /** Ej. "Sector A1 · RPi Activa" para el carrusel. */
  subtitulo: string;
  imagenUrl: string;
  diagnostico: Diagnostico;
  /** Rango óptimo de humedad de sustrato en % (min-max). */
  humedadOptima: [number, number];
  /** Rango óptimo de temperatura en °C (min-max). */
  temperaturaOptima: [number, number];
  /** Volumen sugerido por riego en mL. */
  riegoSugeridoMl: number;
  /** Intervalo habitual de riego en horas. */
  intervaloRiegoHoras: number;
}

export interface LecturaSensor {
  humedadSuelo: number; // %
  temperatura: number; // °C
  humedadAmbiente: number; // %
  luz: number; // lux
  nivelDeposito: number; // %
  caudalLmin: number; // L/min
  flotadorVacio: boolean;
  timestamp: string; // ISO
}

export type OrigenRiego = 'automatico' | 'manual' | 'ia';

export interface Riego {
  id: string;
  plantaId: string;
  inicio: string; // ISO
  duracionSeg: number;
  volumenMl: number;
  origen: OrigenRiego;
  humedadAntes?: number;
  humedadDespues?: number;
  operadorNombre?: string;
}

export interface EstadoDispositivo {
  online: boolean;
  ultimaSync: string; // ISO
  bomba: boolean;
  ventilador: boolean;
  /** Estado del panel LED GPIO 22. */
  leds: boolean;
  /** Válvula de llenado GPIO 24. */
  valvulaLlenado: boolean;
  /** Semáforo de la RPi: verde ok, rojo error, azul regando, amarillo sin agua. */
  ledIndicador: 'verde' | 'rojo' | 'azul' | 'amarillo';
  /** Modo de control: automático (reglas) o manual. */
  modoAuto: boolean;
}

export type TendenciaCrecimiento = 'creciente' | 'estable' | 'decreciente';

export interface Prediccion {
  /** Hora estimada del próximo riego en ISO. */
  proximoRiegoEstimado: string;
  volumenSugeridoMl: number;
  tendencia: TendenciaCrecimiento;
  /** Texto corto para la tarjeta, ej. "Crecimiento óptimo". */
  resumen: string;
}

export type CategoriaRegla = 'riego' | 'clima' | 'iluminacion' | 'seguridad';
export type PrioridadRegla = 'alta' | 'media' | 'baja';
export type SensorRegla = 'humedadSuelo' | 'temperatura' | 'luz' | 'nivelDeposito' | 'horario';
export type ActuadorRegla = 'bomba' | 'ventilador' | 'leds' | 'valvulaLlenado';

export interface Regla {
  id: string;
  nombre: string;
  categoria: CategoriaRegla;
  activa: boolean;
  prioridad: PrioridadRegla;
  /** Condición SI. Para 'horario' el umbral es "07:00-21:00". */
  si: {
    sensor: SensorRegla;
    operador: '<' | '>' | '<=' | '>=' | 'entre';
    umbral: string;
    /** Duración de la condición en minutos, si aplica. */
    duranteMin?: number;
  };
  entonces: {
    actuador: ActuadorRegla;
    accion: 'encender' | 'apagar' | 'regar_volumen' | 'bloquear';
    volumenMl?: number;
    /** Hasta/hasta llegar a, ej. regar hasta 60 % de humedad. */
    hastaValor?: number;
  };
  /** Último disparo en ISO, opcional. */
  ultimaEjecucion?: string;
  /** Las de seguridad (bloqueo de bomba) no se pueden desactivar. */
  bloqueadaPorSeguridad?: boolean;
}

export type TipoEventoTimeline = 'riego' | 'alerta' | 'clima' | 'ia';

export interface EventoTimeline {
  id: string;
  tipo: TipoEventoTimeline;
  titulo: string;
  descripcion: string;
  fecha: string; // ISO
  plantaId?: string;
  plantaNombre?: string;
  /** Datos extra para pintar la tarjeta: imagen, métricas antes/después, etc. */
  imagenUrl?: string;
  humedadAntes?: number;
  humedadDespues?: number;
  volumenMl?: number;
  nivelDepositoPct?: number;
  picoTemperaturaC?: number;
  certezaVigorPct?: number;
  origen?: OrigenRiego | 'sistema';
}

export type EstadoSaludEscaneo = 'vigorosa_sana' | 'observar' | 'plaga_detectada';

export interface EscaneoPlanta {
  id: string;
  fecha: string; // ISO
  especie: string;
  nombreCientifico: string;
  confianzaPct: number;
  salud: EstadoSaludEscaneo;
  descripcionSalud: string;
  imagenUrl: string;
  sectorAsignado?: string;
  condicionesOptimas: {
    humedadSustrato: string;
    temperatura: string;
    fotoperiodo: string;
    riegoSugerido: string;
  };
  perfilAgronomico: string;
  ubicacionCompra?: string;
}

export interface Vivero {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  distanciaKm: number;
  especialidades: string[];
 /** Precio medio de una planta tipo. */
  precioMedio: number;
  abierto: boolean;
  horario: string;
}

export interface Umbrales {
  humedadMinimaPct: number;
  humedadObjetivoPct: number;
  temperaturaVentiladorC: number;
  temperaturaApagadoVentiladorC: number;
  depositoCriticoPct: number;
  maxBombaSeg: number;
  esperaMinRiegosMin: number;
}

export type TipoNotificacion =
  | 'deposito_vacio'
  | 'estres_hidrico'
  | 'enfermedad_detectada'
  | 'riego_realizado'
  | 'dispositivo_desconectado';

export interface NotificacionApp {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  fecha: string; // ISO
  leida: boolean;
}
