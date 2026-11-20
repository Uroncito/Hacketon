"""Análisis por temporada, por equipo y comparación entre equipos.
Todo se calcula con los CSV de data/ (solo lectura). Las posiciones en la cancha salen del
tracking, leyendo únicamente el cuadro del snap de cada jugada; se calcula una vez y queda en memoria.
"""
from __future__ import annotations

import threading
from functools import lru_cache

import numpy as np
import pandas as pd

from .datos import (DATA, NOMBRES, POSICIONES, _metricas, games, limpio, nombre_cobertura,
                    players, pff, plays)

INICIO_TEMPORADA = pd.Timestamp("2021-09-09")
EQUIPOS_ABBR = sorted(set(games.homeTeamAbbr) | set(games.visitorTeamAbbr))

# ---------------------------------------------------------------- criterios del índice de equipo
# (etiqueta, lado, métrica, signo): signo +1 si un valor más alto es mejor, -1 si uno más bajo es mejor.
CRITERIOS: list[tuple[str, str, str, int]] = [
    ("Yardas por jugada (ofensiva)", "of", "yardas_media", 1),
    ("Pases completos (ofensiva)", "of", "completos_pct", 1),
    ("Primeros downs (ofensiva)", "of", "primer_down_pct", 1),
    ("Jugadas de 20+ yardas (ofensiva)", "of", "explosivas_pct", 1),
    ("Sacks recibidos", "of", "sack_pct", -1),
    ("QB presionado", "of", "presion_pct", -1),
    ("Intercepciones lanzadas", "of", "intercepcion_pct", -1),
    ("Yardas permitidas por jugada", "de", "yardas_media", -1),
    ("Pases completos permitidos", "de", "completos_pct", -1),
    ("Primeros downs permitidos", "de", "primer_down_pct", -1),
    ("Jugadas de 20+ permitidas", "de", "explosivas_pct", -1),
    ("Sacks que genera", "de", "sack_pct", 1),
    ("Presión que genera", "de", "presion_pct", 1),
    ("Intercepciones que logra", "de", "intercepcion_pct", 1),
]


def _bloque_ofensiva(of: pd.DataFrame) -> dict:
    return {**_metricas(of),
            "play_action_pct": round(100 * float(of.pff_playAction.mean()), 1) if len(of) else None}


def _bloque_defensa(de: pd.DataFrame) -> dict:
    cob = de.pff_passCoverage.value_counts()
    top = ({"cobertura": nombre_cobertura(cob.index[0]), "pct": round(100 * cob.iloc[0] / len(de), 1)}
           if len(cob) else None)
    return {**_metricas(de), "cobertura_top": top,
            "hombre_pct": round(100 * float((de.pff_passCoverageType == "Man").mean()), 1) if len(de) else None}


@lru_cache(maxsize=1)
def _liga() -> dict:
    """Métricas de los 32 equipos, promedio de la liga e índice (50 = promedio, +10 = una desviación mejor)."""
    filas = {ab: {"of": _bloque_ofensiva(plays[plays.possessionTeam == ab]),
                  "de": _bloque_defensa(plays[plays.defensiveTeam == ab])} for ab in EQUIPOS_ABBR}
    z: dict[str, list[float]] = {ab: [] for ab in EQUIPOS_ABBR}
    promedio: dict[str, float] = {}
    for _, lado, clave, signo in CRITERIOS:
        vals = pd.Series({ab: filas[ab][lado].get(clave) for ab in EQUIPOS_ABBR}, dtype="float64")
        promedio[f"{lado}.{clave}"] = round(float(vals.mean()), 1)
        desv = float(vals.std(ddof=0))
        for ab, v in vals.items():
            if pd.notna(v) and desv > 0:
                z[ab].append(signo * (float(v) - float(vals.mean())) / desv)
    indices = {ab: round(50 + 10 * float(np.mean(v)), 1) for ab, v in z.items() if v}
    orden = sorted(indices, key=indices.get, reverse=True)
    return {"filas": filas, "promedio": promedio, "indices": indices,
            "puesto": {ab: i + 1 for i, ab in enumerate(orden)}}


