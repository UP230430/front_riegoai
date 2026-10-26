/** Utilidades de formato en español, compartidas por todas las pantallas. */

export function horaCorta(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export function horaConSegundos(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "Hace 15 min", "Hoy, 14:15 h", "Ayer, 18:30 h". */
export function relativo(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const diffMin = Math.round((hoy.getTime() - fecha.getTime()) / 60000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const mismoDia = fecha.toDateString() === hoy.toDateString();
  if (mismoDia) return `Hoy, ${horaCorta(iso)} h`;
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer, ${horaCorta(iso)} h`;
  const dia = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  return `${dia}, ${horaCorta(iso)} h`;
}

export function proximoRelativo(iso: string): string {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return 'Ahora';
  if (diffMin < 60) return `En ${diffMin} min`;
  const horas = Math.round((diffMin / 60) * 10) / 10;
  if (horas < 24) return `En ${String(horas).replace('.0', '')} h`;
  const dias = Math.round(horas / 24);
  return `En ${dias} día${dias === 1 ? '' : 's'}`;
}

export function numeroConSeparador(n: number): string {
  return n.toLocaleString('es-MX');
}

export function etiquetaEstadoSalud(estado: string): { texto: string; color: 'primary' | 'tertiary' | 'error' } {
  switch (estado) {
    case 'sana':
    case 'vigorosa_sana':
      return { texto: 'Vigorosa y Sana', color: 'primary' };
    case 'estres_hidrico':
    case 'observar':
      return { texto: 'Estrés hídrico · Observar', color: 'tertiary' };
    default:
      return { texto: 'Hoja enferma / plaga', color: 'error' };
  }
}

export function etiquetaTipoEvento(tipo: string): string {
  switch (tipo) {
    case 'riego':
      return 'Riego';
    case 'alerta':
      return 'Alerta';
    case 'clima':
      return 'Clima';
    case 'ia':
      return 'Azure IA';
    default:
      return 'Evento';
  }
}
