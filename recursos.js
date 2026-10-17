/* Mapas bíblicos, ilustrações e ligações entre textos.
   Usa as variáveis globais do app (BOOKS, selectedBook, versionData, loadVersion, ...). */
(function(){
"use strict";
var SVGNS="http://www.w3.org/2000/svg";
var ICON={
  link:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  map:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  img:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/></svg>',
  book:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
  save:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>'
};
var STORE_PREF="biblia_recursos_v1";
var pref=(function(){var p=safeRead(STORE_PREF,{});return {ilus:p.ilus!==false,ligs:p.ligs!==false};})();
function esc(s){return escapeHtml(s);}
function $q(s,r){return (r||document).querySelector(s);}

/* ---------- referências ---------- */
var RE=/^((?:[123]\s?)?[A-Za-zÀ-ÿ]+)\s+(\d+)(?::(\d+))?(?:\s*[-–]\s*(?:(\d+):)?(\d+))?$/;
var BIDX={};
BOOKS.forEach(function(b,i){BIDX[b[0].toLowerCase()]=i;});
function parseRef(s){
  var m=RE.exec(String(s).trim());if(!m)return null;
  var b=BIDX[m[1].toLowerCase()];if(b==null)return null;
  var c1=+m[2],v1=m[3]?+m[3]:null,c2=c1,v2=null;
  if(m[3]){if(m[5]){if(m[4]){c2=+m[4];v2=+m[5];}else v2=+m[5];}else v2=v1;}
  else if(m[5])c2=+m[5];
  return {b:b,c1:c1,v1:v1,c2:c2,v2:v2};
}
function rotulo(p){
  var n=BOOKS[p.b][1];
  if(p.v1==null)return p.c2!==p.c1?n+" "+p.c1+"–"+p.c2:n+" "+p.c1;
  if(p.c2!==p.c1)return n+" "+p.c1+":"+p.v1+"–"+p.c2+":"+p.v2;
  return p.v2===p.v1?n+" "+p.c1+":"+p.v1:n+" "+p.c1+":"+p.v1+"–"+p.v2;
}
function segmentos(p){
  var out=[],c;
  for(c=p.c1;c<=p.c2;c++){
    var vs=(c===p.c1&&p.v1!=null)?p.v1:1,ve=(c===p.c2&&p.v2!=null)?p.v2:null;
    out.push({c:c,vs:vs,ve:ve});
  }
  return out;
}
function textoDe(p,max){
  return loadVersion(currentVersion).then(function(data){
    var res=[],total=0,seg=segmentos(p),i,v;
    for(i=0;i<seg.length;i++){
      var arr=data[p.b]&&data[p.b][seg[i].c-1]||[];
      var ve=seg[i].ve==null?arr.length:Math.min(seg[i].ve,arr.length);
      for(v=seg[i].vs;v<=ve;v++){total++;if(res.length<max)res.push({c:seg[i].c,v:v,t:String(arr[v-1]||"").trim()});}
    }
    return {itens:res,total:total};
  });
}
function irPara(b,c,v){
  fecharTudo();
  selectedBook=BOOKS[b];
  openChapter(c);
  if(!v)return;
  var tries=0;
  (function espera(){
    var el=verses.querySelector('.verse[data-verse="'+v+'"]');
    if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.style.boxShadow="inset 4px 0 0 var(--accent)";setTimeout(function(){el.style.boxShadow="";},2400);return;}
    if(++tries<40)setTimeout(espera,150);
  })();
}
function irRef(s){var p=parseRef(s);if(p)irPara(p.b,p.c1,p.v1||1);}
var toastEl=null,toastT=null;
function toast(t){
  if(!toastEl){toastEl=document.createElement("div");toastEl.className="rc-toast";toastEl.setAttribute("role","status");document.body.appendChild(toastEl);}
  toastEl.textContent=t;toastEl.classList.add("show");clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove("show");},2400);
}
function salvarSermao(p){
  textoDe(p,12).then(function(r){
    var key="biblia_sermao_v1",data=safeRead(key,{theme:"",verses:[]}),ver=getVersion(currentVersion).short,n=0;
    r.itens.forEach(function(x){
      var book=BOOKS[p.b][1];
      if(!data.verses.some(function(v){return v.book===book&&v.chapter===x.c&&v.verse===x.v&&(v.version||"")===ver;})){data.verses.push({book:book,chapter:x.c,verse:x.v,text:x.t,version:ver});n++;}
    });
    save(key,data);
    toast(n?n+" versículo(s) salvo(s) para o sermão.":"Já estava salvo para o sermão.");
  }).catch(function(){toast("Não foi possível carregar o texto.");});
}

/* ---------- índice das ligações ---------- */
var GR=window.LIGACOES||[],GBY={},IDX={};
var TIPO={tema:"Tema",paralelo:"Paralelo",profecia:"Profecia"};
GR.forEach(function(g){
  g.refs=[];
  g.r.forEach(function(r){
    var ref=Array.isArray(r)?r[0]:r,p=parseRef(ref);
    if(!p)return;
    p.role=Array.isArray(r)?r[1]:null;
    g.refs.push(p);
  });
  GBY[g.id]=g;
  g.refs.forEach(function(p,i){
    segmentos(p).forEach(function(s){
      var k=p.b+"|"+s.c;(IDX[k]=IDX[k]||[]).push({g:g,i:i,vs:s.vs,ve:s.ve,whole:p.v1==null});
    });
  });
});
function ligsDoCapitulo(b,c){
  var l=IDX[b+"|"+c]||[],seen={},out=[];
  l.forEach(function(e){if(!seen[e.g.id]){seen[e.g.id]=1;out.push(e.g);}});
  return out;
}
function ligsDoVerso(b,c,v){
  var l=IDX[b+"|"+c]||[],seen={},out=[];
  l.forEach(function(e){if(!e.whole&&v>=e.vs&&(e.ve==null||v<=e.ve)&&!seen[e.g.id]){seen[e.g.id]=1;out.push(e.g);}});
  return out;
}

