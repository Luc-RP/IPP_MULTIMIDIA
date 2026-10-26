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
 {id:'drum',name:'Bateria',category:'INSTRUMENTOS',symbol:'◉'},
 {id:'keys',name:'Teclado',category:'INSTRUMENTOS',symbol:'▥'},
 {id:'guitar',name:'Guitarra',category:'INSTRUMENTOS',symbol:'♪'},
 {id:'bass',name:'Baixo',category:'INSTRUMENTOS',symbol:'♫'},
 {id:'mic',name:'Microfone / pedestal',category:'MICROFONAÇÃO',symbol:'♩'},
 {id:'riser',name:'Praticável',category:'ESTRUTURAS',symbol:'▦'},
 {id:'truss',name:'Treliça',category:'ESTRUTURAS',symbol:'⫶'},
 {id:'light',name:'Moving head',category:'ILUMINAÇÃO / VÍDEO',symbol:'✦'},
 {id:'screen',name:'Tela / painel LED',category:'ILUMINAÇÃO / VÍDEO',symbol:'▭'},
 {id:'generator',name:'Gerador',category:'INFRAESTRUTURA',symbol:'⚡'}
];
const BY_ID=Object.fromEntries(EQUIPMENT.map(x=>[x.id,x]));
const LIMIT=60;
let state=empty(),selected=null,drag=null,serial=0,view='top',geom={x:0,y:0,scale:1};
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
function restore(raw){state=sanitize(raw);selected=null;view='top';drawAll();}
function make(type,x,y){if(!BY_ID[type]||state.items.length>=LIMIT)return;
 const o={id:nextId(),type,label:BY_ID[type].name,qty:1,side:'none',x:limit(x,0,state.width),y:limit(y,0,state.depth),angle:0,brand:'',zone:'',notes:''};
 state.items.push(o);selected=o.id;drawAll();
}
function current(){return state.items.find(x=>x.id===selected)||null;}
function svgEl(tag,attrs={},content){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(content!=null)n.textContent=content;return n;}
function append(p,t,a={},txt){let n=svgEl(t,a,txt);p.appendChild(n);return n;}
function layout(){const scale=Math.min(665/state.width,390/state.depth);return{x:(760-state.width*scale)/2,y:57+(410-state.depth*scale)/2,scale};}
function coords(e,svg){let p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const matrix=svg.getScreenCTM();if(!matrix)return{x:state.width/2,y:state.depth/2};p=p.matrixTransform(matrix.inverse());return{x:limit((p.x-geom.x)/geom.scale,0,state.width),y:limit((p.y-geom.y)/geom.scale,0,state.depth)};}
function drawShape(g,o){
 let color=['line','column','point'].includes(o.type)?'#226b77':o.type==='sub'?'#68647b':['front','side','wedge'].includes(o.type)?'#a87d44':'#59727b';
 let w=o.type==='column'?23:o.type==='line'?32:o.type==='keys'?70:o.type==='truss'?82:49;
 let h=o.type==='column'?70:o.type==='line'?Math.min(105,Math.max(34,o.qty*10)):o.type==='screen'?36:39;
 append(g,'rect',{x:-w/2,y:-h/2,width:w,height:h,rx:3,fill:color,stroke:'#eff7f8','stroke-width':1.5,'class':'lk-plot-outline'});
 if(['line','column'].includes(o.type)){
   let bars=Math.min(12,Math.max(2,o.qty));
   for(let i=1;i<bars;i++)append(g,'line',{x1:-w/2+4,x2:w/2-4,y1:-h/2+(h/bars)*i,y2:-h/2+(h/bars)*i,stroke:'#bce5e8','stroke-width':1});
 }else if(o.type==='sub'||o.type==='point'){
   append(g,'circle',{cx:0,cy:0,r:13,fill:'#273a43',stroke:'#d0e5e8','stroke-width':2});
   append(g,'circle',{cx:0,cy:0,r:4,fill:'#82aeb4'});
 }else if(o.type==='drum'){
   append(g,'circle',{cx:0,cy:0,r:16,fill:'#2c3f4a',stroke:'#e5efef','stroke-width':2});
   append(g,'circle',{cx:-11,cy:-13,r:7,fill:'#dce8e8'});
   append(g,'circle',{cx:11,cy:-13,r:7,fill:'#dce8e8'});
 }else if(o.type==='keys'){
   for(let i=-3;i<=3;i++)append(g,'line',{x1:i*9,x2:i*9,y1:-13,y2:14,stroke:'#eef5f5','stroke-width':1.5});
 }else if(['front','side','wedge'].includes(o.type)){
   append(g,'path',{d:'M-13 8L0 -10L13 8Z',fill:'#433a2d',stroke:'#ffe0a0','stroke-width':1.8});
 }else if(o.type==='mic'){
   append(g,'circle',{cx:0,cy:-6,r:8,fill:'#edf1f2'});
   append(g,'line',{x1:0,y1:2,x2:0,y2:15,stroke:'#edf1f2','stroke-width':3});
 }else if(o.type==='truss'){
   for(let x=-30;x<35;x+=12)append(g,'line',{x1:x,y1:-17,x2:x+14,y2:17,stroke:'#e5eded','stroke-width':1});
 }else if(o.type==='light'){append(g,'circle',{cx:0,cy:0,r:12,fill:'#e8cf85'});}
 else if(o.type==='screen'){append(g,'rect',{x:-28,y:-12,width:56,height:24,fill:'#87b9b7'});}
 const label=o.label+(o.qty>1?' ×'+o.qty:'');
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
     if(e.button!==0)return;e.preventDefault();selected=o.id;drag={id:o.id,pointer:e.pointerId,element:g};
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
     drag=null;drawAll();
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
 $('lk-plot-mode-simple').addEventListener('click',()=>{state.mode='simple';drawAll();});
 $('lk-plot-mode-advanced').addEventListener('click',()=>{state.mode='advanced';drawAll();});
 $('lk-plot-area').addEventListener('change',e=>{state.area=e.target.value==='venue'?'venue':'stage';drawAll();});
 for(const [id,key,min] of [['lk-plot-width','width',4],['lk-plot-depth','depth',3]]){
   $(id).addEventListener('change',e=>{state[key]=limit(e.target.value,min,90);state.items.forEach(o=>{o.x=limit(o.x,0,state.width);o.y=limit(o.y,0,state.depth);});drawAll();});
 }
 $('lk-plot-view').addEventListener('change',e=>{view=['top','front','left','right'].includes(e.target.value)?e.target.value:'top';drawAll();});
 $('lk-plot-canvas').addEventListener('dragover',e=>{if(view!=='top')return;e.preventDefault();e.dataTransfer.dropEffect='copy';});
 $('lk-plot-canvas').addEventListener('drop',e=>{e.preventDefault();if(view!=='top')return;const type=e.dataTransfer.getData('text/plain');if(!BY_ID[type])return;const pos=coords(e,$('lk-plot-canvas'));make(type,pos.x,pos.y);});
 for(const key of FIELD_KEYS){
   const el=$('lk-plot-p-'+key);
   el.addEventListener('change',e=>{const o=current();if(!o)return;let v=e.target.value;
     if(key==='qty')o.qty=Math.round(limit(v,1,99));
     else if(key==='x')o.x=limit(v,0,state.width);
     else if(key==='y')o.y=limit(v,0,state.depth);
     else if(key==='angle')o.angle=limit(v,-360,360);
     else if(key==='side')o.side=['none','L','R','C'].includes(v)?v:'none';
     else o[key]=saneString(v,key==='label'?48:key==='brand'?65:key==='zone'?45:160);
     drawAll();
   });
 }
 $('lk-plot-copy').addEventListener('click',()=>{const o=current();if(!o||state.items.length>=LIMIT)return;const clone=sanitize({width:state.width,depth:state.depth,items:[o]}).items[0];clone.x=limit(o.x+.5,0,state.width);clone.y=limit(o.y+.5,0,state.depth);state.items.push(clone);selected=clone.id;drawAll();});
 $('lk-plot-delete').addEventListener('click',()=>{if(!current())return;state.items=state.items.filter(o=>o.id!==selected);selected=null;drawAll();});
 $('lk-plot-example').addEventListener('click',()=>{
   if(state.items.length&&!confirm('Substituir os objetos existentes pelo exemplo?'))return;
   const demo=[['line',1,3,8,'L','PA L'],['line',11,3,8,'R','PA R'],['sub',6,7.3,6,'C','SUB CENTRO'],['front',3.4,7.4,2,'none','FRONT FILL'],['front',8.6,7.4,2,'none','FRONT FILL 2'],['drum',6,1.8,1,'C','BATERIA'],['keys',2.5,4.5,1,'L','TECLADO'],['mic',6,5,1,'C','VOCAL']];
   state.width=12;state.depth=8;state.area='stage';state.items=demo.map(x=>({id:nextId(),type:x[0],x:x[1],y:x[2],qty:x[3],side:x[4],label:x[5],angle:0,brand:'',zone:'',notes:''}));
   selected=null;view='top';drawAll();
 });
 $('lk-plot-clear').addEventListener('click',()=>{if(state.items.length&&!confirm('Apagar todos os objetos do mapa?'))return;state.items=[];selected=null;drawAll();});
 $('lk-plot-export').addEventListener('click',exportDemo);
}
function init(){if(!$('lk-plot-open'))return;palette();bind();drawAll();}
window.LKStagePlot={capture,restore,empty,printMarkup};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();