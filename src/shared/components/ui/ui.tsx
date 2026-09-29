'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { projectStates } from '@/shared/constants/content';
import type { ProjectState } from '@/shared/types/content';

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="rf-page-header">
      <div>
        <div className="rf-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="rf-actions">{children}</div>
    </header>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return <div className="rf-notice">{children}</div>;
}
export function Empty({
  title = 'Sin registros para mostrar',
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rf-empty">
      <span className="rf-empty-mark" aria-hidden="true">
        ◇
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function ResourceState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  if (loading)
    return (
      <div className="rf-loading" role="status">
        <span className="rf-spinner" />
        Cargando información…
      </div>
    );
  if (error)
    return (
      <div className="rf-error" role="alert">
        <h3>No pudimos cargar los datos</h3>
        <p>{error}</p>
        <button className="rf-button" onClick={retry}>
          Reintentar
        </button>
      </div>
    );
  return null;
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`rf-badge rf-status-${value}`}>
      {projectStates[value as ProjectState] ??
        {
          pendiente: 'Pendiente',
          aceptada: 'Aceptada',
          rechazada: 'Rechazada',
          retirada: 'Retirada',
          programado: 'Programado',
          finalizado: 'Finalizado',
        }[value] ??
        value}
    </span>
  );
}
export function ViewToggle({
  value,
  onChange,
}: {
  value: 'cards' | 'table';
  onChange: (value: 'cards' | 'table') => void;
}) {
  return (
    <div className="rf-segment" role="group" aria-label="Presentación">
      <button
        aria-pressed={value === 'cards'}
        onClick={() => onChange('cards')}
      >
        Tarjetas
      </button>
      <button
        aria-pressed={value === 'table'}
        onClick={() => onChange('table')}
      >
        Tabla
      </button>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="rf-modal"
      aria-labelledby="rf-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <span className="rf-eyebrow">RAFAEL · EXDEV</span>
          <h2 id="rf-modal-title">{title}</h2>
        </div>
        <button
          className="rf-icon-button"
          aria-label="Cerrar"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="rf-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function PendingSave({ showButton = true }: { showButton?: boolean }) {
  return (
    <>
      <Notice>
        Podrás guardar cuando la gestión de este módulo esté disponible. Los
        campos que completes aquí no se guardan todavía.
      </Notice>
      {showButton && (
        <button className="rf-button rf-primary" disabled>
          Guardar · próximamente
        </button>
      )}
    </>
  );
}
