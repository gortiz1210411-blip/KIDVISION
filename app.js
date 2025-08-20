
const STANDARDS = {"Reading": [{"code": "ELA.5.R.1.1", "desc": "Quote accurately from a text", "subskills": ["Key details", "Textual evidence"]}], "Math": [{"code": "MA.5.NSO.1.1", "desc": "Read/write multi-digit numbers", "subskills": ["Expanded form", "Standard form"]}], "Science": [{"code": "SC.5.N.1.1", "desc": "Scientific inquiry", "subskills": ["Ask questions", "Plan investigations"]}], "meta": {"built": "2025-08-20"}};
const SUBJECTS = ["Reading","Math","Science"];
let STUDENTS = JSON.parse(localStorage.getItem('fl_students')||'[]');
let RECORDS  = JSON.parse(localStorage.getItem('fl_records')||'[]');
let SETTINGS = JSON.parse(localStorage.getItem('fl_settings')||'{}');
const SB_URL_DEFAULT = "https://pgmxbogkgnpekjoolgte.supabase.co";
const SB_KEY_DEFAULT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbXhib2drZ25wZWtqb29sZ3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDEzNzIsImV4cCI6MjA3MDk3NzM3Mn0.DePl3SELtw06yueZJQPvXYTmUEnz9WC-iCaXreCXUQ8";
let SB_CFG = JSON.parse(localStorage.getItem('kv_supabase_cfg')||'{}');

function getSbUrl(){ return SB_CFG.url || SB_URL_DEFAULT; }
function getSbKey(){ return SB_CFG.key || SB_KEY_DEFAULT; }
function setGateErr(m){ const el=document.getElementById('gateErr'); if(el) el.textContent=m||''; }
function setGateDbg(m){ const el=document.getElementById('gateDbg'); if(el) el.textContent=m||''; }

async function rpc(name, body){
  const r = await fetch(getSbUrl()+'/rest/v1/rpc/'+name, {
    method:'POST',
    headers:{'apikey':getSbKey(),'Authorization':'Bearer '+getSbKey(),'Content-Type':'application/json'},
    body: JSON.stringify(body||{})
  });
  const text = await r.text();
  let data = text; try{ data = JSON.parse(text); }catch{}
  return { ok:r.ok, status:r.status, data, text };
}

async function teacherLogin(){
  const btn=document.getElementById('gateSubmit'); if(btn) btn.disabled=true;
  setGateErr(''); setGateDbg('Checking…');
  const email=(document.getElementById('gateEmail').value||'').trim();
  const code =(document.getElementById('gateCode').value||'').trim().toUpperCase();
  if(!email||!code){ setGateErr('Enter email and invite code.'); if(btn) btn.disabled=false; return; }
  const res = await rpc('redeem_code', { code, email });
  const s = String(res.data).trim().toLowerCase();
  const ok = res.ok && (s==='true'||s==='t'||s==='1'||s.includes('true')||res.data===true||res.data===1);
  setGateDbg('redeem_code → '+res.status+' '+s);
  if(ok){ localStorage.setItem('kv_access_granted','1'); document.getElementById('gateOverlay').style.display='none'; }
  else  { setGateErr('Invalid or already redeemed code.'); }
  if(btn) btn.disabled=false;
}

(function gateInit(){
  const btn=document.getElementById('gateSubmit');
  if(btn) btn.addEventListener('click', teacherLogin);
  ['gateEmail','gateCode'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('keydown',e=>{ if(e.key==='Enter') teacherLogin(); }); });
  if(localStorage.getItem('kv_access_granted')==='1' || localStorage.getItem('kv_admin')==='1'){ document.getElementById('gateOverlay').style.display='none'; }
})();

// Tabs
(function(){ 
  const tabs = document.querySelectorAll('.tab');
  const sections = document.querySelectorAll('.section');
  function activate(id){ sections.forEach(s=>s.classList.toggle('active', s.id===id)); tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===id)); }
  tabs.forEach(t=>t.addEventListener('click', ()=>activate(t.dataset.tab)));
  activate('quick');
})();

// Admin visibility + access section (hidden unless owner)
(function(){
  const adminTab = document.getElementById('adminTab');
  const isAdmin = (localStorage.getItem('kv_admin')==='1');
  adminTab.style.display = isAdmin ? 'inline-block' : 'none';
  const accessBlock = document.getElementById('accessBlock');
  const accessSplit = document.getElementById('accessSplit');
  if(isAdmin){ accessBlock.style.display='block'; accessSplit.style.display='block'; }
  else       { accessBlock.style.display='none';  accessSplit.style.display='none';  }
})();

