/* LK Multimidia | Mapa de palco integrado ao Rider de Som.
 * Objetos técnicos genéricos. Sem rede, sem imagens externas, sem simulação acústica.
 */
(function () {
'use strict';
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const EQUIPMENT=[
 {id:'line',name:'Line Array',category:'SISTEMA DE P.A.',symbol:'▥'},
 {id:'column',name:'Coluna vertical',category:'SISTEMA DE P.A.',symbol:'▤'},
 {id:'point',name:'Point Source',category:'SISTEMA DE P.A.',symbol:'▣'},
 {id:'sub',name:'Subwoofer',category:'SISTEMA DE P.A.',symbol:'◉'},
 {id:'front',name:'Front Fill',category:'RETORNOS E FILLS',symbol:'◢'},
 {id:'side',name:'Side Fill',category:'RETORNOS E FILLS',symbol:'◣'},
 {id:'wedge',name:'Monitor wedge',category:'RETORNOS E FILLS',symbol:'◭'},
 {id:'drumfill',name:'Drum Fill',category:'RETORNOS E FILLS',symbol:'▣'},
 {id:'drum',name:'Bateria',category:'INSTRUMENTOS',symbol:'◉'},
 {id:'keys',name:'Teclado',category:'INSTRUMENTOS',symbol:'▥'},
 {id:'guitar',name:'Guitarra',category:'INSTRUMENTOS',symbol:'♪'},
 {id:'bass',name:'Baixo',category:'INSTRUMENTOS',symbol:'♫'},
 {id:'amp',name:'Amplificador de instrumento',category:'BACKLINE',symbol:'▥'},
 {id:'mic',name:'Microfone / pedestal',category:'MICROFONAÇÃO',symbol:'♩'},
 {id:'di',name:'Direct Box (DI)',category:'MICROFONAÇÃO',symbol:'◫'},
 {id:'stagebox',name:'Stagebox',category:'MICROFONAÇÃO',symbol:'▦'},
 {id:'riser',name:'Praticável',category:'ESTRUTURAS',symbol:'▦'},
 {id:'truss',name:'Treliça',category:'ESTRUTURAS',symbol:'⫶'},
 {id:'bumper',name:'Bumper de P.A.',category:'ESTRUTURAS',symbol:'▰'},
 {id:'xstand',name:'Suporte em tesoura',category:'ESTRUTURAS',symbol:'✕'},
 {id:'light',name:'Moving head',category:'ILUMINAÇÃO / VÍDEO',symbol:'✦'},
 {id:'screen',name:'Tela / painel LED',category:'ILUMINAÇÃO / VÍDEO',symbol:'▭'},
 {id:'projector',name:'Projetor',category:'ILUMINAÇÃO / VÍDEO',symbol:'▣'},
 {id:'camera',name:'Câmera',category:'ILUMINAÇÃO / VÍDEO',symbol:'◉'},
 {id:'generator',name:'Gerador',category:'INFRAESTRUTURA',symbol:'⚡'}
];
const BY_ID=Object.fromEntries(EQUIPMENT.map(x=>[x.id,x]));
const LIMIT=60;
let state=empty(),selected=null,drag=null,serial=0,view='top',geom={x:0,y:0,scale:1};
let undoStack=[],redoStack=[];
const MAX_HISTORY=35;
function checkpoint(){
 undoStack.push(JSON.stringify(state));
 if(undoStack.length>MAX_HISTORY)undoStack.shift();
 redoStack.length=0;
}
function changeDone(){drawAll();}
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(state));state=sanitize(JSON.parse(undoStack.pop()));selected=null;drawAll();}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(state));state=sanitize(JSON.parse(redoStack.pop()));selected=null;drawAll();}
function shiftSelected(dx,dy){const o=current();if(!o||view!=='top')return;checkpoint();o.x=limit(Math.round((o.x+dx)*100)/100,0,state.width);o.y=limit(Math.round((o.y+dy)*100)/100,0,state.depth);changeDone();}
function empty(){return{version:1,mode:'simple',area:'stage',width:12,depth:8,items:[]};}
const limit=(v,lo,hi)=>Number.isFinite(Number(v))?Math.min(hi,Math.max(lo,Number(v))):lo;
function nextId(){serial+=1;return's'+Date.now().toString(36)+serial.toString(36);}
function saneString(v,length){return String(v==null?'':v).slice(0,length);}
function sanitize(raw){
 let d=raw&&typeof raw==='object'?raw:{};
 let r={version:1,mode:d.mode==='advanced'?'advanced':'simple',area:d.area==='venue'?'venue':'stage',width:limit(d.width,4,90),depth:limit(d.depth,3,90),items:[]};
 if(!Number.isFinite(Number(d.width)))r.width=12;
 if(!Number.isFinite(Number(d.depth)))r.depth=8;
 if(Array.isArray(d.items))for(const o of d.items.slice(0,LIMIT)){
   if(!o||!BY_ID[o.type])continue;
   r.items.push({id:nextId(),type:o.type,label:saneString(o.label||BY_ID[o.type].name,48),qty:Math.round(limit(o.qty,1,99)),side:['L','R','C','none'].includes(o.side)?o.side:'none',x:limit(o.x,0,r.width),y:limit(o.y,0,r.depth),angle:limit(o.angle,-360,360),brand:saneString(o.brand,65),zone:saneString(o.zone,45),notes:saneString(o.notes,160)});
 }
 return r;
}
function capture(){return JSON.parse(JSON.stringify(state));}
function restore(raw){state=sanitize(raw);selected=null;view='top';undoStack.length=0;redoStack.length=0;drawAll();}
function make(type,x,y){if(!BY_ID[type]||state.items.length>=LIMIT)return;
 const o={id:nextId(),type,label:BY_ID[type].name,qty:1,side:'none',x:limit(x,0,state.width),y:limit(y,0,state.depth),angle:0,brand:'',zone:'',notes:''};
 checkpoint();state.items.push(o);selected=o.id;changeDone();
}
function current(){return state.items.find(x=>x.id===selected)||null;}
function svgEl(tag,attrs={},content){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(content!=null)n.textContent=content;return n;}
function append(p,t,a={},txt){let n=svgEl(t,a,txt);p.appendChild(n);return n;}
function layout(){const scale=Math.min(665/state.width,390/state.depth);return{x:(760-state.width*scale)/2,y:57+(410-state.depth*scale)/2,scale};}
function coords(e,svg){let p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const matrix=svg.getScreenCTM();if(!matrix)return{x:state.width/2,y:state.depth/2};p=p.matrixTransform(matrix.inverse());return{x:limit((p.x-geom.x)/geom.scale,0,state.width),y:limit((p.y-geom.y)/geom.scale,0,state.depth)};}
function drawShape(g,o){
 // As silhuetas são vetores leves, não fotografias nem desenhos em escala acústica.
 const pa=['line','column','point'].includes(o.type);
 const monitor=['front','side','wedge','drumfill'].includes(o.type);
 const boxFill=pa?'#354b55':o.type==='sub'?'#46424d':monitor?'#655444':'#526d74';
 const grill='#738b93',cone='#1b2d34',rim='#b8cbd0';
 const rect=(x,y,w,h,fill=boxFill,rx=3,stroke=rim)=>append(g,'rect',{x,y,width:w,height:h,rx,fill,stroke,'stroke-width':1.1});
 const disk=(x,y,r)=>{append(g,'circle',{cx:x,cy:y,r,fill:grill,stroke:rim,'stroke-width':1});append(g,'circle',{cx:x,cy:y,r:r*.72,fill:cone});append(g,'circle',{cx:x,cy:y,r:Math.max(2,r*.19),fill:'#607b82'});};
 let w=51,h=40,qty=Number(o.qty)||1;
 if(o.type==='line'){
   const visible=Math.min(qty,12),cell=12;
   w=44;h=visible*cell;
   rect(-w/2,-h/2,w,h,'#354c55',3,'#a7c7cc');
   for(let i=0;i<visible;i++){
     const cy=-h/2+i*cell+cell/2;
     rect(-17,cy-4.8,34,9.4,'#263943',1,'#71939b');
     append(g,'circle',{cx:0,cy,r:3.1,fill:'#0d242d',stroke:'#99b6bb','stroke-width':.8});
     if(i<visible-1)append(g,'line',{x1:-21,x2:21,y1:cy+6,y2:cy+6,stroke:'#7f9ea5','stroke-width':.9});
   }
 }else if(['sub','point','column'].includes(o.type)){
   // Mostra visualmente até 12 unidades; valores maiores continuam identificados no rótulo.
   const shown=Math.min(qty,12),cols=Math.min(o.type==='column'?6:4,shown),rows=Math.ceil(shown/cols);
   const tw=o.type==='column'?20:38,th=o.type==='column'?76:34,gap=5;
   w=cols*tw+(cols-1)*gap;h=rows*th+(rows-1)*gap;
   for(let i=0;i<shown;i++){
     let col=i%cols,row=Math.floor(i/cols),left=-w/2+col*(tw+gap),top=-h/2+row*(th+gap);
     rect(left,top,tw,th,boxFill,3,'#c0d4d7');
     if(o.type==='column'){
       for(let k=0;k<4;k++)disk(left+tw/2,top+10+k*17,4.1);
     }else{
       disk(left+tw/2,top+th/2,12);
       append(g,'rect',{x:left+3,y:top+3,width:4,height:3,fill:'#9bb3b7'});
     }
   }
 }else if(monitor){
   const shown=Math.min(qty,8),cols=Math.min(4,shown),rows=Math.ceil(shown/cols),tw=36,th=28,gap=5;
   w=cols*tw+(cols-1)*gap;h=rows*th+(rows-1)*gap;
   for(let i=0;i<shown;i++){
     const px=-w/2+(i%cols)*(tw+gap),py=-h/2+Math.floor(i/cols)*(th+gap);
     append(g,'path',{d:'M'+px+' '+(py+th)+' L'+(px+tw/2)+' '+(py+3)+' L'+(px+tw)+' '+(py+th)+' Z',fill:'#66533e',stroke:'#e4c49a','stroke-width':1.5});
     append(g,'circle',{cx:px+tw/2,cy:py+19,r:5,fill:'#242d31',stroke:'#d5b987','stroke-width':1});
   }
 }else if(o.type==='drum'){
   w=73;h=64;rect(-w/2,-h/2,w,h,'#eef3f3',7,'#73979a');
   disk(0,8,19);disk(-20,-14,10);disk(20,-14,10);
   append(g,'ellipse',{cx:-24,cy:18,rx:13,ry:4,fill:'#b4cdd1',stroke:'#749196'});
   append(g,'ellipse',{cx:24,cy:18,rx:13,ry:4,fill:'#b4cdd1',stroke:'#749196'});
 }else if(o.type==='keys'){
   w=80;h=42;rect(-40,-21,80,42,'#263640',3,'#b8cace');
   for(let k=0;k<10;k++)rect(-34+k*6.7,-14,6.4,29,'#e3eeec',0,'#718b91');
   for(let k of [0,1,3,4,5,7,8])rect(-31+k*6.7,-14,4,17,'#283941',0,'#283941');
 }else if(o.type==='riser'){
   w=85;h=58;rect(-w/2,-h/2,w,h,'#a7b4b6',3,'#637b7f');
   for(let k=-1;k<=1;k++)append(g,'line',{x1:-w/2,y1:k*14,x2:w/2,y2:k*14,stroke:'#f3f8f8'});
 }else if(o.type==='truss'){
   w=100;h=36;rect(-w/2,-h/2,w,h,'#b9c8c9',1,'#718689');
   for(let k=-4;k<=4;k++)append(g,'line',{x1:k*11,y1:-16,x2:k*11+12,y2:16,stroke:'#647e82','stroke-width':2});
 }else if(o.type==='mic'){
   w=38;h=55;
   append(g,'circle',{cx:0,cy:-13,r:8,fill:'#344b54',stroke:'#acc2c5','stroke-width':2});
   append(g,'line',{x1:0,y1:-5,x2:0,y2:20,stroke:'#61787d','stroke-width':3});
   append(g,'line',{x1:-13,y1:20,x2:13,y2:20,stroke:'#61787d','stroke-width':3});
 }else if(['guitar','bass'].includes(o.type)){
   w=42;h=70;const length=o.type==='bass'?58:49;
   append(g,'rect',{x:-3,y:-length/2,width:6,height:length,rx:2,fill:'#d6b782',stroke:'#654d3e'});
   append(g,'ellipse',{cx:0,cy:18,rx:17,ry:24,fill:'#9e6c52',stroke:'#e2b78e','stroke-width':2});
   append(g,'circle',{cx:0,cy:15,r:8,fill:'#35404a',stroke:'#dcc4a1'});
   for(let i=-1;i<=1;i++)append(g,'line',{x1:i*3,y1:-28,x2:i*3,y2:36,stroke:'#f3e6cf','stroke-width':.7});
 }else if(o.type==='screen'){
   w=80;h=45;rect(-40,-22,80,44,'#253943',2,'#698b8f');rect(-34,-17,68,34,'#80b8b8',1,'#dae9e8');
 }else if(o.type==='light'){
   w=48;h=55;rect(-24,-27,48,54,'#2b3b41',4,'#879da1');disk(0,-4,13);
   append(g,'line',{x1:-13,y1:12,x2:-21,y2:21,stroke:'#aec2c4','stroke-width':3});
   append(g,'line',{x1:13,y1:12,x2:21,y2:21,stroke:'#aec2c4','stroke-width':3});
 }else if(['amp','di','stagebox'].includes(o.type)){
   w=o.type==='amp'?65:o.type==='stagebox'?63:43;
   h=o.type==='amp'?57:32;
   rect(-w/2,-h/2,w,h,'#3e5057',3,'#a6bcc1');
   if(o.type==='amp'){
     disk(0,4,19);rect(-w/2+5,-h/2+4,w-10,7,'#192e35',1,'#7d979b');
   }else{
     const sockets=o.type==='stagebox'?6:2;
     for(let k=0;k<sockets;k++)append(g,'circle',{cx:-w/2+8+k*((w-16)/Math.max(1,sockets-1)),cy:0,r:3.1,fill:'#182d34',stroke:'#d2e0e1','stroke-width':1});
   }
 }else if(o.type==='bumper'){
   w=75;h=34;rect(-w/2,-h/2,w,h,'#9baeb2',3,'#506b72');
   for(let k=-2;k<=2;k++)append(g,'circle',{cx:k*13,cy:0,r:4,fill:'#4a646a',stroke:'#dde7e7'});
 }else if(o.type==='xstand'){
   w=58;h=58;
   append(g,'line',{x1:-23,y1:-23,x2:23,y2:23,stroke:'#61757c','stroke-width':5});
   append(g,'line',{x1:23,y1:-23,x2:-23,y2:23,stroke:'#61757c','stroke-width':5});
   append(g,'line',{x1:-30,y1:-23,x2:30,y2:-23,stroke:'#9cb4b7','stroke-width':4});
 }else if(o.type==='projector'){
   w=65;h=44;rect(-w/2,-h/2,w,h,'#adbfc0',4,'#506f71');
   append(g,'circle',{cx:13,cy:0,r:13,fill:'#2c464c',stroke:'#dde9e9','stroke-width':2});
   append(g,'circle',{cx:13,cy:0,r:5,fill:'#82b9b8'});
 }else if(o.type==='camera'){
   w=66;h=40;rect(-30,-19,48,38,'#34474f',4,'#aac2c5');
   append(g,'circle',{cx:0,cy:0,r:13,fill:'#91aeb1',stroke:'#cce1e2'});
   append(g,'circle',{cx:0,cy:0,r:8,fill:'#233840'});
   append(g,'rect',{x:18,y:-11,width:18,height:22,fill:'#41575f',stroke:'#b4cbcb'});
 }else if(o.type==='generator'){
   w=70;h=48;rect(-35,-24,70,48,'#536569',4,'#9fb5b5');
   rect(-30,-17,38,31,'#2b4047',3,'#90b0b0');
   for(let k=-12;k<=8;k+=7)append(g,'line',{x1:-27,y1:k,x2:4,y2:k,stroke:'#789da4','stroke-width':2});
   append(g,'circle',{cx:23,cy:0,r:9,fill:'#d7c083',stroke:'#655b41'});
 }else{rect(-w/2,-h/2,w,h);}
 const label=o.label+(qty>1?' ×'+qty:'');
 append(g,'text',{x:0,y:h/2+17,'text-anchor':'middle','font-size':12,'font-family':'Arial, sans-serif','font-weight':'bold',fill:'#253039',stroke:'#fbfdfd','stroke-width':3,'paint-order':'stroke'},label.length>26?label.slice(0,24)+'…':label);
 if(o.side!=='none')append(g,'text',{x:w/2+5,y:-h/2,'font-size':12,'font-family':'Arial, sans-serif','font-weight':'bold',fill:'#146e73'},o.side);
}
function draw(svg,interactive=false){
 if(!svg)return;
 svg.replaceChildren();svg.setAttribute('viewBox','0 0 760 540');
 geom=layout();const {x,y,scale}=geom;
 append(svg,'rect',{x:0,y:0,width:760,height:540,fill:'#f8fbfc'});
 append(svg,'rect',{x,y,width:state.width*scale,height:state.depth*scale,fill:'#eef4f4',stroke:'#7d999b','stroke-width':2,rx:4});
 for(let n=1;n<state.width;n++)append(svg,'line',{x1:x+n*scale,y1:y,x2:x+n*scale,y2:y+state.depth*scale,stroke:'#bed2d4','stroke-width':.7});
 for(let n=1;n<state.depth;n++)append(svg,'line',{x1:x,y1:y+n*scale,x2:x+state.width*scale,y2:y+n*scale,stroke:'#bed2d4','stroke-width':.7});
 const put=(text,xp,yp,color='#52686d',anchor='middle')=>append(svg,'text',{x:xp,y:yp,'text-anchor':anchor,fill:color,'font-size':13,'font-family':'Arial, sans-serif','font-weight':'bold'},text);
 put(state.area==='venue'?'FUNDO DO AMBIENTE':'FUNDO DO PALCO',380,31);
 put(state.area==='venue'?'ENTRADA / PÚBLICO':'FRENTE DO PALCO / PLATEIA',380,524);
 put('L · ESQUERDA',x,y-9,'#146e73','start');put('R · DIREITA',x+state.width*scale,y-9,'#146e73','end');
 put(state.width+' m',x+state.width*scale/2,y+state.depth*scale+22,'#52686d');
 if(view!=='top')put('ELEVAÇÃO ILUSTRATIVA · EDITE POSIÇÕES NA VISTA SUPERIOR',380,51,'#52686d');
 state.items.forEach(o=>{
   let px,py;
   if(view==='top'){px=x+o.x*scale;py=y+o.y*scale;}
   else if(view==='front'){px=x+o.x*scale;py=y+state.depth*scale*.68;}
   else{px=x+(view==='left'?o.y:state.depth-o.y)*(state.width/state.depth)*scale;py=y+state.depth*scale*.68;}
   const g=append(svg,'g',{transform:'translate('+px+' '+py+') rotate('+(view==='top'?o.angle:0)+')','class':'lk-plot-object'+(selected===o.id&&interactive?' is-selected':'')});
   if(interactive)g.setAttribute('data-plot-id',o.id);
   drawShape(g,o);
   if(!interactive)return;
   g.addEventListener('click',()=>{if(drag)return;selected=o.id;drawAll();});
   if(view!=='top')return;
   g.addEventListener('pointerdown',e=>{
     if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();selected=o.id;checkpoint();drag={id:o.id,pointer:e.pointerId,element:g};
     g.setPointerCapture(e.pointerId);updateControls();
     svg.querySelectorAll('.lk-plot-object').forEach(el=>el.classList.toggle('is-selected',el===g));
   });
   g.addEventListener('pointermove',e=>{
     if(!drag||drag.id!==o.id||drag.pointer!==e.pointerId)return;
     const pos=coords(e,svg);o.x=pos.x;o.y=pos.y;
     g.setAttribute('transform','translate('+(x+o.x*scale)+' '+(y+o.y*scale)+') rotate('+o.angle+')');
   });
   g.addEventListener('pointerup',e=>{
     if(!drag||drag.pointer!==e.pointerId||drag.id!==o.id)return;
     drag=null;changeDone();
   });
   g.addEventListener('pointercancel',()=>{drag=null;drawAll();});
 });
}
function renderList(){
 const list=$('lk-plot-object-list');if(!list)return;list.replaceChildren();
 state.items.forEach(o=>{
   const btn=document.createElement('button');btn.type='button';btn.className='lk-plot-list-item'+(o.id===selected?' active':'');
   const span=document.createElement('span'),small=document.createElement('small');
   span.textContent=o.label;small.textContent=o.qty+' un. · '+(o.side==='none'?'Sem lado':o.side);
   btn.append(span,small);btn.addEventListener('click',()=>{selected=o.id;drawAll();});list.append(btn);
 });
 const counts=new Map();let qty=0;state.items.forEach(o=>{qty+=o.qty;const key=BY_ID[o.type].name+(o.side==='none'?'':' · '+o.side);counts.set(key,(counts.get(key)||0)+o.qty);});
 $('lk-plot-summary').replaceChildren();
 counts.forEach((num,label)=>{const row=document.createElement('div');row.className='lk-plot-summary-row';const k=document.createElement('span'),v=document.createElement('strong');k.textContent=label;v.textContent=num;row.append(k,v);$('lk-plot-summary').append(row);});
 $('lk-plot-total').textContent=state.items.length+' grupos · '+qty+' unidades';
 $('lk-plot-mini-description').textContent=qty?qty+' unidades posicionadas · '+state.width+' × '+state.depth+' m':'Nenhum equipamento posicionado';
}
const FIELD_KEYS=['label','qty','side','x','y','angle','brand','zone','notes'];
function updateControls(){
 const obj=current(),container=$('lk-plot-properties');
 container.hidden=!obj;
 $('lk-plot-pick-hint').hidden=!!obj;
 if(!obj)return;
 for(const key of FIELD_KEYS){const el=$('lk-plot-p-'+key);if(el&&document.activeElement!==el)el.value=['x','y'].includes(key)?obj[key].toFixed(1):obj[key];}
}
function drawAll(){
 const editor=$('lk-plot-canvas'),mini=$('lk-plot-mini');if(!editor||!mini)return;
 $('lk-plot-undo').disabled=undoStack.length===0;$('lk-plot-redo').disabled=redoStack.length===0;
 $('lk-plot-mode-simple').classList.toggle('active',state.mode==='simple');
 $('lk-plot-mode-advanced').classList.toggle('active',state.mode==='advanced');
 $('lk-stage-modal').classList.toggle('lk-plot-advanced',state.mode==='advanced');
 $('lk-plot-area').value=state.area;$('lk-plot-width').value=state.width;$('lk-plot-depth').value=state.depth;$('lk-plot-view').value=view;
 draw(editor,true);draw(mini,false);renderList();updateControls();
}
function palette(){
 let box=$('lk-plot-palette');box.replaceChildren();let last='';
 EQUIPMENT.forEach(eq=>{
   if(last!==eq.category){const cat=document.createElement('h4');cat.textContent=eq.category;box.append(cat);last=eq.category;}
   let b=document.createElement('button');b.type='button';b.draggable=true;b.className='lk-plot-palette-item';
   let icon=document.createElement('span');icon.className='lk-plot-palette-symbol';icon.textContent=eq.symbol;
   let text=document.createElement('span');text.textContent=eq.name;b.append(icon,text);
   b.addEventListener('click',()=>make(eq.id,state.width/2,state.depth/2));
   b.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',eq.id);e.dataTransfer.effectAllowed='copy';});
   box.append(b);
 });
}
function exportDemo(){
 const data=JSON.stringify({format:'lk-stage-plot',stagePlot:capture()},null,2);
 const u=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='lk-mapa-de-palco.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1200);
}
function printMarkup(raw){
 const p=sanitize(raw);
 if(!p.items.length)return'';
 const original=state,originalView=view;state=p;view='top';
 const temp=svgEl('svg',{xmlns:NS,viewBox:'0 0 760 540',width:'760',height:'540','aria-label':'Mapa de palco'});
 draw(temp,false);
 const svgMarkup=temp.outerHTML;state=original;view=originalView;
 const rows=new Map();p.items.forEach(o=>{let key=BY_ID[o.type].name+(o.side==='none'?'':' '+o.side);rows.set(key,(rows.get(key)||0)+o.qty);});
 const legend=document.createElement('div');legend.className='lk-plot-print-legend';
 rows.forEach((n,k)=>{let el=document.createElement('span');el.textContent=k+': '+n;legend.append(el);});
 return'<div class="lk-plot-print"><div class="lk-plot-print-drawing">'+svgMarkup+'</div>'+legend.outerHTML+'</div>';
}
function bind(){
 $('lk-plot-open').addEventListener('click',()=>{ $('lk-stage-modal').hidden=false;drawAll();$('lk-plot-close').focus();});
 const close=()=>{ $('lk-stage-modal').hidden=true;$('lk-plot-open').focus();};
 $('lk-plot-close').addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('lk-stage-modal').hidden){e.preventDefault();close();}});
 $('lk-stage-modal').addEventListener('click',e=>{if(e.target===$('lk-stage-modal'))close();});
 $('lk-plot-mode-simple').addEventListener('click',()=>{if(state.mode!=='simple')checkpoint();state.mode='simple';drawAll();});
 $('lk-plot-mode-advanced').addEventListener('click',()=>{if(state.mode!=='advanced')checkpoint();state.mode='advanced';drawAll();});
 $('lk-plot-area').addEventListener('change',e=>{checkpoint();state.area=e.target.value==='venue'?'venue':'stage';drawAll();});
 for(const [id,key,min] of [['lk-plot-width','width',4],['lk-plot-depth','depth',3]]){
   $(id).addEventListener('change',e=>{checkpoint();state[key]=limit(e.target.value,min,90);state.items.forEach(o=>{o.x=limit(o.x,0,state.width);o.y=limit(o.y,0,state.depth);});drawAll();});
 }
 $('lk-plot-view').addEventListener('change',e=>{view=['top','front','left','right'].includes(e.target.value)?e.target.value:'top';drawAll();});
 $('lk-plot-canvas').addEventListener('dragover',e=>{if(view!=='top')return;e.preventDefault();e.dataTransfer.dropEffect='copy';});
 $('lk-plot-canvas').addEventListener('drop',e=>{e.preventDefault();if(view!=='top')return;const type=e.dataTransfer.getData('text/plain');if(!BY_ID[type])return;const pos=coords(e,$('lk-plot-canvas'));make(type,pos.x,pos.y);});
 for(const key of FIELD_KEYS){
   const el=$('lk-plot-p-'+key);
   el.addEventListener('change',e=>{const o=current();if(!o)return;checkpoint();let v=e.target.value;
     if(key==='qty')o.qty=Math.round(limit(v,1,99));
     else if(key==='x')o.x=limit(v,0,state.width);
     else if(key==='y')o.y=limit(v,0,state.depth);
     else if(key==='angle')o.angle=limit(v,-360,360);
     else if(key==='side')o.side=['none','L','R','C'].includes(v)?v:'none';
     else o[key]=saneString(v,key==='label'?48:key==='brand'?65:key==='zone'?45:160);
     drawAll();
   });
 }
 $('lk-plot-copy').addEventListener('click',()=>{const o=current();if(!o||state.items.length>=LIMIT)return;checkpoint();const clone=sanitize({width:state.width,depth:state.depth,items:[o]}).items[0];clone.x=limit(o.x+.5,0,state.width);clone.y=limit(o.y+.5,0,state.depth);state.items.push(clone);selected=clone.id;drawAll();});
 $('lk-plot-delete').addEventListener('click',()=>{if(!current())return;checkpoint();state.items=state.items.filter(o=>o.id!==selected);selected=null;drawAll();});
 $('lk-plot-example').addEventListener('click',()=>{
   if(state.items.length&&!confirm('Substituir os objetos existentes pelo exemplo?'))return;
   checkpoint();const demo=[['line',1,3,8,'L','PA L'],['line',11,3,8,'R','PA R'],['sub',6,7.3,6,'C','SUB CENTRO'],['front',3.4,7.4,2,'none','FRONT FILL'],['front',8.6,7.4,2,'none','FRONT FILL 2'],['drum',6,1.8,1,'C','BATERIA'],['keys',2.5,4.5,1,'L','TECLADO'],['mic',6,5,1,'C','VOCAL']];
   state.width=12;state.depth=8;state.area='stage';state.items=demo.map(x=>({id:nextId(),type:x[0],x:x[1],y:x[2],qty:x[3],side:x[4],label:x[5],angle:0,brand:'',zone:'',notes:''}));
   selected=null;view='top';drawAll();
 });
 $('lk-plot-clear').addEventListener('click',()=>{if(state.items.length&&!confirm('Apagar todos os objetos do mapa?'))return;checkpoint();state.items=[];selected=null;drawAll();});
 $('lk-plot-export').addEventListener('click',exportDemo);

 $('lk-plot-undo').addEventListener('click',undo);
 $('lk-plot-redo').addEventListener('click',redo);
 for(const [id,dx,dy] of [['lk-plot-up',0,-.25],['lk-plot-down',0,.25],['lk-plot-left',-.25,0],['lk-plot-right',.25,0]])
   $(id).addEventListener('click',()=>shiftSelected(dx,dy));
 $('lk-plot-canvas').addEventListener('keydown',e=>{
   const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
   if(keys[e.key]&&current()&&view==='top'){
     e.preventDefault();const amount=e.shiftKey?0.5:0.1;shiftSelected(keys[e.key][0]*amount,keys[e.key][1]*amount);
   }else if((e.key==='Delete'||e.key==='Backspace')&&current()){
     e.preventDefault();checkpoint();state.items=state.items.filter(o=>o.id!==selected);selected=null;drawAll();
   }
 });
 $('lk-plot-import').addEventListener('change',async e=>{
   const file=e.target.files&&e.target.files[0];if(!file)return;
   try{
     if(file.size>128*1024)throw Error('Arquivo excede 128 KB.');
     const payload=JSON.parse(await file.text());
     if(payload.format!=='lk-stage-plot'||!payload.stagePlot||!Array.isArray(payload.stagePlot.items))
       throw Error('Arquivo não é um mapa LK válido.');
     if(payload.stagePlot.items.length>LIMIT)throw Error('Limite de 60 grupos.');
     checkpoint();state=sanitize(payload.stagePlot);selected=null;view='top';drawAll();
   }catch(err){alert('Importação não concluída: '+err.message);}
   e.target.value='';
 });
}
function init(){if(!$('lk-plot-open'))return;palette();bind();drawAll();}
window.LKStagePlot={capture,restore,empty,printMarkup,undo,redo};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();