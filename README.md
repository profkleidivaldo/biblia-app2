# Bíblia Sagrada — leitura (ACF, AA, NVI)

App web (PWA) de leitura da Bíblia, offline, com destaques, progresso e comparação de versões.

## Novidades
- **Mapas bíblicos** (aba *Mapas*): 9 mapas interativos (patriarcas, Êxodo, conquista e tribos, reino dividido, exílio, Terra Santa no tempo de Jesus, Galileia, viagens de Paulo, sete igrejas). Zoom/arrastar, rotas ligáveis, toque no lugar para ver a história e abrir a passagem. Mapas relacionados aparecem como botão dentro do capítulo.
- **Ilustrações** (aba *Ilustrações*): 29 cenas em estilo de gravura (sépia, sóbrias), geradas em SVG. Aparecem dentro do capítulo, no versículo da cena; toque para ampliar. Dá para desligar no menu ⋮.
- **Ligações entre textos** (aba *Temas* e marcador 🔗 nos versículos): 139 grupos curados — temas, passagens paralelas (evangelhos, Reis/Crônicas…) e profecia/cumprimento. Mostra o texto na versão escolhida, abre a passagem e salva para sermão.

- **Imagens próprias** (protegidas por senha): selecione um trecho e toque em **＋ Imagem** (ao lado de *Destacar*). A imagem entra antes do versículo escolhido, fica salva no aparelho e pode ser publicada no GitHub para aparecer em todos os aparelhos e funcionar offline. Gerenciar: menu ⋮ → *Imagens próprias*.

## Imagens próprias — como funciona
1. Envie também a pasta `imagens/` (com `imagens/manifest.json`) para o repositório.
2. No menu ⋮ → *Imagens próprias* → *Conexão com o GitHub*: informe `usuario/repositorio` e um token.
   - Crie em GitHub → Settings → Developer settings → *Fine-grained tokens*, acesso **somente a este repositório**, permissão **Contents: Read and write**.
   - O token fica guardado só no aparelho (localStorage); nunca vai para o código.
3. Ao adicionar uma imagem, ela é reduzida (máx. 1600 px, JPEG), salva no aparelho e (se marcado) enviada para `imagens/` + `imagens/manifest.json`. O site atualiza em ~1 minuto.
4. Sem token: a imagem fica só no aparelho; use *Baixar pacote .zip*, descompacte na raiz do repositório e envie pelo GitHub.
5. As imagens publicadas são baixadas e guardadas pelo service worker (cache `biblia-imagens-v1`) para abrir sem internet.

**Sobre a senha:** ela só esconde os botões (o código guarda apenas o hash). Como o site é público, quem entende de programação pode contornar essa trava na própria tela dele, mas **não consegue alterar o repositório sem o token**. Por isso, nunca compartilhe o token.

## Publicar no GitHub Pages
1. Envie **todos** os arquivos desta pasta para a raiz do repositório.
2. *Settings → Pages → Deploy from a branch → main / (root)*.
3. Abra `https://SEU-USUARIO.github.io/SEU-REPO/`. Ao atualizar, o service worker troca o cache (`biblia-shell-v4`).

## Estrutura
| Arquivo | Função |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest` | app e modo offline |
| `recursos.js` / `recursos.css` | interface de mapas, galeria, ligações |
| `dados-mapas.js` | lugares (lat/lon), rotas, rótulos |
| `dados-geo.js` | costas, lagos e rios (gerado) |
| `dados-ligacoes.js` | grupos de ligações |
| `arte.js` | motor e cenas das ilustrações |
| `imagens.js` / `imagens.css` | imagens próprias (senha, salvar, publicar) |
| `imagens/manifest.json` | lista das imagens publicadas (+ os arquivos `img-*.jpg`) |
| `tools/build_geo.py` | regenera `dados-geo.js` (precisa do Natural Earth 10m) |
| `tools/validate.js` | confere se todas as referências existem nas 3 versões |

## Créditos e licenças
- Textos bíblicos: projeto thiagobodruk/biblia (CC BY-NC).
- Base dos mapas: Natural Earth (domínio público). Localizações antigas são aproximadas.
- Ilustrações e dados de ligações: criados para este projeto.
