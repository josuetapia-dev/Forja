/**
 * formato.js — Fechas, kilos y tiempos en español de México.
 * Las fechas se guardan como texto 'AAAA-MM-DD' en hora local, así una
 * sesión de las 11 de la noche no cambia de día por la zona horaria.
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const DIAS_CORTOS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export function aISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function deISO(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export const hoyISO = () => aISO(new Date());

export function sumarDias(iso, n) {
  const d = deISO(iso);
  d.setDate(d.getDate() + n);
  return aISO(d);
}

export const diffDias = (a, b) => Math.round((deISO(b) - deISO(a)) / 86400000);

/** 1 = lunes … 7 = domingo. */
export const diaSemana = (iso) => ((deISO(iso).getDay() + 6) % 7) + 1;

export const inicioSemana = (iso) => sumarDias(iso, 1 - diaSemana(iso));

const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export function fechaCorta(iso) {
  const d = deISO(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function fechaLarga(iso) {
  const d = deISO(iso);
  return capital(`${DIAS_LARGOS[diaSemana(iso) - 1]} ${d.getDate()} de ${d.toLocaleDateString('es-MX', { month: 'long' })}`);
}

export function etiquetaFecha(iso) {
  const hoy = hoyISO();
  if (iso === hoy) return 'Hoy';
  if (iso === sumarDias(hoy, -1)) return 'Ayer';
  return fechaLarga(iso);
}

/** 62.5 → "62.5 kg", 60 → "60 kg". */
export const kg = (n) => `${Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg`;

/** Segundos → "1:45". */
export const reloj = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

/** Milisegundos → "52 min" o "1 h 05 min". */
export function duracion(ms) {
  const min = Math.max(0, Math.round(ms / 60000));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

/** Texto del teclado ('62.5') → número, o null si está vacío. */
export const aNumero = (t) => {
  const n = parseFloat(String(t).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
