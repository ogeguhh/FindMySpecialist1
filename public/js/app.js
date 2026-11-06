// Frontend uses ordinary JavaScript functions, not classes.
const $=id=>document.getElementById(id);
const api=async(url,options={})=>{const res=await fetch(url,{headers:{'Content-Type':'application/json'},...options});const data=await res.json();if(!res.ok)throw Error(data.message||'Request failed');return data;};
const post=(url,body)=>api(url,{method:'POST',body:JSON.stringify(body)});
const message=(text,type='')=>{if($('message')){$('message').textContent=text;$('message').className='notice '+type;}};
const store=(key,val)=>sessionStorage.setItem(key,JSON.stringify(val));
const load=(key,fallback)=>{try{return JSON.parse(sessionStorage.getItem(key))??fallback;}catch{return fallback;}};
const go=path=>location.href=path;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const formatInsurance=(insurance={})=>Object.entries(insurance).map(([provider,plans])=>`${provider}: ${Array.isArray(plans)?plans.join(', '):plans}`).join(' • ')||'No demonstration insurance listed';
const intakeState=()=>load('intake',{});
const saveIntake=(patch={})=>{const next={...intakeState(),...patch};store('intake',next);return next;};

if($('guest'))$('guest').onclick=async()=>{try{await post('/api/auth/guest',{});sessionStorage.clear();go('/intake.html');}catch(e){message(e.message,'error');}};
if($('loginForm'))$('loginForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await post('/api/auth/login',Object.fromEntries(f));sessionStorage.clear();go('/intake.html');}catch(err){message(err.message,'error');}};
if($('signupForm'))$('signupForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const r=await post('/api/auth/register',Object.fromEntries(f));message(r.message);setTimeout(()=>go('/login.html'),1200);}catch(err){message(err.message,'error');}};

if($('intakeForm')){
  const selected=Array.isArray(intakeState().symptoms)?[...new Set(intakeState().symptoms)]:[];
  const syncForm=()=>{const state=intakeState();if(state.zip)$('zip').value=state.zip;if(state.age)$('age').value=state.age;if(state.insuranceProvider)$('insuranceProvider').value=state.insuranceProvider;if(state.insurancePlan)$('insurancePlan').value=state.insurancePlan;};
  const setSelectedCount=()=>{$('selectedCount').textContent=`${selected.length} of 3 selected`;};
  const fillPlans=(provider)=>{const items=(catalog[provider]||[]);$('insurancePlan').innerHTML='<option value="">Any plan</option>'+items.map(plan=>`<option value="${escapeHtml(plan)}">${escapeHtml(plan)}</option>`).join('');const saved=intakeState().insurancePlan;if(saved&&items.includes(saved))$('insurancePlan').value=saved;};
  let catalog={};
  const renderSymptoms=async()=>{const q=$('symptomSearch')?.value||'';const data=await api('/api/symptoms?q='+encodeURIComponent(q));$('symptomChoices').innerHTML=(data.symptoms||[]).map(s=>`<label><input type="checkbox" value="${escapeHtml(s)}" ${selected.includes(s)?'checked':''}>${escapeHtml(s)}</label>`).join('')||'<p>No supported symptoms found.</p>';$('symptomChoices').querySelectorAll('input').forEach(input=>input.onchange=()=>{if(input.checked&&selected.length>=3){input.checked=false;message('You can select a maximum of 3 symptoms.','error');return;}const value=input.value;const next=input.checked?[...selected,value]:selected.filter(s=>s!==value);selected.splice(0,selected.length,...new Set(next));saveIntake({symptoms:[...selected]});setSelectedCount();});setSelectedCount();};
  const loadCatalog=async()=>{catalog=(await api('/api/catalog')).insuranceCatalog;const providers=Object.keys(catalog);$('insuranceProvider').innerHTML='<option value="">Any insurance</option>'+providers.map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
    const savedProvider=intakeState().insuranceProvider||'';if(savedProvider&&catalog[savedProvider]){$('insuranceProvider').value=savedProvider;}fillPlans($('insuranceProvider').value||savedProvider||'');};
  $('insuranceProvider').onchange=()=>fillPlans($('insuranceProvider').value);
  $('symptomSearch').oninput=renderSymptoms;
  syncForm();
  loadCatalog().catch(e=>message(e.message,'error'));
  renderSymptoms().catch(e=>message(e.message,'error'));
  $('intakeForm').onsubmit=async e=>{e.preventDefault();const form=new FormData(e.target);const payload={zip:String(form.get('zip')||'').trim(),age:String(form.get('age')||'').trim(),insuranceProvider:String(form.get('insuranceProvider')||'').trim(),insurancePlan:String(form.get('insurancePlan')||'').trim(),symptoms:[...selected]};try{const r=await post('/api/intake/symptoms',payload);if(r.status==='Urgent'){message(r.message,'urgent');return;}saveIntake(payload);store('specialties',[]);go('/match.html');}catch(e){message(e.message,'error');}};
}

if($('matchPage')){
  const root=$('matches');
  const render=async()=>{const symptoms=Array.isArray(intakeState().symptoms)?intakeState().symptoms:[];const summary=$('matchSummary');if(!symptoms.length){summary.textContent='Complete your intake to see specialist matches.';root.innerHTML='<p>Please complete the intake form first.</p>';return;}
    try{const result=await post('/api/match',{symptoms});if(result.status==='Urgent'){summary.textContent='Urgent warning sign';root.innerHTML=`<p class="notice urgent">${escapeHtml(result.message)}</p>`;return;}const specialties=Array.isArray(result.specialties)?result.specialties:[];saveIntake({symptoms,specialties});store('specialties',specialties);summary.textContent=`Matched ${specialties.length} distinct specialty${specialties.length===1?'':'ies'}.`;
      if(!specialties.length){root.innerHTML='<p>No supported specialty match was found for the chosen symptoms.</p>';return;}
      root.innerHTML='<p><strong>Matched specialties:</strong> '+specialties.map(s=>escapeHtml(s)).join(', ')+'</p>';
    }catch(e){message(e.message,'error');}};
  $('backToIntake').onclick=()=>go('/intake.html');
  $('findSpecialistsBtn').onclick=()=>{const specialties=Array.isArray(load('specialties',[]))?load('specialties',[]):[];if(!specialties.length){message('No specialty match was found. Please review the intake questions and try again.','error');return;}go('/specialists.html');};
  render().catch(e=>message(e.message,'error'));
}

if($('specialistsPage')){
  let catalog={};
  const fillOptions=(select,items,placeholder='')=>{select.innerHTML='<option value="">'+placeholder+'</option>'+items.map(item=>`<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');};
  const updatePlans=()=>{const provider=$('insuranceProvider').value;const items=catalog[provider]||[];fillOptions($('insurancePlan'),items,'Any plan');const saved=intakeState().insurancePlan||'';if(saved&&items.includes(saved))$('insurancePlan').value=saved;};
  const getSearchFilters=()=>({zip:$('zip').value.trim(),insuranceProvider:$('insuranceProvider').value.trim(),insurancePlan:$('insurancePlan').value.trim(),maxDistance:$('maxDistance').value.trim()});
  const renderResults=(results=[],disclaimer='')=>{const root=$('results');root.replaceChildren();const note=document.createElement('p');note.textContent=disclaimer;root.append(note);if(!results.length){const empty=document.createElement('p');empty.textContent='No providers match the selected specialty and filters. Please adjust the distance or insurance filters.';root.append(empty);return;}results.forEach(provider=>{const card=document.createElement('div');card.className='provider';const title=document.createElement('strong');title.textContent=provider.name;const line=document.createElement('p');line.textContent=`${provider.specialty} • ${provider.clinic} • ${provider.location} ${provider.zip?`(${provider.zip})`:''}`;const distance=document.createElement('p');distance.textContent=`Demo distance: ${provider.distanceMiles} miles`;const insurance=document.createElement('p');insurance.textContent=formatInsurance(provider.insurance);const actions=document.createElement('p');const link=document.createElement('a');link.href=`/details.html?id=${encodeURIComponent(provider.id)}`;link.textContent='View Details';actions.append(link);card.append(title,line,distance,insurance,actions);root.append(card);});};
  const search=async()=>{const specialties=Array.isArray(load('specialties',[]))?load('specialties',[]):[];const filters=getSearchFilters();const params=new URLSearchParams();if(specialties.length>1){params.set('specialties',specialties.join(','));}else if(specialties.length===1){params.set('specialty',specialties[0]);}for(const [key,value]of Object.entries(filters)){if(value)params.set(key,value);}try{const r=await api('/api/providers?'+params.toString());const resultList=Array.isArray(r.results)?r.results:[];store('filters',filters);renderResults(resultList,r.disclaimer||'');}catch(e){message(e.message,'error');}};
  (async()=>{try{catalog=(await api('/api/catalog')).insuranceCatalog;fillOptions($('insuranceProvider'),Object.keys(catalog),'Any insurance');const state=intakeState();const savedFilters=load('filters',{});const savedProvider=state.insuranceProvider||savedFilters.insuranceProvider||'';const savedPlan=state.insurancePlan||savedFilters.insurancePlan||'';const savedZip=state.zip||savedFilters.zip||'';const savedDistance=savedFilters.maxDistance||'';const savedInsurance=savedFilters.insuranceProvider||'';if(savedZip)$('zip').value=savedZip;if(savedInsurance&&catalog[savedInsurance])$('insuranceProvider').value=savedInsurance;updatePlans();if(savedPlan&&$('insurancePlan').options.length){$('insurancePlan').value=savedPlan;}if(savedDistance)$('maxDistance').value=savedDistance;const storedSpecialties=Array.isArray(load('specialties',[]))?load('specialties',[]):[];if(!storedSpecialties.length){const fromState=Array.isArray(state.specialties)?state.specialties:[];store('specialties',fromState);}search().catch(e=>message(e.message,'error'));}catch(e){message(e.message,'error');}})();
  $('searchForm').onsubmit=e=>{e.preventDefault();search().catch(e=>message(e.message,'error'));};
  $('insuranceProvider').onchange=updatePlans;
  $('clearFilters').onclick=()=>{sessionStorage.removeItem('filters');$('searchForm').reset();updatePlans();search().catch(e=>message(e.message,'error'));};
  $('savePrefs').onclick=async()=>{try{const {zip,insuranceProvider,insurancePlan}=getSearchFilters();await post('/api/auth/preferences',{zip,insuranceProvider,insurancePlan});message('Preferences saved.');}catch(e){message(e.message,'error');}};
}

if($('providerDetails')){
  (async()=>{try{const id=new URLSearchParams(location.search).get('id');if(!id){message('Choose a provider from Find Specialists.');return;}const {provider, message: msg}=await api('/api/providers/'+encodeURIComponent(id));const root=$('providerDetails');const lines=[['Name',provider.name],['Specialty',provider.specialty],['Clinic',provider.clinic],['Location',provider.location],['Insurance',formatInsurance(provider.insurance||{})],['Details',provider.detailsStatus||'Partial']];lines.forEach(([label,value])=>{const p=document.createElement('p');p.textContent=`${label}: ${value || 'Not provided'}`;root.append(p);});if(provider.bookingUrl){const link=document.createElement('a');link.href=provider.bookingUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Book Appointment (external website)';root.append(link);}else{const note=document.createElement('p');note.textContent=msg||'Online booking is unavailable for this provider.';root.append(note);}}catch(e){message(e.message,'error');}})();
}
