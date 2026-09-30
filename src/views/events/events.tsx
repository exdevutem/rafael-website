'use client';
import { useSession } from '@/shared/auth/session';
import { useState } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import { getEvents } from '@/shared/services/contentService';
import {
  Badge,
  Empty,
  Modal,
  Notice,
  PageHeader,
  ResourceState,
} from '@/shared/components/ui/ui';
import { dateLabel, safeLink } from '@/shared/constants/content';
import type { ClubEvent } from '@/shared/types/content';
import EventForm from './eventForm';
import './events.css';
export default function Events() {
  const { can } = useSession();
  const resource = useResource(getEvents);
  const [view, setView] = useState('calendar');
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState(() => {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());
    return new Date(
      Number(today.find((p) => p.type === 'year')?.value),
      Number(today.find((p) => p.type === 'month')?.value) - 1,
      1,
    );
  });
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ClubEvent | undefined>();
  const [success, setSuccess] = useState('');
  const filtered = (resource.data ?? []).filter((e) =>
    e.titulo_evento
      .toLocaleLowerCase('es')
      .includes(query.toLocaleLowerCase('es')),
  );
  const start = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((start + days) / 7) * 7;
  const monthLabel = new Intl.DateTimeFormat('es-CL', {
    month: 'long',
    year: 'numeric',
  }).format(month);
  return (
    <>
      <PageHeader
        eyebrow="CALENDARIO"
        title="Calendario y eventos"
        description="El próximo encuentro empieza aquí."
      >
        <div className="rf-segment" role="group" aria-label="Vista de eventos">
          <button
            onClick={() => setView('calendar')}
            aria-pressed={view === 'calendar'}
          >
            Calendario
          </button>
          <button
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
          >
            Lista
          </button>
        </div>
        <button
          disabled={!can('events.manage')}
          className="rf-button rf-primary"
          onClick={() => {
            setEditing(undefined);
            setCreating(true);
          }}
        >
          + Nuevo evento
        </button>
      </PageHeader>
      <Notice>
        Agenda administrativa: incluye eventos publicados e internos.
      </Notice>
      {success && (
        <div className="rf-success" role="status">
          {success}
        </div>
      )}
      <div className="rf-toolbar">
        <input
          aria-label="Buscar evento"
          placeholder="Buscar evento…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ResourceState {...resource} retry={resource.reload} />
      {!resource.loading &&
        !resource.error &&
        (view === 'calendar' ? (
          <section className="rf-panel rf-calendar">
            <div className="rf-panel-heading">
              <h2>{monthLabel}</h2>
              <div className="rf-actions">
                <button
                  className="rf-icon-button"
                  aria-label="Mes anterior"
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    )
                  }
                >
                  ‹
                </button>
                <button
                  className="rf-button"
                  onClick={() => {
                    const now = new Date();
                    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  }}
                >
                  Hoy
                </button>
                <button
                  className="rf-icon-button"
                  aria-label="Mes siguiente"
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    )
                  }
                >
                  ›
                </button>
              </div>
            </div>
            <div className="rf-calendar-grid">
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day) => (
                <div className="rf-calendar-weekday" key={day}>
                  {day}
                </div>
              ))}
              {Array.from({ length: cellCount }, (_, index) => {
                const day = index - start + 1;
                const valid = day > 0 && day <= days;
                const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const events = valid
                  ? filtered.filter(
                      (e) =>
                        e.fecha_inicio <= iso &&
                        (e.fecha_fin || e.fecha_inicio) >= iso,
                    )
                  : [];
                return (
                  <div
                    className={`rf-calendar-day ${valid ? '' : 'rf-calendar-outside'}`}
                    key={index}
                  >
                    {valid && (
                      <>
                        <span>{day}</span>
                        {events.map((e) => (
                          <button
                            key={e.id}
                            className={
                              e.estado === 'cancelado'
                                ? 'rf-event-cancelled'
                                : ''
                            }
                            title={e.titulo_evento}
                            onClick={() => setSelected(e)}
                          >
                            {e.titulo_evento}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="rf-muted rf-section-gap">
                No hay eventos{' '}
                {query ? 'que coincidan con tu búsqueda' : 'registrados'}.
              </p>
            )}
          </section>
        ) : filtered.length ? (
          <div className="rf-panel rf-event-list">
            {filtered.map((e) => (
              <button
                className="rf-event-row"
                key={e.id}
                onClick={() => setSelected(e)}
              >
                <span>{e.fecha_texto || dateLabel(e.fecha_inicio)}</span>
                <div>
                  <h2>{e.titulo_evento}</h2>
                  <p>
                    {e.tipo_evento}
                    {e.ubicacion ? ` · ${e.ubicacion}` : ''}
                  </p>
                </div>
                <Badge value={e.estado} />
                <span className="rf-muted">
                  {e.publicado ? 'Publicado' : 'Interno'}
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        ) : (
          <Empty title="Sin eventos para mostrar">
            Prueba otra búsqueda o prepara una nueva actividad.
          </Empty>
        ))}
      {selected && (
        <Modal title={selected.titulo_evento} onClose={() => setSelected(null)}>
          <Badge value={selected.estado} />
          <button
            className="rf-button"
            onClick={() => {
              setEditing(selected);
              setSelected(null);
              setCreating(true);
            }}
          >
            Editar evento
          </button>
          <dl className="rf-details">
            <div>
              <dt>Inicio</dt>
              <dd>{dateLabel(selected.fecha_inicio)}</dd>
            </div>
            <div>
              <dt>Término</dt>
              <dd>{dateLabel(selected.fecha_fin)}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{selected.ubicacion || 'No informada'}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{selected.tipo_evento}</dd>
            </div>
          </dl>
          <p className="rf-prose">
            {selected.descripcion || 'Sin descripción.'}
          </p>
          <div className="rf-actions">
            {safeLink(selected.url_evento) && (
              <a
                className="rf-button"
                href={safeLink(selected.url_evento)}
                target="_blank"
                rel="noreferrer"
              >
                Ver evento ↗
              </a>
            )}
            {selected.tipo_accion === 'acceso_libre' ? (
              <span className="rf-badge">Abierto a todos</span>
            ) : (
              safeLink(selected.url_accion) && (
                <a
                  className="rf-button rf-primary"
                  href={safeLink(selected.url_accion)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selected.tipo_accion === 'inscripcion'
                    ? 'Inscribirse'
                    : 'Postularse'}{' '}
                  ↗
                </a>
              )
            )}
          </div>
        </Modal>
      )}
      {creating && (
        <EventForm
          event={editing}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setSuccess(
              editing
                ? 'Evento actualizado correctamente.'
                : 'Evento creado correctamente.',
            );
            resource.reload();
          }}
        />
      )}
    </>
  );
}
