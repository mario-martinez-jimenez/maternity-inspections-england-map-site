/* Buildless research map. Case text is inserted as text, never executable HTML. */
(() => {
  'use strict';
  const data=window.INSPECTIONS, model=window.MaternityModel, $=id=>document.getElementById(id);
  const colors={routine:'#197c79',concern:'#bc503a',followup:'#7456a0',mixed:'#b77a19',unclear:'#697680'};
  const fields=['search','year','group','reason','precision','month'];
  let visible=data.records,selected=null,streetOn=false;
  const clinical=window.MATERNITY_CLINICAL;
  let activityYear='2022-23';
  const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
  const monthLabel=key=>new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(key+'-01T00:00:00Z'));
  for(const m of model.timeline([]).months){const option=node('option',monthLabel(m.key));option.value=m.key;$('month').append(option);}const undatedOption=node('option','Month unconfirmed');undatedOption.value='undated';$('month').append(undatedOption);
  function link(url,text,className) {const a=node('a',text,className);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  const map=L.map('map',{minZoom:4.5,maxZoom:18,zoomSnap:.25,zoomDelta:.5,zoomControl:true,scrollWheelZoom:true,preferCanvas:false});
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  const country=L.geoJSON(data.boundary,{interactive:false,style:f=>({color:f.properties.CTRY23NM==='England'?'#8ca5a0':'#cad6d1',weight:f.properties.CTRY23NM==='England'?1.3:.8,fillColor:f.properties.CTRY23NM==='England'?'#fafbf5':'#d7e0dc',fillOpacity:1})}).addTo(map);
  map.attributionControl.addAttribution('ONS/OS boundaries © Crown copyright and database right 2023 · OGL v3');
  const england=L.geoJSON(data.boundary.features.find(f=>f.properties.CTRY23NM==='England'));
  const streets=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
  const cities=L.layerGroup();
  [['Newcastle',54.9783,-1.6178],['Leeds',53.8008,-1.5491],['Manchester',53.4808,-2.2426],['Liverpool',53.4084,-2.9916],['Birmingham',52.4862,-1.8904],['Norwich',52.6309,1.2974],['Bristol',51.4545,-2.5879],['London',51.5074,-.1278],['Exeter',50.7184,-3.5339]].forEach(([name,lat,lon])=>L.marker([lat,lon],{interactive:false,keyboard:false,icon:L.divIcon({className:'city-label',html:name,iconSize:[90,12],iconAnchor:[-7,19]})}).addTo(cities));
  cities.addTo(map);
  const cluster=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:31,spiderfyOnMaxZoom:true,animate:false,removeOutsideVisibleBounds:true,iconCreateFunction:c=>L.divIcon({className:'record-cluster',html:String(c.getChildCount()),iconSize:[36,36]})}).addTo(map);
  const selectedLocation=L.circleMarker([0,0],{radius:22,color:'#172e3b',weight:2,fill:false,interactive:false});
  const markers=new Map();
  function icon(r){return L.divIcon({className:'record-marker',html:`<span class="pin${selected===r.id?' selected':''}${r.date_type==='unconfirmed'?' undated':''}" style="--marker-color:${colors[r.category]}"></span>`,iconSize:[17,17],iconAnchor:[8,8]});}
  for(const r of data.records) {
    const m=L.marker([r.lat,r.lon],{icon:icon(r),title:`${r.hospital} · ${model.visit(r)} · ${r.reason}`,alt:`Inspection: ${r.hospital}`,keyboard:true});
    const tip=node('div');tip.append(node('strong',r.hospital),node('div',model.visit(r)),node('div',r.reason));m.bindTooltip(tip,{direction:'top',offset:[0,-5]}).on('click',()=>selectRecord(r.id,false));markers.set(r.id,m);
  }
  function clearSelection(){const old=data.records.find(r=>r.id===selected);selected=null;if(old)markers.get(old.id).setIcon(icon(old));selectedLocation.remove();}
  function overview(){map.invalidateSize();map.fitBounds(england.getBounds(),{padding:[25,18],animate:false});}
  $('overview').addEventListener('click',overview);
  $('street').addEventListener('click',()=>{streetOn=!streetOn;$('street').setAttribute('aria-pressed',String(streetOn));if(streetOn){streets.addTo(map);country.remove();cities.remove();}else{streets.remove();country.addTo(map);cities.addTo(map);}});
  function methods(){
    const panel=$('detail');panel.replaceChildren();panel.append(node('p','RESEARCH COLLECTION · UPDATED 6 NOV 2026','eyebrow'),node('h2','The evidence behind each visit'),node('p','Explore 179 inspection records at 166 CQC locations in England. Select a hospital or map point to read its visit dates, inspection reason, uncertainty notes and original source pages.'));
    const stats=node('div',undefined,'stats');for(const[n,label]of[[131,'National programme records'],[48,'Other CQC visit records'],[112,'Single preferred day'],[66,'Reported date periods']]){const el=node('div',undefined,'stat');el.append(node('strong',String(n)),node('span',label));stats.append(el);}panel.append(stats);
    const warning=node('div',undefined,'research-box');warning.append(node('p','One maternity follow-up at Birmingham Heartlands has no confirmed visit date. It remains on the map and in the 2023 filter; publication is never substituted for attendance.'));panel.append(warning);
    panel.append(node('h3','Why were they inspected?'));
    const reasons=node('div',undefined,'reason-summary');for(const[k,label]of Object.entries(model.labels)){const btn=node('button');const dot=node('i',undefined,'dot '+k);btn.append(dot,node('span',label),node('b',String(data.records.filter(r=>r.category===k).length)));btn.addEventListener('click',()=>{$('reason').value=k;refresh();});reasons.append(btn);}panel.append(reasons);
    panel.append(node('h3','Reading the monthly timeline'),node('p','Each inspection record is counted once in its first reported month (Inspection from). A cross-month period is not counted again in later months. Select a month to filter the map, list and CSV export; other filters update the timeline counts. Records without a confirmed month remain in their own selectable bucket.'),node('p','Hatching marks reported periods and single days with existing source qualifications. These are date flags, not a claim that the month is always uncertain. Address-only warnings are excluded. Colours retain the five documented inspection reasons; concern-triggered visits and follow-ups stay separate.'));
    panel.append(node('h3','Maternity ratings and activity'),node('p','Select an inspection to see historical CQC maternity ratings for that report and annual NHS maternity activity. The CQC figures concern the maternity service; the annual HES figures concern the named trust/provider, not the individual hospital. Activity years, publication dates, missingness, denominators and organisation changes are shown separately. Annual unadjusted caesarean and induction rates are contextual care-practice measures, not a quality ranking or inspection-effect estimate.'));
    panel.append(node('h3','What could identify a causal effect?'),node('p','Routine programme visits are possible scheduling candidates. Their timing is not established as random or independent of recent outcomes. Concern-triggered visits, follow-ups and mixed cases respond to risk or earlier findings. Unannounced does not mean randomly assigned.'),node('p','For a paper, obtain scheduling and notification records, validate the eligible comparison cohort and examine pre-trends and trust-level spillovers. Distinguish the total effect of inspection from the effect of clinical quality: public information and hospital choice may affect maternal mental health directly.'));
    panel.append(node('h3','Scope and linkage'),node('p','The CQC programme ran from August 2022 to December 2023 at 131 locations across 92 trusts. Its synthesis was published in September 2024. The 48 other visits are a documented extension, not a certified census of all inspections.'),node('p','HES describes care in English NHS hospitals and NHS-funded treatment centres, including some patients resident elsewhere. This map therefore covers England. CQC location identifiers are not a verified crosswalk to historical ODS treatment-site or provider codes.'),node('p','Points use the recorded hospital postcode and a Postcodes.io coordinate checked on 6 November 2026. They do not locate a specific maternity entrance or validate a historical address. Where reports and site histories disagree, the existing Notes are retained.'));
    const sources=node('div',undefined,'source-links');sources.append(link(data.provenance.programme,'CQC national review ↗'),link(data.provenance.methodology,'CQC programme methodology ↗'),link(data.provenance.hes_scope,'NHS England: HES coverage ↗'),link('records/README_England_maternity_inspections.pdf','Read the existing research README (PDF) ↗'),link('https://github.com/mario-martinez-jimenez/maternity-inspections-england-map-site','Project on GitHub ↗'));panel.append(sources);
    panel.append(node('p','The reviewed Excel remains the scientific record. The two inspection groups stay separate in its original simple layout. Audit correspondence and legal examples are catalogued in its sources; they are not plotted as inspections.','site-label'));
  }
  function sourceLabel(url,r){if(url===r.report_url)return 'Original CQC inspection report';if(url===r.history_url)return 'CQC location history and dates';if(url.includes('press-release'))return 'CQC release: inspection context';if(url.includes('lancsteaching'))return 'Lancashire NHS Board · 3 Aug 2023';if(url.includes('newcastle-hospitals'))return 'Newcastle NHS Board · 23 May 2024';if(url.includes('democracy.york'))return 'Trust CQC update · 22 Nov 2022';if(url===r.address_source)return 'Hospital address source';if(url.includes('api.cqc.org.uk'))return 'Related CQC report in the source catalogue';if(url.includes('cqc.org.uk/location/'))return 'Related CQC location history · '+new URL(url).pathname.split('/')[2];return 'Additional primary source';}
  function ratingSection(r){
    const section=node('section',undefined,'clinical-section'),c=clinical.ratings[r.id];section.append(node('h3','CQC maternity ratings'),node('p','Historical ratings reported for this inspection, including retained ratings.','clinical-caption'));
    const grid=node('div',undefined,'rating-grid');for(const[key,label]of [['overall','Overall maternity'],['safe','Safe'],['well_led','Well-led']]){
      const value=c?.values[key],card=node('div',undefined,'rating-card');card.dataset.rating=(value||'unverified').toLowerCase().replaceAll(' ','-');card.append(node('span',label));
      if(value){const url=c.source_url+(c.pages[key]?'#page='+c.pages[key]:'');const a=link(url,value==='Inspected but not rated'?'Inspected, not rated':value);a.title=c.pages[key]?`Original CQC maternity rating, PDF page ${c.pages[key]}`:'Archived CQC maternity ratings, published 20 September 2023';card.append(a);}else card.append(node('strong','Not separately verified'));
      grid.append(card);
    }section.append(grid);if(c?.status_note)section.append(node('p',c.status_note,'clinical-caption'));
    const provenance=node('details',undefined,'clinical-provenance');provenance.append(node('summary','Rating sources and qualifications'),node('p',c?.note||'No verified maternity rating is available for this record.'));
    if(c){provenance.append(link(c.source_url,c.source_kind==='report'?'Original CQC report ↗':'CQC published ratings snapshot ↗','help-link'));for(const[k,label]of [['overall','Overall maternity'],['safe','Safe'],['well_led','Well-led']])if(c.pages[k])provenance.append(node('p',`${label}: PDF page ${c.pages[k]}.`));}
    section.append(provenance);return section;
  }
  function activitySection(r){
    const section=node('section',undefined,'clinical-section activity-section'),heading=node('div',undefined,'activity-heading');heading.append(node('h3','Maternity activity'));
    const control=node('div'),label=node('label','Financial year');label.htmlFor='activity-year';const select=node('select');select.id='activity-year';for(const year of Object.keys(clinical.sources)){const option=node('option',year);option.value=year;select.append(option);}select.value=activityYear;control.append(label,select);heading.append(control);section.append(heading);
    const body=node('div');section.append(body);
    function draw(){
      const source=clinical.sources[activityYear],match=clinical.links[r.id]?.[activityYear],provider=match?.provider_key?clinical.providers[activityYear][match.provider_key]:null;body.replaceChildren();
      body.append(node('p','Trust/provider-wide context — not a rate for this hospital or birth centre.','activity-scope'),node('p',`${model.date(source.start)} – ${model.date(source.end)}. Published ${model.date(source.published)}.`,'clinical-caption'),node('p',model.activityTiming(r,source),'clinical-caption'));
      if(!provider){body.append(node('p','No checked provider row is available for this source year. No hospital rate or zero is inferred.','date-warning'),link(source.landing_url,'NHS source and data-quality information ↗','help-link'));return;}
      body.append(node('p',`${provider.name} (${provider.code})`,'activity-provider'));
      body.append(node('p',`Delivery-method rates use ${Number.isFinite(provider.values.method_known)?provider.values.method_known.toLocaleString('en-GB'):'unavailable'} known episodes. Induction uses ${Number.isFinite(provider.values.onset_known)?provider.values.onset_known.toLocaleString('en-GB'):'unavailable'} known labour onsets.`,'clinical-caption'));
      const metrics=model.activityMetrics(provider),table=node('table',undefined,'activity-table'),thead=node('thead'),header=node('tr');header.append(node('th','Measure'),node('th','Trust/provider'));thead.append(header);table.append(thead);const tbody=node('tbody');
      for(const metric of metrics){const tr=node('tr');tr.dataset.metric=metric.key;const name=node('th',metric.label);name.scope='row';name.title=metric.detail;let value=Number.isFinite(metric.value)?metric.unit==='count'?Math.round(metric.value).toLocaleString('en-GB'):(metric.value*100).toFixed(1)+'%':metric.suppressed?'Suppressed':'Not available';const cell=node('td',value);if(!Number.isFinite(metric.value))cell.className='metric-unavailable';tr.append(name,cell);tbody.append(tr);}table.append(tbody);body.append(table);
      body.append(node('p','Delivery-method and induction rates exclude unknowns; unknown shares use all recorded deliveries. Counts are rounded; derived rates are approximate. These figures are unadjusted for case mix and are not a quality ranking.','clinical-caption'));
      if(provider.values.method_known>0&&provider.values.method_known<400)body.append(node('p','Small recorded denominator. Reporting completeness and provider coverage may affect this figure; check the source before comparison.','date-warning'));
      for(const note of match.notes)body.append(node('p',note,'date-warning'));
      const details=node('details',undefined,'clinical-provenance');details.append(node('summary','Definitions, matching and source cells'),node('p',match.basis),node('p',clinical.definitions.delivery_rates),node('p',clinical.definitions.induction),node('p',clinical.definitions.rounding));
      for(const metric of metrics){const sheet=metric.table==='delivery'?provider.delivery_sheet:provider.onset_sheet,row=metric.table==='delivery'?provider.delivery_row:provider.onset_row;details.append(node('p',`${metric.label}: ${sheet}, row ${row}, ${metric.source}. ${metric.detail}`));}
      const links=node('div',undefined,'source-links');links.append(link(source.table_url,'NHS provider tables (Excel) ↗'),link(source.metadata_url,'NHS measure definitions (Excel) ↗'),link(source.quality_url,'NHS HES data-quality statement ↗'));for(const url of match.sources)links.append(link(url,'NHS organisation-history evidence ↗'));details.append(links);body.append(details,link(source.landing_url,'NHS Maternity Statistics '+activityYear+' ↗','help-link'));
    }
    select.addEventListener('change',()=>{activityYear=select.value;draw();});draw();return section;
  }
  function renderRecord(r){
    const panel=$('detail');panel.replaceChildren();panel.append(node('p',r.group==='programme'?'CQC NATIONAL MATERNITY PROGRAMME':'OTHER CQC VISIT','eyebrow'),node('h2',r.hospital),node('p',r.trust,'trust'),node('p',r.address,'address'));
    const same=visible.filter(x=>x.site_id===r.site_id).sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'));
    if(same.length>1){const picker=node('div',undefined,'episode-picker');picker.append(node('h4','Inspection records at this location'));for(const other of same){const b=node('button',model.visit(other),other.id===r.id?'active':'');b.append(node('small',other.group==='programme'?'National programme':other.reason));b.addEventListener('click',()=>selectRecord(other.id,false));picker.append(b);}panel.append(picker);}
    const badge=node('span',undefined,'badge');badge.append(node('i',undefined,'dot '+r.category),node('span',r.reason));panel.append(badge);
    panel.append(ratingSection(r));
    const dates=node('dl',undefined,'dates');const visit=node('div');visit.append(node('dt','Inspection visit'),node('dd',model.visit(r)));visit.lastChild.append(node('small',r.date_type==='day'?'Reported single preferred day; read any source qualifications below.':r.date_type==='period'?'Bounds of a reported period or separate visits; not attendance on every day.':'No confirmed maternity attendance date. Retained in 2023 from the report context.'));const pub=node('div');pub.append(node('dt','Report published'),node('dd',model.date(r.published)));dates.append(visit,pub);panel.append(dates);
    const dateStatus=model.dateFlag(r);if(dateStatus.flagged)panel.append(node('p','⚑ '+dateStatus.label+' — read the qualifications below.','date-warning'));
    panel.append(node('h4','Inspection reason and research interpretation'),node('p',r.context));
    if(r.date_notes)panel.append(node('h4','Date and address qualifications'),node('p',r.date_notes,'notes'));
    if(r.source_context){const context=node('details',undefined,'provenance');context.append(node('summary','Read the CQC source account'),node('p','Archived CQC location-history text, collected 31 October 2026. This is a source extract, including its original wording; the reviewed date and reason qualifications above take precedence for this dataset.'),node('p',r.source_context),link(r.history_url,'Read the original CQC location history ↗','help-link'));panel.append(context);}
    panel.append(activitySection(r));
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
    // Highlight the selected location without leaving asynchronous cluster callbacks
    // attached to markers that may disappear on the next filter/search change.
    if(zoom)map.setView([r.lat,r.lon],Math.max(map.getZoom(),13),{animate:false});
    selectedLocation.setLatLng([r.lat,r.lon]).addTo(map);if(markers.get(id).getElement())markers.get(id).openTooltip();
    if(window.innerWidth<=860)$('detail').scrollIntoView({block:'start',behavior:'smooth'});
  }
  function showImage(e,r){$('large-image').src=e.image;$('large-image').alt=`${e.label}, page ${e.page}, ${r.hospital}`;$('image-title').textContent=`${r.hospital} · ${e.label} · PDF page ${e.page}`;$('image-source').href=e.url;$('image-dialog').showModal();}
  $('close-image').addEventListener('click',()=>$('image-dialog').close());
  function filters(){return Object.fromEntries(fields.map(k=>[k,$(k).value]));}
  function renderTimeline(rows){
    const focusedMonth=document.activeElement?.dataset.month;
    const t=model.timeline(rows),max=Math.max(1,...t.months.map(m=>m.total)),bars=$('month-bars');bars.replaceChildren();
    $('timeline-summary').textContent=`${rows.length-t.undated} dated records · ${t.undated} month unconfirmed`;
    for(const m of t.months){
      const button=node('button',undefined,'month-button');button.type='button';button.dataset.month=m.key;button.setAttribute('aria-pressed',String($('month').value===m.key));button.disabled=m.total===0&&$('month').value!==m.key;
      const description=`${monthLabel(m.key)}: ${m.total} inspection records. `+Object.entries(m.counts).map(([k,c])=>`${model.labels[k]} ${c.total}`).join('; ')+`. ${m.flagged} date flags; ${m.crossMonth} cross-month periods. Counted by first reported month.`;
      button.setAttribute('aria-label',description);button.title=description;button.append(node('span',String(m.total),'month-count'));
      const stack=node('span',undefined,'month-stack');stack.setAttribute('aria-hidden','true');for(const[k,c]of Object.entries(m.counts)){if(!c.total)continue;const segment=node('span',undefined,'timeline-segment '+k);segment.style.height=`${c.total/max*60}px`;if(c.flagged){const hatch=node('span',undefined,'flagged-fill');hatch.style.height=`${c.flagged/c.total*100}%`;segment.append(hatch);}stack.append(segment);}button.append(stack,node('span',monthLabel(m.key).slice(0,3),'month-label'));
      button.addEventListener('click',()=>{$('month').value=$('month').value===m.key?'all':m.key;refresh();overview();});bars.append(button);
    }
    $('undated').textContent=`Month unconfirmed · ${t.undated}`;$('undated').setAttribute('aria-pressed',String($('month').value==='undated'));$('undated').disabled=t.undated===0&&$('month').value!=='undated';
    if(focusedMonth)bars.querySelector(`[data-month="${focusedMonth}"]`)?.focus({preventScroll:true});
  }
  $('undated').addEventListener('click',()=>{$('month').value=$('month').value==='undated'?'all':'undated';refresh();overview();});
  function refresh(){
    renderTimeline(data.records.filter(r=>model.matches(r,{...filters(),month:'all'})));
    visible=data.records.filter(r=>model.matches(r,filters()));cluster.clearLayers();cluster.addLayers(visible.map(r=>markers.get(r.id)));
    const sites=new Map();for(const r of visible){if(!sites.has(r.site_id))sites.set(r.site_id,[]);sites.get(r.site_id).push(r);}
    $('results-count').textContent=`${sites.size} location${sites.size===1?'':'s'} · ${visible.length} record${visible.length===1?'':'s'}`;$('map-count').textContent=`${visible.length} inspection record${visible.length===1?'':'s'}`;$('map-sites').textContent=`${sites.size} CQC location${sites.size===1?'':'s'} in selection`;
    const results=$('results');results.replaceChildren();for(const rows of [...sites.values()].sort((a,b)=>a[0].hospital.localeCompare(b[0].hospital))){const r=rows[0],b=node('button',undefined,'hospital-result');b.dataset.site=r.site_id;b.append(node('strong',r.hospital));const sub=node('span',undefined,'result-meta');sub.append(node('i',undefined,'dot '+(rows.length===1?r.category:'unclear')),node('span',`${r.postcode} · ${rows.length} record${rows.length===1?'':'s'}`));b.append(sub);const flagged=rows.filter(x=>model.dateFlag(x).flagged);if(flagged.length)b.append(node('span','⚑ '+(rows.length===1?model.dateFlag(r).label:`${flagged.length} record${flagged.length===1?'':'s'} with date flags`),'result-date-flag'));b.addEventListener('click',()=>selectRecord(r.id));results.append(b);}
    if(!visible.length){results.append(node('p','No matching records. Try fewer filters or a different hospital, trust or postcode.','empty'));clearSelection();methods();}
    else if(selected&&!visible.some(r=>r.id===selected)){clearSelection();history.replaceState(null,'',location.pathname+location.search);methods();}
    else if(selected)renderRecord(visible.find(r=>r.id===selected));
  }
  fields.forEach(k=>$(k).addEventListener(k==='search'?'input':'change',()=>{refresh();if(k==='month')overview();}));
  $('clear').addEventListener('click',()=>{fields.forEach(k=>$(k).value=k==='search'?'':'all');clearSelection();history.replaceState(null,'',location.pathname+location.search);refresh();methods();overview();});
  $('methods').addEventListener('click',()=>{methods();if(window.innerWidth<=860)$('detail').scrollIntoView({block:'start',behavior:'smooth'});});
  $('csv').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([model.csv(visible)],{type:'text/csv;charset=utf-8'}));const a=node('a');a.href=url;a.download='England_maternity_inspections_selection.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  refresh();overview();methods();const hash=new URLSearchParams(location.hash.slice(1)).get('record');if(hash)selectRecord(hash,true);
  new ResizeObserver(()=>map.invalidateSize({pan:false})).observe($('map'));
  // Expose only read-only summaries for reproducible browser checks.
  window.mapStatus=()=>({records:visible.length,sites:new Set(visible.map(r=>r.site_id)).size,selected,streetOn});
})();
