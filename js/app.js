/**
 * app.js — Punto de entrada de Forja.
 *
 * Dibuja las vistas (Hoy, Semana, Progreso), las hojas que suben desde abajo
 * (ejercicio, peso corporal, ajustes) y el cronómetro de descanso.
 * Flujo: tocas algo → datos.js guarda → avisa a sus suscriptores → render().
 */
import * as db from './datos.js';
import * as calc from './calculos.js';
import * as f from './formato.js';
import * as g from './graficas.js';
import { DIAS, EJERCICIOS, CALENTAMIENTO, VUELTA_A_LA_CALMA, REGLAS, repsTexto, fotos } from './rutina.js';
import { icono } from './iconos.js';

// dia: rutina elegida a mano desde Semana (null = la de hoy).
// abierto: ejercicio desplegado (undefined = el primero sin terminar).
const ui = { vista: 'hoy', dia: null, abierto: undefined, calentamiento: undefined };
const $vista = document.getElementById('vista');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const hechasDe = (sesion, id) => (sesion?.series[id] ?? []).filter((s) => s?.hecha).length;

/* =========================================================
   Arranque y navegación
   ========================================================= */

function iniciar() {
  const nombres = { hoy: 'Hoy', semana: 'Semana', progreso: 'Progreso' };
  document.querySelectorAll('[data-tab]').forEach((b) => {
    b.innerHTML = `${icono(b.dataset.tab, 24)}<span>${nombres[b.dataset.tab]}</span>`;
  });
  armarDescanso();
  db.suscribir(render);
  document.addEventListener('click', alTocar);
  document.addEventListener('change', alCambiarCampo);
  document.addEventListener('click', desbloquearAudio, { once: true });
  iniciarDetalleGraficas();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    render();
    pintarDescanso();
  });
  // El tiempo transcurrido de la sesión se actualiza solo, sin redibujar todo.
  setInterval(() => {
    document.querySelectorAll('[data-desde]').forEach((el) => { el.textContent = f.duracion(Date.now() - Number(el.dataset.desde)); });
  }, 15000);
  render();

  navigator.storage?.persist?.();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // Cuando llega una versión nueva y toma el control, se recarga una vez para
    // mostrarla de inmediato (y no hasta la siguiente vez que abras la app).
    const habiaVersion = Boolean(navigator.serviceWorker.controller);
    let recargando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!habiaVersion || recargando) return;
      recargando = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Sin modo sin conexión:', e.message));
  }
}

function irA(vista) {
  ui.vista = vista;
  render();
  window.scrollTo(0, 0);
  $vista.style.animation = 'none';
  void $vista.offsetHeight;
  $vista.style.animation = '';
}

function aplicarTema() {
  const { tema } = db.estado().ajustes;
  if (tema === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = tema;
  const colores = { light: '#f1f2f5', dark: '#0e1117' };
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.content = tema === 'auto' ? colores[m.media.includes('dark') ? 'dark' : 'light'] : colores[tema];
  });
}

function render() {
  aplicarTema();
  document.getElementById('tip').classList.remove('visible');
  const vistas = { hoy: vistaHoy, semana: vistaSemana, progreso: vistaProgreso };
  $vista.innerHTML = vistas[ui.vista]();
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === ui.vista ? 'page' : 'false'));
  const dia = diaActivo();
  const sesion = dia ? db.sesionDe(f.hoyISO(), dia) : null;
  mantenerPantalla(ui.vista === 'hoy' && Boolean(sesion && !sesion.fin));
}

/** La rutina que toca: la elegida en Semana, o la del día (lunes a viernes). */
function diaActivo() {
  const hoy = f.diaSemana(f.hoyISO());
  return ui.dia ?? (hoy <= 5 ? hoy : null);
}

function alTocar(e) {
  const tab = e.target.closest('[data-tab]');
  if (tab) return irA(tab.dataset.tab);
  const el = e.target.closest('[data-accion]');
  if (!el) return;
  const { accion, id } = el.dataset;
  switch (accion) {
    case 'abrir': ui.abierto = ui.abierto === id || (ui.abierto === undefined && el.getAttribute('aria-expanded') === 'true') ? null : id; return render();
    case 'serie': return marcarSerie(el);
    case 'calentamiento': return marcarCalentamiento(Number(el.dataset.i), el.getAttribute('aria-pressed') !== 'true');
    case 'toggle-cal': ui.calentamiento = el.getAttribute('aria-expanded') !== 'true'; return render();
    case 'terminar': return terminar();
    case 'reabrir': db.reabrirSesion(id); return;
    case 'elegir-dia': {
      const dia = Number(el.dataset.dia);
      ui.dia = dia === f.diaSemana(f.hoyISO()) ? null : dia;
      ui.abierto = undefined;
      ui.calentamiento = undefined;
      return irA('hoy');
    }
    case 'volver-hoy': ui.dia = null; ui.abierto = undefined; return render();
    case 'ver-ej': return hojaEjercicio(id);
    case 'tecnica': return hojaTecnica(id);
    case 'peso': return hojaPeso();
    case 'ajustes': return hojaAjustes();
    case 'descanso-mas': return sumarDescanso(15);
    case 'descanso-saltar': return detenerDescanso();
  }
}

