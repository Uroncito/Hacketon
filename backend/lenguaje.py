"""Textos en español sencillo: interpreta los datos de la base en lugar de copiarlos tal cual."""
from __future__ import annotations

import re

# ---------------------------------------------------------------- equipos

NOMBRES_EQUIPO = {
    "ARI": "Cardinals", "ATL": "Falcons", "BAL": "Ravens", "BUF": "Bills", "CAR": "Panthers",
    "CHI": "Bears", "CIN": "Bengals", "CLE": "Browns", "DAL": "Cowboys", "DEN": "Broncos",
    "DET": "Lions", "GB": "Packers", "HOU": "Texans", "IND": "Colts", "JAX": "Jaguars",
    "KC": "Chiefs", "LA": "Rams", "LAC": "Chargers", "LV": "Raiders", "MIA": "Dolphins",
    "MIN": "Vikings", "NE": "Patriots", "NO": "Saints", "NYG": "Giants", "NYJ": "Jets",
    "PHI": "Eagles", "PIT": "Steelers", "SEA": "Seahawks", "SF": "49ers", "TB": "Buccaneers",
    "TEN": "Titans", "WAS": "Washington",
}


def equipo(abbr: str) -> str:
    return NOMBRES_EQUIPO.get(abbr, abbr)


def los(abbr: str) -> str:
    """'los Jets', pero 'Washington' sin artículo."""
    return equipo(abbr) if abbr == "WAS" else f"los {equipo(abbr)}"


def cap(texto: str) -> str:
    """Primera letra en mayúscula, sin tocar el resto."""
    return texto[:1].upper() + texto[1:]


def verbo(abbr: str, plural: str, singular: str) -> str:
    """Washington va en singular; los demás equipos, en plural."""
    return singular if abbr == "WAS" else plural


ROLES_ES = {"Pass": "quarterback", "Pass Route": "receptor", "Pass Block": "bloquea",
            "Pass Rush": "presiona al quarterback", "Coverage": "cubre a un receptor"}


def de_los(abbr: str) -> str:
    """'de los Jets', pero 'de Washington'."""
    return f"de {equipo(abbr)}" if abbr == "WAS" else f"de los {equipo(abbr)}"


# ---------------------------------------------------------------- números y listas

_NUM = {0: "cero", 1: "un", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco", 6: "seis", 7: "siete",
        8: "ocho", 9: "nueve", 10: "diez", 11: "once"}


def num(n: int) -> str:
    return _NUM.get(n, str(n))


def unir(items: list[str]) -> str:
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " y " + items[-1]


INTENTOS = {1: "primer", 2: "segundo", 3: "tercer", 4: "cuarto"}
CUARTOS = {1: "primer cuarto", 2: "segundo cuarto", 3: "tercer cuarto", 4: "último cuarto", 5: "tiempo extra"}


def yardas_texto(n: int) -> str:
    n = abs(int(n))
    return f"{n} yarda" if n == 1 else f"{n} yardas"


# ---------------------------------------------------------------- personal en el campo

_OFENSIVA = {"RB": ("corredor", "corredores"), "TE": ("ala cerrada", "alas cerradas"),
             "WR": ("receptor", "receptores"), "OL": ("liniero ofensivo extra", "linieros ofensivos extra"),
             "QB": ("quarterback extra", "quarterbacks extra"), "LB": ("apoyador", "apoyadores")}
_DEFENSA = {"DL": ("liniero defensivo", "linieros defensivos"), "LB": ("apoyador", "apoyadores"),
            "DB": ("defensa de secundaria", "defensas de secundaria")}


def personal(texto: str | None, defensa: bool) -> str:
    """'1 RB, 1 TE, 3 WR' -> 'un corredor, un ala cerrada y tres receptores'."""
    if not isinstance(texto, str) or not texto:
        return ""
    tabla = _DEFENSA if defensa else _OFENSIVA
    partes = []
    for n, k in re.findall(r"(\d+)\s+(\w+)", texto):
        n = int(n)
        if n == 0:
            continue
        sing, plur = tabla.get(k, (k, k))
        partes.append(f"{num(n)} {sing if n == 1 else plur}")
    return unir(partes)


# ---------------------------------------------------------------- formaciones y coberturas

