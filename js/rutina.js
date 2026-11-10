/**
 * rutina.js — La rutina del coach (PDF "Rutina Josué — Enfoque en silueta en V").
 *
 * Es fija: viene del PDF tal cual. Cada ejercicio tiene un id; si el mismo
 * ejercicio aparece en dos días (por ejemplo, Prensa el martes y el jueves),
 * comparte el id para que "la vez pasada" y el progreso junten ambos días.
 * Agregados a la rutina del PDF (más brazo y hombro posterior): curl inclinado el
 * miércoles; pájaros con mancuernas y extensión de tríceps sobre la cabeza el viernes.
 * Los ejercicios que ya no están en la rutina (curl predicador, el jalón del
 * viernes de la rutina anterior) se quedan en EJERCICIOS para no perder su historial.
 */

// Compuesto: descanso largo (90–120 s). Aislamiento: descanso corto (45–75 s).
// placas: máquina de poleas con su torre de placas (eliges con el pasador cuántas
// cargar). Ahí la app pregunta cuántas placas pusiste en vez de kilos; desde la
// tarjeta del ejercicio puedes cambiarlo a kg o lb si tu máquina sí marca el peso.
export const EJERCICIOS = {
  'press-banca-barra': { nombre: 'Press de banca con barra', tipo: 'compuesto' },
  'press-inclinado-mancuernas': { nombre: 'Press inclinado con mancuernas', tipo: 'compuesto' },
  'press-inclinado-barra': { nombre: 'Press inclinado con barra', tipo: 'compuesto' },
  'pec-deck': { nombre: 'Pec Deck', tipo: 'aislamiento', placas: true },
  'pajaros-mancuernas': { nombre: 'Pájaros con mancuernas', tipo: 'aislamiento' },
  'press-hombro-mancuernas': { nombre: 'Press de hombro con mancuernas', tipo: 'compuesto' },
  'elevaciones-laterales': { nombre: 'Elevaciones laterales', tipo: 'aislamiento' },
  'triceps-polea': { nombre: 'Tríceps en polea', tipo: 'aislamiento', placas: true },
  'extension-triceps-cabeza': { nombre: 'Extensión de tríceps sobre la cabeza', tipo: 'aislamiento' },
  'sentadilla-libre': { nombre: 'Sentadilla libre', tipo: 'compuesto' },
  prensa: { nombre: 'Prensa', tipo: 'compuesto' },
  'hack-squat': { nombre: 'Hack squat', tipo: 'compuesto' },
  'hip-thrust': { nombre: 'Hip thrust', tipo: 'compuesto' },
  'extension-cuadriceps': { nombre: 'Extensión de cuádriceps', tipo: 'aislamiento', placas: true },
  'femoral-acostado': { nombre: 'Femoral acostado', tipo: 'aislamiento', placas: true },
  abductora: { nombre: 'Abductora', tipo: 'aislamiento', placas: true },
  pantorrillas: { nombre: 'Pantorrillas', tipo: 'aislamiento' },
  'jalon-polea-alta': { nombre: 'Jalón en polea alta', tipo: 'compuesto', placas: true },
  'jalon-polea': { nombre: 'Jalón en polea', tipo: 'compuesto', placas: true },
  'remo-polea': { nombre: 'Remo en polea', tipo: 'compuesto', placas: true }, // miércoles: polea baja
  'remo-mancuerna': { nombre: 'Remo con mancuerna', tipo: 'compuesto' },
  'face-pull': { nombre: 'Face pull en polea', tipo: 'aislamiento', placas: true },
  'curl-barra': { nombre: 'Curl de bíceps con barra', tipo: 'aislamiento' },
  'curl-biceps': { nombre: 'Curl de bíceps', tipo: 'aislamiento' },
  'curl-inclinado': { nombre: 'Curl inclinado con mancuernas', tipo: 'aislamiento' },
  'curl-predicador': { nombre: 'Curl en banco predicador', tipo: 'aislamiento' },
  'curl-martillo': { nombre: 'Curl martillo', tipo: 'aislamiento' },
};

// series × repeticiones mínimas–máximas (si el PDF da un solo número, min = max).
// nota: detalle corto junto a las repeticiones ("por lado", "agarre abierto").
// clave: la nota del coach para ese ejercicio, se ve al abrirlo.
const ej = (id, series, min, max = min, { nota = '', clave = '' } = {}) => ({ id, series, min, max, nota, clave });