/** Kilos y repeticiones se guardan al salir del campo, sin redibujar (no se cierra el teclado). */
function alCambiarCampo(e) {
  const campo = e.target.closest('.campo-serie');
  if (!campo) return;
  const { ej, i, campo: tipo } = campo.dataset;
  const valor = f.aNumero(campo.value);
  db.setSerie(f.hoyISO(), diaActivo(), ej, Number(i), { [tipo]: tipo === 'reps' && valor != null ? Math.round(valor) : valor }, { silencioso: true });
}

/* =========================================================
   Vista: Hoy
   ========================================================= */

function cabecera() {
  return `<header class="barra">
    <div><p class="marca">Forja</p><p class="fecha-hoy">${f.fechaLarga(f.hoyISO())}</p></div>
    <button class="icono-btn" data-accion="ajustes" aria-label="Ajustes">${icono('ajustes')}</button>
  </header>`;
}

function vistaHoy() {
  const hoy = f.hoyISO();
  const dia = diaActivo();
  if (!dia) return cabecera() + vistaDescanso(hoy);
  const rutina = DIAS[dia];
  const sesion = db.sesionDe(hoy, dia);
  const avance = calc.avanceSesion(sesion, dia);
  const diaHoy = f.diaSemana(hoy);
  const otroDia = dia !== diaHoy;
  const abierto = ui.abierto !== undefined
    ? ui.abierto
    : rutina.ejercicios.find((e) => hechasDe(sesion, e.id) < e.series)?.id ?? null;
  const activa = sesion && !sesion.fin;

  return `${cabecera()}
    <section class="heroe">
      <p class="etiqueta">${otroDia ? `Rutina del ${rutina.nombre.toLowerCase()}` : rutina.nombre}</p>
      <h1 class="titulo-dia">${rutina.enfoque}</h1>
      <div class="medidor" role="img" aria-label="${avance.hechas} de ${avance.total} series"><span style="width:${(avance.hechas / avance.total) * 100}%"></span></div>
      <p class="avance-texto"><span>${avance.hechas} de ${avance.total} series</span>
        ${activa ? `<span>${icono('reloj', 15)}<span data-desde="${sesion.inicio}">${f.duracion(Date.now() - sesion.inicio)}</span></span>` : ''}</p>
      ${otroDia ? `<button class="enlace" data-accion="volver-hoy">${diaHoy <= 5 ? `Volver a la rutina del ${DIAS[diaHoy].nombre.toLowerCase()}` : 'Volver a hoy'}</button>` : ''}
    </section>
    ${sesion?.fin ? tarjetaTerminado(sesion) : ''}
    ${bloqueCalentamiento(sesion)}
    <section class="ejercicios">${rutina.ejercicios.map((e, i) => tarjetaEjercicio(e, i, sesion, abierto)).join('')}</section>
    <section class="seccion calma"><h2>Vuelta a la calma</h2><p>${VUELTA_A_LA_CALMA}</p></section>
    ${activa && avance.hechas ? '<button class="btn-primario terminar" data-accion="terminar">Terminar entrenamiento</button>' : ''}
  `;
}

function vistaDescanso(hoy) {
  const hechos = calc.diasEntrenados(db.estado(), f.inicioSemana(hoy));
  const pendientes = [1, 2, 3, 4, 5].filter((d) => !hechos.has(d));
  return `<section class="heroe">
      <p class="etiqueta">${f.DIAS_LARGOS[f.diaSemana(hoy) - 1].replace(/^./, (c) => c.toUpperCase())}</p>
      <h1 class="titulo-dia">Hoy descansas</h1>
      <p class="texto-sub">Tu rutina es de lunes a viernes. Descansar también es parte del entrenamiento.</p>
    </section>
    ${pendientes.length
      ? `<section class="seccion"><div class="seccion-cab"><h2>¿Te faltó un día?</h2></div>
          <p class="texto-sub">Puedes hacerlo hoy.</p>
          <ul class="lista">${pendientes.map((d) => `<li><button class="fila" data-accion="elegir-dia" data-dia="${d}">
            <span class="fila-texto"><strong>${DIAS[d].nombre}</strong><small>${DIAS[d].enfoque}</small></span>${icono('derecha', 18)}</button></li>`).join('')}</ul></section>`
      : '<section class="panel"><p>Entrenaste los 5 días de esta semana.</p></section>'}`;
}

function tarjetaTerminado(sesion) {
  const r = calc.resumenSesion(db.estado(), sesion);
  return `<section class="panel terminado">
    <p class="etiqueta">Entrenamiento terminado</p>
    <div class="trio">
      <div><strong>${f.duracion(r.duracion)}</strong><span>Duración</span></div>
      <div><strong>${r.hechas}/${r.total}</strong><span>Series</span></div>
      <div><strong>${Math.round(r.volumen).toLocaleString('es-MX')} kg</strong><span>Volumen</span></div>
    </div>
    ${r.records.length ? `<ul class="records">${r.records.map((x) => `<li>${icono('trofeo', 16)}Récord en ${EJERCICIOS[x.id].nombre}: ${f.kg(x.kg)}</li>`).join('')}</ul>` : ''}
    <button class="btn-suave" data-accion="reabrir" data-id="${sesion.id}">Seguir editando</button>
  </section>`;
}

