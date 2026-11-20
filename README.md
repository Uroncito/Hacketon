# NFL BIG DATA

## Para qué sirve

Esta página ayuda a los **comentaristas de televisión a analizar los pases de un partido de la NFL**. Convierte los datos de cada jugada en explicaciones sencillas y frases listas para decir al aire, para que el comentarista entienda rápido qué pasó y por qué.

## Para quién es

Para comentaristas y narradores de TV que necesitan datos claros durante o antes de una transmisión, sin tener que leer tablas ni saber términos técnicos. También sirve a cualquier aficionado que quiera entender mejor un partido.

## Qué puedes hacer

- **Ver el calendario de la temporada 2021** por semana, con la hora del Este de EE. UU. (ET) y de Ciudad de México (MX).
- **Abrir un partido** y comparar a los dos equipos: cómo les fue al atacar y qué hizo su defensa. Se ve quién presionó más al quarterback y cuáles fueron las jugadas más largas.
- **Elegir una jugada** y ver:
  - qué pasó, explicado en español;
  - **frases listas para decir al aire**, con un botón para copiarlas;
  - una **repetición animada en la cancha**, con los 22 jugadores y el balón;
  - una comparación con el resto de la liga, para saber si lo que pasó fue normal o poco común.
- **Consultar un glosario** con los términos necesarios (down, sack, blitz, cobertura y otros) o pasar el cursor sobre los textos subrayados.

## Lo que muestran los datos

Cuando presionan al quarterback, el ataque gana en promedio **3.9 yardas por jugada**. Cuando no lo presionan, gana **8.1**. Se calculó con las 8,557 jugadas de pase de las semanas 1 a 8 de 2021.

## Cómo verlo

1. Abre la página y elige una semana en el calendario.
2. Toca un partido de las semanas 1 a 8.
3. Elige una jugada de la lista.

## Datos

Jugadas de pase de las semanas 1 a 8 de 2021 (NFL Big Data Bowl, con datos de Next Gen Stats y Pro Football Focus). Las semanas 9 a 18 solo aparecen en el calendario, porque no tienen jugadas en la base de datos.

## Tecnología

Python con FastAPI y pandas en `backend/`. React, TypeScript, Tailwind CSS y Recharts en `dashboard/`.
