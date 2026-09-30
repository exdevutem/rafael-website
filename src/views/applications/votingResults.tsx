'use client';
import { useCallback, useState } from 'react';
import { request } from '@/shared/services/api';
import { useResource } from '@/shared/hooks/useResource';
import {
  PageHeader,
  ResourceState,
  Modal,
  Empty,
} from '@/shared/components/ui/ui';
interface Candidate {
  id: string;
  nombre_completo: string;
  estado_postulacion: string;
  nombre_periodo: string;
}
export default function VotingResults() {
  const [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<Candidate | null>(null);
  const load = useCallback(
    (signal: AbortSignal) =>
      request<{ data: Candidate[]; hasMore: boolean }>(
        `/applications/voting-results?offset=${offset}`,
        { signal },
      ),
    [offset],
  );
  const resource = useResource(load);
  return (
    <>
      <PageHeader
        eyebrow="POSTULACIONES"
        title="Resultados de votación"
        description="Votos y comentarios visibles para los miembros del club."
      />
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data?.data.length === 0 && <Empty title="Sin postulaciones" />}
      {resource.data?.data.map((p) => (
        <article className="rf-panel rf-section-gap" key={p.id}>
          <h2>{p.nombre_completo}</h2>
          <p>
            {p.nombre_periodo} · {p.estado_postulacion}
          </p>
          <button className="rf-button" onClick={() => setSelected(p)}>
            Ver votos y comentarios
          </button>
        </article>
      ))}
      <div className="rf-toolbar">
        <button
          disabled={!offset || resource.loading}
          onClick={() => setOffset(offset - 30)}
        >
          Anterior
        </button>
        <button
          disabled={!resource.data?.hasMore || resource.loading}
          onClick={() => setOffset(offset + 30)}
        >
          Siguiente
        </button>
      </div>
      {selected && (
        <Modal
          title={selected.nombre_completo}
          onClose={() => setSelected(null)}
        >
          <Details candidate={selected} />
        </Modal>
      )}
    </>
  );
}
function Details({ candidate }: { candidate: Candidate }) {
  const load = useCallback(
    (signal: AbortSignal) =>
      request<{
        data: {
          id: string;
          nombre: string;
          voto: string;
          comentario: string | null;
        }[];
        a_favor: number;
        en_contra: number;
      }>(`/applications/${candidate.id}/votes`, { signal }),
    [candidate.id],
  );
  const result = useResource(load);
  return (
    <>
      <ResourceState {...result} retry={result.reload} />
      {result.data && (
        <>
          <p>
            A favor: {result.data.a_favor} · En contra: {result.data.en_contra}
          </p>
          {result.data.data.map((v) => (
            <article key={v.id}>
              <h3>
                {v.nombre} · {v.voto === 'a_favor' ? 'A favor' : 'En contra'}
              </h3>
              <p className="rf-prose">{v.comentario || 'Sin comentario'}</p>
            </article>
          ))}
        </>
      )}
    </>
  );
}
