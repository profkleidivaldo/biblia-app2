const fs=require('fs');
const D='../data/';
global.window={};
const O='../out/';
require(O+'dados-mapas.js');require(O+'dados-ligacoes.js');require(O+'arte.js');
const BOOKS=["Gn","Ex","Lv","Nm","Dt","Js","Jz","Rt","1Sm","2Sm","1Rs","2Rs","1Cr","2Cr","Ed","Ne","Et","Jó","Sl","Pv","Ec","Ct","Is","Jr","Lm","Ez","Dn","Os","Jl","Am","Ob","Jn","Mq","Na","Hc","Sf","Ag","Zc","Ml","Mt","Mc","Lc","Jo","At","Rm","1Co","2Co","Gl","Ef","Fp","Cl","1Ts","2Ts","1Tm","2Tm","Tt","Fm","Hb","Tg","1Pe","2Pe","1Jo","2Jo","3Jo","Jd","Ap"];
const vers={};
for(const v of ['acf','aa','nvi']){const raw=JSON.parse(fs.readFileSync(D+v+'.json','utf8').replace(/^﻿/,''));vers[v]=raw.map(b=>b.chapters.map(c=>c.length));}
const RE=/^((?:[123]\s?)?[A-Za-zÀ-ÿ]+)\s+(\d+)(?::(\d+))?(?:\s*[-–]\s*(?:(\d+):)?(\d+))?$/;
function parse(s){
  const m=RE.exec(s.trim());if(!m)return null;
  const b=BOOKS.findIndex(x=>x.toLowerCase()===m[1].toLowerCase());if(b<0)return null;
  const c1=+m[2];let v1=m[3]?+m[3]:null,c2=c1,v2=null;
  if(m[3]){ if(m[5]){ if(m[4]){c2=+m[4];v2=+m[5];} else v2=+m[5]; } else v2=v1; }
  else if(m[5]){ c2=+m[5]; }
  return {b,c1,v1,c2,v2};
}
const bad=[];
function chk(s,where){
  const p=parse(s);if(!p){bad.push(where+' PARSE '+s);return;}
  for(const v in vers){
    const ch=vers[v][p.b];
    if(!ch||p.c1>ch.length||p.c2>ch.length){bad.push(where+' CAP '+s+' ('+v+')');continue;}
    if(p.v1&&p.v1>ch[p.c1-1])bad.push(where+' V1 '+s+' ('+v+' max '+ch[p.c1-1]+')');
    if(p.v2&&p.v2>ch[p.c2-1])bad.push(where+' V2 '+s+' ('+v+' max '+ch[p.c2-1]+')');
  }
}
const G=window.LIGACOES;let n=0;
G.forEach(g=>g.r.forEach(r=>{chk(Array.isArray(r)?r[0]:r,'lig:'+g.id);n++;}));
const M=window.MAPAS;
M.lista.forEach(m=>m.refs.forEach(r=>chk(r,'map:'+m.id)));
Object.entries(M.lugares).forEach(([k,l])=>chk(l[4],'lugar:'+k));
window.ARTE.itens.forEach(i=>{chk(i.ref,'ilus:'+i.id);i.a.forEach(a=>chk(a,'ilusA:'+i.id));if(i.mapa&&!M.lista.find(m=>m.id===i.mapa))bad.push('ilus mapa '+i.id)});
G.forEach(g=>{if(g.mapa&&!M.lista.find(m=>m.id===g.mapa))bad.push('lig mapa '+g.id)});
const ids=G.map(g=>g.id);const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
console.log('grupos',G.length,'refs',n,'duplicados',dup);
console.log(bad.length?bad.join('\n'):'OK sem erros');