# ---------------------------------------------------------------- posiciones (tracking en el snap)
_candado = threading.Lock()
_SNAP: pd.DataFrame | None = None


def _grupo(pos: str) -> str:
    if pos == "QB":
        return "QB"
    if pos in {"C", "LG", "RG", "LT", "RT"}:
        return "OL"
    if pos.startswith(("HB", "FB")):
        return "RB"
    if pos.startswith("TE"):
        return "TE"
    if pos.endswith("WR"):
        return "WR"
    if pos in {"DRT", "DLT", "LEO", "REO", "LE", "RE", "NT", "NRT", "NLT"}:
        return "DL"
    if pos in {"ROLB", "LOLB", "LLB", "RLB", "RILB", "LILB", "MLB"}:
        return "LB"
    return "DB"


def _snaps() -> pd.DataFrame:
    """Un renglón por jugador y jugada, en el momento del snap, con x relativa a la línea de golpeo."""
    global _SNAP
    with _candado:
        if _SNAP is not None:
            return _SNAP
        partes = []
        for gid in games.gameId:
            archivo = DATA / "tracking" / f"tracking_{gid}.csv"
            if not archivo.exists():
                continue
            t = pd.read_csv(archivo, usecols=["playId", "nflId", "frameId", "jerseyNumber", "team",
                                              "playDirection", "x", "y", "event"])
            t = t[t.event.isin(["ball_snap", "autoevent_ballsnap"])]
            t = t[t.frameId == t.groupby("playId").frameId.transform("min")]
            izq = t.playDirection == "left"
            t = t.assign(gameId=gid, xn=np.where(izq, 120 - t.x, t.x), yn=np.where(izq, 53.3 - t.y, t.y))
            balon = t[t.team == "football"].groupby("playId").xn.first().rename("balon")
            t = t[t.team != "football"].merge(balon, on="playId", how="inner")
            t["dx"] = (t.xn - t.balon).round(2)
            partes.append(t[["gameId", "playId", "nflId", "team", "jerseyNumber", "dx", "yn"]])
        s = pd.concat(partes, ignore_index=True)
        s["nflId"] = s.nflId.astype(int)
        s = s.merge(plays[["gameId", "playId", "possessionTeam"]], on=["gameId", "playId"])
        s["lado"] = np.where(s.team == s.possessionTeam, "of", "de")
        pos = pff[["gameId", "playId", "nflId", "pff_positionLinedUp"]]
        s = s.merge(pos, on=["gameId", "playId", "nflId"], how="left").rename(
            columns={"pff_positionLinedUp": "pos", "yn": "y"})
        s["pos"] = s.pos.fillna("?")
        _SNAP = s
        return s


def precalentar() -> None:
    """Se llama en un hilo al arrancar para que la primera consulta de un equipo no espere la lectura."""
    _snaps()
    _liga()


def _posiciones(abbr: str) -> dict:
    s = _snaps()
    s = s[s.team == abbr]
    salida: dict[str, list[dict]] = {}
    for lado in ("of", "de"):
        lista = []
        for pos, g in s[s.lado == lado].groupby("pos"):
            if pos == "?":
                continue
            muestra = g.sample(min(len(g), 30), random_state=1)
            lista.append({
                "pos": pos, "grupo": _grupo(pos), "n": int(len(g)),
                "dx": round(float(g.dx.mean()), 1), "y": round(float(g.y.mean()), 1),
                "puntos": [[round(float(a), 1), round(float(b), 1)] for a, b in zip(muestra.dx, muestra.y)],
            })
        salida["ofensiva" if lado == "of" else "defensa"] = sorted(lista, key=lambda p: -p["n"])
    return salida


# ---------------------------------------------------------------- jugadores
def _fecha_nacimiento(texto) -> pd.Timestamp | None:
    if texto is None or pd.isna(texto):
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return pd.to_datetime(texto, format=fmt)
        except ValueError:
            continue
    return None


