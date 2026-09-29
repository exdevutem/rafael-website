'use client';
import { useState, type FormEvent } from 'react';
import { Field, Modal } from '@/shared/components/ui/ui';
import { savePeriod } from '@/shared/services/contentService';
import { chileLocal, chileInstant } from '@/shared/constants/chileTime';
import { useSave } from '@/shared/hooks/useSave';
import type { Period } from '@/shared/types/content';
export default function PeriodForm({
  period,
  onClose,
  onSaved,
}: {
  period?: Period;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutation = useSave();
  const [name, setName] = useState(period?.nombre_periodo ?? '');
  const [opening, setOpening] = useState(
    period ? chileLocal(period.fecha_apertura) : '',
  );
  const [closing, setClosing] = useState(
    period ? chileLocal(period.fecha_cierre) : '',
  );
  const [voting, setVoting] = useState(
    period ? chileLocal(period.fecha_cierre_votacion) : '',
  );
  const initial = period?.estado_periodo ?? 'creado';
  const [state, setState] = useState<Period['estado_periodo']>(initial);
  const states =
    initial === 'creado'
      ? ['creado', 'cancelado']
      : initial === 'habilitado'
        ? ['habilitado', 'cerrado', 'cancelado']
        : [initial];
  const ended = initial === 'cerrado' || initial === 'cancelado';
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void mutation.save(async () => {
      const start = chileInstant(opening, period?.fecha_apertura),
        end = chileInstant(closing, period?.fecha_cierre),
        voteEnd = chileInstant(voting, period?.fecha_cierre_votacion);
      if (
        Date.parse(end) <= Date.parse(start) ||
        Date.parse(voteEnd) < Date.parse(end)
      )
        throw new Error(
          'Revisa los plazos: recepción después de apertura y votación igual o posterior al cierre.',
        );
      return savePeriod(
        {
          nombre_periodo: name,
          descripcion: String(form.get('descripcion') ?? '').trim() || null,
          fecha_apertura: start,
          fecha_cierre: end,
          fecha_cierre_votacion: voteEnd,
          estado_periodo: state,
        },
        period?.id,
      );
    }, onSaved);
  }
  return (
    <Modal
      title={period ? 'Editar período' : 'Nuevo período'}
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
    >
      <form className="rf-form" onSubmit={submit}>
        <Field label="Nombre del período *">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Descripción">
          <textarea
            name="descripcion"
            defaultValue={period?.descripcion ?? ''}
          />
        </Field>
        <Field label="Apertura de recepción *">
          <input
            type="datetime-local"
            required
            disabled={initial !== 'creado'}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
        </Field>
        <div className="rf-form-grid">
          <Field label="Cierre de recepción *">
            <input
              type="datetime-local"
              required
              disabled={ended}
              min={opening || undefined}
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
            />
          </Field>
          <Field label="Cierre de votación *">
            <input
              type="datetime-local"
              required
              disabled={ended}
              min={closing || undefined}
              value={voting}
              onChange={(e) => setVoting(e.target.value)}
            />
          </Field>
        </div>
        <p className="rf-muted">
          Zona horaria: America/Santiago. La votación puede continuar después
          del cierre de recepción.
        </p>
        {period && (
          <Field label="Estado">
            <select
              value={state}
              onChange={(e) =>
                setState(e.target.value as Period['estado_periodo'])
              }
            >
              {states.map((value) => (
                <option key={value} value={value}>
                  {value === 'creado'
                    ? 'Programado'
                    : value === 'habilitado'
                      ? 'Habilitado'
                      : value === 'cerrado'
                        ? 'Cerrar recepción'
                        : 'Cancelado'}
                </option>
              ))}
            </select>
          </Field>
        )}
        <section className="rf-panel">
          <h3>{name || 'Resumen de la convocatoria'}</h3>
          <dl className="rf-details">
            <div>
              <dt>Apertura</dt>
              <dd>{opening.replace('T', ' · ') || 'Por definir'}</dd>
            </div>
            <div>
              <dt>Cierre de recepción</dt>
              <dd>{closing.replace('T', ' · ') || 'Por definir'}</dd>
            </div>
            <div>
              <dt>Cierre de votación</dt>
              <dd>{voting.replace('T', ' · ') || 'Por definir'}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                {state === 'creado'
                  ? 'Creado · convocatoria programada'
                  : state}
              </dd>
            </div>
          </dl>
          <p className="rf-muted">
            Las convocatorias programadas se abren y cierran según sus fechas.
            No se permiten intervalos de recepción superpuestos.
          </p>
        </section>
        {mutation.error && (
          <div className="rf-error" role="alert">
            {mutation.error}
          </div>
        )}
        <div className="rf-form-actions">
          <button
            type="button"
            className="rf-button"
            disabled={mutation.busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="rf-button rf-primary" disabled={mutation.busy}>
            {mutation.busy
              ? 'Guardando…'
              : period
                ? 'Guardar cambios'
                : 'Crear período'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