/* ---------- folha de ligações ---------- */
var sheet=document.createElement("div");
sheet.className="lk-sheet";sheet.id="linkSheet";
sheet.innerHTML='<div class="lk-panel" role="dialog" aria-modal="true"><div class="lk-head"><button class="lk-btn" type="button" id="lkBack" aria-label="Voltar" hidden>‹</button><h3 id="lkTitle"></h3><button class="lk-btn" type="button" id="lkClose" aria-label="Fechar">×</button></div><div id="lkBody"></div></div>';
document.body.appendChild(sheet);
var stack=[];
function sheetShow(titulo,html,wire,push){
  if(push)stack.push({titulo:titulo,html:html,wire:wire});
  $q("#lkTitle").textContent=titulo;
  var body=$q("#lkBody");body.innerHTML=html;
  $q("#lkBack").hidden=stack.length<2;
  if(wire)wire(body);
  sheet.classList.add("show");
  $q(".lk-panel",sheet).scrollTop=0;
}
function sheetBack(){
  if(stack.length>1){stack.pop();var t=stack[stack.length-1];sheetShow(t.titulo,t.html,t.wire,false);}
}
function sheetClose(){sheet.classList.remove("show");stack=[];}
$q("#lkClose").addEventListener("click",sheetClose);
$q("#lkBack").addEventListener("click",sheetBack);
sheet.addEventListener("click",function(e){if(e.target===sheet)sheetClose();});

function badge(g){return '<span class="lk-badge '+g.tipo+'">'+TIPO[g.tipo]+'</span>';}
function cardsGrupos(lista){
  if(!lista.length)return '<div class="lk-empty">Nenhuma ligação cadastrada para esta passagem.</div>';
  return lista.map(function(g){
    var refs=g.refs.slice(0,4).map(rotulo).join(" · ");
    return '<button type="button" class="tm-item" data-g="'+g.id+'">'+badge(g)+'<strong>'+esc(g.n)+'</strong><small>'+esc(g.d)+'</small><div class="refs">'+esc(refs)+(g.refs.length>4?" …":"")+'</div></button>';
  }).join("");
}
function wireGrupos(ctx){
  return function(body){body.querySelectorAll("[data-g]").forEach(function(b){b.addEventListener("click",function(){vistaGrupo(GBY[b.dataset.g],ctx,true);});});};
}
function vistaLista(titulo,lista,ctx,intro){
  sheetShow(titulo,(intro?'<p class="lk-desc">'+intro+'</p>':'')+cardsGrupos(lista),wireGrupos(ctx),true);
}
function vistaGrupo(g,ctx,push){
  var html='<div>'+badge(g)+'</div><p class="lk-desc" style="margin-top:8px">'+esc(g.d)+'</p>';
  if(g.mapa){var m=mapaPorId(g.mapa);if(m)html+='<div class="lk-actions" style="margin:0 0 6px"><button type="button" data-mapa="'+g.mapa+'">'+ICON.map+'Ver no mapa: '+esc(m.t)+'</button></div>';}
  g.refs.forEach(function(p,i){
    var aqui=ctx&&ctx.b===p.b&&ctx.c>=p.c1&&ctx.c<=p.c2;
    html+='<div class="lk-item'+(aqui?' here':'')+'" data-i="'+i+'"><h4>'+esc(rotulo(p))+(p.role?'<span class="lk-badge role">'+esc(p.role)+'</span>':'')+(aqui?'<span class="lk-badge aqui">neste capítulo</span>':'')+'</h4><div class="lk-load">Carregando texto…</div><div class="lk-actions"><button type="button" class="primary" data-ab="'+i+'">'+ICON.book+'Abrir</button><button type="button" data-sv="'+i+'">'+ICON.save+'Salvar para sermão</button></div></div>';
  });
  sheetShow(g.n,html,function(body){
    body.querySelectorAll("[data-ab]").forEach(function(b){b.addEventListener("click",function(){var p=g.refs[+b.dataset.ab];irPara(p.b,p.c1,p.v1||1);});});
    body.querySelectorAll("[data-sv]").forEach(function(b){b.addEventListener("click",function(){salvarSermao(g.refs[+b.dataset.sv]);});});
    body.querySelectorAll("[data-mapa]").forEach(function(b){b.addEventListener("click",function(){abrirMapa(b.dataset.mapa);});});
    g.refs.forEach(function(p,i){
      var box=$q('.lk-item[data-i="'+i+'"] .lk-load',body);
      if(!box)return;
      textoDe(p,6).then(function(r){
        if(!box.isConnected)return;
        var lastC=null,h='';
        r.itens.forEach(function(x){
          if(p.c1!==p.c2&&x.c!==lastC){h+=(lastC!==null?' ':'')+'<sup>'+x.c+':'+x.v+'</sup>';lastC=x.c;}
          else h+='<sup>'+x.v+'</sup>';
          h+=esc(x.t)+' ';
        });
        var more=r.total>r.itens.length?'<div class="lk-more">+ '+(r.total-r.itens.length)+' versículo(s) — toque em Abrir para ler tudo</div>':'';
        var div=document.createElement("div");div.innerHTML='<p>'+(h||'Texto indisponível nesta versão.')+'</p>'+more;
        box.replaceWith(div);
      }).catch(function(){if(box.isConnected)box.textContent="Sem conexão para carregar a versão "+getVersion(currentVersion).short+".";});
    });
  },push!==false);
}
function abrirVerso(b,c,v){
  var l=ligsDoVerso(b,c,v),ctx={b:b,c:c,v:v};
  stack=[];
  if(l.length===1){vistaGrupo(l[0],ctx,true);return;}
  vistaLista(BOOKS[b][1]+" "+c+":"+v,l,ctx,"Textos que tratam do mesmo assunto deste versículo.");
}
function abrirCapitulo(){
  var b=BOOKS.indexOf(selectedBook),c=selectedChapter,l=ligsDoCapitulo(b,c);
  stack=[];
  vistaLista("Ligações em "+selectedBook[1]+" "+c,l,{b:b,c:c},"Temas, passagens paralelas e profecias relacionadas a este capítulo.");
}

