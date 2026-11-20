'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const script=fs.readFileSync(path.join(__dirname,'../stage-plot.js'),'utf8');
class FakeElement{
  constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.text='';}
  setAttribute(k,v){this.attrs[k]=String(v);}
  appendChild(x){this.children.push(x);return x;}
  append(...xs){this.children.push(...xs);}
  replaceChildren(...xs){this.children=xs;}
  set textContent(x){this.text=String(x);}
  get textContent(){return this.text;}
  get outerHTML(){
    const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const attrs=Object.entries(this.attrs).map(([k,v])=>' '+k+'="'+esc(v)+'"').join('');
    return '<'+this.tag+attrs+'>'+esc(this.text)+this.children.map(x=>x.outerHTML||esc(x)).join('')+'</'+this.tag+'>';
  }
}
const document={
  readyState:'loading',
  addEventListener(){},
  getElementById(){return null;},
  createElementNS(_ns,tag){return new FakeElement(tag);},
  createElement(tag){return new FakeElement(tag);}
};
const window={};
const coreScript=fs.readFileSync(path.join(__dirname,'../stage-core.js'),'utf8');
Function('window',coreScript)(window);
const core=window.LKStageCore;
const api=Function('document','window',script+'\nreturn window.LKStagePlot;')(document,window);

test('the LK stage plot retains editable attributes and draws quantities',()=>{
  api.restore({version:1,mode:'advanced',area:'venue',width:16,depth:10,items:[
    {type:'line',qty:8,side:'L',label:'PA L',x:1,y:3},
    {type:'line',qty:8,side:'R',label:'PA R',x:15,y:3},
    {type:'sub',qty:6,side:'C',label:'SUB CENTRO',x:8,y:8}
  ]});
  const d=api.capture();
  assert.equal(d.items.length,3);
  assert.equal(d.items.reduce((total,item)=>total+item.qty,0),22);
  assert.equal(d.area,'venue');
  assert.equal(d.mode,'advanced');
  const html=api.printMarkup(d);
  assert.match(html,/<svg/);
  assert.match(html,/SUB CENTRO/);
  assert.match(html,/PA L/);
  assert.match(html,/Subwoofer C: 6/);
});

test('all 25 initial equipment shapes render without remote imagery',()=>{
 const categories=['line','column','point','sub','front','side','wedge','drumfill','drum','keys','guitar','bass','amp','mic','di','stagebox','riser','truss','bumper','xstand','light','screen','projector','camera','generator'];
 api.restore({width:14,depth:9,items:categories.map((type,i)=>({type,qty:1,x:(i%5)+2,y:Math.floor(i/5)+2}))});
 assert.equal(api.capture().items.length,25);
 const markup=api.printMarkup(api.capture());
 assert.match(markup,/<svg/);
 assert.doesNotMatch(script,/\bfetch\s*\(/);
});

test('imported data is clamped and untrusted labels are escaped',()=>{
 api.restore({width:900,depth:0,items:Array.from({length:90},()=>({
   type:'sub',qty:999,label:'<script>alert(1)</script>',x:-42,y:999
 }))});
 const d=api.capture();
 assert.equal(d.width,90);
 assert.equal(d.depth,3);
 assert.equal(d.items.length,60);
 assert.equal(d.items[0].qty,99);
 const markup=api.printMarkup(d);
 assert.doesNotMatch(markup,/<script>/);
 assert.match(markup,/&lt;script&gt;/);
});

test('modelo v1 migra para v2 e retém posicionamento, lado e quantidade',()=>{
 const legacy=core.normalize({version:1,width:16,depth:10,items:[
  {type:'line',qty:8,side:'L',label:'PA esquerdo',x:1.5,y:4}
 ]},new Set(['line']),()=> 'migrado');
 assert.equal(legacy.version,2);
 assert.equal(legacy.height,7);
 assert.equal(legacy.items[0].qty,8);
 assert.equal(legacy.items[0].side,'L');
 assert.equal(legacy.items[0].x,1.5);
 assert.ok(legacy.items[0].heightM>0);
 assert.equal(legacy.items[0].id,'migrado');
});
test('vista superior e elevações compartilham geometria única',()=>{
 const scene=core.normalize({width:16,depth:10,height:8,items:[
  {type:'point',qty:1,x:4,y:7,z:2,widthM:1,depthM:.8,heightM:1.5}
 ]},new Set(['point']),()=> 'p');
 const o=scene.items[0],top=core.project(scene,o,'top'),front=core.project(scene,o,'front');
 const side=core.project(scene,o,'left'),right=core.project(scene,o,'right');
 assert.equal(top.x,front.x);
 assert.notEqual(top.y,front.y);
 assert.ok(front.y<core.frame(scene,'front').y+scene.height*front.scale);
 assert.notEqual(side.x,right.x);
 assert.ok(core.footprint(o,'front',front.scale).height>0);
 const changed={...o,z:4};
 assert.ok(core.project(scene,changed,'front').y<front.y,'altura maior sobe na vista frontal');
 assert.equal(core.project(scene,changed,'top').y,top.y,'altura não desloca posição de planta');
});
test('modelo contém dimensões físicas delimitadas e 25 tipos técnicos são mantidos',()=>{
 const d=core.normalize({width:20,depth:12,height:8,items:[
  {type:'sub',x:5,y:5,z:50,widthM:100,depthM:-1,heightM:20,qty:6}
 ]},new Set(['sub']),()=> 'validado');
 assert.equal(d.items[0].z,8);
 assert.equal(d.items[0].widthM,20);
 assert.equal(d.items[0].heightM,8);
 assert.equal(d.items[0].qty,6);
 assert.ok(d.items[0].depthM>=.05);
});
