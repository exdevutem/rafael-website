'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import './sidebar.css';
const items = [
  ['/', 'Inicio', '⌂'],
  ['/anuncios/', 'Anuncios del club', '◉'],
  ['/proyectos/', 'Proyectos', '◇'],
  ['/miembros/', 'Miembros', '♧'],
  ['/eventos/', 'Calendario y eventos', '▦'],
  ['/postulaciones/', 'Postulaciones', '▤'],
  ['/patrocinadores/', 'Patrocinadores', '☆'],
  ['/configuracion/', 'Configuración', '⚙'],
];
export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const root = panel.current;
    const opener = trigger.current;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => {
      root?.querySelector<HTMLButtonElement>('button')?.focus();
    });
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Tab') {
        const nodes = root?.querySelectorAll<HTMLElement>('a, button');
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (!root?.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    const media = window.matchMedia('(min-width: 861px)');
    const onResize = () => {
      if (media.matches) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    media.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = old;
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKey);
      media.removeEventListener('change', onResize);
      opener?.focus();
    };
  }, [open]);
  return (
    <>
      <header className="rf-mobile-header">
        <button
          ref={trigger}
          className="rf-icon-button"
          aria-label="Abrir menú"
          aria-controls="rafael-sidebar"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
        <Image src="/exdev-logo.png" alt="" width={27} height={27} />
        <strong>Rafael</strong>
        <span>EXDEV · UTEM</span>
      </header>
      {open && (
        <button
          tabIndex={-1}
          className="rf-nav-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={panel}
        id="rafael-sidebar"
        className={`rafael-sidebar ${open ? 'is-open' : ''}`}
      >
        <div className="rf-brand">
          <Image src="/exdev-logo.png" alt="ExDev" width={36} height={36} />
          <div>
            <strong>Rafael</strong>
            <small>EXDEV · UTEM</small>
          </div>
          <button
            className="rf-nav-close rf-icon-button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <span className="rf-nav-caption">ESPACIO DEL CLUB</span>
        <nav aria-label="Navegación principal">
          {items.map(([href, label, icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={
                (
                  href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(href.slice(0, -1))
                )
                  ? 'page'
                  : undefined
              }
            >
              <span className="rf-nav-icon" aria-hidden="true">
                {icon}
              </span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="rf-sidebar-bottom">
          <a href="https://exdev.cl" target="_blank" rel="noreferrer">
            Visitar exdev.cl <span aria-hidden="true">↗</span>
          </a>
          <Link
            href="/perfil/"
            onClick={() => setOpen(false)}
            className="rf-account"
          >
            <span className="rf-avatar">R</span>
            <span>
              <strong>Espacio interno</strong>
              <small>Mi perfil</small>
            </span>
          </Link>
          <div className="rf-sidebar-foot">Club de Desarrollo Experimental</div>
        </div>
      </aside>
    </>
  );
}
