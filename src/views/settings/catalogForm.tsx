'use client';
import type { FormEvent } from 'react';
import { Field, Modal } from '@/shared/components/ui/ui';
import { saveCatalog } from '@/shared/services/contentService';
import { useSave } from '@/shared/hooks/useSave';
import type { CatalogItem } from '@/shared/types/content';
export default function CatalogForm({
  kind,
  item,
  onClose,
  onSaved,
}: {
  kind: 'roles' | 'specialties';
  item?: CatalogItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutation = useSave();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void mutation.save(
      () =>
        saveCatalog(
          kind,
          {
            nombre: String(form.get('nombre') ?? ''),
            descripcion: String(form.get('descripcion') ?? '').trim() || null,
            estado: form.get('estado') as CatalogItem['estado'],
          },
          item?.id,
        ),
      onSaved,
    );
  }
  return (
    <Modal
      title={`${item ? 'Editar' : kind === 'roles' ? 'Nuevo' : 'Nueva'} ${kind === 'roles' ? 'rol' : 'especialidad'}`}
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
    >
      <form className="rf-form" onSubmit={submit}>
        <Field label="Nombre *">
          <input name="nombre" required autoFocus defaultValue={item?.nombre} />
        </Field>
        <Field label="Descripción">
          <textarea name="descripcion" defaultValue={item?.descripcion ?? ''} />
        </Field>
        <Field label="Estado">
          <select name="estado" defaultValue={item?.estado ?? 'activo'}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </Field>
        <p className="rf-muted">
          Desactivar conserva las asociaciones existentes y deja de ofrecer este
          elemento para nuevas asignaciones.
        </p>
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
            {mutation.busy ? 'Guardando…' : item ? 'Guardar cambios' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
