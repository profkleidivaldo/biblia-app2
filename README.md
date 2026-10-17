# Bíblia Sagrada — leitura (ACF, AA, NVI)

App web (PWA) de leitura da Bíblia, offline, com destaques, progresso e comparação de versões.

## Novidades
- **Mapas bíblicos** (aba *Mapas*): 9 mapas interativos (patriarcas, Êxodo, conquista e tribos, reino dividido, exílio, Terra Santa no tempo de Jesus, Galileia, viagens de Paulo, sete igrejas). Zoom/arrastar, rotas ligáveis, toque no lugar para ver a história e abrir a passagem. Mapas relacionados aparecem como botão dentro do capítulo.
- **Ilustrações** (aba *Ilustrações*): 29 cenas em estilo de gravura (sépia, sóbrias), geradas em SVG. Aparecem dentro do capítulo, no versículo da cena; toque para ampliar. Dá para desligar no menu ⋮.
- **Ligações entre textos** (aba *Temas* e marcador 🔗 nos versículos): 139 grupos curados — temas, passagens paralelas (evangelhos, Reis/Crônicas…) e profecia/cumprimento. Mostra o texto na versão escolhida, abre a passagem e salva para sermão.

## Publicar no GitHub Pages
1. Envie **todos** os arquivos desta pasta para a raiz do repositório.
2. *Settings → Pages → Deploy from a branch → main / (root)*.
3. Abra `https://SEU-USUARIO.github.io/SEU-REPO/`. Ao atualizar, o service worker troca o cache (`biblia-shell-v3`).

## Estrutura
| Arquivo | Função |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest` | app e modo offline |
| `recursos.js` / `recursos.css` | interface de mapas, galeria, ligações |
| `dados-mapas.js` | lugares (lat/lon), rotas, rótulos |
| `dados-geo.js` | costas, lagos e rios (gerado) |
| `dados-ligacoes.js` | grupos de ligações |
| `arte.js` | motor e cenas das ilustrações |
| `tools/build_geo.py` | regenera `dados-geo.js` (precisa do Natural Earth 10m) |
| `tools/validate.js` | confere se todas as referências existem nas 3 versões |

## Créditos e licenças
- Textos bíblicos: projeto thiagobodruk/biblia (CC BY-NC).
- Base dos mapas: Natural Earth (domínio público). Localizações antigas são aproximadas.
- Ilustrações e dados de ligações: criados para este projeto.
