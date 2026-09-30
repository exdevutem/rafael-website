'use client';
import { request } from '@/shared/services/api';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { getProjects, getEvents } from '@/shared/services/contentService';
import { useResource } from '@/shared/hooks/useResource';
import { projectStates, dateLabel } from '@/shared/constants/content';
import { Empty, PageHeader, ResourceState } from '@/shared/components/ui/ui';
import './home.css';
const getAnnouncements = (signal: AbortSignal) =>
  request<{ data: { id: string; titulo: string; contenido: string }[] }>(
    '/announcements?limit=3',
    { signal },
  );
const subscribe = () => () => {};
const today = () =>
  new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'full',
    timeZone: 'America/Santiago',
  }).format(new Date());
export default function Home() {
  const announcements = useResource(getAnnouncements);
  const projects = useResource(getProjects);
  const events = useResource(getEvents);
  const date = useSyncExternalStore(
    subscribe,
    today,
    () => 'El espacio de nuestro club',
  );
  const todayISO = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
  }).format(new Date());
  const upcoming = (events.data ?? [])
    .filter(
      (e) =>
        e.estado === 'programado' &&
        (e.fecha_fin || e.fecha_inicio) >= todayISO,
    )
    .slice(0, 4);
  return (
    <div className="rf-home">
      <PageHeader
        eyebrow="INICIO"
        title="Bienvenido a Rafael"
        description={`${date} · así va el club hoy.`}
      >
        <Link className="rf-button" href="/miembros/">
          Ver miembros
        </Link>
        <Link className="rf-button rf-primary" href="/proyectos/">
          Gestionar proyectos <span aria-hidden="true">↗</span>
        </Link>
      </PageHeader>
      <div className="rf-home-banner">
        <span className="rf-home-dot" />
        <div>
          <h2>Un espacio para construir juntos</h2>
          <p>Proyectos, personas y actividades de ExDev, en un solo lugar.</p>
        </div>
        <Link className="rf-button" href="/postulaciones/">
          Ir a postulaciones →
        </Link>
      </div>
      <div className="rf-two-columns">
        <section className="rf-panel">
          <div className="rf-panel-heading">
            <h2>Anuncios del club</h2>
            <Link href="/anuncios/">Ver todos →</Link>
          </div>
          <ResourceState {...announcements} retry={announcements.reload} />
          {announcements.data?.data.length === 0 && (
            <Empty title="Sin anuncios vigentes">
              Las novedades del club aparecerán aquí.
            </Empty>
          )}
          {announcements.data?.data.map((item) => (
            <article key={item.id}>
              <h3>{item.titulo}</h3>
              <p className="rf-prose">{item.contenido}</p>
            </article>
          ))}
        </section>
        <section className="rf-panel">
          <div className="rf-panel-heading">
            <h2>Proyectos por estado</h2>
            <Link href="/proyectos/">Ver todos →</Link>
          </div>
          <ResourceState {...projects} retry={projects.reload} />
          {projects.data && (
            <>
              <div className="rf-home-stats">
                {Object.entries(projectStates).map(([value, label]) => {
                  const count = projects.data!.filter(
                    (p) => p.estado === value,
                  ).length;
                  return (
                    <div key={value}>
                      <span>{label}</span>
                      <div className="rf-home-track">
                        <span
                          className={`rf-home-bar rf-home-bar-${value}`}
                          style={{
                            width: `${(count / Math.max(projects.data!.length, 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  );
                })}
              </div>
              <p className="rf-home-caption">
                Sobre los {projects.data.length} proyectos del club.
              </p>
            </>
          )}
        </section>
        <section className="rf-panel">
          <div className="rf-panel-heading">
            <h2>Próximos eventos</h2>
            <Link href="/eventos/">Ver calendario →</Link>
          </div>
          <ResourceState {...events} retry={events.reload} />
          {events.data &&
            (upcoming.length ? (
              upcoming.map((e) => (
                <Link className="rf-home-event" key={e.id} href="/eventos/">
                  <span>{e.fecha_texto || dateLabel(e.fecha_inicio)}</span>
                  <div>
                    <strong>{e.titulo_evento}</strong>
                    <small>{e.tipo_evento}</small>
                  </div>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))
            ) : (
              <Empty title="Sin próximos eventos">
                Aquí aparecerán las próximas actividades del club.
              </Empty>
            ))}
        </section>
        <section className="rf-panel">
          <div className="rf-panel-heading">
            <h2>Accesos del club</h2>
            <span className="rf-muted">RAFAEL</span>
          </div>
          <div className="rf-home-shortcuts">
            {[
              ['/miembros/', 'Miembros', 'Conoce a quienes forman ExDev'],
              [
                '/proyectos/',
                'Proyectos',
                'Explora lo que estamos construyendo',
              ],
              [
                '/postulaciones/',
                'Postulaciones',
                'Consulta las candidaturas del club',
              ],
              ['/configuracion/', 'Catálogos', 'Roles y especialidades'],
            ].map(([href, title, description]) => (
              <Link key={href} href={href}>
                <div>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
