'use client';
import { useSession } from '@/shared/auth/session';
import { useState, type FormEvent } from 'react';
import { Field, Modal, Notice, ResourceState } from '@/shared/components/ui/ui';
import {
  getRoles,
  getSpecialties,
  saveMember,
} from '@/shared/services/contentService';
import { useResource } from '@/shared/hooks/useResource';
import { useSave } from '@/shared/hooks/useSave';
import type { Member } from '@/shared/types/content';
const loadCatalogs = async (signal: AbortSignal) => {
  const [roles, specialties] = await Promise.all([
    getRoles(signal),
    getSpecialties(signal),
  ]);
  return { roles, specialties };
};
export default function MemberForm({
  member,
  onClose,
  onSaved,
}: {
  member?: Member;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { session, can } = useSession();
  const isAdministrator =
    session?.roles?.includes('administrador_rafael') ?? false;
  const canChangeLevel =
    can('access_levels.manage') &&
    (isAdministrator || member?.rafael_access_level !== 'representante');
  const catalogs = useResource(loadCatalogs);
  const mutation = useSave();
  const [published, setPublished] = useState(member?.perfil_publico ?? false);
  const [photo, setPhoto] = useState(member?.foto_publica ?? false);
  const [roles, setRoles] = useState((member?.role_ids ?? []).map(String));
  const [specialties, setSpecialties] = useState(
    (member?.specialty_ids ?? []).map(String),
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();
    void mutation.save(
      () =>
        saveMember(
          {
            nombre: text('nombre'),
            correoInstitucional: text('correo') || null,
            carrera: text('carrera'),
            anioIngresoCarrera: text('anio') ? Number(text('anio')) : null,
            estado: text('estado') as Member['estado'],
            perfilPublico: published,
            fotoPublica: published && photo,
            roleIds: roles,
            specialtyIds: specialties,
            ...(canChangeLevel
              ? {
                  accessLevel: (text('accessLevel') ||
                    null) as Member['rafael_access_level'],
                }
              : {}),
          },
          member?.id,
        ),
      () =>
        onSaved(
          member
            ? 'Miembro actualizado correctamente.'
            : 'Miembro creado correctamente.',
        ),
    );
  }
  return (
    <Modal
      title={member ? 'Editar miembro' : 'Nuevo miembro'}
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
    >
      <form className="rf-form" onSubmit={submit}>
        <Field label="Nombre completo *">
          <input
            name="nombre"
            required
            defaultValue={member?.nombre}
            autoFocus
          />
        </Field>
        <div className="rf-form-grid">
          <Field label="Correo institucional">
            <input
              name="correo"
              type="email"
              pattern="[^\s@]+@utem\.cl"
              title="Usa un correo @utem.cl"
              defaultValue={member?.correo_institucional ?? ''}
            />
          </Field>
          <Field label="Año de ingreso a la carrera">
            <input
              name="anio"
              type="number"
              min={1900}
              max={2100}
              defaultValue={member?.anio_ingreso_carrera ?? ''}
            />
          </Field>
        </div>
        <Field label="Carrera *">
          <input name="carrera" required defaultValue={member?.carrera} />
        </Field>
        <Field label="Pertenencia al club">
          <select name="estado" defaultValue={member?.estado ?? 'activo'}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </Field>
        <ResourceState {...catalogs} retry={catalogs.reload} />
        <Field label="Nivel de acceso a Rafael">
          <select
            name="accessLevel"
            defaultValue={member?.rafael_access_level ?? ''}
            disabled={!canChangeLevel}
          >
            <option value="">Sin nivel asignado · acceso básico</option>
            <option value="trainee">Trainee</option>
            <option value="miembro">Miembro</option>
            {(isAdministrator ||
              member?.rafael_access_level === 'representante') && (
              <option value="representante">Representante</option>
            )}
          </select>
          <small>
            Define los permisos de Rafael. Solo el jefe del club puede asignar o
            cambiar el nivel Representante.
          </small>
          {!member?.iam_linked && (
            <small>
              Se aplicará cuando la persona ingrese con su cuenta institucional
              verificada.
            </small>
          )}
        </Field>
        {catalogs.data && (
          <div className="rf-form-grid">
            {[
              {
                title: 'Roles del club',
                items: catalogs.data.roles,
                selected: roles,
                set: setRoles,
              },
              {
                title: 'Especialidades',
                items: catalogs.data.specialties,
                selected: specialties,
                set: setSpecialties,
              },
            ].map((group) => (
              <fieldset className="rf-panel" key={group.title}>
                <legend>{group.title}</legend>
                {group.items
                  .filter(
                    (item) =>
                      item.estado === 'activo' ||
                      group.selected.includes(String(item.id)),
                  )
                  .map((item) => (
                    <label className="rf-check" key={item.id}>
                      <input
                        type="checkbox"
                        checked={group.selected.includes(String(item.id))}
                        onChange={(e) =>
                          group.set(
                            e.target.checked
                              ? [...group.selected, String(item.id)]
                              : group.selected.filter(
                                  (id) => id !== String(item.id),
                                ),
                          )
                        }
                      />
                      {item.nombre}
                      {item.estado === 'inactivo' ? ' · Inactivo' : ''}
                    </label>
                  ))}
                {group.items.length === 0 && (
                  <p className="rf-muted">Sin registros en este catálogo.</p>
                )}
              </fieldset>
            ))}
          </div>
        )}
        <Notice>
          Activo significa que sigue perteneciendo al club. Retirar un rol
          conserva su asignación histórica; no modifica permisos IAM.
        </Notice>
        <label className="rf-check">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => {
              setPublished(e.target.checked);
              if (!e.target.checked) setPhoto(false);
            }}
          />
          Mostrar perfil en exdev.cl
        </label>
        <label className="rf-check">
          <input
            type="checkbox"
            checked={photo}
            disabled={!published}
            onChange={(e) => setPhoto(e.target.checked)}
          />
          Permitir foto pública (carga de imágenes pendiente)
        </label>
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
          <button
            className="rf-button rf-primary"
            disabled={mutation.busy || catalogs.loading || !!catalogs.error}
          >
            {mutation.busy
              ? 'Guardando…'
              : member
                ? 'Guardar cambios'
                : 'Crear miembro'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
