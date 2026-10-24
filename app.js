/* LK MULTIMIDIA | Contas reais somente com API local segura. */
'use strict';
(() => {
  const STORAGE_KEY = 'ipp.multimidia.v0.1.drafts';
  const selectors = id => document.getElementById(id);
  const form = selectors('rider-form');
  const definitions = {
    som: {title:'Rider técnico de som', crumb:'SOM', hero:'SONORIZAÇÃO / BANDA / PRODUÇÃO', print:'RIDER DE SOM'},
    luz: {title:'Rider técnico de luz', crumb:'LUZ', hero:'ILUMINAÇÃO / EQUIPE TÉCNICA', print:'RIDER DE LUZ'},
    imagem: {title:'Rider técnico de imagem', crumb:'IMAGEM', hero:'IMAGEM & VÍDEO / EQUIPE TÉCNICA', print:'RIDER DE IMAGEM'}
  };
  const starterInstruments = [
    {name:'Violão',qty:1},{name:'Baixo',qty:1},{name:'Teclado',qty:1},{name:'Bateria',qty:1},{name:'Guitarra',qty:1}
  ];
  let activeModule = 'som', activeDraftId = null, artworkData = '', toastTimer = null;
  const API_LOCAL=window.location.origin==='http://127.0.0.1:8787';
  let cloudRiders=[],pendingEmail='';
  const workspaces = {};
  const $ = selectors;

  function notify(message, isError=false) {
    const t = $('toast'); t.textContent = message;
    t.style.background = isError ? '#8e3d43' : '#303137';
    t.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
  }
  function toSafeString(v) { return v == null ? '' : String(v); }
  function escapeHTML(value) { return toSafeString(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  async function api(url,method='GET',body){
    if(!API_LOCAL)throw new Error('Acesso às contas disponível somente pela instalação local da LK.');
    let r;try{r=await fetch(url,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});}
    catch{throw new Error('Servidor LK indisponível neste computador.');}
    let data={};try{data=await r.json();}catch{}
    if(!r.ok)throw new Error(data.error||'Operação não concluída.');
    return data;
  }
  function readDrafts(){return cloudRiders;}
  async function refreshRiders(){
    const result=await api('/api/riders');cloudRiders=(result.riders||[]).map(row=>({id:String(row.id),eventName:row.title,module:row.category,updatedAt:row.updated_at}));
    renderDraftList();
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
    if(activeModule==='som' && $('speaker-model').value==='Outro modelo'){
      $('speaker-model').value=''; notify('Plano Free: escolha uma caixa do catálogo. Modelo personalizado estará no Premium.',true); return false;
    }
    const name=$('event-name').value.trim();
    if(!name){$('event-name').focus();notify('Informe o nome do evento ou campanha antes de salvar ou exportar.',true);return false;}
    if($('event-type').value==='Vigília' && Number($('year-end').value)<=Number($('year-start').value)){
      $('year-end').focus();notify('O ano final precisa ser maior que o ano inicial.',true);return false;
    }
    return true;
  }
  async function saveRider(){
    if(!validate())return;
    if(artworkData){notify('Anexos ainda não estão disponíveis para salvamento. Remova a imagem.',true);return;}
    const d=capture(),payload={category:activeModule,title:d.eventName||'Rider técnico',eventYear:d.eventType==='Vigília'?d.yearStart:d.eventYear,content:{...d,artwork:''}};
    const btn=$('save-btn');btn.disabled=true;
    try{
      const resp=await api(activeDraftId?'/api/riders/'+encodeURIComponent(activeDraftId):'/api/riders',activeDraftId?'PUT':'POST',payload);
      if(!activeDraftId)activeDraftId=String(resp.id);
      await refreshRiders();$('last-saved').textContent='Salvo na sua conta';notify('Rider salvo.');
    }catch(e){notify(e.message,true)}finally{btn.disabled=false;}
  }
  function renderDraftList(){
    const root=$('draft-list');root.replaceChildren();
    if(!cloudRiders.length){const p=document.createElement('p');p.className='draft-empty';p.textContent='Nenhum rider salvo.';root.append(p);return;}
    cloudRiders.slice(0,25).forEach(d=>{
      const button=document.createElement('button');button.type='button';button.className='draft-btn';
      const title=document.createElement('b');title.textContent=d.eventName||'Rider sem título';
      const meta=document.createElement('span');meta.textContent=(definitions[d.module]?.crumb||'RIDER')+' · '+(d.updatedAt?new Date(d.updatedAt).toLocaleDateString('pt-BR'):'');
      button.append(title,meta);button.addEventListener('click',()=>loadDraft(d.id));root.append(button);
    });
  }
  async function loadDraft(id){
    try{
      const result=await api('/api/riders/'+encodeURIComponent(id));
      let content=result.rider.content_json;if(typeof content==='string')content=JSON.parse(content);
      if(!content||typeof content!=='object')throw new Error('Conteúdo inválido.');
      setModule(result.rider.category,{restoreWorking:false});restore({...content,artwork:''});activeDraftId=String(id);
      $('last-saved').textContent='Rider carregado';notify('Rider carregado.');
    }catch(e){notify(e.message,true);}
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
    printRoot.innerHTML=`<div class="print-cover"><div><div class="print-over">LK MULTIMÍDIA · PRODUÇÃO & COMUNICAÇÃO</div><h1>RIDER TÉCNICO</h1><h2>${escapeHTML(description.hero)}</h2><div class="print-line"></div><small>${documentTitle} · ${escapeHTML(year)}</small></div><div class="print-logo">LK</div></div><div class="print-body">${html}<div class="print-bottom"><span>LK MULTIMÍDIA · ${escapeHTML(description.print)}</span><span>DOCUMENTO GERADO EM ${escapeHTML(new Date().toLocaleDateString('pt-BR'))}</span></div></div>`;
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
  function setupAccountForms(){
    const parts=['login-title','login-description','login-form','show-register'];
    function showRegister(enabled){
      for(const id of parts)$(id).hidden=enabled;
      $('register-view').hidden=!enabled;
      $('register-form-step').hidden=false;$('register-verification-step').hidden=true;
      $('register-error').textContent='';$('verify-error').textContent='';
    }
    $('show-register').addEventListener('click',()=>showRegister(true));
    $('register-back-login').addEventListener('click',()=>showRegister(false));
    $('verification-back').addEventListener('click',()=>{$('register-form-step').hidden=false;$('register-verification-step').hidden=true;});
    $('register-form').addEventListener('submit',async e=>{
      e.preventDefault();if(!API_LOCAL)return;
      const f=$('register-form');if(!f.reportValidity())return;
      const password=$('register-password').value,passwordConfirm=$('register-password-confirm').value;
      $('register-error').textContent='';
      if(password!==passwordConfirm){$('register-error').textContent='As senhas não coincidem.';return;}
      const email=$('register-email').value.trim().toLowerCase();
      const btn=f.querySelector('[type=submit]');btn.disabled=true;
      try{
        await api('/api/auth/register','POST',{fullName:$('register-name').value.trim(),email,phone:$('register-phone').value,password,passwordConfirm});
        pendingEmail=email;f.reset();$('register-form-step').hidden=true;$('register-verification-step').hidden=false;
        $('register-verification-code').value='';$('verify-error').textContent='Confira sua caixa de entrada e o spam.';
      }catch(err){$('register-error').textContent=err.message;}finally{btn.disabled=false;}
    });
    $('verify-submit').addEventListener('click',async()=>{
      const code=$('register-verification-code').value.trim();
      if(!/^\d{6}$/.test(code)){$('verify-error').textContent='Informe os seis dígitos do e-mail.';return;}
      const btn=$('verify-submit');btn.disabled=true;
      try{await api('/api/auth/verify','POST',{email:pendingEmail,code});showRegister(false);
        $('login-email').value=pendingEmail;$('account-status').textContent='E-mail confirmado. Entre com sua senha.';$('login-password').focus();
      }catch(err){$('verify-error').textContent=err.message;}finally{btn.disabled=false;}
    });
    $('resend-code').addEventListener('click',async()=>{
      try{await api('/api/auth/resend','POST',{email:pendingEmail});$('verify-error').textContent='Se o cadastro estiver pendente, um novo código será enviado quando permitido.';}
      catch(err){$('verify-error').textContent=err.message;}
    });
    $('login-form').addEventListener('submit',async e=>{
      e.preventDefault();if(!API_LOCAL)return;
      const btn=$('login-form').querySelector('[type=submit]');btn.disabled=true;$('login-error').textContent='';
      try{
        await api('/api/auth/login','POST',{email:$('login-email').value,password:$('login-password').value});
        await api('/api/me');$('login-password').value='';showApp();
      }catch(err){$('login-error').textContent=err.message;}finally{btn.disabled=false;}
    });
    $('toggle-password').addEventListener('click',()=>{$('login-password').type=$('login-password').type==='password'?'text':'password';});
    $('logout-btn').addEventListener('click',async()=>{
      try{await api('/api/auth/logout','POST',{});}catch{}
      cloudRiders=[];$('app-page').hidden=true;$('auth-page').hidden=false;showRegister(false);$('login-password').value='';
    });
    if(!API_LOCAL){
      $('account-status').textContent='Acesso às contas disponível na instalação local da LK.';
      $('login-email').disabled=true;$('login-password').disabled=true;
      $('login-form').querySelector('[type=submit]').disabled=true;$('show-register').disabled=true;
    }else{
      $('login-email').disabled=false;$('login-password').disabled=false;
      $('login-form').querySelector('[type=submit]').disabled=false;
      $('account-status').textContent='Entre ou crie sua conta com seu e-mail.';
      api('/health').then(h=>{
        $('show-register').disabled=!h.smtpReady;
        if(!h.smtpReady)$('account-status').textContent='A confirmação por e-mail ainda não está configurada. O cadastro será liberado quando estiver disponível.';
      }).catch(err=>{$('account-status').textContent=err.message;$('show-register').disabled=true;});
      api('/api/me').then(()=>showApp()).catch(()=>{});
    }
  }
  function showApp() {$('auth-page').hidden=true;$('app-page').hidden=false;refreshRiders().catch(e=>notify(e.message,true));updateSummary();}
  function setupListeners() {
    initializeVocals();loadInstruments(starterInstruments);restore(defaultData('som'));
    const list=document.createElement('datalist');list.id='instrument-suggestions';['Violão','Guitarra','Contrabaixo','Baixo','Teclado','Bateria','Percussão','Piano','Saxofone','Trompete','Violino','Cajón','Ukulele','Sintetizador'].forEach(v=>{const opt=document.createElement('option');opt.value=v;list.append(opt)});document.body.append(list);
    for(const b of document.querySelectorAll('.nav-item'))b.addEventListener('click',()=>setModule(b.dataset.module));
    for(const id of ['new-rider','new-draft-side'])$(id).addEventListener('click',makeNew);
    $('add-instrument').addEventListener('click',()=>{appendInstrument();updateSummary();});
    $('save-btn').addEventListener('click',saveRider);
    $('cancel-btn').addEventListener('click',()=>{
      if(!confirm('Cancelar edição e descartar alterações não salvas?'))return;
      if(activeDraftId){loadDraft(activeDraftId);}
      else restore(defaultData());notify('Edição cancelada.');
    });
    $('pdf-btn').addEventListener('click',printRider);
    $('event-type').addEventListener('change',updateVigil);
    for(const id of ['event-year','year-start','year-end'])$(id).addEventListener('change',updateVigil);
    form.addEventListener('input',updateSummary);form.addEventListener('change',updateSummary);
    setupImage();setupAccountForms();$('copyright-year').textContent=String(new Date().getFullYear());
  }
  setupListeners();
})();
