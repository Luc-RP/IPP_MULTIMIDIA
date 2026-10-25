'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));

function mockRider(overrides={}){
  return {
    eventName:'Apresentação técnica',organizationName:'Organização',eventType:'Congresso',
    year:'2026',yearStart:'2026',yearEnd:'2027',eventDate:'',
    location:'Auditório',console:'Yamaha DM3',consoleOther:'',speakerModel:'',
    speakerType:'Line array',speakerQty:'6',subQty:'2',monitorQty:'4',
    paNotes:'',patchNotes:'',instruments:[{name:'Bateria',qty:1},{name:'Baixo',qty:1}],
    leadSingers:'1',backSingers:'2',inputCount:'16',auxCount:'4',
    monitorType:'In-ear',contactName:'Técnico',contactRole:'Operador',
    contactEmail:'',contactPhone:'',generalNotes:'',inputList:[],outputList:[],
    technicalChecklist:[],productionScale:'',attendanceEstimate:'',
    stageDimensions:'',soundcheckMinutes:'',artwork:'',...overrides
  };
}

function renderPrint(module, data){
  const app=read('app.js');
  const begin=app.indexOf('  const printedPair=');
  const end=app.indexOf('  function printRider()');
  assert.ok(begin>=0 && end>begin, 'funções de impressão ausentes');
  const fragment=app.slice(begin,end);
  const root={innerHTML:''};
  const context={escapeHTML,eventDisplayName:d=>String(d.eventName||''),
    eventPeriod:d=>String(d.year||''),
    definitions:{
      som:{hero:'SONORIZAÇÃO / PRODUÇÃO TÉCNICA',print:'RIDER DE SOM'},
      luz:{hero:'ILUMINAÇÃO',print:'RIDER DE LUZ'},
      imagem:{hero:'IMAGEM E VÍDEO',print:'RIDER DE IMAGEM'}
    },
    $:id=>{assert.equal(id,'print-root');return root;},
    activeModule:module
  };
  const fn=new Function('data','ctx',
    'const {escapeHTML,eventDisplayName,eventPeriod,definitions,$,activeModule}=ctx;\n'
    +fragment+'\ngeneratePrintMarkup(data);');
  fn(data,context);
  return root.innerHTML;
}

test('capa A4 compacta e regras que evitam cortes sem bloquear tabelas longas',()=>{
  const css=read('brand-lk.css');
  assert.match(css, /LK PDF\/Impressão v0\.8\.2/);
  assert.match(css, /\.print-cover\s*\{[^}]*padding:6mm 14mm 5\.5mm/);
  assert.match(css, /\.print-cover h1\s*\{[^}]*font-size:22pt/);
  assert.match(css, /\.print-section--compact\s*\{break-inside:avoid/);
  assert.match(css, /\.print-section--long\s*\{break-inside:auto/);
  assert.match(css, /\.print-technical-table thead\s*\{display:table-header-group/);
  assert.match(css, /\.print-technical-table tr\s*\{break-inside:avoid/);
  assert.match(css, /\.print-section h3\s*\{[^}]*break-after:avoid/);
});
test('documento simples não imprime tabelas vazias ou pula números',()=>{
  const html=renderPrint('som',mockRider());
  const sections=[...html.matchAll(/<section class="print-section[^"]*"><h3><span>(\d+)/g)].map(m=>m[1]);
  assert.deepEqual(sections,['01','02','03','04','05']);
  assert.ok(!html.includes('<table class="print-technical-table"'));
  assert.match(html, /Formação da banda/);
});
test('documento grande imprime listas e checklist em seções pagináveis',()=>{
  const inputs=Array.from({length:60},(_,i)=>({channel:String(i+1),
    source:'Instrumento '+i,microphone:'DI',notes:'Canal de áudio'}));
  const html=renderPrint('som',mockRider({
    inputList:inputs,
    outputList:[{bus:'M1',destination:'Vocal'}],
    technicalChecklist:[{done:false,group:'Passagem de som',label:'Revisar patch'}],
    productionScale:'Grande porte',
    attendanceEstimate:'3000',
    stageDimensions:'12 x 8',
    soundcheckMinutes:'60'
  }));
  const sections=[...html.matchAll(/<section class="print-section[^"]*"><h3><span>(\d+)/g)].map(m=>m[1]);
  assert.deepEqual(sections,['01','02','03','04','05','06','07','08']);
  assert.equal((html.match(/<table class="print-technical-table">/g)||[]).length,3);
  assert.match(html, /Público estimado/);
  assert.match(html, /Passagem de som/);
  assert.match(html, /print-section--long/);
});
test('compatibilidade com luz/imagem e escape contra HTML injetado',()=>{
  for(const module of ['luz','imagem']){
    const html=renderPrint(module,mockRider());
    const sections=[...html.matchAll(/<section class="print-section[^"]*"><h3><span>(\d+)/g)].map(m=>m[1]);
    assert.deepEqual(sections,['01','02','03']);
  }
  const malicious=renderPrint('som',mockRider({
    eventName:'<img src=x onerror=alert(1)>',
    inputList:[{channel:'1',source:'<script>alert(1)</script>'}]
  }));
  assert.ok(!malicious.includes('<script>'));
  assert.ok(!malicious.includes('<img src=x onerror'));
  assert.match(malicious, /&lt;script&gt;/);
  assert.match(malicious, /&lt;img src=x onerror/);
});
test('tipos de eventos ampliados e campos opcionais integrados ao formulário',()=>{
  const html=read('index.html'),js=read('app.js');
  for(const name of ['Festival','Show / concerto','Culto / celebração','Vigília',
    'Congresso','Evento corporativo','Transmissão ao vivo','Outro'])
    assert.ok(html.includes('<option>'+name+'</option>'),name);
  for(const id of ['production-scale','attendance-estimate','stage-dimensions','soundcheck-minutes'])
    assert.ok(html.includes('id="'+id+'"'),id);
  for(const name of ['productionScale','attendanceEstimate','stageDimensions','soundcheckMinutes'])
    assert.ok(html.includes('name="'+name+'"'),name);
  assert.match(js,/const productionPairs=/);
  for(const file of ['app.js','styles.css','brand-lk.css'])
    assert.ok(html.includes(file+'?v=0.8.2'),file+' sem versionamento');
});

test('impressão compacta mantém títulos legíveis e previne cortes',()=>{
  const css=read('brand-lk.css');
  assert.match(css, /\.print-cover h1\{font-size:22pt!important/);
  assert.match(css, /\.print-cover h1\{[^}]*margin:2\.6mm 0 \.8mm/);
  assert.match(css, /\.print-body\{display:block;padding:5\.5mm 14mm 8mm/);
  assert.match(css, /\.print-section \.print-list \+ \.print-pairs\{margin-top:2\.4mm!important/);
  assert.match(css, /#print-root\{display:block!important;width:100%!important/);
  assert.match(css, /\.print-section--compact\{break-inside:avoid;page-break-inside:avoid/);
  assert.match(css, /\.print-technical-table thead\{display:table-header-group/);
  assert.match(css, /\.print-technical-table tr\{break-inside:avoid;page-break-inside:avoid/);
});
