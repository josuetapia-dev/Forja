/**
 * iconos.js — Íconos de línea propios (SVG en texto), en escala de grises:
 * heredan el color del texto con currentColor. No dependen de internet.
 */
const TRAZOS = {
  hoy: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  semana: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  progreso: '<path d="M4 19.5h16"/><path d="M4.5 15l4.5-4.5 4 3 6.5-6.5"/><path d="M15 7h4.5v4.5"/>',
  ajustes: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  izquierda: '<path d="M15 5l-7 7 7 7"/>',
  derecha: '<path d="M9 5l7 7-7 7"/>',
  abajo: '<path d="M5 9l7 7 7-7"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  reloj: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.5 2M9.5 2.5h5"/>',
  trofeo: '<path d="M8 4h8v5.5a4 4 0 0 1-8 0z"/><path d="M8 6.5H5.5a2.5 2.5 0 0 0 2.6 3.5M16 6.5h2.5a2.5 2.5 0 0 1-2.6 3.5M12 13.5V17M8.5 20.5h7M10 17h4"/>',
  subir: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  basura: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  bascula: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 10a5 5 0 0 1 7 0M12 10l1.4-1.8"/>',
  borrar: '<path d="M9 5h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
};

export function icono(nombre, tam = 22) {
  return `<svg class="ico" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAZOS[nombre] ?? ''}</svg>`;
}
