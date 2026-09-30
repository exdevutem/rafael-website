'use client';
import { useSession } from '@/shared/auth/session';
import { useState } from 'react';
import {
  Empty,
  Notice,
  PageHeader,
  ResourceState,
  Badge,
} from '@/shared/components/ui/ui';
import { getRoles, getSpecialties } from '@/shared/services/contentService';
import { useResource } from '@/shared/hooks/useResource';
import type { CatalogItem } from '@/shared/types/content';
import CatalogForm from './catalogForm';
function CatalogPanel({
  kind,
  title,
}: {
  kind: 'roles' | 'specialties';
  title: string;
}) {
  const { can } = useSession();
  const permission =
    kind === 'roles' ? 'club_roles.manage' : 'specialties.manage';
  const resource = useResource(kind === 'roles' ? getRoles : getSpecialties);
  const [form, setForm] = useState<{ item?: CatalogItem } | null>(null);
  const [success, setSuccess] = useState('');
  return (
    <section className="rf-panel">
      <div className="rf-panel-heading">
        <h2>{title}</h2>
        <button
          disabled={!can(permission)}
          className="rf-button"
          onClick={() => setForm({})}
        >
          + {kind === 'roles' ? 'Nuevo' : 'Nueva'}
        </button>
      </div>
      {success && (
        <p className="rf-success" role="status">
          {success}
        </p>
      )}
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data &&
        (resource.data.length ? (
          resource.data.map((item) => (
            <div className="rf-panel rf-section-gap" key={item.id}>
              <div className="rf-panel-heading">
                <h3>{item.nombre}</h3>
                <Badge value={item.estado} />
              </div>
              <p className="rf-muted">
                {item.descripcion || 'Sin descripción.'}
              </p>
              <button className="rf-button" onClick={() => setForm({ item })}>
                Editar {item.nombre}
              </button>
            </div>
          ))
        ) : (
          <Empty title="Sin registros">
            Agrega el primer elemento del catálogo.
          </Empty>
        ))}
      {form && (
        <CatalogForm
          kind={kind}
          item={form.item}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            setSuccess('Catálogo actualizado correctamente.');
            resource.reload();
          }}
        />
      )}
    </section>
  );
}
export default function Settings() {
  return (
    <>
      <PageHeader
        eyebrow="CONFIGURACIÓN"
        title="Catálogos y permisos"
        description="Una base compartida para organizar el club."
      />
      <Notice>
        Los roles describen la relación con ExDev. Los permisos de acceso se
        gestionan en ExDev ID.
      </Notice>
      <div className="rf-two-columns">
        <CatalogPanel kind="roles" title="Roles del club" />
        <CatalogPanel kind="specialties" title="Especialidades" />
      </div>
      <section className="rf-panel rf-section-gap">
        <h2>Permisos de acceso</h2>
        <p>
          Tu sesión y permisos están conectados a ExDev ID. La asignación de
          accesos se realiza mediante el procedimiento administrativo de IAM.
        </p>
      </section>
    </>
  );
}
