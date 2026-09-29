'use client';
import { useCallback, useState } from 'react';
import { getApplications, getPeriods } from '@/shared/services/contentService';
import { useResource } from '@/shared/hooks/useResource';
import { dateLabel } from '@/shared/constants/content';
import {
  Badge,
  Empty,
  Modal,
  Notice,
  PageHeader,
  ResourceState,
} from '@/shared/components/ui/ui';
import type { Application, Period } from '@/shared/types/content';
import PeriodForm from './periodForm';
export default function Applications() {
  const [query, setQuery] = useState(''),
    [search, setSearch] = useState(''),
    [state, setState] = useState(''),
    [period, setPeriod] = useState('');
  const [limit, setLimit] = useState(10),
    [offset, setOffset] = useState(0);
  const loader = useCallback(
    (signal: AbortSignal) =>
      getApplications(signal, limit, offset, state, period, search),
    [limit, offset, state, period, search],
  );
  const resource = useResource(loader),
    periods = useResource(getPeriods);
  const [selected, setSelected] = useState<Application | null>(null);
  const [form, setForm] = useState<{ period?: Period } | null>(null);
  const [success, setSuccess] = useState('');
  const entries = resource.data?.postulaciones ?? [];
  return (
    <>
      <PageHeader
        eyebrow="POSTULACIONES"
        title="Nuevas personas, nuevas ideas"
        description="Consulta las candidaturas y prepara las próximas convocatorias."
      >
        <button className="rf-button rf-primary" onClick={() => setForm({})}>
          + Nuevo período
        </button>
      </PageHeader>
      <Notice>
        La votación y la resolución de candidaturas siguen pendientes de IAM.
      </Notice>
      {success && (
        <div className="rf-success" role="status">
          {success}
        </div>
      )}
      <section className="rf-panel rf-section-gap">
        <div className="rf-panel-heading">
          <h2>Períodos de postulación</h2>
        </div>
        <ResourceState {...periods} retry={periods.reload} />
        {periods.data &&
          (periods.data.length ? (
            <div className="rf-table-wrap">
              <table className="rf-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Recepción</th>
                    <th>Cierre de votos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.data.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nombre_periodo}</td>
                      <td>
                        {dateLabel(item.fecha_apertura)} —{' '}
                        {dateLabel(item.fecha_cierre)}
                      </td>
                      <td>{dateLabel(item.fecha_cierre_votacion)}</td>
                      <td>
                        {item.estado_periodo === 'creado'
                          ? 'Programado'
                          : item.estado_periodo}
                      </td>
                      <td>
                        <button onClick={() => setForm({ period: item })}>
                          Editar período
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Sin períodos">
              Programa una convocatoria para comenzar a recibir postulaciones.
            </Empty>
          ))}
      </section>
      <h2 className="rf-section-gap">Postulaciones recibidas</h2>
      <form
        className="rf-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setSearch(query);
        }}
      >
        <input
          aria-label="Buscar postulación"
          placeholder="Buscar por nombre o correo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filtrar por estado"
          value={state}
          onChange={(e) => {
            setOffset(0);
            setState(e.target.value);
          }}
        >
          <option value="">Todos los estados</option>
          {['pendiente', 'aceptada', 'rechazada', 'retirada'].map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por período"
          value={period}
          onChange={(e) => {
            setOffset(0);
            setPeriod(e.target.value);
          }}
        >
          <option value="">Todos los períodos</option>
          {(periods.data ?? []).map((item) => (
            <option key={item.id} value={String(item.id)}>
              {item.nombre_periodo}
            </option>
          ))}
        </select>
        <button className="rf-button" type="submit">
          Buscar
        </button>
      </form>
      <ResourceState {...resource} retry={resource.reload} />
      {!resource.loading &&
        !resource.error &&
        (entries.length ? (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Postulante</th>
                  <th>Carrera</th>
                  <th>Período</th>
                  <th>Recibida</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button onClick={() => setSelected(p)}>
                        {p.nombre_completo}
                      </button>
                      <small>{p.correo_institucional}</small>
                    </td>
                    <td>{p.carrera}</td>
                    <td>#{p.periodo_id}</td>
                    <td>{dateLabel(p.created_at)}</td>
                    <td>
                      <Badge value={p.estado_postulacion} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Sin postulaciones para mostrar">
            Las candidaturas recibidas aparecerán aquí. Si aplicaste filtros,
            prueba ajustarlos.
          </Empty>
        ))}
      <div className="rf-toolbar rf-section-gap">
        <label className="rf-check">
          Por página{' '}
          <select
            aria-label="Postulaciones por página"
            value={limit}
            onChange={(e) => {
              setOffset(0);
              setLimit(Number(e.target.value));
            }}
          >
            {[10, 30, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span className="rf-count">
          {resource.data
            ? resource.data.totalPostulaciones === 0
              ? '0 resultados'
              : entries.length === 0
                ? `Sin registros en esta página · ${resource.data.totalPostulaciones} resultados`
                : offset +
                  1 +
                  '–' +
                  (offset + entries.length) +
                  ' de ' +
                  resource.data.totalPostulaciones
            : resource.error
              ? 'Consulta no disponible'
              : 'Cargando…'}
        </span>
        <button
          className="rf-button"
          disabled={offset === 0 || resource.loading}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Anterior
        </button>
        <button
          className="rf-button"
          disabled={!resource.data?.hasMore || resource.loading}
          onClick={() => setOffset(offset + limit)}
        >
          Siguiente
        </button>
      </div>
      {selected && (
        <Modal
          title={selected.nombre_completo}
          onClose={() => setSelected(null)}
        >
          <Badge value={selected.estado_postulacion} />
          <dl className="rf-details">
            <div>
              <dt>Correo institucional</dt>
              <dd>{selected.correo_institucional}</dd>
            </div>
            <div>
              <dt>Carrera</dt>
              <dd>{selected.carrera}</dd>
            </div>
            <div>
              <dt>Campus</dt>
              <dd>{selected.campus || 'Sin información'}</dd>
            </div>
            <div>
              <dt>Edad</dt>
              <dd>{selected.edad ?? 'Sin información'}</dd>
            </div>
            <div>
              <dt>Año de ingreso</dt>
              <dd>{selected.anio_ingreso ?? 'Sin información'}</dd>
            </div>
            <div>
              <dt>Áreas de interés</dt>
              <dd>
                {[
                  selected.area_interes1,
                  selected.area_interes2,
                  selected.area_interes3,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </dd>
            </div>
          </dl>
          {[
            ['Motivación', selected.motivo_postulacion],
            ['Idea de proyecto', selected.proyecto_idea],
            ['Presentación', selected.pitch],
          ].map(([label, value]) => (
            <section key={label}>
              <h3>{label}</h3>
              <p className="rf-prose">{value || 'Sin información.'}</p>
            </section>
          ))}
          <Notice>
            La resolución y los votos estarán disponibles al conectar los
            permisos del club.
          </Notice>
        </Modal>
      )}
      {form && (
        <PeriodForm
          period={form.period}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            setSuccess('Período guardado correctamente.');
            periods.reload();
            resource.reload();
          }}
        />
      )}
    </>
  );
}
