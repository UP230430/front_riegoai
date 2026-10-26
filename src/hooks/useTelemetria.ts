import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as telemetriaService from '@/services/telemetriaService';
import * as plantasService from '@/services/plantasService';

/** Refresca TODAS las queries cada vez que el simulador muta lecturas. */
export function useSimuladorInvalidador(): void {
  const qc = useQueryClient();
  useEffect(() => telemetriaService.subscribirCambios(() => {
    qc.invalidateQueries({ queryKey: ['lecturas'] });
    qc.invalidateQueries({ queryKey: ['dispositivo'] });
    qc.invalidateQueries({ queryKey: ['prediccion'] });
    qc.invalidateQueries({ queryKey: ['plantas'] });
    qc.invalidateQueries({ queryKey: ['planta'] });
  }), [qc]);
}

export function useLecturas() {
  return useQuery({
    queryKey: ['lecturas'],
    queryFn: telemetriaService.lecturaActual,
    refetchInterval: 2_000,
  });
}

export function useDispositivo() {
  return useQuery({
    queryKey: ['dispositivo'],
    queryFn: telemetriaService.estadoDispositivo,
    refetchInterval: 3_000,
  });
}

export function usePlantas() {
  return useQuery({
    queryKey: ['plantas'],
    queryFn: plantasService.listarPlantas,
  });
}

export function usePlanta(id: string) {
  return useQuery({
    queryKey: ['planta', id],
    queryFn: () => plantasService.obtenerPlanta(id),
  });
}

export function useHistorialPlanta(id: string) {
  return useQuery({
    queryKey: ['historial', id],
    queryFn: () => telemetriaService.historialPorPlanta(id),
  });
}

export function usePrediccion(plantaId: string) {
  return useQuery({
    queryKey: ['prediccion', plantaId],
    queryFn: () => telemetriaService.prediccion(plantaId),
  });
}

export function useRegarAhora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { plantaId: string; volumenMl: number; operador: string }) =>
      telemetriaService.regarAhora(vars.plantaId, vars.volumenMl, vars.operador),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] });
      qc.invalidateQueries({ queryKey: ['lecturas'] });
      qc.invalidateQueries({ queryKey: ['dispositivo'] });
    },
  });
}

export function useActuador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tipo: 'bomba' | 'ventilador' | 'leds' | 'valvula' | 'modoAuto' | 'emergencia' | 'online'; valor?: boolean }) => {
      switch (vars.tipo) {
        case 'ventilador':
          return telemetriaService.alternarVentilador(Boolean(vars.valor));
        case 'leds':
          return telemetriaService.alternarLeds(Boolean(vars.valor));
        case 'valvula':
          return telemetriaService.alternarValvula(Boolean(vars.valor));
        case 'modoAuto':
          return telemetriaService.establecerModoAuto(Boolean(vars.valor));
        case 'emergencia':
          return telemetriaService.paradaEmergencia();
        case 'online':
          return telemetriaService.establecerDispositivoEnLinea(Boolean(vars.valor));
        default:
          return telemetriaService.estadoDispositivo();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispositivo'] });
      qc.invalidateQueries({ queryKey: ['eventos'] });
    },
  });
}
