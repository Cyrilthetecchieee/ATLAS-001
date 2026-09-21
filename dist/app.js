import {service,metrics,sensors,scenarios} from './service.js';
const paths={grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',wave:'M2 12h4l3-7 5 14 3-7h5',sensor:'M7 7h10v10H7z M9 2v5m6-5v5M9 17v5m6-5v5M2 9h5m-5 6h5m10-6h5m-5 6h5',chart:'M3 3v18h18 M6 15l5-5 4 3 6-8',alert:'M12 3 2 21h20L12 3z M12 9v5m0 3v1',logs:'M5 3h14v18H5z M8 7h8M8 11h8M8 15h5',device:'M4 4h16v12H4z M8 21h8m-4-5v5',report:'M5 3h10l4 4v14H5z M14 3v5h5M8 12h8m-8 4h5',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3M16 8l3-3',shield:'M12 2 3 6v7c0 5 9 9 9 9s9-4 9-9V6z M8 12l3 3 5-6',radio:'M8 8a6 6 0 0 1 8 0M4 5a11 11 0 0 1 16 0 M10 11a3 3 0 0 1 4 0M12 14v7',bolt:'m13 2-9 12h7l-1 8 10-13h-7z',temp:'M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0 M12 8v10',drop:'M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13z',arrow:'M5 12h14m-5-5 5 5-5 5',play:'m8 4 12 8-12 8z'};
const icon=(n)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]||paths.sensor}"/></svg>`;
const pages=[['overview','Overview','grid'],['telemetry','Live Telemetry','wave'],['sensors','Sensors','sensor'],['analytics','Analytics','chart'],['events','Events & Alerts','alert'],['logs','Logs','logs'],['devices','Devices','device'],['reports','Reports','report'],['settings','Settings','settings']];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=t=>t?new Date(t).toLocaleTimeString('en-GB'):'—';
const date=t=>t?new Date(t).toLocaleString('en-GB'):'—';
let page=location.hash.slice(1)||'overview',paused=false,frozen=null,range='15m',metric='temperature',search='',severity='ALL',state='ALL',from='',drawer=null,mobile=false,report='',gridlines=true;

const status=(s)=>`<span class="status ${(s||'offline').toLowerCase()}"><i class="dot"></i>${s||'OFFLINE'}</span>`;
const read=k=>paused&&frozen?frozen.readings[k]:service.reading(k);
const fmt=k=>{
  const r=read(k);
  if(!r||r.value==null||isNaN(r.value))return '—';
  return r.value.toFixed(['current','power'].includes(k)?3:['ax','ay','az','gx','gy','gz'].includes(k)?2:1);
};

const selectedHistory=()=>{
  const mins={'Live':2,'15m':15,'1h':60,'6h':360,'24h':1440}[range]||15;
  const end=paused&&frozen?frozen.timestamp:Date.now();
  const list=service.simulationEnabled ? service.history : service.history.filter(p=>p.mode==='REAL');
  return list.filter(p=>p.timestamp>=end-mins*60000&&p.timestamp<=end);
};

function chart(k,small=false){
  let hist=small?(service.simulationEnabled?service.history:service.history.filter(p=>p.mode==='REAL')).slice(-30):selectedHistory();
  let data=hist.filter(p=>p.readings&&p.readings[k]&&p.readings[k].value!=null);
  if(data.length<2)return `<div class="empty">${service.simulationEnabled?'Waiting for telemetry samples…':'Waiting for live telemetry samples…'}</div>`;
  let vals=data.map(p=>p.readings[k].value),lo=Math.min(...vals),hi=Math.max(...vals),pad=Math.max((hi-lo)*.3,.015);
  lo-=pad;hi+=pad;
  let W=small?180:700,H=small?32:230,L=small?0:55,R=small?180:685,T=small?2:15,B=small?29:195;
  const x=p=>L+(p.timestamp-data[0].timestamp)/(data.at(-1).timestamp-data[0].timestamp||1)*(R-L),y=v=>B-(v-lo)/(hi-lo)*(B-T);
  let pts=data.map(p=>`${x(p).toFixed(1)},${y(p.readings[k].value).toFixed(1)}`).join(' ');
  let axes='';
  if(!small){
    for(let i=0;i<5;i++){
      let yy=T+(B-T)*i/4;
      axes+=`${gridlines?`<line x1="${L}" x2="${R}" y1="${yy}" y2="${yy}" stroke="#292D31" stroke-dasharray="3 5"/>`:''}<text class="charttext" x="${L-10}" y="${yy+4}" text-anchor="end">${(hi-(hi-lo)*i/4).toFixed(k==='current'?3:1)}</text>`;
    }
    for(let i=0;i<5;i++){
      let p=data[Math.round((data.length-1)*i/4)];
      axes+=`<text class="charttext" x="${L+(R-L)*i/4}" y="218" text-anchor="${i===0?'start':i===4?'end':'middle'}">${time(p.timestamp)}</text>`;
    }
  }
  return `<svg class="${small?'spark':'chart'}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${metrics[k][0]} in ${metrics[k][1]} over time">${axes}<polygon points="${L},${B} ${pts} ${R},${B}" fill="#F5B942" opacity="${small?'.03':'.055'}"/><polyline points="${pts}" stroke="${k==='current'?'#CBD0D6':'#F5B942'}" stroke-width="${small?1.5:2}" fill="none" vector-effect="non-scaling-stroke"/>${!small?data.map(p=>`<circle cx="${x(p)}" cy="${y(p.readings[k].value)}" r="6" fill="transparent"><title>${time(p.timestamp)} · ${p.readings[k].value.toFixed(3)} ${metrics[k][1]} · ${p.mode||service.mode}</title></circle>`).join(''):''}</svg>`;
}

