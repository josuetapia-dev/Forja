# Forja

App personal para seguir la rutina del gym en el iPhone: marcas cada serie con su peso y repeticiones,
el cronómetro de descanso arranca solo y ves cómo suben tus pesos semana a semana.
Es una **web app instalable (PWA)**, hermana de [Finax](https://josuetapia-dev.github.io/FINAX/):
se agrega a la pantalla de inicio desde Safari, abre como app, funciona sin internet y
los datos viven **solo en tu iPhone**.

La rutina viene del PDF del coach: *Rutina Josué — Enfoque en silueta en V* (lunes a viernes): hombro tres veces por semana
y espalda alta para ensanchar, pierna dos días y caminar 8,000–10,000 pasos diarios como cardio.

## Qué hace (versión 1.2)

| Pantalla | Qué ves |
|---|---|
| **Hoy** | La rutina del día (lunes: hombro, pecho y tríceps; martes: pierna…), la nota del coach en cada ejercicio, el calentamiento como lista para palomear y cada ejercicio con sus series. El fin de semana te deja recuperar el día que te faltó |
| **Semana** | Los 5 días con todos sus ejercicios, qué días ya entrenaste, las reglas del coach, el calentamiento y la vuelta a la calma. Toca un día para entrenarlo hoy |
| **Progreso** | Días entrenados por semana, tu peso corporal y cada ejercicio con su mejor marca, lo que has subido y su gráfica |
| **Ajustes** | Tema, unidad de peso (kilos o libras), tiempos de descanso, sonido al terminar el descanso, respaldo |

### Cómo se usa en el gym

1. Abre Forja: ya está en la rutina del día y el primer ejercicio abierto.
   La miniatura animada muestra el movimiento; tócala para verlo en grande con la posición inicial y la final.
2. Escribe la carga y las repeticiones de la serie y toca ✓. La carga va en **kg**, **lb** o **placas**:
   en las poleas y máquinas con torre de placas (las que eliges con el pasador) la app pregunta cuántas placas pusiste,
   porque no sabes cuánto pesa cada una. Con el selector **Anotar en** de cada ejercicio lo cambias cuando quieras.
   Las siguientes series ya vienen sugeridas (en gris) con lo mismo: si repites, solo tocas ✓.
3. Arranca el **descanso**: 2:00 en compuestos y 1:00 en aislamientos (ajustable). Puedes sumar 15 s o saltarlo.
   Al terminar suena un pitido.
4. Al completar un ejercicio se abre solo el siguiente.
5. Al final, **Terminar entrenamiento** muestra duración, series, volumen y **récords**.

### Las reglas del coach, dentro de la app

- **La vez pasada**: cada ejercicio muestra lo que hiciste la última vez (por ejemplo "110 kg × 12, 12, 12").
- **Subir peso**: si la última vez llegaste al máximo del rango en todas las series, aparece
  "Sube un poco el peso hoy" (regla de progresión del PDF).
- **Descansos** según el tipo de ejercicio: 90–120 s en compuestos y 45–75 s en aislamientos.
- **Récord**: cuando levantas más kilos (o más placas) que en cualquier sesión anterior de ese ejercicio.
- **Volumen** = suma de kilos × repeticiones de las series hechas (las series en placas no cuentan: no se sabe su peso).
- Mientras entrenas, la pantalla no se apaga (si tu versión de iOS lo permite).

## Probarlo en la computadora

```bash
node servidor.mjs
```

Abre <http://127.0.0.1:5174>. Pruebas de los cálculos:

```bash
node --test "pruebas/*.test.mjs"
```

## Instalarla en tu iPhone

Igual que Finax:

1. En GitHub crea un repositorio llamado `forja`. **Esta vez no marques "Add a README"**: así el primer push no se rechaza.
2. Sube esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "feat: primera versión de Forja"
   git branch -M main
   git remote add origin https://github.com/josuetapia-dev/forja.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**.
4. Abre la dirección que aparece en **Settings → Pages** en **Safari** → **Compartir** → **Agregar a pantalla de inicio**.
5. Abre Forja desde el ícono y pruébala con el modo avión activado.

> Usa siempre Forja desde el ícono: Safari y la app instalada guardan los datos por separado.
> Guarda un respaldo de vez en cuando en **Ajustes → Guardar respaldo**.

### Publicar cambios

Sube el número de `CACHE` en [sw.js](sw.js) (por ejemplo `forja-v3` → `forja-v4`) y haz push.
Al abrir la app, el service worker nuevo baja todo saltándose la caché del navegador y la app se recarga sola
una vez con la versión nueva. Si no tienes señal en ese momento, sigues usando la versión anterior hasta que la haya.

## Estructura

```
index.html            Esqueleto, barra de pestañas y cronómetro de descanso
manifest.webmanifest  Nombre, ícono y colores para instalarla
sw.js                 Service worker: guarda la app para abrirla sin internet
css/app.css           Estilo (claro y oscuro, acento cobre, íconos en grises)
js/rutina.js          La rutina del PDF: días, ejercicios, series, reglas y calentamiento
js/app.js             Vistas, hojas, marcado de series, cronómetro, sonido y pantalla encendida
js/datos.js           Almacén en localStorage (sesiones, peso corporal, ajustes, respaldo)
js/calculos.js        La vez pasada, cuándo subir peso, récords, volumen, días por semana
js/graficas.js        Gráficas en SVG hechas a mano
js/formato.js         Fechas, kilos y tiempos en español
js/iconos.js          Íconos de línea en SVG
img/ejercicios/       Fotos de técnica: <id>-0.jpg (inicio) y <id>-1.jpg (final), 480 px, escala de grises
icons/                Ícono de la app (180, 192 y 512 px)
pruebas/              Pruebas de los cálculos con node:test
servidor.mjs          Servidor local para desarrollo (puerto 5174)
```

## Decisiones

- **Misma base que Finax** (HTML, CSS y JavaScript sin dependencias), para publicar en GitHub Pages sin compilar.
- **Los ejercicios con el mismo nombre comparten historial** entre días (Prensa del martes y del jueves,
  Pec Deck, Elevaciones laterales, Jalón en polea alta, Tríceps en polea, Remo en polea, Hack squat…).
  "Remo en polea baja" (miércoles) y "Remo en polea" (viernes) se juntan como un solo ejercicio.
  "Curl de bíceps con barra" (miércoles) y "Curl de bíceps" (viernes) se llevan aparte.
  Si en realidad son el mismo, se juntan cambiando el id en `js/rutina.js`.
- **Rutina en V (versión 1.2)**: los ejercicios que salieron (curl en banco predicador y el "Jalón en polea" del
  viernes anterior) siguen en `EJERCICIOS` para que su historial se vea en Progreso. El calentamiento y la vuelta
  a la calma se quedaron de la rutina anterior, porque el PDF nuevo no los cambia.
- **El descanso guarda la hora en que termina**, no un contador: si sales a WhatsApp y vuelves, el tiempo es correcto.
- **El pitido usa Web Audio**: en el iPhone no suena con el interruptor de silencio activado.
- **Fotos de técnica** de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (licencia Unlicense,
  dominio público). La "animación" son dos fotos encimadas: la final aparece y desaparece con CSS. Se redujeron a
  480 px y se pasaron a escala de grises (48 fotos, ~1 MB) y el service worker las guarda para usarlas sin internet.
  En modo oscuro se atenúan un poco. Con "Reducir movimiento" activado siguen animándose (solo es un fundido), más lento.
  Versiones elegidas donde el PDF no especifica: extensión de tríceps por encima de la cabeza **con mancuerna**,
  curl de bíceps del viernes **con mancuernas**, pantorrillas **de pie**; los dos jalones usan las mismas fotos
  (Wide-Grip Lat Pulldown). Para cambiar una, reemplaza sus dos fotos en `img/ejercicios/`.
- **Los pesos se guardan siempre en kilos**, con todos sus decimales, y se convierten al mostrarlos: si anotas 25 lb
  vuelve a salir 25 lb, y cambiar la unidad en Ajustes no altera lo que ya anotaste.
- **Placas aparte de los kilos**: una serie guarda `kg` o `placas`. Los récords y la gráfica solo comparan series del
  mismo tipo; si un ejercicio cambió de kilos a placas, el progreso sigue lo de la última vez.
  Por defecto van en placas: Pec Deck, tríceps en polea, extensión de cuádriceps, femoral acostado, abductora,
  jalones, remo en polea y face pull (`placas: true` en `js/rutina.js`).
- **El peso corporal no se pinta como bueno o malo**: para marcar, bajar suele ser la meta, pero depende de ti y de tu coach.

## Ideas para siguientes versiones

1. **Editar la rutina** desde la app cuando el coach la cambie.
2. **Notas por ejercicio** (asiento de la máquina, agarre).
3. **Registro de cardio** (las 2–3 sesiones opcionales del PDF).
4. **Medidas** (cintura, brazo) junto al peso.
5. **Resumen semanal**: días cumplidos, récords y volumen.
