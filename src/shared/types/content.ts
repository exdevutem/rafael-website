export type Id = string | number;
export type ProjectState =
  | 'planificacion'
  | 'activo'
  | 'bloqueado'
  | 'pausado'
  | 'completado'
  | 'cancelado';
export interface Member {
  correo_institucional: string | null;
  estado: 'activo' | 'inactivo';
  perfil_publico: boolean;
  role_ids: Id[];
  specialty_ids: Id[];
  id: Id;
  nombre: string;
  carrera: string;
  anio_ingreso_carrera: number | null;
  foto_publica: boolean;
  roles: string[];
  especialidades: string[];
}
export interface Project {
  publicado: boolean;
  orden: number;
  id: Id;
  nombre: string;
  descripcion_breve: string | null;
  descripcion: string | null;
  estado: ProjectState;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  destacado: boolean;
  miembros: {
    id: Id;
    nombre: string;
    funcion: string | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
  }[];
}
export interface ClubEvent {
  publicado: boolean;
  id: Id;
  tipo_evento: string;
  titulo_evento: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_texto: string | null;
  ubicacion: string | null;
  url_evento: string | null;
  tipo_accion: 'inscripcion' | 'postulacion' | 'acceso_libre' | null;
  url_accion: string | null;
  estado: 'programado' | 'cancelado' | 'finalizado';
}
export interface Application {
  id: Id;
  periodo_id: Id;
  nombre_completo: string;
  correo_institucional: string;
  carrera: string;
  campus: string | null;
  edad: number | null;
  anio_ingreso: number | null;
  area_interes1: string;
  area_interes2: string | null;
  area_interes3: string | null;
  motivo_postulacion: string | null;
  proyecto_idea: string | null;
  pitch: string | null;
  estado_postulacion: 'pendiente' | 'aceptada' | 'rechazada' | 'retirada';
  created_at: string;
}
export interface CreateMember {
  nombre: string;
  correoInstitucional: string | null;
  carrera: string;
  anioIngresoCarrera: number | null;
  estado: 'activo' | 'inactivo';
  roleIds: Id[];
  specialtyIds: Id[];
  perfilPublico: boolean;
  fotoPublica: boolean;
}
export interface CreateProject {
  members: {
    memberId: Id;
    functionName: string | null;
    startDate: string | null;
    endDate: string | null;
  }[];
  nombre: string;
  descripcionBreve: string | null;
  descripcion: string | null;
  estado: ProjectState;
  fechaInicio: string | null;
  fechaFin: string | null;
  publicado: boolean;
  destacado: boolean;
  orden: number;
}
export interface CatalogItem {
  id: Id;
  nombre: string;
  descripcion: string | null;
  estado: 'activo' | 'inactivo';
}
export interface Sponsor {
  id: Id;
  nombre_patrocinador: string;
  descripcion_patrocinador: string | null;
  estado_patrocinador: 'activo' | 'inactivo';
  publicado: boolean;
  orden: number;
}
export interface Period {
  id: Id;
  nombre_periodo: string;
  descripcion: string | null;
  fecha_apertura: string;
  fecha_cierre: string;
  fecha_cierre_votacion: string;
  estado_periodo: 'creado' | 'habilitado' | 'cerrado' | 'cancelado';
}
export interface ApplicationPage {
  postulaciones: Application[];
  totalPostulaciones: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
