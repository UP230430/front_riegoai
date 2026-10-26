import { simulador } from '@/mocks/simulador';
import { espera } from './bd';
import { eventoACsv } from '@/utils/csv';
import type { EventoTimeline, TipoEventoTimeline } from '@/types';

// Servicio del Timeline: lectura de eventos del simulador con paginación
// y filtros, imitando el backend futuro.

const TAMAÑO_PAGINA = 10;

export interface FiltrosTimeline {
  tipo?: TipoEventoTimeline | 'todo';
  plantaId?: string | 'todas';
  /** Índice de página 0..n para scroll infinito. */
  pagina?: number;
}

export async function listarEventos(filtros: FiltrosTimeline = {}): Promise<{
  eventos: EventoTimeline[];
  totalFiltrado: number;
  hayMas: boolean;
  siguientePagina: number | null;
}> {
  await espera(filtros.pagina ? 350 : 250);
  const todos = simulador.todosLosEventos().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const filtrados = todos.filter((e) => {
    const cumpleTipo = !filtros.tipo || filtros.tipo === 'todo' || e.tipo === filtros.tipo;
    const cumplePlanta =
      !filtros.plantaId || filtros.plantaId === 'todas' || e.plantaId === filtros.plantaId;
    return cumpleTipo && cumplePlanta;
  });
  const pagina = filtros.pagina ?? 0;
  const inicio = pagina * TAMAÑO_PAGINA;
  const eventos = filtrados.slice(inicio, inicio + TAMAÑO_PAGINA);
  const hayMas = filtrados.length > inicio + eventos.length;
  return {
    eventos,
    totalFiltrado: filtrados.length,
    hayMas,
    siguientePagina: hayMas ? pagina + 1 : null,
  };
}

/** Texto para exportar CSV (lo comparte la pantalla). */
export function exportarCsv(): string {
  const todos = simulador.todosLosEventos().sort((a, b) => b.fecha.localeCompare(a.fecha));
  return eventoACsv(todos);
}

export async function limpiarHistorial(): Promise<void> {
  await espera(300);
  simulador.limpiarHistorial();
}
