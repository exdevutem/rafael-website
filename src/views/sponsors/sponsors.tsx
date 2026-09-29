'use client';
import { useState } from 'react';
import {
  Empty,
  PageHeader,
  ResourceState,
  Badge,
} from '@/shared/components/ui/ui';
import { getSponsors } from '@/shared/services/contentService';
import { useResource } from '@/shared/hooks/useResource';
import type { Sponsor } from '@/shared/types/content';
import SponsorForm from './sponsorForm';
export default function Sponsors() {
  const resource = useResource(getSponsors);
  const [form, setForm] = useState<{ sponsor?: Sponsor } | null>(null);
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const entries = (resource.data ?? []).filter((p) =>
    p.nombre_patrocinador
      .toLocaleLowerCase('es')
      .includes(query.toLocaleLowerCase('es')),
  );
  return (
    <>
      <PageHeader
        eyebrow="PATROCINADORES"
        title="Quienes apoyan nuestras ideas"
        description="Administra los apoyos del club y su presencia en exdev.cl."
      >
        <button className="rf-button rf-primary" onClick={() => setForm({})}>
          + Nuevo patrocinador
        </button>
      </PageHeader>
      {success && (
        <div className="rf-success" role="status">
          {success}
        </div>
      )}
      <div className="rf-toolbar">
        <input
          aria-label="Buscar patrocinador"
          value={query}
          placeholder="Buscar por nombre…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data &&
        (entries.length ? (
          <div className="rf-grid">
            {entries.map((p) => (
              <button
                key={p.id}
                className="rf-panel rf-card-button"
                onClick={() => setForm({ sponsor: p })}
              >
                <Badge value={p.estado_patrocinador} />
                <h2>{p.nombre_patrocinador}</h2>
                <p>{p.descripcion_patrocinador || 'Sin descripción.'}</p>
                <div className="rf-card-meta">
                  <span>{p.publicado ? 'Publicado' : 'Interno'}</span>
                  <span>Orden {p.orden} · Editar ↗</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty title="Sin patrocinadores para mostrar">
            Crea un patrocinador o ajusta la búsqueda.
          </Empty>
        ))}
      {form && (
        <SponsorForm
          sponsor={form.sponsor}
          onClose={() => setForm(null)}
          onSaved={() => {
            setSuccess('Patrocinador guardado correctamente.');
            setForm(null);
            resource.reload();
          }}
        />
      )}
    </>
  );
}