/* ---------- ilustrações ---------- */
var IL=(window.ARTE&&ARTE.itens)||[],ILBY={};
IL.forEach(function(i){i.pa=i.a.map(parseRef).filter(Boolean);i.pr=parseRef(i.ref);ILBY[i.id]=i;});
function ilusDoCapitulo(b,c){return IL.filter(function(i){return i.pa.some(function(p){return p.b===b&&p.c1===c;});});}
function figuraHtml(i){
  return '<figure class="ill" data-ill="'+i.id+'" role="button" tabindex="0" aria-label="Ampliar ilustração: '+esc(i.t)+'"><div class="ill-art">'+ARTE.desenhar(i.id)+'</div><figcaption>'+esc(i.t)+'<span>'+esc(i.ref)+'</span></figcaption></figure>';
}
var lb=document.createElement("div");
lb.className="il-sheet";lb.id="ilusSheet";
lb.innerHTML='<button class="il-close" type="button" aria-label="Fechar">×</button><div class="il-box" role="dialog" aria-modal="true"><div class="il-art" id="ilArt"></div><div class="il-info"><h3 id="ilTit"></h3><div class="ref" id="ilRef"></div><p id="ilDesc"></p><div class="lk-actions" id="ilAct"></div></div></div>';
document.body.appendChild(lb);
function abrirIlus(id){
  var i=ILBY[id];if(!i)return;
  $q("#ilArt").innerHTML=ARTE.desenhar(i.id);
  $q("#ilTit").textContent=i.t;$q("#ilRef").textContent=i.ref;$q("#ilDesc").textContent=i.d;
  var a='<button type="button" class="primary" data-r="1">'+ICON.book+'Ler a passagem</button>';
  if(i.mapa){var m=mapaPorId(i.mapa);if(m)a+='<button type="button" data-m="1">'+ICON.map+'Ver no mapa</button>';}
  var act=$q("#ilAct");act.innerHTML=a;
  var r=act.querySelector("[data-r]");if(r)r.addEventListener("click",function(){irPara(i.pr.b,i.pr.c1,i.pr.v1||1);});
  var m2=act.querySelector("[data-m]");if(m2)m2.addEventListener("click",function(){abrirMapa(i.mapa);});
  lb.classList.add("show");
}
function fecharIlus(){lb.classList.remove("show");}
lb.addEventListener("click",function(e){if(e.target===lb||e.target.classList.contains("il-close"))fecharIlus();});

