'use client';
import { useState, type FormEvent } from 'react';
import { useSession } from '@/shared/auth/session';
import { useResource } from '@/shared/hooks/useResource';
import { useSave } from '@/shared/hooks/useSave';
import { request } from '@/shared/services/api';
import { getSpecialties } from '@/shared/services/contentService';
import { Field, PageHeader, ResourceState } from '@/shared/components/ui/ui';
import type { Member } from '@/shared/types/content';
const load = (signal: AbortSignal) =>
  request<{ data: Member }>('/members/me', { signal });
export default function Profile() {
  const resource = useResource(load);
  return (
    <>
      <PageHeader
        eyebrow="MI PERFIL"
        title="Tu espacio en ExDev"
        description="Tu información, especialidades y visibilidad."
      />
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data && (
        <ProfileForm
          key={JSON.stringify(resource.data.data)}
          member={resource.data.data}
        />
      )}
    </>
  );
}
function ProfileForm({ member }: { member: Member }) {
  const { can, logout } = useSession(),
    mutation = useSave();
  const specialties = useResource(getSpecialties);
  const [success, setSuccess] = useState('');
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = {
      nombre: String(d.get('nombre')),
      carrera: String(d.get('carrera')),
      anioIngresoCarrera: d.get('year') ? Number(d.get('year')) : null,
      perfilPublico: d.get('perfil') === 'on',
      fotoPublica: d.get('foto') === 'on',
      specialtyIds: d.getAll('specialty'),
    };
    void mutation.save(
      () =>
        request('/members/me', { method: 'PATCH', body: JSON.stringify(body) }),
      () => setSuccess('Perfil actualizado.'),
    );
  }
  return (
    <section className="rf-panel">
      <form className="rf-form" onSubmit={submit}>
        <Field label="Nombre *">
          <input name="nombre" required defaultValue={member.nombre} />
        </Field>
        <Field label="Carrera *">
          <input name="carrera" required defaultValue={member.carrera} />
        </Field>
        <Field label="Año de ingreso">
          <input
            name="year"
            type="number"
            min={1900}
            max={2100}
            defaultValue={member.anio_ingreso_carrera || ''}
          />
        </Field>
        <p>Correo: {member.correo_institucional || 'Sin informar'}</p>
        <p>
          Roles del club: {member.roles.join(', ') || 'Sin roles asignados'}
        </p>
        <label className="rf-check">
          <input
            name="perfil"
            type="checkbox"
            defaultChecked={member.perfil_publico}
          />
          Mostrar mi perfil en exdev.cl
        </label>
        <label className="rf-check">
          <input
            name="foto"
            type="checkbox"
            defaultChecked={member.foto_publica}
          />
          Autorizar foto pública cuando esté disponible
        </label>
        <ResourceState {...specialties} retry={specialties.reload} />
        <fieldset>
          <legend>Especialidades</legend>
          {specialties.data
            ?.filter(
              (s) =>
                s.estado === 'activo' ||
                member.specialty_ids.map(String).includes(String(s.id)),
            )
            .map((s) => (
              <label className="rf-check" key={s.id}>
                <input
                  type="checkbox"
                  name="specialty"
                  value={s.id}
                  defaultChecked={member.specialty_ids
                    .map(String)
                    .includes(String(s.id))}
                />
                {s.nombre}
                {s.estado === 'inactivo' ? ' (inactiva)' : ''}
              </label>
            ))}
        </fieldset>
        {mutation.error && (
          <p role="alert" className="rf-error">
            {mutation.error}
          </p>
        )}
        {success && (
          <p role="status" className="rf-success">
            {success}
          </p>
        )}
        <button
          className="rf-button rf-primary"
          disabled={
            !can('profile.write_own') ||
            mutation.busy ||
            !specialties.data ||
            specialties.loading
          }
        >
          Guardar perfil
        </button>
      </form>
      <button
        className="rf-button rf-section-gap"
        onClick={() => void logout()}
      >
        Cerrar sesión
      </button>
    </section>
  );
}
