'use client';
import { useState } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import { getProjects } from '@/shared/services/contentService';
import { projectStates, dateLabel } from '@/shared/constants/content';
import {
  Badge,
  Empty,
  Modal,
  Notice,
  PageHeader,
  ResourceState,
  ViewToggle,
} from '@/shared/components/ui/ui';
import CreateForm from '@/shared/components/createForms/createForms';
import type { Project } from '@/shared/types/content';
import './projects.css';
export default function Projects() {
  const resource = useResource(getProjects);
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [selected, setSelected] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>(undefined);
  const [success, setSuccess] = useState('');
  const projects = (resource.data ?? []).filter(
    (p) =>
      p.nombre
        .toLocaleLowerCase('es')
        .includes(query.toLocaleLowerCase('es')) &&
      (!state || p.estado === state),
  );
  return (
    <>
      <PageHeader
        eyebrow="PROYECTOS"
        title="Proyectos del club"
        description="Ideas que toman forma, equipos que construyen."
      >
        <ViewToggle value={view} onChange={setView} />
        <button
          className="rf-button rf-primary"
          onClick={() => {
            setEditing(undefined);
            setCreating(true);
          }}
        >
          + Nuevo proyecto
        </button>
      </PageHeader>
      <Notice>
        Listado administrativo: incluye proyectos publicados e internos.
      </Notice>
      {success && (
        <div className="rf-success" role="status">
          {success}
        </div>
      )}
      <div className="rf-toolbar">
        <input
          aria-label="Buscar proyecto"
          placeholder="Buscar por nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="rf-count">
          {resource.data
            ? `${projects.length} proyectos en esta vista`
            : 'Proyectos del club'}
        </span>
      </div>
      <div className="rf-tabs" role="group" aria-label="Filtrar por estado">
        {[['', 'Todos'], ...Object.entries(projectStates)].map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() => setState(value)}
              aria-pressed={value === state}
            >
              {label}
            </button>
          ),
        )}
      </div>
      <ResourceState {...resource} retry={resource.reload} />
      {!resource.loading &&
        !resource.error &&
        (projects.length === 0 ? (
          <Empty
            title={
              query || state ? 'Sin resultados' : 'Todavía no hay proyectos'
            }
          >
            Crea un proyecto o ajusta los filtros de esta vista.
          </Empty>
        ) : view === 'cards' ? (
          <div className="rf-grid">
            {projects.map((p) => (
              <button
                key={p.id}
                className={`rf-panel rf-card-button rf-project-card rf-project-${p.estado}`}
                onClick={() => setSelected(p)}
              >
                <Badge value={p.estado} />
                <h2>{p.nombre}</h2>
                <p>{p.descripcion_breve || 'Sin descripción breve.'}</p>
                <div className="rf-card-meta">
                  <span>
                    {p.publicado ? '● Publicado' : '○ Interno'}{' '}
                    {p.destacado && '· Destacado'}
                  </span>
                  <span>{p.miembros.length} en equipo ↗</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Estado</th>
                  <th>Equipo</th>
                  <th>Exdev.cl</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button onClick={() => setSelected(p)}>{p.nombre}</button>
                      <small>{p.descripcion_breve}</small>
                    </td>
                    <td>
                      <Badge value={p.estado} />
                    </td>
                    <td>{p.miembros.length} miembros</td>
                    <td>
                      {p.publicado ? 'Publicado' : 'Interno'}
                      {p.destacado ? ' · Destacado' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      {selected && (
        <Modal title={selected.nombre} onClose={() => setSelected(null)}>
          <Badge value={selected.estado} />
          <p className="rf-prose rf-section-gap">
            {selected.descripcion ||
              selected.descripcion_breve ||
              'Sin descripción.'}
          </p>
          <dl className="rf-details">
            <div>
              <dt>Inicio</dt>
              <dd>{dateLabel(selected.fecha_inicio)}</dd>
            </div>
            <div>
              <dt>Término</dt>
              <dd>{dateLabel(selected.fecha_fin)}</dd>
            </div>
          </dl>
          <h3>Equipo</h3>
          {selected.miembros.length ? (
            selected.miembros.map((m) => (
              <p key={m.id}>
                {m.nombre}{' '}
                <span className="rf-muted">
                  {m.funcion ? `· ${m.funcion}` : ''}
                </span>
              </p>
            ))
          ) : (
            <p>No hay integrantes visibles en el equipo.</p>
          )}
          <button
            className="rf-button rf-primary"
            onClick={() => {
              setEditing(selected);
              setSelected(null);
              setCreating(true);
            }}
          >
            Editar proyecto
          </button>
        </Modal>
      )}
      {creating && (
        <CreateForm
          kind="project"
          project={editing}
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
