const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
export function chileLocal(instant: string): string {
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(instant)).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function chileInstant(local: string, original?: string): string {
  if (original && local === chileLocal(original)) return original;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
    throw new Error('Completa las fechas y horas del período.');
  const wall = Date.parse(local + 'Z');
  if (
    !Number.isFinite(wall) ||
    new Date(wall).toISOString().slice(0, 16) !== local
  )
    throw new Error('La fecha ingresada no es válida.');
  const offsets = new Set<number>();
  for (const shift of [-86400000, 0, 86400000]) {
    const probe = wall + shift;
    offsets.add(
      Date.parse(chileLocal(new Date(probe).toISOString()) + 'Z') - probe,
    );
  }
  const matches = [...offsets]
    .map((offset) => new Date(wall - offset).toISOString())
    .filter((candidate) => chileLocal(candidate) === local);
  if (matches.length === 0)
    throw new Error(
      'Esa hora no existe en America/Santiago por el cambio de horario. Elige otra hora.',
    );
  if (matches.length > 1)
    throw new Error(
      'Esa hora se repite por el cambio de horario en Chile. Elige una hora fuera de ese intervalo.',
    );
  return matches[0];
}