function bloqueCalentamiento(sesion) {
  const hechos = sesion?.calentamiento ?? [];
  const n = CALENTAMIENTO.filter((_, i) => hechos[i]).length;
  // Abierto al empezar; se pliega solo cuando ya marcaste series.
  const abierto = ui.calentamiento ?? !Object.values(sesion?.series ?? {}).some((s) => s.some((x) => x?.hecha));
  return `<section class="calentamiento">
    <button class="cal-cab" data-accion="toggle-cal" aria-expanded="${abierto}">
      <span class="ej-texto"><strong>Calentamiento</strong><small>8 minutos</small></span>
      <span class="ej-cuenta">${n}/${CALENTAMIENTO.length}</span>${icono('abajo', 18)}
    </button>
    ${abierto ? `<ul class="cal-lista">${CALENTAMIENTO.map((t, i) => `<li><button data-accion="calentamiento" data-i="${i}" aria-pressed="${Boolean(hechos[i])}">
      <span class="mini-check">${icono('check', 14)}</span><span>${t}</span></button></li>`).join('')}</ul>` : ''}
  </section>`;
}

/** "60 kg × 10, 10, 9" si usaste el mismo peso; si no, cada serie con su peso. */
function textoSeries(series) {
  const pesos = new Set(series.map((s) => s.kg));
  if (pesos.size === 1 && series[0].kg != null) return `${f.kg(series[0].kg)} × ${series.map((s) => s.reps ?? '–').join(', ')}`;
  return series.map((s) => `${s.kg != null ? f.kg(s.kg) : '–'} × ${s.reps ?? '–'}`).join(', ');
}

function tarjetaEjercicio(e, i, sesion, abierto) {
  const info = EJERCICIOS[e.id];
  const n = hechasDe(sesion, e.id);
  const completo = n >= e.series;
  const estaAbierto = abierto === e.id;
  return `<article class="ejercicio${estaAbierto ? ' abierto' : ''}${completo ? ' completo' : ''}">
    <button class="ej-cab" data-accion="abrir" data-id="${e.id}" aria-expanded="${estaAbierto}">
      <span class="ej-num">${completo ? icono('check', 16) : i + 1}</span>
      <span class="ej-texto"><strong>${info.nombre}</strong><small>${repsTexto(e)}${e.nota ? `, ${e.nota.toLowerCase()}` : ''}</small></span>
      <span class="ej-cuenta">${n}/${e.series}</span>
    </button>
    ${estaAbierto ? cuerpoEjercicio(e, info, sesion) : ''}
  </article>`;
}

function cuerpoEjercicio(e, info, sesion) {
  const aj = db.estado().ajustes;
  const series = sesion?.series[e.id] ?? [];
  const ultima = calc.ultimaVez(db.estado(), e.id, sesion?.id);
  const descanso = info.tipo === 'compuesto' ? aj.descansoCompuesto : aj.descansoAislamiento;
  // Sugerencias (en gris): el peso de tu serie anterior de hoy, o el de la vez pasada.
  const filas = Array.from({ length: e.series }, (_, i) => {
    const s = series[i] ?? {};
    const kgSug = series[i - 1]?.kg ?? ultima?.series[i]?.kg ?? ultima?.series.at(-1)?.kg ?? '';
    const repsSug = ultima?.series[i]?.reps ?? series[i - 1]?.reps ?? '';
    return `<div class="serie${s.hecha ? ' hecha' : ''}">
      <span class="serie-num">${i + 1}</span>
      <input class="campo-serie" inputmode="decimal" autocomplete="off" aria-label="Kilos, serie ${i + 1}" data-ej="${e.id}" data-i="${i}" data-campo="kg" value="${s.kg ?? ''}" placeholder="${kgSug}">
      <input class="campo-serie" inputmode="numeric" autocomplete="off" aria-label="Repeticiones, serie ${i + 1}" data-ej="${e.id}" data-i="${i}" data-campo="reps" value="${s.reps ?? ''}" placeholder="${repsSug || (e.min === e.max ? e.min : `${e.min}–${e.max}`)}">
      <button class="check" data-accion="serie" data-ej="${e.id}" data-i="${i}" aria-pressed="${Boolean(s.hecha)}" aria-label="Marcar serie ${i + 1}">${icono('check', 20)}</button>
    </div>`;
  }).join('');
  return `<div class="ej-cuerpo">
    <div class="ej-ref">
      <button class="demo mini" data-accion="tecnica" data-id="${e.id}" aria-label="Ver la técnica de ${info.nombre}">${demo(e.id)}</button>
      <p class="ej-ultima">${ultima ? `La vez pasada (${f.etiquetaFecha(ultima.fecha).toLowerCase()}): <strong>${textoSeries(ultima.series)}</strong>` : 'Primera vez: anota el peso con el que trabajes.'}</p>
    </div>
    ${calc.tocaSubir(ultima, e) ? `<p class="pista">${icono('subir', 16)}<span>La vez pasada llegaste a ${e.max} repeticiones en todas las series. Sube un poco el peso hoy.</span></p>` : ''}
    <div class="series-cab"><span>Serie</span><span>Kg</span><span>Reps</span><span></span></div>
    ${filas}
    <p class="ej-pie">${icono('reloj', 15)}${info.tipo === 'compuesto' ? 'Compuesto' : 'Aislamiento'}: descanso de ${f.reloj(descanso)} al marcar cada serie.</p>
  </div>`;
}

