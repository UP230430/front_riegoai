// Puerta única de la capa de servicios. La UI SOLO importa de aquí.
// `bd.ts` es infraestructura del mock y NO se re-exporta intencionalmente:
// ningún componente debe conocer AsyncStorage ni la persistencia simulada.
export * as telemetriaService from './telemetriaService';
export * as authService from './authService';
export * as escaneosService from './escaneosService';
export * as notificacionesService from './notificacionesService';
export * as plantasService from './plantasService';
export * as reglasService from './reglasService';
export * as timelineService from './timelineService';
export * as usuariosService from './usuariosService';
export * as viverosService from './viverosService';
export { MAX_REGADO_ML } from './telemetriaService';
