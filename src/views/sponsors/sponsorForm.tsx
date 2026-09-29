'use client';
import type { FormEvent } from 'react';
import { Field, Modal } from '@/shared/components/ui/ui';
import { saveSponsor } from '@/shared/services/contentService';
import { useSave } from '@/shared/hooks/useSave';
import type { Sponsor } from '@/shared/types/content';
export default function SponsorForm({
  sponsor,
  onClose,
  onSaved,
}: {
  sponsor?: Sponsor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutation = useSave();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void mutation.save(
      () =>
        saveSponsor(
          {
            nombre_patrocinador: String(form.get('nombre') ?? ''),
            descripcion_patrocinador:
              String(form.get('descripcion') ?? '').trim() || null,
            estado_patrocinador: form.get(
              'estado',
            ) as Sponsor['estado_patrocinador'],
            publicado: form.get('publicado') === 'on',
            orden: Number(form.get('orden')),
          },
          sponsor?.id,
        ),
      onSaved,
    );
  }
  return (
    <Modal
      title={sponsor ? 'Editar patrocinador' : 'Nuevo patrocinador'}
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
    >
      <form className="rf-form" onSubmit={submit}>
        <Field label="Nombre *">
          <input
            name="nombre"
            required
            autoFocus
            defaultValue={sponsor?.nombre_patrocinador}
          />
        </Field>
        <Field label="Descripción">
          <textarea
            name="descripcion"
            defaultValue={sponsor?.descripcion_patrocinador ?? ''}
          />
        </Field>
        <div className="rf-form-grid">
          <Field label="Estado">
            <select
              name="estado"
              defaultValue={sponsor?.estado_patrocinador ?? 'activo'}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </Field>
          <Field label="Orden">
            <input
              name="orden"
              type="number"
              step={1}
              min={-2147483648}
              max={2147483647}
              defaultValue={sponsor?.orden ?? 0}
            />
          </Field>
        </div>
        <label className="rf-check">
          <input
            name="publicado"
            type="checkbox"
            defaultChecked={sponsor?.publicado ?? false}
          />
          Publicar en exdev.cl
        </label>
        {mutation.error && (
          <div className="rf-error" role="alert">
            {mutation.error}
          </div>
        )}
        <div className="rf-form-actions">
          <button
            className="rf-button"
            type="button"
            disabled={mutation.busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="rf-button rf-primary" disabled={mutation.busy}>
            {mutation.busy
              ? 'Guardando…'
              : sponsor
                ? 'Guardar cambios'
                : 'Crear patrocinador'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
