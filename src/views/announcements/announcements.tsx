'use client';
import { useCallback, useState, type FormEvent } from 'react';
import { useSession } from '@/shared/auth/session';
import { useResource } from '@/shared/hooks/useResource';
import { useSave } from '@/shared/hooks/useSave';
import { request } from '@/shared/services/api';
import {
  Empty,
  Field,
  Modal,
  PageHeader,
  ResourceState,
} from '@/shared/components/ui/ui';
import { dateLabel } from '@/shared/constants/content';
interface Announcement {
  id: string;
  titulo: string;
  contenido: string;
  autor_id: string;
  autor_nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  publicado: boolean;
  version: string;
}
export default function Announcements() {
  const { can, session } = useSession();
  const [offset, setOffset] = useState(0),
    [admin, setAdmin] = useState(false),
    [form, setForm] = useState<{ item?: Announcement } | null>(null);
  const mutation = useSave();
  const manage = admin && can('announcements.read_all');
  const load = useCallback(
    (signal: AbortSignal) =>
      request<{ data: Announcement[]; hasMore: boolean }>(
        `/announcements${manage ? '/admin' : ''}?limit=30&offset=${offset}`,
        { signal },
      ),
    [manage, offset],
  );
  const resource = useResource(load);
  const editable = (item: Announcement) =>
    can(
      item.autor_id === session?.member.id
        ? 'announcements.edit_own'
        : 'announcements.edit_any',
    );
  return (
    <>
      <PageHeader
        eyebrow="ANUNCIOS"
        title="Anuncios del club"
        description="Lo que necesitamos compartir, en nuestro espacio interno."
      >
        {can('announcements.create') && (
          <button className="rf-button rf-primary" onClick={() => setForm({})}>
            + Nuevo anuncio
          </button>
        )}
      </PageHeader>
      {can('announcements.read_all') && (
        <label className="rf-check">
          <input
            type="checkbox"
            checked={admin}
            onChange={(e) => {
              setAdmin(e.target.checked);
              setOffset(0);
            }}
          />
          Administrar todos, incluidos borradores y vencidos
        </label>
      )}
      <ResourceState {...resource} retry={resource.reload} />
      {mutation.error && (
        <p className="rf-error" role="alert">
          {mutation.error}
        </p>
      )}
      {resource.data?.data.length === 0 && (
        <Empty title="Sin anuncios">
          Las publicaciones vigentes aparecerán aquí.
        </Empty>
      )}
      <div className="rf-section-gap">
        {resource.data?.data.map((item) => (
          <article className="rf-panel rf-section-gap" key={item.id}>
            <div className="rf-panel-heading">
              <h2>{item.titulo}</h2>
              <span className="rf-badge">
                {item.publicado ? 'Publicado' : 'Borrador'}
              </span>
            </div>
            <p className="rf-prose">{item.contenido}</p>
            <p className="rf-muted">
              {item.autor_nombre} · {dateLabel(item.fecha_inicio)}
              {item.fecha_fin
                ? ` — ${dateLabel(item.fecha_fin)}`
                : ' · Sin vencimiento'}
            </p>
            <div className="rf-actions">
              {editable(item) &&
                (!item.publicado || can('announcements.publish')) && (
                  <button
                    className="rf-button"
                    onClick={() => setForm({ item })}
                  >
                    Editar
                  </button>
                )}
              {editable(item) && can('announcements.publish') && (
                <button
                  className="rf-button"
                  disabled={mutation.busy}
                  onClick={() =>
                    void mutation.save(
                      () =>
                        request(`/announcements/${item.id}/publication`, {
                          method: 'PATCH',
                          headers: { 'If-Match': item.version },
                          body: JSON.stringify({ publicado: !item.publicado }),
                        }),
                      resource.reload,
                    )
                  }
                >
                  {item.publicado ? 'Ocultar' : 'Publicar'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="rf-toolbar">
        <button
          className="rf-button"
          disabled={!offset || resource.loading}
          onClick={() => setOffset(Math.max(0, offset - 30))}
        >
          Anterior
        </button>
        <button
          className="rf-button"
          disabled={!resource.data?.hasMore || resource.loading}
          onClick={() => setOffset(offset + 30)}
        >
          Siguiente
        </button>
      </div>
      {form && (
        <AnnouncementForm
          item={form.item}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            resource.reload();
          }}
        />
      )}
    </>
  );
}
function AnnouncementForm({
  item,
  onClose,
  onSaved,
}: {
  item?: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutation = useSave();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      titulo: String(data.get('titulo')),
      contenido: String(data.get('contenido')),
      fecha_inicio: String(data.get('fecha_inicio')),
      fecha_fin: String(data.get('fecha_fin')) || null,
    };
    void mutation.save(
      () =>
        request(item ? `/announcements/${item.id}` : '/announcements', {
          method: item ? 'PATCH' : 'POST',
          headers: item ? { 'If-Match': item.version } : {},
          body: JSON.stringify(body),
        }),
      onSaved,
    );
  }
  return (
    <Modal
      title={item ? 'Editar anuncio' : 'Nuevo anuncio'}
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
    >
      <form className="rf-form" onSubmit={submit}>
        <Field label="Título *">
          <input
            name="titulo"
            required
            maxLength={200}
            defaultValue={item?.titulo}
          />
        </Field>
        <Field label="Contenido *">
          <textarea
            name="contenido"
            required
            rows={6}
            defaultValue={item?.contenido}
          />
        </Field>
        <div className="rf-form-grid">
          <Field label="Inicio de vigencia *">
            <input
              name="fecha_inicio"
              type="date"
              required
              defaultValue={item?.fecha_inicio}
            />
          </Field>
          <Field label="Fin de vigencia">
            <input
              name="fecha_fin"
              type="date"
              defaultValue={item?.fecha_fin || ''}
            />
          </Field>
        </div>
        <p className="rf-muted">
          {item
            ? 'El autor original se conserva.'
            : 'Se guardará como borrador a tu nombre. Podrás publicarlo desde la lista de administración.'}
        </p>
        {mutation.error && (
          <p className="rf-error" role="alert">
            {mutation.error}
          </p>
        )}
        <button className="rf-button rf-primary" disabled={mutation.busy}>
          {mutation.busy ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </Modal>
  );
}