def formacion(clave: str | None, qb: str) -> str:
    sujeto = qb or "El quarterback"
    frases = {
        "SHOTGUN": f"{sujeto} se para atrás, a unas 5 yardas del centro (formación shotgun)",
        "EMPTY": f"{sujeto} está solo atrás, sin corredores junto a él (formación empty)",
        "SINGLEBACK": f"{sujeto} tiene un corredor detrás de él (formación singleback)",
        "I_FORM": f"{sujeto} tiene dos corredores en fila detrás de él (formación I)",
        "PISTOL": f"{sujeto} se para a unas 3 yardas del centro, con un corredor detrás (formación pistol)",
        "JUMBO": f"{sujeto} juega con muchos bloqueadores extra (formación jumbo)",
        "WILDCAT": f"un corredor recibe el balón en lugar del quarterback (formación wildcat)",
    }
    return frases.get(str(clave), f"{sujeto} se coloca para lanzar")


COBERTURAS_ES = {
    "Cover-0": ("Cover 0", "cada defensor persigue a un receptor y nadie se queda atrás cuidando lo profundo; es arriesgado y casi siempre viene con presión"),
    "Cover-1": ("Cover 1", "cada defensor sigue a un receptor y uno se queda muy atrás cuidando lo profundo"),
    "Cover-2": ("Cover 2", "dos defensores se quedan muy atrás, cada uno cuidando la mitad de la cancha, y los demás cuidan zonas cerca de la línea"),
    "2-Man": ("2-Man", "dos defensores se quedan muy atrás y los demás siguen uno a uno a los receptores"),
    "Cover-3": ("Cover 3", "tres defensores cuidan lo profundo y los demás cuidan zonas más cerca de la línea"),
    "Quarters": ("Quarters", "cuatro defensores se reparten lo profundo, cada uno cuidando un cuarto de la cancha"),
    "Cover-6": ("Cover 6", "de un lado de la cancha cuatro defensores se reparten lo profundo y del otro lado dos cuidan una mitad cada uno"),
    "Bracket": ("Bracket", "dos defensores doblan la cobertura sobre un receptor"),
    "Goal Line": ("Línea de gol", "una defensa muy cerrada para evitar el touchdown cerca de la zona de anotación"),
    "Red Zone": ("Zona roja", "un esquema especial para cuando el rival está cerca de anotar"),
    "Prevent": ("Prevent", "los defensores se quedan muy atrás para evitar jugadas largas, típico al final de un tiempo"),
    "Miscellaneous": ("Defensa poco común", "un esquema que no encaja en los de siempre"),
}


def cobertura(clave: str) -> tuple[str, str]:
    return COBERTURAS_ES.get(clave, (clave, "un esquema defensivo"))


# ---------------------------------------------------------------- penalizaciones

FALTAS_ES = {
    "Defensive Pass Interference": "interferencia de pase de la defensa",
    "Offensive Holding": "agarrón de la ofensiva (holding)",
    "Defensive Holding": "agarrón de la defensa (holding)",
    "Roughing the Passer": "golpe indebido al quarterback",
    "Defensive Offside": "defensa adelantada (offside)",
    "Illegal Use of Hands": "uso ilegal de las manos",
    "Unnecessary Roughness": "brusquedad innecesaria",
    "Offensive Pass Interference": "interferencia de pase de la ofensiva",
    "Face Mask (15 Yards)": "agarrar la máscara del casco",
    "Illegal Contact": "contacto ilegal con el receptor",
    "Intentional Grounding": "tirar el balón al suelo a propósito",
    "Taunting": "burlarse del rival",
    "Ineligible Downfield Pass": "un jugador no elegible avanzó antes del pase",
    "Illegal Formation": "alineación ilegal",
    "Lowering the Head to Initiate Contact": "golpear con la cabeza agachada",
    "Illegal Blindside Block": "bloqueo ilegal por la espalda",
    "Unsportsmanlike Conduct": "conducta antideportiva",
    "Illegal Touch Pass": "toque ilegal del pase",
    "Illegal Motion": "movimiento ilegal antes del snap",
    "Horse Collar Tackle": "derribar jalando el cuello de la camiseta",
    "Disqualification": "descalificación",
    "Low Block": "bloqueo bajo ilegal",
    "Illegal Shift": "cambio de posición ilegal",
    "Tripping": "zancadilla",
    "Illegal Forward Pass": "pase hacia adelante ilegal",
    "Illegal Block Above the Waist": "bloqueo ilegal arriba de la cintura",
    "Chop Block": "bloqueo ilegal a las piernas",
    "Illegal Substitution": "cambio de jugadores ilegal",
    "Clipping": "bloqueo ilegal por la espalda",
}


def falta(nombre: str | None) -> str:
    return FALTAS_ES.get(str(nombre), str(nombre))


