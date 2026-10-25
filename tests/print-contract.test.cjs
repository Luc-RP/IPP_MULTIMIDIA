'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

function printRenderer() {
  const source = read('app.js');
  const original = '  setupListeners();';
  assert.ok(source.includes(original), 'O setup principal mudou, atualizar o teste');
  const win = {}, root = { innerHTML: '' };
  const instrumented = source.replace(original,
    '  window.__PRINT_TEST__={generatePrintMarkup,setModule:(m)=>{activeModule=m;}};');
  new Function('window', 'document', instrumented)(win, {
    getElementById: id => id === 'print-root' ? root : {}
  });
  return (d, module='som') => {
    win.__PRINT_TEST__.setModule(module);
    win.__PRINT_TEST__.generatePrintMarkup(d);
    return root.innerHTML;
  };
}
const data = {
  organizationName:'Produção',eventName:'Festival',eventType:'Festival',year:'2026',
  eventDate:'',instruments:[{name:'Baixo',qty:1}],inputList:[],outputList:[],
  technicalChecklist:[],console:'X32',speakerQty:'4',monitorQty:'2'
};

test('exportação sempre A4 com margens físicas e capa compacta', () => {
  const html=read('index.html'),css=read('brand-lk.css');
  assert.ok(html.indexOf('styles.css?v=0.8.1') < html.indexOf('brand-lk.css?v=0.8.1'));
  assert.match(css, /@page \{ size:A4 portrait; margin:11mm 13mm 13mm; \}/);
  assert.match(css, /\.print-cover\{[^}]*min-height:0!important;[^}]*padding:9mm 11mm 8mm!important/);
  assert.match(css, /\.print-cover h1\{[^}]*font-size:28pt!important/);
  assert.match(css, /#print-root,#print-root \*\{font-family:Arial/);
});

test('linhas de tabelas são inteiras, cabeçalho repetido e seções longas pagináveis', () => {
  const css=read('brand-lk.css');
  assert.match(css, /\.print-section--table\{break-inside:auto!important/);
  assert.match(css, /\.print-technical-table thead\{display:table-header-group;\}/);
  assert.match(css, /\.print-technical-table tr\{break-inside:avoid-page!important/);
  assert.match(css, /\.print-section h3\{[^}]*break-after:avoid-page/);
});

test('rider antigo não recebe dados opcionais nem tabelas vazias', () => {
  const render=printRenderer(),html=render(data);
  assert.doesNotMatch(html, /Planejamento técnico|Input List ·|Output List ·|Checklist técnico/);
  assert.match(html, /Formação da banda/);
  const numbers=[...html.matchAll(/class="print-section(?: print-section--table)?"\><h3><span>(\d+)/g)].map(m=>Number(m[1]));
  assert.deepEqual(numbers,[1,2,3,4,5]);
});

test('rider grande imprime listas e a numeração contínua, escapando HTML', () => {
  const render=printRenderer();
  const input=Array.from({length:42},(_,i)=>({channel:String(i+1),source:'Microfone '+i,microphone:'DI'}));
  input[0].source='<img src=x onerror=alert(1)>';
  const output=Array.from({length:20},(_,i)=>({bus:String(i+1),destination:'IEM '+i}));
  const technicalChecklist=Array.from({length:25},(_,i)=>({label:'Teste '+i,group:'Montagem',done:i%2===0}));
  const html=render({...data,inputList:input,outputList:output,technicalChecklist,
    eventScale:'Grande',loadInTime:'10:30',stageDimensions:'12 × 8 m'});
  assert.match(html,/Planejamento técnico/);
  assert.match(html,/12 × 8 m/);
  assert.match(html,/10:30/);
  assert.equal((html.match(/class="print-section print-section--table"/g)||[]).length,3);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html,/<img src=x onerror=/);
  const numbers=[...html.matchAll(/class="print-section(?: print-section--table)?"\><h3><span>(\d+)/g)].map(m=>Number(m[1]));
  assert.deepEqual(numbers,[1,2,3,4,5,6,7,8]);
});

test('módulos luz e imagem preservam as seções originais', () => {
  const render=printRenderer();
  for (const kind of ['luz','imagem']) {
    const html=render(data,kind);
    assert.match(html,/Responsáveis e observações/);
    assert.doesNotMatch(html,/Input List ·/);
    const numbers=[...html.matchAll(/class="print-section(?: print-section--table)?"\><h3><span>(\d+)/g)].map(m=>Number(m[1]));
    assert.deepEqual(numbers,[1,2,3]);
  }
});

test('novos tipos de eventos preservam os já existentes', () => {
  const html=read('index.html');
  for(const old of ['Evento','Vigília','Congresso','Conferência','Social','Outro']){
    assert.ok(html.includes('<option>'+old+'</option>'),'faltou '+old);
  }
  for(const type of ['Show / apresentação musical','Festival','Evento corporativo','Culto / celebração','Transmissão ao vivo']){
    assert.ok(html.includes('<option>'+type+'</option>'),'faltou '+type);
  }
  for(const name of ['eventScale','expectedAudience','stageDimensions',
    'backlineProvider','loadInTime','soundcheckTime','powerRequirements']){
    assert.ok(html.includes('name="'+name+'"'),'faltou campo '+name);
  }
});
