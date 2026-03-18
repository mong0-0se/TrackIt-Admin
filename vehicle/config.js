/* ================================================================
   TrackIt — Vehicle Management
   config.js  |  Supabase client + session initialisation
   ================================================================ */

// ── SUPABASE ─────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://tvbzpdjsyuxiguqrpfag.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YnpwZGpzeXV4aWd1cXJwZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzgxMDgsImV4cCI6MjA4ODM1NDEwOH0.JS04q7iiTPVnGIKS9kCa6sFzl0Cr6ot2rx-jTs9m6dQ';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── SESSION ───────────────────────────────────────────────────────
// Reads the ca_session set by login.html from sessionStorage.
// Exposes CLIENT_ID globally; redirects to login on failure.
let CLIENT_ID = null;

(function initSession() {
  try {
    const raw = sessionStorage.getItem('ca_session');
    if (!raw) throw new Error('No session');

    const s = JSON.parse(raw);
    if (!s.expires_at || new Date(s.expires_at) <= new Date()) throw new Error('Session expired');
    if (s.role !== 'client_admin') throw new Error('Wrong role');
    if (!s.client_id) throw new Error('No client_id');

    CLIENT_ID = s.client_id;
    document.getElementById('clientLabel').textContent =
      `${s.name || 'Admin'} — ${s.email || ''}`;
  } catch (e) {
    // Redirect to login shell if embedded in the full app
    try { window.top.location.href = '../ACCOUNT/login.html'; } catch (_) {}

    document.querySelector('.page').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  min-height:100vh;text-align:center;padding:40px;">
        <div style="font-size:48px;margin-bottom:16px">🔒</div>
        <h2 style="font-size:18px;font-weight:800;margin-bottom:8px">Session Required</h2>
        <p style="font-size:13px;color:#94a3b8">Please log in through the admin portal.</p>
      </div>`;
    return;
  }

  // ── Clock ──────────────────────────────────────────────────────
  const tick = () => {
    document.getElementById('currentTime').textContent =
      new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
  };
  tick();
  setInterval(tick, 1000);

  // ── Initial load + auto-refresh every 30 s ─────────────────────
  loadData();
  setInterval(loadData, 30_000);
})();
