(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var NS="http://www.w3.org/2000/svg", STORE="lk.stage.preview.v1";
var types=[
 {id:"line",name:"Line Array",cat:"CAIXAS / PA",glyph:"▥",color:"pa"},
 {id:"column",name:"Coluna vertical",cat:"CAIXAS / PA",glyph:"▤",color:"pa"},
 {id:"point",name:"Point Source",cat:"CAIXAS / PA",glyph:"◼",color:"pa"},
 {id:"sub",name:"Subwoofer",cat:"CAIXAS / PA",glyph:"▣",color:"sub"},
 {id:"front",name:"Front Fill",cat:"RETORNOS / FILLS",glyph:"◢",color:"monitor"},
 {id:"side",name:"Side Fill",cat:"RETORNOS / FILLS",glyph:"◣",color:"monitor"},
 {id:"wedge",name:"Monitor wedge",cat:"RETORNOS / FILLS",glyph:"◭",color:"monitor"},
 {id:"drum",name:"Bateria",cat:"INSTRUMENTOS",glyph:"🥁",color:"other"},
 {id:"keys",name:"Teclado",cat:"INSTRUMENTOS",glyph:"🎹",color:"other"},
 {id:"guitar",name:"Guitarra",cat:"INSTRUMENTOS",glyph:"🎸",color:"other"},
 {id:"bass",name:"Baixo",cat:"INSTRUMENTOS",glyph:"♫",color:"other"},
 {id:"mic",name:"Microfone / pedestal",cat:"MICROFONAÇÃO",glyph:"🎤",color:"other"},
 {id:"riser",name:"Praticável",cat:"ESTRUTURA",glyph:"▦",color:"other"},
 {id:"truss",name:"Treliça",cat:"ESTRUTURA",glyph:"⫶",color:"other"},
 {id:"light",name:"Moving head",cat:"LUZ / VÍDEO",glyph:"✦",color:"other"},
 {id:"screen",name:"Tela / LED",cat:"LUZ / VÍDEO",glyph:"▭",color:"other"},
 {id:"generator",name:"Gerador",cat:"INFRAESTRUTURA",glyph:"⚡",color:"other"}
];
var typeIndex=Object.fromEntries(types.map(function(t){return[t.id,t];}));
var state={mode:"simple",view:"top",area:"stage",w:16,h:10,items:[]},selected=null,seq=0,drag=null,geo={scale:1,x:0,y:0};
function clamp(v,min,max){v=Number(v);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):min;}
function uid(){seq+=1;return"obj-"+Date.now().toString(36)+"-"+seq;}
function createItem(type,x,y,qty,side,label){var t=typeIndex[type];if(!t)return null;return{id:uid(),type:type,x:clamp(x,0,state.w),y:clamp(y,0,state.h),qty:clamp(qty||1,1,150),side:side||"none",label:label||t.name,angle:0,brand:"",zone:"",notes:""};}
function addItem(type,x,y){var item=createItem(type,x==null?state.w/2:x,y==null?state.h/2:y);if(!item)return;state.items.push(item);selected=item.id;changed();notice("Adicionado: "+item.label);}
function seed(){state={mode:state.mode,view:"top",area:"stage",w:16,h:10,items:[]};
var initial=[["line",1.2,3.4,8,"L","PA L"],["line",14.8,3.4,8,"R","PA R"],["sub",8,8.4,6,"C","SUB CENTRO"],["front",5,9.1,2,"none","FRONT FILL"],["front",11,9.1,2,"none","FRONT FILL 2"],["drum",8,1.8,1,"C","BATERIA"],["keys",3.6,5.5,1,"L","TECLADO"],["mic",8,6.5,1,"C","VOCAL"]];
initial.forEach(function(a){state.items.push(createItem.apply(null,a));});selected=null;changed();}
function save(){try{localStorage.setItem(STORE,JSON.stringify({version:1,data:state}));}catch(e){}}
function notice(s){var el=$("toast");el.textContent=s;el.hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(function(){el.hidden=true;},2400);}
function cleanItem(o){if(!o||typeof o!=="object"||!typeIndex[o.type])return null;var a=createItem(o.type,o.x,o.y,o.qty,["L","R","C","none"].includes(o.side)?o.side:"none");
a.id=uid();a.label=String(o.label||typeIndex[o.type].name).slice(0,64);a.angle=clamp(o.angle,-360,360);a.brand=String(o.brand||"").slice(0,80);a.zone=String(o.zone||"").slice(0,50);a.notes=String(o.notes||"").slice(0,450);return a;}
function importData(raw){var d=raw&&raw.data?raw.data:raw;if(!d||!Array.isArray(d.items)||d.items.length>500)throw Error("Arquivo fora do formato da prévia.");
var w=clamp(d.w,4,150),h=clamp(d.h,3,150);state={mode:d.mode==="advanced"?"advanced":"simple",view:"top",area:d.area==="venue"?"venue":"stage",w:w,h:h,items:[]};
d.items.forEach(function(o){var a=cleanItem(o);if(a)state.items.push(a);});selected=null;changed();}
function changed(){save();syncControls();render();}
function syncControls(){document.body.classList.toggle("mode-simple",state.mode==="simple");$("simple").classList.toggle("active",state.mode==="simple");$("advanced").classList.toggle("active",state.mode==="advanced");
$("view").value=state.view;$("area-type").value=state.area;$("width-m").value=state.w;$("depth-m").value=state.h;
$("view-info").textContent=state.view==="top"?"Arraste os objetos no mapa. Grupos podem ter qualquer quantidade.":"Vista ilustrativa de referência. Volte à superior para arrastar.";}
function node(tag,attrs,txt){var e=document.createElementNS(NS,tag);if(attrs)Object.entries(attrs).forEach(function(pair){e.setAttribute(pair[0],String(pair[1]));});if(txt!=null)e.textContent=txt;return e;}
function child(parent,tag,attrs,txt){var e=node(tag,attrs,txt);parent.appendChild(e);return e;}
function coords(event){var svg=$("stage-svg"),p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;var m=svg.getScreenCTM();if(!m)return{x:state.w/2,y:state.h/2};p=p.matrixTransform(m.inverse());return{x:clamp((p.x-geo.x)/geo.scale,0,state.w),y:clamp((p.y-geo.y)/geo.scale,0,state.h)};}
function render(){var svg=$("stage-svg");svg.replaceChildren();geo.scale=Math.min(840/state.w,485/state.h);geo.x=(960-state.w*geo.scale)/2;geo.y=63+(500-state.h*geo.scale)/2;
child(svg,"rect",{x:0,y:0,width:960,height:640,fill:"#0b1524"});var floor=child(svg,"g",{});
child(floor,"rect",{x:geo.x,y:geo.y,width:state.w*geo.scale,height:state.h*geo.scale,rx:5,class:"scene-border"});
for(var x=1;x<state.w;x++){var xx=geo.x+x*geo.scale;child(floor,"line",{x1:xx,y1:geo.y,x2:xx,y2:geo.y+state.h*geo.scale,class:"scene-grid"});}
for(var y=1;y<state.h;y++){var yy=geo.y+y*geo.scale;child(floor,"line",{x1:geo.x,y1:yy,x2:geo.x+state.w*geo.scale,y2:yy,class:"scene-grid"});}
child(svg,"text",{x:480,y:31,"text-anchor":"middle",class:"scene-label"},state.area==="venue"?"AMBIENTE / SALÃO":"FUNDO DO PALCO");
child(svg,"text",{x:480,y:612,"text-anchor":"middle",class:"scene-label"},state.area==="venue"?"ACESSO / PÚBLICO":"FRENTE DO PALCO / PLATEIA");
child(svg,"text",{x:geo.x,y:54,class:"muted-svg"},state.w+" m");
child(svg,"text",{x:geo.x-12,y:geo.y+25,"text-anchor":"end",class:"muted-svg"},state.h+" m");
child(svg,"text",{x:Math.max(10,geo.x-22),y:geo.y-8,fill:"#58d6d8","font-weight":"bold","font-size":15},"L");
child(svg,"text",{x:Math.min(938,geo.x+state.w*geo.scale+10),y:geo.y-8,fill:"#58d6d8","font-weight":"bold","font-size":15},"R");
if(state.view!=="top")child(svg,"text",{x:480,y:54,"text-anchor":"middle",class:"svg-legend"},"ELEVAÇÃO ILUSTRATIVA • SEM SIMULAÇÃO 3D");
var layer=child(svg,"g",{});
state.items.forEach(function(item){var sx,sy;if(state.view==="top"){sx=geo.x+item.x*geo.scale;sy=geo.y+item.y*geo.scale;}else if(state.view==="front"){sx=geo.x+item.x*geo.scale;sy=geo.y+state.h*geo.scale*.66;}else{sx=geo.x+(state.view==="left"?item.y:(state.h-item.y))*geo.scale*(state.w/state.h);sy=geo.y+state.h*geo.scale*.66;}
var g=child(layer,"g",{class:"stage-object"+(selected===item.id?" selected":"")+(state.view==="top"?"":" read-only-svg"),"data-id":item.id,transform:"translate("+sx+" "+sy+") rotate("+(state.view==="top"?item.angle:0)+")"});
drawObject(g,item);
if(state.view==="top"){g.addEventListener("pointerdown",function(ev){if(ev.button!==0)return;ev.preventDefault();selected=item.id;drag={id:item.id,pointer:ev.pointerId,target:g};g.setPointerCapture(ev.pointerId);renderSelection();});g.addEventListener("pointermove",function(ev){if(!drag||drag.id!==item.id||drag.pointer!==ev.pointerId)return;var xy=coords(ev);item.x=xy.x;item.y=xy.y;g.setAttribute("transform","translate("+(geo.x+xy.x*geo.scale)+" "+(geo.y+xy.y*geo.scale)+") rotate("+item.angle+")");});g.addEventListener("pointerup",function(ev){if(!drag||drag.id!==item.id)return;drag=null;changed();});g.addEventListener("pointercancel",function(){drag=null;changed();});}else g.addEventListener("click",function(){selected=item.id;renderSelection();});
});
child(svg,"text",{x:480,y:628,"text-anchor":"middle",class:"muted-svg"},"LK MULTIMÍDIA • PRÉVIA LOCAL • "+state.view.toUpperCase());
renderSidebar();}
function drawObject(g,item){var kind=typeIndex[item.type].color,css=kind==="pa"?"obj-body":kind==="sub"?"obj-sub":kind==="monitor"?"obj-monitor":"obj-other";
var qty=Number(item.qty),height=item.type==="line"?Math.min(104,Math.max(28,qty*9)):item.type==="column"?76:30;
var width=item.type==="line"?29:item.type==="column"?20:item.type==="keys"?65:item.type==="screen"?75:item.type==="truss"?90:48;
var r=child(g,"rect",{x:-width/2,y:-height/2,width:width,height:height,rx:4,class:css+" object-outline"});
if(["line","column"].includes(item.type)){var bars=Math.min(qty,12);for(var i=1;i<bars;i++){var yy=-height/2+(height/bars)*i;child(g,"line",{x1:-width/2+3,x2:width/2-3,y1:yy,y2:yy,stroke:"#acd5e0","stroke-width":1});}}
else if(item.type==="drum"){child(g,"circle",{cx:0,cy:0,r:17,fill:"#20354c",stroke:"#cde0f1","stroke-width":2});child(g,"circle",{cx:-12,cy:-12,r:7,fill:"#a0b9d0"});child(g,"circle",{cx:12,cy:-12,r:7,fill:"#a0b9d0"});}
else if(item.type==="mic"){child(g,"circle",{cx:0,cy:0,r:8,fill:"#d4dce8"});child(g,"line",{x1:0,y1:8,x2:0,y2:28,stroke:"#d4dce8","stroke-width":3});}
else if(item.type==="sub"||item.type==="point"){child(g,"circle",{cx:0,cy:0,r:11,fill:"#23374b",stroke:"#d7d1ed","stroke-width":2});child(g,"circle",{cx:0,cy:0,r:3,fill:"#9fb6d6"});}
else if(["front","side","wedge"].includes(item.type)){child(g,"path",{d:"M -12 5 L 0 -10 L 12 5 Z",fill:"#34333b",stroke:"#f4c788","stroke-width":2});}
else if(item.type==="keys"){for(var k=-3;k<=3;k++)child(g,"line",{x1:k*8,x2:k*8,y1:-10,y2:12,stroke:"#eaf0fd","stroke-width":1.7});}
else if(item.type==="truss"){for(var v=-35;v<=35;v+=14)child(g,"path",{d:"M "+v+" -14 L "+(v+12)+" 14",stroke:"#d2e0f5","stroke-width":1});}
else if(item.type==="light"){child(g,"circle",{cx:0,cy:0,r:12,fill:"#c7bd8e"});}
else if(item.type==="screen"){child(g,"rect",{x:-31,y:-10,width:62,height:20,fill:"#6b88a5",stroke:"#d6e5ee"});}
var display=item.label+(qty>1?" × "+qty:"");child(g,"text",{x:0,y:height/2+16,"text-anchor":"middle",class:"object-title"},display.length>30?display.slice(0,28)+"…":display);
if(item.side!=="none")child(g,"text",{x:width/2+4,y:-height/2,"font-size":11,"font-weight":"bold",fill:"#f4d5a5"},item.side);
}
function renderSelection(){render();}
function selectedItem(){return state.items.find(function(i){return i.id===selected;})||null;}
function renderSidebar(){var item=selectedItem(),properties=$("properties");properties.hidden=!item;$("selection-title").textContent=item?item.label:"Nenhum objeto selecionado";$("selection-hint").textContent=item?"Edite o grupo selecionado.":"Selecione um item no mapa ou na lista.";
if(item){["label","qty","side","x","y","angle","brand","zone","notes"].forEach(function(k){var el=$("p-"+k);if(el&&document.activeElement!==el)el.value=["x","y"].includes(k)?Number(item[k]).toFixed(1):item[k];});}
var list=$("object-list");list.replaceChildren();state.items.forEach(function(o){var t=typeIndex[o.type],b=document.createElement("button");b.className="object-row"+(selected===o.id?" selected":"");b.type="button";var icon=document.createElement("span");icon.className="mini";icon.textContent=t.glyph;var txt=document.createElement("span");var strong=document.createElement("strong");strong.textContent=o.label;var sm=document.createElement("small");sm.textContent=o.qty+" unid. · "+(o.side==="none"?"Sem lado":o.side+" · "+({L:"Esquerda",R:"Direita",C:"Centro"}[o.side]));txt.append(strong,sm);b.append(icon,txt);b.addEventListener("click",function(){selected=o.id;render();});list.appendChild(b);});
var total=state.items.reduce(function(a,o){return a+Number(o.qty);},0);
$("stat-groups").textContent=state.items.length;$("stat-units").textContent=total;
$("stat-left").textContent=state.items.filter(function(o){return ["line","column","point"].includes(o.type)&&o.side==="L";}).reduce(function(a,o){return a+Number(o.qty);},0);
$("stat-right").textContent=state.items.filter(function(o){return ["line","column","point"].includes(o.type)&&o.side==="R";}).reduce(function(a,o){return a+Number(o.qty);},0);
$("stat-subs").textContent=state.items.filter(function(o){return o.type==="sub";}).reduce(function(a,o){return a+Number(o.qty);},0);
var counts=new Map();state.items.forEach(function(o){var n=typeIndex[o.type].name+(o.side!=="none"?" · "+o.side:"");counts.set(n,(counts.get(n)||0)+Number(o.qty));});
$("summary").replaceChildren();counts.forEach(function(q,n){var row=document.createElement("div");row.className="summary-row";var a=document.createElement("span");a.textContent=n;var b=document.createElement("strong");b.textContent=String(q);row.append(a,b);$("summary").appendChild(row);});
}
function buildPalette(){var root=$("palette");root.replaceChildren();var last="",filter=$("search").value.toLowerCase().trim();types.forEach(function(t){if(filter&&!((t.name+" "+t.cat).toLowerCase().includes(filter)))return;if(last!==t.cat){var head=document.createElement("div");head.className="category-title";head.textContent=t.cat;root.appendChild(head);last=t.cat;}
var btn=document.createElement("button");btn.className="palette-item";btn.type="button";btn.draggable=true;btn.setAttribute("aria-label","Adicionar "+t.name);var ic=document.createElement("span");ic.className="glyph";ic.textContent=t.glyph;var text=document.createElement("span"),b=document.createElement("b"),sm=document.createElement("small");b.textContent=t.name;sm.textContent="Arrastar ou clicar";text.append(b,sm);btn.append(ic,text);btn.addEventListener("click",function(){addItem(t.id);});btn.addEventListener("dragstart",function(e){e.dataTransfer.setData("text/plain",t.id);e.dataTransfer.effectAllowed="copy";});root.append(btn);});}
function bind(){
$("search").addEventListener("input",buildPalette);
$("stage-svg").addEventListener("dragover",function(e){if(state.view==="top"){e.preventDefault();e.dataTransfer.dropEffect="copy";}});
$("stage-svg").addEventListener("drop",function(e){e.preventDefault();if(state.view!=="top")return;var type=e.dataTransfer.getData("text/plain");if(!typeIndex[type])return;var p=coords(e);addItem(type,p.x,p.y);});
$("simple").addEventListener("click",function(){state.mode="simple";changed();});
$("advanced").addEventListener("click",function(){state.mode="advanced";changed();});
$("view").addEventListener("change",function(e){state.view=e.target.value;changed();});
$("area-type").addEventListener("change",function(e){state.area=e.target.value;changed();});
[["width-m","w",4,150],["depth-m","h",3,150]].forEach(function(v){$(v[0]).addEventListener("change",function(e){state[v[1]]=clamp(e.target.value,v[2],v[3]);state.items.forEach(function(o){o.x=clamp(o.x,0,state.w);o.y=clamp(o.y,0,state.h);});changed();});});
["label","qty","side","x","y","angle","brand","zone","notes"].forEach(function(key){var el=$("p-"+key),update=function(){var o=selectedItem();if(!o)return;if(key==="qty")o.qty=clamp(el.value,1,150);else if(key==="x")o.x=clamp(el.value,0,state.w);else if(key==="y")o.y=clamp(el.value,0,state.h);else if(key==="angle")o.angle=clamp(el.value,-360,360);else if(key==="side")o.side=["L","R","C","none"].includes(el.value)?el.value:"none";else o[key]=el.value.slice(0,key==="label"?64:key==="notes"?450:key==="brand"?80:50);save();render();};
el.addEventListener(["label","brand","zone","notes"].includes(key)?"change":"input",update);});
$("duplicate").addEventListener("click",function(){var o=selectedItem();if(!o)return;var a=cleanItem(o);a.x=clamp(o.x+.7,0,state.w);a.y=clamp(o.y+.7,0,state.h);state.items.push(a);selected=a.id;changed();});
$("remove").addEventListener("click",function(){if(!selectedItem())return;state.items=state.items.filter(function(i){return i.id!==selected;});selected=null;changed();});
$("clear-map").addEventListener("click",function(){if(state.items.length&&!confirm("Remover todos os objetos desta prévia?"))return;state.items=[];selected=null;changed();});
$("load-demo").addEventListener("click",function(){if(state.items.length&&!confirm("Carregar exemplo? O mapa atual será substituído."))return;seed();notice("Exemplo restaurado.");});
$("export-json").addEventListener("click",function(){var payload=JSON.stringify({format:"lk-stage-plot-preview",version:1,data:state},null,2);var blob=new Blob([payload],{type:"application/json"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="lk-mapa-palco-preview.json";a.click();setTimeout(function(){URL.revokeObjectURL(u);},1000);});
$("import-json").addEventListener("change",async function(ev){var f=ev.target.files[0];if(!f)return;try{if(f.size>256000)throw Error("Arquivo acima de 256 KB.");importData(JSON.parse(await f.text()));notice("Mapa importado.");}catch(e){notice("Importação recusada: "+e.message);}ev.target.value="";});
$("print-map").addEventListener("click",function(){window.print();});
}
try{var saved=localStorage.getItem(STORE);if(saved){var obj=JSON.parse(saved);importData(obj);}else seed();}catch(e){seed();}
bind();buildPalette();changed();
})();