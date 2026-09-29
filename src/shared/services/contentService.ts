import { collection, request } from './api';
import type {
  Member,
  Project,
  ClubEvent,
  ApplicationPage,
  CreateMember,
  CreateProject,
  Id,
  CatalogItem,
  Sponsor,
  Period,
} from '@/shared/types/content';
export const getMembers = (signal?: AbortSignal) =>
  collection<Member>('/members/admin', signal);
export const getProjects = (signal?: AbortSignal) =>
  collection<Project>('/projects/admin', signal);
export const getEvents = (signal?: AbortSignal) =>
  collection<ClubEvent>('/events/admin', signal);
export const getSponsors = (signal?: AbortSignal) =>
  collection<Sponsor>('/sponsors/admin', signal);
export const getRoles = (signal?: AbortSignal) =>
  collection<CatalogItem>('/roles', signal);
export const getSpecialties = (signal?: AbortSignal) =>
  collection<CatalogItem>('/specialties', signal);
export const getPeriods = (signal?: AbortSignal) =>
  collection<Period>('/periods', signal);
export async function getApplications(
  signal?: AbortSignal,
  limit = 10,
  offset = 0,
  state = '',
  period = '',
  search = '',
): Promise<ApplicationPage> {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (state) query.set('estado', state);
  if (period) query.set('periodo_id', period);
  if (search.trim()) query.set('search', search.trim());
  const result = await request<ApplicationPage>('/applications?' + query, {
    signal,
  });
  if (
    !Array.isArray(result.postulaciones) ||
    !Number.isInteger(result.totalPostulaciones) ||
    typeof result.hasMore !== 'boolean'
  )
    throw new Error('La respuesta de postulaciones es inválida.');
  const clean = result.postulaciones.map((p) => ({
    id: p.id,
    periodo_id: p.periodo_id,
    nombre_completo: p.nombre_completo,
    correo_institucional: p.correo_institucional,
    carrera: p.carrera,
    campus: p.campus,
    edad: p.edad,
    anio_ingreso: p.anio_ingreso,
    area_interes1: p.area_interes1,
    area_interes2: p.area_interes2,
    area_interes3: p.area_interes3,
    motivo_postulacion: p.motivo_postulacion,
    proyecto_idea: p.proyecto_idea,
    pitch: p.pitch,
    estado_postulacion: p.estado_postulacion,
    created_at: p.created_at,
  }));
  return { ...result, postulaciones: clean };
}
function save<T>(path: string, body: T, id?: Id) {
  return request<{ id: Id }>(
    id === undefined ? path : path + '/' + encodeURIComponent(String(id)),
    { method: id === undefined ? 'POST' : 'PATCH', body: JSON.stringify(body) },
  );
}
export const saveMember = (body: CreateMember, id?: Id) =>
  save('/members', body, id);
export const saveProject = (body: CreateProject, id?: Id) =>
  save('/projects', body, id);
export const saveEvent = (body: Omit<ClubEvent, 'id'>, id?: Id) =>
  save('/events', body, id);
export const saveSponsor = (body: Omit<Sponsor, 'id'>, id?: Id) =>
  save('/sponsors', body, id);
export const saveCatalog = (
  kind: 'roles' | 'specialties',
  body: Omit<CatalogItem, 'id'>,
  id?: Id,
) => save('/' + kind, body, id);
export const savePeriod = (body: Omit<Period, 'id'>, id?: Id) =>
  save('/periods', body, id);