// Data + UI bindings
const studentSelect = document.getElementById('studentSelect');
const subjectSelect = document.getElementById('subjectSelect');
const standardSelect = document.getElementById('standardSelect');
const subskillSelect = document.getElementById('subskillSelect');
const standardSearch = document.getElementById('standardSearch');
const ratingGroup = document.getElementById('ratingGroup');
const dateInput = document.getElementById('dateInput');
const notesEl = document.getElementById('notes');
const tbody = document.querySelector('#dataTable tbody');
const studentViewSelect = document.getElementById('studentViewSelect');
const studentTableBody = document.querySelector('#studentTable tbody');
const filterStudent = document.getElementById('filterStudent');
const filterCode = document.getElementById('filterCode');
const filterSubject = document.getElementById('filterSubject');
const filterRating = document.getElementById('filterRating');

function setToday(){ const d=new Date(); const iso=d.toISOString().slice(0,10); if(dateInput) dateInput.value=iso; } setToday();
function masked(name){
  const hide=document.getElementById('hideNames').checked;
  const ini=document.getElementById('useInitials').checked;
  if(hide){ return ini ? (name||'').split(/\s+/).map(s=>s[0]||'').join('').toUpperCase() : 'Student'; }
  return name;
}
function renderStudents(){
  studentSelect.innerHTML = '<option value="">' + (STUDENTS.length?'Select student…':'No students yet') + '</option>' + STUDENTS.map((s,i)=>`<option value="${i}">${masked(s.name)}</option>`).join('');
  studentViewSelect.innerHTML = '<option value="">Choose student…</option>' + STUDENTS.map((s,i)=>`<option value="${i}">${masked(s.name)}</option>`).join('');
  const sc=document.getElementById('studentCount'); if(sc) sc.textContent = STUDENTS.length ? `${STUDENTS.length} students` : 'No students yet';
  localStorage.setItem('fl_students', JSON.stringify(STUDENTS));
}
function renderSubjects(){
  subjectSelect.innerHTML = SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('');
  filterSubject.innerHTML = '<option value="">All</option>' + SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('');
}
function getStandardsForSubject(subj){ return (STANDARDS[subj]||[]); }
function renderStandards(){
  const subj = subjectSelect.value || SUBJECTS[0]; subjectSelect.value=subj;
  const list = getStandardsForSubject(subj);
  const q = (standardSearch.value||'').toLowerCase();
  const filtered = list.filter(x => (x.code+' '+x.desc).toLowerCase().includes(q));
  standardSelect.innerHTML = '<option value="">Select standard…</option>' + filtered.map((x,idx)=>`<option value="${idx}">${x.code} — ${x.desc}</option>`).join('');
  subskillSelect.innerHTML = '<option value="">Select subskill…</option>'; subskillSelect.disabled=true;
}
function renderSubskills(){
  const subj = subjectSelect.value; const idx = standardSelect.value;
  if(idx===''){ subskillSelect.innerHTML='<option value="">Select subskill…</option>'; subskillSelect.disabled=true; return; }
  const st = getStandardsForSubject(subj)[idx]; const subs = st.subskills||[];
  subskillSelect.innerHTML = '<option value="">Select subskill…</option>' + subs.map((s,i)=>`<option value="${i}">${s}</option>`).join('');
  subskillSelect.disabled = subs.length===0;
}
ratingGroup.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ ratingGroup.querySelectorAll('button').forEach(x=>x.style.borderColor='var(--line)'); b.style.borderColor='var(--accent)'; ratingGroup.dataset.value=b.dataset.v; }));

function saveRecord(){
  const sIdx = studentSelect.value; const subj=subjectSelect.value; const stdIdx=standardSelect.value; const subIdx=subskillSelect.value; const rating=parseInt(ratingGroup.dataset.value||'0',10); const note=(notesEl.value||'').trim();
  if(sIdx==='') return alert('Choose a student'); if(!subj) return alert('Choose a subject'); if(stdIdx==='') return alert('Choose a standard'); if(!rating) return alert('Pick 1–5');
  const std = getStandardsForSubject(subj)[stdIdx];
  const subskill = (subIdx==='') ? '' : (std.subskills||[])[subIdx]||'';
  const rec = {date: dateInput.value, student: STUDENTS[sIdx].name, subject: subj, code: std.code, standard: std.desc, subskill, rating, notes: note};
  RECORDS.push(rec); localStorage.setItem('fl_records', JSON.stringify(RECORDS));
  notesEl.value=''; ratingGroup.dataset.value=''; ratingGroup.querySelectorAll('button').forEach(x=>x.style.borderColor='var(--line)');
  alert('Saved');
}
function renderTable(){
  const fs=(filterStudent.value||'').toLowerCase();
  const fc=(filterCode.value||'').toLowerCase();
  const fsub=(filterSubject.value||'');
  const frat=(filterRating.value||'');
  const rows = RECORDS.filter(r => (!fs || (r.student||'').toLowerCase().includes(fs)) && (!fc || ((r.code+' '+r.standard+' '+(r.subskill||'')).toLowerCase().includes(fc))) && (!fsub || r.subject===fsub) && (!frat || String(r.rating)===frat) );
  tbody.innerHTML = rows.map((r,i)=>`<tr><td>${r.date}</td><td>${r.student}</td><td>${r.subject}</td><td>${r.code}</td><td>${r.standard}</td><td>${r.subskill||''}</td><td>${r.rating}</td><td>${(r.notes||'').replace(/</g,'&lt;')}</td><td><button data-del="${i}">Delete</button></td></tr>`).join('');
}
function renderStudentView(){
  const idx=studentViewSelect.value; const target = (idx===''? null : STUDENTS[idx]?.name); const rows = target? RECORDS.filter(r=>r.student===target) : []; 
  studentTableBody.innerHTML = rows.map((r,i)=>`<tr><td>${r.date}</td><td>${r.subject}</td><td>${r.code}</td><td>${r.standard}</td><td>${r.subskill||''}</td><td>${r.rating}</td><td>${(r.notes||'').replace(/</g,'&lt;')}</td><td><button data-sdel="${i}">Delete</button></td></tr>`).join('');
}

