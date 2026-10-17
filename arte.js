/* Ilustrações bíblicas em estilo de gravura (SVG vetorial, geradas por código).
   Tons de sépia e tinta, luz dourada nos pontos de luz divina; sem estilo infantil.
   Cada cena é uma função que desenha em uma tela 800x500. */
(function(){
"use strict";
var C={ink:"#1b1109",d1:"#2d1e13",d2:"#4a3322",d3:"#6b4e34",m:"#8f6e4a",l:"#bf9d6c",l2:"#dcc796",paper:"#efe3c3",gold:"#f2c45c",gold2:"#fff0b8"};

function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function f(n){return Math.round(n*10)/10;}
function noise1(r,oct){
  var L=[],k,i,a;
  for(k=0;k<oct;k++){a=[];for(i=0;i<70;i++)a.push(r());L.push(a);}
  return function(t){
    var s=0,amp=1,tot=0,k,x,i,fr,u;
    for(k=0;k<oct;k++){x=t*Math.pow(2,k)*2;i=Math.floor(x);fr=x-i;u=fr*fr*(3-2*fr);s+=amp*(L[k][i]*(1-u)+L[k][i+1]*u);tot+=amp;amp*=.5;}
    return s/tot;
  };
}

var UID=0;
function Cv(seed){this.id="g"+(++UID);this.n=0;this.defs=[];this.b=[];this.r=rng(seed||7);this.hid=null;}
var P=Cv.prototype;
P.add=function(s){this.b.push(s);return this;};
P.gid=function(){return this.id+"_"+(++this.n);};
P.lg=function(stops,x1,y1,x2,y2){
  var id=this.gid();
  this.defs.push('<linearGradient id="'+id+'" gradientUnits="userSpaceOnUse" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'">'+stops.map(function(s){return '<stop offset="'+s[0]+'" stop-color="'+s[1]+'"'+(s[2]!=null?' stop-opacity="'+s[2]+'"':'')+'/>';}).join('')+'</linearGradient>');
  return 'url(#'+id+')';
};
P.rg=function(stops,cx,cy,r){
  var id=this.gid();
  this.defs.push('<radialGradient id="'+id+'" gradientUnits="userSpaceOnUse" cx="'+cx+'" cy="'+cy+'" r="'+r+'">'+stops.map(function(s){return '<stop offset="'+s[0]+'" stop-color="'+s[1]+'"'+(s[2]!=null?' stop-opacity="'+s[2]+'"':'')+'/>';}).join('')+'</radialGradient>');
  return 'url(#'+id+')';
};
P.hatch=function(){
  if(!this.hid){
    this.hid=this.gid();
    this.defs.push('<pattern id="'+this.hid+'" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><line x1="0" y1="0" x2="0" y2="4.5" stroke="'+C.ink+'" stroke-width=".85"/></pattern>');
  }
  return 'url(#'+this.hid+')';
};
P.sky=function(stops){return this.add('<rect x="0" y="0" width="800" height="500" fill="'+this.lg(stops,0,0,0,500)+'"/>');};
P.glow=function(x,y,r,col,op){return this.add('<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+this.rg([[0,col,op==null?.9:op],[.45,col,(op==null?.9:op)*.35],[1,col,0]],x,y,r)+'"/>');};
P.sun=function(x,y,r,col){this.glow(x,y,r*4.2,col||C.gold,.75);return this.add('<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+C.gold2+'"/>');};
P.beams=function(x,y,a0,a1,len,n,op,col){
  var i,a,w,pts,g=this.rg([[0,col||C.gold2,op==null?.85:op],[1,col||C.gold2,0]],x,y,len);
  for(i=0;i<n;i++){
    a=a0+(a1-a0)*(n===1?.5:i/(n-1));w=(a1-a0)/(n*3.2)+.012;
    pts=x+','+y+' '+f(x+Math.cos(a-w)*len)+','+f(y+Math.sin(a-w)*len)+' '+f(x+Math.cos(a+w)*len)+','+f(y+Math.sin(a+w)*len);
    this.add('<polygon points="'+pts+'" fill="'+g+'"/>');
  }
  return this;
};
P.stars=function(n,y0,y1,x0,x1){
  var i,r=this.r,s='';x0=x0==null?0:x0;x1=x1==null?800:x1;
  for(i=0;i<n;i++){var rr=.5+r()*r()*1.7;s+='<circle cx="'+f(x0+r()*(x1-x0))+'" cy="'+f(y0+r()*(y1-y0))+'" r="'+f(rr)+'" fill="'+(r()>.7?C.gold2:C.l2)+'" opacity="'+f(.45+r()*.55)+'"/>';}
  return this.add(s);
};
P.clouds=function(y,n,col,op,sc,x0,x1){
  var i,j,r=this.r,s='',cx,cy,k;sc=sc||1;x0=x0==null?-40:x0;x1=x1==null?840:x1;
  for(i=0;i<n;i++){
    cx=x0+r()*(x1-x0);cy=y+(r()-.5)*40*sc;
    for(j=0;j<7;j++){k=(r()*60+30)*sc;s+='<ellipse cx="'+f(cx+(r()-.5)*150*sc)+'" cy="'+f(cy+(r()-.5)*24*sc)+'" rx="'+f(k)+'" ry="'+f(k*.28)+'" fill="'+col+'" opacity="'+f(op*(.4+r()*.6))+'"/>';}
  }
  return this.add(s);
};
/* silhueta de relevo (montanhas/colinas) */
P.ridge=function(base,amp,col,o){
  o=o||{};
  var r=o.seed?rng(o.seed):this.r,nz=noise1(r,o.oct||5),N=o.n||70,x0=o.x0==null?-10:o.x0,x1=o.x1==null?810:o.x1,i,t,v,d='M'+x0+',500',ys=[];
  for(i=0;i<=N;i++){
    t=i/N;v=nz(t);
    if(o.sharp)v=1-Math.abs(2*v-1)*(o.sharp);
    var y=base-amp*(v-.5)*2-(o.tilt?o.tilt*(t-.5):0);
    if(o.shape)y=o.shape(t,y);
    d+='L'+f(x0+(x1-x0)*t)+','+f(y);ys.push(y);
  }
  d+='L'+x1+',500Z';
  this.add('<path d="'+d+'" fill="'+col+'"/>');
  if(o.hatch)this.add('<path d="'+d+'" fill="'+this.hatch()+'" opacity="'+o.hatch+'"/>');
  return d;
};
P.waves=function(y0,y1,rows,col,op,amp,seed){
  var i,j,r=seed?rng(seed):this.r,s='',y,x,d;
  for(i=0;i<rows;i++){
    y=y0+(y1-y0)*Math.pow(i/(rows-1||1),1.15);d='M-20,'+f(y);
    for(x=-20;x<830;x+=26+r()*20){d+='Q'+f(x+13)+','+f(y-(amp||5)*(.4+r())*(1+i/rows))+' '+f(x+26)+','+f(y);}
    s+='<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+f(.7+i*.12)+'" opacity="'+f((op||.5)*(.5+.5*i/rows))+'"/>';
  }
  return this.add(s);
};
P.rain=function(n,op,len){
  var i,r=this.r,s='',x,y;
  for(i=0;i<n;i++){x=r()*860-30;y=r()*520-20;s+='<line x1="'+f(x)+'" y1="'+f(y)+'" x2="'+f(x-(len||14)*.35)+'" y2="'+f(y+(len||14))+'"/>';}
  return this.add('<g stroke="'+C.l2+'" stroke-width=".8" opacity="'+(op||.4)+'">'+s+'</g>');
};
P.lightning=function(x,y,len,col){
  var r=this.r,pts=[[x,y]],i,px=x,py=y;
  for(i=0;i<7;i++){px+= (r()-.5)*44;py+=len/7;pts.push([px,py]);}
  var d='M'+pts.map(function(p){return f(p[0])+','+f(p[1]);}).join('L');
  this.add('<path d="'+d+'" fill="none" stroke="'+(col||C.gold)+'" stroke-width="7" opacity=".25" stroke-linejoin="round"/>');
  return this.add('<path d="'+d+'" fill="none" stroke="'+C.gold2+'" stroke-width="2" stroke-linejoin="round"/>');
};

/* ---------- figuras humanas (silhueta de túnica) ---------- */
/* o: pose = stand|up|out|point|kneel|fallen|bow ; col ; staff ; flip ; rim ; cover */
P.fig=function(x,y,h,o){
  o=o||{};
  var col=o.col||C.ink,pose=o.pose||"stand",fl=o.flip===-1?-1:1,s='';
  var robe,head,arms='',fold='';
  if(pose==="kneel"){
    robe='M-.17,0 Q-.19,-.3 -.08,-.5 Q-.02,-.58 .03,-.56 L.1,-.44 Q.17,-.3 .2,0 Z';
    head='<circle cx=".06" cy="-.63" r=".062" fill="'+col+'"/><path d="M-.01,-.63 Q.0,-.72 .07,-.71 Q.14,-.7 .13,-.62 L.12,-.56 L-.01,-.56Z" fill="'+col+'"/>';
    if(o.arms==="up")arms='<path d="M.09,-.5 Q.2,-.62 .22,-.82" stroke="'+col+'" stroke-width=".05" fill="none" stroke-linecap="round"/>';
    else arms='<path d="M.1,-.48 Q.19,-.5 .22,-.58" stroke="'+col+'" stroke-width=".045" fill="none" stroke-linecap="round"/>';
    fold='<path d="M-.05,-.4 L-.1,0 M.04,-.35 L.07,0" stroke="'+C.d3+'" stroke-width=".012" opacity=".5"/>';
  }else if(pose==="fallen"){
    robe='M-.3,0 Q-.3,-.1 -.05,-.12 Q.18,-.14 .3,-.07 L.32,0 Z';
    head='<circle cx="-.34" cy="-.07" r=".06" fill="'+col+'"/>';
    if(o.arms==="up")arms='<path d="M.2,-.1 Q.3,-.2 .36,-.3" stroke="'+col+'" stroke-width=".04" fill="none" stroke-linecap="round"/>';
  }else if(pose==="bow"){
    robe='M-.1,-.72 Q-.12,-.6 -.13,-.4 Q-.14,-.2 -.19,0 L.19,0 Q.13,-.2 .12,-.4 Q.11,-.6 .09,-.72 Z';
    head='<circle cx=".05" cy="-.79" r=".062" fill="'+col+'"/><path d="M-.03,-.78 Q-.03,-.88 .05,-.88 Q.12,-.87 .11,-.78 L.1,-.7 L-.04,-.7Z" fill="'+col+'"/>';
    fold='<path d="M-.03,-.45 L-.07,0 M.04,-.4 L.07,0" stroke="'+C.d3+'" stroke-width=".012" opacity=".5"/>';
  }else{
    robe='M-.075,-.8 Q-.09,-.78 -.1,-.6 Q-.11,-.3 -.17,0 L.17,0 Q.11,-.3 .1,-.6 Q.09,-.78 .075,-.8 Z';
    head='<circle cx="0" cy="-.875" r=".06" fill="'+col+'"/>'+(o.bare?'':'<path d="M-.075,-.875 Q-.08,-.97 0,-.97 Q.08,-.97 .075,-.875 Q.095,-.82 .095,-.78 L-.095,-.78 Q-.095,-.82 -.075,-.875Z" fill="'+col+'"/>');
    if(pose==="up")arms='<path d="M-.07,-.76 Q-.15,-.86 -.17,-1" stroke="'+col+'" stroke-width=".05" fill="none" stroke-linecap="round"/><path d="M.07,-.76 Q.15,-.86 .17,-1" stroke="'+col+'" stroke-width=".05" fill="none" stroke-linecap="round"/>';
    else if(pose==="out")arms='<path d="M-.07,-.76 L-.27,-.74" stroke="'+col+'" stroke-width=".05" fill="none" stroke-linecap="round"/><path d="M.07,-.76 L.27,-.74" stroke="'+col+'" stroke-width=".05" fill="none" stroke-linecap="round"/>';
    else if(pose==="point")arms='<path d="M.07,-.76 L.3,-.86" stroke="'+col+'" stroke-width=".05" fill="none" stroke-linecap="round"/>';
    fold='<path d="M-.03,-.6 L-.07,0 M.03,-.55 L.06,0 M.09,-.35 L.13,0" stroke="'+C.d3+'" stroke-width=".011" opacity=".45"/>';
  }
  if(o.staff)s+='<line x1=".2" y1="-1.02" x2=".2" y2="0" stroke="'+(o.staffCol||C.d2)+'" stroke-width=".014"/>';
  s+='<path d="'+robe+'" fill="'+col+'"/>'+head+arms+fold;
  if(o.rim)s+='<path d="'+robe+'" fill="none" stroke="'+C.gold+'" stroke-width=".012" opacity=".7"/>';
  return this.add('<g transform="translate('+f(x)+','+f(y)+') scale('+f(h*fl)+','+f(h)+')">'+s+'</g>');
};
P.crowd=function(n,x0,x1,y0,y1,h0,h1,col,pose,seed){
  var r=seed?rng(seed):this.r,list=[],i;
  for(i=0;i<n;i++){var y=y0+r()*(y1-y0),t=(y-y0)/((y1-y0)||1);list.push({x:x0+r()*(x1-x0),y:y,h:h0+(h1-h0)*t});}
  list.sort(function(a,b){return a.y-b.y;});
  for(i=0;i<list.length;i++)this.fig(list[i].x,list[i].y,list[i].h,{col:col,pose:pose||"stand",flip:r()>.5?1:-1});
  return this;
};
P.wings=function(x,y,h,col,op){
  var w='<path d="M0,-.75 C-.55,-1.05 -.78,-.6 -.5,-.12 C-.55,-.4 -.3,-.62 0,-.55Z" fill="'+col+'" opacity="'+(op||.9)+'"/><path d="M0,-.75 C-.4,-.95 -.6,-.62 -.4,-.3 C-.42,-.5 -.22,-.62 0,-.6Z" fill="'+C.paper+'" opacity=".25"/>';
  return this.add('<g transform="translate('+f(x)+','+f(y)+') scale('+f(h)+','+f(h)+')">'+w+'<g transform="scale(-1,1)">'+w+'</g></g>');
};
P.sheep=function(x,y,s,col){
  return this.add('<g transform="translate('+f(x)+','+f(y)+') scale('+s+')"><ellipse cx="0" cy="-7" rx="9" ry="6" fill="'+(col||C.d2)+'"/><circle cx="8" cy="-9" r="3.2" fill="'+C.ink+'"/><path d="M-5,-2 L-5,2 M-1,-2 L-1,2 M4,-2 L4,2 M7,-3 L7,2" stroke="'+C.ink+'" stroke-width="1.2"/></g>');
};
P.camel=function(x,y,h,col,flip){
  var c=col||C.ink;
  return this.add('<g transform="translate('+f(x)+','+f(y)+') scale('+f(h*(flip===-1?-1:1))+','+f(h)+')"><ellipse cx="0" cy="-.44" rx=".27" ry=".1" fill="'+c+'"/><path d="M-.08,-.5 Q-.03,-.68 .05,-.52Z" fill="'+c+'"/><path d="M.2,-.46 Q.3,-.64 .31,-.84 L.38,-.86 Q.41,-.82 .36,-.78 Q.37,-.6 .28,-.4Z" fill="'+c+'"/><path d="M-.2,-.4 L-.22,0 M-.11,-.38 L-.1,0 M.12,-.38 L.12,0 M.21,-.4 L.25,0" stroke="'+c+'" stroke-width=".045" stroke-linecap="round"/><path d="M-.26,-.46 Q-.34,-.4 -.32,-.28" stroke="'+c+'" stroke-width=".02" fill="none"/></g>');
};
/* ---------- árvores ---------- */
P.palm=function(x,y,h,col){
  var c=col||C.d1,s='',i,a;
  s+='<path d="M0,0 Q'+f(h*.08)+','+f(-h*.5)+' '+f(h*.03)+','+f(-h)+'" stroke="'+c+'" stroke-width="'+f(h*.045)+'" fill="none" stroke-linecap="round"/>';
  for(i=0;i<8;i++){a=-Math.PI*(.1+.8*i/7);s+='<path d="M'+f(h*.03)+','+f(-h)+' Q'+f(h*.03+Math.cos(a)*h*.3)+','+f(-h+Math.sin(a)*h*.3-h*.12)+' '+f(h*.03+Math.cos(a)*h*.45)+','+f(-h+Math.sin(a)*h*.18+h*.12)+'" stroke="'+c+'" stroke-width="'+f(h*.03)+'" fill="none" stroke-linecap="round"/>';}
  return this.add('<g transform="translate('+f(x)+','+f(y)+')">'+s+'</g>');
};
P.olive=function(x,y,h,col){
  var c=col||C.d1,r=this.r,s='',i;
  s+='<path d="M-'+f(h*.05)+',0 Q-'+f(h*.15)+','+f(-h*.3)+' '+f(h*.02)+','+f(-h*.5)+' Q'+f(h*.12)+','+f(-h*.7)+' '+f(h*.03)+','+f(-h*.8)+' L'+f(h*.09)+','+f(-h*.8)+' Q'+f(h*.2)+','+f(-h*.65)+' '+f(h*.1)+','+f(-h*.48)+' Q'+f(h*.02)+','+f(-h*.28)+' '+f(h*.08)+',0Z" fill="'+c+'"/>';
  for(i=0;i<9;i++)s+='<ellipse cx="'+f((r()-.4)*h*.7)+'" cy="'+f(-h*(.65+r()*.3))+'" rx="'+f(h*(.14+r()*.12))+'" ry="'+f(h*(.06+r()*.05))+'" fill="'+c+'" opacity=".92"/>';
  return this.add('<g transform="translate('+f(x)+','+f(y)+')">'+s+'</g>');
};
P.cedar=function(x,y,h,col){
  var c=col||C.d1,s='',i;
  s+='<rect x="'+f(-h*.02)+'" y="'+f(-h*.5)+'" width="'+f(h*.04)+'" height="'+f(h*.5)+'" fill="'+c+'"/>';
  for(i=0;i<5;i++)s+='<ellipse cx="0" cy="'+f(-h*(.48+i*.13))+'" rx="'+f(h*(.3-i*.05))+'" ry="'+f(h*.045)+'" fill="'+c+'"/>';
  return this.add('<g transform="translate('+f(x)+','+f(y)+')">'+s+'</g>');
};
P.cypress=function(x,y,h,col){return this.add('<path d="M'+f(x)+','+f(y)+' Q'+f(x-h*.14)+','+f(y-h*.5)+' '+f(x)+','+f(y-h)+' Q'+f(x+h*.14)+','+f(y-h*.5)+' '+f(x)+','+f(y)+'Z" fill="'+(col||C.d1)+'"/>');};
P.cross=function(x,y,h,col,wc){
  var c=col||C.ink;
  return this.add('<g stroke="'+c+'" stroke-linecap="square"><line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+f(y-h)+'" stroke-width="'+f(h*.07)+'"/><line x1="'+f(x-h*.28)+'" y1="'+f(y-h*.78)+'" x2="'+f(x+h*.28)+'" y2="'+f(y-h*.78)+'" stroke-width="'+f(h*.06)+'"/></g>');
};
P.ground=function(y,col,hatch){
  var d='M-10,'+y+' Q200,'+(y-8)+' 400,'+y+' T810,'+y+' L810,510 L-10,510Z';
  this.add('<path d="'+d+'" fill="'+col+'"/>');
  if(hatch)this.add('<path d="'+d+'" fill="'+this.hatch()+'" opacity="'+hatch+'"/>');
};
P.flame=function(x,y,h,col){
  var c=col||C.gold;
  return this.add('<g transform="translate('+f(x)+','+f(y)+') scale('+f(h)+')"><path d="M0,0 C-.28,-.05 -.3,-.4 -.1,-.6 C-.12,-.45 0,-.42 .02,-.55 C.08,-.8 .1,-.9 0,-1.1 C.28,-.85 .36,-.4 .26,-.15 C.2,-.03 .08,0 0,0Z" fill="'+c+'"/><path d="M0,0 C-.12,-.03 -.14,-.2 -.04,-.32 C0,-.4 .06,-.5 .04,-.62 C.14,-.46 .16,-.2 .1,-.08Z" fill="'+C.gold2+'"/></g>');
};
P.finish=function(label,quiet){
  var vg=this.rg([[0,"#000",0],[.62,"#000",0],[1,C.ink,.66]],400,250,470);
  this.add('<rect width="800" height="500" fill="'+vg+'"/>');
  this.add('<rect width="800" height="500" fill="'+this.hatch()+'" opacity=".07"/>');
  this.add('<rect x="7" y="7" width="786" height="486" fill="none" stroke="'+C.paper+'" stroke-width="1.2" opacity=".55"/><rect x="13" y="13" width="774" height="474" fill="none" stroke="'+C.paper+'" stroke-width=".6" opacity=".35"/>');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+(label||"Ilustração")+'"><defs>'+this.defs.join('')+'</defs>'+this.b.join('')+'</svg>';
};
function mk(seed){return new Cv(seed);}

/* =====================  CENAS  ===================== */
var SC={};

SC.criacao=function(){
  var s=mk(1);
  s.sky([[0,C.ink],[.45,C.d1],[.7,C.d3],[1,C.m]]);
  s.glow(400,150,380,C.gold,.55);
  s.beams(400,60,Math.PI*.18,Math.PI*.82,520,15,.55);
  s.add('<rect x="0" y="300" width="800" height="200" fill="'+s.lg([[0,C.d2],[1,C.ink]],0,300,0,500)+'"/>');
  s.add('<ellipse cx="400" cy="302" rx="260" ry="9" fill="'+C.gold2+'" opacity=".6"/>');
  s.add('<path d="M330,300 L470,300 L560,500 L240,500Z" fill="'+s.lg([[0,C.gold,.55],[1,C.gold,0]],0,300,0,500)+'"/>');
  s.waves(310,500,16,C.l2,.55,5,3);
  s.sun(400,128,34,C.gold);
  s.add('<path d="M400,215 Q372,232 340,230 Q372,240 400,236 Q428,240 460,230 Q428,232 400,215Z" fill="'+C.paper+'" opacity=".78"/>');
  s.clouds(95,4,C.l2,.1,1.2);
  return s.finish("A Criação: a luz sobre as águas");
};

SC.eden=function(){
  var s=mk(2);
  s.sky([[0,C.d3],[.5,C.l],[1,C.gold2]]);
  s.glow(170,300,360,C.gold2,.9);
  s.beams(170,280,-Math.PI*.9,-Math.PI*.1,520,11,.4);
  s.ridge(330,28,C.m,{seed:4,hatch:.18});
  [60,120,220,280,330].forEach(function(x,i){s.palm(x,360,100+i*14,C.d2);});
  s.cypress(30,370,150,C.d2);s.cypress(360,372,130,C.d2);
  s.ground(380,C.d1,.25);
  s.add('<rect x="0" y="380" width="800" height="120" fill="'+s.lg([[0,C.d1],[1,C.ink]],0,380,0,500)+'"/>');
  s.add('<path d="M380,380 Q520,360 800,400 L800,500 L330,500Z" fill="'+C.d2+'" opacity=".45"/>');
  s.add('<g stroke="'+C.ink+'" stroke-width="2" fill="none" opacity=".7"><path d="M560,470 q10,-18 24,-6 M610,455 q-8,-16 -22,-8 M690,470 q12,-16 22,-2"/></g>');
  s.wings(300,380,230,C.paper,.92);
  s.fig(300,382,235,{col:C.l2,pose:"up",bare:true,rim:1});
  s.add('<line x1="328" y1="150" x2="345" y2="300" stroke="'+C.gold2+'" stroke-width="3"/>');
  s.flame(325,168,60,C.gold);s.flame(332,200,34,C.gold2);
  s.fig(560,440,118,{col:C.ink,pose:"bow"});
  s.fig(612,446,106,{col:C.ink,pose:"bow",flip:-1});
  return s.finish("A expulsão do Éden");
};

SC.diluvio=function(){
  var s=mk(3);
  s.sky([[0,C.ink],[.5,C.d1],[1,C.d3]]);
  s.clouds(80,6,C.d3,.6,1.6);s.clouds(160,5,C.d2,.7,1.4);
  s.rain(220,.35,16);
  s.lightning(600,10,150);
  s.add('<path d="M640,300 L700,215 L760,300Z" fill="'+C.d2+'"/>');
  s.add('<rect x="0" y="300" width="800" height="200" fill="'+s.lg([[0,C.d2],[1,C.ink]],0,300,0,500)+'"/>');
  s.waves(300,500,18,C.l2,.5,9,5);
  s.add('<g transform="translate(340,330) rotate(-7)"><path d="M-170,-18 Q-150,50 -80,56 L90,56 Q160,48 185,-22Z" fill="'+C.ink+'"/><path d="M-130,-20 L-105,-78 L110,-78 L135,-20Z" fill="'+C.d1+'"/><path d="M-145,-78 L0,-125 L145,-78Z" fill="'+C.d2+'"/><g fill="'+C.gold+'" opacity=".85"><rect x="-60" y="-60" width="14" height="14"/><rect x="-10" y="-60" width="14" height="14"/><rect x="40" y="-60" width="14" height="14"/></g><path d="M-170,-18 Q-150,50 -80,56 L90,56 Q160,48 185,-22" fill="none" stroke="'+C.l+'" stroke-width="1.4" opacity=".6"/></g>');
  s.waves(380,500,12,C.paper,.55,12,7);
  s.add('<path d="M0,430 Q120,380 250,425 T520,410 T800,435 L800,500 L0,500Z" fill="'+C.ink+'" opacity=".55"/>');
  s.add('<path d="M20,0 L160,0 L110,150 L-40,150Z" fill="'+s.lg([[0,C.gold2,.28],[1,C.gold2,0]],0,0,0,300)+'"/>');
  return s.finish("O Dilúvio: a arca sobre as águas");
};

SC.arcoiris=function(){
  var s=mk(4);
  s.sky([[0,C.d3],[.5,C.l],[1,C.gold2]]);
  s.clouds(70,5,C.paper,.35,1.6);
  var i,cols=["#b0623e","#d99a46","#e6cf7c","#8a9a6a","#5f7f8a","#6c5f8f"];
  for(i=0;i<cols.length;i++)s.add('<path d="M20,360 A380,300 0 0 1 780,360" fill="none" stroke="'+cols[i]+'" stroke-width="10" opacity=".62" transform="translate(0,'+(i*-10+10)+') scale(1,1)" />');
  s.glow(400,120,300,C.gold2,.5);
  s.ridge(300,70,C.m,{seed:8,sharp:1,hatch:.2,tilt:40});
  s.ridge(360,30,C.d2,{seed:9,hatch:.25});
  s.add('<g transform="translate(560,248) rotate(4)"><path d="M-80,-8 Q-70,26 -36,28 L40,28 Q74,24 86,-10Z" fill="'+C.ink+'"/><path d="M-64,-10 L-52,-44 L56,-44 L68,-10Z" fill="'+C.d1+'"/><path d="M-72,-44 L0,-70 L72,-44Z" fill="'+C.d2+'"/></g>');
  s.ground(420,C.d1,.25);
  s.fig(220,425,110,{col:C.ink,pose:"up"});
  s.fig(268,428,92,{col:C.ink,pose:"stand",flip:-1});
  s.fig(300,430,70,{col:C.ink,pose:"stand"});
  s.sheep(150,440,1.6);s.sheep(125,452,1.4);
  return s.finish("A aliança do arco-íris");
};

SC.babel=function(){
  var s=mk(5);
  s.sky([[0,C.d2],[.45,C.m],[.8,C.gold],[1,C.gold2]]);
  s.glow(620,250,330,C.gold2,.7);
  s.ridge(380,22,C.d3,{seed:12,hatch:.18});
  var i,w=420,x=400,y=390,hh=44;
  for(i=0;i<7;i++){
    var wt=w*(1-i*.125),wb=wt+30;
    s.add('<path d="M'+f(x-wb/2)+','+y+' L'+f(x-wt/2+6)+','+f(y-hh)+' L'+f(x+wt/2-6)+','+f(y-hh)+' L'+f(x+wb/2)+','+y+'Z" fill="'+(i%2?C.d2:C.d1)+'"/>');
    s.add('<path d="M'+f(x-wb/2)+','+y+' L'+f(x-wt/2+6)+','+f(y-hh)+' L'+f(x-wt/2+60)+','+f(y-hh)+' L'+f(x-wb/2+66)+','+y+'Z" fill="'+C.gold+'" opacity=".16"/>');
    s.add('<path d="M'+f(x-wb/2)+','+y+' L'+f(x-wt/2+6)+','+f(y-hh)+' L'+f(x+wt/2-6)+','+f(y-hh)+' L'+f(x+wb/2)+','+y+'Z" fill="'+s.hatch()+'" opacity=".22"/>');
    y-=hh-3;
  }
  s.add('<path d="M185,392 L330,320 L520,240 L560,150" fill="none" stroke="'+C.l+'" stroke-width="3" opacity=".55"/>');
  s.add('<g stroke="'+C.d1+'" stroke-width="2.4" opacity=".9"><line x1="535" y1="120" x2="535" y2="205"/><line x1="515" y1="150" x2="560" y2="150"/><line x1="515" y1="175" x2="560" y2="175"/><line x1="470" y1="170" x2="470" y2="230"/></g>');
  s.clouds(150,3,C.paper,.35,1.3,200,700);
  s.ground(420,C.d1,.25);
  s.add('<g fill="'+C.d3+'"><rect x="70" y="400" width="48" height="22"/><rect x="80" y="388" width="48" height="14"/><rect x="660" y="402" width="50" height="22"/></g>');
  s.crowd(14,40,760,420,470,22,40,C.ink,"stand",4);
  return s.finish("A Torre de Babel");
};

SC.estrelas=function(){
  var s=mk(6);
  s.sky([[0,"#0c0806"],[.6,C.d1],[1,C.d3]]);
  s.add('<path d="M-40,420 L260,80 L520,-30 L640,-30 L380,150 L120,500Z" fill="'+C.l2+'" opacity=".09"/>');
  s.stars(300,0,330);
  s.glow(520,120,230,C.gold,.28);
  s.ridge(380,34,C.d2,{seed:14,hatch:.2});
  s.ridge(425,22,C.ink,{seed:15});
  s.add('<g transform="translate(150,430)"><path d="M-70,0 L0,-62 L70,0Z" fill="'+C.d1+'"/><path d="M-6,0 L0,-30 L6,0Z" fill="'+C.gold+'" opacity=".85"/></g>');
  s.glow(150,425,50,C.gold,.55);
  s.add('<g transform="translate(680,430)"><rect x="-4" y="-80" width="8" height="80" fill="'+C.ink+'"/><ellipse cx="0" cy="-100" rx="120" ry="34" fill="'+C.ink+'"/><ellipse cx="-70" cy="-80" rx="70" ry="22" fill="'+C.ink+'"/></g>');
  s.fig(350,442,118,{col:C.ink,pose:"up",rim:1,staff:0});
  return s.finish("Abraão e as estrelas do céu");
};

SC.isaque=function(){
  var s=mk(7);
  s.sky([[0,C.d2],[.5,C.l],[1,C.gold2]]);
  s.sun(640,230,22,C.gold);
  s.ridge(330,40,C.m,{seed:18,hatch:.2});
  s.ridge(420,95,C.d2,{seed:21,sharp:.9,hatch:.3,shape:function(t,y){return y+Math.abs(t-.45)*140-10;}});
  s.add('<path d="M280,300 L520,300 L560,500 L240,500Z" fill="'+C.d1+'"/>');
  s.add('<g fill="'+C.d3+'"><rect x="360" y="278" width="90" height="26"/><rect x="372" y="262" width="70" height="18"/></g><rect x="360" y="278" width="90" height="26" fill="'+s.hatch()+'" opacity=".4"/>');
  s.add('<ellipse cx="400" cy="262" rx="28" ry="6" fill="'+C.ink+'"/>');
  s.fig(480,300,120,{col:C.ink,pose:"up",flip:-1});
  s.beams(180,40,Math.PI*.1,Math.PI*.34,520,6,.7);
  s.glow(195,70,120,C.gold2,.9);
  s.wings(190,140,120,C.paper,.95);
  s.fig(192,144,104,{col:C.l2,pose:"out",bare:true,rim:1});
  s.add('<g transform="translate(650,370)"><ellipse cx="0" cy="-12" rx="22" ry="12" fill="'+C.d3+'"/><circle cx="20" cy="-20" r="7" fill="'+C.d3+'"/><path d="M22,-26 q10,-12 0,-22 M26,-26 q14,-6 8,-18" stroke="'+C.d3+'" stroke-width="3" fill="none"/><path d="M-30,0 l30,-30 l30,30 M-20,5 l30,-45" stroke="'+C.ink+'" stroke-width="1.6" fill="none"/></g>');
  s.ground(455,C.ink);
  return s.finish("O sacrifício de Isaque: o anjo detém Abraão");
};

SC.escada=function(){
  var s=mk(8);
  s.sky([[0,"#0a0705"],[.55,C.d1],[1,C.d2]]);
  s.stars(120,0,260);
  s.glow(560,40,320,C.gold,.55);
  s.add('<polygon points="560,0 300,500 700,500" fill="'+s.lg([[0,C.gold2,.5],[1,C.gold2,0]],560,0,500,500)+'"/>');
  var i;
  s.add('<g stroke="'+C.gold2+'" stroke-linecap="round" opacity=".95"><line x1="300" y1="470" x2="545" y2="30" stroke-width="4"/><line x1="360" y1="470" x2="580" y2="30" stroke-width="4"/>');
  for(i=0;i<14;i++){var t=i/13,xa=300+245*t+ (1-t)*0,ya=470-440*t;s.add('<line x1="'+f(300+245*t)+'" y1="'+f(470-440*t)+'" x2="'+f(360+220*t)+'" y2="'+f(470-440*t)+'" stroke-width="2.4"/>');}
  s.add('</g>');
  for(i=0;i<6;i++){var tt=.1+i*.15,ax=330+230*tt+(i%2?18:-20),ay=470-440*tt;s.wings(ax,ay+34,60+ (1-tt)*40,C.paper,.9);s.fig(ax,ay+36,56+(1-tt)*40,{col:C.l2,bare:true,pose:i%2?"stand":"up"});}
  s.ridge(430,26,C.d1,{seed:22,hatch:.2});
  s.ground(450,C.ink,.2);
  s.add('<ellipse cx="160" cy="470" rx="26" ry="12" fill="'+C.d3+'"/>');
  s.fig(150,470,70,{col:C.d1,pose:"fallen"});
  return s.finish("O sonho de Jacó: a escada que chega ao céu");
};

SC.sarca=function(){
  var s=mk(9);
  s.sky([[0,C.d2],[.6,C.d3],[1,C.m]]);
  s.ridge(250,70,C.d3,{seed:31,sharp:1,hatch:.3});
  s.ridge(340,42,C.d2,{seed:33,hatch:.25});
  s.ground(380,C.d1,.3);
  s.add('<rect x="0" y="380" width="800" height="120" fill="'+s.lg([[0,C.d1],[1,C.ink]],0,380,0,500)+'"/>');
  s.glow(500,340,260,C.gold,.75);
  s.add('<g stroke="'+C.d1+'" stroke-width="3" fill="none"><path d="M500,420 L470,350 M500,420 L520,340 M500,420 L560,360 M500,420 L440,390"/></g>');
  s.flame(470,370,120,C.gold);s.flame(520,372,150,C.gold);s.flame(560,376,100,C.gold);s.flame(500,376,190,C.gold2);
  s.fig(250,445,150,{col:C.ink,pose:"bow",staff:1});
  s.add('<g fill="'+C.d3+'"><ellipse cx="205" cy="448" rx="9" ry="3"/><ellipse cx="228" cy="452" rx="9" ry="3"/></g>');
  s.sheep(110,430,1.5);s.sheep(150,445,1.3);s.sheep(70,450,1.4);
  return s.finish("A sarça ardente");
};

SC.marvermelho=function(){
  var s=mk(10);
  s.sky([[0,C.d2],[.5,C.l],[1,C.gold2]]);
  s.glow(400,190,200,C.gold2,.95);
  s.add('<path d="M0,0 L372,50 L388,232 L140,500 L0,500Z" fill="'+s.lg([[0,C.ink],[.6,C.d2],[1,C.d3]],0,0,300,500)+'"/>');
  s.add('<path d="M800,0 L428,50 L412,232 L660,500 L800,500Z" fill="'+s.lg([[0,C.ink],[.6,C.d2],[1,C.d3]],800,0,500,500)+'"/>');
  var i;
  for(i=0;i<16;i++){var yy=60+i*i*1.7+i*10;s.add('<path d="M'+f(2+i*20)+','+f(yy+20)+' Q'+f(120+i*14)+','+f(yy-14)+' '+f(300+i*5)+','+f(yy+8)+'" stroke="'+C.l2+'" stroke-width="'+f(.7+i*.08)+'" fill="none" opacity=".32"/>');s.add('<path d="M'+f(798-i*20)+','+f(yy+20)+' Q'+f(680-i*14)+','+f(yy-14)+' '+f(500-i*5)+','+f(yy+8)+'" stroke="'+C.l2+'" stroke-width="'+f(.7+i*.08)+'" fill="none" opacity=".32"/>');}
  s.add('<path d="M140,500 L388,232 L412,232 L660,500Z" fill="'+s.lg([[0,C.d3],[1,C.l]],0,232,0,500)+'"/>');
  s.add('<path d="M140,500 L388,232 L412,232 L660,500Z" fill="'+s.hatch()+'" opacity=".2"/>');
  s.add('<path d="M388,232 L330,0 L470,0 L412,232Z" fill="'+C.gold2+'" opacity=".5"/>');
  s.crowd(26,330,470,252,440,7,26,C.ink,"stand",11);
  s.fig(560,495,150,{col:C.ink,pose:"up",staff:1,flip:-1});
  s.add('<line x1="338" y1="330" x2="338" y2="330"/>');
  return s.finish("A travessia do Mar Vermelho");
};

SC.sinai=function(){
  var s=mk(11);
  s.sky([[0,C.ink],[.5,C.d1],[1,C.d3]]);
  s.clouds(110,5,C.d3,.8,2,200,640);s.clouds(180,4,C.d2,.8,1.6,200,640);
  s.glow(400,180,230,C.gold,.6);
  s.lightning(330,30,170);s.lightning(480,50,150);
  s.ridge(280,120,C.d2,{seed:41,sharp:1,hatch:.35,shape:function(t,y){return y+Math.abs(t-.5)*260-60;}});
  s.add('<path d="M360,160 L400,110 L450,165 L430,250 L370,250Z" fill="'+C.gold+'" opacity=".22"/>');
  s.ridge(400,34,C.d1,{seed:44,hatch:.25});
  s.ground(430,C.ink,.2);
  var i;for(i=0;i<9;i++)s.add('<path d="M'+(60+i*78)+',455 l22,-26 l22,26Z" fill="'+C.d2+'"/>');
  s.crowd(40,50,770,445,480,10,18,C.d1,"stand",21);
  return s.finish("O monte Sinai");
};

SC.jerico=function(){
  var s=mk(12);
  s.sky([[0,C.d3],[.6,C.l],[1,C.gold2]]);
  s.clouds(260,6,C.l2,.55,2.2);
  s.ridge(360,30,C.m,{seed:50,hatch:.2});
  var tw=function(x,y,w,h){s.add('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+C.d2+'"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+s.hatch()+'" opacity=".3"/>');var i;for(i=0;i<w/14;i++)s.add('<rect x="'+(x+i*14+2)+'" y="'+(y-9)+'" width="8" height="9" fill="'+C.d2+'"/>');};
  tw(330,240,200,110);tw(520,200,70,150);tw(300,220,50,130);
  s.add('<path d="M330,350 L360,300 L395,330 L420,290 L450,340 L470,310 L520,350Z" fill="'+C.ink+'" opacity=".55"/>');
  s.add('<path d="M395,240 L430,240 L420,300 L400,300Z" fill="'+C.ink+'" opacity=".5"/>');
  s.add('<path d="M470,240 L520,240 L505,330 L480,330Z" fill="'+C.paper+'" opacity=".35"/>');
  s.clouds(330,8,C.l2,.75,1.4,260,640);
  s.ground(390,C.d1,.25);
  s.add('<rect x="0" y="390" width="800" height="110" fill="'+s.lg([[0,C.d1],[1,C.ink]],0,390,0,500)+'"/>');
  var i;for(i=0;i<6;i++){s.fig(60+i*60,445+(i%2)*14,86,{col:C.ink,pose:i%2?"up":"stand"});}
  s.fig(90,470,110,{col:C.ink,pose:"up"});
  s.add('<g stroke="'+C.ink+'" stroke-width="3" stroke-linecap="round"><line x1="196" y1="368" x2="226" y2="352"/><line x1="258" y1="372" x2="288" y2="358"/></g>');
  s.crowd(18,150,760,430,490,50,100,C.ink,"stand",23);
  return s.finish("A queda das muralhas de Jericó");
};

SC.golias=function(){
  var s=mk(13);
  s.sky([[0,C.d3],[.6,C.l],[1,C.l2]]);
  s.clouds(110,4,C.paper,.4,1.6);
  s.ridge(330,36,C.m,{seed:61,hatch:.2,tilt:60});
  s.ridge(400,26,C.d2,{seed:62,hatch:.25});
  s.ground(430,C.d1,.3);
  s.add('<rect x="0" y="430" width="800" height="70" fill="'+C.ink+'" opacity=".55"/>');
  s.add('<path d="M0,470 Q400,420 800,470" stroke="'+C.l2+'" stroke-width="2" fill="none" opacity=".4"/>');
  s.fig(210,455,120,{col:C.ink,pose:"point",rim:1});
  s.add('<path d="M236,372 Q300,330 360,350" stroke="'+C.l2+'" stroke-width="1.5" stroke-dasharray="4 6" fill="none" opacity=".85"/><circle cx="300" cy="338" r="4" fill="'+C.paper+'"/>');
  s.add('<g transform="translate(590,450)"><path d="M-48,-150 Q-48,-210 0,-215 Q48,-210 48,-150Z" fill="'+C.ink+'"/><path d="M-6,-215 L0,-250 L6,-215Z" fill="'+C.d3+'"/><path d="M-52,-148 L52,-148 L70,0 L-70,0Z" fill="'+C.d1+'"/><path d="M-52,-148 L52,-148 L70,0 L-70,0Z" fill="'+s.hatch()+'" opacity=".35"/><circle cx="-62" cy="-90" r="46" fill="'+C.d3+'" stroke="'+C.ink+'" stroke-width="4"/><circle cx="-62" cy="-90" r="14" fill="'+C.l+'"/><line x1="64" y1="-200" x2="64" y2="6" stroke="'+C.ink+'" stroke-width="5"/><path d="M64,-215 l-8,22 h16Z" fill="'+C.ink+'"/></g>');
  s.glow(120,330,160,C.gold2,.35);
  return s.finish("Davi e Golias no vale de Elá");
};

SC.carmelo=function(){
  var s=mk(14);
  s.sky([[0,C.ink],[.4,C.d2],[1,C.m]]);
  s.clouds(120,5,C.d3,.8,1.8);
  s.add('<rect x="352" y="0" width="96" height="330" fill="'+s.lg([[0,C.gold2,.95],[1,C.gold,.2]],0,0,0,330)+'"/>');
  s.glow(400,320,230,C.gold,.85);
  s.ridge(330,28,C.d2,{seed:71,hatch:.3});
  s.add('<path d="M0,340 Q200,325 400,340 T800,340" stroke="'+C.l2+'" stroke-width="1.5" fill="none" opacity=".4"/>');
  s.add('<path d="M120,308 q10,-14 24,-6 q14,-8 22,6Z" fill="'+C.l2+'" opacity=".6"/>');
  s.ground(400,C.d1,.25);
  s.add('<rect x="0" y="400" width="800" height="100" fill="'+C.ink+'" opacity=".6"/>');
  s.add('<g fill="'+C.d3+'"><rect x="350" y="380" width="100" height="22"/><rect x="362" y="366" width="76" height="16"/><rect x="376" y="354" width="48" height="14"/></g>');
  s.flame(380,358,90,C.gold);s.flame(420,358,100,C.gold);s.flame(400,360,150,C.gold2);
  s.fig(220,440,160,{col:C.ink,pose:"up",rim:1});
  s.fig(560,470,90,{col:C.ink,pose:"fallen"});s.fig(640,455,70,{col:C.ink,pose:"fallen",flip:-1});s.fig(700,468,76,{col:C.ink,pose:"bow"});
  return s.finish("Elias no monte Carmelo: o fogo do Senhor");
};

SC.daniel=function(){
  var s=mk(15);
  s.add('<rect width="800" height="500" fill="'+C.ink+'"/>');
  var i;
  for(i=0;i<9;i++)s.add('<rect x="0" y="'+(i*58)+'" width="800" height="3" fill="'+C.d2+'" opacity=".5"/>');
  s.add('<rect width="800" height="500" fill="'+s.hatch()+'" opacity=".12"/>');
  s.add('<polygon points="330,0 470,0 640,500 160,500" fill="'+s.lg([[0,C.gold2,.9],[1,C.gold,.05]],0,0,0,500)+'"/>');
  s.glow(400,0,300,C.gold2,.7);
  s.add('<rect x="0" y="440" width="800" height="60" fill="'+C.d1+'"/>');
  s.wings(400,455,200,C.paper,.5);
  s.fig(400,462,180,{col:C.d1,pose:"up",rim:1});
  var lion=function(x,y,k,fl){s.add('<g transform="translate('+x+','+y+') scale('+(k*fl)+','+k+')"><ellipse cx="0" cy="-16" rx="42" ry="14" fill="'+C.d2+'"/><path d="M-40,-18 Q-66,-26 -60,-4" stroke="'+C.d2+'" stroke-width="4" fill="none"/><circle cx="40" cy="-24" r="17" fill="'+C.d1+'"/><ellipse cx="50" cy="-22" rx="9" ry="7" fill="'+C.d3+'"/><path d="M-20,-4 l0,6 M-4,-4 l0,6 M22,-4 l16,5 M30,-8 l16,5" stroke="'+C.d2+'" stroke-width="5" stroke-linecap="round"/></g>');};
  lion(180,470,1.4,1);lion(640,470,1.5,-1);lion(300,490,.9,1);lion(520,492,.95,-1);
  return s.finish("Daniel na cova dos leões");
};

SC.jonas=function(){
  var s=mk(16);
  s.sky([[0,C.ink],[.5,C.d1],[1,C.d3]]);
  s.clouds(90,6,C.d3,.7,1.7);s.clouds(170,5,C.d2,.7,1.4);
  s.rain(160,.3,15);
  s.lightning(250,0,170);
  s.add('<rect x="0" y="300" width="800" height="200" fill="'+s.lg([[0,C.d2],[1,C.ink]],0,300,0,500)+'"/>');
  s.waves(300,500,16,C.l2,.5,10,9);
  s.add('<g transform="translate(150,340) rotate(12)"><path d="M-70,-4 Q-60,30 -30,32 L40,32 Q64,26 76,-8Z" fill="'+C.ink+'"/><line x1="0" y1="-8" x2="0" y2="-110" stroke="'+C.ink+'" stroke-width="4"/><path d="M4,-104 Q50,-70 44,-20 L4,-24Z" fill="'+C.l2+'" opacity=".8"/><path d="M-2,-100 L-40,-40 L-2,-30Z" fill="'+C.d3+'" opacity=".9"/></g>');
  s.add('<g transform="translate(560,400)"><path d="M-190,10 Q-160,-60 -60,-70 Q60,-90 150,-30 Q210,-70 250,-120 Q250,-60 210,-10 Q250,20 270,70 Q200,40 150,40 Q40,60 -100,46 Q-170,40 -190,10Z" fill="'+C.ink+'"/><path d="M-190,10 Q-160,-60 -60,-70 Q60,-90 150,-30 Q210,-70 250,-120" fill="none" stroke="'+C.l+'" stroke-width="1.5" opacity=".5"/><circle cx="-120" cy="-18" r="7" fill="'+C.gold2+'"/><path d="M-188,8 Q-130,20 -80,6" stroke="'+C.d3+'" stroke-width="2" fill="none"/></g>');
  s.add('<g transform="translate(400,380)"><path d="M0,0 l10,18 l-10,16 l-10,-14Z" fill="'+C.paper+'" opacity=".9"/><circle cx="0" cy="-6" r="6" fill="'+C.paper+'" opacity=".9"/></g>');
  s.waves(420,500,9,C.paper,.55,12,10);
  return s.finish("Jonas e o grande peixe");
};

SC.ossos=function(){
  var s=mk(17);
  s.sky([[0,C.d1],[.5,C.d3],[1,C.l]]);
  s.beams(520,-10,Math.PI*.3,Math.PI*.7,600,8,.45);
  s.clouds(110,5,C.l2,.3,2);
  s.ridge(310,36,C.d3,{seed:81,hatch:.25});
  s.ridge(370,28,C.d2,{seed:82,hatch:.3});
  s.ground(400,C.d1,.3);
  s.add('<rect x="0" y="400" width="800" height="100" fill="'+s.lg([[0,C.d1],[1,C.ink]],0,400,0,500)+'"/>');
  var r=s.r,i,sc='';
  for(i=0;i<16;i++){var x=40+r()*720,y=410+r()*80,k=.7+(y-410)/80*.9;
    var t=Math.floor(r()*3);
    if(t===0)sc+='<g transform="translate('+f(x)+','+f(y)+') scale('+f(k)+')"><circle r="9" fill="'+C.l2+'"/><rect x="-5" y="6" width="10" height="6" fill="'+C.l2+'"/><circle cx="-3.5" cy="-1" r="2.2" fill="'+C.ink+'"/><circle cx="3.5" cy="-1" r="2.2" fill="'+C.ink+'"/></g>';
    else if(t===1)sc+='<g transform="translate('+f(x)+','+f(y)+') rotate('+f(r()*180)+') scale('+f(k)+')" stroke="'+C.l2+'" stroke-width="3" stroke-linecap="round"><line x1="-22" y1="0" x2="22" y2="0"/><circle cx="-23" cy="0" r="3" fill="'+C.l2+'"/><circle cx="23" cy="0" r="3" fill="'+C.l2+'"/></g>';
    else sc+='<g transform="translate('+f(x)+','+f(y)+') scale('+f(k)+')" stroke="'+C.l2+'" stroke-width="2.4" fill="none"><path d="M-14,-4 Q0,-16 14,-4 M-12,3 Q0,-8 12,3 M-9,10 Q0,2 9,10"/><line x1="0" y1="-12" x2="0" y2="14"/></g>';
  }
  s.add(sc);
  s.add('<g opacity=".28">');
  s.add('<ellipse cx="560" cy="330" rx="130" ry="40" fill="'+C.l2+'"/>');
  s.add('</g>');
  s.fig(620,350,92,{col:C.l2,pose:"stand",bare:true});s.fig(690,356,86,{col:C.l2,pose:"up",bare:true});s.fig(540,358,84,{col:C.l2,bare:true});
  s.add('<path d="M0,300 q120,-30 240,0 t240,0 t240,10 t80,-8" stroke="'+C.paper+'" stroke-width="1.4" fill="none" opacity=".35"/><path d="M0,340 q150,-30 300,0 t300,0 t200,-6" stroke="'+C.paper+'" stroke-width="1.2" fill="none" opacity=".3"/>');
  s.fig(170,420,150,{col:C.ink,pose:"out",rim:1});
  return s.finish("O vale de ossos secos");
};

SC.pastor=function(){
  var s=mk(18);
  s.sky([[0,C.d3],[.45,C.l],[.8,C.gold2],[1,C.gold]]);
  s.sun(620,280,30,C.gold);
  s.ridge(310,40,C.m,{seed:91,hatch:.18});
  s.ridge(350,24,C.d3,{seed:92,hatch:.22});
  s.add('<path d="M-10,380 Q250,350 500,390 T810,400 L810,510 L-10,510Z" fill="'+C.d2+'"/>');
  s.add('<path d="M-10,380 Q250,350 500,390 T810,400 L810,510 L-10,510Z" fill="'+s.hatch()+'" opacity=".22"/>');
  s.add('<path d="M120,500 Q300,430 420,470 T700,430" stroke="'+C.l2+'" stroke-width="12" fill="none" opacity=".5" stroke-linecap="round"/>');
  s.olive(70,390,120,C.d1);s.olive(740,410,110,C.ink);s.cypress(670,400,100,C.ink);
  var i,r=s.r;for(i=0;i<12;i++)s.sheep(300+r()*340,420+r()*60,1.1+r()*.5,C.l2);
  s.fig(250,455,190,{col:C.ink,pose:"stand",staff:1,rim:1});
  return s.finish("O Senhor é o meu pastor");
};

SC.natividade=function(){
  var s=mk(19);
  s.sky([[0,"#0a0705"],[.55,C.d1],[1,C.d3]]);
  s.stars(180,0,300);
  s.glow(400,100,330,C.gold,.6);
  s.beams(400,90,Math.PI*.15,Math.PI*.85,480,13,.5);
  s.ridge(380,28,C.d2,{seed:101,hatch:.2});
  s.add('<g transform="translate(610,368)"><g fill="'+C.ink+'"><rect x="-60" y="-34" width="38" height="34"/><rect x="-18" y="-46" width="44" height="46"/><rect x="30" y="-28" width="34" height="28"/></g><g fill="'+C.gold+'" opacity=".8"><rect x="-8" y="-30" width="6" height="8"/><rect x="10" y="-30" width="6" height="8"/><rect x="-48" y="-22" width="6" height="7"/></g></g>');
  s.add('<polygon points="610,150 616,176 640,182 616,190 610,216 604,190 580,182 604,176" fill="'+C.gold2+'"/>');
  s.glow(610,182,60,C.gold,.6);
  s.wings(400,185,150,C.paper,.95);
  s.fig(400,190,128,{col:C.gold2,pose:"out",bare:true,rim:1});
  s.glow(400,125,70,C.gold2,.95);
  s.ground(430,C.ink,.2);
  s.add('<rect x="0" y="430" width="800" height="70" fill="'+C.ink+'"/>');
  s.fig(170,455,120,{col:C.ink,pose:"kneel",arms:"up"});
  s.fig(260,450,126,{col:C.ink,pose:"stand",staff:1});
  s.fig(520,456,112,{col:C.ink,pose:"bow",flip:-1});
  s.sheep(380,462,1.5,C.d3);s.sheep(450,470,1.5,C.d3);s.sheep(90,470,1.4,C.d3);
  return s.finish("O anúncio aos pastores");
};

SC.magos=function(){
  var s=mk(20);
  s.sky([[0,"#0a0705"],[.55,C.d1],[1,C.d3]]);
  s.stars(220,0,300);
  var star=function(x,y,R,r){var p=[],i;for(i=0;i<16;i++){var a=-Math.PI/2+i*Math.PI/8,rr=i%2?r:R;p.push(f(x+Math.cos(a)*rr)+','+f(y+Math.sin(a)*rr));}return '<polygon points="'+p.join(' ')+'" fill="'+C.gold2+'"/>';};
  s.glow(610,110,230,C.gold,.75);
  s.beams(610,110,Math.PI*.55,Math.PI*.9,520,5,.55);
  s.add(star(610,110,62,10));
  s.add('<line x1="530" y1="110" x2="690" y2="110" stroke="'+C.gold2+'" stroke-width="1.5" opacity=".8"/>');
  s.ridge(380,18,C.d3,{seed:111,hatch:.2,n:50});
  s.add('<g transform="translate(700,356)"><g fill="'+C.d1+'"><rect x="-70" y="-44" width="140" height="44"/><path d="M-40,-44 q40,-44 80,0Z"/><rect x="-80" y="-60" width="14" height="60"/></g><g fill="'+C.gold+'" opacity=".7"><rect x="-30" y="-24" width="8" height="11"/><rect x="20" y="-24" width="8" height="11"/></g></g>');
  s.add('<path d="M-10,430 Q150,370 320,420 T620,400 T810,420 L810,510 L-10,510Z" fill="'+C.d1+'"/><path d="M-10,470 Q200,430 420,470 T810,460 L810,510 L-10,510Z" fill="'+C.ink+'"/>');
  s.camel(210,420,130,C.ink);s.camel(360,405,120,C.ink);s.camel(500,415,126,C.ink);
  s.fig(210,360,46,{col:C.ink,pose:"stand"});s.fig(360,350,44,{col:C.ink,pose:"stand"});s.fig(500,358,44,{col:C.ink,pose:"stand"});
  s.palm(80,430,130,C.ink);
  return s.finish("Os magos do Oriente seguem a estrela");
};

SC.sermao=function(){
  var s=mk(21);
  s.sky([[0,C.d3],[.5,C.l],[1,C.gold2]]);
  s.sun(600,120,26,C.gold);
  s.beams(600,120,Math.PI*.3,Math.PI*.75,520,9,.25);
  s.clouds(80,4,C.paper,.45,1.6);
  s.add('<path d="M0,240 Q200,230 400,252 T800,240 L800,300 L0,300Z" fill="'+C.m+'" opacity=".7"/>');
  s.add('<path d="M0,262 L800,262" stroke="'+C.l2+'" stroke-width="2" opacity=".55"/>');
  s.ridge(260,24,C.d3,{seed:121,hatch:.18,x0:-10,x1:810});
  s.add('<path d="M-10,300 Q250,270 460,320 T810,330 L810,510 L-10,510Z" fill="'+C.d2+'"/><path d="M-10,300 Q250,270 460,320 T810,330 L810,510 L-10,510Z" fill="'+s.hatch()+'" opacity=".25"/>');
  s.add('<path d="M250,310 Q400,260 560,330 L520,345 Q400,300 280,340Z" fill="'+C.d3+'"/>');
  s.crowd(46,60,760,360,480,34,84,C.ink,"stand",31);
  s.fig(410,310,92,{col:C.l2,pose:"out",rim:1});
  s.glow(410,250,90,C.gold2,.55);
  return s.finish("O Sermão do Monte");
};

SC.tempestade=function(){
  var s=mk(22);
  s.sky([[0,C.ink],[.5,C.d1],[1,C.d3]]);
  s.clouds(80,6,C.d3,.75,1.8);s.clouds(160,5,C.d2,.7,1.5);
  s.rain(200,.35,16);
  s.lightning(660,0,160);
  s.add('<polygon points="400,0 270,260 540,260" fill="'+s.lg([[0,C.gold2,.4],[1,C.gold2,0]],400,0,400,260)+'"/>');
  s.add('<rect x="0" y="290" width="800" height="210" fill="'+s.lg([[0,C.d2],[1,C.ink]],0,290,0,500)+'"/>');
  s.waves(290,500,17,C.l2,.5,12,12);
  s.add('<g transform="translate(400,340) rotate(-9)"><path d="M-190,-14 Q-160,56 -90,62 L100,62 Q180,54 205,-24Z" fill="'+C.ink+'"/><path d="M-190,-14 Q-160,56 -90,62 L100,62 Q180,54 205,-24" fill="none" stroke="'+C.l+'" stroke-width="1.6" opacity=".6"/><line x1="-20" y1="-14" x2="-20" y2="-190" stroke="'+C.d1+'" stroke-width="5"/><path d="M-16,-184 Q60,-150 50,-40 L-16,-44Z" fill="'+C.l2+'" opacity=".78"/><path d="M-24,-180 L-90,-80 L-24,-60Z" fill="'+C.d3+'" opacity=".9"/></g>');
  s.fig(340,305,70,{col:C.ink,pose:"stand"});s.fig(400,312,66,{col:C.ink,pose:"up",flip:-1});s.fig(300,312,60,{col:C.ink,pose:"bow"});
  s.fig(500,296,98,{col:C.l2,pose:"up",rim:1});
  s.glow(500,250,84,C.gold2,.6);
  s.waves(400,500,10,C.paper,.55,14,13);
  return s.finish("Jesus acalma a tempestade");
};

SC.getsemani=function(){
  var s=mk(23);
  s.sky([[0,"#0a0705"],[.6,C.d1],[1,C.d2]]);
  s.stars(120,0,240);
  s.glow(640,90,60,C.gold2,.9);s.add('<circle cx="640" cy="90" r="22" fill="'+C.gold2+'"/>');s.glow(640,90,240,C.gold2,.3);
  s.add('<g fill="'+C.d3+'" transform="translate(120,300)"><rect x="0" y="-30" width="560" height="30"/>'+(function(){var q='',i;for(i=0;i<20;i++)q+='<rect x="'+(i*28+3)+'" y="-38" width="14" height="9"/>';return q;})()+'<rect x="240" y="-72" width="40" height="72"/><path d="M300,-30 q30,-60 60,0Z"/></g>');
  s.ridge(330,20,C.d2,{seed:131,hatch:.2});
  s.ground(380,C.d1,.2);
  s.add('<rect x="0" y="380" width="800" height="120" fill="'+s.lg([[0,C.d1],[1,C.ink]],0,380,0,500)+'"/>');
  s.olive(100,420,260,C.ink);s.olive(300,400,200,C.ink);s.olive(700,430,250,C.ink);
  s.add('<polygon points="460,0 400,440 540,440" fill="'+s.lg([[0,C.gold2,.45],[1,C.gold2,0]],470,0,470,440)+'"/>');
  s.add('<ellipse cx="470" cy="438" rx="52" ry="14" fill="'+C.d3+'"/>');
  s.fig(468,440,112,{col:C.l2,pose:"kneel",arms:"up",rim:1});
  s.fig(150,480,74,{col:C.ink,pose:"fallen"});s.fig(260,488,70,{col:C.ink,pose:"fallen",flip:-1});s.fig(350,484,72,{col:C.ink,pose:"fallen"});
  var i,r=s.r;for(i=0;i<9;i++)s.add('<circle cx="'+f(600+r()*130)+'" cy="'+f(392+r()*18)+'" r="2.6" fill="'+C.gold+'"/>');
  s.glow(660,400,60,C.gold,.35);
  return s.finish("Jesus no Getsêmani");
};

SC.cruz=function(){
  var s=mk(24);
  s.sky([[0,"#070504"],[.6,C.d1],[1,C.d3]]);
  s.glow(400,330,420,C.gold,.28);
  s.clouds(100,7,C.d3,.8,2);s.clouds(220,5,C.d2,.8,1.8);
  s.add('<g fill="'+C.d1+'" transform="translate(60,360)"><rect x="0" y="-26" width="220" height="26"/><rect x="30" y="-50" width="30" height="50"/><rect x="140" y="-40" width="46" height="40"/></g>');
  s.ridge(380,18,C.d2,{seed:141,hatch:.25,x0:-10,x1:810});
  s.add('<path d="M120,500 Q300,400 400,385 Q520,400 700,500Z" fill="'+C.ink+'"/>');
  s.add('<path d="M120,500 Q300,400 400,385 Q520,400 700,500Z" fill="'+s.hatch()+'" opacity=".25"/>');
  s.cross(300,396,170,C.ink);s.cross(500,396,170,C.ink);s.cross(400,384,230,C.ink);
  s.add('<g fill="'+C.ink+'"><circle cx="400" cy="205" r="9"/><path d="M386,214 Q400,222 414,214 L410,262 L390,262Z"/></g>');
  s.add('<g fill="'+C.d2+'" opacity=".95"><circle cx="400" cy="205" r="9"/></g>');
  s.glow(400,200,70,C.gold,.18);
  s.fig(350,460,86,{col:C.d1,pose:"kneel"});s.fig(448,468,80,{col:C.d1,pose:"kneel",flip:-1});s.fig(500,474,84,{col:C.d1,pose:"bow"});
  return s.finish("A crucificação");
};

SC.tumulo=function(){
  var s=mk(25);
  s.sky([[0,C.d2],[.45,C.m],[.8,C.gold],[1,C.gold2]]);
  s.sun(520,330,36,C.gold);
  s.beams(520,330,-Math.PI*.95,-Math.PI*.05,520,12,.28);
  s.ridge(330,30,C.d3,{seed:151,hatch:.2});
  s.add('<path d="M-10,500 L-10,230 Q60,170 170,160 Q290,170 330,260 L360,500Z" fill="'+C.d2+'"/><path d="M-10,500 L-10,230 Q60,170 170,160 Q290,170 330,260 L360,500Z" fill="'+s.hatch()+'" opacity=".35"/>');
  s.add('<path d="M130,420 L130,330 Q130,290 175,290 Q220,290 220,330 L220,420Z" fill="'+C.ink+'"/>');
  s.glow(176,360,100,C.gold2,.95);
  s.add('<path d="M140,420 L140,334 Q140,302 176,302 Q212,302 212,334 L212,420Z" fill="'+C.gold2+'" opacity=".85"/>');
  s.add('<circle cx="268" cy="388" r="40" fill="'+C.d3+'" stroke="'+C.ink+'" stroke-width="3"/><circle cx="268" cy="388" r="40" fill="'+s.hatch()+'" opacity=".3"/>');
  s.ground(430,C.d1,.2);
  s.add('<rect x="0" y="430" width="800" height="70" fill="'+C.ink+'" opacity=".7"/>');
  s.wings(176,426,150,C.paper,.7);
  s.fig(176,428,120,{col:C.paper,pose:"stand",bare:true});
  s.olive(60,470,140,C.d1);s.olive(760,450,150,C.ink);
  s.fig(560,460,110,{col:C.ink,pose:"bow"});s.fig(620,466,102,{col:C.ink,pose:"kneel",flip:-1});s.fig(680,462,96,{col:C.ink,pose:"stand"});
  return s.finish("O túmulo vazio");
};

SC.pentecostes=function(){
  var s=mk(26);
  s.add('<rect width="800" height="500" fill="'+s.lg([[0,C.ink],[1,C.d2]],0,0,0,500)+'"/>');
  var i;
  for(i=0;i<5;i++)s.add('<path d="M'+(i*190-20)+',500 L'+(i*190-20)+',210 Q'+(i*190+75)+',90 '+(i*190+170)+',210 L'+(i*190+170)+',500Z" fill="none" stroke="'+C.d3+'" stroke-width="3" opacity=".7"/>');
  s.add('<rect width="800" height="500" fill="'+s.hatch()+'" opacity=".1"/>');
  s.glow(400,0,420,C.gold,.7);
  s.beams(400,-10,Math.PI*.2,Math.PI*.8,600,14,.5);
  s.add('<g stroke="'+C.l2+'" stroke-width="1.4" fill="none" opacity=".35"><path d="M30,120 q60,-40 120,0 t120,0"/><path d="M520,90 q60,-40 120,0 t120,0"/><path d="M80,200 q80,-30 160,0 t160,0"/></g>');
  s.add('<rect x="0" y="440" width="800" height="60" fill="'+C.ink+'"/>');
  var xs=[110,210,310,410,510,610,700,160,260,360,460,560,650],r=s.r;
  xs.forEach(function(x,k){var row=k<7?0:1,y=row?478:452,h=row?112:96;s.fig(x,y,h,{col:C.ink,pose:k%3===0?"up":"stand",rim:1,flip:r()>.5?1:-1});
    var hy=y-h*1.0-8;s.flame(x,hy+10,34,C.gold);s.glow(x,hy-6,26,C.gold2,.55);});
  return s.finish("Pentecostes: línguas como de fogo");
};

SC.damasco=function(){
  var s=mk(27);
  s.sky([[0,C.d3],[.6,C.l],[1,C.gold2]]);
  s.glow(300,40,520,C.gold2,.95);
  s.add('<circle cx="300" cy="30" r="70" fill="#fffbe9"/>');
  s.beams(300,30,Math.PI*.12,Math.PI*.88,640,22,.85,"#fffbe9");
  s.ridge(330,30,C.m,{seed:161,hatch:.2});
  s.add('<g fill="'+C.d2+'" transform="translate(560,355)"><rect x="0" y="-40" width="220" height="40"/>'+(function(){var q='',i;for(i=0;i<14;i++)q+='<rect x="'+(i*16+2)+'" y="-49" width="9" height="10"/>';return q;})()+'<rect x="80" y="-84" width="30" height="84"/><path d="M130,-40 q22,-46 44,0Z"/></g>');
  s.ground(380,C.d2,.3);
  s.add('<rect x="0" y="380" width="800" height="120" fill="'+s.lg([[0,C.d2],[1,C.ink]],0,380,0,500)+'"/>');
  s.add('<path d="M240,500 Q380,430 600,395 L640,395 Q440,440 360,500Z" fill="'+C.l+'" opacity=".5"/>');
  s.fig(290,430,86,{col:C.ink,pose:"fallen",arms:"up"});
  s.fig(430,418,86,{col:C.ink,pose:"stand"});s.add('<path d="M420,386 l14,0" stroke="'+C.ink+'" stroke-width="5"/>');
  s.fig(500,430,90,{col:C.ink,pose:"bow",flip:-1});s.fig(150,440,80,{col:C.ink,pose:"bow"});
  return s.finish("A conversão de Paulo no caminho de Damasco");
};

SC.naufragio=function(){
  var s=mk(28);
  s.sky([[0,"#0a0705"],[.5,C.d1],[1,C.d3]]);
  s.clouds(80,6,C.d3,.7,1.7);
  s.add('<path d="M560,0 Q620,60 540,130 Q640,160 600,230" stroke="'+C.l2+'" stroke-width="0" fill="none"/>');
  s.glow(620,100,150,C.gold2,.5);
  s.rain(150,.3,16);
  s.ridge(330,60,C.d1,{seed:171,sharp:.8,hatch:.35,x0:480,x1:810,shape:function(t,y){return y-(t>.2?0:80*(.2-t));}});
  s.add('<rect x="0" y="320" width="800" height="180" fill="'+s.lg([[0,C.d2],[1,C.ink]],0,320,0,500)+'"/>');
  s.waves(320,500,14,C.l2,.55,10,17);
  s.add('<g transform="translate(310,380) rotate(18)"><path d="M-150,-30 Q-130,44 -60,52 L90,52 Q150,40 170,-34Z" fill="'+C.ink+'"/><path d="M-150,-30 Q-130,44 -60,52 L90,52 Q150,40 170,-34" fill="none" stroke="'+C.l+'" stroke-width="1.6" opacity=".6"/><line x1="-30" y1="-30" x2="-48" y2="-130" stroke="'+C.d1+'" stroke-width="6"/><path d="M-44,-120 L-110,-70 L-40,-60Z" fill="'+C.d3+'"/><path d="M30,10 l50,-12" stroke="'+C.l2+'" stroke-width="2"/></g>');
  s.add('<g fill="'+C.ink+'"><path d="M440,470 Q470,420 520,430 Q560,380 640,400 L700,500 L420,500Z"/></g>');
  var i,r=s.r;for(i=0;i<8;i++){var x=460+r()*160,y=440+r()*40;s.add('<circle cx="'+f(x)+'" cy="'+f(y)+'" r="5" fill="'+C.paper+'" opacity=".85"/><path d="M'+f(x-9)+','+f(y+6)+' q9,-6 18,0" stroke="'+C.paper+'" stroke-width="2" fill="none" opacity=".6"/>');}
  s.waves(430,500,8,C.paper,.6,13,18);
  return s.finish("O naufrágio de Paulo em Malta");
};

SC.novajerusalem=function(){
  var s=mk(29);
  s.sky([[0,C.l],[.4,C.gold2],[1,C.paper]]);
  s.glow(400,200,520,C.gold,.55);
  s.beams(400,200,-Math.PI*.98,-Math.PI*.02,620,22,.35);
  s.add('<g transform="translate(400,250)"><path d="M-210,0 L-210,-110 L210,-110 L210,0Z" fill="'+C.m+'"/><path d="M-210,0 L-210,-110 L210,-110 L210,0Z" fill="'+s.hatch()+'" opacity=".25"/>'+(function(){var q='',i;for(i=0;i<14;i++)q+='<rect x="'+(-210+i*30)+'" y="-120" width="18" height="12" fill="'+C.m+'"/>';return q;})()+'<path d="M-40,0 L-40,-80 Q0,-120 40,-80 L40,0Z" fill="'+C.gold2+'"/><path d="M-70,-110 L0,-250 L70,-110Z" fill="'+C.l2+'"/><rect x="-6" y="-300" width="12" height="60" fill="'+C.gold+'"/><g fill="'+C.gold+'"><rect x="-180" y="-170" width="26" height="60"/><rect x="154" y="-170" width="26" height="60"/><rect x="-130" y="-150" width="22" height="40"/><rect x="108" y="-150" width="22" height="40"/></g></g>');
  s.ridge(380,18,C.l,{seed:181,x0:-10,x1:810});
  s.add('<path d="M360,250 L440,250 L640,500 L160,500Z" fill="'+s.lg([[0,C.gold2],[1,C.l2]],0,250,0,500)+'" opacity=".9"/>');
  s.add('<path d="M400,252 Q380,330 420,380 T400,500" stroke="'+C.paper+'" stroke-width="14" fill="none" opacity=".85"/><path d="M400,252 Q380,330 420,380 T400,500" stroke="'+C.m+'" stroke-width="2" fill="none" opacity=".6"/>');
  s.add('<rect x="0" y="420" width="800" height="80" fill="'+C.d1+'" opacity=".5"/>');
  s.cedar(90,440,170,C.d2);s.cedar(700,440,180,C.d2);s.cedar(190,455,120,C.d2);s.cedar(610,455,120,C.d2);
  s.fig(330,478,70,{col:C.ink,pose:"up"});s.fig(470,478,66,{col:C.ink,pose:"out",flip:-1});s.fig(400,490,70,{col:C.ink,pose:"stand"});
  return s.finish("A Nova Jerusalém");
};


var ITENS=[
 {id:"criacao",t:"A Criação",ref:"Gn 1:1-5",a:["Gn 1:1"],d:"No princípio, Deus separa a luz das trevas. Gênesis 1 apresenta o mundo ordenado pela palavra de Deus, em seis dias de obra e um de descanso."},
 {id:"eden",t:"A expulsão do Éden",ref:"Gn 3:22-24",a:["Gn 3:23"],d:"Depois da queda, o homem e a mulher deixam o jardim. Querubins e uma espada flamejante guardam o caminho da árvore da vida."},
 {id:"diluvio",t:"O Dilúvio",ref:"Gn 7:11-24",a:["Gn 7:17"],mapa:"patriarcas",d:"As fontes do abismo se rompem e as comportas do céu se abrem. A arca, construída por Noé segundo as medidas dadas por Deus, flutua sobre as águas."},
 {id:"arcoiris",t:"A aliança com Noé",ref:"Gn 9:8-17",a:["Gn 9:12"],mapa:"patriarcas",d:"A arca repousa nos montes de Ararate. Deus promete nunca mais destruir a terra por dilúvio e dá o arco como sinal da aliança."},
 {id:"babel",t:"A Torre de Babel",ref:"Gn 11:1-9",a:["Gn 11:1"],mapa:"patriarcas",d:"Na planície de Sinear, os homens constroem uma cidade e uma torre cujo topo toque o céu. Deus confunde as línguas e os dispersa pela terra."},
 {id:"estrelas",t:"Abraão e as estrelas",ref:"Gn 15:1-6",a:["Gn 15:5"],mapa:"patriarcas",d:"Deus leva Abrão para fora da tenda e diz: “Olha para o céu e conta as estrelas… assim será a tua descendência”. Abrão creu, e isso lhe foi atribuído como justiça."},
 {id:"isaque",t:"Abraão e Isaque no monte Moriá",ref:"Gn 22:1-14",a:["Gn 22:9"],mapa:"patriarcas",d:"Posto à prova, Abraão obedece até o limite. O anjo do Senhor o detém, e Deus mesmo provê o cordeiro para o sacrifício."},
 {id:"escada",t:"O sonho de Jacó em Betel",ref:"Gn 28:10-22",a:["Gn 28:12"],mapa:"patriarcas",d:"Em fuga, Jacó dorme ao ar livre e vê uma escada entre a terra e o céu, com anjos subindo e descendo. Ali Deus renova a promessa feita a Abraão."},
 {id:"sarca",t:"A sarça ardente",ref:"Ex 3:1-15",a:["Ex 3:2"],mapa:"exodo",d:"No monte Horebe, Moisés vê uma sarça que arde sem se consumir. Deus o chama para libertar o povo do Egito e revela o seu nome."},
 {id:"marvermelho",t:"A travessia do Mar Vermelho",ref:"Ex 14:21-31",a:["Ex 14:21"],mapa:"exodo",d:"Moisés estende a mão e o Senhor abre o mar com um forte vento oriental. Israel passa em seco, entre muralhas de água."},
 {id:"sinai",t:"O monte Sinai",ref:"Ex 19:16-25",a:["Ex 19:16"],mapa:"exodo",d:"Trovões, relâmpagos e uma nuvem espessa cobrem o monte, que treme por inteiro. Ali Deus faz aliança com Israel e dá a Lei."},
 {id:"jerico",t:"A queda de Jericó",ref:"Js 6:1-21",a:["Js 6:20"],mapa:"conquista",d:"Durante sete dias o povo cerca a cidade com a arca e o toque das trombetas. No sétimo, ao grito do povo, as muralhas ruem."},
 {id:"golias",t:"Davi e Golias",ref:"1Sm 17:32-51",a:["1Sm 17:48"],mapa:"reino",d:"No vale de Elá, o jovem pastor enfrenta o campeão filisteu confiando no nome do Senhor dos Exércitos, apenas com a funda e cinco pedras do ribeiro."},
 {id:"carmelo",t:"Elias no monte Carmelo",ref:"1Rs 18:20-40",a:["1Rs 18:38"],mapa:"reino",d:"Diante do povo e dos profetas de Baal, Elias invoca o Senhor. Cai fogo do céu e consome o holocausto, a lenha, as pedras e a água."},
 {id:"daniel",t:"Daniel na cova dos leões",ref:"Dn 6:10-23",a:["Dn 6:22"],mapa:"exilio",d:"Por orar a Deus contra o decreto real, Daniel é lançado aos leões na Babilônia. O Senhor envia o seu anjo e fecha a boca das feras."},
 {id:"jonas",t:"Jonas e o grande peixe",ref:"Jn 1:4-17",a:["Jn 1:15"],mapa:"exilio",d:"O profeta foge de Nínive embarcando para Társis. Uma grande tempestade se levanta; lançado ao mar, Jonas é engolido por um grande peixe preparado pelo Senhor."},
 {id:"ossos",t:"O vale de ossos secos",ref:"Ez 37:1-14",a:["Ez 37:1"],mapa:"exilio",d:"Em visão, Ezequiel profetiza sobre ossos secos e o fôlego de Deus os faz viver: imagem da restauração de Israel depois do exílio."},
 {id:"pastor",t:"O Senhor é o meu pastor",ref:"Sl 23:1-6",a:["Sl 23:1"],d:"O mais conhecido dos salmos de Davi: o pastor que guia às águas tranquilas, acompanha no vale da sombra da morte e prepara a mesa."},
 {id:"natividade",t:"O anúncio aos pastores",ref:"Lc 2:8-20",a:["Lc 2:8"],mapa:"jesus",d:"Na noite do nascimento de Jesus, em Belém, um anjo aparece a pastores que vigiavam o rebanho e anuncia boas-novas de grande alegria."},
 {id:"magos",t:"Os magos do Oriente",ref:"Mt 2:1-12",a:["Mt 2:9"],mapa:"jesus",d:"Magos vindos do Oriente seguem a estrela até onde estava o menino, adoram-no e lhe oferecem ouro, incenso e mirra."},
 {id:"sermao",t:"O Sermão do Monte",ref:"Mt 5:1-12",a:["Mt 5:1"],mapa:"galileia",d:"Jesus sobe ao monte, perto do mar da Galileia, e ensina as multidões: as bem-aventuranças abrem o maior discurso registrado de Jesus."},
 {id:"tempestade",t:"Jesus acalma a tempestade",ref:"Mc 4:35-41",a:["Mc 4:37","Mt 8:24","Lc 8:23"],mapa:"galileia",d:"Em meio a uma forte tempestade no mar da Galileia, Jesus, que dormia no barco, levanta-se e ordena ao vento e ao mar que se aquietem."},
 {id:"getsemani",t:"Jesus no Getsêmani",ref:"Lc 22:39-46",a:["Lc 22:41","Mt 26:36","Mc 14:32"],mapa:"jesus",d:"Na noite em que foi traído, Jesus ora no monte das Oliveiras, enquanto os discípulos, vencidos pelo sono, não conseguem vigiar com ele."},
 {id:"cruz",t:"A crucificação",ref:"Lc 23:33-46",a:["Lc 23:33","Mt 27:35","Mc 15:24","Jo 19:18"],mapa:"jesus",d:"No lugar chamado Calvário (Gólgota), fora dos muros de Jerusalém, Jesus é crucificado entre dois malfeitores. Uma escuridão cobre a terra até a hora nona."},
 {id:"tumulo",t:"O túmulo vazio",ref:"Jo 20:1-8",a:["Jo 20:1","Mt 28:1","Mc 16:1","Lc 24:1"],mapa:"jesus",d:"No primeiro dia da semana, de madrugada, as mulheres encontram a pedra removida e o túmulo vazio: Jesus ressuscitou, como dissera."},
 {id:"pentecostes",t:"Pentecostes",ref:"At 2:1-13",a:["At 2:2"],mapa:"jesus",d:"Cinquenta dias depois da Páscoa, em Jerusalém, o Espírito Santo desce sobre os discípulos reunidos: línguas como de fogo pousam sobre cada um."},
 {id:"damasco",t:"A conversão de Paulo",ref:"At 9:1-9",a:["At 9:3"],mapa:"paulo",d:"A caminho de Damasco, Saulo é envolvido por uma luz do céu e ouve a voz de Jesus. Cego, é levado à cidade; o perseguidor torna-se apóstolo."},
 {id:"naufragio",t:"O naufrágio em Malta",ref:"At 27:39-44",a:["At 27:41"],mapa:"paulo",d:"Depois de quatorze dias de tempestade rumo a Roma, o navio encalha e se parte. Todos os 276 a bordo chegam a salvo à ilha, como Deus prometera a Paulo."},
 {id:"novajerusalem",t:"A Nova Jerusalém",ref:"Ap 21:1-4",a:["Ap 21:2"],d:"João vê um novo céu e uma nova terra, e a cidade santa descendo de Deus. Deus habitará com os homens e enxugará toda lágrima."}
];
window.ARTE={
  itens:ITENS,
  cenas:SC,
  desenhar:function(id){return SC[id]?SC[id]():"";},
  lista:Object.keys(SC)
};
})();
