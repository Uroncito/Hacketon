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

FORMACIONES: dict[str, str] = {
    "SHOTGUN": "Shotgun (QB atrás del centro)",
    "EMPTY": "Empty (sin corredores en el backfield)",
    "SINGLEBACK": "Singleback (un corredor)",
    "I_FORM": "Formación I",
    "PISTOL": "Pistol",
    "JUMBO": "Jumbo (formación pesada)",
    "WILDCAT": "Wildcat",
}

TIPO_COBERTURA = {"Man": "cobertura de hombre", "Zone": "cobertura de zona", "Other": "cobertura mixta"}


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
    destacadas = [{"playId": int(r.playId), "cuarto": int(r.quarter), "reloj": r.gameClock,
                   "yardas": int(r.prePenaltyPlayResult), "ofensiva": r.possessionTeam,
                   "descripcion": r.playDescription} for r in largas.itertuples()]
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
    return f"en la yarda {num} de {lado}"


def _texto_resultado(r) -> str:
    y = int(r.prePenaltyPlayResult)
    desc = str(r.playDescription)
    if r.anulada:
        base = "La jugada se anuló por penalización"
    elif "TOUCHDOWN" in desc and r.passResult != "IN":
        base = f"Touchdown, con un avance de {y} yardas" if r.passResult in ("C", "R") else "Touchdown"
    elif r.passResult == "C":
        base = f"Pase completo de {y} yardas" if y >= 0 else f"Pase completo con pérdida de {abs(y)}"
    elif r.passResult == "I":
        base = "Pase incompleto"
    elif r.passResult == "S":
        base = f"Sack con pérdida de {abs(y)} yardas"
    elif r.passResult == "IN":
        base = "Pase interceptado"
    elif r.passResult == "R":
        base = f"Scramble del quarterback con {y} yardas" if y >= 0 else f"Scramble con pérdida de {abs(y)}"
    else:
        base = "Resultado no clasificado"
    return base


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
    hurriers = rushers[(rushers.pff_hurry == 1)].nombre.tolist()
    hitters = rushers[(rushers.pff_hit == 1)].nombre.tolist()
    bloqueadores = pf[pf.pff_role == "Pass Block"]
    culpables = []
    for b in bloqueadores.itertuples():
        if b.pff_sackAllowed == 1:
            culpables.append((b.nombre, "un sack"))
        elif b.pff_hitAllowed == 1:
            culpables.append((b.nombre, "un golpe al QB"))
        elif b.pff_hurryAllowed == 1:
            culpables.append((b.nombre, "una presión"))

    down, ytg = int(r.down), int(r.yardsToGo)
    cob_clave = r.pff_passCoverage
    refs = referencias(down, r.cubo, cob_clave)
    marc = _marcador(r, g)
    pts_of = marc["puntos_local"] if r.possessionTeam == g.homeTeamAbbr else marc["puntos_visitante"]
    pts_de = marc["puntos_visitante"] if r.possessionTeam == g.homeTeamAbbr else marc["puntos_local"]
    dif = pts_of - pts_de
    ofensiva, defensa = r.possessionTeam, r.defensiveTeam

    puntos: list[dict] = []

    # Situación
    sit_down = f"{down}ª y {ytg}" if down > 0 and ytg > 0 else "Situación especial"
    estado = ("empatan" if dif == 0 else
              f"{ofensiva} gana por {dif}" if dif > 0 else f"{ofensiva} pierde por {abs(dif)}")
    puntos.append({"tipo": "Situación", "texto":
        f"{sit_down} {_lugar(r)}, {int(r.quarter)}º cuarto con {r.gameClock} en el reloj. "
        f"Marcador previo: {ofensiva} {pts_of}, {defensa} {pts_de} ({estado})."})

    # Ofensiva
    form = FORMACIONES.get(str(r.offenseFormation), str(r.offenseFormation))
    extra = ", con fingimiento de carrera (play action)" if r.pff_playAction == 1 else ""
    puntos.append({"tipo": "Ofensiva", "texto":
        f"{ofensiva} se alinea en {form} con {r.personnelO}{extra}."
        + (f" El pasador es {qb_nombre}." if qb_nombre else "")})

    # Defensa
    nom, desc = COBERTURAS.get(cob_clave, (cob_clave, ""))
    tipo = TIPO_COBERTURA.get(str(r.pff_passCoverageType), "")
    caja = limpio(r.defendersInBox)
    texto_def = f"{defensa} responde con {nom}"
    if desc:
        texto_def += f" ({desc})"
    if tipo:
        texto_def += f", {tipo}"
    texto_def += f". Personal: {r.personnelD}"
    if caja is not None:
        texto_def += f", con {int(caja)} defensores en la caja"
    puntos.append({"tipo": "Defensa", "texto": texto_def + "."})

    # Presión
    nr = int(r.rushers)
    rush_txt = (f"Mandan {nr} rushers, es un blitz." if nr >= 5 else
                f"Rush de {nr}, sin blitz." if nr in (3, 4) else f"Solo {nr} rushers." if nr else "")
    if sackers:
        pres = f"Sack de {' y '.join(sackers)}."
    elif r.hay_presion:
        quienes = hurriers + hitters
        pres = ("El QB sufre presión" + (f" de {', '.join(dict.fromkeys(quienes))}." if quienes else "."))
    else:
        pres = "El QB tiene bolsa limpia, sin presiones registradas."
    if culpables:
        pres += " Falla en protección: " + "; ".join(f"{n} permitió {t}" for n, t in culpables) + "."
    puntos.append({"tipo": "Presión", "texto": f"{rush_txt} {pres}".strip()})

    # Resultado
    res = _texto_resultado(r)
    conv = ""
    if down in (3, 4) and ytg > 0 and not r.anulada:
        ok = int(r.prePenaltyPlayResult) >= ytg and r.passResult in ("C", "R")
        conv = " Convierte el primer down." if ok else " No convierte."
    pen = ""
    if r.penalizacion:
        pen = (f" Penalización: {r.foulName1}" +
               (f" de {_equipo_nombre(r.foulNFLId1)}" if limpio(r.foulNFLId1) is not None else "") +
               (f", {int(r.penaltyYards)} yardas." if limpio(r.penaltyYards) is not None else "."))
    puntos.append({"tipo": "Resultado", "texto": f"{res}.{conv}{pen}"})

    # Contexto de liga
    s, c, gen = refs["situacion"], refs["cobertura"], refs["general"]
    situacion_normal = down > 0 and r.cubo != "especial"
    if situacion_normal and s.get("n", 0) >= 10 and s.get("completos_pct") is not None:
        puntos.append({"tipo": "Contexto", "texto":
            f"En {down}ª y {r.cubo} yardas, la ofensiva completa {s['completos_pct']}% de sus pases, "
            f"promedia {s['yardas_media']} yardas y convierte el primer down en {s['primer_down_pct']}% "
            f"({s['n']} jugadas)."})
    if c.get("n", 0) >= 10:
        puntos.append({"tipo": "Contexto", "texto":
            f"Contra {nom}, el QB recibe presión en {c['presion_pct']}% de los dropbacks "
            f"(promedio general {gen['presion_pct']}%) y la ofensiva promedia {c['yardas_media']} yardas "
            f"({c['n']} jugadas)."})
    if situacion_normal and s.get("n", 0) >= 10 and not r.anulada and r.passResult != "IN":
        y = int(r.prePenaltyPlayResult)
        cmp = "por encima" if y > s["yardas_media"] else "por debajo" if y < s["yardas_media"] else "igual"
        puntos.append({"tipo": "Contexto", "texto":
            f"Esta jugada deja {y} yardas, {cmp} del promedio de {s['yardas_media']} en la misma situación."})

    return {
        "gameId": game_id, "playId": play_id, "cuarto": int(r.quarter), "reloj": r.gameClock,
        "down": down, "distancia": ytg, "ofensiva": ofensiva, "defensa": defensa,
        "lugar": _lugar(r), "marcador": marc, "descripcion": r.playDescription,
        "resultado": limpio(r.passResult), "yardas": int(r.prePenaltyPlayResult),
        "yardas_totales": int(r.playResult), "presion": bool(r.hay_presion),
        "formacion": limpio(r.offenseFormation), "personal_of": limpio(r.personnelO),
        "personal_def": limpio(r.personnelD), "caja": caja if caja is None else int(caja),
        "cobertura": cob_clave, "cobertura_nombre": nom,
        "cobertura_tipo": limpio(r.pff_passCoverageType), "play_action": bool(r.pff_playAction == 1),
        "rushers": nr, "qb": qb_nombre, "puntos": puntos,
        "referencias": refs, "etiqueta_situacion": f"{down}ª y {r.cubo}",
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
            "rol": row.pff_role,
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