/** Índice 1 = lunes … 5 = viernes. */
export const DIAS = {
  1: {
    nombre: 'Lunes', enfoque: 'Hombro prioritario, pecho y tríceps',
    ejercicios: [
      ej('elevaciones-laterales', 4, 12, 15, { nota: 'Polea o mancuerna', clave: 'Empiezas aquí, fresco. Clave para la anchura de frente.' }),
      ej('press-banca-barra', 3, 8, 10, { clave: 'Una serie menos que antes para guardar energía.' }),
      ej('press-inclinado-mancuernas', 3, 10, 12, { clave: 'Enfoque en el pectoral superior.' }),
      ej('pec-deck', 2, 12, 15, { clave: 'Estiramiento y bombeo controlado.' }),
      ej('press-hombro-mancuernas', 3, 8, 10, { clave: 'Codos ligeramente hacia el frente, no totalmente abiertos.' }),
      ej('triceps-polea', 3, 10, 12, { clave: 'Extensión completa sin mover los hombros.' }),
      ej('extension-triceps-cabeza', 2, 12, 15, { clave: 'Enfocado en la cabeza larga del tríceps.' }),
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
    nombre: 'Miércoles', enfoque: 'Espalda ancha, bíceps y hombro',
    ejercicios: [
      ej('jalon-polea-alta', 4, 10, 12, { nota: 'Agarre abierto', clave: 'Abre los codos hacia afuera para ensanchar los dorsales.' }),
      ej('elevaciones-laterales', 4, 12, 15, { nota: 'Con mancuerna', clave: 'Más series para meter frecuencia y volumen al punto débil.' }),
      ej('remo-polea', 3, 10, 12, { nota: 'Polea baja, agarre prono/abierto', clave: 'Tira hacia la boca del estómago, estimulando la espalda alta.' }),
      ej('remo-mancuerna', 2, 10, 10, { nota: 'Por lado', clave: 'Tracción concentrada.' }),
      ej('face-pull', 3, 12, 15, { clave: 'Enfoque en deltoides posterior y salud del hombro.' }),
      ej('curl-barra', 3, 8, 10, { clave: 'Controla la fase excéntrica (la bajada).' }),
      ej('curl-inclinado', 3, 10, 12, { nota: 'Agregado', clave: 'Banco a 45–60°, brazos colgando detrás del cuerpo: estira mucho el bíceps. Sin balancear los hombros.' }),
      ej('curl-martillo', 3, 12, 12, { clave: 'Desarrollo del braquiorradial y grosor del brazo.' }),
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
    nombre: 'Viernes', enfoque: 'Tren superior, enfoque en V',
    ejercicios: [
      ej('elevaciones-laterales', 4, 15, 15, { clave: 'Tercer día de hombro en la semana para obligarlo a crecer.' }),
      ej('jalon-polea-alta', 4, 10, 12, { clave: 'Enfoque total en amplitud.' }),
      ej('press-inclinado-barra', 3, 8, 10, { clave: 'Estímulo potente al pectoral superior.' }),
      ej('remo-polea', 3, 10, 12, { clave: 'Densidad de espalda.' }),
      ej('pec-deck', 2, 12, 15, { clave: 'Aislamiento pectoral.' }),
      ej('pajaros-mancuernas', 3, 12, 15, { nota: 'Agregado', clave: 'Hombro posterior. Sentado en la orilla del banco, inclinado al frente con el pecho cerca de los muslos: abre los brazos hacia los lados con los codos un poco doblados, sin encoger los hombros. Peso ligero.' }),
      ej('curl-biceps', 3, 10, 12, { clave: 'Bombeo final de brazos.' }),
      ej('triceps-polea', 3, 10, 12),
      ej('extension-triceps-cabeza', 2, 12, 15, { nota: 'Agregado', clave: 'Segundo día para la cabeza larga del tríceps, la que más volumen da al brazo.' }),
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
  'Deja 1–2 repeticiones en reserva (RIR 1–2) en las series efectivas; no llegues al fallo en todo.',
  'Descanso: 90–120 s en compuestos y 45–75 s en aislamientos.',
  'Cuando completes el máximo de repeticiones del rango con buena técnica, aumenta ligeramente el peso en la siguiente sesión.',
  'Prioridad: hombros y espalda alta, para una silueta en V.',
  'Cardio: caminar a paso ligero en vez de correr, para cuidar rodillas y tobillos.',
  'Meta diaria: de 8,000 a 10,000 pasos. Puedes dividirlos en caminatas de 15 minutos después de las comidas fuertes.',
]

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
