
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

async function ownerLogin(){
  const btn=document.getElementById('ownerSubmit'); if(btn) btn.disabled=true;
  setGateErr(''); setGateDbg('Checking…');
  const pw=(document.getElementById('ownerPass').value||'').trim();
  if(!pw){ setGateErr('Enter owner password.'); if(btn) btn.disabled=false; return; }
  const res = await rpc('admin_auth', { pw });
  const s = String(res.data).trim().toLowerCase();
  const ok = res.ok && (s==='true'||s==='t'||s==='1'||s.includes('true')||res.data===true||res.data===1);
  setGateDbg('admin_auth → '+res.status+' '+s);
  if(ok){ localStorage.setItem('kv_admin','1'); localStorage.setItem('kv_access_granted','1'); location.href='index.html'; }
  else  { setGateErr('Owner password incorrect.'); }
  if(btn) btn.disabled=false;
}

document.getElementById('ownerSubmit').addEventListener('click', ownerLogin);
document.getElementById('ownerPass').addEventListener('keydown', e=>{ if(e.key==='Enter') ownerLogin(); });
