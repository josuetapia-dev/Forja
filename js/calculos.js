/**
 * calculos.js — Las cuentas de Forja, sin nada de pantalla.
 * Funciones puras: reciben el estado y devuelven datos. Las usan las vistas
 * y las pruebas de pruebas/calculos.test.mjs.
 */
import { DIAS, EJERCICIOS } from './rutina.js';
import { sumarDias } from './formato.js';

const hechas = (series = []) => series.filter((s) => s?.hecha);

/** Sesiones ordenadas de la más nueva a la más vieja. */
const recientes = (est) =>
  [...est.sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio - a.inicio);

/** Cada vez que hiciste un ejercicio (con al menos una serie hecha), de la más nueva a la más vieja. */
export function historial(est, ejercicioId) {
  return recientes(est)
    .filter((s) => hechas(s.series[ejercicioId]).length)
    .map((s) => ({ sesionId: s.id, fecha: s.fecha, dia: s.dia, series: hechas(s.series[ejercicioId]) }));
}

/** La última vez que hiciste el ejercicio, sin contar la sesión de hoy. */
export const ultimaVez = (est, ejercicioId, excluirSesionId) =>
  historial(est, ejercicioId).find((h) => h.sesionId !== excluirSesionId) ?? null;

/**
 * Regla del coach: si la última vez completaste todas las series con el máximo
 * de repeticiones del rango, toca subir un poco el peso.
 */
export function tocaSubir(ultima, prescripcion) {
  if (!ultima || ultima.series.length < prescripcion.series) return false;
  return ultima.series.slice(0, prescripcion.series).every((s) => (s.reps ?? 0) >= prescripcion.max);
}

/** La serie más pesada (si empatan en kilos, la de más repeticiones). */
export function mejorSerie(series) {
  return series.reduce((mejor, s) => {
    if (s.kg == null) return mejor;
    if (!mejor || s.kg > mejor.kg || (s.kg === mejor.kg && (s.reps ?? 0) > (mejor.reps ?? 0))) return s;
    return mejor;
  }, null);
}

/** Volumen = suma de kilos × repeticiones de las series hechas. */
export const volumen = (series) => hechas(series).reduce((s, x) => s + (x.kg ?? 0) * (x.reps ?? 0), 0);

/** Cuántas series pide el coach ese día y cuántas llevas. */
export function avanceSesion(sesion, dia) {
  const total = DIAS[dia].ejercicios.reduce((s, e) => s + e.series, 0);
  const hechasN = DIAS[dia].ejercicios.reduce((s, e) => s + Math.min(e.series, hechas(sesion?.series[e.id]).length), 0);
  return { total, hechas: hechasN };
}

/**
 * Resumen al terminar: duración, series, volumen y récords
 * (ejercicios donde levantaste más kilos que en cualquier sesión anterior).
 */
export function resumenSesion(est, sesion) {
  const { total, hechas: hechasN } = avanceSesion(sesion, sesion.dia);
  let vol = 0;
  const records = [];
  for (const [id, series] of Object.entries(sesion.series)) {
    vol += volumen(series);
    const hoy = mejorSerie(hechas(series));
    if (!hoy) continue;
    const antes = est.sesiones
      .filter((s) => s.id !== sesion.id && (s.fecha < sesion.fecha || (s.fecha === sesion.fecha && s.inicio < sesion.inicio)))
      .map((s) => mejorSerie(hechas(s.series[id])))
      .filter(Boolean);
    if (antes.length && hoy.kg > Math.max(...antes.map((s) => s.kg))) records.push({ id, kg: hoy.kg });
  }
  const fin = sesion.fin ?? Date.now();
  return { duracion: fin - sesion.inicio, total, hechas: hechasN, volumen: vol, records };
}

/** Qué días de la rutina (1–5) ya entrenaste en la semana que empieza en `lunes`. */
export function diasEntrenados(est, lunes) {
  const domingo = sumarDias(lunes, 6);
  return new Set(est.sesiones
    .filter((s) => s.fecha >= lunes && s.fecha <= domingo && Object.values(s.series).some((x) => hechas(x).length))
    .map((s) => s.dia));
}

/** Días entrenados por semana, las últimas n semanas (la más vieja primero). */
export function semanas(est, lunesActual, n = 8) {
  return Array.from({ length: n }, (_, i) => {
    const lunes = sumarDias(lunesActual, -7 * (n - 1 - i));
    return { lunes, dias: diasEntrenados(est, lunes).size };
  });
}

/** Mejor serie de cada sesión, de la más vieja a la más nueva (para la gráfica del ejercicio). */
export const progresoEjercicio = (est, ejercicioId) =>
  historial(est, ejercicioId)
    .map((h) => ({ fecha: h.fecha, ...mejorSerie(h.series) }))
    .filter((p) => p.kg != null)
    .reverse();

/** Ejercicios que ya tienen historial, con su mejor marca. */
export function ejerciciosConHistorial(est) {
  return Object.keys(EJERCICIOS)
    .map((id) => {
      const progreso = progresoEjercicio(est, id);
      if (!progreso.length) return null;
      const mejor = mejorSerie(progreso);
      return { id, nombre: EJERCICIOS[id].nombre, mejor, ultima: progreso.at(-1), veces: progreso.length, primera: progreso[0] };
    })
    .filter(Boolean)
    .sort((a, b) => b.ultima.fecha.localeCompare(a.ultima.fecha) || a.nombre.localeCompare(b.nombre));
}
