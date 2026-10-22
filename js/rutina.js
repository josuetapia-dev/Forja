/**
 * rutina.js — La rutina que puso el coach (PDF "Rutina Josué — Marcación + Hipertrofia").
 *
 * Es fija: viene del PDF tal cual. Cada ejercicio tiene un id; si el mismo
 * ejercicio aparece en dos días (por ejemplo, Prensa el martes y el jueves),
 * comparte el id para que "la vez pasada" y el progreso junten ambos días.
 * Solo se juntan los que el PDF escribe con el mismo nombre.
 */

// Compuesto: descanso largo (90–120 s). Aislamiento: descanso corto (45–75 s).
export const EJERCICIOS = {
  'press-banca-barra': { nombre: 'Press de banca con barra', tipo: 'compuesto' },
  'press-inclinado-mancuernas': { nombre: 'Press inclinado con mancuernas', tipo: 'compuesto' },
  'press-inclinado-barra': { nombre: 'Press inclinado con barra', tipo: 'compuesto' },
  'pec-deck': { nombre: 'Pec Deck', tipo: 'aislamiento' },
  'press-hombro-mancuernas': { nombre: 'Press de hombro con mancuernas', tipo: 'compuesto' },
  'elevaciones-laterales': { nombre: 'Elevaciones laterales', tipo: 'aislamiento' },
  'triceps-polea': { nombre: 'Tríceps en polea', tipo: 'aislamiento' },
  'extension-triceps-cabeza': { nombre: 'Extensión de tríceps por encima de la cabeza', tipo: 'aislamiento' },
  'sentadilla-libre': { nombre: 'Sentadilla libre', tipo: 'compuesto' },
  prensa: { nombre: 'Prensa', tipo: 'compuesto' },
  'hack-squat': { nombre: 'Hack squat', tipo: 'compuesto' },
  'hip-thrust': { nombre: 'Hip thrust', tipo: 'compuesto' },
  'extension-cuadriceps': { nombre: 'Extensión de cuádriceps', tipo: 'aislamiento' },
  'femoral-acostado': { nombre: 'Femoral acostado', tipo: 'aislamiento' },
  abductora: { nombre: 'Abductora', tipo: 'aislamiento' },
  pantorrillas: { nombre: 'Pantorrillas', tipo: 'aislamiento' },
  'jalon-polea-alta': { nombre: 'Jalón en polea alta', tipo: 'compuesto' },
  'jalon-polea': { nombre: 'Jalón en polea', tipo: 'compuesto' },
  'remo-polea': { nombre: 'Remo en polea', tipo: 'compuesto' },
  'remo-mancuerna': { nombre: 'Remo con mancuerna', tipo: 'compuesto' },
  'face-pull': { nombre: 'Face pull en polea', tipo: 'aislamiento' },
  'curl-barra': { nombre: 'Curl de bíceps con barra', tipo: 'aislamiento' },
  'curl-biceps': { nombre: 'Curl de bíceps', tipo: 'aislamiento' },
  'curl-predicador': { nombre: 'Curl en banco predicador', tipo: 'aislamiento' },
  'curl-martillo': { nombre: 'Curl martillo', tipo: 'aislamiento' },
};

// series × repeticiones mínimas–máximas (si el PDF da un solo número, min = max).
const ej = (id, series, min, max = min, nota = '') => ({ id, series, min, max, nota });

