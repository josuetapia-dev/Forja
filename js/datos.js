/**
 * datos.js — Almacén de Forja (sesiones de entrenamiento, peso corporal y ajustes).
 *
 * Todo vive en el iPhone, en localStorage, como un solo JSON. Las vistas leen
 * con estado() y se enteran de los cambios con suscribir() (patrón Observer).
 * Escribir kilos o repeticiones guarda "en silencio" (sin redibujar), para que
 * el teclado no se cierre a la mitad.
 */

const CLAVE = 'forja.v1';

const vacio = () => ({
  version: 1,
  // { id, fecha 'AAAA-MM-DD', dia (1–5), inicio, fin|null, calentamiento: [bool], series: { [ejercicioId]: [{ kg, reps, hecha }] } }
  sesiones: [],
  pesos: [], // { id, fecha, kg } — peso corporal, uno por día
  ajustes: { tema: 'auto', descansoCompuesto: 120, descansoAislamiento: 60, sonido: true },
});

let datos = cargar();
const oyentes = new Set();

function completar(guardado) {
  const base = vacio();
  return { ...base, ...guardado, ajustes: { ...base.ajustes, ...guardado.ajustes } };
}

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    return guardado ? completar(guardado) : vacio();
  } catch {
    return vacio();
  }
}

function guardar({ silencioso = false } = {}) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch (error) {
    console.error('No se pudo guardar en el teléfono', error);
  }
  if (!silencioso) oyentes.forEach((fn) => fn());
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const estado = () => datos;
export function suscribir(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/* ---------- Sesiones ---------- */

export const sesionDe = (fecha, dia) => datos.sesiones.find((s) => s.fecha === fecha && s.dia === dia) ?? null;

/** Devuelve la sesión de ese día; la crea al marcar la primera serie o el calentamiento. */
function asegurarSesion(fecha, dia) {
  let sesion = sesionDe(fecha, dia);
  if (!sesion) {
    sesion = { id: uid(), fecha, dia, inicio: Date.now(), fin: null, calentamiento: [], series: {} };
    datos.sesiones.push(sesion);
  }
  return sesion;
}

/** Cambia una serie (kg, reps o hecha). Con silencioso = true no redibuja la pantalla. */
export function setSerie(fecha, dia, ejercicioId, indice, cambios, { silencioso = false } = {}) {
  const sesion = asegurarSesion(fecha, dia);
  const lista = (sesion.series[ejercicioId] ??= []);
  lista[indice] = { kg: null, reps: null, hecha: false, ...lista[indice], ...cambios };
  // Rellena huecos si se marcó la serie 3 antes que la 2.
  for (let i = 0; i < lista.length; i++) lista[i] ??= { kg: null, reps: null, hecha: false };
  guardar({ silencioso });
  return sesion;
}

export function marcarCalentamiento(fecha, dia, indice, hecho) {
  const sesion = asegurarSesion(fecha, dia);
  sesion.calentamiento[indice] = hecho;
  guardar();
}

export function terminarSesion(id) {
  const sesion = datos.sesiones.find((s) => s.id === id);
  if (sesion) sesion.fin = Date.now();
  guardar();
}

export function reabrirSesion(id) {
  const sesion = datos.sesiones.find((s) => s.id === id);
  if (sesion) sesion.fin = null;
  guardar();
}

export function eliminarSesion(id) {
  datos.sesiones = datos.sesiones.filter((s) => s.id !== id);
  guardar();
}

/* ---------- Peso corporal ---------- */

/** Un registro por día: si ya pesaste hoy, se reemplaza. */
export function registrarPeso(fecha, kg) {
  datos.pesos = datos.pesos.filter((p) => p.fecha !== fecha);
  datos.pesos.push({ id: uid(), fecha, kg });
  datos.pesos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  guardar();
}

export function eliminarPeso(id) {
  datos.pesos = datos.pesos.filter((p) => p.id !== id);
  guardar();
}

/* ---------- Ajustes y respaldo ---------- */

export function setAjuste(clave, valor) {
  datos.ajustes[clave] = valor;
  guardar();
}

export const exportar = () => JSON.stringify(datos, null, 2);

export function importar(texto) {
  const entrada = JSON.parse(texto);
  if (!entrada || !Array.isArray(entrada.sesiones)) throw new Error('El archivo no es un respaldo de Forja.');
  datos = completar(entrada);
  guardar();
}

export function borrarTodo() {
  datos = vacio();
  guardar();
}