/**
 * "Animación" del ejercicio: dos fotos (inicio y final) encimadas; la de
 * encima aparece y desaparece en bucle con CSS. Pesa casi nada y funciona sin internet.
 */
function demo(id) {
  const [inicio, final] = fotos(id);
  return `<span class="demo-cuadros"><img src="${inicio}" alt="" decoding="async"><img src="${final}" alt="" decoding="async"></span>`;
}

function hojaTecnica(id) {
  const [inicio, final] = fotos(id);
  abrirHoja(`
    <div class="hoja-cab"><span></span><h2>${EJERCICIOS[id].nombre}</h2><button class="texto-btn listo" data-cerrar>Listo</button></div>
    <div class="demo grande" role="img" aria-label="Movimiento de ${EJERCICIOS[id].nombre}">${demo(id)}</div>
    <div class="demo-pasos">
      <figure><img src="${inicio}" alt="Posición inicial"><figcaption>Inicio</figcaption></figure>
      <figure><img src="${final}" alt="Posición final"><figcaption>Final</figcaption></figure>
    </div>
    <p class="ajustes-nota">Fotos de referencia de free-exercise-db (dominio público). La máquina de tu gym puede verse distinta; si tu coach te corrige la técnica, manda lo que él te diga.</p>
  `);
}

function marcarSerie(boton) {
  audio?.resume?.(); // cada toque mantiene "despierto" el audio para el pitido del descanso
  const { ej } = boton.dataset;
  const i = Number(boton.dataset.i);
  const hoy = f.hoyISO();
  const dia = diaActivo();
  const sesion = db.sesionDe(hoy, dia);
  if (sesion?.series[ej]?.[i]?.hecha) {
    ui.abierto = ej;
    db.setSerie(hoy, dia, ej, i, { hecha: false });
    return;
  }
  // Si el campo está vacío se usa la sugerencia: repetir lo de la vez pasada es un solo toque.
  const [campoKg, campoReps] = boton.closest('.serie').querySelectorAll('input');
  const kgValor = f.aNumero(campoKg.value) ?? f.aNumero(campoKg.placeholder);
  const repsValor = f.aNumero(campoReps.value) ?? (campoReps.placeholder.includes('–') ? null : f.aNumero(campoReps.placeholder));
  if (kgValor == null) { campoKg.focus(); return aviso('Escribe los kilos de esta serie'); }
  if (repsValor == null) { campoReps.focus(); return aviso('Escribe cuántas repeticiones hiciste'); }

  const prescripcion = DIAS[dia].ejercicios.find((e) => e.id === ej);
  const terminaEjercicio = hechasDe(sesion, ej) + 1 >= prescripcion.series;
  ui.abierto = terminaEjercicio ? undefined : ej; // al terminar, se abre el siguiente
  const nueva = db.setSerie(hoy, dia, ej, i, { kg: kgValor, reps: Math.round(repsValor), hecha: true });
  const avance = calc.avanceSesion(nueva, dia);
  if (avance.hechas < avance.total) iniciarDescanso(EJERCICIOS[ej].tipo);
  else aviso('Completaste todas las series. Termina el entrenamiento abajo.');
}

function marcarCalentamiento(i, hecho) {
  ui.calentamiento = true;
  db.marcarCalentamiento(f.hoyISO(), diaActivo(), i, hecho);
}

