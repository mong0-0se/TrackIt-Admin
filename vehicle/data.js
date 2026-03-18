/* ================================================================
   TrackIt — Vehicle Management
   data.js  |  App state, data fetching, badge updates
   ================================================================ */

// ── APP STATE ────────────────────────────────────────────────────
let vehicles     = [];
let routes       = [];
let drivers      = [];
let gpsDevices   = [];
let unregistered = [];

let currentFilter  = 'all';
let editingId      = null;
let prefillGpsId   = null;   // gps_device row id when opening from Unregistered tab
let deleteTargetId = null;

// ── LOAD ALL DATA ────────────────────────────────────────────────
async function loadData() {
  if (!CLIENT_ID) return;

  const chip = document.getElementById('refreshChip');
  chip.classList.add('spinning');

  try {
    const [vRes, dRes, gRes, rRes] = await Promise.all([
      // Vehicles — scoped to this client
      sb.from('vehicle')
        .select('id, vehicle_name, plate_number, status, route_id, driver_id, client_id, created_at, updated_at')
        .eq('client_id', CLIENT_ID)
        .order('created_at', { ascending: false }),

      // Drivers — scoped to this client
      sb.from('driver')
        .select('id, name, contact, status')
        .eq('client_id', CLIENT_ID)
        .order('name'),

      // GPS devices — scoped to this client
      sb.from('gps_device')
        .select('id, device_id, device_name, vehicle_id, status, client_id, updated_at')
        .eq('client_id', CLIENT_ID)
        .order('created_at', { ascending: false }),

      // Routes — shared across all clients (no client_id filter)
      sb.from('routes')
        .select('id, route_name, origin, destination, status')
        .eq('status', 'active')
        .order('route_name'),
    ]);

    if (vRes.error) throw vRes.error;
    if (dRes.error) throw dRes.error;
    if (gRes.error) throw gRes.error;
    if (rRes.error) throw rRes.error;

    vehicles   = vRes.data || [];
    drivers    = dRes.data || [];
    gpsDevices = gRes.data || [];
    routes     = rRes.data || [];

    // Unregistered = this client's devices that have no vehicle linked yet
    unregistered = gpsDevices.filter(g => !g.vehicle_id);

    updateBadges();
    renderVehicles();
    renderUnregistered();
  } catch (e) {
    console.error(e);
    showToast('Error: ' + e.message, 'error');
  }

  chip.classList.remove('spinning');
}

// ── BADGE COUNTS ─────────────────────────────────────────────────
function updateBadges() {
  const counts = { all: vehicles.length, available: 0, in_service: 0, maintenance: 0, out_of_service: 0 };
  vehicles.forEach(v => { if (counts[v.status] !== undefined) counts[v.status]++; });

  Object.entries(counts).forEach(([key, n]) => {
    const el = document.getElementById('badge-' + key);
    if (el) el.textContent = n;
  });

  document.getElementById('tab-badge-vehicles').textContent     = vehicles.length;
  document.getElementById('tab-badge-unregistered').textContent = unregistered.length;
}
