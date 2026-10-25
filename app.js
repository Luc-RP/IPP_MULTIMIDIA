/* LK MULTIMIDIA | Interface de acesso e riders. */
'use strict';
(() => {
  const STORAGE_KEY = 'ipp.multimidia.v0.1.drafts';
  const selectors = id => document.getElementById(id);
  const form = selectors('rider-form');
  const definitions = {
    som: {title:'Rider técnico de som', crumb:'SOM', hero:'SONORIZAÇÃO / PRODUÇÃO TÉCNICA', print:'RIDER DE SOM'},
    luz: {title:'Rider técnico de luz', crumb:'LUZ', hero:'ILUMINAÇÃO / EQUIPE TÉCNICA', print:'RIDER DE LUZ'},
    imagem: {title:'Rider técnico de imagem', crumb:'IMAGEM', hero:'IMAGEM & VÍDEO / EQUIPE TÉCNICA', print:'RIDER DE IMAGEM'}
  };
  const starterInstruments = [
    {name:'Violão',qty:1},{name:'Baixo',qty:1},{name:'Teclado',qty:1},{name:'Bateria',qty:1},{name:'Guitarra',qty:1}
  ];
  let activeModule = 'som', activeDraftId = null, artworkData = '', toastTimer = null;
  let API_READY=false; // O backend só libera contas quando a configuração real estiver operacional.
  let cloudRiders=[],pendingEmail='',signupOrganizationName='',profileUser=null;
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
    if(!API_READY)throw new Error('Não foi possível concluir a operação.');
    let r;try{r=await fetch(url,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});}
    catch{throw new Error('Não foi possível conectar à API da LK.');}
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
    result.eventName='';result.organizationName=signupOrganizationName;result.location='';result.eventDate='';result.eventType='Evento';result.year='2026';result.yearStart='2026';result.yearEnd='2027';
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
    if(!$('event-type').value)$('event-type').value='Evento';
    updateVigil();updateSummary();
  }
  function updateArtwork(){
    $('artwork-preview').hidden=!artworkData;$('remove-artwork').hidden=!artworkData;
    $('artwork-preview').src=artworkData || '';
  }
  function updateVigil() {
    const vigil=$('event-type').value==='Vigília';$('vigil-years').hidden=!vigil;
    $('event-year').disabled=vigil;
    updateEventHeader();
    updateSummary();
  }
  function eventPeriod(d){
    if(d.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(d.eventDate)){
      const value=new Date(d.eventDate+'T12:00:00');
      if(!Number.isNaN(value.getTime()))return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(value);
    }
    return d.eventType==='Vigília'?d.yearStart+' → '+d.yearEnd:(d.year||'');
  }
  function eventDisplayName(d){
    return String(d.eventName||'').trim()||((d.eventType&&d.eventType!=='Outro')?d.eventType:'Evento');
  }
  function updateEventHeader(){
    const d={eventType:$('event-type').value,eventName:$('event-name').value,eventDate:$('event-date').value,
      year:$('event-year').value,yearStart:$('year-start').value,yearEnd:$('year-end').value};
    $('hero-organization').textContent=$('organization-name').value.trim()||'IDENTIFICAÇÃO DO EVENTO';
    $('hero-event-name').textContent=eventDisplayName(d);
    $('hero-year').textContent=eventPeriod(d);
  }
  function updateSummary() {
    updateEventHeader();
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
    $('main-area').scrollTo({top:0,behavior:'smooth'});
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
    if(!name){$('event-name').focus();notify('Informe o nome do evento antes de salvar ou exportar.',true);return false;}
    if($('event-type').value==='Vigília' && Number($('year-end').value)<=Number($('year-start').value)){
      $('year-end').focus();notify('O ano final precisa ser maior que o ano inicial.',true);return false;
    }
    return true;
  }
  async function saveRider(){
    if(!validate())return;
    if(artworkData){notify('Remova a imagem anexada para salvar o rider.',true);return;}
    const d=capture(),payload={category:activeModule,title:d.eventName||'Rider técnico',eventYear:d.eventType==='Vigília'?d.yearStart:(d.eventDate?d.eventDate.slice(0,4):d.year),content:{...d,artwork:''}};
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
    const year=d.eventType==='Vigília'?`${d.yearStart} → ${d.yearEnd}`:(d.eventDate?d.eventDate.slice(0,4):d.year);
    let html=section('01','Identificação do evento',`<div class="print-pairs">${d.organizationName?.trim()?printedPair('Organização',d.organizationName):''}${printedPair('Tipo de evento',d.eventType==='Outro'?eventDisplayName(d):d.eventType)}${printedPair('Ano / período',year)}${printedPair('Nome do evento',d.eventName)}${printedPair('Data',d.eventDate?new Date(`${d.eventDate}T12:00:00`).toLocaleDateString('pt-BR'):'Não informada')}${printedPair('Local',d.location)}</div>${d.artwork?`<div class="print-field" style="margin-top:5mm"><small>Arte de identidade visual</small><img class="print-art" src="${d.artwork}" alt="Arte do evento" /></div>`:''}`);
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
    printRoot.innerHTML=`<div class="print-cover"><div><div class="print-over">${escapeHTML((d.organizationName||"").trim()||"IDENTIFICAÇÃO DO EVENTO")}</div><h1>RIDER TÉCNICO</h1><h2>${escapeHTML(description.hero)}</h2><div class="print-line"></div><strong class="print-event-name">${escapeHTML(eventDisplayName(d))}</strong><small>${escapeHTML(eventPeriod(d))}</small></div></div><div class="print-body">${html}<div class="print-bottom"><span>${escapeHTML(description.print)}</span><span>${documentTitle} · ${escapeHTML(eventPeriod(d))}</span></div></div>`;
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
  function finishSessionBoot(){document.body.dataset.authLoading='false';$('session-loading').hidden=true;}
  function setupAccountForms(){
    const parts=['login-title','login-description','login-form','show-register'];
    function showRegister(enabled){
      for(const id of parts)$(id).hidden=enabled;
      $('register-view').hidden=!enabled;
      $('register-form-step').hidden=false;$('register-verification-step').hidden=true;
      $('register-error').textContent='';$('verify-error').textContent='';
      if(enabled)$('account-status').hidden=true;
      if(enabled){$('account-type-personal').checked=true;syncAccountType();}
      registrationVisibility.checked=false;
      $('register-password').type='password';
      $('register-password-confirm').type='password';
    }
    function syncAccountType(){
      const organizational=$('account-type-organization').checked;
      $('register-org-field').hidden=!organizational;
      $('register-org-name').required=organizational;
      if(!organizational)$('register-org-name').value='';
    }
    document.querySelectorAll('input[name="accountType"]').forEach(el=>el.addEventListener('change',syncAccountType));
    syncAccountType();
    const registrationVisibility=$('register-show-password');
    registrationVisibility.addEventListener('change',()=>{
      const visible=registrationVisibility.checked;
      $('register-password').type=visible?'text':'password';
      $('register-password-confirm').type=visible?'text':'password';
    });
    $('show-register').addEventListener('click',()=>showRegister(true));
    $('register-back-login').addEventListener('click',()=>showRegister(false));
    $('verification-back').addEventListener('click',()=>{$('register-form-step').hidden=false;$('register-verification-step').hidden=true;});
    $('register-form').addEventListener('submit',async e=>{
      e.preventDefault();if(!API_READY)return;
      const f=$('register-form');if(!f.reportValidity())return;
      const password=$('register-password').value,passwordConfirm=$('register-password-confirm').value;
      $('register-error').textContent='';
      if(password!==passwordConfirm){$('register-error').textContent='As senhas não coincidem.';return;}
      const email=$('register-email').value.trim().toLowerCase();
      const organizationSelected=$('account-type-organization').checked;
      const organizationValue=organizationSelected?$('register-org-name').value.trim():'';
      const btn=f.querySelector('[type=submit]');btn.disabled=true;
      try{
        await api('/api/auth/register','POST',{fullName:$('register-name').value.trim(),email,phone:$('register-phone').value,password,passwordConfirm});
        signupOrganizationName=organizationValue;
        pendingEmail=email;f.reset();$('register-form-step').hidden=true;$('register-verification-step').hidden=false;
        $('register-verification-code').value='';$('verify-error').textContent='Confira sua caixa de entrada e o spam.';
      }catch(err){$('register-error').textContent=err.message;}finally{btn.disabled=false;}
    });
    $('verify-submit').addEventListener('click',async()=>{
      const code=$('register-verification-code').value.trim();
      if(!/^\d{6}$/.test(code)){$('verify-error').textContent='Informe os seis dígitos do e-mail.';return;}
      const btn=$('verify-submit');btn.disabled=true;
      try{await api('/api/auth/verify','POST',{email:pendingEmail,code});showRegister(false);
        $('login-email').value=pendingEmail;$('account-status').hidden=false;$('account-status').textContent='E-mail confirmado. Entre com sua senha.';$('login-password').focus();
      }catch(err){$('verify-error').textContent=err.message;}finally{btn.disabled=false;}
    });
    $('resend-code').addEventListener('click',async()=>{
      try{await api('/api/auth/resend','POST',{email:pendingEmail});$('verify-error').textContent='Se o cadastro estiver pendente, um novo código será enviado quando permitido.';}
      catch(err){$('verify-error').textContent=err.message;}
    });
    $('login-form').addEventListener('submit',async e=>{
      e.preventDefault();if(!API_READY)return;
      const btn=$('login-form').querySelector('[type=submit]');btn.disabled=true;$('login-error').textContent='';
      try{
        await api('/api/auth/login','POST',{email:$('login-email').value,password:$('login-password').value});
        const session=await api('/api/me');$('login-password').value='';showApp(session.user);
      }catch(err){$('login-error').textContent=err.message;}finally{btn.disabled=false;}
    });
    $('toggle-password').addEventListener('click',()=>{$('login-password').type=$('login-password').type==='password'?'text':'password';});
    $('logout-btn').addEventListener('click',async()=>{
      try{await api('/api/auth/logout','POST',{});}catch{}
      cloudRiders=[];profileUser=null;signupOrganizationName='';closeProfileMenu();$('profile-modal').hidden=true;setProfilePhoto(null);$('app-page').hidden=true;$('auth-page').hidden=false;showRegister(false);$('login-password').value='';
    });
    // A disponibilidade das operações é controlada pela resposta do servidor.
    // Nunca permitir POST real até que o backend confirme authEnabled.
    $('login-email').disabled=false;
    $('login-password').disabled=false;
    $('show-register').disabled=false;
    $('login-form').querySelector('[type=submit]').disabled=true;
    $('register-form').querySelector('[type=submit]').disabled=true;
    fetch('/health',{method:'GET',cache:'no-store',credentials:'same-origin'})
      .then(async response=>{
        if(!response.ok)throw Error('API indisponível');
        return response.json();
      })
      .then(async health=>{
        if(health.authEnabled!==true){API_READY=false;return;}
        API_READY=true;
        $('login-form').querySelector('[type=submit]').disabled=false;
        $('register-form').querySelector('[type=submit]').disabled=health.smtpReady!==true;
        try{const session=await api('/api/me');showApp(session.user);}
        catch{/* Sessão ausente ou expirada: apresentar login normalmente. */}
      })
      .catch(()=>{API_READY=false;})
      .finally(finishSessionBoot);
  }
  function setProfilePhoto(data){
    document.querySelectorAll('.profile-photo').forEach(img=>{img.src=data||'';img.hidden=!data;});
    document.querySelectorAll('.profile-initials').forEach(el=>{el.hidden=!!data;});
  }
  function closeProfileMenu(){
    $('profile-menu').hidden=true;$('profile-trigger').setAttribute('aria-expanded','false');
  }
  function updateProfile(user){
    profileUser=user||null;
    const name=String(user?.name||'').trim(),email=String(user?.email||'');
    const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0].charAt(0).toUpperCase()).join('')||'U';
    document.querySelectorAll('.profile-initials').forEach(el=>{el.textContent=initials;});
    $('profile-sidebar-name').textContent=name||'Meu perfil';
    $('profile-name').textContent=name||'Minha conta';
    $('profile-email').textContent=email;
    $('profile-plan').textContent='Plano '+(user?.plan==='free'?'Free':String(user?.plan||'Free'));
    let photo=null;
    try{if(user?.id)photo=localStorage.getItem('lk.avatar.v1:'+user.id);}catch{}
    setProfilePhoto(photo);
    if(signupOrganizationName&&!activeDraftId)$('organization-name').value=signupOrganizationName;
    updateEventHeader();
  }
  function setupProfile(){
    $('profile-trigger').addEventListener('click',()=>{
      const next=$('profile-menu').hidden;
      $('profile-menu').hidden=!next;
      $('profile-trigger').setAttribute('aria-expanded',String(next));
    });
    $('profile-open').addEventListener('click',()=>{closeProfileMenu();$('profile-modal').hidden=false;$('profile-close').focus();});
    $('profile-close').addEventListener('click',()=>{$('profile-modal').hidden=true;$('profile-trigger').focus();});
    $('profile-modal').addEventListener('click',event=>{if(event.target===$('profile-modal'))$('profile-modal').hidden=true;});
    document.addEventListener('click',event=>{if(!event.target.closest('.sidebar-profile-wrap'))closeProfileMenu();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('profile-modal').hidden=true;closeProfileMenu();}});
    $('profile-photo-input').addEventListener('change',event=>{
      const file=event.target.files?.[0];if(!file)return;
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>200*1024){
        notify('Escolha uma foto JPG, PNG ou WebP até 200 KB.',true);event.target.value='';return;
      }
      const reader=new FileReader();
      reader.onload=()=>{
        const data=String(reader.result||'');if(!data.startsWith('data:image/'))return;
        try{if(profileUser?.id)localStorage.setItem('lk.avatar.v1:'+profileUser.id,data);}
        catch{notify('Não foi possível guardar esta foto neste navegador.',true);}
        setProfilePhoto(data);
      };
      reader.readAsDataURL(file);
    });
  }
  function showApp(user) {updateProfile(user);$('auth-page').hidden=true;$('app-page').hidden=false;refreshRiders().catch(e=>notify(e.message,true));updateSummary();}
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
    setupImage();setupAccountForms();setupProfile();$('copyright-year').textContent=String(new Date().getFullYear());
  }
  setupListeners();
})();
