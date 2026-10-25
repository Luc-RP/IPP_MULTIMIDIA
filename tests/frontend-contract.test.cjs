'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('login mobile substitui a grade desktop por uma coluna real', () => {
  const css=read('brand-lk.css');
  assert.match(css, /@media screen and \(max-width:760px\)/);
  assert.match(css, /\.auth-page \.auth-shell\s*\{\s*display:grid;\s*grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.auth-page \.auth-card\s*\{[^}]*width:100%;min-width:0;max-width:100%/);
  assert.match(css, /\.auth-page \.auth-card \.login-input input,[\s\S]*?font-size:16px/);
  assert.match(css, /\.auth-page:not\(\[hidden\]\)\s*\{[^}]*overflow-x:clip/);
});

test('editor mantém navegação mobile acessível e folhas sem overflow', () => {
  const css=read('brand-lk.css');
  assert.match(css, /\.app-page \.module-nav\s*\{[^}]*display:flex;flex-wrap:nowrap/);
  assert.match(css, /\.app-page \.module-nav\s*\{[^}]*overflow-x:auto/);
  assert.match(css, /\.app-page \.main-area\s*\{overflow-x:clip/);
  assert.match(css, /\.app-page \.fields-grid,[\s\S]*?\.app-page \.field\{min-width:0\}/);
  assert.match(css, /@media screen and \(max-width:420px\)/);
});

test('CSS versionado, formulário e arrays técnicos continuam no HTML', () => {
  const html=read('index.html'),js=read('app.js');
  for (const file of ['styles.css','brand-lk.css','app.js'])
    assert.ok(html.includes(file+'?v=0.8.2'),file+' sem cache bust');
  for (const id of ['login-form','register-form','rider-form','input-list','output-list',
    'technical-checklist','profile-trigger'])
    assert.ok(html.includes('id="'+id+'"'),id+' ausente');
  assert.match(js, /o\.inputList=readBuilder\('input-list'\)/);
  assert.match(js, /o\.outputList=readBuilder\('output-list'\)/);
  assert.match(js, /o\.technicalChecklist=readBuilder\('technical-checklist'\)/);
  assert.match(js, /loadBuilders\(data\)/);
  assert.match(js, /printTechnicalTable/);
});

test('HTML sem ids duplicados e script principal sem erros de sintaxe', () => {
  const html=read('index.html'),js=read('app.js');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.ok(ids.length>=100,'A verificação precisa encontrar os IDs reais do documento');
  assert.equal(new Set(ids).size,ids.length);
  const idsReferenciados=[...js.matchAll(/\$\('([^']+)'\)/g)].map(match=>match[1]);
  assert.ok(idsReferenciados.length>=35,'A verificação precisa encontrar referências do JavaScript');
  for(const id of idsReferenciados) assert.ok(ids.includes(id),'ID sem elemento HTML: '+id);
  assert.doesNotThrow(()=>new Function(js));
});
