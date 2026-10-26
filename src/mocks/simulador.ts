import type {
  EstadoDispositivo,
  EventoTimeline,
  LecturaSensor,
  Riego,
  TipoEventoTimeline,
} from '@/types';
import { EVENTOS_SEMILLA, PLANTAS_SEMILLA, UMBRALES_SEMILLA } from './datos';

// Simulador en vivo: cada pocos segundos varía lecturas y de vez en cuando
// dispara riegos automáticos y alertas. Es un singleton con suscripción.

const TICK_MS = 2_000;
const VOLUMEN_DEPOSITO_L = 5.0; // L

type Estado = {
  lecturas: LecturaSensor;
  dispositivo: EstadoDispositivo;
  /** Humedad por planta (%). */
  humedades: Record<string, number>;
  /** Caída gradual por "Regar ahora". */
  regandoHasta: number;
  riegos: Riego[];
  eventos: EventoTimeline[];
  depositoRestanteL: number;
};

const azar = (min: number, max: number) => min + Math.random() * (max - min);

function lecturasIniciales(): LecturaSensor {
  return {
    humedadSuelo: 52,
    temperatura: 27.2,
    humedadAmbiente: 61,
    luz: 12200,
    nivelDeposito: 76,
    caudalLmin: 0,
    flotadorVacio: false,
    timestamp: new Date().toISOString(),
  };
}

function dispositivoInicial(): EstadoDispositivo {
  return {
    online: true,
    ultimaSync: new Date().toISOString(),
    bomba: false,
    ventilador: false,
    leds: true,
    valvulaLlenado: false,
    ledIndicador: 'verde',
    modoAuto: true,
  };
}

function humedadesIniciales(): Record<string, number> {
  return {
    'albahaca-1': 52,
    'tomate-1': 41,
    'menta-1': 34,
  };
}

const estado: Estado = {
  lecturas: lecturasIniciales(),
  dispositivo: dispositivoInicial(),
  humedades: humedadesIniciales(),
  regandoHasta: 0,
  riegos: [],
  eventos: [...EVENTOS_SEMILLA],
  depositoRestanteL: 3.8,
};

let temporizador: ReturnType<typeof setInterval> | null = null;
const suscriptores = new Set<() => void>();
let id = 0;
const nuevoId = (prefijo: string) => `${prefijo}-${Date.now()}-${id++}`;

function notificar() {
  suscriptores.forEach((fn) => fn());
}

function evento(tipo: TipoEventoTimeline, datos: Omit<EventoTimeline, 'id' | 'tipo' | 'fecha'>): void {
  estado.eventos.unshift({
    id: nuevoId('e'),
    tipo,
    fecha: new Date().toISOString(),
    ...datos,
  });
  // Cap de memoria: 200 eventos.
  if (estado.eventos.length > 200) estado.eventos.length = 200;
}

function ledSegunEstado(): EstadoDispositivo['ledIndicador'] {
  if (estado.lecturas.flotadorVacio) return 'amarillo';
  if (estado.dispositivo.bomba) return 'azul';
  if (!estado.dispositivo.online) return 'rojo';
  return 'verde';
}

/** Tick de simulación: deriva natural de sensores + reglas automáticas. */
function tick(): void {
  const { dispositivo } = estado;

  if (!dispositivo.online) {
    dispositivo.ultimaSync = new Date().toISOString();
    return; // Sin riego ni alertas cuando el dispositivo está offline.
  }

  const lecturas = estado.lecturas;

  // Mejor de dos mundos: la albahaca es la zona de referencia de la pantalla Inicio.
  const humedadRef = estado.humedades['albahaca-1'] ?? lecturas.humedadSuelo;

  // Regando: subida creíble y gradual de humedad.
  if (dispositivo.bomba) {
    const objetivo = estado.regandoHasta;
    const nueva = Math.min(objetivo, humedadRef + azar(2.5, 4.5));
    estado.humedades['albahaca-1'] = parseFloat(nueva.toFixed(1));
    lecturas.humedadSuelo = estado.humedades['albahaca-1'];
    lecturas.caudalLmin = parseFloat(azar(0.9, 1.3).toFixed(2));
    estado.depositoRestanteL = Math.max(0, estado.depositoRestanteL - 0.006);
    lecturas.nivelDeposito = Math.round((estado.depositoRestanteL / VOLUMEN_DEPOSITO_L) * 100);
    if (nueva >= objetivo) {
      dispositivo.bomba = false;
      lecturas.caudalLmin = 0;
    }
  } else {
    // Deriva hacia abajo lenta + ruido.
    const deriva = -0.12 - (dispositivo.ventilador ? 0.05 : 0); // el calor seca más
    const ruido = azar(-0.1, 0.1);
    const nueva = Math.max(20, Math.min(80, humedadRef + deriva + ruido));
    estado.humedades['albahaca-1'] = parseFloat(nueva.toFixed(1));
    lecturas.humedadSuelo = estado.humedades['albahaca-1'];
  }

  // Temperatura: fluctúa alrededor de 26-28, ligeramente mayor si el ventilador está apagado.
  const base = dispositivo.ventilador ? 26.4 : 27.4;
  lecturas.temperatura = parseFloat(azar(base - 0.7, base + 0.7).toFixed(1));
  lecturas.humedadAmbiente = Math.round(azar(55, 66));

  // Luz: simulando día; no cambia bruscamente.
  lecturas.luz = Math.round(Math.max(400, lecturas.luz + azar(-350, 380)));

  // Otras plantas derivan también (para la vista de detalle y roles).
  estado.humedades['tomate-1'] = parseFloat(
    Math.max(25, Math.min(75, estado.humedades['tomate-1'] - 0.1 + azar(-0.1, 0.15))).toFixed(1),
  );
  estado.humedades['menta-1'] = parseFloat(
    Math.max(20, Math.min(75, estado.humedades['menta-1'] - 0.12 + azar(-0.1, 0.15))).toFixed(1),
  );

  // Sincronía general
  lecturas.timestamp = new Date().toISOString();
  dispositivo.ultimaSync = lecturas.timestamp;
  dispositivo.ledIndicador = ledSegunEstado();

  // Reglas automáticas (modo auto). Mismo conjunto del brief:
  if (dispositivo.modoAuto) {
    ejecutarReglasPero();
  }

  notificar();
}