function terminar() {
  const dia = diaActivo();
  const sesion = db.sesionDe(f.hoyISO(), dia);
  if (!sesion) return;
  const { hechas, total } = calc.avanceSesion(sesion, dia);
  if (hechas < total && !confirm(`Te faltan ${total - hechas} series. ¿Terminar de todos modos?`)) return;
  detenerDescanso();
  db.terminarSesion(sesion.id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  aviso('Entrenamiento guardado');
}

/* =========================================================
   Vista: Semana (la rutina completa y las reglas del coach)
   ========================================================= */

function puntosSemana() {
  const hoy = f.hoyISO();
  const hechos = calc.diasEntrenados(db.estado(), f.inicioSemana(hoy));
  const diaHoy = f.diaSemana(hoy);
  return `<div class="puntos-semana" role="img" aria-label="${hechos.size} de 5 días esta semana">
      ${[1, 2, 3, 4, 5].map((d) => `<span class="punto${hechos.has(d) ? ' hecho' : ''}${d === diaHoy ? ' hoy' : ''}">${hechos.has(d) ? icono('check', 14) : f.DIAS_CORTOS[d - 1]}</span>`).join('')}
    </div>
    <p class="texto-sub">${hechos.size} de 5 días esta semana</p>`;
}

function vistaSemana() {
  const hoy = f.hoyISO();
  const hechos = calc.diasEntrenados(db.estado(), f.inicioSemana(hoy));
  const diaHoy = f.diaSemana(hoy);
  const dias = [1, 2, 3, 4, 5].map((d) => {
    const estado = hechos.has(d) ? `${icono('check', 15)}Hecho` : d === diaHoy ? 'Hoy' : '';
    return `<article class="dia-card${d === diaHoy ? ' es-hoy' : ''}">
      <button class="dia-cab" data-accion="elegir-dia" data-dia="${d}">
        <span class="ej-texto"><strong>${DIAS[d].nombre}</strong><small>${DIAS[d].enfoque}</small></span>
        <span class="dia-estado">${estado}</span>${icono('derecha', 18)}
      </button>
      <ul class="dia-lista">${DIAS[d].ejercicios.map((e) => `<li><span>${EJERCICIOS[e.id].nombre}</span><span>${repsTexto(e)}</span></li>`).join('')}</ul>
    </article>`;
  }).join('');
  return `
    <header class="titulo-vista"><h1>Semana</h1></header>
    ${puntosSemana()}
    <section class="dias">${dias}</section>
    <section class="seccion">
      <div class="seccion-cab"><h2>Reglas de tu coach</h2></div>
      <ul class="reglas">${REGLAS.map((r) => `<li>${r}</li>`).join('')}</ul>
    </section>
    <section class="seccion">
      <div class="seccion-cab"><h2>Calentamiento</h2><span class="cab-nota">8 minutos</span></div>
      <ul class="reglas">${CALENTAMIENTO.map((r) => `<li>${r}</li>`).join('')}</ul>
    </section>
    <section class="seccion calma"><h2>Vuelta a la calma</h2><p>${VUELTA_A_LA_CALMA}</p></section>
  `;
}

/* =========================================================
   Vista: Progreso
   ========================================================= */

function vistaProgreso() {
  const est = db.estado();
  const hoy = f.hoyISO();
  const ejercicios = calc.ejerciciosConHistorial(est);
  const ultimoPeso = est.pesos.at(-1);
  const primerPeso = est.pesos[0];

  const seccionPeso = ultimoPeso
    ? `<p class="cifra-media">${f.kg(ultimoPeso.kg)}</p>
       <p class="texto-sub">${est.pesos.length > 1
         ? `${ultimoPeso.kg - primerPeso.kg > 0 ? '+' : ultimoPeso.kg - primerPeso.kg < 0 ? '−' : ''}${f.kg(Math.abs(ultimoPeso.kg - primerPeso.kg))} desde el ${f.fechaCorta(primerPeso.fecha)}`
         : `Registrado ${f.etiquetaFecha(ultimoPeso.fecha).toLowerCase()}`}</p>
       ${est.pesos.length > 1 ? g.linea(est.pesos, { etiqueta: 'Peso corporal' }) : ''}`
    : '<p class="texto-sub">Pésate una vez por semana, a la misma hora. Para marcar, lo que cuenta es la tendencia, no un día.</p>';

  return `
    <header class="titulo-vista"><h1>Progreso</h1></header>
    ${puntosSemana()}

    <section class="seccion">
      <div class="seccion-cab"><h2>Días por semana</h2></div>
      ${est.sesiones.length ? g.diasPorSemana(calc.semanas(est, f.inicioSemana(hoy), 8)) : '<p class="texto-sub">Aquí verás cuántos días entrenas cada semana.</p>'}
    </section>

    <section class="seccion">
      <div class="seccion-cab"><h2>Tu peso</h2><button class="enlace" data-accion="peso">Registrar</button></div>
      ${seccionPeso}
    </section>

    <section class="seccion">
      <div class="seccion-cab"><h2>Ejercicios</h2></div>
      ${ejercicios.length
        ? `<ul class="lista">${ejercicios.map((x) => {
          const cambio = x.veces > 1 ? x.ultima.kg - x.primera.kg : 0;
          return `<li><button class="fila" data-accion="ver-ej" data-id="${x.id}">
            <span class="fila-texto"><strong>${x.nombre}</strong><small>Mejor: ${f.kg(x.mejor.kg)} × ${x.mejor.reps}. Última: ${f.kg(x.ultima.kg)} × ${x.ultima.reps}</small></span>
            ${cambio ? `<span class="cambio">${cambio > 0 ? '+' : '−'}${f.kg(Math.abs(cambio))}</span>` : ''}${icono('derecha', 18)}
          </button></li>`;
        }).join('')}</ul>`
        : '<p class="texto-sub">Cuando marques tus primeras series, aquí verás cómo suben tus pesos.</p>'}
    </section>
  `;
}

/* =========================================================
   Hojas (paneles que suben desde abajo)
   ========================================================= */

let hojaActual = null;

function abrirHoja(html) {
  cerrarHoja(true);
  const velo = document.createElement('div');
  velo.className = 'velo';
  const hoja = document.createElement('section');
  hoja.className = 'hoja';
  hoja.setAttribute('role', 'dialog');
  hoja.setAttribute('aria-modal', 'true');
  hoja.innerHTML = `<div class="hoja-asa" aria-hidden="true"></div>${html}`;
  document.body.append(velo, hoja);
  requestAnimationFrame(() => { velo.classList.add('abierta'); hoja.classList.add('abierta'); });
  velo.addEventListener('click', () => cerrarHoja());
  hoja.addEventListener('click', (e) => { if (e.target.closest('[data-cerrar]')) cerrarHoja(); });
  arrastrarParaCerrar(hoja);
  document.body.style.overflow = 'hidden';
  hojaActual = { velo, hoja };
  return hoja;
}

function cerrarHoja(inmediato = false) {
  if (!hojaActual) return;
  const { velo, hoja } = hojaActual;
  hojaActual = null;
  document.body.style.overflow = '';
  if (inmediato) { velo.remove(); hoja.remove(); return; }
  velo.classList.remove('abierta');
  hoja.classList.remove('abierta');
  setTimeout(() => { velo.remove(); hoja.remove(); }, 400);
}

/** Deslizar hacia abajo desde el asa o la cabecera cierra la hoja, como en iOS. */
function arrastrarParaCerrar(hoja) {
  let inicio = null;
  let dy = 0;
  hoja.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.hoja-asa, .hoja-cab') || e.target.closest('button, input')) return;
    inicio = e.clientY;
    dy = 0;
    hoja.style.transition = 'none';
    hoja.setPointerCapture(e.pointerId);
  });
  hoja.addEventListener('pointermove', (e) => {
    if (inicio === null) return;
    dy = Math.max(0, e.clientY - inicio);
    hoja.style.transform = `translateY(${dy}px)`;
  });
  const soltar = () => {
    if (inicio === null) return;
    inicio = null;
    hoja.style.transition = '';
    if (dy > 110) { hoja.style.transform = 'translateY(100%)'; cerrarHoja(); }
    else hoja.style.transform = '';
  };
  hoja.addEventListener('pointerup', soltar);
  hoja.addEventListener('pointercancel', soltar);
}

