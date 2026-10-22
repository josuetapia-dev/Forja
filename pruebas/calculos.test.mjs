/**
 * Pruebas de las cuentas de Forja (sin navegador).
 * Correr con:  node --test "pruebas/*.test.mjs"
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as calc from '../js/calculos.js';
import { DIAS, EJERCICIOS } from '../js/rutina.js';
import { diaSemana, inicioSemana } from '../js/formato.js';

const serie = (kg, reps, hecha = true) => ({ kg, reps, hecha });
const sesion = (id, fecha, dia, series, inicio = 1) => ({ id, fecha, dia, inicio, fin: null, calentamiento: [], series });
const estado = (sesiones) => ({ sesiones, pesos: [], ajustes: {} });
const banca = DIAS[1].ejercicios[0]; // Press de banca con barra, 4 × 8–10

test('la rutina del PDF está completa', () => {
  assert.deepEqual(Object.values(DIAS).map((d) => d.ejercicios.length), [7, 7, 8, 7, 7]);
  for (const d of Object.values(DIAS)) for (const e of d.ejercicios) assert.ok(EJERCICIOS[e.id], `falta ${e.id}`);
  assert.deepEqual([banca.series, banca.min, banca.max], [4, 8, 10]);
});

test('lunes es 1 y la semana empieza en lunes', () => {
  assert.equal(diaSemana('2026-10-19'), 1);
  assert.equal(diaSemana('2026-10-25'), 7);
  assert.equal(inicioSemana('2026-10-22'), '2026-10-19');
});

test('toca subir peso solo si llegaste al máximo en todas las series', () => {
  const todas = { series: [serie(60, 10), serie(60, 10), serie(60, 10), serie(60, 10)] };
  const unaCorta = { series: [serie(60, 10), serie(60, 10), serie(60, 9), serie(60, 10)] };
  const incompleta = { series: [serie(60, 10), serie(60, 10)] };
  assert.equal(calc.tocaSubir(todas, banca), true);
  assert.equal(calc.tocaSubir(unaCorta, banca), false);
  assert.equal(calc.tocaSubir(incompleta, banca), false);
  assert.equal(calc.tocaSubir(null, banca), false);
});

test('la vez pasada ignora la sesión de hoy y las series sin marcar', () => {
  const est = estado([
    sesion('a', '2026-10-12', 1, { 'press-banca-barra': [serie(55, 10), serie(55, 9)] }),
    sesion('b', '2026-10-19', 1, { 'press-banca-barra': [serie(60, 8), serie(60, 8, false)] }),
  ]);
  assert.equal(calc.ultimaVez(est, 'press-banca-barra', 'b').fecha, '2026-10-12');
  assert.equal(calc.ultimaVez(est, 'press-banca-barra').series.length, 1); // la serie sin marcar no cuenta
});

test('prensa del martes y del jueves comparten historial', () => {
  const est = estado([
    sesion('m', '2026-10-20', 2, { prensa: [serie(100, 12)] }),
    sesion('j', '2026-10-22', 4, { prensa: [serie(110, 10)] }),
  ]);
  assert.deepEqual(calc.progresoEjercicio(est, 'prensa').map((p) => p.kg), [100, 110]);
});

test('avance y resumen de la sesión, con récord', () => {
  const anterior = sesion('a', '2026-10-12', 1, { 'press-banca-barra': [serie(60, 10)] });
  const hoy = sesion('b', '2026-10-19', 1, { 'press-banca-barra': [serie(62.5, 8), serie(62.5, 8)], 'pec-deck': [serie(40, 12)] }, 5);
  const est = estado([anterior, hoy]);
  assert.deepEqual(calc.avanceSesion(hoy, 1), { total: 21, hechas: 3 });
  const r = calc.resumenSesion(est, hoy);
  assert.equal(r.volumen, 62.5 * 8 * 2 + 40 * 12);
  assert.deepEqual(r.records, [{ id: 'press-banca-barra', kg: 62.5 }]); // pec deck es la primera vez: no es récord
});

test('días entrenados en la semana', () => {
  const est = estado([
    sesion('a', '2026-10-19', 1, { prensa: [serie(100, 10)] }),
    sesion('b', '2026-10-20', 2, { prensa: [serie(100, 10, false)] }), // sin series hechas
    sesion('c', '2026-10-24', 3, { prensa: [serie(100, 10)] }), // el miércoles recuperado en sábado
  ]);
  assert.deepEqual([...calc.diasEntrenados(est, '2026-10-19')].sort(), [1, 3]);
});

test('cada ejercicio tiene sus dos fotos de técnica', async () => {
  const { existsSync } = await import('node:fs');
  const { fotos } = await import('../js/rutina.js');
  for (const id of Object.keys(EJERCICIOS)) {
    for (const ruta of fotos(id)) assert.ok(existsSync(new URL(`../${ruta}`, import.meta.url)), `falta ${ruta}`);
  }
});
