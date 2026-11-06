/* Buildless research map. Case text is inserted as text, never executable HTML. */
(() => {
  'use strict';
  const data=window.INSPECTIONS, model=window.MaternityModel, $=id=>document.getElementById(id);
  const colors={routine:'#197c79',concern:'#bc503a',followup:'#7456a0',mixed:'#b77a19',unclear:'#697680'};
  const fields=['search','year','group','reason','precision'];
  let visible=data.records,selected=null,streetOn=false;
  const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
  function link(url,text,className) {const a=node('a',text,className);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  const map=L.map('map',{minZoom:5,maxZoom:18,zoomSnap:.25,zoomDelta:.5,zoomControl:true,scrollWheelZoom:true,preferCanvas:false});
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  const country=L.geoJSON(data.boundary,{interactive:false,style:f=>({color:f.properties.CTRY23NM==='England'?'#8ca5a0':'#cad6d1',weight:f.properties.CTRY23NM==='England'?1.3:.8,fillColor:f.properties.CTRY23NM==='England'?'#fafbf5':'#d7e0dc',fillOpacity:1})}).addTo(map);
  map.attributionControl.addAttribution('ONS/OS boundaries © Crown copyright and database right 2023 · OGL v3');
  const england=L.geoJSON(data.boundary.features.find(f=>f.properties.CTRY23NM==='England'));
  const streets=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
  const cities=L.layerGroup();
  [['Newcastle',54.9783,-1.6178],['Leeds',53.8008,-1.5491],['Manchester',53.4808,-2.2426],['Liverpool',53.4084,-2.9916],['Birmingham',52.4862,-1.8904],['Norwich',52.6309,1.2974],['Bristol',51.4545,-2.5879],['London',51.5074,-.1278],['Exeter',50.7184,-3.5339]].forEach(([name,lat,lon])=>L.marker([lat,lon],{interactive:false,keyboard:false,icon:L.divIcon({className:'city-label',html:name,iconSize:[90,12],iconAnchor:[-7,19]})}).addTo(cities));
  cities.addTo(map);
  const cluster=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:31,spiderfyOnMaxZoom:true,animate:false,removeOutsideVisibleBounds:true,iconCreateFunction:c=>L.divIcon({className:'record-cluster',html:String(c.getChildCount()),iconSize:[36,36]})}).addTo(map);
  const markers=new Map();
  function icon(r){return L.divIcon({className:'record-marker',html:`<span class="pin${selected===r.id?' selected':''}${r.date_type==='unconfirmed'?' undated':''}" style="--marker-color:${colors[r.category]}"></span>`,iconSize:[17,17],iconAnchor:[8,8]});}
  for(const r of data.records) {
    const m=L.marker([r.lat,r.lon],{icon:icon(r),title:`${r.hospital} · ${model.visit(r)} · ${r.reason}`,alt:`Inspection: ${r.hospital}`,keyboard:true});
    const tip=node('div');tip.append(node('strong',r.hospital),node('div',model.visit(r)),node('div',r.reason));m.bindTooltip(tip,{direction:'top',offset:[0,-5]}).on('click',()=>selectRecord(r.id,false));markers.set(r.id,m);
  }
  function overview(){map.invalidateSize();map.fitBounds(england.getBounds(),{padding:[25,18],animate:false});}
  $('overview').addEventListener('click',overview);
  $('street').addEventListener('click',()=>{streetOn=!streetOn;$('street').setAttribute('aria-pressed',String(streetOn));if(streetOn){streets.addTo(map);country.remove();cities.remove();}else{streets.remove();country.addTo(map);cities.addTo(map);}});
  function methods(){
    const panel=$('detail');panel.replaceChildren();panel.append(node('p','RESEARCH COLLECTION · UPDATED 6 NOV 2026','eyebrow'),node('h2','The evidence behind each visit'),node('p','Explore 179 inspection records at 166 CQC locations in England. Select a hospital or map point to read its visit dates, inspection reason, uncertainty notes and original source pages.'));
    const stats=node('div',undefined,'stats');for(const[n,label]of[[131,'National programme records'],[48,'Other CQC visit records'],[112,'Single preferred day'],[66,'Reported date periods']]){const el=node('div',undefined,'stat');el.append(node('strong',String(n)),node('span',label));stats.append(el);}panel.append(stats);
    const warning=node('div',undefined,'research-box');warning.append(node('p','One maternity follow-up at Birmingham Heartlands has no confirmed visit date. It remains on the map and in the 2023 filter; publication is never substituted for attendance.'));panel.append(warning);
    panel.append(node('h3','Why were they inspected?'));
    const reasons=node('div',undefined,'reason-summary');for(const[k,label]of Object.entries(model.labels)){const btn=node('button');const dot=node('i',undefined,'dot '+k);btn.append(dot,node('span',label),node('b',String(data.records.filter(r=>r.category===k).length)));btn.addEventListener('click',()=>{$('reason').value=k;refresh();});reasons.append(btn);}panel.append(reasons);
    panel.append(node('h3','What could identify a causal effect?'),node('p','Routine programme visits are possible scheduling candidates. Their timing is not established as random or independent of recent outcomes. Concern-triggered visits, follow-ups and mixed cases respond to risk or earlier findings. Unannounced does not mean randomly assigned.'),node('p','For a paper, obtain scheduling and notification records, validate the eligible comparison cohort and examine pre-trends and trust-level spillovers. Distinguish the total effect of inspection from the effect of clinical quality: public information and hospital choice may affect maternal mental health directly.'));
    panel.append(node('h3','Scope and linkage'),node('p','The CQC programme ran from August 2022 to December 2023 at 131 locations across 92 trusts. Its synthesis was published in September 2024. The 48 other visits are a documented extension, not a certified census of all inspections.'),node('p','HES describes care in English NHS hospitals and NHS-funded treatment centres, including some patients resident elsewhere. This map therefore covers England. CQC location identifiers are not a verified crosswalk to historical ODS treatment-site or provider codes.'),node('p','Points use the recorded hospital postcode and a Postcodes.io coordinate checked on 6 November 2026. They do not locate a specific maternity entrance or validate a historical address. Where reports and site histories disagree, the existing Notes are retained.'));
    const sources=node('div',undefined,'source-links');sources.append(link(data.provenance.programme,'CQC national review ↗'),link(data.provenance.methodology,'CQC programme methodology ↗'),link(data.provenance.hes_scope,'NHS England: HES coverage ↗'),link('records/README_England_maternity_inspections.pdf','Read the existing research README (PDF) ↗'),link('https://github.com/mario-martinez-jimenez/maternity-inspections-england-map','Project on GitHub ↗'));panel.append(sources);
    panel.append(node('p','The reviewed Excel remains the scientific record. The two inspection groups stay separate in its original simple layout. Audit correspondence and legal examples are catalogued in its sources; they are not plotted as inspections.','site-label'));
  }
  function sourceLabel(url,r){if(url===r.report_url)return 'Original CQC inspection report';if(url===r.history_url)return 'CQC location history and dates';if(url.includes('press-release'))return 'CQC release: inspection context';if(url.includes('lancsteaching'))return 'Lancashire NHS Board · 3 Aug 2023';if(url.includes('newcastle-hospitals'))return 'Newcastle NHS Board · 23 May 2024';if(url.includes('democracy.york'))return 'Trust CQC update · 22 Nov 2022';if(url===r.address_source)return 'Hospital address source';if(url.includes('api.cqc.org.uk'))return 'Related CQC report in the source catalogue';if(url.includes('cqc.org.uk/location/'))return 'Related CQC location history · '+new URL(url).pathname.split('/')[2];return 'Additional primary source';}
  function renderRecord(r){
    const panel=$('detail');panel.replaceChildren();panel.append(node('p',r.group==='programme'?'CQC NATIONAL MATERNITY PROGRAMME':'OTHER CQC VISIT','eyebrow'),node('h2',r.hospital),node('p',r.trust,'trust'),node('p',r.address,'address'));
    const same=visible.filter(x=>x.site_id===r.site_id).sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'));
    if(same.length>1){const picker=node('div',undefined,'episode-picker');picker.append(node('h4','Inspection records at this location'));for(const other of same){const b=node('button',model.visit(other),other.id===r.id?'active':'');b.append(node('small',other.group==='programme'?'National programme':other.reason));b.addEventListener('click',()=>selectRecord(other.id,false));picker.append(b);}panel.append(picker);}
    const badge=node('span',undefined,'badge');badge.append(node('i',undefined,'dot '+r.category),node('span',r.reason));panel.append(badge);
    const dates=node('dl',undefined,'dates');const visit=node('div');visit.append(node('dt','Inspection visit'),node('dd',model.visit(r)));visit.lastChild.append(node('small',r.date_type==='day'?'Reported single preferred day; read any source qualifications below.':r.date_type==='period'?'Bounds of a reported period or separate visits; not attendance on every day.':'No confirmed maternity attendance date. Retained in 2023 from the report context.'));const pub=node('div');pub.append(node('dt','Report published'),node('dd',model.date(r.published)));dates.append(visit,pub);panel.append(dates);
    panel.append(node('h4','Inspection reason and research interpretation'),node('p',r.context));
    if(r.date_notes)panel.append(node('h4','Date and address qualifications'),node('p',r.date_notes,'notes'));
    if(r.source_context){const context=node('details',undefined,'provenance');context.append(node('summary','Read the CQC source account'),node('p','Archived CQC location-history text, collected 31 October 2026. This is a source extract, including its original wording; the reviewed date and reason qualifications above take precedence for this dataset.'),node('p',r.source_context),link(r.history_url,'Read the original CQC location history ↗','help-link'));panel.append(context);}
    panel.append(node('h3','Original evidence'),node('p','Saved pages from the source documents. Select an image to enlarge it, or open the original report below. Page numbers refer to PDF pages.'));
    if(r.evidence_gap){const gap=node('div',undefined,'research-box');gap.append(node('p',r.evidence_gap));panel.append(gap);}
    const gallery=node('div',undefined,'evidence-grid');for(const e of r.evidence){const fig=node('figure',undefined,'evidence-card'),button=node('button');const img=node('img');img.src=e.image;img.alt=`${e.label}, PDF page ${e.page}, ${r.hospital}`;img.loading='lazy';img.decoding='async';button.append(img);button.setAttribute('aria-label',`Enlarge ${e.label}, page ${e.page}`);button.addEventListener('click',()=>showImage(e,r));fig.append(button,node('figcaption',`${e.label} · p. ${e.page}`));gallery.append(fig);}panel.append(gallery);
    const sources=node('div',undefined,'source-links');for(const url of r.sources){const a=link(url,sourceLabel(url,r)+' ↗');a.append(node('small',new URL(url).hostname));sources.append(a);}panel.append(sources);
    const provenance=node('details',undefined,'provenance');provenance.append(node('summary','Location and date provenance'),node('p',`CQC location: ${r.site_id}. Excel: ${r.sheet}, row ${r.excel_row}.`),node('p',`Address basis: ${r.address_basis}.`),node('p',`Map location: ${r.coordinate_precision}. Coordinate lookup checked ${model.date(r.coordinate_checked)}.`),link(r.coordinate_source,'Postcode coordinate source ↗','help-link'),node('p',`CQC history heading: ${r.history_dates||'Not recorded'}. PDF cover dates: ${r.cover_dates||'Not recorded'}.`),node('p',`Date interpretation: ${r.date_basis}`),node('p',`Record ID: ${r.id}`));panel.append(provenance);
    const permalink=node('button','Copy this record link','text-button');permalink.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);permalink.textContent='Record link copied';}catch{permalink.textContent='Use the URL in your browser to share this record';}});panel.append(node('p','CQC source pages © Care Quality Commission; reproduced with source attribution. NHS board evidence is linked to its original publisher.','site-label'),permalink);panel.scrollTop=0;
  }
  function selectRecord(id,zoom=true){
    const r=visible.find(x=>x.id===id);if(!r)return;const old=selected;selected=id;if(old)markers.get(old)?.setIcon(icon(data.records.find(x=>x.id===old)));markers.get(id).setIcon(icon(r));renderRecord(r);history.replaceState(null,'','#record='+encodeURIComponent(id));
    for(const b of document.querySelectorAll('.hospital-result'))b.classList.toggle('selected',b.dataset.site===r.site_id);
    if(zoom){map.setView([r.lat,r.lon],Math.max(map.getZoom(),11),{animate:false});cluster.zoomToShowLayer(markers.get(id),()=>markers.get(id).openTooltip());}
    if(window.innerWidth<=860)$('detail').scrollIntoView({block:'start',behavior:'smooth'});
  }
  function showImage(e,r){$('large-image').src=e.image;$('large-image').alt=`${e.label}, page ${e.page}, ${r.hospital}`;$('image-title').textContent=`${r.hospital} · ${e.label} · PDF page ${e.page}`;$('image-source').href=e.url;$('image-dialog').showModal();}
  $('close-image').addEventListener('click',()=>$('image-dialog').close());
  function filters(){return Object.fromEntries(fields.map(k=>[k,$(k).value]));}
  function refresh(){
    visible=data.records.filter(r=>model.matches(r,filters()));cluster.clearLayers();cluster.addLayers(visible.map(r=>markers.get(r.id)));
    const sites=new Map();for(const r of visible){if(!sites.has(r.site_id))sites.set(r.site_id,[]);sites.get(r.site_id).push(r);}
    $('results-count').textContent=`${sites.size} location${sites.size===1?'':'s'} · ${visible.length} record${visible.length===1?'':'s'}`;$('map-count').textContent=`${visible.length} inspection record${visible.length===1?'':'s'}`;$('map-sites').textContent=`${sites.size} CQC location${sites.size===1?'':'s'} in selection`;
    const results=$('results');results.replaceChildren();for(const rows of [...sites.values()].sort((a,b)=>a[0].hospital.localeCompare(b[0].hospital))){const r=rows[0],b=node('button',undefined,'hospital-result');b.dataset.site=r.site_id;b.append(node('strong',r.hospital));const sub=node('span',undefined,'result-meta');sub.append(node('i',undefined,'dot '+(rows.length===1?r.category:'unclear')),node('span',`${r.postcode} · ${rows.length} record${rows.length===1?'':'s'}`));b.append(sub);b.addEventListener('click',()=>selectRecord(r.id));results.append(b);}
    if(!visible.length){results.append(node('p','No matching records. Try fewer filters or a different hospital, trust or postcode.','empty'));selected=null;methods();}
    else if(selected&&!visible.some(r=>r.id===selected)){selected=null;history.replaceState(null,'',location.pathname+location.search);methods();}
    else if(selected)renderRecord(visible.find(r=>r.id===selected));
  }
  fields.forEach(k=>$(k).addEventListener(k==='search'?'input':'change',refresh));
  $('clear').addEventListener('click',()=>{fields.forEach(k=>$(k).value=k==='search'?'':'all');selected=null;history.replaceState(null,'',location.pathname+location.search);refresh();methods();overview();});
  $('methods').addEventListener('click',()=>{methods();if(window.innerWidth<=860)$('detail').scrollIntoView({block:'start',behavior:'smooth'});});
  $('csv').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([model.csv(visible)],{type:'text/csv;charset=utf-8'}));const a=node('a');a.href=url;a.download='England_maternity_inspections_selection.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  refresh();overview();methods();const hash=new URLSearchParams(location.hash.slice(1)).get('record');if(hash)selectRecord(hash,true);
  new ResizeObserver(()=>map.invalidateSize({pan:false})).observe($('map'));
  // Expose only read-only summaries for reproducible browser checks.
  window.mapStatus=()=>({records:visible.length,sites:new Set(visible.map(r=>r.site_id)).size,selected,streetOn});
})();
