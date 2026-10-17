# Gera dados-geo.js a partir do Natural Earth (domínio público).
import json, math, sys
from shapely.geometry import shape, box, Polygon, MultiPolygon, LineString, MultiLineString
from shapely.ops import unary_union

D = '../data/'
REG = {
  # id: (lon0, lat0, lon1, lat1, tolerância de simplificação em graus)
  'oriente':    (25.0, 24.0, 52.0, 41.0, 0.020),
  'egito':      (28.5, 26.0, 38.0, 34.5, 0.010),
  'terrasanta': (33.9, 30.2, 37.4, 33.8, 0.0022),
  'galileia':   (35.0, 32.55, 36.0, 33.35, 0.0006),
  'mediterraneo': (8.5, 31.0, 39.0, 42.8, 0.014),
  'asiamenor':  (25.0, 36.2, 33.0, 40.4, 0.006),
}
RIVERS_OK = {'Nile','Rosetta Branch','Damietta Branch','Euphrates','Firat','Al Furat','Murat','Tigris','Dicle','Jordan','Shatt al Arab','Aras','Kura','Litani'}
LAKES_OK = {'Sea of Galilee','Dead Sea','Lake Urmia','Lake Van','Lake Tuz','Eğirdir','Beyşehir','Lake Sevan'}

land = json.load(open(D+'ne_10m_land.geojson' if False else D+'land.json', encoding='utf-8'))
lakes = json.load(open(D+'lakes.json', encoding='utf-8'))
rivers = json.load(open(D+'rivers.json', encoding='utf-8'))
landg = unary_union([shape(f['geometry']).buffer(0) for f in land['features']])
lakeg = [(f['properties']['name'], shape(f['geometry']).buffer(0)) for f in lakes['features'] if f['properties']['name'] in LAKES_OK]
riverg = [(f['properties']['name'], shape(f['geometry'])) for f in rivers['features'] if f['properties'].get('name') in RIVERS_OK]

def fmt(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s

def make_proj(lon0, lat0, lon1, lat1):
    c = math.cos(math.radians((lat0 + lat1) / 2))
    S = 1000.0 / ((lon1 - lon0) * c)
    def p(lon, lat):
        return ((lon - lon0) * c * S, (lat1 - lat) * S)
    return c, S, p

def ring_path(coords, p):
    pts = [p(x, y) for x, y in coords]
    out = []
    last = None
    for x, y in pts:
        t = (round(x, 1), round(y, 1))
        if t != last: out.append(t)
        last = t
    if len(out) < 3: return ''
    return 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in out) + 'Z'

def poly_paths(g, p):
    parts = []
    polys = [g] if isinstance(g, Polygon) else [x for x in getattr(g, 'geoms', []) if isinstance(x, Polygon)]
    for pg in polys:
        if pg.is_empty: continue
        parts.append(ring_path(pg.exterior.coords, p))
        for r in pg.interiors: parts.append(ring_path(r.coords, p))
    return ''.join(x for x in parts if x)

def line_paths(g, p):
    lines = [g] if isinstance(g, LineString) else [x for x in getattr(g, 'geoms', []) if isinstance(x, LineString)]
    res = []
    for ln in lines:
        pts = [p(x, y) for x, y in ln.coords]
        if len(pts) < 2: continue
        res.append('M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in pts))
    return ''.join(res)

out = {}
for rid, (lon0, lat0, lon1, lat1, tol) in REG.items():
    c, S, p = make_proj(lon0, lat0, lon1, lat1)
    m_ = 0.30 if rid in ('terrasanta','galileia','egito','asiamenor') else 0.12
    mx, my = (lon1 - lon0) * m_, (lat1 - lat0) * m_
    clip = box(lon0 - mx, lat0 - my, lon1 + mx, lat1 + my)
    lg = landg.intersection(clip).simplify(tol, preserve_topology=True)
    lakes_p = ''
    for n, g in lakeg:
        gg = g.intersection(clip)
        if gg.is_empty: continue
        lakes_p += poly_paths(gg.simplify(tol * 0.6, preserve_topology=True), p)
    riv = ''
    for n, g in riverg:
        gg = g.intersection(clip)
        if gg.is_empty: continue
        riv += line_paths(gg.simplify(tol * 0.8, preserve_topology=True), p)
    W = (lon1 - lon0) * c * S
    H = (lat1 - lat0) * S
    out[rid] = dict(lon0=lon0, lat0=lat0, lon1=lon1, lat1=lat1, c=round(c, 6), S=round(S, 4), W=round(W, 1), H=round(H, 1),
                    terra=poly_paths(lg, p), lagos=lakes_p, rios=riv)
    print(rid, 'W,H', round(W), round(H), 'terra', len(out[rid]['terra']), 'lagos', len(lakes_p), 'rios', len(riv), file=sys.stderr)

js = '/* Base geográfica dos mapas — gerada a partir do Natural Earth (domínio público).\n   Coordenadas: x=(lon-lon0)*c*S, y=(lat1-lat)*S. */\nwindow.GEO_BASE=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
open('dados-geo.js', 'w', encoding='utf-8').write(js)
print('total KB', len(js) / 1024)