function metricCards(keys=['temperature','pressure','humidity','voltage','current','power']){
  return `<div class="metrics">${keys.map(k=>{
    const r=read(k);
    const hasVal=r.value!==null&&!isNaN(r.value);
    const sourceLabel=service.simulationEnabled?'Simulated sensor (Demo)':service.hasLiveHardware?(metrics[k][2]==='power'?'INA219':'ESP32 sensor'):'Awaiting hardware';
    return `<div class="metric"><div class="metriclabel">${metrics[k][0]}${icon(k==='temperature'?'temp':k==='humidity'?'drop':metrics[k][2]==='power'?'bolt':'sensor')}</div><div class="value">${fmt(k)}<span class="unit">${metrics[k][1]}</span></div><div class="tiny muted">${hasVal?sourceLabel:status(r.quality||'UNAVAILABLE')}</div>${chart(k,true)}</div>`;
  }).join('')}</div>`;
}

const ranges=()=>`<div class="tabs">${['Live','15m','1h','6h','24h'].map(r=>`<button data-range="${r}" class="${r===range?'selected':''}">${r}</button>`).join('')}</div>`;
const metricSelect=()=>`<select aria-label="Chart metric" id="metric">${Object.entries(metrics).map(([k,v])=>`<option value="${k}" ${metric===k?'selected':''}>${v[0]} (${v[1]})</option>`).join('')}</select>`;
const panel=(title,body,extra='')=>`<section class="panel"><div class="panelhead"><h2>${title}</h2>${extra}</div><div class="panelbody">${body}</div></section>`;

function sensorState(s){
  if(service.simulationEnabled){
    return ['OFFLINE','STALE'].includes(service.health())?service.health():service.scenario==='Sensor failure'&&s==='DHT22'?'FAULT':'HEALTHY';
  }
  return service.hasLiveHardware?'HEALTHY':'WAITING';
}

function subsystems(){
  return ['Environmental Sensors','Motion Sensors','Power Monitoring','Communication','Local Logging','System Controller'].map((s,i)=>{
    let st;
    if(service.simulationEnabled){
      st=['OFFLINE','STALE'].includes(service.health())?service.health():service.scenario==='Critical event'&&i===5?'FAULT':service.scenario==='Sensor failure'&&i===0?'FAULT':service.scenario==='Warning'&&i===0?'WARNING':'HEALTHY';
    } else {
      st=service.hasLiveHardware?'HEALTHY':'WAITING';
    }
    return `<div class="subsystem"><span class="subsystemname">${icon(['temp','wave','bolt','radio','logs','sensor'][i])}${s}</span>${status(st)}</div>`;
  }).join('');
}

function motion(){
  return `<div class="motiongrid"><svg class="motionviz" viewBox="0 0 160 150" role="img" aria-label="Motion axes: X, Y, Z"><g stroke="#34383D" fill="none"><ellipse cx="80" cy="84" rx="63" ry="27"/><ellipse cx="80" cy="84" rx="43" ry="18"/><path d="M18 84h125M80 55v58"/></g><g fill="none" stroke-width="2"><path d="M80 84 130 105" stroke="#D99A2B"/><path d="M80 84 28 105" stroke="#CBD0D6"/><path d="M80 84V23" stroke="#F5B942"/></g><circle cx="80" cy="84" r="5" fill="#F4F6F8"/><g font-family="monospace" font-size="12"><text x="137" y="110" fill="#D99A2B">X</text><text x="13" y="113" fill="#CBD0D6">Y</text><text x="75" y="16" fill="#F5B942">Z</text></g></svg><div class="motionvalues">${['ax','ay','az','gx','gy','gz'].map(k=>`<div><span>${k.startsWith('a')?'ACC':'GYR'} ${k.at(-1).toUpperCase()}</span><b>${fmt(k)}</b><span>${metrics[k][1]}</span></div>`).join('')}</div></div><div class="tiny muted" style="margin-top:15px">MPU6050 #1 · ${sensorState('MPU6050 #1')} · ${service.simulationEnabled?'Synthetic reference trace':'Hardware orientation axes'}</div>`;
}