/** Teclado numérico propio para el peso corporal. */
function teclado(contenedor, inicial, alCambiar) {
  let texto = inicial || '0';
  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'borrar'];
  contenedor.innerHTML = teclas.map((k) => `<button type="button" class="tecla" data-k="${k}" aria-label="${k === 'borrar' ? 'Borrar' : k === '.' ? 'Punto decimal' : k}">${k === 'borrar' ? icono('borrar', 26) : k}</button>`).join('');
  contenedor.addEventListener('click', (e) => {
    const k = e.target.closest('[data-k]')?.dataset.k;
    if (!k) return;
    const [entero, decimales] = texto.split('.');
    if (k === 'borrar') texto = texto.length > 1 ? texto.slice(0, -1) : '0';
    else if (k === '.') { if (decimales === undefined) texto += '.'; }
    else if (decimales !== undefined) { if (decimales.length < 1) texto += k; }
    else if (entero === '0') texto = k;
    else if (entero.length < 3) texto += k;
    alCambiar(texto);
  });
}

/* ---------- Detalle de un ejercicio ---------- */

function hojaEjercicio(id) {
  const est = db.estado();
  const progreso = calc.progresoEjercicio(est, id);
  const mejor = calc.mejorSerie(progreso);
  const historial = calc.historial(est, id);
  abrirHoja(`
    <div class="hoja-cab"><span></span><h2>${EJERCICIOS[id].nombre}</h2><button class="texto-btn listo" data-cerrar>Listo</button></div>
    <div class="dupla">
      <div><span class="etiqueta">Mejor marca</span><strong class="cifra-media">${f.kg(mejor.kg)}</strong><span class="texto-sub">${mejor.reps} repeticiones, ${f.fechaCorta(mejor.fecha)}</span></div>
      <div><span class="etiqueta">Veces</span><strong class="cifra-media">${historial.length}</strong></div>
    </div>
    ${progreso.length > 1 ? `<p class="etiqueta">Kilos de tu mejor serie</p>${g.linea(progreso, { etiqueta: 'Kilos de la mejor serie', detalle: (p) => `${f.kg(p.kg)} × ${p.reps}` })}` : ''}
    <p class="ajustes-titulo">Historial</p>
    <ul class="historial">${historial.map((h) => `<li><span>${f.etiquetaFecha(h.fecha)}</span><span>${textoSeries(h.series)}</span></li>`).join('')}</ul>
  `);
}

/* ---------- Peso corporal ---------- */

function hojaPeso() {
  const est = db.estado();
  const hoy = f.hoyISO();
  let texto = est.pesos.length ? String(est.pesos.at(-1).kg) : '0';
  const hoja = abrirHoja(`
    <div class="hoja-cab"><button class="texto-btn" data-cerrar>Cancelar</button><h2>Tu peso de hoy</h2><span></span></div>
    <p class="monto-grande" aria-live="polite"></p>
    <div class="teclado"></div>
    <button class="btn-primario guardar">Guardar peso</button>
    ${est.pesos.length ? `<p class="ajustes-titulo">Registros</p><ul class="historial">${[...est.pesos].reverse().slice(0, 8).map((p) => `<li><span>${f.etiquetaFecha(p.fecha)}</span><span>${f.kg(p.kg)}<button class="borrar-peso" data-peso="${p.id}" aria-label="Borrar registro">${icono('basura', 16)}</button></span></li>`).join('')}</ul>` : ''}
  `);
  const $ = (s) => hoja.querySelector(s);
  const pintar = () => {
    const n = f.aNumero(texto) ?? 0;
    $('.monto-grande').textContent = `${texto} kg`;
    $('.monto-grande').classList.toggle('cero', !n);
    $('.guardar').disabled = n < 25 || n > 300;
  };
  teclado($('.teclado'), texto, (v) => { texto = v; pintar(); });
  $('.guardar').addEventListener('click', () => {
    db.registrarPeso(hoy, f.aNumero(texto));
    cerrarHoja();
    aviso('Peso guardado');
  });
  hoja.addEventListener('click', (e) => {
    const b = e.target.closest('[data-peso]');
    if (!b) return;
    db.eliminarPeso(b.dataset.peso);
    b.closest('li').remove();
  });
  pintar();
}

