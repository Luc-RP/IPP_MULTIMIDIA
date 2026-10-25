'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const startConfig=src.indexOf('  const presetChecklist =');
const endConfig=src.indexOf('  let API_READY=');
const begin=src.indexOf('  function createBuilderField(');
const end=src.indexOf('  function defaultData(');
assert.ok(startConfig>0&&endConfig>startConfig&&begin>endConfig&&end>begin);

class Element {
  constructor(tag='div') {
    this.tagName=tag.toUpperCase();
    this.children=[];this.parent=null;this.listeners={};this.dataset={};
    this.type=tag==='input'?'text':undefined;this.value='';this.checked=false;this.className='';
    this.textContent='';this.hidden=false;
  }
  append(...items) {for(const child of items){child.parent=this;this.children.push(child);}}
  replaceChildren(...items) {for(const child of this.children)child.parent=null;this.children=[];this.append(...items);}
  querySelectorAll(selector) {
    const found=[];
    const check=el=>selector==='.builder-row'?el.className.split(/\s+/).includes('builder-row'):selector==='[data-col]'?Boolean(el.dataset.col):false;
    const walk=node=>{for(const child of node.children){if(check(child))found.push(child);walk(child);}};
    walk(this);return found;
  }
  setAttribute(){}
  addEventListener(name,fn){this.listeners[name]=fn;}
  remove(){if(!this.parent)return;this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;}
}
function setup(instruments=[],lead='1',back='3'){
  const ids=['input-list','output-list','technical-checklist','input-list-count','output-list-count','checklist-progress','lead-singers','back-singers'];
  const nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
  nodes['lead-singers'].value=lead;nodes['back-singers'].value=back;
  const messages=[];
  const ctx={
    document:{createElement:tag=>new Element(tag)},
    $:id=>{assert.ok(nodes[id],'ID inesperado '+id);return nodes[id];},
    toSafeString:value=>value==null?'':String(value),
    readInstruments:()=>instruments,notify:(msg,isError)=>messages.push({msg,isError})
  };
  const code=src.slice(startConfig,endConfig)+src.slice(begin,end)+
    'return {appendBuilder,appendNextInputChannel,generateInputsFromInstruments,loadBuilders,readBuilder,updateBuilderCounts};';
  const runtime=new Function('ctx', 'const {document,$,toSafeString,readInstruments,notify}=ctx;'+code)(ctx);
  return {...runtime,nodes,messages};
}
test('checklist inicial mantém etapas sem marcar tarefas como concluídas',()=>{
  const x=setup();
  x.loadBuilders({});
  const rows=x.readBuilder('technical-checklist');
  assert.equal(rows.length,8);
  assert.ok(rows.every(row=>row.done===false));
  assert.equal(x.nodes['checklist-progress'].textContent,'0 de 8 concluídos');
  assert.equal(x.readBuilder('input-list').length,0);
});
test('Input, Output e checklist mantêm dados na serialização e reabertura',()=>{
  const x=setup();
  const initial={
    inputList:[{channel:'01',category:'Instrumento',source:'Violão',microphone:'DI',stand:'Não',phantom:false,notes:'Canal teste'},
      {channel:'02',category:'Ambiência',source:'Over L',microphone:'Condensador',stand:'Girafa',phantom:true,notes:'+48V'}],
    outputList:[{bus:'Aux 1',destination:'Vocal',kind:'In-ear / fones',connection:'XLR',notes:'Sem fio'}],
    technicalChecklist:[{group:'Passagem de som',label:'Verificar ganho e retorno',done:true}]
  };
  x.loadBuilders(initial);
  const serialized=JSON.stringify({
    inputList:x.readBuilder('input-list'),
    outputList:x.readBuilder('output-list'),
    technicalChecklist:x.readBuilder('technical-checklist')
  });
  const parsed=JSON.parse(serialized);
  x.loadBuilders(parsed);
  assert.deepEqual(x.readBuilder('input-list'),parsed.inputList);
  assert.deepEqual(x.readBuilder('output-list'),parsed.outputList);
  assert.deepEqual(x.readBuilder('technical-checklist'),parsed.technicalChecklist);
  assert.equal(x.nodes['checklist-progress'].textContent,'1 de 1 concluídos');
});
test('adicionar depois de remover um canal não produz numeração duplicada',()=>{
  const x=setup();
  x.loadBuilders({inputList:[{channel:'01',source:'Violão'},{channel:'03',source:'Baixo'}],outputList:[],technicalChecklist:[]});
  x.appendNextInputChannel();
  assert.deepEqual(x.readBuilder('input-list').map(r=>r.channel),['01','03','02']);
  x.nodes['input-list'].querySelectorAll('.builder-row')[0].remove();
  x.appendNextInputChannel();
  assert.deepEqual(x.readBuilder('input-list').map(r=>r.channel),['03','02','01']);
});
test('sugestão considera banda, vocalistas e phantom nos overheads',()=>{
  const x=setup([{name:'Violão',qty:1},{name:'Bateria',qty:1},{name:'Teclado',qty:1}],'1','2');
  x.loadBuilders({technicalChecklist:[]});
  x.generateInputsFromInstruments();
  const rows=x.readBuilder('input-list');
  assert.equal(rows.length,11);
  assert.deepEqual(rows.map(row=>Number(row.channel)),Array.from({length:11},(_,i)=>i+1));
  assert.equal(rows.filter(row=>row.category==='Voz').length,3);
  assert.equal(rows.filter(row=>row.source.includes('Over')&&row.phantom).length,2);
  assert.ok(rows.some(row=>row.source.startsWith('Backing vocal 2')));
  x.generateInputsFromInstruments();
  assert.equal(x.readBuilder('input-list').length,11,'não deve duplicar um patch já existente');
  assert.ok(x.messages.some(m=>m.isError));
});
test('listas antigas e itens nulos continuam carregando',()=>{
  const x=setup([], '0','0');
  x.loadBuilders({inputList:[null,{channel:'07',source:'Voz'}],outputList:[null],technicalChecklist:[null]});
  assert.equal(x.readBuilder('input-list').length,2);
  assert.equal(x.readBuilder('output-list').length,1);
  assert.equal(x.readBuilder('technical-checklist').length,1);
});