function comms(){
  const age=service.last?Math.floor((Date.now()-service.last)/1000):null;
  const linkState=service.simulationEnabled?(age>12?'OFFLINE':age>6?'DEGRADED':'CONNECTED'):service.hasLiveHardware?(age>20?'OFFLINE':age>10?'DEGRADED':'CONNECTED'):'WAITING FOR ESP32';
  const transportLabel=service.simulationEnabled?'Transport · Simulation · Educational link':service.hasLiveHardware?`Transport · ${service.transport} · Hardware link`:'Transport · Wi-Fi (Expected) · Awaiting ESP32';
  return `<div class="comms"><div><span class="tiny muted">LINK STATE</span><b>${status(linkState)}</b></div><div><span class="tiny muted">LAST PACKET</span><b>${service.last?time(service.last):'No packets'}</b></div><div><span class="tiny muted">PACKET SEQUENCE</span><b>${service.sequence&&service.last?`#${service.sequence}`:'—'}</b></div><div><span class="tiny muted">TELEMETRY AGE</span><b>${age!=null?`${age}s ago`:'—'}</b></div></div><div class="progress" aria-hidden="true">${Array.from({length:32},()=>`<i class="${!service.hasLiveHardware&&!service.simulationEnabled?'dim':(age>6?'dim':'')}"></i>`).join('')}</div><div class="tiny muted" style="margin-top:9px">${transportLabel}</div>`;
}

function recent(){
  const events=service.events.slice(0,3);
  return `<section class="panel"><div class="panelhead"><h2>Recent events</h2><a class="small muted" href="#events">View all events ↗</a></div>${events.length?events.map(e=>`<div class="eventrow"><span class="mono muted">${time(e.timestamp)}</span><span><span class="badge ${e.severity}">${e.severity}</span> &nbsp; ${esc(e.description||e.type)}</span><span class="tiny muted">${e.state}</span></div>`).join(''):`<div class="eventrow"><span class="mono muted">—</span><span><span class="badge INFO">INFO</span> &nbsp; System listening for hardware events. All subsystems ready.</span><span class="tiny muted">SYSTEM</span></div>`}</section>`;
}

function overview(){
  const health=service.health();
  let title='Waiting for ESP32 hardware telemetry';
  let subtitle='Simulation is OFF. Awaiting real telemetry via Wi-Fi at http://localhost:5000/api/telemetry.';
  if(service.simulationEnabled){
    title=health==='NORMAL'?'Simulation mode active (Educational)':health==='CRITICAL'?'Simulation fault condition':'Simulation alert condition';
    subtitle='All sensor telemetry is synthetically generated for testing. Physical hardware is not required.';
  } else if(service.hasLiveHardware){
    title=health==='NORMAL'?'All systems operational':health==='STALE'?'Hardware telemetry is stale':'Hardware condition needs attention';
    subtitle=`Live telemetry received from ESP32 via ${service.transport}. Telemetry is up to date.`;
  }
  return `<div class="healthband"><div class="healthleft"><div class="healthicon">${icon('shield')}</div><div><h3>${title}</h3><div class="small muted">${subtitle}</div></div></div><div class="healthright"><div class="tiny muted">SYSTEM HEALTH<b>${status(health)}</b></div><div class="tiny muted">ACTIVE DEVICE<b class="mono">ATLAS-001</b></div></div></div>${metricCards()}<div class="grid">${panel('Environment telemetry',`<div class="legend"><span><i></i>${metrics[metric][0]} (${metrics[metric][1]})</span><span class="muted">${service.simulationEnabled?'SIMULATION (DEMO)':service.hasLiveHardware?'LIVE HARDWARE':'AWAITING HARDWARE'}</span></div>${chart(metric)}`,ranges())}${panel('Subsystem health',subsystems(),'<span class="tiny muted">6 SUBSYSTEMS</span>')}</div><div class="grid">${panel('Motion & orientation',motion(),'<span class="tiny muted mono">MPU6050</span>')}${panel('Communication',comms(),icon('radio'))}</div>${recent()}`;
}

