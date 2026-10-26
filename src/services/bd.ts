import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ESCANEOS_SEMILLA,
  PLANTAS_SEMILLA,
  REGLAS_SEMILLA,
  UMBRALES_SEMILLA,
  USUARIOS_SEMILLA,
  VIVEROS_SEMILLA,
} from '@/mocks/datos';
import type { EscaneoPlanta, Planta, Regla, Umbrales, Usuario, Vivero } from '@/types';

// Base de datos mock: estado en memoria semillado desde mocks/datos.ts y
// espejado en AsyncStorage para simular caché offline.

const CLAVE = 'riegosmart.bd.v1';

interface EstadoBd {
  plantas: Planta[];
  reglas: Regla[];
  umbrales: Umbrales;
  usuarios: Usuario[];
  escaneos: EscaneoPlanta[];
  viveros: Vivero[];
}

let estado: EstadoBd | null = null;
let cargando: Promise<EstadoBd> | null = null;

function estadoSemilla(): EstadoBd {
  return {
    plantas: JSON.parse(JSON.stringify(PLANTAS_SEMILLA)) as Planta[],
    reglas: JSON.parse(JSON.stringify(REGLAS_SEMILLA)) as Regla[],
    umbrales: { ...UMBRALES_SEMILLA },
    usuarios: [...USUARIOS_SEMILLA],
    escaneos: JSON.parse(JSON.stringify(ESCANEOS_SEMILLA)) as EscaneoPlanta[],
    viveros: [...VIVEROS_SEMILLA],
  };
}

async function cargar(): Promise<EstadoBd> {
  if (estado) return estado;
  if (cargando) return cargando;
  cargando = (async () => {
    return new Promise<EstadoBd>((resolver) => {
      const base = estadoSemilla();
      estado = base;
      AsyncStorage.getItem(CLAVE)
        .then((bruto) => {
          if (bruto) {
            try {
              const guardado = JSON.parse(bruto) as Partial<EstadoBd>;
              estado = { ...base, ...guardado } as EstadoBd;
            } catch {
              // Datos corruptos -> semilla.
            }
          }
        })
        .catch(() => {
          // AsyncStorage no disponible (web sin soporte) -> solo memoria.
        })
        .finally(() => resolver(estado as EstadoBd));
    });
  })();
  return cargando;
}

function persistir(): void {
  if (!estado) return;
  const copia = JSON.stringify(estado);
  AsyncStorage.setItem(CLAVE, copia).catch(() => {
    // Sin bloquear la demo si el guardado falla.
  });
}

/** Latencia simulada para que la UI muestre estados de carga reales. */
export function espera(ms: number = 350): Promise<void> {
  return new Promise((res) => setTimeout(res, ms + Math.random() * 150));
}

/** Asegura que la BD esté cargada antes de leer. */
export async function leer(): Promise<EstadoBd> {
  await cargar();
  return estado as EstadoBd;
}

export async function escribir(mutacion: (bd: EstadoBd) => void): Promise<void> {
  const bd = await leer();
  mutacion(bd);
  persistir();
}