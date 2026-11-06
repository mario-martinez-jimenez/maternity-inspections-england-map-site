/* Shared, dependency-free data rules. Used by the map and by verify.mjs. */
(function (root) {
  'use strict';
  const labels={routine:'Routine programme',concern:'Concern-triggered',followup:'Follow-up to concerns',mixed:'Mixed programme / risk or recheck',unclear:'Reason unclear'};
  function matches(r,f={}) {
    const q=(f.search||'').trim().toLocaleLowerCase('en-GB');
    return (!q||[r.hospital,r.trust,r.postcode,r.site_id,r.region].some(x=>String(x).toLocaleLowerCase('en-GB').includes(q)))
      &&(!f.year||f.year==='all'||String(r.year)===String(f.year))
      &&(!f.group||f.group==='all'||r.group===f.group)
      &&(!f.reason||f.reason==='all'||r.category===f.reason)
      &&(!f.precision||f.precision==='all'||r.date_type===f.precision);
  }
  const date=s=>s?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T00:00:00Z')):'Unconfirmed';
  const visit=r=>!r.start?'Maternity visit date unconfirmed':r.start===r.end?date(r.start):`${date(r.start)} – ${date(r.end)}`;
  const csvCell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  function csv(rows) {
    const columns=[['Hospital','hospital'],['NHS trust','trust'],['Hospital address','address'],['Postcode','postcode'],['CQC location ID','site_id'],['Inspection group','sheet'],['Inspection from','start'],['Inspection to','end'],['Date precision','date_type'],['Report published','published'],['Inspection reason','reason'],['Notes','notes'],['Latitude','lat'],['Longitude','lon'],['Coordinate precision','coordinate_precision'],['Coordinate source','coordinate_source'],['Report title','report_title'],['Report URL','report_url'],['CQC history URL','history_url'],['All sources','sources'],['Record ID','id']];
    return '\uFEFF'+[columns.map(c=>csvCell(c[0])).join(','),...rows.map(r=>columns.map(c=>csvCell(Array.isArray(r[c[1]])?r[c[1]].join('\n'):r[c[1]])).join(','))].join('\r\n');
  }
  root.MaternityModel={labels,matches,date,visit,csv};
})(typeof window==='undefined'?globalThis:window);
