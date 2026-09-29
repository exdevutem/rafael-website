'use client';
import { useState } from 'react';
import {
  Empty,
  Field,
  Modal,
  PageHeader,
  PendingSave,
} from '@/shared/components/ui/ui';
export default function Announcements() {
  const [creating, setCreating] = useState(false);
  const [start, setStart] = useState('');
  return (
    <>
      <PageHeader
        eyebrow="ANUNCIOS"
        title="Anuncios del club"
        description="Lo que necesitamos compartir, en nuestro espacio interno."
      >
        <button
          className="rf-button rf-primary"
          onClick={() => setCreating(true)}
        >
          + Nuevo anuncio
        </button>
      </PageHeader>
      <section className="rf-panel">
        <Empty title="Un espacio para mantenernos al día">
          La gestión de anuncios internos está en preparación. Aquí aparecerán
          las publicaciones vigentes del club.
        </Empty>
      </section>
      {creating && (
        <Modal title="Nuevo anuncio" onClose={() => setCreating(false)}>
          <form className="rf-form" onSubmit={(e) => e.preventDefault()}>
            <Field label="Título *">
              <input required autoFocus maxLength={200} />
            </Field>
            <Field label="Contenido *">
              <textarea required rows={6} />
            </Field>
            <div className="rf-form-grid">
              <Field label="Inicio de vigencia *">
                <input
                  type="date"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field label="Fin de vigencia">
                <input type="date" min={start || undefined} />
              </Field>
            </div>
            <label className="rf-check">
              <input type="checkbox" />
              Publicar en Rafael
            </label>
            <p className="rf-muted">
              Exclusivo del club. Los anuncios no se publican en exdev.cl. El
              autor se asociará a la cuenta que publique.
            </p>
            <PendingSave />
            <div className="rf-form-actions">
              <button
                type="button"
                className="rf-button"
                onClick={() => setCreating(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