function telemetry(){
  const noticeText=service.simulationEnabled?`Educational simulation telemetry · Sample quality: ${read(metric).quality} · Source: SIMULATION · Last sample: ${service.last?date(service.last):'None'}`:service.hasLiveHardware?`Hardware telemetry · Sample quality: ${read(metric).quality} · Source: REAL · Transport: ${service.transport} · Last sample: ${date(service.last)}`:`Awaiting physical ESP32 telemetry · Transport: Wi-Fi · Simulation is OFF`;
  return `<div class="filters">${metricSelect()}${ranges()}<button id="pause">${paused?'▶ Resume':'Ⅱ Pause live view'}</button><span class="small muted">${paused?'Frozen at '+time(frozen.timestamp):'Updating every '+service.pollInterval/1000+'s'}</span></div>${panel(metrics[metric][0]+' · '+metrics[metric][1],chart(metric),status(paused?'PAUSED':service.health()))}<div style="height:20px"></div>${metricCards()}<div class="grid">${panel('Motion · m/s² and °/s',motion())}${panel('Packet details',comms())}</div><div class="notice">${noticeText}</div>`;
}

function sensorCard(s){
  return `<button class="sensor" data-sensor="${s[0]}">${icon('sensor')}<div style="display:flex;justify-content:space-between;gap:10px"><h3>${s[0]}</h3>${status(sensorState(s[0]))}</div><div class="small muted">${s[1]}</div><dl>${s[2].slice(0,3).map(k=>`<div><dt>${metrics[k][0]}</dt><dd>${s[0]==='DHT22'&&service.scenario==='Sensor failure'&&service.simulationEnabled?'—':fmt(k)} <span class="tiny muted">${metrics[k][1]}</span></dd></div>`).join('')}</dl><p class="tiny muted">Updated ${service.last?time(service.last):'—'} · ${service.simulationEnabled?'Simulated (Demo)':'Hardware'}</p><span class="small" style="color:var(--mint)">Inspect sensor ↗</span></button>`;
}