/* ---------- gancho do leitor ---------- */
var ICONSTR=ICON;
function limparLeitor(){
  verses.querySelectorAll("figure.ill,.verse .xr").forEach(function(n){n.remove();});
}
function aposRenderizar(){
  limparLeitor();
  var b=BOOKS.indexOf(selectedBook),c=selectedChapter,cap=$q("#recursosCap");
  if(b<0)return;
  var chips='',ils=ilusDoCapitulo(b,c),maps={},ligs=ligsDoCapitulo(b,c);
  /* ilustrações */
  ils.forEach(function(i){
    if(i.mapa)maps[i.mapa]=1;
    if(!pref.ilus)return;
    var alvo=null,k;
    for(k=0;k<i.pa.length&&!alvo;k++){if(i.pa[k].b===b&&i.pa[k].c1===c)alvo=verses.querySelector('.verse[data-verse="'+(i.pa[k].v1||1)+'"]');}
    if(alvo)alvo.insertAdjacentHTML("beforebegin",figuraHtml(i));
  });
  /* marcadores de ligação (no primeiro versículo de cada trecho) */
  if(pref.ligs){
    var porVerso={};
    (IDX[b+"|"+c]||[]).forEach(function(e){if(!e.whole){var o=porVerso[e.vs]=porVerso[e.vs]||{};o[e.g.id]=1;}});
    Object.keys(porVerso).forEach(function(v){
      var el=verses.querySelector('.verse[data-verse="'+v+'"]');if(!el)return;
      var n=Object.keys(porVerso[v]).length;
      var x=document.createElement("span");
      x.className="xr";x.setAttribute("role","button");x.tabIndex=0;x.dataset.v=v;
      x.setAttribute("aria-label",n+" ligação(ões) com outros textos");
      x.innerHTML=ICON.link+n;
      el.insertBefore(x,el.firstChild);
    });
  }
  /* mapas do capítulo */
  MAPAS_LISTA.forEach(function(m){
    if(m.pr.some(function(p){return p.b===b&&c>=p.c1&&c<=p.c2;}))maps[m.id]=1;
  });
  ligs.forEach(function(g){if(g.mapa)maps[g.mapa]=1;});
  if(pref.ligs&&ligs.length)chips+='<button type="button" class="rc-chip" data-act="ligs">'+ICON.link+'Ligações ('+ligs.length+')</button>';
  Object.keys(maps).slice(0,3).forEach(function(id){var m=mapaPorId(id);if(m)chips+='<button type="button" class="rc-chip alt" data-act="mapa" data-id="'+id+'">'+ICON.map+esc(m.t)+'</button>';});
  if(!pref.ilus&&ils.length)chips+='<button type="button" class="rc-chip" data-act="ilus" data-id="'+ils[0].id+'">'+ICON.img+'Ilustração: '+esc(ils[0].t)+'</button>';
  cap.innerHTML=chips;
}
$q("#recursosCap").addEventListener("click",function(e){
  var b=e.target.closest(".rc-chip");if(!b)return;
  if(b.dataset.act==="ligs")abrirCapitulo();
  else if(b.dataset.act==="mapa")abrirMapa(b.dataset.id,"readerView");
  else if(b.dataset.act==="ilus")abrirIlus(b.dataset.id);
});
verses.addEventListener("click",function(e){
  var x=e.target.closest(".xr");
  if(x){e.stopPropagation();abrirVerso(BOOKS.indexOf(selectedBook),selectedChapter,+x.dataset.v);return;}
  var f=e.target.closest("figure.ill");
  if(f)abrirIlus(f.dataset.ill);
});
verses.addEventListener("keydown",function(e){
  if(e.key!=="Enter"&&e.key!==" ")return;
  var x=e.target.closest&&e.target.closest(".xr");
  if(x){e.preventDefault();abrirVerso(BOOKS.indexOf(selectedBook),selectedChapter,+x.dataset.v);return;}
  var f=e.target.closest&&e.target.closest("figure.ill");
  if(f){e.preventDefault();abrirIlus(f.dataset.ill);}
});