def _altura(texto: str) -> tuple[str, int | None]:
    try:
        pies, pulg = str(texto).split("-")
        total = int(pies) * 12 + int(pulg)
        return f"{pies}'{pulg}\"", round(total * 2.54)
    except ValueError:
        return str(texto), None


def _jugadores(abbr: str) -> list[dict]:
    s = _snaps()
    s = s[s.team == abbr]
    info = players.set_index("nflId")
    pres = pff.assign(gen=pff[["pff_hit", "pff_hurry", "pff_sack"]].sum(axis=1),
                      perm=pff[["pff_hitAllowed", "pff_hurryAllowed", "pff_sackAllowed"]].sum(axis=1))
    pres = pres.groupby("nflId")[["gen", "perm", "pff_sack"]].sum()
    salida = []
    for nid, g in s.groupby("nflId"):
        if nid not in info.index:
            continue
        p = info.loc[nid]
        nac = _fecha_nacimiento(limpio(p.birthDate))
        edad = int((INICIO_TEMPORADA - nac).days // 365.25) if nac is not None else None
        altura, cm = _altura(p.height)
        numero = g.jerseyNumber.dropna()
        pos_oficial = str(p.officialPosition)
        r = pres.loc[nid] if nid in pres.index else None
        salida.append({
            "id": int(nid), "nombre": p.displayName,
            "numero": int(numero.mode().iloc[0]) if len(numero) else None,
            "posicion": pos_oficial, "grupo": _grupo(g.pos.mode().iloc[0]) if (g.pos != "?").any() else "",
            "edad": edad, "universidad": limpio(p.collegeName),
            "altura": altura, "altura_cm": cm, "peso_lb": int(p.weight), "peso_kg": round(int(p.weight) * 0.4536),
            "jugadas": int(len(g)),
            "presiones": int(r.gen) if r is not None else 0,
            "sacks": int(r.pff_sack) if r is not None else 0,
            "permitidas": int(r.perm) if r is not None else 0,
        })
    return sorted(salida, key=lambda j: (-j["jugadas"], j["nombre"]))


# ---------------------------------------------------------------- perfil de equipo
def _qb_principal(abbr: str) -> dict | None:
    of = plays[plays.possessionTeam == abbr][["gameId", "playId", "passResult", "prePenaltyPlayResult"]]
    qb = pff[pff.pff_role == "Pass"][["gameId", "playId", "nflId"]].merge(of, on=["gameId", "playId"])
    if qb.empty:
        return None
    nid = int(qb.nflId.value_counts().index[0])
    q = qb[qb.nflId == nid]
    intentos = int(q.passResult.isin(["C", "I", "IN"]).sum())
    return {
        "nombre": NOMBRES.get(nid, f"jugador {nid}"), "dropbacks": int(len(q)),
        "intentos": intentos, "completos": int((q.passResult == "C").sum()),
        "yardas": int(q.prePenaltyPlayResult.sum()), "sacks": int((q.passResult == "S").sum()),
        "intercepciones": int((q.passResult == "IN").sum()),
        "completos_pct": round(100 * float((q.passResult == "C").sum()) / intentos, 1) if intentos else None,
    }


def _presionadores(abbr: str, n: int = 5) -> list[dict]:
    de = plays[plays.defensiveTeam == abbr][["gameId", "playId"]]
    r = pff[pff.pff_role == "Pass Rush"].merge(de, on=["gameId", "playId"])
    g = r.groupby("nflId")[["pff_sack", "pff_hurry", "pff_hit"]].sum()
    g["total"] = g.sum(axis=1)
    g = g[g.total > 0].sort_values(["total", "pff_sack"], ascending=False).head(n)
    return [{"nombre": NOMBRES.get(int(i), f"jugador {int(i)}"), "posicion": POSICIONES.get(int(i), ""),
             "sacks": int(x.pff_sack), "hurries": int(x.pff_hurry), "hits": int(x.pff_hit), "total": int(x.total)}
            for i, x in g.iterrows()]


def _uso(serie: pd.Series, n: int = 3) -> list[dict]:
    v = serie.dropna().value_counts(normalize=True).head(n)
    return [{"nombre": str(k), "pct": round(100 * float(x), 1)} for k, x in v.items()]


def _partidos(abbr: str) -> list[dict]:
    g = games[(games.homeTeamAbbr == abbr) | (games.visitorTeamAbbr == abbr)].sort_values(["week", "gameDate"])
    salida = []
    for r in g.itertuples():
        pj = plays[plays.gameId == r.gameId]
        of, de = pj[pj.possessionTeam == abbr], pj[pj.defensiveTeam == abbr]
        local = r.homeTeamAbbr == abbr
        salida.append({
            "gameId": int(r.gameId), "semana": int(r.week), "fecha": r.gameDate, "local": local,
            "rival": r.visitorTeamAbbr if local else r.homeTeamAbbr,
            "ofensiva": {"n": int(len(of)), "yardas_media": round(float(of.prePenaltyPlayResult.mean()), 1) if len(of) else None,
                         "sacks": int((of.passResult == "S").sum()), "completos_pct": _metricas(of).get("completos_pct")},
            "defensa": {"n": int(len(de)), "yardas_media": round(float(de.prePenaltyPlayResult.mean()), 1) if len(de) else None,
                        "sacks": int((de.passResult == "S").sum()), "intercepciones": int((de.passResult == "IN").sum())},
        })
    return salida


def _resumen_texto(abbr: str, liga: dict) -> list[str]:
    f, prom = liga["filas"][abbr], liga["promedio"]
    of, de = f["of"], f["de"]

    def cmp(valor, clave, mayor_es_mejor=True, unidad="%"):
        if valor is None:
            return "sin datos"
        ref = prom[clave]
        if valor == ref:
            return f"{valor}{unidad}, igual al promedio de la liga"
        mejor = (valor > ref) == mayor_es_mejor
        return f"{valor}{unidad}, {'mejor' if mejor else 'peor'} que el promedio de la liga ({ref}{unidad})"

    puntos = [
        f"Ataque: completa {cmp(of.get('completos_pct'), 'of.completos_pct')}.",
        f"Ataque: promedia {cmp(of.get('yardas_media'), 'of.yardas_media', unidad=' yardas')} por jugada.",
        f"Protección: su QB sufre presión en {cmp(of.get('presion_pct'), 'of.presion_pct', False)} de los dropbacks.",
        f"Defensa: permite {cmp(de.get('yardas_media'), 'de.yardas_media', False, ' yardas')} por jugada.",
        f"Defensa: presiona al QB rival en {cmp(de.get('presion_pct'), 'de.presion_pct')} de las jugadas.",
    ]
    if de.get("cobertura_top"):
        puntos.append(f"Su cobertura más usada es {de['cobertura_top']['cobertura']} "
                      f"({de['cobertura_top']['pct']}% de las jugadas); defiende en hombre {de.get('hombre_pct')}% del tiempo.")
    return puntos


def perfil_equipo(abbr: str) -> dict | None:
    if abbr not in EQUIPOS_ABBR:
        return None
    liga = _liga()
    f = liga["filas"][abbr]
    of = plays[plays.possessionTeam == abbr]
    de = plays[plays.defensiveTeam == abbr]
    jugadores = _jugadores(abbr)
    return {
        "equipo": abbr, "partidos": _partidos(abbr), "jugadores": jugadores,
        "posiciones": _posiciones(abbr), "ofensiva": f["of"], "defensa": f["de"],
        "indice": liga["indices"].get(abbr), "puesto": liga["puesto"].get(abbr),
        "resumen": _resumen_texto(abbr, liga), "qb": _qb_principal(abbr),
        "presionadores": _presionadores(abbr), "formaciones": _uso(of.offenseFormation),
        "coberturas": _uso(de.pff_passCoverage.map(nombre_cobertura)),
        "penalizaciones_pct": round(100 * float(of.penalizacion.mean()), 1) if len(of) else None,
        "promedio_liga": liga["promedio"],
    }


# ---------------------------------------------------------------- comparación
def _fisico(jugadores: list[dict]) -> dict:
    def media(clave):
        v = [j[clave] for j in jugadores if j[clave] is not None]
        return round(float(np.mean(v)), 1) if v else None
    return {"jugadores": len(jugadores), "edad": media("edad"), "altura_cm": media("altura_cm"), "peso_kg": media("peso_kg")}


def comparar(a: str, b: str) -> dict | None:
    if a not in EQUIPOS_ABBR or b not in EQUIPOS_ABBR:
        return None
    liga = _liga()
    perfiles = {ab: perfil_equipo(ab) for ab in (a, b)}
    criterios, gana = [], {a: 0, b: 0}
    for etiqueta, lado, clave, signo in CRITERIOS:
        va, vb = (liga["filas"][ab][lado].get(clave) for ab in (a, b))
        ganador = None
        if va is not None and vb is not None and va != vb:
            ganador = a if signo * (va - vb) > 0 else b
            gana[ganador] += 1
        criterios.append({"criterio": etiqueta, "a": va, "b": vb, "ganador": ganador,
                          "mejor": "más alto" if signo > 0 else "más bajo"})
    ia, ib = liga["indices"][a], liga["indices"][b]
    dif = round(abs(ia - ib), 1)
    if dif < 1.5:
        veredicto = "Están muy parejos según estos datos."
        mejor = None
    else:
        mejor = a if ia > ib else b
        peor = b if mejor == a else a
        veredicto = (f"Se cree que {mejor} es mejor: tiene índice {liga['indices'][mejor]} contra "
                     f"{liga['indices'][peor]} y gana en {gana[mejor]} de {len(CRITERIOS)} criterios.")
    return {
        "a": a, "b": b, "criterios": criterios, "indice": {a: ia, b: ib}, "puesto": {a: liga["puesto"][a], b: liga["puesto"][b]},
        "victorias": gana, "mejor": mejor, "veredicto": veredicto,
        "fisico": {a: _fisico(perfiles[a]["jugadores"]), b: _fisico(perfiles[b]["jugadores"])},
        "perfiles": {ab: {k: perfiles[ab][k] for k in ("qb", "presionadores", "formaciones", "coberturas",
                                                       "penalizaciones_pct", "ofensiva", "defensa")} for ab in (a, b)},
        "nota": "El índice promedia 14 criterios de jugadas de pase (semanas 1 a 8 de 2021). 50 es el promedio de la "
                "liga y cada 10 puntos equivalen a una desviación estándar. Con 3 a 8 partidos por equipo, las diferencias "
                "pequeñas pueden deberse al azar.",
    }


# ---------------------------------------------------------------- resumen de la temporada
def resumen_temporada() -> dict:
    liga = _liga()
    valida = plays[~plays.anulada]
    pases_c = plays[plays.passResult == "C"]
    td = pases_c[(~pases_c.anulada) & pases_c.playDescription.str.contains("TOUCHDOWN", na=False)]
    top = sorted(liga["indices"], key=liga["indices"].get, reverse=True)[:5]
    # mejor pase: el pase completo más largo
    mejor = pases_c[~pases_c.anulada].sort_values("prePenaltyPlayResult", ascending=False).iloc[0]
    g = games.set_index("gameId").loc[mejor.gameId]
    qb = pff[(pff.gameId == mejor.gameId) & (pff.playId == mejor.playId) & (pff.pff_role == "Pass")].nflId
    # mejores jugadores
    qbs = pff[pff.pff_role == "Pass"][["gameId", "playId", "nflId"]].merge(
        plays[["gameId", "playId", "possessionTeam", "prePenaltyPlayResult", "passResult"]], on=["gameId", "playId"])
    q = qbs.groupby(["nflId", "possessionTeam"]).agg(
        dropbacks=("playId", "size"), yardas=("prePenaltyPlayResult", "sum"),
        completos=("passResult", lambda s: int((s == "C").sum())),
        intentos=("passResult", lambda s: int(s.isin(["C", "I", "IN"]).sum()))).reset_index()
    q = q[q.dropbacks >= 100].assign(ypd=lambda d: d.yardas / d.dropbacks).sort_values("ypd", ascending=False)
    mq = q.iloc[0]
    rush = pff[pff.pff_role == "Pass Rush"].merge(plays[["gameId", "playId", "defensiveTeam"]], on=["gameId", "playId"])
    r = rush.groupby(["nflId", "defensiveTeam"])[["pff_sack", "pff_hurry", "pff_hit"]].sum()
    r["total"] = r.sum(axis=1)
    mr = r.sort_values(["total", "pff_sack"], ascending=False).reset_index().iloc[0]
    blo = pff[pff.pff_role == "Pass Block"].merge(plays[["gameId", "playId", "possessionTeam"]], on=["gameId", "playId"])
    blo = blo.assign(perm=blo[["pff_hitAllowed", "pff_hurryAllowed", "pff_sackAllowed"]].sum(axis=1))
    b = blo.groupby(["nflId", "possessionTeam"]).agg(snaps=("playId", "size"), perm=("perm", "sum")).reset_index()
    b = b[b.snaps >= 200].assign(tasa=lambda d: 100 * d.perm / d.snaps).sort_values(["tasa", "snaps"], ascending=[True, False])
    mb = b.iloc[0]
    n_tracking = len(list((DATA / "tracking").glob("tracking_*.csv")))
    return {
        "temporada": 2021,
        "partidos_jugados": int(len(games)), "semanas": int(games.week.nunique()),
        "jugadas_pase": int(len(plays)), "partidos_con_jugadas": int(plays.gameId.nunique()),
        "partidos_con_tracking": n_tracking, "equipos": len(EQUIPOS_ABBR), "jugadores": int(len(players)),
        "yardas_media": round(float(valida.prePenaltyPlayResult.mean()), 1),
        "completos_pct": _metricas(plays)["completos_pct"], "sacks": int((plays.passResult == "S").sum()),
        "intercepciones": int((plays.passResult == "IN").sum()), "touchdowns_pase": int(len(td)),
        "mejor_equipo": {"equipo": top[0], "indice": liga["indices"][top[0]],
                         "ranking": [{"equipo": ab, "indice": liga["indices"][ab]} for ab in top]},
        "mejor_pase": {
            "yardas": int(mejor.prePenaltyPlayResult), "equipo": mejor.possessionTeam,
            "qb": NOMBRES.get(int(qb.iloc[0])) if len(qb) else None, "semana": int(g.week),
            "rival": mejor.defensiveTeam, "cuarto": int(mejor.quarter), "reloj": mejor.gameClock,
            "gameId": int(mejor.gameId), "playId": int(mejor.playId), "descripcion": mejor.playDescription,
        },
        "mejor_jugador": {
            "qb": {"nombre": NOMBRES.get(int(mq.nflId)), "equipo": mq.possessionTeam, "dropbacks": int(mq.dropbacks),
                   "yardas_por_dropback": round(float(mq.ypd), 1), "completos": int(mq.completos), "intentos": int(mq.intentos)},
            "presionador": {"nombre": NOMBRES.get(int(mr.nflId)), "equipo": mr.defensiveTeam, "posicion": POSICIONES.get(int(mr.nflId), ""),
                            "total": int(mr.total), "sacks": int(mr.pff_sack), "hurries": int(mr.pff_hurry), "hits": int(mr.pff_hit)},
            "bloqueador": {"nombre": NOMBRES.get(int(mb.nflId)), "equipo": mb.possessionTeam, "posicion": POSICIONES.get(int(mb.nflId), ""),
                           "snaps": int(mb.snaps), "permitidas": int(mb.perm)},
        },
    }