let ultimoRiegoAuto = Date.now();
let riegoParcial: { enCurso: boolean; objetivo: number; plantaId: string } | null = null;

function ejecutarReglasPero(): void {
  const { dispositivo, lecturas } = estado;
  const umbrales = { ...UMBRALES_SEMILLA };
  const ahora = Date.now();

  // Bloqueo de seguridad: depósito bajo o flotador.
  const bloqueo =
    lecturas.nivelDeposito < umbrales.depositoCriticoPct || lecturas.flotadorVacio;

  // Riego por sequedad en la referencia (albahaca).
  const humedadRef = estado.humedades['albahaca-1'];
  if (
    !bloqueo &&
    dispositivo.modoAuto &&
    humedadRef < umbrales.humedadMinimaPct &&
    !dispositivo.bomba &&
    Math.abs(ahora - ultimoRiegoAuto) > umbrales.esperaMinRiegosMin * 60 * 1000
  ) {
    ultimoRiegoAuto = ahora;
    const antes = humedadRef;
    const objetivo = umbrales.humedadObjetivoPct;
    dispositivo.bomba = true;
    estado.regandoHasta = objetivo;
    riegoParcial = { enCurso: true, objetivo, plantaId: 'albahaca-1' };
    evento('riego', {
      titulo: 'Riego por Umbral Autónomo',
      descripcion: `Regla \"Riego automático por sequedad\" activó la bomba GPIO 17 (${umbrales.humedadMinimaPct}% < umbral).`,
      plantaId: 'albahaca-1',
      plantaNombre: 'Albahaca #1',
      humedadAntes: parseFloat(antes.toFixed(1)),
      humedadDespues: objetivo,
      volumenMl: 180,
      origen: 'automatico',
    });
  }

  // Temperatura -> ventilador.
  if (lecturas.temperatura >= umbrales.temperaturaVentiladorC && !dispositivo.ventilador) {
    dispositivo.ventilador = true;
    evento('clima', {
      titulo: 'Ventilación forzada activada',
      descripcion: `Temperatura de cúpula superó los ${lecturas.temperatura} °C. Extractor RPi GPIO 27 encendido (regla automatica).`,
      plantaNombre: 'Invernadero General',
      picoTemperaturaC: lecturas.temperatura,
      origen: 'sistema',
    });
  } else if (lecturas.temperatura <= umbrales.temperaturaApagadoVentiladorC && dispositivo.ventilador) {
    dispositivo.ventilador = false;
    evento('clima', {
      titulo: 'Ventilación apagada por regla',
      descripcion: `La temperatura bajó a ${lecturas.temperatura} °C (<= ${umbrales.temperaturaApagadoVentiladorC} °C) y el extractor se apagó.`,
      plantaNombre: 'Invernadero General',
      origen: 'sistema',
    });
  }

  // Cierre del riego al llegar al volumen objetivo registra el Riego.
  if (riegoParcial?.enCurso && !dispositivo.bomba) {
    riegoParcial.enCurso = false;
    const tras = estado.humedades['albahaca-1'];
    const riego: Riego = {
      id: nuevoId('r'),
      plantaId: riegoParcial.plantaId,
      inicio: new Date(ahora).toISOString(),
      duracionSeg: Math.round(azar(5, 12)),
      volumenMl: 180,
      origen: 'automatico',
      humedadAntes: parseFloat((tras - 8).toFixed(1)),
      humedadDespues: tras,
    };
    estado.riegos.unshift(riego);
  }

  // Alertas ocasionales para que la demo se vea viva.
  if (Math.random() < 0.01) {
    if (estado.depositoRestanteL / VOLUMEN_DEPOSITO_L < 0.3) {
      evento('alerta', {
        titulo: 'Nivel de Reserva Crítico',
        descripcion: 'El depósito principal está por debajo del 30%. Rellenar pronto.',
        plantaNombre: 'Depósito Central',
        nivelDepositoPct: lecturas.nivelDeposito,
      });
    } else {
      evento('alerta', {
        titulo: 'Alerta Fitosanitaria · Azure AI',
        descripcion: `Ligera clorosis detectada en hojas basales con ${Math.round(azar(80, 93))}% de certeza mediante visión computacional.`,
        plantaId: 'tomate-1',
        plantaNombre: 'Tomate Cherry',
        imagenUrl: PLANTAS_SEMILLA[1].imagenUrl,
        certezaVigorPct: Math.round(azar(80, 93)),
      });
    }
  }
}