/* ---------- mapas ---------- */
var MAPAS=window.MAPAS||{lugares:{},rotulos:{},lista:[]},MAPAS_LISTA=MAPAS.lista,GEO=window.GEO_BASE||{};
MAPAS_LISTA.forEach(function(m){m.pr=m.refs.map(parseRef).filter(Boolean);});
function mapaPorId(id){for(var i=0;i<MAPAS_LISTA.length;i++)if(MAPAS_LISTA[i].id===id)return MAPAS_LISTA[i];return null;}
function proj(reg,lat,lon){return [(lon-reg.lon0)*reg.c*reg.S,(reg.lat1-lat)*reg.S];}
function el(tag,attrs,parent){
  var e=document.createElementNS(SVGNS,tag),k;
  if(attrs)for(k in attrs)e.setAttribute(k,attrs[k]);
  if(parent)parent.appendChild(e);
  return e;
}
function ponto(reg,s){
  var sea=/\*$/.test(s),id=s.replace(/\*$/,""),m=/^(-?[\d.]+),(-?[\d.]+)$/.exec(id),lat,lon;
  if(m){lat=+m[1];lon=+m[2];}
  else{var l=MAPAS.lugares[id];lat=l[1];lon=l[2];}
  var p=proj(reg,lat,lon);return {x:p[0],y:p[1],mar:sea};
}
var uidMapa=0;
/* Constrói o mapa dentro de um <svg>. opt.mini = miniatura estática. */
function construirMapa(m,svg,opt){
  opt=opt||{};
  var reg=GEO[m.r];if(!reg)return null;
  var uid="mp"+(++uidMapa),W=reg.W,H=reg.H;
  svg.innerHTML="";
  var defs=el("defs",null,svg);
  var landId=uid+"l";
  el("path",{id:landId,d:reg.terra},defs);
  el("rect",{"class":"m-sea",x:-W,y:-H,width:W*3,height:H*3},svg);
  el("use",{href:"#"+landId,"class":"m-ripple"},svg);
  el("use",{href:"#"+landId,"class":"m-land"},svg);
  if(reg.lagos)el("path",{d:reg.lagos,"class":"m-lake"},svg);
  if(reg.rios)el("path",{d:reg.rios,"class":"m-river"},svg);
  /* fronteira */
  if(m.fronteira){
    var fd="M"+m.fronteira.map(function(q){var p=proj(reg,q[0],q[1]);return p[0].toFixed(1)+" "+p[1].toFixed(1);}).join("L");
    el("path",{d:fd,"class":"m-fronteira"},svg);
  }
  /* rotas */
  var gRotas=el("g",null,svg),gSeta=el("g",null,svg),escalaveis=[],rotasEl={};
  (m.rotas||[]).forEach(function(r){
    var g=el("g",{"data-rota":r.id,style:"color:"+r.cor},gRotas),gs=el("g",{"data-rota":r.id,style:"color:"+r.cor},gSeta);
    var P=r.pts.map(function(s){return ponto(reg,s);}),i;
    for(i=0;i<P.length-1;i++){
      var p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||P[i+1];
      var c1={x:p1.x+(p2.x-p0.x)/6,y:p1.y+(p2.y-p0.y)/6},c2={x:p2.x-(p3.x-p1.x)/6,y:p2.y-(p3.y-p1.y)/6};
      var d="M"+p1.x.toFixed(1)+" "+p1.y.toFixed(1)+"C"+c1.x.toFixed(1)+" "+c1.y.toFixed(1)+" "+c2.x.toFixed(1)+" "+c2.y.toFixed(1)+" "+p2.x.toFixed(1)+" "+p2.y.toFixed(1);
      var mar=p2.mar?" sea":"";
      el("path",{d:d,"class":"m-halo"},g);
      el("path",{d:d,"class":"m-rota"+mar,stroke:r.cor},g);
      var len=Math.hypot(p2.x-p1.x,p2.y-p1.y);
      if(len>W*0.035&&!opt.mini){
        var bx=(p1.x+3*c1.x+3*c2.x+p2.x)/8,by=(p1.y+3*c1.y+3*c2.y+p2.y)/8;
        var dx=c2.x-c1.x+p2.x-p1.x,dy=c2.y-c1.y+p2.y-p1.y,ang=Math.atan2(dy,dx)*180/Math.PI;
        var a=el("path",{d:"M5 0L-4 -4.2L-4 4.2Z","class":"arrow"},gs);
        escalaveis.push({el:a,x:bx,y:by,rot:ang,nivel:0});
      }
    }
    rotasEl[r.id]=[g,gs];
  });
  /* rótulos de região/mar */
  var gRot=el("g",null,svg);
  var rots=(MAPAS.rotulos[m.r]||[]).concat((m.tribos||[]).map(function(t){return [t[0],t[1],t[2],"t"];}));
  if(!opt.mini)rots.forEach(function(r){
    var p=proj(reg,r[1],r[2]);
    var cls=r[3]==="m"?"m-mar":r[3]==="t"?"m-tribo":"m-reg";
    var t=el("text",{"class":cls},gRot);t.textContent=r[0];
    escalaveis.push({el:t,x:p[0],y:p[1],rot:0,nivel:0});
  });
  /* lugares */
  var gPl=el("g",null,svg),places={};
  m.lugares.forEach(function(L){
    var id=L[0],def=MAPAS.lugares[id];if(!def)return;
    var nivel=L[1]||1,lado=L[2]||"r",p=proj(reg,def[1],def[2]);
    if(opt.mini&&nivel>1)return;
    var g=el("g",{"class":"pl","data-id":id},gPl);
    if(!opt.mini)el("circle",{r:15,"class":"hit"},g);
    if(def[3]==="m")el("path",{d:"M0 -6L6 4L-6 4Z","class":"dot"},g);
    else if(def[3]==="i")el("circle",{r:4.2,"class":"dot",style:"fill:var(--map-land);stroke:var(--map-pin);stroke-width:2px"},g);
    else if(def[3]==="l")el("path",{d:"M0 -5L5 0L0 5L-5 0Z","class":"dot"},g);
    else el("circle",{r:opt.mini?4.5:4.2,"class":"dot"},g);
    if(!opt.mini){
      var tx={r:[8,4,"start"],l:[-8,4,"end"],t:[0,-9,"middle"],b:[0,17,"middle"]}[lado]||[8,4,"start"];
      var t=el("text",{x:tx[0],y:tx[1],"text-anchor":tx[2],"class":"m-txt"},g);t.textContent=def[0];
    }
    var o={el:g,x:p[0],y:p[1],rot:0,nivel:nivel,id:id};
    escalaveis.push(o);places[id]=o;
  });
  /* vista */
  var asp=opt.aspecto||1.6;
  var f=m.foco,pa=proj(reg,f[3],f[0]),pb=proj(reg,f[1],f[2]);
  var fx0=Math.min(pa[0],pb[0]),fx1=Math.max(pa[0],pb[0]),fy0=Math.min(pa[1],pb[1]),fy1=Math.max(pa[1],pb[1]);
  var ctl={svg:svg,reg:reg,vb:null,base:null,bw:opt.largura||600,bh:0,places:places,rotas:rotasEl,sel:null};
  ctl.fit=function(){
    var r=svg.getBoundingClientRect();
    if(r.width>0){ctl.bw=r.width;ctl.bh=r.height;}
    var a=ctl.bh?ctl.bw/ctl.bh:asp;
    var fw=fx1-fx0,fh=fy1-fy0,w=Math.max(fw,fh*a)*1.04,h=w/a;
    ctl.base=w;
    ctl.vb={x:(fx0+fx1)/2-w/2,y:(fy0+fy1)/2-h/2,w:w,h:h};
    ctl.apply();
  };
  ctl.apply=function(){
    var v=ctl.vb,a=ctl.bh?ctl.bw/ctl.bh:asp;v.h=v.w/a;
    var cx=Math.min(W,Math.max(0,v.x+v.w/2)),cy=Math.min(H,Math.max(0,v.y+v.h/2));
    v.x=cx-v.w/2;v.y=cy-v.h/2;
    svg.setAttribute("viewBox",v.x.toFixed(2)+" "+v.y.toFixed(2)+" "+v.w.toFixed(2)+" "+v.h.toFixed(2));
    var k=v.w/(ctl.bw||600),z=ctl.base/v.w,kk=opt.mini?(W/ (opt.largura||300))*0.0+k:k;
    escalaveis.forEach(function(o){
      var vis=o.nivel<=1||(o.nivel===2&&z>=1.45)||(o.nivel>=3&&z>=2.6)||(ctl.sel===o.id);
      o.el.style.display=vis?"":"none";
      o.el.setAttribute("transform","translate("+o.x.toFixed(1)+" "+o.y.toFixed(1)+") rotate("+o.rot+") scale("+kk.toFixed(4)+")");
    });
  };
  ctl.zoom=function(f,cx,cy){
    var v=ctl.vb,a=ctl.bh?ctl.bw/ctl.bh:asp;
    var nw=Math.min(Math.max(v.w/f,W/22),Math.max(W,H*a)*1.05);
    var px=(cx==null?.5:cx),py=(cy==null?.5:cy);
    var ax=v.x+px*v.w,ay=v.y+py*(v.w/a);
    v.w=nw;v.x=ax-px*nw;v.y=ay-py*(nw/a);ctl.apply();
  };
  ctl.select=function(id){
    ctl.sel=id;
    Object.keys(places).forEach(function(k){places[k].el.classList.toggle("sel",k===id);});
    ctl.apply();
  };
  ctl.toggleRota=function(id,on){rotasEl[id].forEach(function(g){g.style.display=on?"":"none";});};
  if(opt.mini){ctl.bw=opt.largura||300;ctl.bh=ctl.bw/asp;ctl.fit();}
  return ctl;
}

