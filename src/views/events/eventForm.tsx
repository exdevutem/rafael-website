'use client';
import { useState, type FormEvent } from 'react';
import { Field, Modal } from '@/shared/components/ui/ui';
import { dateLabel, safeLink } from '@/shared/constants/content';
import { saveEvent } from '@/shared/services/contentService';
import { useSave } from '@/shared/hooks/useSave';
import type { ClubEvent } from '@/shared/types/content';
export default function EventForm({
  event: existing,
  onClose,
  onSaved,
}: {
  event?: ClubEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutation = useSave();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();
    void mutation.save(async () => {
      if (end && end < date)
        throw new Error('El término debe ser igual o posterior al inicio.');
      if (['inscripcion', 'postulacion'].includes(action) && !safeLink(url))
        throw new Error('Agrega un enlace válido para la acción.');
      return saveEvent(
        {
          titulo_evento: title,
          tipo_evento: text('tipo_evento'),
          descripcion: description || null,
          fecha_inicio: date,
          fecha_fin: end || null,
          fecha_texto: label || null,
          estado: text('estado') as ClubEvent['estado'],
          ubicacion: text('ubicacion') || null,
          url_evento: text('url_evento') || null,
          tipo_accion: (action as ClubEvent['tipo_accion']) || null,
          url_accion: ['inscripcion', 'postulacion'].includes(action)
            ? url
            : null,
          publicado: form.get('publicado') === 'on',
        },
        existing?.id,
      );
    }, onSaved);
  }
  const [title, setTitle] = useState(existing?.titulo_evento ?? '');
  const [description, setDescription] = useState(existing?.descripcion ?? '');
  const [date, setDate] = useState(existing?.fecha_inicio ?? '');
  const [end, setEnd] = useState(existing?.fecha_fin ?? '');
  const [label, setLabel] = useState(existing?.fecha_texto ?? '');
  const [action, setAction] = useState<string>(existing?.tipo_accion ?? '');
  const [url, setUrl] = useState(existing?.url_accion ?? '');
  return (
    <Modal
      title={existing ? 'Editar evento' : 'Nuevo evento'}
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
    >
      <form className="rf-form" onSubmit={submit}>
        <div className="rf-form-grid">
          <Field label="Título *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="Tipo de evento *">
            <input
              name="tipo_evento"
              required
              placeholder="Tipo de actividad"
              defaultValue={existing?.tipo_evento}
            />
          </Field>
        </div>
        <Field
          label="Descripción"
          hint="Incluye aquí los horarios y el detalle de la actividad."
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="rf-form-grid">
          <Field label="Fecha de inicio *">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Fecha de término">
            <input
              type="date"
              min={date || undefined}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
          <Field
            label="Texto de fecha"
            hint="Etiqueta opcional que reemplaza la fecha en la lista pública."
          >
            <input value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="Estado">
            <select
              name="estado"
              defaultValue={existing?.estado ?? 'programado'}
            >
              <option value="programado">Programado</option>
              <option value="cancelado">Cancelado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </Field>
          <Field label="Ubicación">
            <input name="ubicacion" defaultValue={existing?.ubicacion ?? ''} />
          </Field>
          <Field label="Enlace del evento">
            <input
              name="url_evento"
              defaultValue={existing?.url_evento ?? ''}
            />
          </Field>
        </div>
        <div className="rf-form-grid">
          <Field label="Acción">
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setUrl('');
              }}
            >
              <option value="">Sin acción</option>
              <option value="inscripcion">Inscribirse</option>
              <option value="postulacion">Postularse</option>
              <option value="acceso_libre">Abierto a todos</option>
            </select>
          </Field>
          {['inscripcion', 'postulacion'].includes(action) && (
            <Field
              label="Enlace de la acción *"
              hint="Para el formulario del club puedes usar /apply."
            >
              <input
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://… o /apply"
              />
            </Field>
          )}
        </div>
        <label className="rf-check">
          <input
            name="publicado"
            type="checkbox"
            defaultChecked={existing?.publicado ?? false}
          />
          Publicar en exdev.cl
        </label>
        {date && end && end < date && (
          <p role="alert" className="rf-error">
            El término debe ser igual o posterior al inicio.
          </p>
        )}
        <section className="rf-panel">
          <div className="rf-eyebrow">VISTA PREVIA · EXDEV.CL</div>
          <div className="rf-event-preview">
            <span>
              {label || (date ? dateLabel(date) : 'Fecha del evento')}
            </span>
            <div>
              <h3>{title || 'Título del evento'}</h3>
              <p className="rf-prose">
                {description || 'La descripción de tu evento aparecerá aquí.'}
              </p>
              {action === 'acceso_libre' ? (
                <span className="rf-badge">Abierto a todos</span>
              ) : (
                ['inscripcion', 'postulacion'].includes(action) &&
                (safeLink(url) ? (
                  <a href={safeLink(url)} target="_blank" rel="noreferrer">
                    {action === 'inscripcion' ? 'Inscribirse' : 'Postularse'} ↗
                  </a>
                ) : (
                  <span className="rf-muted">
                    Agrega un enlace válido para la acción.
                  </span>
                ))
              )}
            </div>
          </div>
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
              : existing
                ? 'Guardar cambios'
                : 'Crear evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
