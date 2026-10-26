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