/* miniatura */
function miniatura(m){
  var s=document.createElementNS(SVGNS,"svg");
  s.setAttribute("preserveAspectRatio","xMidYMid slice");s.setAttribute("aria-hidden","true");
  var c=construirMapa(m,s,{mini:true,aspecto:1.6,largura:300});
  return s;
}

/* tela do mapa */
var cur=null,origemMapa="booksView";
function abrirMapa(id,origem){
  var m=mapaPorId(id);if(!m)return;
  fecharTudo();
  origemMapa=origem||(($q("#readerView").classList.contains("active"))?"readerView":"booksView");
  showView("mapaView");
  $q("#mapaTitulo").textContent=m.t;$q("#mapaSub").textContent=m.resumo;
  var box=$q("#mapBox");box.innerHTML="";
  (function(){
    var f=m.foco,reg=GEO[m.r];if(!reg)return;
    var pa=proj(reg,f[3],f[0]),pb=proj(reg,f[1],f[2]),asp=Math.abs(pb[0]-pa[0])/Math.abs(pb[1]-pa[1]);
    var w=box.parentNode.getBoundingClientRect().width||360;
    var hh=Math.round(Math.max(280,Math.min(window.innerHeight*0.66,w/asp*1.04,680)));box.style.height=hh+"px";box.parentNode.style.maxWidth=Math.max(440,Math.round(hh*asp*1.5))+"px";box.parentNode.style.margin="0 auto";
  })();
  var svg=document.createElementNS(SVGNS,"svg");
  svg.setAttribute("role","img");svg.setAttribute("aria-label","Mapa: "+m.t);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  box.appendChild(svg);
  var ctl=construirMapa(m,svg,{});
  cur={m:m,ctl:ctl};
  requestAnimationFrame(function(){ctl.fit();});
  /* rotas */
  var rt=$q("#mapRoutes");rt.innerHTML="";
  (m.rotas||[]).forEach(function(r){
    var b=document.createElement("button");b.type="button";b.style.color=r.cor;
    var mar=r.pts.some(function(p){return /\*$/.test(p);});
    b.innerHTML='<i class="'+(mar?"sea":"")+'"></i><span style="color:var(--soft-ink)">'+esc(r.n)+'</span>';
    b.addEventListener("click",function(){var off=b.classList.toggle("off");ctl.toggleRota(r.id,!off);});
    rt.appendChild(b);
  });
  /* passagens */
  var chips=m.pr.map(function(p,i){return '<button type="button" data-i="'+i+'">'+esc(rotulo(p))+'</button>';}).join("");
  $q("#mapRefs").innerHTML='<h4>Passagens deste mapa</h4><div class="chips">'+chips+'</div>';
  $q("#mapRefs").querySelectorAll("button").forEach(function(b){b.addEventListener("click",function(){var p=m.pr[+b.dataset.i];irPara(p.b,p.c1,p.v1||1);});});
  $q("#mapNota").textContent=m.nota||"";
  $q("#mapCard").innerHTML='<div class="kind">Dica</div><p>Toque em um lugar para ver sua história e a passagem bíblica. Arraste para mover e use os botões + e − (ou dois dedos) para aproximar.</p>';
  ligarGestos(box,ctl);
}
function cartaoLugar(id){
  var d=MAPAS.lugares[id];if(!d)return;
  var tipo={c:"Cidade",m:"Monte",l:"Local",i:"Ilha"}[d[3]]||"Lugar",p=parseRef(d[4]);
  var h='<div class="kind">'+tipo+'</div><h3>'+esc(d[0])+'</h3><p>'+esc(d[5])+'</p><div class="lk-actions">';
  if(p)h+='<button type="button" class="primary" id="lugLer">'+ICON.book+'Ler '+esc(rotulo(p))+'</button>';
  h+='</div>';
  $q("#mapCard").innerHTML=h;
  var b=$q("#lugLer");if(b)b.addEventListener("click",function(){irPara(p.b,p.c1,p.v1||1);});
}
function ligarGestos(box,ctl){
  var ptrs={},g=null,downT=0,downTarget=null,moved=false,start=null;
  function rect(){return box.getBoundingClientRect();}
  function inicio(){
    var ids=Object.keys(ptrs),r=rect();
    var pts=ids.map(function(k){return ptrs[k];}),mx=0,my=0,i;
    pts.forEach(function(p){mx+=p.x;my+=p.y;});mx/=pts.length;my/=pts.length;
    var d=pts.length>1?Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y):0;
    var v=ctl.vb;
    g={vb:{x:v.x,y:v.y,w:v.w},d:d,n:pts.length,ax:v.x+((mx-r.left)/r.width)*v.w,ay:v.y+((my-r.top)/r.height)*v.h};
  }
  box.addEventListener("pointerdown",function(e){
    if(e.target.closest(".map-ctl"))return;
    ptrs[e.pointerId]={x:e.clientX,y:e.clientY};
    try{box.setPointerCapture(e.pointerId);}catch(_){}
    if(Object.keys(ptrs).length===1){downT=Date.now();downTarget=e.target;moved=false;start={x:e.clientX,y:e.clientY};}
    else moved=true;
    inicio();box.classList.add("drag");
  });
  box.addEventListener("pointermove",function(e){
    if(!ptrs[e.pointerId])return;
    ptrs[e.pointerId]={x:e.clientX,y:e.clientY};
    if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>6)moved=true;
    if(!moved||!g)return;
    var ids=Object.keys(ptrs),pts=ids.map(function(k){return ptrs[k];}),mx=0,my=0;
    pts.forEach(function(p){mx+=p.x;my+=p.y;});mx/=pts.length;my/=pts.length;
    var r=rect(),a=r.width/r.height,v=ctl.vb,w=g.vb.w;
    if(pts.length>1&&g.d>0){var d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);w=g.vb.w*g.d/d;}
    w=Math.min(Math.max(w,ctl.reg.W/22),Math.max(ctl.reg.W,ctl.reg.H*a)*1.05);
    v.w=w;v.x=g.ax-((mx-r.left)/r.width)*w;v.y=g.ay-((my-r.top)/r.height)*(w/a);
    ctl.apply();
  });
  function fim(e){
    if(!ptrs[e.pointerId])return;
    delete ptrs[e.pointerId];
    var restante=Object.keys(ptrs).length;
    if(restante===0){
      box.classList.remove("drag");
      if(!moved&&Date.now()-downT<500&&downTarget){
        var pl=downTarget.closest&&downTarget.closest(".pl");
        if(pl){ctl.select(pl.dataset.id);cartaoLugar(pl.dataset.id);}
      }
      g=null;
    }else{inicio();moved=true;}
  }
  box.addEventListener("pointerup",fim);box.addEventListener("pointercancel",fim);
  box.addEventListener("wheel",function(e){
    e.preventDefault();var r=rect();
    ctl.zoom(Math.exp(-e.deltaY*0.0016),(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);
  },{passive:false});
  box.addEventListener("dblclick",function(e){var r=rect();ctl.zoom(2,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);});
  if(window.ResizeObserver){
    if(box._ro)box._ro.disconnect();
    box._ro=new ResizeObserver(function(){
      var r=box.getBoundingClientRect();
      if(r.width>0&&(Math.abs(r.width-ctl.bw)>1||Math.abs(r.height-ctl.bh)>1)){ctl.bw=r.width;ctl.bh=r.height;ctl.apply();}
    });
    box._ro.observe(box);
  }
}
$q("#mapZoomIn").addEventListener("click",function(){if(cur)cur.ctl.zoom(1.6);});
$q("#mapZoomOut").addEventListener("click",function(){if(cur)cur.ctl.zoom(1/1.6);});
$q("#mapReset").addEventListener("click",function(){if(cur){cur.ctl.fit();cur.ctl.select(null);}});
$q("#backMapa").addEventListener("click",function(){
  if(origemMapa==="readerView"&&selectedBook){showView("readerView");}
  else{showView("booksView");aba("mapas");}
});

