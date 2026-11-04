/* Imagens próprias no texto
   - Ao selecionar um trecho aparece "＋ Imagem" (protegido por senha).
   - A imagem é reduzida, guardada no aparelho (IndexedDB) e pode ser publicada no GitHub
     (pasta imagens/ + imagens/manifest.json), de onde todos os aparelhos a recebem e o
     service worker a guarda para uso sem internet.
   ATENÇÃO: a senha abaixo é só uma trava da interface (guardamos apenas o hash). A proteção
   real do repositório é o token do GitHub, que fica só no aparelho do dono e nunca no código. */
(function () {
  "use strict";

  var SALT = "biblia-img-v1", ITER = 120000;
  var HASH = "4b933a754736d7d7dfcf3f08dc5a46dd024ded6dbbff06293dddad881f8b8114";
  var DB_NAME = "biblia-imagens", STORE = "imgs";
  var CFG_KEY = "biblia_img_gh_v1", DEL_KEY = "biblia_img_del_v1", OK_KEY = "biblia_img_ok";
  var UNLOCK_MS = 30 * 60 * 1000, MAX_DIM = 1600, QUALITY = 0.82;

  var local = [];   // registros do aparelho (com blob)
  var remote = [];  // itens do manifest publicado
  var dbp = null;
  var unlockedMem = 0;

  /* ---------- utilidades ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]; }); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function bookIdx() { try { return BOOKS.indexOf(selectedBook); } catch (e) { return -1; } }
  function chapterNo() { try { return selectedChapter; } catch (e) { return 0; } }
  function bookName(b) { var x = BOOKS[b]; return x ? (x[1] || x[0]) : "?"; }
  function refTxt(it) { return bookName(it.b) + " " + it.c + ":" + it.v; }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }

  var toastEl = null, toastT = 0;
  function toast(t) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "rc-toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = t; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 3800);
  }

  /* ---------- IndexedDB ---------- */
  function openDb() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error("IndexedDB indisponível"));
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: "id" }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(STORE, mode), out = fn(t.objectStore(STORE));
        t.oncomplete = function () { res(out && out.result); };
        t.onerror = t.onabort = function () { rej(t.error); };
      });
    });
  }
  function dbAll() { return tx("readonly", function (s) { return s.getAll(); }); }
  function dbPut(rec) { return tx("readwrite", function (s) { return s.put(rec); }); }
  function dbDel(id) { return tx("readwrite", function (s) { return s.delete(id); }); }

  /* ---------- senha ---------- */
  function hex(u8) { return Array.prototype.map.call(u8, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function derive(pw) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error("Este navegador não permite verificar a senha (precisa de https)."));
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]).then(function (k) {
      return crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(SALT), iterations: ITER, hash: "SHA-256" }, k, 256);
    }).then(function (b) { return hex(new Uint8Array(b)); });
  }
  function isUnlocked() {
    var t = unlockedMem;
    try { t = Math.max(t, +sessionStorage.getItem(OK_KEY) || 0); } catch (e) {}
    return t > Date.now();
  }
  function setUnlocked(on) {
    var t = on ? Date.now() + UNLOCK_MS : 0;
    unlockedMem = t;
    try { if (on) sessionStorage.setItem(OK_KEY, String(t)); else sessionStorage.removeItem(OK_KEY); } catch (e) {}
  }
  var fails = 0, blockedUntil = 0;

  /* ---------- camadas ---------- */
  function layer(cls) {
    var el = document.createElement("div");
    el.className = "im-layer show " + (cls || "");
    document.body.appendChild(el);
    el._close = function () { el.remove(); };
    el.addEventListener("mousedown", function (e) { if (e.target === el && !el._busy) el._close(); });
    return el;
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var ls = document.querySelectorAll(".im-layer");
    var top = ls[ls.length - 1];
    if (top && !top._busy) top._close();
  });

  function gate(cb) {
    if (isUnlocked()) { cb(); return; }
    var L = layer();
    L.innerHTML = '<form class="im-box" autocomplete="off"><h3>Área protegida</h3><p class="im-sub">Digite a senha para adicionar ou gerenciar imagens.</p>' +
      '<label for="imPw">Senha</label><input type="password" id="imPw" autocomplete="off"><div class="im-msg" id="imMsg"></div>' +
      '<div class="im-row"><button type="button" data-x>Cancelar</button><button type="submit" class="primary">Entrar</button></div></form>';
    var f = L.firstChild, pw = f.querySelector("#imPw"), msg = f.querySelector("#imMsg");
    f.querySelector("[data-x]").onclick = function () { L._close(); };
    setTimeout(function () { pw.focus(); }, 50);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (Date.now() < blockedUntil) { msg.textContent = "Muitas tentativas. Aguarde alguns segundos."; return; }
      msg.textContent = "Verificando…";
      derive(pw.value).then(function (h) {
        if (h === HASH) { fails = 0; setUnlocked(true); L._close(); cb(); }
        else {
          fails++; pw.value = "";
          if (fails >= 5) { blockedUntil = Date.now() + 30000; fails = 0; msg.textContent = "Senha incorreta. Aguarde 30 segundos."; }
          else msg.textContent = "Senha incorreta.";
        }
      }).catch(function (er) { msg.textContent = er.message; });
    });
  }

  /* ---------- dados mesclados ---------- */
  function deleted() { return lsGet(DEL_KEY, []); }
  function allItems() {
    var map = {}, del = deleted();
    remote.forEach(function (r) { map[r.id] = { id: r.id, f: r.f, b: r.b, c: r.c, v: r.v, t: r.t || "", url: "imagens/" + r.f, published: true, created: 0 }; });
    local.forEach(function (r) { map[r.id] = { id: r.id, f: r.f, b: r.b, c: r.c, v: r.v, t: r.t || "", url: r._url, published: !!r.published, created: r.created || 0 }; });
    return Object.keys(map).map(function (k) { return map[k]; }).filter(function (i) { return del.indexOf(i.id) < 0; })
      .sort(function (a, b) { return a.b - b.b || a.c - b.c || a.v - b.v || a.created - b.created; });
  }

  /* ---------- exibição no texto ---------- */
  function clearFigs() {
    var vs = $("verses"); if (!vs) return;
    vs.querySelectorAll("figure.img-user").forEach(function (n) { n.remove(); });
  }
  function render() {
    clearFigs();
    var vs = $("verses"), b = bookIdx(), c = chapterNo();
    if (!vs || b < 0) return;
    var list = allItems().filter(function (i) { return i.b === b && i.c === c; });
    if (!list.length) return;
    var vEls = vs.querySelectorAll(".verse");
    if (!vEls.length) return;
    list.forEach(function (it) {
      var fig = document.createElement("figure");
      fig.className = "img-user"; fig.dataset.imgid = it.id; fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", "Ampliar imagem" + (it.t ? ": " + it.t : ""));
      var im = document.createElement("img");
      im.loading = "lazy"; im.alt = it.t || "Imagem"; im.src = it.url;
      var cap = document.createElement("figcaption");
      cap.appendChild(document.createTextNode(it.t || ""));
      var sp = document.createElement("span"); sp.textContent = refTxt(it); cap.appendChild(sp);
      fig.appendChild(im); fig.appendChild(cap);
      var target = vs.querySelector('.verse[data-verse="' + it.v + '"]');
      if (target) target.parentNode.insertBefore(fig, target);
      else vEls[vEls.length - 1].insertAdjacentElement("afterend", fig);
    });
  }

  function lightbox(id) {
    var it = allItems().filter(function (i) { return i.id === id; })[0];
    if (!it) return;
    var L = layer("im-light");
    L.innerHTML = '<button type="button" class="im-x" aria-label="Fechar">×</button><img alt="' + esc(it.t) + '" src="' + esc(it.url) + '">' +
      '<div class="im-cap">' + esc(it.t) + '<span>' + esc(refTxt(it)) + '</span></div>' +
      (isUnlocked() ? '<div class="im-row"><button type="button" class="danger" data-del>Excluir esta imagem</button></div>' : "");
    L.querySelector(".im-x").onclick = function () { L._close(); };
    var d = L.querySelector("[data-del]");
    if (d) d.onclick = function () { apagar(id, L); };
  }

  /* ---------- reduzir imagem ---------- */
  function compress(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, MAX_DIM / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
        var cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
        var x = cv.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, cw, ch); x.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        cv.toBlob(function (b) { b ? res({ blob: b, w: cw, h: ch }) : rej(new Error("Não foi possível processar a imagem.")); }, "image/jpeg", QUALITY);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("Arquivo de imagem não reconhecido.")); };
      img.src = url;
    });
  }

  /* ---------- GitHub ---------- */
  function cfg() { var c = lsGet(CFG_KEY, null); return c && c.repo && c.token ? c : null; }
  function guessRepo() {
    var h = location.hostname, p = location.pathname.split("/")[1] || "";
    if (/\.github\.io$/.test(h)) return h.split(".")[0] + "/" + (p || h);
    return "";
  }
  function gh(path, opt) {
    var c = cfg(); opt = opt || {};
    if (!c) return Promise.reject(new Error("GitHub não configurado."));
    var headers = { Authorization: "Bearer " + c.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (opt.body) headers["Content-Type"] = "application/json";
    return fetch("https://api.github.com/repos/" + c.repo + path, { method: opt.method || "GET", headers: headers, body: opt.body ? JSON.stringify(opt.body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) { var e = new Error(j.message || ("Erro " + r.status)); e.status = r.status; throw e; }
          return j;
        });
      });
  }
  var branchCache = "";
  function branch() {
    var c = cfg();
    if (c && c.branch) return Promise.resolve(c.branch);
    if (branchCache) return Promise.resolve(branchCache);
    return gh("").then(function (j) { branchCache = j.default_branch || "main"; return branchCache; });
  }
  function b64(blob) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(String(fr.result).split(",")[1] || ""); };
      fr.onerror = function () { rej(fr.error); };
      fr.readAsDataURL(blob);
    });
  }
  function utf8b64(s) { return btoa(unescape(encodeURIComponent(s))); }
  function readManifest(br) {
    return gh("/contents/imagens/manifest.json?ref=" + encodeURIComponent(br)).then(function (j) {
      var data = { v: 1, itens: [] };
      try { data = JSON.parse(decodeURIComponent(escape(atob(String(j.content || "").replace(/\s/g, ""))))); } catch (e) {}
      if (!data || !Array.isArray(data.itens)) data = { v: 1, itens: [] };
      return { sha: j.sha, data: data };
    }).catch(function (e) { if (e.status === 404) return { sha: null, data: { v: 1, itens: [] } }; throw e; });
  }
  function updateManifest(br, mutate, msg, tries) {
    tries = tries == null ? 2 : tries;
    return readManifest(br).then(function (m) {
      mutate(m.data);
      var body = { message: msg, content: utf8b64(JSON.stringify(m.data, null, 1) + "\n"), branch: br };
      if (m.sha) body.sha = m.sha;
      return gh("/contents/imagens/manifest.json", { method: "PUT", body: body }).then(function () { return m.data; });
    }).catch(function (e) {
      if ((e.status === 409 || e.status === 422) && tries > 0) return updateManifest(br, mutate, msg, tries - 1);
      throw e;
    });
  }
  function meta(r) { return { id: r.id, f: r.f, b: r.b, c: r.c, v: r.v, t: r.t || "" }; }

  function publishPending(ids, onProg) {
    var pend = local.filter(function (r) { return !r.published && (!ids || ids.indexOf(r.id) >= 0); });
    if (!pend.length) return Promise.resolve(0);
    var br, n = 0;
    return branch().then(function (b) {
      br = b;
      return pend.reduce(function (p, r) {
        return p.then(function () {
          if (onProg) onProg("Enviando imagem " + (++n) + " de " + pend.length + "…");
          return b64(r.blob).then(function (content) {
            return gh("/contents/imagens/" + r.f, { method: "PUT", body: { message: "Adiciona imagem " + r.f, content: content, branch: br } })
              .catch(function (e) { if (e.status !== 422) throw e; /* já existe */ });
          });
        });
      }, Promise.resolve());
    }).then(function () {
      if (onProg) onProg("Atualizando a lista de imagens…");
      return updateManifest(br, function (d) {
        pend.forEach(function (r) {
          d.itens = d.itens.filter(function (i) { return i.id !== r.id; });
          d.itens.push(meta(r));
        });
      }, "Atualiza imagens");
    }).then(function (data) {
      remote = data.itens.slice();
      return Promise.all(pend.map(function (r) { r.published = true; return dbPut(strip(r)); }));
    }).then(function () { return pend.length; });
  }
  function strip(r) { var o = {}; Object.keys(r).forEach(function (k) { if (k !== "_url") o[k] = r[k]; }); return o; }

  function deleteRemote(it) {
    var br;
    return branch().then(function (b) {
      br = b;
      return updateManifest(br, function (d) { d.itens = d.itens.filter(function (i) { return i.id !== it.id; }); }, "Remove imagem " + it.f);
    }).then(function (data) {
      remote = data.itens.slice();
      return gh("/contents/imagens/" + it.f + "?ref=" + encodeURIComponent(br)).then(function (j) {
        return gh("/contents/imagens/" + it.f, { method: "DELETE", body: { message: "Remove imagem " + it.f, sha: j.sha, branch: br } });
      }).catch(function (e) { if (e.status !== 404) throw e; });
    });
  }

  function apagar(id, owner) {
    var it = allItems().filter(function (i) { return i.id === id; })[0];
    if (!it) return Promise.resolve();
    if (!confirm("Excluir esta imagem" + (it.t ? " (“" + it.t + "”)" : "") + "?")) return Promise.resolve();
    var published = it.published || remote.some(function (r) { return r.id === id; });
    var step = Promise.resolve(), note = "";
    if (published) {
      if (cfg()) { toast("Removendo do GitHub…"); step = deleteRemote(it); }
      else { var d = deleted(); d.push(id); lsSet(DEL_KEY, d); note = " (removida só deste aparelho — configure o GitHub para apagar do repositório)"; }
    }
    return step.then(function () {
      var rec = local.filter(function (r) { return r.id === id; })[0];
      local = local.filter(function (r) { return r.id !== id; });
      if (rec && rec._url) URL.revokeObjectURL(rec._url);
      return dbDel(id).catch(function () {});
    }).then(function () {
      render();
      if (owner && owner._close) owner._close();
      toast("Imagem excluída" + note);
      refreshManager();
    }).catch(function (e) { toast("Falha ao excluir: " + e.message); });
  }

  /* ---------- editor (adicionar imagem) ---------- */
  function editor(pos) {
    var nVerses = document.querySelectorAll("#verses .verse").length || pos.v;
    var opts = "";
    for (var i = 1; i <= nVerses; i++) opts += '<option value="' + i + '"' + (i === pos.v ? " selected" : "") + ">Antes do versículo " + i + "</option>";
    var L = layer();
    var hasGh = !!cfg();
    L.innerHTML = '<div class="im-box"><h3>Adicionar imagem</h3><p class="im-sub">' + esc(bookName(pos.b)) + " " + pos.c + ":" + pos.v + (pos.last && pos.last !== pos.v ? "–" + pos.last : "") + '</p>' +
      '<label for="imFile">Imagem (da galeria, câmera ou arquivos)</label><input type="file" id="imFile" accept="image/*">' +
      '<div class="im-prev" id="imPrev"><img alt=""><small></small></div>' +
      '<label for="imCap">Legenda (opcional)</label><input type="text" id="imCap" maxlength="160" placeholder="Ex.: Mapa da região">' +
      '<label for="imPos">Posição no texto</label><select id="imPos">' + opts + '</select>' +
      '<label class="im-check"><input type="checkbox" id="imPub"' + (hasGh ? " checked" : " disabled") + '> Publicar no GitHub agora' + (hasGh ? "" : " (configure em Menu ⋮ → Imagens próprias)") + '</label>' +
      '<div class="im-msg" id="imMsg"></div>' +
      '<div class="im-row"><button type="button" data-x>Cancelar</button><button type="button" class="primary" id="imSave" disabled>Salvar</button></div></div>';
    var box = L.firstChild, file = box.querySelector("#imFile"), prev = box.querySelector("#imPrev"), msg = box.querySelector("#imMsg"), save = box.querySelector("#imSave");
    var proc = null, prevUrl = "";
    box.querySelector("[data-x]").onclick = function () { if (prevUrl) URL.revokeObjectURL(prevUrl); L._close(); };
    file.onchange = function () {
      var f = file.files && file.files[0];
      proc = null; save.disabled = true; prev.style.display = "none"; msg.className = "im-msg"; msg.textContent = "";
      if (!f) return;
      if (!/^image\//.test(f.type)) { msg.textContent = "Escolha um arquivo de imagem."; return; }
      msg.textContent = "Processando…";
      compress(f).then(function (r) {
        proc = r; if (prevUrl) URL.revokeObjectURL(prevUrl);
        prevUrl = URL.createObjectURL(r.blob);
        prev.querySelector("img").src = prevUrl;
        prev.querySelector("small").textContent = r.w + "×" + r.h + " • " + kb(r.blob.size) + " (reduzida)";
        prev.style.display = "block"; msg.textContent = ""; save.disabled = false;
      }).catch(function (e) { msg.textContent = e.message; });
    };
    save.onclick = function () {
      if (!proc) return;
      var id = newId();
      var rec = { id: id, f: "img-" + id + ".jpg", b: pos.b, c: pos.c, v: +box.querySelector("#imPos").value, t: box.querySelector("#imCap").value.trim(), blob: proc.blob, published: false, created: Date.now() };
      var wantPub = box.querySelector("#imPub").checked && !!cfg();
      L._busy = true; save.disabled = true; msg.className = "im-msg"; msg.textContent = "Salvando no aparelho…";
      dbPut(rec).then(function () {
        rec._url = URL.createObjectURL(rec.blob); local.push(rec); render();
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        if (!wantPub) { L._close(); toast(cfg() ? "Imagem salva neste aparelho." : "Imagem salva neste aparelho. Para enviar ao GitHub: Menu ⋮ → Imagens próprias."); return; }
        return publishPending([id], function (t) { msg.textContent = t; }).then(function () {
          L._close(); toast("Imagem salva e publicada no GitHub. O site atualiza em cerca de 1 minuto.");
        }).catch(function (e) {
          L._busy = false; L._close(); toast("Salva no aparelho, mas a publicação falhou: " + e.message);
        });
      }).catch(function (e) { L._busy = false; save.disabled = false; msg.textContent = "Erro ao salvar: " + e.message; });
    };
  }

  /* ---------- configuração do GitHub ---------- */
  function configDialog(after) {
    var c = lsGet(CFG_KEY, {}) || {};
    var L = layer();
    L.innerHTML = '<form class="im-box" autocomplete="off"><h3>Conexão com o GitHub</h3>' +
      '<p class="im-sub">Para publicar imagens no repositório, crie um token em GitHub → Settings → Developer settings → Fine-grained tokens, com acesso só a este repositório e permissão <b>Contents: Read and write</b>. O token fica guardado somente neste aparelho.</p>' +
      '<label for="ghRepo">Repositório (usuário/nome)</label><input type="text" id="ghRepo" value="' + esc(c.repo || guessRepo()) + '" placeholder="usuario/repositorio">' +
      '<label for="ghBr">Branch (vazio = padrão)</label><input type="text" id="ghBr" value="' + esc(c.branch || "") + '" placeholder="main">' +
      '<label for="ghTok">Token</label><input type="password" id="ghTok" value="' + esc(c.token || "") + '" autocomplete="off">' +
      '<div class="im-msg" id="imMsg"></div>' +
      '<div class="im-row">' + (c.token ? '<button type="button" class="danger" data-rm>Remover token</button>' : "") + '<button type="button" data-x>Cancelar</button><button type="submit" class="primary">Salvar e testar</button></div></form>';
    var f = L.firstChild, msg = f.querySelector("#imMsg");
    f.querySelector("[data-x]").onclick = function () { L._close(); };
    var rm = f.querySelector("[data-rm]");
    if (rm) rm.onclick = function () { try { localStorage.removeItem(CFG_KEY); } catch (e) {} branchCache = ""; L._close(); toast("Token removido deste aparelho."); refreshManager(); };
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var repo = f.querySelector("#ghRepo").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
      var tok = f.querySelector("#ghTok").value.trim(), br = f.querySelector("#ghBr").value.trim();
      if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !tok) { msg.className = "im-msg"; msg.textContent = "Informe o repositório (usuario/nome) e o token."; return; }
      lsSet(CFG_KEY, { repo: repo, branch: br, token: tok }); branchCache = "";
      msg.className = "im-msg"; msg.textContent = "Testando…";
      gh("").then(function (j) {
        if (j.permissions && !j.permissions.push) throw new Error("O token não tem permissão de escrita neste repositório.");
        msg.className = "im-msg ok"; msg.textContent = "Conectado a " + j.full_name + ".";
        setTimeout(function () { L._close(); refreshManager(); if (after) after(); }, 700);
      }).catch(function (er) { msg.className = "im-msg"; msg.textContent = "Falhou: " + er.message; });
    });
  }

  /* ---------- pacote .zip (envio manual) ---------- */
  var crcT = null;
  function crc32(u8) {
    if (!crcT) { crcT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; } }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) crc = crcT[(crc ^ u8[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], cen = [], off = 0, cenSize = 0;
    files.forEach(function (f) {
      var nb = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true);
      lh.setUint32(22, sz, true); lh.setUint16(26, nb.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, nb, f.data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, off, true);
      cen.push(ch.buffer, nb); cenSize += 46 + nb.length;
      off += 30 + nb.length + sz;
    });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cenSize, true); end.setUint32(16, off, true);
    return new Blob(parts.concat(cen, [end.buffer]), { type: "application/zip" });
  }
  function baixarPacote() {
    var pend = local.filter(function (r) { return !r.published; });
    if (!pend.length) { toast("Não há imagens pendentes."); return; }
    Promise.all(pend.map(function (r) { return r.blob.arrayBuffer(); })).then(function (bufs) {
      var files = pend.map(function (r, i) { return { name: "imagens/" + r.f, data: new Uint8Array(bufs[i]) }; });
      var itens = remote.filter(function (i) { return !pend.some(function (r) { return r.id === i.id; }); }).concat(pend.map(meta));
      files.push({ name: "imagens/manifest.json", data: new TextEncoder().encode(JSON.stringify({ v: 1, itens: itens }, null, 1) + "\n") });
      var url = URL.createObjectURL(makeZip(files)), a = document.createElement("a");
      a.href = url; a.download = "imagens-biblia.zip"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast("Pacote gerado: descompacte na raiz do repositório e envie ao GitHub.");
    }).catch(function (e) { toast("Falha ao gerar o pacote: " + e.message); });
  }

  /* ---------- gerenciador ---------- */
  var mgr = null;
  function refreshManager() { if (mgr && document.body.contains(mgr)) fillManager(); }
  function fillManager() {
    var items = allItems(), pend = local.filter(function (r) { return !r.published; }).length;
    var h = '<div class="im-box"><h3>Imagens próprias</h3><p class="im-sub">' + items.length + " imagem(ns) • " + pend + " ainda não publicada(s) no GitHub • GitHub " + (cfg() ? "conectado" : "não configurado") + '</p><div class="im-list">';
    if (!items.length) h += '<p class="im-sub">Nenhuma imagem ainda. Selecione um trecho do texto e toque em “＋ Imagem”.</p>';
    items.forEach(function (it) {
      h += '<div class="im-item"><img alt="" src="' + esc(it.url) + '"><div class="im-t"><b>' + esc(it.t || "(sem legenda)") + "</b><span>" + esc(refTxt(it)) + '</span><em class="' + (it.published ? "ok" : "pend") + '">' + (it.published ? "publicada" : "só neste aparelho") + '</em></div><button type="button" data-del="' + esc(it.id) + '">Excluir</button></div>';
    });
    h += '</div><div class="im-tools"><button type="button" class="im-btn primary" data-pub' + (pend ? "" : " disabled") + '>Publicar pendentes no GitHub</button>' +
      '<button type="button" class="im-btn" data-zip' + (pend ? "" : " disabled") + '>Baixar pacote .zip</button>' +
      '<button type="button" class="im-btn" data-cfg>Conexão com o GitHub</button></div><div class="im-msg" id="imMsg"></div>' +
      '<div class="im-row"><button type="button" data-lock>Bloquear</button><button type="button" class="primary" data-x>Fechar</button></div></div>';
    mgr.innerHTML = h;
    var box = mgr.firstChild;
    box.querySelector("[data-x]").onclick = function () { mgr._close(); };
    box.querySelector("[data-lock]").onclick = function () { setUnlocked(false); mgr._close(); toast("Área bloqueada."); };
    box.querySelector("[data-cfg]").onclick = function () { configDialog(); };
    box.querySelector("[data-zip]").onclick = baixarPacote;
    box.querySelector("[data-pub]").onclick = function () {
      if (!cfg()) { configDialog(function () { box.querySelector("[data-pub]").click(); }); return; }
      var msg = box.querySelector("#imMsg"); mgr._busy = true; msg.className = "im-msg"; msg.textContent = "Publicando…";
      publishPending(null, function (t) { msg.textContent = t; }).then(function (n) {
        mgr._busy = false; toast(n + " imagem(ns) publicada(s). O site atualiza em cerca de 1 minuto."); fillManager();
      }).catch(function (e) { mgr._busy = false; msg.textContent = "Falha: " + e.message; });
    };
    box.querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { apagar(b.getAttribute("data-del")); }; });
  }
  function openManager() {
    gate(function () {
      if (mgr && document.body.contains(mgr)) mgr._close();
      mgr = layer(); fillManager();
    });
  }

  /* ---------- carregar dados ---------- */
  function loadLocal() {
    return dbAll().then(function (rows) {
      local.forEach(function (r) { if (r._url) URL.revokeObjectURL(r._url); });
      local = (rows || []).map(function (r) { r._url = URL.createObjectURL(r.blob); return r; });
    }).catch(function () { local = []; });
  }
  function prefetch(list) {
    var have = local.map(function (r) { return r.id; });
    list.filter(function (r) { return have.indexOf(r.id) < 0; }).reduce(function (p, r) {
      return p.then(function () { return fetch("imagens/" + r.f).catch(function () {}); });
    }, Promise.resolve());
  }
  function loadRemote() {
    return fetch("imagens/manifest.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && Array.isArray(j.itens)) { remote = j.itens; prefetch(remote); } })
      .catch(function () {});
  }

  /* ---------- seleção: botão ＋ Imagem ---------- */
  var snap = null;
  function takeSnap() {
    try {
      if (typeof pendingSubRanges !== "undefined" && pendingSubRanges && pendingSubRanges.length) {
        var first = pendingSubRanges[0].verseEl, last = pendingSubRanges[pendingSubRanges.length - 1].verseEl;
        return { b: bookIdx(), c: chapterNo(), v: +first.dataset.verse, last: +last.dataset.verse };
      }
    } catch (e) {}
    return null;
  }
  function bindButton() {
    var btn = $("selImgBtn"); if (!btn) return;
    var grab = function () { var s = takeSnap(); if (s) snap = s; };
    btn.addEventListener("pointerdown", grab, true);
    btn.addEventListener("mousedown", grab, true);
    btn.addEventListener("touchstart", grab, { passive: true, capture: true });
    btn.addEventListener("click", function () {
      var s = takeSnap() || snap; snap = null;
      if (!s || s.b < 0) { toast("Selecione um trecho do texto primeiro."); return; }
      try { window.getSelection().removeAllRanges(); if (typeof hideSelectionTool === "function") hideSelectionTool(); } catch (e) {}
      gate(function () { editor(s); });
    });
  }
  function bindMenu() {
    var b = $("manageImgs"); if (!b) return;
    b.addEventListener("click", function () { var m = $("readerMenu"); if (m) m.classList.remove("show"); openManager(); });
  }
  function bindFigures() {
    var vs = $("verses"); if (!vs) return;
    vs.addEventListener("click", function (e) { var f = e.target.closest && e.target.closest("figure.img-user"); if (f) lightbox(f.dataset.imgid); });
    vs.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var f = e.target.closest && e.target.closest("figure.img-user"); if (f) { e.preventDefault(); lightbox(f.dataset.imgid); }
    });
  }

  /* ---------- início ---------- */
  function init() {
    bindButton(); bindMenu(); bindFigures();
    if (window.Recursos && typeof Recursos.aposRenderizar === "function") {
      var orig = Recursos.aposRenderizar;
      Recursos.aposRenderizar = function () { var r = orig.apply(this, arguments); render(); return r; };
    }
    loadLocal().then(function () { render(); return loadRemote(); }).then(render);
    window.addEventListener("online", function () { loadRemote().then(render); });
  }
  window.Imagens = { aposRenderizar: render, gerenciar: openManager };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