# ---------------------------------------------------------------- narración de la jugada

_NOMBRE = r"[A-Z][a-z]?\.\s?[A-Za-z][A-Za-z'\-]+(?:\s(?:Jr|Sr|II|III|IV)\.?)?"
_SUFIJOS = re.compile(r"^(jr\.?|sr\.?|ii|iii|iv|v)$", re.I)
_DIRECCION = {"left": "por la izquierda", "middle": "por el centro", "right": "por la derecha"}
_PROFUNDIDAD = {"short": "corto", "deep": "largo"}


def _clave(n: str) -> tuple[str, str]:
    """'Z.Pascal' / 'Odell Beckham Jr.' -> (inicial, apellido en minúsculas)."""
    partes = [p for p in re.split(r"[.\s]+", n.strip()) if p]
    while len(partes) > 1 and _SUFIJOS.match(partes[-1]):
        partes.pop()
    if not partes:
        return ("", "")
    return (partes[0][0].lower(), partes[-1].lower())


class Nombres:
    """Expande 'C.Wentz' a 'Carson Wentz' usando los jugadores que participaron en la jugada."""

    def __init__(self, completos: list[str]):
        self.mapa: dict[tuple[str, str], str] = {}
        for c in completos:
            self.mapa.setdefault(_clave(c), c)

    def __call__(self, corto: str | None) -> str:
        if not corto:
            return ""
        corto = corto.strip().rstrip(".")
        if " " in corto and "." not in corto:
            return corto  # ya viene completo
        inicial, apellido = _clave(corto)
        return self.mapa.get((inicial, apellido), corto.replace(".", ". ", 1) if "." in corto else corto)


def _lugar_final(texto: str) -> str:
    m = re.search(r"\bto ([A-Z]{2,3}) (\d{1,2})\b(?= for)", texto) or re.search(
        r"\bat ([A-Z]{2,3}) (\d{1,2})\b(?= for)", texto)
    return f"hasta la yarda {m.group(2)} {de_los(m.group(1))}" if m else ""


def _derribadores(texto: str, nombres: Nombres) -> list[str]:
    """Defensores entre paréntesis al final de la jugada: '(L.Wilson; V.Bell)'."""
    m = re.findall(r"\(([^()]*?)\)", texto.split("PENALTY")[0])
    for grupo in reversed(m):
        encontrados = re.findall(_NOMBRE, grupo)
        if encontrados and "Shotgun" not in grupo and "Huddle" not in grupo:
            return [nombres(x) for x in encontrados]
    return []