/** Índice 1 = lunes … 5 = viernes. */
export const DIAS = {
  1: {
    nombre: 'Lunes', enfoque: 'Pecho, hombro y tríceps',
    ejercicios: [
      ej('press-banca-barra', 4, 8, 10), ej('press-inclinado-mancuernas', 3, 10, 12), ej('pec-deck', 3, 12, 15),
      ej('press-hombro-mancuernas', 3, 8, 10), ej('elevaciones-laterales', 3, 12, 15), ej('triceps-polea', 3, 10, 12),
      ej('extension-triceps-cabeza', 2, 12, 15),
    ],
  },
  2: {
    nombre: 'Martes', enfoque: 'Pierna completa',
    ejercicios: [
      ej('sentadilla-libre', 4, 8, 10), ej('prensa', 4, 10, 12), ej('hack-squat', 3, 10, 12),
      ej('extension-cuadriceps', 3, 12, 15), ej('femoral-acostado', 3, 10, 12), ej('abductora', 3, 15),
      ej('pantorrillas', 4, 12, 15),
    ],
  },
  3: {
    nombre: 'Miércoles', enfoque: 'Espalda, bíceps y hombro',
    ejercicios: [
      ej('jalon-polea-alta', 4, 8, 12), ej('remo-polea', 3, 10, 12), ej('remo-mancuerna', 3, 10, 10, 'Por lado'),
      ej('face-pull', 3, 12, 15), ej('elevaciones-laterales', 3, 12, 15), ej('curl-barra', 3, 8, 10),
      ej('curl-predicador', 3, 10, 12), ej('curl-martillo', 2, 12),
    ],
  },
  4: {
    nombre: 'Jueves', enfoque: 'Pierna completa',
    ejercicios: [
      ej('hack-squat', 4, 8, 10), ej('prensa', 3, 10, 12), ej('hip-thrust', 3, 10, 12),
      ej('extension-cuadriceps', 3, 12, 15), ej('femoral-acostado', 3, 10, 12), ej('abductora', 3, 15, 20),
      ej('pantorrillas', 4, 12, 15),
    ],
  },
  5: {
    nombre: 'Viernes', enfoque: 'Tren superior completo',
    ejercicios: [
      ej('press-inclinado-barra', 3, 8, 10), ej('jalon-polea', 3, 10, 12), ej('remo-polea', 3, 10, 12),
      ej('pec-deck', 2, 12, 15), ej('elevaciones-laterales', 3, 15), ej('curl-biceps', 3, 10, 12),
      ej('triceps-polea', 3, 10, 12),
    ],
  },
};

export const CALENTAMIENTO = [
  '3 min de movilidad general y caminata suave o step',
  'Movilidad de hombros y brazos: 10–12 repeticiones',
  'Sentadillas sin peso: 10 repeticiones',
  'Puente de glúteo: 12 repeticiones',
  '1 serie ligera del primer ejercicio',
];

export const VUELTA_A_LA_CALMA = 'De 4 a 5 minutos de respiración tranquila y estiramientos suaves de los músculos trabajados, sin rebotes.';

export const REGLAS = [
  'Técnica controlada y buscar progresión de cargas.',
  'En la mayoría de las series deja 1–2 repeticiones en reserva; no hace falta llegar al fallo en todas.',
  'Descanso: 90–120 s en compuestos y 45–75 s en aislamientos.',
  'Cuando completes el máximo de repeticiones con buena técnica, aumenta ligeramente el peso.',
  'Si la técnica se deteriora, mantén el peso o redúcelo.',
  'La marcación depende sobre todo de la alimentación y el porcentaje de grasa; las pesas ayudan a conservar y desarrollar músculo.',
  'Prioriza proteína suficiente, hidratación y sueño.',
  'Cardio opcional: 2–3 sesiones de 15–25 minutos, según recuperación.',
  'Si aparece dolor agudo o una molestia que empeora, detente y valora la causa antes de seguir.',
];

/**
 * Fotos de técnica (inicio y final del movimiento), de free-exercise-db
 * (github.com/yuhonas/free-exercise-db, dominio público). Están en
 * img/ejercicios/<id>-0.jpg y -1.jpg; aquí solo van los que reutilizan
 * las fotos de otro ejercicio.
 */
const FOTO_COMPARTIDA = { 'jalon-polea': 'jalon-polea-alta' };
export const fotos = (id) => {
  const base = `img/ejercicios/${FOTO_COMPARTIDA[id] ?? id}`;
  return [`${base}-0.jpg`, `${base}-1.jpg`];
};

/** "4 × 8–10" o "3 × 15". */
export const repsTexto = (e) => `${e.series} × ${e.min === e.max ? e.min : `${e.min}–${e.max}`}`;
