/* Shared, dependency-free data rules. Used by the map and by verify.mjs. */
(function (root) {
  'use strict';
  const labels={routine:'Routine programme',concern:'Concern-triggered',followup:'Follow-up to concerns',mixed:'Mixed programme / risk or recheck',unclear:'Reason unclear'};
  const monthKey=r=>r.start?r.start.slice(0,7):'undated';
  function dateFlag(r) {
    if(!r.start)return {kind:'unconfirmed',flagged:true,label:'Month unconfirmed'};
    if(r.date_type==='period')return {kind:'period',flagged:true,label:r.start.slice(0,7)===r.end.slice(0,7)?'Date period':'Cross-month period'};
    // Date qualifications are separate from the later-address warning.
    const qualification=(r.date_notes||'').replace(/Address from the later CQC location page[\s\S]*$/,'').trim();
    return qualification?{kind:'qualified',flagged:true,label:'Source-qualified day'}:{kind:'day',flagged:false,label:'Reported single day'};
  }
  function precisionMatch(r,value) {
    if(!value||value==='all')return true;
    if(value==='flagged')return dateFlag(r).flagged;
    if(value==='qualified')return dateFlag(r).kind==='qualified';
    if(value==='cross-month')return !!r.start&&r.start.slice(0,7)!==r.end.slice(0,7);
    return r.date_type===value;
  }
  function matches(r,f={}) {
    const q=(f.search||'').trim().toLocaleLowerCase('en-GB');
    return (!q||[r.hospital,r.trust,r.postcode,r.site_id,r.region].some(x=>String(x).toLocaleLowerCase('en-GB').includes(q)))
      &&(!f.year||f.year==='all'||String(r.year)===String(f.year))
      &&(!f.group||f.group==='all'||r.group===f.group)
      &&(!f.reason||f.reason==='all'||r.category===f.reason)
      &&precisionMatch(r,f.precision)
      &&(!f.month||f.month==='all'||monthKey(r)===f.month);
  }
  function timeline(rows) {
    const months=Array.from({length:24},(_,i)=>{const key=`${2022+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;return {key,total:0,flagged:0,crossMonth:0,counts:Object.fromEntries(Object.keys(labels).map(k=>[k,{total:0,flagged:0}]))};});
    const byMonth=new Map(months.map(m=>[m.key,m]));let undated=0;
    for(const r of rows){if(!r.start){undated++;continue;}const m=byMonth.get(monthKey(r));if(!m)continue;const flagged=dateFlag(r).flagged;m.total++;m.flagged+=Number(flagged);m.crossMonth+=Number(r.start.slice(0,7)!==r.end.slice(0,7));m.counts[r.category].total++;m.counts[r.category].flagged+=Number(flagged);}
    return {months,undated};
  }
  const date=s=>s?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T00:00:00Z')):'Unconfirmed';
  const visit=r=>!r.start?'Maternity visit date unconfirmed':r.start===r.end?date(r.start):`${date(r.start)} – ${date(r.end)}`;
  function activityMetrics(provider) {
    if(!provider)return [];
    const v=provider.values,raw=provider.raw;
    const ratio=(numerator,denominator)=>Number.isFinite(numerator)&&Number.isFinite(denominator)&&denominator>0?numerator/denominator:null;
    const published=key=>v.method_known>0&&Number.isFinite(v[key])?v[key]:null;
    const induced=['surgical_induction','medical_induction','combined_induction'].every(k=>Number.isFinite(v[k]))?v.surgical_induction+v.medical_induction+v.combined_induction:null;
    return [
      {key:'deliveries',label:'Recorded deliveries',value:v.deliveries,unit:'count',source:'Q',table:'delivery',detail:'Finished delivery episodes; rounded to the nearest five.'},
      {key:'caesarean',label:'Caesarean rate',value:published('caesarean_rate'),unit:'rate',source:'V',table:'delivery',denominator:v.method_known,suppressed:raw.caesarean_rate==='*',detail:'Published rate among delivery episodes with known delivery method.'},
      {key:'elective',label:'Elective caesarean',value:ratio(v.elective_count,v.method_known),unit:'rate',source:'F / U',table:'delivery',denominator:v.method_known,suppressed:raw.elective_count==='*',detail:'Derived from rounded elective count / known delivery methods.'},
      {key:'emergency',label:'Emergency / other caesarean',value:ratio(v.emergency_count,v.method_known),unit:'rate',source:'G / U',table:'delivery',denominator:v.method_known,suppressed:raw.emergency_count==='*',detail:'Derived from rounded emergency/other caesarean count / known delivery methods.'},
      {key:'instrumental',label:'Instrumental birth',value:published('instrumental_rate'),unit:'rate',source:'W',table:'delivery',denominator:v.method_known,suppressed:raw.instrumental_rate==='*',detail:'Published rate; includes forceps, ventouse and breech extraction.'},
      {key:'spontaneous',label:'Spontaneous birth',value:published('spontaneous_rate'),unit:'rate',source:'X',table:'delivery',denominator:v.method_known,suppressed:raw.spontaneous_rate==='*',detail:'Published rate; source grouping includes other breech deliveries.'},
      {key:'induction',label:'Induced onset of labour',value:ratio(induced,v.onset_known),unit:'rate',source:'(E + F + G) / M',table:'onset',denominator:v.onset_known,suppressed:['surgical_induction','medical_induction','combined_induction'].some(k=>raw[k]==='*'),detail:'Surgical + medical + combined induction / known onset. Includes caesarean onset in the denominator; differs from NMPA.'},
      {key:'unknown_method',label:'Delivery method unknown',value:ratio(v.method_unknown,v.deliveries),unit:'rate',source:'P / Q',table:'delivery',denominator:v.deliveries,suppressed:raw.method_unknown==='*',detail:'Rounded unknown delivery method count / recorded deliveries.'},
      {key:'unknown_onset',label:'Labour onset unknown',value:ratio(v.onset_unknown,v.onset_total),unit:'rate',source:'H / I',table:'onset',denominator:v.onset_total,suppressed:raw.onset_unknown==='*',detail:'Rounded unknown onset count / recorded deliveries.'}
    ];
  }
  function activityTiming(r,s) {
    if(!r.start)return 'Inspection date unconfirmed: temporal order is undetermined.';
    if(s.end<r.start)return 'This reporting year ends before the inspection; its publication date is shown separately.';
    if(s.start>r.end)return 'This reporting year begins after the inspection; it is not a pre-inspection baseline.';
    return 'This reporting year overlaps the inspection period; it is not a pre-inspection baseline.';
  }
  const csvCell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  function csv(rows) {
    const columns=[['Hospital','hospital'],['NHS trust','trust'],['Hospital address','address'],['Postcode','postcode'],['CQC location ID','site_id'],['Inspection group','sheet'],['Inspection from','start'],['Inspection to','end'],['Date precision','date_type'],['Report published','published'],['Inspection reason','reason'],['Notes','notes'],['Latitude','lat'],['Longitude','lon'],['Coordinate precision','coordinate_precision'],['Coordinate source','coordinate_source'],['Report title','report_title'],['Report URL','report_url'],['CQC history URL','history_url'],['All sources','sources'],['Record ID','id']];
    return '\uFEFF'+[columns.map(c=>csvCell(c[0])).join(','),...rows.map(r=>columns.map(c=>csvCell(Array.isArray(r[c[1]])?r[c[1]].join('\n'):r[c[1]])).join(','))].join('\r\n');
  }
  root.MaternityModel={labels,matches,date,visit,csv,monthKey,dateFlag,timeline,activityMetrics,activityTiming};
})(typeof window==='undefined'?globalThis:window);
