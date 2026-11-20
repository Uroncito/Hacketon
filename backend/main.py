"""API de la Cabina del comentarista.

Ejecuta: .venv/bin/uvicorn backend.main:app --reload
"""
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from . import analisis, datos


@asynccontextmanager
async def ciclo(_: FastAPI):
    # Prepara en segundo plano las posiciones del tracking para que la primera consulta de un equipo sea rápida.
    threading.Thread(target=analisis.precalentar, daemon=True).start()
    yield


app = FastAPI(title="Cabina del comentarista NFL", lifespan=ciclo)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/games")
def partidos() -> list[dict]:
    return datos.lista_partidos()


@app.get("/api/games/{game_id}/plays")
def jugadas(game_id: int) -> list[dict]:
    resultado = datos.lista_jugadas(game_id)
    if resultado is None:
        raise HTTPException(404, "Partido no encontrado")
    return resultado


@app.get("/api/games/{game_id}/summary")
def resumen(game_id: int) -> dict:
    resultado = datos.resumen_partido(game_id)
    if resultado is None:
        raise HTTPException(404, "Partido no encontrado")
    return resultado


@app.get("/api/plays/{game_id}/{play_id}")
def jugada(game_id: int, play_id: int) -> dict:
    resultado = datos.detalle_jugada(game_id, play_id)
    if resultado is None:
        raise HTTPException(404, "Jugada no encontrada")
    return resultado


@app.get("/api/plays/{game_id}/{play_id}/tracking")
def tracking(game_id: int, play_id: int) -> dict:
    resultado = datos.tracking_jugada(game_id, play_id)
    if resultado is None:
        raise HTTPException(404, "Tracking no encontrado")
    return resultado


@app.get("/api/season")
def temporada() -> dict:
    return analisis.resumen_temporada()
@app.get("/api/teams/{abbr}")
def equipo(abbr: str) -> dict:
    resultado = analisis.perfil_equipo(abbr.upper())
    if resultado is None:
        raise HTTPException(404, "Equipo no encontrado")
    return resultado
@app.get("/api/compare")
def comparar(a: str, b: str) -> dict:
    resultado = analisis.comparar(a.upper(), b.upper())
    if resultado is None:
        raise HTTPException(404, "Equipo no encontrado")
    return resultado
# En producción el servidor sirve el build del dashboard en la misma URL.
_DIST = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if _DIST.exists():
    app.mount("/", StaticFiles(directory=_DIST, html=True), name="web")