/* ---------- abas da tela inicial ---------- */
var abaAtual="livros",montado={};
function aba(nome){
  abaAtual=nome;
  ["livros","mapas","galeria","temas"].forEach(function(n){
    var p=$q("#hub"+n.charAt(0).toUpperCase()+n.slice(1));if(p)p.hidden=n!==nome;
  });
  document.querySelectorAll("#hubTabs button").forEach(function(b){
    var on=b.dataset.aba===nome;b.classList.toggle("active",on);b.setAttribute("aria-selected",on);
  });
  if(nome==="mapas"&&!montado.mapas)montarMapas();
  if(nome==="galeria"&&!montado.galeria)montarGaleria();
  if(nome==="temas"&&!montado.temas)montarTemas();
  if(nome!=="livros")window.scrollTo({top:0});
}
document.querySelectorAll("#hubTabs button").forEach(function(b){b.addEventListener("click",function(){aba(b.dataset.aba);});});
function montarMapas(){
  montado.mapas=true;
  var h='<div class="hub-head"><h2>Mapas bíblicos</h2><p>Mapas interativos com os lugares, as rotas e as passagens ligadas a cada um.</p></div><div class="card-grid">';
  MAPAS_LISTA.forEach(function(m){h+='<button type="button" class="rc-card" data-m="'+m.id+'"><span class="rc-thumb" data-th="'+m.id+'"></span><span class="rc-info"><strong>'+esc(m.t)+'</strong><small>'+esc(m.resumo)+'</small></span></button>';});
  var host=$q("#hubMapas");host.innerHTML=h+'</div><div class="note">Base geográfica: Natural Earth (domínio público). As localizações de lugares antigos são aproximadas; muitas são debatidas por estudiosos.</div>';
  host.querySelectorAll("[data-th]").forEach(function(t){t.appendChild(miniatura(mapaPorId(t.dataset.th)));});
  host.querySelectorAll("[data-m]").forEach(function(b){b.addEventListener("click",function(){abrirMapa(b.dataset.m,"booksView");});});
}
function montarGaleria(){
  montado.galeria=true;
  var host=$q("#hubGaleria"),h='<div class="hub-head"><h2>Ilustrações</h2><p>Cenas em estilo de gravura para apoiar a leitura. Elas também aparecem dentro dos capítulos.</p></div>';
  var grupos=[["Antigo Testamento",function(i){return i.pr.b<39;}],["Novo Testamento",function(i){return i.pr.b>=39;}]];
  grupos.forEach(function(g){
    var l=IL.filter(g[1]);if(!l.length)return;
    h+='<div class="gal-section">'+g[0]+'</div><div class="card-grid">';
    l.forEach(function(i){h+='<button type="button" class="rc-card" data-il="'+i.id+'"><span class="rc-thumb" data-art="'+i.id+'" style="background:#2d1e13"></span><span class="rc-info"><strong>'+esc(i.t)+'</strong><small>'+esc(i.ref)+'</small></span></button>';});
    h+='</div>';
  });
  host.innerHTML=h;
  host.querySelectorAll("[data-il]").forEach(function(b){b.addEventListener("click",function(){abrirIlus(b.dataset.il);});});
  var thumbs=host.querySelectorAll("[data-art]");
  function pinta(t){if(!t.dataset.ok){t.dataset.ok=1;t.innerHTML=ARTE.desenhar(t.dataset.art);}}
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){pinta(e.target);io.unobserve(e.target);}});},{rootMargin:"200px"});
    thumbs.forEach(function(t){io.observe(t);});
  }else thumbs.forEach(pinta);
}
function montarTemas(){
  montado.temas=true;
  var host=$q("#hubTemas"),filtro="todos";
  host.innerHTML='<div class="hub-head"><h2>Temas e ligações</h2><p>Textos que falam do mesmo assunto, relatos paralelos e profecias com seus cumprimentos.</p></div><input class="tm-search" id="tmBusca" type="search" placeholder="Buscar assunto ou passagem (ex.: páscoa, Gn 22)…" aria-label="Buscar temas"><div class="tm-filter" id="tmFiltro"><button type="button" data-f="todos" class="active">Todos</button><button type="button" data-f="tema">Temas</button><button type="button" data-f="paralelo">Paralelos</button><button type="button" data-f="profecia">Profecias</button></div><div id="tmLista"></div>';
  var lista=$q("#tmLista"),busca=$q("#tmBusca");
  GR.forEach(function(g){g.ind=normalizeText([g.n,g.d,g.refs.map(rotulo).join(" ")].join(" "));});
  function pinta(){
    var q=normalizeText(busca.value.trim()),termos=q.split(/\s+/).filter(Boolean);
    var l=GR.filter(function(g){return (filtro==="todos"||g.tipo===filtro)&&termos.every(function(t){return g.ind.indexOf(t)>=0;});});
    lista.innerHTML=l.length?cardsGrupos(l):'<div class="empty">Nada encontrado.</div>';
    wireGrupos(null)(lista);
  }
  busca.addEventListener("input",pinta);
  $q("#tmFiltro").addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b)return;
    filtro=b.dataset.f;$q("#tmFiltro").querySelectorAll("button").forEach(function(x){x.classList.toggle("active",x===b);});pinta();
  });
  pinta();
}

/* ---------- menu do leitor ---------- */
function rotuloPref(){
  $q("#toggleIlus").textContent="Ilustrações no texto: "+(pref.ilus?"ligadas":"desligadas");
  $q("#toggleLigs").textContent="Marcadores de ligações: "+(pref.ligs?"ligados":"desligados");
}
function salvarPref(){save(STORE_PREF,pref);rotuloPref();if($q("#readerView").classList.contains("active")&&verses.querySelector(".verse"))aposRenderizar();}
$q("#toggleIlus").addEventListener("click",function(){pref.ilus=!pref.ilus;salvarPref();});
$q("#toggleLigs").addEventListener("click",function(){pref.ligs=!pref.ligs;salvarPref();});
rotuloPref();

function fecharTudo(){sheetClose();fecharIlus();}
document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(lb.classList.contains("show"))fecharIlus();else if(sheet.classList.contains("show"))sheetClose();}});

window.Recursos={aposRenderizar:aposRenderizar,abrirMapa:abrirMapa,abrirIlus:abrirIlus,irRef:irRef,aba:aba,
  _t:{parseRef:parseRef,rotulo:rotulo,ligsDoVerso:ligsDoVerso,ligsDoCapitulo:ligsDoCapitulo}};
})();