export const simulador = {
  iniciado: false,

  iniciar(): void {
    if (temporizador) return;
    this.iniciado = true;
    temporizador = setInterval(tick, TICK_MS);
  },

  detener(): void {
    if (temporizador) {
      clearInterval(temporizador);
      temporizador = null;
      this.iniciado = false;
    }
  },

  suscribir(fn: () => void): () => void {
    suscriptores.add(fn);
    return () => suscriptores.delete(fn);
  },

  todosLosEventos(): EventoTimeline[] {
    return [...estado.eventos];
  },

  losRiegos(): Riego[] {
    return [...estado.riegos];
  },

  limpiarHistorial(): void {
    estado.eventos.length = 0;
    estado.riegos.length = 0;
    notificar();
  },

  anadirRiego(riego: Riego, eventoRiego: EventoTimeline): void {
    estado.riegos.unshift(riego);
    estado.eventos.unshift(eventoRiego);
  },

  humedades(): Record<string, number> {
    return { ...estado.humedades };
  },

  /** Regar manualmente: enciende la bomba hasta el volumen/objetivo indicado. */
  regarHasta(plantaId: string, objetivoPct: number): void {
    estado.dispositivo.bomba = true;
    estado.regandoHasta = objetivoPct;
    estado.dispositivo.ledIndicador = ledSegunEstado();
    riegoParcial = { enCurso: true, objetivo: objetivoPct, plantaId };
    notificar();
  },

  marcarFinRiego(riego: Riego, eventoFinal: EventoTimeline): void {
    if (riegoParcial) riegoParcial.enCurso = false;
    estado.riegos.unshift(riego);
    estado.eventos.unshift(eventoFinal);
  },

  dispositivoEnLinea(online: boolean): void {
    estado.dispositivo.online = online;
    estado.dispositivo.ultimaSync = new Date().toISOString();
    estado.dispositivo.ledIndicador = ledSegunEstado();
    if (!online) {
      // No hay reglas si está offline.
      estado.dispositivo.bomba = false;
      estado.dispositivo.ventilador = false;
      estado.lecturas.caudalLmin = 0;
    }
    notificar();
  },

  establecerModoAuto(modo: boolean): void {
    estado.dispositivo.modoAuto = modo;
    notificar();
  },

  establecerVentilador(activa: boolean): void {
    if (!estado.dispositivo.online) return;
    estado.dispositivo.ventilador = activa;
    notificar();
  },

  establecerLeds(activa: boolean): void {
    if (!estado.dispositivo.online) return;
    estado.dispositivo.leds = activa;
    notificar();
  },

  establecerValvula(activa: boolean): void {
    if (!estado.dispositivo.online) return;
    estado.dispositivo.valvulaLlenado = activa;
    notificar();
  },

  /** Parada de emergencia: todos los actuadores a bajo. */
  paradaEmergencia(): void {
    estado.dispositivo.bomba = false;
    estado.dispositivo.ventilador = false;
    estado.dispositivo.leds = false;
    estado.dispositivo.valvulaLlenado = false;
    estado.dispositivo.modoAuto = false;
    estado.lecturas.caudalLmin = 0;
    riegoParcial = null;
    evento('alerta', {
      titulo: 'Parada de Emergencia General',
      descripcion: 'Todos los pines GPIO en estado bajo (LOW). Control manual activado.',
      plantaNombre: 'Invernadero General',
      origen: 'sistema',
    });
    notificar();
  },

  lecturas(): LecturaSensor {
    return { ...estado.lecturas };
  },

  dispositivo(): EstadoDispositivo {
    return {
      ...estado.dispositivo,
      ledIndicador: ledSegunEstado(),
    };
  },

  /** El nivel del depósito baja ligeramente por consumo normal de la demo. */
  nivelRealPct(): number {
    return (estado.depositoRestanteL / VOLUMEN_DEPOSITO_L) * 100;
  },
};