/* ---------- Ajustes ---------- */

function hojaAjustes() {
  const a = db.estado().ajustes;
  const segmento = (nombre, opciones, actual) => `<div class="segmento" role="group">${opciones.map(([v, t]) => `<button data-ajuste="${nombre}" data-valor="${v}" aria-pressed="${String(actual) === String(v)}">${t}</button>`).join('')}</div>`;
  const hoja = abrirHoja(`
    <div class="hoja-cab"><span></span><h2>Ajustes</h2><button class="texto-btn listo" data-cerrar>Listo</button></div>

    <p class="ajustes-titulo">Apariencia</p>
    ${segmento('tema', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']], a.tema)}

    <p class="ajustes-titulo">Descanso en ejercicios compuestos</p>
    ${segmento('descansoCompuesto', [[90, '1:30'], [105, '1:45'], [120, '2:00']], a.descansoCompuesto)}
    <p class="ajustes-titulo">Descanso en aislamientos</p>
    ${segmento('descansoAislamiento', [[45, '0:45'], [60, '1:00'], [75, '1:15']], a.descansoAislamiento)}
    <p class="ajustes-nota">Tu coach pide 90–120 s en compuestos y 45–75 s en aislamientos.</p>
    <div class="ajustes-grupo"><label class="ajuste"><span>Sonar al terminar el descanso</span><input type="checkbox" class="interruptor" name="sonido" ${a.sonido ? 'checked' : ''}></label></div>
    <p class="ajustes-nota">En el iPhone no suena si el interruptor de silencio está activado.</p>

    <p class="ajustes-titulo">Tus datos</p>
    <div class="ajustes-grupo">
      <button class="ajuste exportar"><span>Guardar respaldo</span>${icono('derecha', 18)}</button>
      <label class="ajuste"><span>Restaurar respaldo</span>${icono('derecha', 18)}<input type="file" class="importar" accept="application/json,.json" hidden></label>
    </div>
    <p class="ajustes-nota">Tus datos viven solo en este iPhone. Guarda un respaldo de vez en cuando en Archivos o en iCloud Drive.</p>
    <button class="btn-texto peligro borrar">Borrar todos los datos</button>
    <p class="ajustes-nota centrado">Forja 1.1</p>
  `);
  const $ = (s) => hoja.querySelector(s);
  hoja.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ajuste]');
    if (!b) return;
    const { ajuste, valor } = b.dataset;
    db.setAjuste(ajuste, ajuste === 'tema' ? valor : Number(valor));
    hoja.querySelectorAll(`[data-ajuste="${ajuste}"]`).forEach((x) => x.setAttribute('aria-pressed', x === b));
  });
  $('[name="sonido"]').addEventListener('change', (e) => db.setAjuste('sonido', e.target.checked));
  $('.exportar').addEventListener('click', exportarRespaldo);
  $('.importar').addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    if (!archivo || !confirm('Esto reemplaza tus datos actuales con los del respaldo. ¿Continuar?')) return;
    try {
      db.importar(await archivo.text());
      cerrarHoja();
      aviso('Respaldo restaurado');
    } catch (error) {
      alert(error instanceof SyntaxError ? 'El archivo no es un respaldo de Forja.' : error.message);
    }
  });
  $('.borrar').addEventListener('click', () => {
    if (!confirm('¿Borrar todos tus entrenamientos y registros de peso? Esto no se puede deshacer.')) return;
    db.borrarTodo();
    cerrarHoja();
    aviso('Datos borrados');
  });
}

