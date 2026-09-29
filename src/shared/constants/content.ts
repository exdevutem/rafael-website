import type { ProjectState } from '@/shared/types/content';
export const projectStates: Record<ProjectState, string> = {
  planificacion: 'Planificación',
  activo: 'Activo',
  bloqueado: 'Bloqueado',
  pausado: 'Pausado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};
export function dateLabel(value: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? 'Sin fecha'
    : new Intl.DateTimeFormat('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'America/Santiago',
      }).format(date);
}
export function safeLink(value: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//'))
    return `https://exdev.cl${value}`;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
