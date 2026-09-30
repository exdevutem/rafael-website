'use client';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useSession } from '@/shared/auth/session';
import { request } from '@/shared/services/api';
import { getMembers } from '@/shared/services/contentService';
import { useResource } from '@/shared/hooks/useResource';
import { useSave } from '@/shared/hooks/useSave';
import { Field, ResourceState } from '@/shared/components/ui/ui';
import type { Application } from '@/shared/types/content';
interface Vote {
  id: string;
  voto: string;
  comentario: string | null;
  version: string;
}
interface Results {
  data: {
    id: string;
    nombre: string;
    voto: string;
    comentario: string | null;
  }[];
  a_favor: number;
  en_contra: number;
}
export default function ApplicationActions({
  application,
  onChanged,
}: {
  application: Application;
  onChanged: () => void;
}) {
  const { can } = useSession();
  const ownLoad = useCallback(
    (signal: AbortSignal) =>
      can('votes.read_own')
        ? request<{ data: Vote | null }>(
            `/applications/${application.id}/my-vote`,
            { signal },
          )
        : Promise.resolve({ data: null }),
    [application.id, can],
  );
  const resultsLoad = useCallback(
    (signal: AbortSignal) =>
      request<Results>(`/applications/${application.id}/votes`, { signal }),
    [application.id],
  );
  const own = useResource(ownLoad),
    results = useResource(resultsLoad);
  const mutation = useSave();
  const [success, setSuccess] = useState('');
  const canResults = true;
  return (
    <section className="rf-section-gap">
      <h3>Evaluación</h3>
      {success && (
        <p className="rf-success" role="status">
          {success}
        </p>
      )}
      {can('votes.read_own') && (
        <>
          <ResourceState {...own} retry={own.reload} />
          {own.data && (
            <VoteForm
              key={own.data.data?.version || 'new'}
              vote={own.data.data}
              disabled={
                application.estado_postulacion !== 'pendiente' ||
                !can('votes.write_own')
              }
              save={(body) =>
                mutation.save(
                  () =>
                    request(`/applications/${application.id}/my-vote`, {
                      method: own.data?.data ? 'PATCH' : 'POST',
                      headers: own.data?.data
                        ? { 'If-Match': own.data.data.version }
                        : {},
                      body: JSON.stringify(body),
                    }),
                  () => {
                    setSuccess('Tu voto quedó guardado.');
                    own.reload();
                    results.reload();
                  },
                )
              }
              busy={mutation.busy}
            />
          )}
        </>
      )}
      {mutation.error && (
        <p className="rf-error" role="alert">
          {mutation.error}
        </p>
      )}
      {canResults && (
        <>
          <h3>Resultados del club</h3>
          <ResourceState {...results} retry={results.reload} />
          {results.data && (
            <>
              <p>
                A favor: {results.data.a_favor} · En contra:{' '}
                {results.data.en_contra}
              </p>
              {results.data.data.length === 0 && <p>Aún no hay votos.</p>}
              {results.data.data.map((v) => (
                <div className="rf-panel rf-section-gap" key={v.id}>
                  <strong>{v.nombre}</strong>
                  <p>{v.voto === 'a_favor' ? 'A favor' : 'En contra'}</p>
                  <p className="rf-prose">{v.comentario || 'Sin comentario'}</p>
                </div>
              ))}
            </>
          )}
        </>
      )}
      {application.estado_postulacion === 'pendiente' &&
        can('applications.resolve') && (
          <Resolution application={application} onChanged={onChanged} />
        )}
      {application.estado_postulacion === 'aceptada' &&
        can('applications.convert') &&
        can('members.manage') && <Conversion application={application} />}
    </section>
  );
}
function VoteForm({
  vote,
  disabled,
  save,
  busy,
}: {
  vote: Vote | null;
  disabled: boolean;
  save: (body: object) => Promise<void>;
  busy: boolean;
}) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    void save({
      voto: String(d.get('voto')),
      comentario: String(d.get('comentario')) || null,
    });
  }
  return (
    <form className="rf-form" onSubmit={submit}>
      <h4>Tu voto</h4>
      <Field label="Decisión">
        <select
          name="voto"
          defaultValue={vote?.voto || 'a_favor'}
          disabled={disabled || busy}
        >
          <option value="a_favor">A favor</option>
          <option value="en_contra">En contra</option>
        </select>
      </Field>
      <Field label="Comentario visible para el club">
        <textarea
          name="comentario"
          rows={3}
          defaultValue={vote?.comentario || ''}
          disabled={disabled || busy}
        />
      </Field>
      <button className="rf-button" disabled={disabled || busy}>
        {vote ? 'Actualizar voto' : 'Emitir voto'}
      </button>
      <small>
        Disponible desde la apertura hasta el cierre de votación, mientras la
        postulación siga pendiente.
      </small>
    </form>
  );
}
function useIdempotency() {
  const current = useRef<{ body: string; key: string } | null>(null);
  return (body: object) => {
    const text = JSON.stringify(body);
    if (current.current?.body !== text)
      current.current = { body: text, key: crypto.randomUUID() };
    return current.current.key;
  };
}
function Resolution({
  application,
  onChanged,
}: {
  application: Application;
  onChanged: () => void;
}) {
  const mutation = useSave(),
    idem = useIdempotency();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = {
      decision: String(d.get('decision')),
      motivo: String(d.get('motivo')),
    };
    void mutation.save(
      () =>
        request(`/applications/${application.id}/resolution`, {
          method: 'POST',
          headers: { 'Idempotency-Key': idem(body) },
          body: JSON.stringify(body),
        }),
      onChanged,
    );
  }
  return (
    <form className="rf-form rf-section-gap" onSubmit={submit}>
      <h3>Resolver postulación</h3>
      <Field label="Decisión final">
        <select name="decision">
          <option value="aceptada">Aceptar</option>
          <option value="rechazada">Rechazar</option>
        </select>
      </Field>
      <Field label="Motivo de resolución *">
        <textarea name="motivo" required />
      </Field>
      <label className="rf-check">
        <input required type="checkbox" />
        Confirmo la decisión final. No podrá corregirse desde esta vista y
        cerrará la votación de esta candidatura.
      </label>
      {mutation.error && (
        <p role="alert" className="rf-error">
          {mutation.error}
        </p>
      )}
      <button className="rf-button rf-primary" disabled={mutation.busy}>
        Guardar resolución
      </button>
    </form>
  );
}
function Conversion({ application }: { application: Application }) {
  const mutation = useSave(),
    idem = useIdempotency();
  const [mode, setMode] = useState('crear'),
    [success, setSuccess] = useState('');
  const members = useResource(getMembers);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body =
      mode === 'crear'
        ? {
            mode,
            nombre: String(d.get('nombre')),
            correoInstitucional: String(d.get('correo')),
            carrera: String(d.get('carrera')),
            anioIngresoCarrera: d.get('year') ? Number(d.get('year')) : null,
            confirmado: true,
          }
        : { mode, memberId: String(d.get('memberId')), confirmado: true };
    void mutation.save(
      async () => {
        const result = await request<{ id: string }>(
          `/applications/${application.id}/member-conversion`,
          {
            method: 'POST',
            headers: { 'Idempotency-Key': idem(body) },
            body: JSON.stringify(body),
          },
        );
        setSuccess(
          `Miembro #${result.id} asociado. El acceso IAM y sus roles se habilitan por separado.`,
        );
      },
      () => {},
    );
  }
  if (success)
    return (
      <p className="rf-success" role="status">
        {success}
      </p>
    );
  return (
    <form className="rf-form rf-section-gap" onSubmit={submit}>
      <h3>Convertir en miembro</h3>
      <Field label="Operación">
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="crear">Crear miembro nuevo</option>
          <option value="asociar_existente">Asociar miembro existente</option>
        </select>
      </Field>
      {mode === 'crear' ? (
        <>
          <Field label="Nombre *">
            <input
              name="nombre"
              required
              defaultValue={application.nombre_completo}
            />
          </Field>
          <Field label="Correo institucional *">
            <input
              name="correo"
              type="email"
              required
              defaultValue={application.correo_institucional}
            />
          </Field>
          <Field label="Carrera *">
            <input name="carrera" required defaultValue={application.carrera} />
          </Field>
          <Field label="Año de ingreso">
            <input
              name="year"
              type="number"
              min={1900}
              max={2100}
              defaultValue={application.anio_ingreso || ''}
            />
          </Field>
        </>
      ) : (
        <>
          <ResourceState {...members} retry={members.reload} />
          <Field label="Miembro revisado *">
            <select name="memberId" required>
              <option value="">Seleccionar…</option>
              {members.data
                ?.filter((m) => m.estado === 'activo')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} · {m.correo_institucional}
                  </option>
                ))}
            </select>
          </Field>
        </>
      )}
      <label className="rf-check">
        <input type="checkbox" required />
        Verifiqué la identidad y que esta operación no duplica a otra persona.
      </label>
      <p className="rf-muted">
        Un miembro nuevo se crea activo, con perfil y foto ocultos. Esta
        operación no concede acceso IAM ni roles.
      </p>
      {mutation.error && (
        <p className="rf-error" role="alert">
          {mutation.error}
        </p>
      )}
      <button
        className="rf-button rf-primary"
        disabled={
          mutation.busy ||
          (mode === 'asociar_existente' && (!members.data || members.loading))
        }
      >
        Confirmar conversión
      </button>
    </form>
  );
}