async function exportarRespaldo() {
  const nombre = `forja-respaldo-${f.hoyISO()}.json`;
  const archivo = new File([db.exportar()], nombre, { type: 'application/json' });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: 'Respaldo de Forja' });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(archivo);
  Object.assign(document.createElement('a'), { href: url, download: nombre }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================
   Cronómetro de descanso, sonido y pantalla encendida
   ========================================================= */

// Se guarda la hora en que termina (no un contador): si sales de la app y
// vuelves, el tiempo sigue siendo correcto.
let descanso = null; // { fin (ms), total (s) }
let intervaloDescanso = null;
let temporizadorListo = null;

function armarDescanso() {
  document.getElementById('descanso').innerHTML = `
    <div class="descanso-info">${icono('reloj', 18)}<span class="descanso-etiqueta">Descanso</span><strong class="descanso-tiempo"></strong></div>
    <div class="descanso-barra"><span></span></div>
    <div class="descanso-botones">
      <button data-accion="descanso-mas">+15 s</button>
      <button data-accion="descanso-saltar">Saltar</button>
    </div>`;
}

function iniciarDescanso(tipo) {
  const aj = db.estado().ajustes;
  const segundos = tipo === 'compuesto' ? aj.descansoCompuesto : aj.descansoAislamiento;
  descanso = { fin: Date.now() + segundos * 1000, total: segundos };
  clearTimeout(temporizadorListo);
  document.getElementById('descanso').classList.remove('listo');
  clearInterval(intervaloDescanso);
  intervaloDescanso = setInterval(pintarDescanso, 250);
  pintarDescanso();
}

function sumarDescanso(segundos) {
  if (!descanso) return;
  descanso.fin += segundos * 1000;
  descanso.total += segundos;
  pintarDescanso();
}

function detenerDescanso() {
  descanso = null;
  clearInterval(intervaloDescanso);
  document.getElementById('descanso').classList.remove('visible', 'listo');
}

function pintarDescanso() {
  const el = document.getElementById('descanso');
  if (!descanso) return;
  const resta = Math.ceil((descanso.fin - Date.now()) / 1000);
  if (resta <= 0) return finDescanso();
  el.classList.add('visible');
  el.querySelector('.descanso-etiqueta').textContent = 'Descanso';
  el.querySelector('.descanso-tiempo').textContent = f.reloj(resta);
  el.querySelector('.descanso-barra span').style.width = `${(resta / descanso.total) * 100}%`;
}

function finDescanso() {
  descanso = null;
  clearInterval(intervaloDescanso);
  const el = document.getElementById('descanso');
  el.classList.add('visible', 'listo');
  el.querySelector('.descanso-etiqueta').textContent = 'Listo, siguiente serie';
  el.querySelector('.descanso-tiempo').textContent = '';
  if (db.estado().ajustes.sonido) pitido();
  temporizadorListo = setTimeout(() => el.classList.remove('visible', 'listo'), 3500);
}

// iOS solo deja sonar audio después de que la persona toca la pantalla.
let audio = null;
function desbloquearAudio() {
  try {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    const silencio = audio.createBuffer(1, 1, 22050);
    const fuente = audio.createBufferSource();
    fuente.buffer = silencio;
    fuente.connect(audio.destination);
    fuente.start();
  } catch {
    audio = null;
  }
}

function pitido() {
  if (!audio) return;
  audio.resume?.();
  const t = audio.currentTime;
  [0, 0.25].forEach((retraso) => {
    const osc = audio.createOscillator();
    const volumen = audio.createGain();
    osc.frequency.value = 880;
    volumen.gain.setValueAtTime(0.0001, t + retraso);
    volumen.gain.exponentialRampToValueAtTime(0.35, t + retraso + 0.02);
    volumen.gain.exponentialRampToValueAtTime(0.0001, t + retraso + 0.2);
    osc.connect(volumen).connect(audio.destination);
    osc.start(t + retraso);
    osc.stop(t + retraso + 0.22);
  });
  navigator.vibrate?.(200);
}

/** Durante el entrenamiento la pantalla no se apaga (Screen Wake Lock, si el iPhone lo permite). */
let bloqueoPantalla = null;
async function mantenerPantalla(activo) {
  try {
    if (activo && !bloqueoPantalla && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      bloqueoPantalla = await navigator.wakeLock.request('screen');
      bloqueoPantalla.addEventListener('release', () => { bloqueoPantalla = null; });
    } else if (!activo && bloqueoPantalla) {
      await bloqueoPantalla.release();
      bloqueoPantalla = null;
    }
  } catch {
    bloqueoPantalla = null;
  }
}

/* =========================================================
   Aviso inferior y detalle de gráficas
   ========================================================= */

let temporizadorAviso;
function aviso(texto) {
  const el = document.getElementById('aviso');
  el.innerHTML = `<span>${esc(texto)}</span>`;
  el.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove('visible'), 3500);
}

function iniciarDetalleGraficas() {
  const tip = document.getElementById('tip');
  let activa = null;
  const ocultar = () => {
    tip.classList.remove('visible');
    activa?.classList.remove('activa');
    activa = null;
  };
  const mostrar = (zona) => {
    if (activa === zona) return;
    activa?.classList.remove('activa');
    activa = zona;
    zona.classList.add('activa');
    const [titulo, ...filas] = zona.dataset.tip.split('\n');
    tip.innerHTML = `<b>${esc(titulo)}</b>${filas.map((fila) => {
      const [nombre, valor] = fila.split('|');
      return valor === undefined ? `<div><span>${esc(nombre)}</span></div>` : `<div><span>${esc(nombre)}</span><span>${esc(valor)}</span></div>`;
    }).join('')}`;
    tip.classList.add('visible');
    const r = zona.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    tip.style.left = `${Math.min(window.innerWidth - t.width - 12, Math.max(12, r.left + r.width / 2 - t.width / 2))}px`;
    tip.style.top = `${Math.max(12, r.top - t.height - 6)}px`;
  };
  document.addEventListener('pointerdown', (e) => {
    const zona = e.target.closest?.('.zona');
    if (zona) mostrar(zona);
    else ocultar();
  });
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const zona = e.target.closest?.('.zona');
    if (zona) mostrar(zona);
    else if (activa) ocultar();
  });
  window.addEventListener('scroll', ocultar, { passive: true });
}

iniciar();
