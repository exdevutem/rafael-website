'use client';
import { useState, type FormEvent } from 'react';
import { Field, Modal, ResourceState } from '@/shared/components/ui/ui';
import { projectStates } from '@/shared/constants/content';
import { getMembers, saveProject } from '@/shared/services/contentService';
import { useResource } from '@/shared/hooks/useResource';
import { useSave } from '@/shared/hooks/useSave';
import type {
  CreateProject,
  Project,
  ProjectState,
} from '@/shared/types/content';
export default function ProjectForm({
  project,
  onClose,
  onSaved,
}: {
  project?: Project;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const directory = useResource(getMembers),
    mutation = useSave();
  const [published, setPublished] = useState(project?.publicado ?? false),
    [featured, setFeatured] = useState(project?.destacado ?? false);
  const [members, setMembers] = useState<CreateProject['members']>(
    (project?.miembros ?? []).map((m) => ({
      memberId: String(m.id),
      functionName: m.funcion,
      startDate: m.fecha_inicio,
      endDate: m.fecha_fin,
    })),
  );
  const [candidate, setCandidate] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();
    void mutation.save(
      async () => {
        if (
          text('fechaInicio') &&
          text('fechaFin') &&
          text('fechaFin') < text('fechaInicio')
        )
          throw new Error(
            'La fecha de término no puede ser anterior al inicio.',
          );
        if (
          members.some(
            (m) => m.startDate && m.endDate && m.endDate < m.startDate,
          )
        )
          throw new Error('Revisa las fechas de participación del equipo.');
        return saveProject(
          {
            nombre: text('nombre'),
            descripcionBreve: text('descripcionBreve') || null,
            descripcion: text('descripcion') || null,
            estado: text('estado') as ProjectState,
            fechaInicio: text('fechaInicio') || null,
            fechaFin: text('fechaFin') || null,
            publicado: published,
            destacado: published && featured,
            orden: Number(text('orden')),
            members,
          },
          project?.id,
        );
      },
      () =>
        onSaved(
          project
            ? 'Proyecto actualizado correctamente.'
            : 'Proyecto creado correctamente.',
        ),
    );
  }
  return (
    <Modal
      title={project ? 'Editar proyecto' : 'Nuevo proyecto'}
      onClose={() => {
        if (!mutation.busy) onClose();
      }}
    >
      <form className="rf-form" onSubmit={submit}>
        <Field label="Nombre del proyecto *">
          <input
            name="nombre"
            required
            defaultValue={project?.nombre}
            autoFocus
          />
        </Field>
        <Field label="Descripción breve">
          <input
            name="descripcionBreve"
            defaultValue={project?.descripcion_breve ?? ''}
          />
        </Field>
        <Field label="Descripción completa">
          <textarea
            name="descripcion"
            defaultValue={project?.descripcion ?? ''}
          />
        </Field>
        <div className="rf-form-grid">
          <Field label="Estado">
            <select
              name="estado"
              defaultValue={project?.estado ?? 'planificacion'}
            >
              {Object.entries(projectStates).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Orden">
            <input
              name="orden"
              type="number"
              step={1}
              min={-2147483648}
              max={2147483647}
              defaultValue={project?.orden ?? 0}
            />
          </Field>
          <Field label="Fecha de inicio">
            <input
              type="date"
              name="fechaInicio"
              defaultValue={project?.fecha_inicio ?? ''}
            />
          </Field>
          <Field label="Fecha de término">
            <input
              type="date"
              name="fechaFin"
              defaultValue={project?.fecha_fin ?? ''}
            />
          </Field>
        </div>
        <section className="rf-panel">
          <h3>Equipo del proyecto</h3>
          <ResourceState {...directory} retry={directory.reload} />
          {directory.data && (
            <>
              <div className="rf-toolbar">
                <select
                  aria-label="Agregar integrante"
                  value={candidate}
                  onChange={(e) => setCandidate(e.target.value)}
                >
                  <option value="">Selecciona un miembro activo</option>
                  {directory.data
                    .filter(
                      (m) =>
                        m.estado === 'activo' &&
                        !members.some(
                          (p) => String(p.memberId) === String(m.id),
                        ),
                    )
                    .map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.nombre}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="rf-button"
                  disabled={!candidate}
                  onClick={() => {
                    setMembers([
                      ...members,
                      {
                        memberId: candidate,
                        functionName: null,
                        startDate: null,
                        endDate: null,
                      },
                    ]);
                    setCandidate('');
                  }}
                >
                  Agregar
                </button>
              </div>
              {members.map((m, index) => (
                <section className="rf-panel rf-section-gap" key={m.memberId}>
                  <div className="rf-panel-heading">
                    <h3>
                      {directory.data?.find(
                        (person) => String(person.id) === String(m.memberId),
                      )?.nombre ?? `Miembro #${m.memberId}`}
                    </h3>
                    <button
                      className="rf-button"
                      type="button"
                      onClick={() =>
                        setMembers(members.filter((_, i) => i !== index))
                      }
                    >
                      Quitar
                    </button>
                  </div>
                  <Field label="Función en el proyecto">
                    <input
                      value={m.functionName ?? ''}
                      onChange={(e) =>
                        setMembers(
                          members.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  functionName: e.target.value || null,
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <div className="rf-form-grid rf-section-gap">
                    <Field label="Inicio de participación">
                      <input
                        type="date"
                        value={m.startDate ?? ''}
                        onChange={(e) =>
                          setMembers(
                            members.map((item, i) =>
                              i === index
                                ? { ...item, startDate: e.target.value || null }
                                : item,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label="Fin de participación">
                      <input
                        type="date"
                        min={m.startDate ?? undefined}
                        value={m.endDate ?? ''}
                        onChange={(e) =>
                          setMembers(
                            members.map((item, i) =>
                              i === index
                                ? { ...item, endDate: e.target.value || null }
                                : item,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                </section>
              ))}
            </>
          )}
        </section>
        <label className="rf-check">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => {
              setPublished(e.target.checked);
              if (!e.target.checked) setFeatured(false);
            }}
          />
          Publicar proyecto
        </label>
        <label className="rf-check">
          <input
            type="checkbox"
            checked={featured}
            disabled={!published}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Destacar en la portada
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
            disabled={mutation.busy || directory.loading || !!directory.error}
          >
            {mutation.busy
              ? 'Guardando…'
              : project
                ? 'Guardar cambios'
                : 'Crear proyecto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
