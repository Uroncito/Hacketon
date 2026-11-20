"""Capa de datos: carga los CSV al arrancar y calcula métricas para el comentarista.

Los CSV pequeños (partidos, jugadas, jugadores, PFF) se leen una vez. El tracking
(~800 MB) se lee bajo demanda, un partido a la vez, y solo unas pocas columnas.
"""
from __future__ import annotations

import math
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

from . import lenguaje as L

RAIZ = Path(__file__).resolve().parent.parent
DATA = RAIZ / "data" / "nfl-big-data-bowl-regional-event-data-main" / "data"

# ---------------------------------------------------------------- utilidades


def limpio(v):
    """Convierte tipos de numpy/pandas a tipos JSON (NaN -> None)."""
    if v is None:
        return None
    if isinstance(v, (np.bool_, bool)):
        return bool(v)
    if isinstance(v, (np.integer, int)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        return None if math.isnan(v) else float(v)
    if isinstance(v, str):
        return v
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    return v


def _reloj_a_segundos(texto: str) -> int:
    try:
        m, s = str(texto).split(":")
        return int(m) * 60 + int(s)
    except ValueError:
        return 0


def _cubo_distancia(yardas: int) -> str:
    if yardas <= 0:
        return "especial"
    if yardas <= 3:
        return "1-3"
    if yardas <= 6:
        return "4-6"
    if yardas <= 10:
        return "7-10"
    return "11+"


# ---------------------------------------------------------------- carga

games = pd.read_csv(DATA / "games.csv")
players = pd.read_csv(DATA / "players.csv")
plays = pd.read_csv(DATA / "plays.csv")
pff = pd.read_csv(DATA / "pffScoutingData.csv")

NOMBRES: dict[int, str] = dict(zip(players.nflId, players.displayName))
POSICIONES: dict[int, str] = dict(zip(players.nflId, players.officialPosition))

for _c in ("pff_hit", "pff_hurry", "pff_sack", "pff_hitAllowed", "pff_hurryAllowed",
           "pff_sackAllowed", "pff_beatenByDefender"):
    pff[_c] = pff[_c].fillna(0)

pff["presion"] = pff[["pff_hit", "pff_hurry", "pff_sack"]].max(axis=1)
_pres = pff.groupby(["gameId", "playId"]).presion.max().rename("hay_presion")
_rush = (pff[pff.pff_role == "Pass Rush"].groupby(["gameId", "playId"]).size().rename("rushers"))

plays = plays.merge(_pres, on=["gameId", "playId"], how="left").merge(
    _rush, on=["gameId", "playId"], how="left")
plays["rushers"] = plays["rushers"].fillna(0).astype(int)
plays["hay_presion"] = ((plays["hay_presion"].fillna(0) == 1) | (plays.passResult == "S"))
plays["segundos"] = plays.gameClock.map(_reloj_a_segundos)
plays["cubo"] = plays.yardsToGo.map(_cubo_distancia)
plays["penalizacion"] = plays.foulName1.notna()
plays["explosiva"] = plays.prePenaltyPlayResult >= 20
plays["anulada"] = plays.playDescription.str.contains("No Play", na=False)
plays["pff_passCoverage"] = plays.pff_passCoverage.fillna("Miscellaneous")

_plays_idx = plays.set_index(["gameId", "playId"], drop=False).sort_index()
_pff_idx = pff.set_index(["gameId", "playId"]).sort_index()
_games_idx = games.set_index("gameId")

# ---------------------------------------------------------------- textos en español

COBERTURAS: dict[str, tuple[str, str]] = {
    "Cover-0": ("Cover 0", "hombre a hombre sin safety profundo, normalmente con blitz"),
    "Cover-1": ("Cover 1", "hombre a hombre con un solo safety profundo"),
    "Cover-2": ("Cover 2", "dos safeties profundos y zona por debajo"),
    "2-Man": ("2-Man", "dos safeties profundos y hombre a hombre por debajo"),
    "Cover-3": ("Cover 3", "tres defensores profundos y cuatro por debajo, en zona"),
    "Quarters": ("Quarters", "cuatro defensores profundos y tres por debajo"),
    "Cover-6": ("Cover 6", "Quarters de un lado de la cancha y Cover 2 del otro"),
    "Bracket": ("Bracket", "doble cobertura sobre un receptor"),
    "Goal Line": ("Línea de gol", "defensa de línea de gol"),
    "Red Zone": ("Zona roja", "esquema propio de la zona roja"),
    "Prevent": ("Prevent", "defensa para evitar jugadas largas"),
    "Miscellaneous": ("Cobertura mixta", "esquema que no encaja en las categorías habituales"),
}

def nombre_cobertura(clave: str) -> str:
    return COBERTURAS.get(clave, (clave, ""))[0]


def _equipo_nombre(nid) -> str:
    nid = limpio(nid)
    if nid is None:
        return "jugador no identificado"
    return NOMBRES.get(int(nid), f"jugador {int(nid)}")


# ---------------------------------------------------------------- referencias (benchmarks)


def _metricas(df: pd.DataFrame) -> dict:
    n = len(df)
    if n == 0:
        return {"n": 0}
    intentos = df.passResult.isin(["C", "I", "IN"]).sum()
    validas = df[df.yardsToGo > 0]
    return {
        "n": int(n),
        "completos_pct": round(100 * (df.passResult == "C").sum() / intentos, 1) if intentos else None,
        "yardas_media": round(float(df.prePenaltyPlayResult.mean()), 1),
        "sack_pct": round(100 * float((df.passResult == "S").mean()), 1),
        "presion_pct": round(100 * float(df.hay_presion.mean()), 1),
        "intercepcion_pct": round(100 * float((df.passResult == "IN").mean()), 1),
        "explosivas_pct": round(100 * float(df.explosiva.mean()), 1),
        "primer_down_pct": round(100 * float((validas.prePenaltyPlayResult >= validas.yardsToGo).mean()), 1)
        if len(validas) else None,
        "blitz_pct": round(100 * float((df.rushers >= 5).mean()), 1),
    }


def referencias(down: int, cubo: str, cobertura: str) -> dict:
    """Métricas de la liga (semanas 1-8) para situaciones comparables a la jugada."""
    sit = plays[(plays.down == down) & (plays.cubo == cubo)]
    cob = plays[plays.pff_passCoverage == cobertura]
    comb = sit[sit.pff_passCoverage == cobertura]
    return {
        "general": _metricas(plays),
        "situacion": _metricas(sit),
        "cobertura": _metricas(cob),
        "combinada": _metricas(comb) if len(comb) >= 25 else {"n": len(comb)},
    }


# ---------------------------------------------------------------- partidos


def lista_partidos() -> list[dict]:
    conteo = plays.groupby("gameId").size()
    salida = []
    for r in games.sort_values(["week", "gameDate", "gameTimeEastern"]).itertuples():
        salida.append({
            "gameId": int(r.gameId), "semana": int(r.week), "fecha": r.gameDate,
            "hora": r.gameTimeEastern, "local": r.homeTeamAbbr, "visitante": r.visitorTeamAbbr,
            "jugadas": int(conteo.get(r.gameId, 0)),
        })
    return salida


def lista_jugadas(game_id: int) -> list[dict] | None:
    if game_id not in _games_idx.index:
        return None
    df = plays[plays.gameId == game_id].sort_values(["quarter", "segundos", "playId"],
                                                    ascending=[True, False, True])
    # pasador de cada jugada
    qbs = pff[(pff.gameId == game_id) & (pff.pff_role == "Pass")].set_index("playId").nflId
    salida = []
    for r in df.itertuples():
        qb = qbs.get(r.playId)
        salida.append({
            "playId": int(r.playId), "cuarto": int(r.quarter), "reloj": r.gameClock,
            "down": int(r.down), "distancia": int(r.yardsToGo), "ofensiva": r.possessionTeam,
            "defensa": r.defensiveTeam, "resultado": limpio(r.passResult),
            "yardas": int(r.prePenaltyPlayResult), "presion": bool(r.hay_presion),
            "explosiva": bool(r.explosiva), "penalizacion": bool(r.penalizacion),
            "anulada": bool(r.anulada), "cobertura": r.pff_passCoverage,
            "qb": _equipo_nombre(qb) if qb is not None else None,
        })
    return salida


def resumen_partido(game_id: int) -> dict | None:
    if game_id not in _games_idx.index:
        return None
    g = _games_idx.loc[game_id]
    pj = plays[plays.gameId == game_id]
    equipos = []
    for equipo in (g.visitorTeamAbbr, g.homeTeamAbbr):
        of = pj[pj.possessionTeam == equipo]
        de = pj[pj.defensiveTeam == equipo]
        cob = de.pff_passCoverage.value_counts()
        cob_top = None
        if len(cob):
            cob_top = {"cobertura": nombre_cobertura(cob.index[0]),
                       "pct": round(100 * cob.iloc[0] / len(de), 1)}
        equipos.append({
            "equipo": equipo,
            "ofensiva": {**_metricas(of),
                         "play_action_pct": round(100 * float(of.pff_playAction.mean()), 1) if len(of) else None},
            "defensa": {
                **_metricas(de),
                "cobertura_top": cob_top,
                "hombre_pct": round(100 * float((de.pff_passCoverageType == "Man").mean()), 1) if len(de) else None,
            },
        })

    # presionadores del partido
    rushers = pff[(pff.gameId == game_id) & (pff.pff_role == "Pass Rush")].merge(
        pj[["playId", "defensiveTeam"]], on="playId")
    top = (rushers.groupby(["nflId", "defensiveTeam"])[["pff_sack", "pff_hurry", "pff_hit"]].sum()
           .assign(total=lambda d: d.sum(axis=1)).reset_index().sort_values(
               ["total", "pff_sack"], ascending=False).head(5))
    presionadores = [{
        "nombre": _equipo_nombre(r.nflId), "equipo": r.defensiveTeam,
        "posicion": POSICIONES.get(int(r.nflId), ""), "sacks": int(r.pff_sack),
        "hurries": int(r.pff_hurry), "hits": int(r.pff_hit), "total": int(r.total),
    } for r in top.itertuples() if r.total > 0]

    # jugadas más largas
    largas = pj.sort_values("prePenaltyPlayResult", ascending=False).head(3)
    destacadas = [{"playId": int(r.playId), "cuarto": int(r.quarter), "reloj": _reloj(r.gameClock),
                   "yardas": int(r.prePenaltyPlayResult), "ofensiva": r.possessionTeam,
                   "descripcion": _narracion(r, _pff_idx.loc[(game_id, int(r.playId))].reset_index(drop=True))}
                  for r in largas.itertuples()]
    return {
        "gameId": game_id, "semana": int(g.week), "fecha": g.gameDate, "local": g.homeTeamAbbr,
        "visitante": g.visitorTeamAbbr, "jugadas": int(len(pj)), "equipos": equipos,
        "presionadores": presionadores, "destacadas": destacadas,
    }


# ---------------------------------------------------------------- detalle de jugada


def _marcador(r, g) -> dict:
    return {"local": g.homeTeamAbbr, "visitante": g.visitorTeamAbbr,
            "puntos_local": int(r.preSnapHomeScore), "puntos_visitante": int(r.preSnapVisitorScore)}


def _lugar(r) -> str:
    num = int(r.yardlineNumber)
    lado = limpio(r.yardlineSide)
    if lado is None or num == 50:
        return "en media cancha (yarda 50)"
    if lado == r.possessionTeam:
        return f"en su propia yarda {num}"
    return f"en la yarda {num} {L.de_los(lado)}"


_CUBOS = {"1-3": "1 a 3 yardas por ganar", "4-6": "4 a 6 yardas por ganar",
          "7-10": "7 a 10 yardas por ganar", "11+": "11 o más yardas por ganar"}


def _etiqueta_situacion(down: int, cubo: str) -> str:
    if down <= 0 or cubo not in _CUBOS:
        return "jugada especial"
    return f"{L.INTENTOS[down]} intento, {_CUBOS[cubo]}"


def _reloj(texto: str) -> str:
    try:
        m, s = str(texto).split(":")
        return f"{int(m)}:{s}"
    except ValueError:
        return str(texto)


def _nombres_de_jugada(pf: pd.DataFrame) -> L.Nombres:
    return L.Nombres([NOMBRES.get(int(i), "") for i in pf.nflId.tolist() if int(i) in NOMBRES])


def _narracion(r, pf: pd.DataFrame) -> str:
    """Qué pasó en la jugada, explicado en español a partir del texto original en inglés."""
    qb = pf[pf.pff_role == "Pass"]
    qb_nombre = NOMBRES.get(int(qb.nflId.iloc[0]), "") if len(qb) else ""
    texto = L.narrar(r.playDescription, r.passResult, int(r.prePenaltyPlayResult), _nombres_de_jugada(pf), qb_nombre)
    return texto or L.respaldo(r.passResult, int(r.prePenaltyPlayResult), r.possessionTeam, qb_nombre)


def detalle_jugada(game_id: int, play_id: int) -> dict | None:
    try:
        r = _plays_idx.loc[(game_id, play_id)]
    except KeyError:
        return None
    if isinstance(r, pd.DataFrame):
        r = r.iloc[0]
    g = _games_idx.loc[game_id]
    pf = _pff_idx.loc[(game_id, play_id)].reset_index(drop=True)
    pf["nombre"] = pf.nflId.map(lambda i: NOMBRES.get(int(i), f"jugador {int(i)}"))

    qb = pf[pf.pff_role == "Pass"]
    qb_nombre = qb.nombre.iloc[0] if len(qb) else None
    rushers = pf[pf.pff_role == "Pass Rush"]
    sackers = rushers[rushers.pff_sack == 1].nombre.tolist()
    presionaron = list(dict.fromkeys(
        rushers[(rushers.pff_hurry == 1) | (rushers.pff_hit == 1)].nombre.tolist()))
    culpables = list(dict.fromkeys(
        pf[(pf.pff_role == "Pass Block") & ((pf.pff_sackAllowed == 1) | (pf.pff_hitAllowed == 1) | (pf.pff_hurryAllowed == 1))].nombre.tolist()))

    down, ytg = int(r.down), int(r.yardsToGo)
    cob_clave = r.pff_passCoverage
    refs = referencias(down, r.cubo, cob_clave)
    marc = _marcador(r, g)
    pts_of = marc["puntos_local"] if r.possessionTeam == g.homeTeamAbbr else marc["puntos_visitante"]
    pts_de = marc["puntos_visitante"] if r.possessionTeam == g.homeTeamAbbr else marc["puntos_local"]
    ofensiva, defensa = r.possessionTeam, r.defensiveTeam
    los_of, los_de = L.cap(L.los(ofensiva)), L.cap(L.los(defensa))
    dos_puntos = str(r.playDescription).startswith("TWO-POINT")
    narracion = _narracion(r, pf)
    nom, explicacion = L.cobertura(cob_clave)
    etiqueta = _etiqueta_situacion(down, r.cubo)

    puntos: list[dict] = []

    # La situación
    if dos_puntos:
        intento = "Es un intento de conversión de dos puntos: si lo logran, suman 2 puntos extra."
    elif down > 0 and ytg > 0:
        intento = f"Es el {L.INTENTOS[down]} intento y faltan {L.yardas_texto(ytg)} para el primer down."
    else:
        intento = "Es una jugada especial."
    if pts_of == pts_de:
        marcador = f"Van empatados {pts_of} a {pts_de}."
    elif pts_of > pts_de:
        marcador = f"El marcador va {pts_of} a {pts_de} a favor de {L.los(ofensiva)}."
    else:
        marcador = f"El marcador va {pts_de} a {pts_of} a favor de {L.los(defensa)}."
    puntos.append({"tipo": "La situación", "texto":
        f"{intento} El balón está {_lugar(r)}, en el {L.CUARTOS[int(r.quarter)]} (quedan {_reloj(r.gameClock)} en el reloj). {marcador}"})

    # El ataque
    pers = L.personal(r.personnelO, False)
    ataque = []
    if pers:
        ataque.append(f"{los_of} {L.verbo(ofensiva, 'salen', 'sale')} con {pers}.")
    form = L.cap(L.formacion(r.offenseFormation, qb_nombre or ""))
    if r.pff_playAction == 1:
        form += " y, antes de lanzar, finge una entrega para engañar a la defensa (play action)"
    ataque.append(form + ".")
    puntos.append({"tipo": "El ataque", "texto": " ".join(ataque)})

    # La defensa
    caja = limpio(r.defendersInBox)
    defensa_txt = f"{los_de} {L.verbo(defensa, 'defienden', 'defiende')} con {nom}: {explicacion}."
    pers_d = L.personal(r.personnelD, True)
    if pers_d:
        defensa_txt += f" En el campo tienen {pers_d}"
        if caja is not None:
            c = int(caja)
            defensa_txt += f", y {L.num(c)} {'defensor está' if c == 1 else 'defensores están'} pegados a la línea de golpeo"
        defensa_txt += "."
    puntos.append({"tipo": "La defensa", "texto": defensa_txt})

    # Presión al quarterback
    nr = int(r.rushers)
    suj_qb = qb_nombre or "El quarterback"
    presion = []
    if nr >= 5:
        presion.append(f"{los_de} {L.verbo(defensa, 'mandaron', 'mandó')} a {L.num(nr)} defensores por el quarterback, más de los habituales (blitz).")
    elif nr == 4:
        presion.append(f"{los_de} {L.verbo(defensa, 'mandaron', 'mandó')} a cuatro defensores por el quarterback, lo normal.")
    elif nr > 0:
        presion.append(f"{los_de} {L.verbo(defensa, 'mandaron', 'mandó')} solo a {L.num(nr)} defensores por el quarterback, para tener más gente cuidando a los receptores.")
    if sackers:
        presion.append(f"{L.unir(sackers)} {'derribó' if len(sackers) == 1 else 'derribaron'} al quarterback antes de que lanzara.")
    elif r.hay_presion:
        presion.append(f"El quarterback fue presionado por {L.unir(presionaron)}." if presionaron else "El quarterback fue presionado.")
    else:
        presion.append(f"{suj_qb} tuvo tiempo de sobra: nadie lo presionó.")
    if culpables:
        presion.append(f"Fallaron al proteger al quarterback: {L.unir(culpables)}.")
    puntos.append({"tipo": "Presión al QB", "texto": " ".join(presion)})

    # Qué pasó
    que_paso = narracion
    if down in (3, 4) and ytg > 0 and not r.anulada and not dos_puntos and r.passResult != "IN":
        ok = int(r.prePenaltyPlayResult) >= ytg and r.passResult in ("C", "R")
        que_paso += " ¡Consiguen el primer down!" if ok else " No consiguen el primer down."
    if r.penalizacion:
        quien = f" de {_equipo_nombre(r.foulNFLId1)}" if limpio(r.foulNFLId1) is not None else ""
        castigo = f", con castigo de {L.yardas_texto(int(r.penaltyYards))}" if limpio(r.penaltyYards) is not None else ""
        que_paso += f" Penalización: {L.falta(r.foulName1)}{quien}{castigo}."
    puntos.append({"tipo": "Qué pasó", "texto": que_paso})

    # Comparación con el resto de la liga
    s, c, gen = refs["situacion"], refs["cobertura"], refs["general"]
    situacion_normal = down > 0 and r.cubo in _CUBOS and not dos_puntos
    if situacion_normal and s.get("n", 0) >= 10 and s.get("completos_pct") is not None:
        extra = f" y consiguen el primer down {round(s['primer_down_pct'])} de cada 100 veces" if s.get("primer_down_pct") is not None else ""
        puntos.append({"tipo": "Comparación", "texto":
            f"En jugadas parecidas ({etiqueta}), los equipos completan {round(s['completos_pct'])} de cada 100 pases{extra} (se revisaron {s['n']} jugadas)."})
    if c.get("n", 0) >= 10:
        puntos.append({"tipo": "Comparación", "texto":
            f"Cuando la defensa usa {nom}, el quarterback termina presionado en {round(c['presion_pct'])} de cada 100 jugadas "
            f"(el promedio de la liga es {round(gen['presion_pct'])}) y el ataque gana {c['yardas_media']} yardas por jugada."})
    if situacion_normal and s.get("n", 0) >= 10 and not r.anulada and r.passResult != "IN":
        y = int(r.prePenaltyPlayResult)
        if y == s["yardas_media"]:
            comp = "lo mismo que"
        else:
            comp = "más que" if y > s["yardas_media"] else "menos que"
        verbo = "ganó" if y >= 0 else "perdió"
        puntos.append({"tipo": "Comparación", "texto":
            f"Esta jugada {verbo} {L.yardas_texto(y)}, {comp} el promedio de {s['yardas_media']} yardas en una situación igual."})

    return {
        "gameId": game_id, "playId": play_id, "cuarto": int(r.quarter), "reloj": _reloj(r.gameClock),
        "down": down, "distancia": ytg, "ofensiva": ofensiva, "defensa": defensa,
        "lugar": _lugar(r), "marcador": marc, "narracion": narracion,
        "resultado": limpio(r.passResult), "yardas": int(r.prePenaltyPlayResult),
        "yardas_totales": int(r.playResult), "presion": bool(r.hay_presion),
        "cobertura": cob_clave, "cobertura_nombre": nom, "cobertura_explicacion": explicacion,
        "play_action": bool(r.pff_playAction == 1), "rushers": nr, "qb": qb_nombre, "puntos": puntos,
        "referencias": refs, "etiqueta_situacion": etiqueta,
        "etiqueta_intento": "Jugada especial" if down <= 0 else f"{L.INTENTOS[down].capitalize()} intento",
        "faltan": ytg if (down > 0 and ytg > 0) else None,
    }


# ---------------------------------------------------------------- tracking


@lru_cache(maxsize=4)
def _tracking_partido(game_id: int) -> pd.DataFrame | None:
    archivo = DATA / "tracking" / f"tracking_{game_id}.csv"
    if not archivo.exists():
        return None
    return pd.read_csv(archivo, usecols=["playId", "nflId", "frameId", "jerseyNumber", "team",
                                         "playDirection", "x", "y", "event"])


def tracking_jugada(game_id: int, play_id: int) -> dict | None:
    t = _tracking_partido(game_id)
    if t is None:
        return None
    t = t[t.playId == play_id]
    if t.empty:
        return None
    try:
        r = _plays_idx.loc[(game_id, play_id)]
    except KeyError:
        return None
    if isinstance(r, pd.DataFrame):
        r = r.iloc[0]

    izquierda = t.playDirection.iloc[0] == "left"
    x = (120 - t.x) if izquierda else t.x
    y = (53.3 - t.y) if izquierda else t.y
    t = t.assign(xn=x.round(2), yn=y.round(2))
    los = float(120 - r.absoluteYardlineNumber) if izquierda else float(r.absoluteYardlineNumber)

    pf = _pff_idx.loc[(game_id, play_id)].reset_index()
    info = {int(row.nflId): row for row in pf.itertuples()}
    jugadores: dict[str, dict] = {}
    for nid, row in info.items():
        jugadores[str(nid)] = {
            "nombre": NOMBRES.get(nid, f"jugador {nid}"), "posicion": row.pff_positionLinedUp,
            "rol": L.ROLES_ES.get(row.pff_role, row.pff_role), "qb": row.pff_role == "Pass",
            "presion": bool(row.pff_hit == 1 or row.pff_hurry == 1 or row.pff_sack == 1),
        }

    cuadros = []
    for fid, grp in t.groupby("frameId"):
        evs = grp.event.dropna()
        lista = []
        for row in grp.itertuples():
            if row.team == "football":
                tipo = "B"
            elif row.team == r.possessionTeam:
                tipo = "O"
            else:
                tipo = "D"
            nid = limpio(row.nflId)
            lista.append({"id": None if nid is None else int(nid), "e": tipo,
                          "j": limpio(row.jerseyNumber), "x": float(row.xn), "y": float(row.yn)})
        cuadros.append({"f": int(fid), "ev": None if evs.empty else str(evs.iloc[0]), "j": lista})

    return {
        "gameId": game_id, "playId": play_id, "los": round(los, 1),
        "primer_down": round(los + int(r.yardsToGo), 1) if r.yardsToGo > 0 else None,
        "ofensiva": r.possessionTeam, "defensa": r.defensiveTeam,
        "jugadores": jugadores, "cuadros": cuadros,
    }
