'use client';
import { useState } from 'react';
import { getMembers } from '@/shared/services/contentService';
import { useResource } from '@/shared/hooks/useResource';
import {
  Empty,
  Modal,
  Notice,
  PageHeader,
  ResourceState,
  ViewToggle,
} from '@/shared/components/ui/ui';
import CreateForm from '@/shared/components/createForms/createForms';
import type { Member } from '@/shared/types/content';
import './members.css';
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
export default function Members() {
  const resource = useResource(getMembers);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [selected, setSelected] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Member | undefined>(undefined);
  const [status, setStatus] = useState('activo');
  const [success, setSuccess] = useState('');
  const all = resource.data ?? [];
  const members = all.filter(
    (m) =>
      m.nombre
        .toLocaleLowerCase('es')
        .includes(query.toLocaleLowerCase('es')) &&
      (!role || m.roles.includes(role)) &&
      (!specialty || m.especialidades.includes(specialty)) &&
      (!status || m.estado === status),
  );
  return (
    <>
      <PageHeader
        eyebrow="MIEMBROS"
        title="Quiénes somos"
        description="Las personas detrás del Club de Desarrollo Experimental."
      >
        <ViewToggle value={view} onChange={setView} />
        <button
          className="rf-button rf-primary"
          onClick={() => {
            setEditing(undefined);
            setCreating(true);
          }}
        >
          + Nuevo miembro
        </button>
      </PageHeader>
      <Notice>
        Directorio administrativo. Activo significa que la persona sigue
        perteneciendo al club, sin importar la visibilidad pública de su perfil.
      </Notice>
      {success && (
        <div className="rf-success" role="status">
          {success}
        </div>
      )}
      <div className="rf-toolbar">
        <select
          aria-label="Filtrar por pertenencia"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="activo">Miembros activos</option>
          <option value="inactivo">Miembros inactivos</option>
          <option value="">Todos los miembros</option>
        </select>
        <input
          aria-label="Buscar miembro"
          placeholder="Buscar por nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filtrar por rol"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Todos los roles</option>
          {[...new Set(all.flatMap((m) => m.roles))].sort().map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por especialidad"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="">Todas las especialidades</option>
          {[...new Set(all.flatMap((m) => m.especialidades))]
            .sort()
            .map((s) => (
              <option key={s}>{s}</option>
            ))}
        </select>
      </div>
      <ResourceState {...resource} retry={resource.reload} />
      {!resource.loading &&
        !resource.error &&
        (members.length === 0 ? (
          <Empty
            title={
              query || role || specialty
                ? 'Sin resultados'
                : 'No hay miembros para mostrar'
            }
          >
            Crea un miembro o ajusta los filtros de esta vista.
          </Empty>
        ) : view === 'cards' ? (
          <div className="rf-members-grid">
            {members.map((m) => (
              <button
                key={m.id}
                className="rf-panel rf-card-button rf-member-card"
                onClick={() => setSelected(m)}
              >
                <span className="rf-avatar">{initials(m.nombre)}</span>
                <h2>{m.nombre}</h2>
                <strong>{m.roles.join(' · ') || 'Sin roles asignados'}</strong>
                <p>{m.especialidades.join(' · ') || m.carrera}</p>
                <span className="rf-card-meta">
                  {m.perfil_publico ? '● Perfil público' : '○ Perfil interno'} ·{' '}
                  {m.estado}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Roles</th>
                  <th>Especialidades</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <button onClick={() => setSelected(m)}>{m.nombre}</button>
                      <small>{m.carrera}</small>
                      <small>{m.correo_institucional}</small>
                    </td>
                    <td>{m.roles.join(', ') || 'Sin asignar'}</td>
                    <td>{m.especialidades.join(', ') || 'Sin asignar'}</td>
                    <td>
                      {m.perfil_publico ? 'Público' : 'Interno'} · {m.estado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      {selected && (
        <Modal title={selected.nombre} onClose={() => setSelected(null)}>
          <dl className="rf-details">
            <div>
              <dt>Carrera</dt>
              <dd>{selected.carrera}</dd>
            </div>
            <div>
              <dt>Ingreso a la carrera</dt>
              <dd>{selected.anio_ingreso_carrera ?? 'Sin información'}</dd>
            </div>
            <div>
              <dt>Roles del club</dt>
              <dd>{selected.roles.join(', ') || 'Sin asignar'}</dd>
            </div>
            <div>
              <dt>Especialidades</dt>
              <dd>{selected.especialidades.join(', ') || 'Sin asignar'}</dd>
            </div>
          </dl>
          <p>{selected.correo_institucional || 'Sin correo institucional'}</p>
          <button
            className="rf-button rf-primary"
            onClick={() => {
              setEditing(selected);
              setSelected(null);
              setCreating(true);
            }}
          >
            Editar miembro
          </button>
        </Modal>
      )}
      {creating && (
        <CreateForm
          kind="member"
          member={editing}
          onClose={() => setCreating(false)}
          onCreated={(message) => {
            setCreating(false);
            setSuccess(message);
            resource.reload();
          }}
        />
      )}
    </>
  );
}
