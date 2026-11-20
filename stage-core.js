/* LK Multimídia | Núcleo espacial v2 (metros).
   Fonte única de coordenadas e dimensões para vistas e documentos.
   Dimensões iniciais são genéricas/ilustrativas, NÃO especificações de fabricantes.
*/
(function (root) {
 'use strict';
 const MAX_GROUPS=60,MAX_QTY=99;
 const asNum=(v,fallback)=>{if(v===null||v===undefined||v==='')return fallback;const n=Number(v);return Number.isFinite(n)?n:fallback;};
 const clamp=(v,min,max,def=min)=>Math.min(max,Math.max(min,asNum(v,def)));
 const limited=(v,length)=>String(v===undefined||v===null?'':v).slice(0,length);
 function dimensions(type,qty=1){
   const n=clamp(qty,1,99,1),cols=Math.min(n,4),rows=Math.ceil(n/cols);
   switch(type){
    case 'line':return{widthM:.65,depthM:.55,heightM:Math.min(12,.30*n)};
    case 'column':return{widthM:.32,depthM:.38,heightM:1.5};
    case 'point':return{widthM:.55*cols,depthM:.5*rows,heightM:.6};
    case 'sub':return{widthM:.68*cols,depthM:.68*rows,heightM:.65};
    case 'front':case 'side':case 'wedge':case 'drumfill':return{widthM:.55*cols,depthM:.5*rows,heightM:.45};
    case 'drum':return{widthM:2,depthM:1.8,heightM:1.5};
    case 'keys':return{widthM:1.3,depthM:.6,heightM:1};
    case 'guitar':case 'bass':return{widthM:.5,depthM:.35,heightM:1.15};
    case 'amp':return{widthM:.7,depthM:.4,heightM:.8};
    case 'mic':return{widthM:.45,depthM:.45,heightM:1.6};
    case 'di':return{widthM:.2,depthM:.18,heightM:.08};
    case 'stagebox':return{widthM:.5,depthM:.25,heightM:.2};
    case 'riser':return{widthM:2,depthM:1,heightM:.5};
    case 'truss':return{widthM:2,depthM:.3,heightM:.3};
    case 'bumper':return{widthM:1,depthM:.6,heightM:.15};
    case 'xstand':return{widthM:.7,depthM:.5,heightM:.8};
    case 'screen':return{widthM:3,depthM:.15,heightM:1.7};
    case 'projector':return{widthM:.5,depthM:.45,heightM:.25};
    case 'camera':return{widthM:.45,depthM:.6,heightM:1.5};
    case 'light':return{widthM:.3,depthM:.3,heightM:.6};
    case 'generator':return{widthM:1.2,depthM:.7,heightM:1};
    default:return{widthM:.6,depthM:.6,heightM:.6};
   }
 }
 function empty(){return{version:2,mode:'simple',area:'stage',width:12,depth:8,height:7,items:[]};}
 function normalize(raw,validTypes,newId){
   const d=raw&&typeof raw==='object'?raw:{},r={
     version:2,mode:d.mode==='advanced'?'advanced':'simple',
     area:d.area==='venue'?'venue':'stage',
     width:clamp(d.width,4,90,12),depth:clamp(d.depth,3,90,8),
     height:clamp(d.height,3,30,7),items:[]
   };
   const known=validTypes instanceof Set?validTypes:new Set(validTypes||[]);
   if(Array.isArray(d.items))for(const o of d.items.slice(0,MAX_GROUPS)){
     if(!o||!known.has(o.type))continue;
     const qty=Math.round(clamp(o.qty,1,MAX_QTY,1)),defaults=dimensions(o.type,qty);
     r.items.push({
       id:typeof newId==='function'?newId():limited(o.id,48),
       type:o.type,label:limited(o.label||o.type,48),qty,
       side:['L','R','C','none'].includes(o.side)?o.side:'none',
       x:clamp(o.x,0,r.width,r.width/2),y:clamp(o.y,0,r.depth,r.depth/2),
       z:clamp(o.z,0,r.height,0),
       widthM:clamp(o.widthM,.05,r.width,defaults.widthM),
       depthM:clamp(o.depthM,.05,r.depth,defaults.depthM),
       heightM:clamp(o.heightM,.05,r.height,defaults.heightM),
       angle:clamp(o.angle,-360,360,0),
       brand:limited(o.brand,65),zone:limited(o.zone,45),notes:limited(o.notes,160)
     });
   }
   return r;
 }
 // Vistas ortográficas ligadas ao mesmo modelo, sem inventar coordenadas independentes.
 function frame(scene,view){
   const top=view==='top',front=view==='front';
   const horizontal=top||front?scene.width:scene.depth;
   const vertical=top?scene.depth:scene.height;
   const scale=Math.min(665/horizontal,390/vertical);
   return{view,horizontal,vertical,scale,x:(760-horizontal*scale)/2,y:57+(410-vertical*scale)/2};
 }
 function project(scene,item,view){
   const f=frame(scene,view);
   const horizontal=view==='top'||view==='front'?item.x:view==='left'?item.y:scene.depth-item.y;
   const vertical=view==='top'?item.y:scene.height-item.z-item.heightM/2;
   return{x:f.x+horizontal*f.scale,y:f.y+vertical*f.scale,scale:f.scale};
 }
 function footprint(item,view,scale){
   const w=view==='top'||view==='front'?item.widthM:item.depthM;
   const h=view==='top'?item.depthM:item.heightM;
   return{width:Math.max(1,w*scale),height:Math.max(1,h*scale)};
 }
 function list(scene){
   const groups=new Map();
   for(const o of scene.items||[]){
     const key=o.type+'|'+o.side;
     const current=groups.get(key)||{type:o.type,side:o.side,qty:0,groups:0};
     current.qty+=Number(o.qty)||0;current.groups+=1;groups.set(key,current);
   }
   return[...groups.values()];
 }
 root.LKStageCore=Object.freeze({version:2,MAX_GROUPS,MAX_QTY,dimensions,empty,normalize,frame,project,footprint,list});
})(window);