// Actions
document.getElementById('saveBtn').onclick = saveRecord;
document.getElementById('subjectSelect').onchange = renderStandards;
document.getElementById('standardSelect').onchange = renderSubskills;
document.getElementById('standardSearch').oninput = renderStandards;
document.getElementById('studentViewSelect').onchange = renderStudentView;
filterStudent.oninput = renderTable; filterCode.oninput=renderTable; filterSubject.onchange=renderTable; filterRating.onchange=renderTable;

// CSV import
document.getElementById('importStudentsBtn').onclick = async ()=>{
  const fi=document.getElementById('studentCSV'); const f=fi.files[0]; if(!f) return alert('Choose a CSV file with a Name column.');
  const text = await f.text();
  const lines = text.split(/\r?\n/).filter(x=>x.trim().length);
  const header = lines.shift().split(',').map(s=>s.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  if(nameIdx<0) return alert('CSV must include a "Name" column.');
  STUDENTS = lines.map(line=>({name: (line.split(',')[nameIdx]||'').trim()})).filter(x=>x.name);
  localStorage.setItem('fl_students', JSON.stringify(STUDENTS));
  renderStudents(); alert('Students imported: '+STUDENTS.length);
};
document.getElementById('downloadTemplateBtn').onclick = ()=>{
  const rows = ['Name','Ada Lovelace','Alan Turing','Grace Hopper','Katherine Johnson']; const blob = new Blob([rows.join('\n')],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='students_template.csv'; a.click();
};
document.getElementById('addStudentBtn').onclick = ()=>{ const v=(document.getElementById('newStudentName').value||'').trim(); if(!v) return; STUDENTS.push({name:v}); localStorage.setItem('fl_students', JSON.stringify(STUDENTS)); document.getElementById('newStudentName').value=''; renderStudents(); };
document.getElementById('clearStudentsBtn').onclick = ()=>{ if(!confirm('Remove all students on this device?')) return; STUDENTS=[]; localStorage.setItem('fl_students','[]'); renderStudents(); };

// Records table actions
tbody.addEventListener('click', e=>{ const b=e.target.closest('button[data-del]'); if(!b) return; const idx=parseInt(b.getAttribute('data-del')); if(isNaN(idx)) return; RECORDS.splice(idx,1); localStorage.setItem('fl_records', JSON.stringify(RECORDS)); renderTable(); });
studentTableBody.addEventListener('click', e=>{ const b=e.target.closest('button[data-sdel]'); if(!b) return; const idx=parseInt(b.getAttribute('data-sdel')); if(isNaN(idx)) return; const name=STUDENTS[studentViewSelect.value]?.name; const list=RECORDS.filter(r=>r.student===name); const item=list[idx]; const globalIdx=RECORDS.indexOf(item); if(globalIdx>=0){ RECORDS.splice(globalIdx,1); localStorage.setItem('fl_records', JSON.stringify(RECORDS)); renderStudentView(); } });

// Settings
document.getElementById('hideNames').onchange = renderStudents;
document.getElementById('useInitials').onchange = renderStudents;
document.getElementById('saveSb').onclick = ()=>{ const isAdmin=(localStorage.getItem('kv_admin')==='1'); if(!isAdmin) return alert('Only owner can change access settings.'); const url=document.getElementById('sbUrl').value.trim(); const key=document.getElementById('sbKey').value.trim(); localStorage.setItem('kv_supabase_cfg', JSON.stringify({url,key})); alert('Saved. Reloading…'); location.reload(); };

// Init
(function init(){
  document.getElementById('sbUrl').value = "https://pgmxbogkgnpekjoolgte.supabase.co";
  document.getElementById('sbKey').value = "eyJhbG…";
  renderSubjects(); renderStudents(); renderStandards();
})();

if('serviceWorker' in navigator){ window.addEventListener('load', ()=>navigator.serviceWorker.register('./service-worker.js?v=1266a')); }
