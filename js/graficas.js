/**
 * graficas.js — Gráficas en SVG hechas a mano (sin librerías).
 * Una sola serie por gráfica (cobre), así que no necesitan leyenda: el título
 * de la sección dice qué se mide. Cada punto o barra tiene un área táctil
 * con data-tip para ver el valor exacto al tocarla.
 */
import { fechaCorta, kg } from './formato.js';

const ANCHO = 340;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function barra(x, y, ancho, alto, r = 4) {
  if (alto <= 0) return '';
  r = Math.min(r, alto, ancho / 2);
  return `M${x},${y + alto}V${y + r}Q${x},${y} ${x + r},${y}H${x + ancho - r}Q${x + ancho},${y} ${x + ancho},${y + r}V${y + alto}Z`;
}

/** Días entrenados por semana (0 a 5). El tope del eje es siempre 5: la meta del coach. */
export function diasPorSemana(semanas, alto = 150) {
  const arriba = 18;
  const abajo = 22;
  const h = alto - arriba - abajo;
  const banda = ANCHO / semanas.length;
  const grosor = Math.min(22, banda - 14);
  let marcas = '';
  let zonas = '';
  semanas.forEach((s, i) => {
    const centro = banda * i + banda / 2;
    const hb = (s.dias / 5) * h;
    const ultima = i === semanas.length - 1;
    marcas += `<path class="m-serie${ultima ? '' : ' m-tenue'}" d="${barra(centro - grosor / 2, arriba + h - hb, grosor, hb)}"/>`;
    if (s.dias) marcas += `<text class="valor" x="${centro}" y="${arriba + h - hb - 5}" text-anchor="middle">${s.dias}</text>`;
    marcas += `<text class="eje${ultima ? ' eje-fuerte' : ''}" x="${centro}" y="${alto - 5}" text-anchor="middle">${ultima ? 'Esta' : fechaCorta(s.lunes)}</text>`;
    zonas += `<rect class="zona" x="${banda * i}" y="0" width="${banda}" height="${alto}" data-tip="${esc(`Semana del ${fechaCorta(s.lunes)}\nDías entrenados|${s.dias} de 5`)}"/>`;
  });
  const guias = `<line class="guia" x1="0" x2="${ANCHO}" y1="${arriba}" y2="${arriba}"/>
    <text class="eje" x="${ANCHO}" y="${arriba - 5}" text-anchor="end">5 días</text>
    <line class="base" x1="0" x2="${ANCHO}" y1="${arriba + h}" y2="${arriba + h}"/>`;
  return `<svg class="grafica" viewBox="0 0 ${ANCHO} ${alto}" role="img" aria-label="Días entrenados por semana">${guias}${marcas}${zonas}</svg>`;
}

/**
 * Línea de progreso (kilos de la mejor serie, o peso corporal) por fecha.
 * El eje no empieza en cero: lo que importa es ver si sube o baja.
 */
export function linea(puntos, { alto = 170, etiqueta = 'Progreso', detalle = (p) => kg(p.kg) } = {}) {
  if (!puntos.length) return '';
  const arriba = 22;
  const abajo = 22;
  const izq = 8;
  const der = 44; // espacio para la etiqueta del último valor
  const h = alto - arriba - abajo;
  const w = ANCHO - izq - der;
  const valores = puntos.map((p) => p.kg);
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (max - min < 2) { min -= 1; max += 1; }
  const margen = (max - min) * 0.15;
  min -= margen;
  max += margen;
  const x = (i) => izq + (puntos.length === 1 ? w / 2 : (i / (puntos.length - 1)) * w);
  const y = (v) => arriba + h - ((v - min) / (max - min)) * h;
  const trazo = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join('');
  const ultimo = puntos.at(-1);
  const n = puntos.length;
  const zonaAncho = n === 1 ? w : w / (n - 1);
  let marcas = `<path class="l-serie" d="${trazo}"/>`;
  // Solo se marcan con punto el primero y el último (etiquetado selectivo).
  marcas += `<circle class="p-serie" cx="${x(0)}" cy="${y(puntos[0].kg)}" r="4"/>`;
  if (n > 1) marcas += `<circle class="p-serie" cx="${x(n - 1)}" cy="${y(ultimo.kg)}" r="4"/>`;
  marcas += `<text class="valor" x="${x(n - 1) + 9}" y="${y(ultimo.kg) + 4}">${esc(kg(ultimo.kg))}</text>`;
  const ejes = `<text class="eje" x="${x(0)}" y="${alto - 5}" text-anchor="start">${fechaCorta(puntos[0].fecha)}</text>
    ${n > 1 ? `<text class="eje" x="${x(n - 1)}" y="${alto - 5}" text-anchor="end">${fechaCorta(ultimo.fecha)}</text>` : ''}
    <line class="base" x1="0" x2="${ANCHO}" y1="${arriba + h}" y2="${arriba + h}"/>`;
  const zonas = puntos.map((p, i) => `<rect class="zona" x="${Math.max(0, x(i) - zonaAncho / 2)}" y="0" width="${zonaAncho}" height="${alto}" data-tip="${esc(`${fechaCorta(p.fecha)}\n${detalle(p)}`)}"/>`).join('');
  return `<svg class="grafica" viewBox="0 0 ${ANCHO} ${alto}" role="img" aria-label="${esc(etiqueta)}">${ejes}${marcas}${zonas}</svg>`;
}
