/* IPP MULTIMIDIA | Protótipo v0.1.0. Nenhuma autenticacao real ou banco online. */
'use strict';
(() => {
  const DEMO_EMAIL = 'demo@ipp.local';
  const DEMO_PASSWORD = 'IPPdemo2026!'; // Credencial publica de demonstracao. Nunca reutilizar em producao.
  const STORAGE_KEY = 'ipp.multimidia.v0.1.drafts';
  const SESSION_KEY = 'ipp.multimidia.demo.session';
  const selectors = id => document.getElementById(id);
  const form = selectors('rider-form');
  const definitions = {
    som: {title:'Rider técnico de som', crumb:'SOM', hero:'SONORIZAÇÃO / BANDA IPP', print:'RIDER DE SOM'},
    luz: {title:'Rider técnico de luz', crumb:'LUZ', hero:'ILUMINAÇÃO / EQUIPE IPP', print:'RIDER DE LUZ'},
    imagem: {title:'Rider técnico de imagem', crumb:'IMAGEM', hero:'IMAGEM & VÍDEO / EQUIPE IPP', print:'RIDER DE IMAGEM'}
  };
  const starterInstruments = [
    {name:'Violão',qty:1},{name:'Baixo',qty:1},{name:'Teclado',qty:1},{name:'Bateria',qty:1},{name:'Guitarra',qty:1}
  ];
  let activeModule = 'som', activeDraftId = null, artworkData = '', toastTimer = null, demoSession = false;
  const workspaces = {};
  const $ = selectors;

  function notify(message, isError=false) {
    const t = $('toast'); t.textContent = message;
    t.style.background = isError ? '#8e3d43' : '#1f6560';
    t.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
  }
  function toSafeString(v) { return v == null ? '' : String(v); }
  function escapeHTML(value) { return toSafeString(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function readDrafts() {
    try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  function writeDrafts(rows) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); return true; }
    catch { notify('Armazenamento local cheio. Remova a imagem anexada ou um rascunho antigo.', true); return false; }
  }
  function initializeVocals() {
    for (const id of ['lead-singers','back-singers']) {
      const select = $(id);
      for (let i=1;i<=10;i++){const opt=document.createElement('option');opt.value=String(i);opt.textContent=String(i);select.append(opt);}
    }
    $('lead-singers').value='1'; $('back-singers').value='3';
  }
  function appendInstrument(item={name:'',qty:1}) {
    const line=document.createElement('div');line.className='instrument-row';
    const input=document.createElement('input');input.type='text';input.maxLength=70;input.placeholder='Instrumento (ex.: guitarra)';input.value=toSafeString(item.name);input.setAttribute('aria-label','Nome do instrumento');input.setAttribute('list','instrument-suggestions');
    const count=document.createElement('input');count.type='number';count.min='1';count.max='99';count.value=String(item.qty||1);count.setAttribute('aria-label','Quantidade do instrumento');
    const remove=document.createElement('button');remove.type='button';remove.className='instrument-remove';remove.textContent='×';remove.title='Remover instrumento';remove.setAttribute('aria-label','Remover instrumento');
    remove.addEventListener('click',()=>{line.remove();updateSummary();});
    input.addEventListener('input',updateSummary);count.addEventListener('input',updateSummary);
    line.append(input,count,remove);$('instrument-list').append(line);
  }
  function readInstruments() {
    return [...document.querySelectorAll('.instrument-row')].map(row=>{
      const fields=row.querySelectorAll('input');return {name:fields[0].value.trim(),qty:Math.min(99,Math.max(1,Number(fields[1].value)||1))};
    }).filter(row=>row.name);
  }
  function loadInstruments(rows) {
    $('instrument-list').replaceChildren();(Array.isArray(rows)?rows:starterInstruments).forEach(appendInstrument);updateSummary();
  }
  function defaultData(module=activeModule) {
    const result={}; new FormData(form).forEach((value,key)=>{if(typeof value==='string')result[key]=value;});
    result.eventName='';result.location='';result.eventDate='';result.eventType='Evento de jovens';result.year='2026';result.yearStart='2026';result.yearEnd='2027';
    result.instruments = module==='som' ? starterInstruments.map(x=>({...x})) : [];
    result.artwork='';result.module=module;return result;
  }
  function capture() {
    const o={module:activeModule};new FormData(form).forEach((value,key)=>{if(typeof value==='string')o[key]=value;});
    o.instruments=readInstruments();o.artwork=artworkData;return o;
  }
  function restore(data={}) {
    form.reset();
    [...form.elements].forEach(element=>{
      if (element.name && Object.hasOwn(data,element.name) && ['INPUT','SELECT','TEXTAREA'].includes(element.tagName) && element.type !== 'file') element.value=toSafeString(data[element.name]);
    });
    loadInstruments(Array.isArray(data.instruments)?data.instruments:starterInstruments);
    artworkData=data.artwork||'';$('artwork').value='';updateArtwork();
    updateVigil();updateSummary();
  }
  function updateArtwork(){
    $('artwork-preview').hidden=!artworkData;$('remove-artwork').hidden=!artworkData;
    $('artwork-preview').src=artworkData || '';
  }
  function updateVigil() {
    const vigil=$('event-type').value==='Vigília';$('vigil-years').hidden=!vigil;
    $('event-year').disabled=vigil;
    $('hero-year').textContent=vigil ? `${$('year-start').value}  →  ${$('year-end').value}` : `EVENTO DE ${$('event-year').value}`;
    updateSummary();
  }
  function updateSummary() {
    $('context-type').textContent=definitions[activeModule].crumb;
    $('context-event').textContent=$('event-name').value.trim().slice(0,45)||'Não informado';
    const count=readInstruments().length;
    $('context-instruments').textContent=activeModule==='som'? `${count} tipo${count===1?'':'s'}`:'Não aplicável';
    $('paper-footer-module').textContent=`${definitions[activeModule].print} · ${$('event-type').value==='Vigília'?$('year-start').value+' → '+$('year-end').value:$('event-year').value}`;
  }
  function setModule(next,{restoreWorking=true}={}) {
    if(!definitions[next])return;
    workspaces[activeModule]=capture();
    activeModule=next;activeDraftId=null;
    document.querySelectorAll('[data-module]').forEach(button=>{const selected=button.dataset.module===activeModule;button.classList.toggle('active',selected);button.setAttribute('aria-current',selected?'page':'false');});
    document.querySelectorAll('[data-section]').forEach(element=>{element.hidden=element.dataset.section!==activeModule;});
    $('breadcrumb-current').textContent=definitions[activeModule].crumb;
    $('page-title').textContent=definitions[activeModule].title;
    $('hero-subtitle').textContent=definitions[activeModule].hero;
    $('last-section-number').textContent=activeModule==='som'?'05':'03';
    $('last-saved').textContent='Ainda não salvo';
    if(restoreWorking && workspaces[next])restore(workspaces[next]);else restore(defaultData(next));
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function makeNew() {
    if(!confirm('Criar novo rider? Alterações não salvas deste formulário serão descartadas.'))return;
    activeDraftId=null;delete workspaces[activeModule];restore(defaultData(activeModule));$('last-saved').textContent='Ainda não salvo';notify('Novo formulário iniciado.');
  }
  function validate() {
    const name=$('event-name').value.trim();
    if(!name){$('event-name').focus();notify('Informe o nome do evento ou campanha antes de salvar ou exportar.',true);return false;}
    if($('event-type').value==='Vigília' && Number($('year-end').value)<=Number($('year-start').value)){
      $('year-end').focus();notify('O ano final precisa ser maior que o ano inicial.',true);return false;
    }
    return true;
  }
  function saveRider() {
    if(!validate())return;
    const drafts=readDrafts(),now=new Date().toISOString();
    if(!activeDraftId)activeDraftId=(typeof crypto!=='undefined' && crypto.randomUUID)?crypto.randomUUID():`draft-${Date.now()}`;
    const data={...capture(),id:activeDraftId,updatedAt:now};
    const i=drafts.findIndex(x=>x.id===activeDraftId);
    if(i>=0)drafts[i]=data;else drafts.unshift(data);
    if(writeDrafts(drafts)){
      $('last-saved').textContent='Salvo neste navegador • '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      renderDraftList();notify('Rider salvo neste navegador (modo demo).');
    }
  }
  function renderDraftList() {
    const root=$('draft-list');root.replaceChildren();const items=readDrafts().sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
    if(!items.length){const p=document.createElement('p');p.className='draft-empty';p.textContent='Nenhum rider salvo neste navegador.';root.append(p);return;}
    items.slice(0,25).forEach(draft=>{
      const button=document.createElement('button');button.type='button';button.className='draft-btn';
      const title=document.createElement('b');title.textContent=draft.eventName||'Rider sem título';
      const date=document.createElement('span');const day=draft.updatedAt?new Date(draft.updatedAt).toLocaleDateString('pt-BR'):'sem data';date.textContent=`${definitions[draft.module]?.crumb||'RIDER'} · ${day}`;
      button.append(title,date);button.addEventListener('click',()=>loadDraft(draft.id));root.append(button);
    });
  }
  function loadDraft(id) {
    const row=readDrafts().find(x=>x.id===id);if(!row)return notify('Rascunho não encontrado.',true);
    const target=definitions[row.module]?row.module:'som';setModule(target,{restoreWorking:false});restore(row);activeDraftId=id;
    $('last-saved').textContent='Rascunho carregado · '+new Date(row.updatedAt).toLocaleDateString('pt-BR');
    notify('Rascunho carregado para edição.');
  }
  const printedPair=(label,value)=>`<div class="print-field"><small>${escapeHTML(label)}</small><strong>${escapeHTML(value||'Não informado')}</strong></div>`;
  const section=(number,title,contents)=>`<section class="print-section"><h3><span>${escapeHTML(number)}</span> ${escapeHTML(title)}</h3>${contents}</section>`;
  const printedNotes=(text)=>`<p class="print-notes">${escapeHTML(text||'Não informado')}</p>`;
  function generatePrintMarkup(d) {
    const description=definitions[activeModule];
    const year=d.eventType==='Vigília'?`${d.yearStart} → ${d.yearEnd}`:d.year;
    let html=section('01','Identificação do evento',`<div class="print-pairs">${printedPair('Tipo de evento',d.eventType)}${printedPair('Ano / período',year)}${printedPair('Nome do evento',d.eventName)}${printedPair('Data',d.eventDate?new Date(`${d.eventDate}T12:00:00`).toLocaleDateString('pt-BR'):'Não informada')}${printedPair('Local',d.location)}</div>${d.artwork?`<div class="print-field" style="margin-top:5mm"><small>Arte de identidade visual</small><img class="print-art" src="${d.artwork}" alt="Arte do evento" /></div>`:''}`);
    if(activeModule==='som') {
      html+=section('02','Sistema principal · P.A.',`<div class="print-pairs">${printedPair('Mesa de som',d.console)}${printedPair('Modelo adicional',d.consoleOther)}${printedPair('Caixas principais',d.speakerModel)}${printedPair('Tipo de sistema',d.speakerType)}${printedPair('Quantidade de caixas',d.speakerQty)}${printedPair('Subwoofers',d.subQty)}${printedPair('Monitores de chão',d.monitorQty)}</div>${d.paNotes?printedNotes(d.paNotes):''}`);
      const instruments=(d.instruments||[]).map(i=>`<div class="print-item"><span>${escapeHTML(i.name)}</span><strong>${escapeHTML(i.qty)} un.</strong></div>`).join('')||'<p>Nenhum instrumento adicionado.</p>';
      html+=section('03','Formação da banda',`<div class="print-list">${instruments}</div><div class="print-pairs" style="margin-top:6mm">${printedPair('Cantores principais',d.leadSingers)}${printedPair('Backing vocals',d.backSingers)}</div>`);
      html+=section('04','Patch e monitoração',`<div class="print-pairs">${printedPair('Canais de entrada (estimativa)',d.inputCount)}${printedPair('Vias de monitoração',d.auxCount)}${printedPair('Tipo de monitoração',d.monitorType)}</div>${printedNotes(d.patchNotes)}`);
    } else if(activeModule==='luz') {
      html+=section('02','Iluminação',`<div class="print-pairs">${printedPair('Controladora',d.lightConsole)}${printedPair('Quantidade de refletores',d.lightQty)}${printedPair('Tipo principal',d.lightType)}${printedPair('Controle de sinal',d.lightControl)}</div>${printedNotes(d.lightNotes)}`);
    } else {
      html+=section('02','Imagem e vídeo',`<div class="print-pairs">${printedPair('Quantidade de câmeras',d.cameraQty)}${printedPair('Resolução',d.videoOutput)}${printedPair('Mesa / switcher',d.videoSwitcher)}${printedPair('Saída principal',d.streamTarget)}</div>${printedNotes(d.videoNotes)}`);
    }
    html+=section(activeModule==='som'?'05':'03','Responsáveis e observações',`<div class="print-pairs">${printedPair('Responsável técnico',d.contactName)}${printedPair('Função',d.contactRole)}${printedPair('E-mail',d.contactEmail)}${printedPair('Telefone',d.contactPhone)}</div>${printedNotes(d.generalNotes)}`);
    const documentTitle=escapeHTML(d.eventName);
    const printRoot=$('print-root');
    printRoot.innerHTML=`<div class="print-cover"><div><div class="print-over">IGREJA PRÍNCIPE PODEROSO · IPP MULTIMÍDIA</div><h1>RIDER TÉCNICO</h1><h2>${escapeHTML(description.hero)}</h2><div class="print-line"></div><small>${documentTitle} · ${escapeHTML(year)}</small></div><div class="print-logo">IPP</div></div><div class="print-body">${html}<div class="print-bottom"><span>IPP MULTIMÍDIA · ${escapeHTML(description.print)}</span><span>DOCUMENTO GERADO EM ${escapeHTML(new Date().toLocaleDateString('pt-BR'))}</span></div></div>`;
  }
  function printRider() {
    if(!validate())return;
    try {generatePrintMarkup(capture());window.print();}catch(error){notify('Não foi possível iniciar a impressão neste navegador.',true);}
  }
  function setupImage() {
    $('artwork').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      if(!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>2*1024*1024){notify('Use PNG, JPEG ou WebP até 2 MB.',true);e.target.value='';return;}
      const reader=new FileReader();
      reader.onload=()=>{artworkData=String(reader.result||'');updateArtwork();notify('Arte anexada ao formulário.');};
      reader.onerror=()=>notify('Erro ao carregar imagem.',true);reader.readAsDataURL(file);
    });
    $('remove-artwork').addEventListener('click',()=>{artworkData='';$('artwork').value='';updateArtwork();});
  }
  function setupRegistrationPreview() {
    const screenParts=['login-title','login-description','login-form','show-register','demo-box'];
    const goTo = screen => {
      const onLogin=screen==='login';
      screenParts.forEach(id=>{$(id).hidden=!onLogin;});
      $('register-view').hidden=onLogin;
      $('register-form-step').hidden=false;
      $('register-verification-step').hidden=true;
      $('register-error').textContent='';
      if(onLogin)$('register-form').reset();
    };
    $('show-register').addEventListener('click',()=>goTo('register'));
    $('register-back-login').addEventListener('click',()=>goTo('login'));
    $('verification-back').addEventListener('click',()=>{
      $('register-form').reset();
      $('register-form-step').hidden=false;
      $('register-verification-step').hidden=true;
    });
    $('register-form').addEventListener('submit',event=>{
      event.preventDefault();
      const f=$('register-form'), p=$('register-password').value;
      const confirm=$('register-password-confirm').value;
      const digits=$('register-phone').value.replace(/\D/g,'');
      const err=$('register-error');
      err.textContent='';
      if(!f.reportValidity())return;
      if(!/^\d{10,11}$/.test(digits) && !/^55\d{10,11}$/.test(digits)){err.textContent='Informe um telefone brasileiro com DDD (10 ou 11 dígitos).';return;}
      if(p.length<12||!/[a-zA-Z]/.test(p)||!/\d/.test(p)){err.textContent='Use uma senha fictícia com no mínimo 12 caracteres, letras e números.';return;}
      if(p!==confirm){err.textContent='As senhas de demonstração não coincidem.';return;}
      // Segurança da prévia: apaga imediatamente todos os dados; nenhuma conta, SMS ou e-mail é criado/enviado.
      f.reset();
      $('register-form-step').hidden=true;
      $('register-verification-step').hidden=false;
      $('register-verification-code').value='';
      $('verification-preview-note').textContent='Simulação de verificação por e-mail. Nenhum código gerado.';
    });
    document.querySelectorAll('input[name="verify-method"]').forEach(input=>input.addEventListener('change',()=>{
      const via=input.value==='sms'?'SMS':'e-mail';
      $('verification-preview-note').textContent='Simulação de verificação por '+via+'. Nenhum código gerado ou enviado.';
    }));
  }
  function login() {
    $('login-form').addEventListener('submit',event=>{
      event.preventDefault();const email=$('login-email').value.trim().toLowerCase(),pass=$('login-password').value;
      if(email!==DEMO_EMAIL || pass!==DEMO_PASSWORD){$('login-error').textContent='Credenciais de demonstração inválidas.';return;}
      $('login-error').textContent='';demoSession=true;try{sessionStorage.setItem(SESSION_KEY,'demo');}catch{}showApp();
    });
    $('toggle-password').addEventListener('click',()=>{$('login-password').type=$('login-password').type==='password'?'text':'password';});
    $('logout-btn').addEventListener('click',()=>{demoSession=false;try{sessionStorage.removeItem(SESSION_KEY);}catch{}$('app-page').hidden=true;$('auth-page').hidden=false;$('login-password').value='';});
  }
  function showApp() {$('auth-page').hidden=true;$('app-page').hidden=false;renderDraftList();updateSummary();}
  function setupListeners() {
    initializeVocals();loadInstruments(starterInstruments);restore(defaultData('som'));
    const list=document.createElement('datalist');list.id='instrument-suggestions';['Violão','Guitarra','Contrabaixo','Baixo','Teclado','Bateria','Percussão','Piano','Saxofone','Trompete','Violino','Cajón','Ukulele','Sintetizador'].forEach(v=>{const opt=document.createElement('option');opt.value=v;list.append(opt)});document.body.append(list);
    for(const b of document.querySelectorAll('.nav-item'))b.addEventListener('click',()=>setModule(b.dataset.module));
    for(const id of ['new-rider','new-draft-side'])$(id).addEventListener('click',makeNew);
    $('add-instrument').addEventListener('click',()=>{appendInstrument();updateSummary();});
    $('save-btn').addEventListener('click',saveRider);
    $('cancel-btn').addEventListener('click',()=>{
      if(!confirm('Cancelar edição e descartar alterações não salvas?'))return;
      if(activeDraftId){const saved=readDrafts().find(x=>x.id===activeDraftId);if(saved)restore(saved);else restore(defaultData());}
      else restore(defaultData());notify('Edição cancelada.');
    });
    $('pdf-btn').addEventListener('click',printRider);
    $('event-type').addEventListener('change',updateVigil);
    for(const id of ['event-year','year-start','year-end'])$(id).addEventListener('change',updateVigil);
    form.addEventListener('input',updateSummary);form.addEventListener('change',updateSummary);
    setupImage();login();setupRegistrationPreview();$('copyright-year').textContent=String(new Date().getFullYear());
    try{demoSession=sessionStorage.getItem(SESSION_KEY)==='demo';}catch{} if(demoSession)showApp();
  }
  setupListeners();
})();