function events(){
  let list=service.events.filter(e=>(severity==='ALL'||e.severity===severity)&&(state==='ALL'||e.state===state)&&(!from||e.timestamp>=new Date(from).getTime())&&`${e.id} ${e.description} ${e.type} ${e.subsystem}`.toLowerCase().includes(search.toLowerCase()));
  return `<div class="filters"><input id="search" placeholder="Search events…" value="${esc(search)}" aria-label="Search events"><select id="severity" aria-label="Severity">${['ALL','INFO','WARNING','CRITICAL'].map(v=>`<option ${severity===v?'selected':''}>${v}</option>`).join('')}</select><select id="state" aria-label="Event state">${['ALL','ACTIVE','ACKNOWLEDGED','RESOLVED'].map(v=>`<option ${state===v?'selected':''}>${v}</option>`).join('')}</select><input type="datetime-local" id="from" value="${from}" aria-label="Events since"><button id="reset">Reset filters</button></div><section class="panel"><div class="panelhead"><h2>Event stream</h2><span class="small muted">${list.length} events</span></div>${list.length?`<div class="tablewrap"><table><thead><tr><th>Event / timestamp</th><th>Description</th><th>Severity</th><th>State</th><th>Action</th></tr></thead><tbody>${list.map(e=>`<tr><td class="mono">${e.id}<br><span class="tiny muted">${date(e.timestamp)}</span></td><td>${esc(e.description)}<br><span class="tiny muted">${e.device} · ${e.subsystem} · ${e.type}</span></td><td><span class="badge ${e.severity}">${e.severity}</span></td><td class="tiny">${e.state}</td><td>${e.state==='ACTIVE'?`<button data-ack="${e.id}">Acknowledge</button>`:'—'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><b>No matching events</b>System is waiting for hardware events or simulation scenarios.</div>'}</section>`;
}

function logs(){
  const list=service.logs.filter(l=>(severity==='ALL'||l.level===severity)&&(state==='ALL'||l.source===state)&&`${l.source} ${l.message}`.toLowerCase().includes(search.toLowerCase()));
  return `<div class="filters"><input id="search" aria-label="Search logs" placeholder="Search log messages…" value="${esc(search)}"><select id="severity" aria-label="Log level">${['ALL','INFO','WARNING','ERROR'].map(v=>`<option ${severity===v?'selected':''}>${v}</option>`).join('')}</select><select id="state" aria-label="Log source">${['ALL','SYSTEM','SENSOR','COMMUNICATION','SIMULATION','EVENT_ENGINE','API'].map(v=>`<option ${state===v?'selected':''}>${v}</option>`).join('')}</select><button id="reset">Reset filters</button></div><section class="panel"><div class="tablewrap"><table><thead><tr><th>Timestamp</th><th>Source</th><th>Level</th><th>Message</th></tr></thead><tbody>${list.map(l=>`<tr><td class="mono">${time(l.timestamp)}</td><td class="tiny mono">${l.source}</td><td><span class="badge ${l.level==='ERROR'?'CRITICAL':l.level}">${l.level}</span></td><td>${esc(l.message)}</td></tr>`).join('')}</tbody></table></div>${!list.length?'<div class="empty">No matching log entries.</div>':''}</section>`;
}

function reports(){
  return panel('Configure telemetry report',`<div class="notice">${service.simulationEnabled?'Simulation report · Exported readings are synthetic.':'Hardware telemetry report · Exported readings reflect backend storage.'}</div><form id="reportform"><div class="formgrid"><label>Device<select name="device"><option>ATLAS-001</option></select></label><label>Time range<select name="duration"><option value="15">Last 15 minutes</option><option value="60">Last hour</option><option value="1440">Last 24 hours</option></select></label></div><p class="small">Include metrics</p><div class="checks">${['temperature','humidity','pressure','voltage','current','power'].map(k=>`<label class="small"><input type="checkbox" name="metrics" value="${k}" checked>${metrics[k][0]}</label>`).join('')}</div><p><label class="small"><input type="checkbox" name="events" checked> Include event summary</label></p><button class="primary">Generate & download report</button><p class="small" role="status">${report}</p></form>`);
}

function settings(){
  return panel('Console preferences',`<div class="formrow"><div>Appearance<p>Choose a display theme for this browser.</p></div><select id="theme"><option value="dark" ${document.body.classList.contains('light')?'':'selected'}>Dark console</option><option value="light" ${document.body.classList.contains('light')?'selected':''}>Light console</option></select></div><div class="formrow"><div>Simulation mode<p>Optional educational engine for software demonstrations.</p></div><button id="simsettingsbtn" class="${service.simulationEnabled?'primary':''}">${service.simulationEnabled?'Simulation is ON':'Simulation is OFF'}</button></div><div class="formrow"><div>Chart grid<p>Show reference lines on telemetry charts.</p></div><input id="gridlines" type="checkbox" ${gridlines?'checked':''} aria-label="Show chart grid"></div><div class="formrow"><div>Simulation scenarios<p>Explore warning, failure, and recovery demo states.</p></div><button data-demo>Open simulator controls</button></div><div class="formrow"><div>Hardware connection<p>Expected transport: Wi-Fi REST API at /api/telemetry.</p></div><span class="chip">${service.hasLiveHardware?'CONNECTED':'WAITING'}</span></div>`);
}

function content(){
  switch(page){
    case'overview':return overview();
    case'telemetry':return telemetry();
    case'sensors':return `<div class="notice">${service.simulationEnabled?'Simulation active. Physical sensors are not required in demo mode.':'Sensors are monitored via physical ESP32 controller over Wi-Fi.'}</div><div class="cards">${sensors.map(sensorCard).join('')}</div>`;
    case'analytics':return `<div class="filters">${metricSelect()}${ranges()}</div>${panel('Historical '+metrics[metric][0].toLowerCase(),chart(metric),'<span class="tiny muted">'+metrics[metric][1]+' · '+(service.simulationEnabled?'SIMULATED HISTORY':'LIVE HARDWARE HISTORY')+'</span>')}<div style="height:20px"></div><div class="grid">${panel('Power · Voltage (V)',chart('voltage'))}${panel('Power · Current (A)',chart('current'))}</div>${panel('Power · Calculated power (W)',chart('power'),'<span class="tiny muted">P = V × I</span>')}`;
    case'events':return events();
    case'logs':return logs();
    case'devices':{
      const devList=service.devices.length?service.devices:[{deviceId:'ATLAS-001',status:service.health(),mode:service.mode,transport:service.transport,lastSeen:service.last?new Date(service.last).toISOString():'None'}];
      return panel('Registered devices',`<div class="tablewrap"><table><thead><tr><th>Device</th><th>Status</th><th>Transport</th><th>Last seen</th><th>Mode</th><th>Selection</th></tr></thead><tbody>${devList.map(d=>`<tr><td><b>${esc(d.deviceId)}</b><br><span class="muted">Embedded monitoring unit</span></td><td>${status(d.status||service.health())}</td><td><span class="mono">${esc(d.transport||service.transport)}</span></td><td class="mono">${d.lastSeen&&d.lastSeen!=='None'?time(d.lastSeen):'—'}</td><td><span class="chip">${esc(d.mode||service.mode)}</span></td><td><select aria-label="Active device"><option>${esc(d.deviceId)} · Active</option></select></td></tr>`).join('')}</tbody></table></div><p class="small muted">${devList.length} device(s) registered in backend registry. Primary communication: Wi-Fi.</p>`);
    }
    case'reports':return reports();
    case'settings':return settings();
    default:return overview();
  }
}

const descriptions={overview:'Your system, at a glance.',telemetry:'A live view of every signal.',sensors:'Inspect the instruments behind each reading.',analytics:'Explore telemetry across time.',events:'Track, investigate, and acknowledge system events.',logs:'A chronological record of system activity.',devices:'Connected units and device information.',reports:'Capture a snapshot of your telemetry.',settings:'Make the console work for you.'};

function render(){
  const focused=document.activeElement;
  const fid=focused?.id;
  const selection=focused?.selectionStart;
  const sc=document.querySelector('.drawer')?.scrollTop;

  const topChip = service.simulationEnabled
    ? `<span class="chip" style="background:#2D2013;color:#F5B942;border-color:#F5B942">◇ SIMULATION (DEMO MODE)</span>`
    : service.hasLiveHardware
      ? `<span class="chip" style="background:#13261A;color:#4FC38A;border-color:#4FC38A">◈ LIVE HARDWARE</span>`
      : `<span class="chip" style="color:#8D99A6;border-color:#34383D">◈ REAL MODE · WAITING FOR ESP32</span>`;

  const sidebarStatus = !service.backendOnline
    ? status('OFFLINE')
    : service.simulationEnabled
      ? status('SIMULATION')
      : service.hasLiveHardware
        ? status('CONNECTED')
        : status('WAITING');

  const sidebarDesc = service.simulationEnabled
    ? 'Educational demo active'
    : service.hasLiveHardware
      ? 'ESP32 Wi-Fi active'
      : 'Expected: ESP32 Wi-Fi';

  document.getElementById('app').innerHTML=`<aside class="sidebar ${mobile?'open':''}"><a href="#overview" class="brand">${icon('shield')}<div>ATLAS-001<small>TELEMETRY CONSOLE</small></div></a><div class="navlabel">WORKSPACE</div><nav class="nav">${pages.slice(0,6).map(nav).join('')}</nav><div class="navlabel">MANAGEMENT</div><nav class="nav">${pages.slice(6).map(nav).join('')}</nav><div class="sidebarbottom"><b>${sidebarStatus}</b><div class="muted">${service.backendOnline?'Backend connected (:5000)':'Backend offline (:5000)'}</div><div class="muted">${sidebarDesc}</div><div class="muted" style="margin-top:5px;font-size:11px;border-top:1px solid #292D31;padding-top:4px">Simulation: <b>${service.simulationEnabled?'ON (DEMO)':'OFF'}</b></div></div></aside><main class="main"><header class="topbar"><div class="topgroup"><button class="menubtn" id="menu" aria-label="Toggle navigation">☰</button><span class="small muted">Workspace <span style="margin:0 9px;color:#697078">/</span></span><select aria-label="Selected device"><option>ATLAS-001</option></select><span class="connectiontop">${status(service.health())}</span></div><div class="topgroup"><span class="small muted mono">${service.last?time(service.last):'No packets'}</span>${topChip}</div></header><div class="content"><div class="heading"><div><div class="eyebrow">ATLAS-001 / ${page==='overview'?'COMMAND CENTER':page.toUpperCase()}</div><h1>${pages.find(p=>p[0]===page)?.[1]||'Overview'}</h1><div class="small muted">${descriptions[page]||descriptions.overview}</div></div><div class="actions"><button data-demo style="${service.simulationEnabled?'border-color:var(--amber);color:var(--amber)':''}">▷ &nbsp; ${service.simulationEnabled?'Simulation controls (ON)':'Simulation controls (OFF)'}</button>${page==='overview'?'<a href="#telemetry"><button class="primary">Live telemetry ↗</button></a>':''}</div></div>${!service.backendOnline?'<div class="notice" style="border-left-color:#E25555;background:#261818;color:#FFA4A4;margin-bottom:20px;">⚠️ <b>BACKEND OFFLINE</b> — Cannot reach ATLAS-001 backend on <code>http://localhost:5000</code>. Verify the backend server is running. Auto-reconnecting...</div>':''}${content()}<footer class="footer"><span>ATLAS-001 · Embedded Monitoring &amp; Telemetry System</span><span>${paused?'VIEW PAUSED':service.simulationEnabled?'SIMULATION DATA (DEMO)':service.hasLiveHardware?'LIVE HARDWARE DATA':'WAITING FOR HARDWARE'} &nbsp; / &nbsp; LAST PACKET ${service.last?time(service.last):'NONE'}</span></footer></div></main>${drawer?draw():''}`;
  bind();
  if(fid&&document.getElementById(fid)){
    const el=document.getElementById(fid);
    el.focus();
    if(selection!=null&&el.type==='text')el.setSelectionRange(selection,selection);
  }
  if(sc&&document.querySelector('.drawer'))document.querySelector('.drawer').scrollTop=sc;
}

function nav(p){
  return `<a href="#${p[0]}" class="${page===p[0]?'active':''}" ${page===p[0]?'aria-current="page"':''}>${icon(p[2])}${p[1]}</a>`;
}

function draw(){
  let body;
  if(drawer==='demo'){
    body=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <div>
        <h2 style="margin:0 0 4px">Simulation Controls</h2>
        <span class="badge ${service.simulationEnabled?'WARNING':'INFO'}">${service.simulationEnabled?'SIMULATION ON':'SIMULATION OFF'}</span>
      </div>
    </div>
    <div class="notice" style="margin:12px 0 16px">
      <b>EDUCATIONAL / DEMO MODE</b><br>
      Simulation generates synthetic sensor telemetry for testing when real hardware is unavailable. Default operation monitors real ESP32 sensors over Wi-Fi.
    </div>
    <div class="formrow" style="padding:14px 0 18px;border-bottom:1px solid var(--border)">
      <div>
        <b>Simulation Mode Toggle</b>
        <p class="small muted">${service.simulationEnabled?'Simulation is currently generating & POSTing packets to backend.':'Simulation is currently OFF. Application monitors real hardware.'}</p>
      </div>
      <button id="simtoggle" class="${service.simulationEnabled?'primary':''}" style="min-width:100px">${service.simulationEnabled?'Turn OFF':'Turn ON'}</button>
    </div>
    <h3 style="margin-top:24px">Demo Scenarios ${!service.simulationEnabled?'<span class="tiny muted">(turn ON simulation to test)</span>':''}</h3>
    <div style="${service.simulationEnabled?'':'opacity:0.4;pointer-events:none'}">
      ${scenarios.map(s=>`<button class="scenario ${service.scenario===s?'current':''}" data-scenario="${s}">${s}<small>${{'Normal operation':'Healthy sensors and stable telemetry.','Warning':'Environmental warning condition.','Critical event':'Controller fault and critical alert.','Sensor failure':'DHT22 humidity becomes unavailable.','Communication loss':'Packets stop; stale at 6s, offline at 12s.','Recovery':'Telemetry resumes; normal after 5 seconds.'}[s]}</small></button>`).join('')}
    </div>`;
  } else {
    let s=sensors.find(s=>s[0]===drawer);
    body=`<h2>${s[0]}</h2><p class="muted">${s[1]}</p>${status(sensorState(s[0]))}<dl>${s[2].map(k=>`<div class="subsystem"><dt>${metrics[k][0]}</dt><dd>${fmt(k)} ${metrics[k][1]}<br><span class="tiny muted">${read(k).quality||'UNAVAILABLE'}</span></dd></div>`).join('')}</dl><div class="small muted">Source: ${service.simulationEnabled?'SIMULATION (DEMO)':service.hasLiveHardware?'REAL HARDWARE':'AWAITING HARDWARE'}<br>Last update: ${service.last?date(service.last):'None'}<br>Connection: ${service.simulationEnabled?'SIMULATED LINK':service.hasLiveHardware?'ESP32 WI-FI':'WAITING FOR ESP32'}</div><h3 style="margin-top:25px">Recent ${metrics[s[2][0]][0].toLowerCase()}</h3>${chart(s[2][0])}<p class="small muted">${s[0].startsWith('MPU')?'Both MPU6050 units monitor dynamic motion and orientation.':''}</p>`;
  }
  return `<div class="drawerback"><section class="drawer" role="dialog" aria-modal="true" aria-label="${drawer==='demo'?'Simulation controls':drawer}"><button class="close" id="close" aria-label="Close panel">✕</button>${body}</section></div>`;
}

function bind(){
  document.querySelectorAll('[data-demo]').forEach(b=>b.onclick=()=>{drawer='demo';render();document.getElementById('close').focus();});
  document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{range=b.dataset.range;render();});
  document.querySelectorAll('[data-sensor]').forEach(b=>b.onclick=()=>{drawer=b.dataset.sensor;render();document.getElementById('close').focus();});
  document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>service.setScenario(b.dataset.scenario));
  document.querySelectorAll('[data-ack]').forEach(b=>b.onclick=()=>service.acknowledge(b.dataset.ack));
  const on=(id,event,fn)=>{const e=document.getElementById(id);if(e)e[event]=fn;};
  on('close','onclick',()=>{drawer=null;render();});
  on('menu','onclick',()=>{mobile=!mobile;render();});
  on('metric','onchange',e=>{metric=e.target.value;render();});
  on('pause','onclick',()=>{paused=!paused;frozen=paused?structuredClone(service.current):null;render();});
  on('search','oninput',e=>{search=e.target.value;render();});
  on('severity','onchange',e=>{severity=e.target.value;render();});
  on('state','onchange',e=>{state=e.target.value;render();});
  on('from','onchange',e=>{from=e.target.value;render();});
  on('reset','onclick',()=>{search='';severity=state='ALL';from='';render();});
  on('simtoggle','onclick',async()=>{await service.toggleSimulation();render();});
  on('simsettingsbtn','onclick',async()=>{await service.toggleSimulation();render();});
  on('theme','onchange',e=>{document.body.classList.toggle('light',e.target.value==='light');try{localStorage.setItem('sentinel-theme',e.target.value);}catch{}render();});
  on('refresh','onchange',e=>service.setRefresh(Number(e.target.value)));
  on('gridlines','onchange',e=>{gridlines=e.target.checked;render();});
  on('reportform','onsubmit',e=>{
    e.preventDefault();
    const f=new FormData(e.target),ks=f.getAll('metrics');
    if(!ks.length){report='Select at least one metric.';render();return;}
    const start=Date.now()-Number(f.get('duration'))*60000;
    const samples=service.history.filter(p=>p.timestamp>=start);
    const lines=['ATLAS-001 — TELEMETRY REPORT','Device: ATLAS-001','Generated: '+new Date().toISOString(),service.simulationEnabled?'Educational simulation report. Synthetic data.':'Live hardware monitoring report.','', ['Timestamp',...ks.map(k=>`${metrics[k][0]} (${metrics[k][1]})`)].join(','),...samples.map(p=>[new Date(p.timestamp).toISOString(),...ks.map(k=>p.readings&&p.readings[k]&&p.readings[k].value!=null?p.readings[k].value.toFixed(4):'UNAVAILABLE')].join(','))];
    if(f.get('events'))lines.push('','EVENT SUMMARY',...service.events.filter(e=>e.timestamp>=start).map(e=>`${new Date(e.timestamp).toISOString()} | ${e.severity} | ${e.state} | ${e.description}`));
    const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'}));
    const a=document.createElement('a');
    a.href=url;
    a.download=`ATLAS-001-${service.simulationEnabled?'simulation':'hardware'}-report.txt`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    report=`Report downloaded · ${samples.length} samples · ${ks.length} metrics.`;
    render();
  });
}

window.addEventListener('hashchange',()=>{
  page=location.hash.slice(1)||'overview';
  if(!pages.some(p=>p[0]===page))page='overview';
  search='';severity=state='ALL';drawer=null;mobile=false;
  render();
  window.scrollTo(0,0);
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){drawer=null;mobile=false;render();}
  if(e.key==='Tab'&&drawer){
    const els=[...document.querySelectorAll('.drawer button,.drawer select,.drawer input')];
    if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1).focus();}
    else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus();}
  }
});

try{document.body.classList.toggle('light',localStorage.getItem('sentinel-theme')==='light');}catch{}
service.subscribe(()=>{if(!['reports','settings'].includes(page)||drawer)render();});
render();

if(document.modelContext?.registerTool){
  for(const tool of [
    {
      name:'read_telemetry',
      description:'Read ATLAS-001 device status, active mode, and latest telemetry.',
      inputSchema:{type:'object',properties:{},additionalProperties:false},
      annotations:{readOnlyHint:true},
      execute:()=>({health:service.health(),mode:service.mode,simulationEnabled:service.simulationEnabled,hasLiveHardware:service.hasLiveHardware,packet:service.current})
    },
    {
      name:'set_simulation_mode',
      description:'Enable or disable educational simulation mode.',
      inputSchema:{type:'object',properties:{enabled:{type:'boolean'}},required:['enabled'],additionalProperties:false},
      annotations:{readOnlyHint:false},
      execute:async input=>{await service.toggleSimulation(input.enabled);return{simulationEnabled:service.simulationEnabled,mode:service.mode};}
    }
  ])try{Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{});}catch{}
}