def narrar(texto: str, resultado: str | None, yardas: int, nombres: Nombres, qb: str = "") -> str:
    """Explica en español qué pasó, a partir del texto en inglés de la base."""
    t = re.sub(r"\s+", " ", str(texto)).strip()
    t = re.sub(r"^\(\d*:?\d+\)\s*", "", t)
    t = re.sub(r"^(\([^)]*(?:Shotgun|Huddle)[^)]*\)\s*)+", "", t)

    # intento de conversión de dos puntos
    if t.startswith("TWO-POINT"):
        quien = re.search(rf"({_NOMBRE})", t.split(".", 1)[1] if "." in t else t)
        suj = nombres(quien.group(1)) if quien else (qb or "El quarterback")
        bien = "SUCCEEDS" in t
        return f"Intento de conversión de dos puntos de {suj}: " + ("salió bien y suman 2 puntos." if bien else "no salió bien y no suman puntos.")

    principal = t.split("PENALTY")[0].strip()
    hay_penal = "PENALTY" in t
    td = "TOUCHDOWN" in t
    que = qb or ""
    partes: list[str] = []

    m_qb = re.match(rf"({_NOMBRE})", principal)
    nombre_qb = nombres(m_qb.group(1)) if m_qb else (que or "El quarterback")
    anulada = "No Play" in t

    if " sacked " in principal:
        perdida = re.search(r"for (-?\d+) yards?", principal)
        pierde = abs(int(perdida.group(1))) if perdida else abs(int(yardas))
        der = _derribadores(principal, nombres)
        quien = f" por {unir(der)}" if der else ""
        partes.append(f"{nombre_qb} fue derribado{quien} antes de lanzar, con pérdida de {yardas_texto(pierde)}.")
    elif "INTERCEPTED" in principal:
        m_int = re.search(rf"INTERCEPTED by ({_NOMBRE})", principal)
        m_rec = re.search(rf"intended for ({_NOMBRE})", principal)
        prof = re.search(r"\b(short|deep)\b", principal)
        dire = re.search(r"\b(left|middle|right)\b", principal)
        forma = " ".join(x for x in [
            f"{_PROFUNDIDAD[prof.group(1)]}" if prof else "",
            _DIRECCION[dire.group(1)] if dire else ""] if x)
        busca = f" buscando a {nombres(m_rec.group(1))}" if m_rec else ""
        quien = nombres(m_int.group(1)) if m_int else "un defensor"
        frase = f"{nombre_qb} lanzó un pase {forma}{busca}, pero {quien} lo interceptó."
        regreso = re.findall(r"for (-?\d+) yards?", principal)
        if regreso and int(regreso[-1]) > 0:
            frase += f" Lo regresó {yardas_texto(int(regreso[-1]))}."
        partes.append(re.sub(r"\s+", " ", frase).replace("pase ,", "pase,"))
    elif "scrambles" in principal:
        gan = re.search(r"for (-?\d+) yards?", principal)
        n = int(gan.group(1)) if gan else int(yardas)
        accion = f"ganó {yardas_texto(n)}" if n > 0 else (f"perdió {yardas_texto(n)}" if n < 0 else "no ganó yardas")
        partes.append(f"{nombre_qb} salió de la bolsa de protección y corrió con el balón: {accion}.")
        der = _derribadores(principal, nombres)
        if der:
            partes.append(f"{'Lo detuvo' if len(der) == 1 else 'Lo detuvieron'} {unir(der)}.")
    elif " pass " in principal:
        prof = re.search(r"\b(short|deep)\b", principal)
        dire = re.search(r"\b(left|middle|right)\b", principal)
        forma = " ".join(x for x in [
            _PROFUNDIDAD[prof.group(1)] if prof else "",
            _DIRECCION[dire.group(1)] if dire else ""] if x)
        m_rec = re.search(rf"\bto ({_NOMBRE})", principal)
        rec = nombres(m_rec.group(1)) if m_rec else ""
        incompleto = "incomplete" in principal
        if incompleto:
            hacia = f" hacia {rec}" if rec else ""
            partes.append(re.sub(r"\s+", " ", f"{nombre_qb} lanzó un pase {forma}{hacia}, pero no lo atraparon.").replace("pase ,", "pase,"))
            der = _derribadores(principal, nombres)
            if der:
                partes.append(f"{unir(der)} {'defendió' if len(der) == 1 else 'defendieron'} el pase.")
        else:
            gan = re.search(r"for (-?\d+) yards?", principal)
            n = int(gan.group(1)) if gan else int(yardas)
            quien = f"{rec} lo atrapó" if rec else "un receptor lo atrapó"
            ganancia = (f"ganó {yardas_texto(n)}" if n > 0 else f"perdió {yardas_texto(n)}" if n < 0 else "no ganó yardas")
            partes.append(re.sub(r"\s+", " ", f"{nombre_qb} lanzó un pase {forma}: {quien} y {ganancia}.").replace("pase :", "pase:"))
            lugar = _lugar_final(principal)
            if lugar and not td:
                partes.append(f"Llegó {lugar}.")
            if re.search(r"pushed ob|ran ob|out of bounds", principal):
                partes.append("Salió de la cancha, así que se detuvo el reloj.")
            else:
                der = _derribadores(principal, nombres)
                if der:
                    partes.append(f"{'Lo derribó' if len(der) == 1 else 'Lo derribaron'} {unir(der)}.")
    else:
        return ""  # sin patrón conocido: se usa el texto de respaldo

    if "FUMBLES" in principal:
        partes.append("Hubo un balón suelto (fumble).")
    if td:
        partes.append("¡Touchdown!")
    if anulada:
        partes.append("La jugada se anuló por una penalización.")
    return " ".join(partes)


def respaldo(resultado: str | None, yardas: int, ofensiva: str, qb: str = "") -> str:
    """Texto de emergencia cuando no se pudo interpretar la descripción."""
    y = int(yardas)
    base = {
        "C": f"Pase completo con {'ganancia' if y >= 0 else 'pérdida'} de {yardas_texto(y)}.",
        "I": "Pase incompleto.",
        "S": f"El quarterback fue derribado, con pérdida de {yardas_texto(y)}.",
        "IN": "Pase interceptado.",
        "R": f"El quarterback corrió con el balón: {'ganó' if y >= 0 else 'perdió'} {yardas_texto(y)}.",
    }
    return base.get(str(resultado), "No se pudo describir la jugada.")
