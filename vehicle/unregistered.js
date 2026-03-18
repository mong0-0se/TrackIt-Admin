/* ================================================================
   TrackIt — Vehicle Management
   unregistered.js  |  Unregistered devices rendering
   ================================================================ */

// ── RENDER UNREGISTERED DEVICE CARDS ────────────────────────────
function renderUnregistered() {
  const query  = document.getElementById('searchUnregd').value.toLowerCase();
  const banner = document.getElementById('unregisteredAlertBanner');

  // Alert banner
  if (unregistered.length > 0) {
    banner.style.display = 'flex';
    document.getElementById('unregisteredAlertTitle').textContent =
      `${unregistered.length} unregistered device${unregistered.length > 1 ? 's' : ''} detected`;
  } else {
    banner.style.display = 'none';
  }

  // Search filter
  const list = unregistered.filter(d =>
    !query ||
    d.device_id.toLowerCase().includes(query) ||
    (d.device_name || '').toLowerCase().includes(query)
  );

  const grid = document.getElementById('unregisteredGrid');

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon-box"><i class="fa fa-circle-check"></i></div>
        <h3>All devices registered</h3>
        <p>Every GPS device in your account has a vehicle assigned.</p>
      </div>`;
    return;
  }

  // Status colour mapping
  const statusColors = {
    unassigned:   'var(--warn)',
    unregistered: 'var(--accent)',
    registered:   'var(--success)',
    inactive:     'var(--danger)',
  };

  grid.innerHTML = list.map(d => {
    const color = statusColors[d.status] || 'var(--text-muted)';

    return `
      <div class="unregd-card">
        <div class="unregd-header">
          <div class="unregd-icon"><i class="fa fa-mobile-screen"></i></div>
          <span class="unregd-badge"><i class="fa fa-circle-exclamation"></i> No Vehicle</span>
        </div>

        <div class="unregd-id">${d.device_id}</div>
        <div class="unregd-meta">${d.device_name || 'No name'}</div>

        <div class="unregd-info">
          <div class="info-item">
            <span class="info-label">GPS Status</span>
            <span class="info-value" style="color:${color};font-weight:700">
              ${d.status || '—'}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Last updated</span>
            <span class="info-value" style="color:var(--text-second)">
              ${d.updated_at ? timeAgo(d.updated_at) : '—'}
            </span>
          </div>
        </div>

        <div class="unregd-actions">
          <button class="cb-warn"
            onclick="openRegisterFromDevice('${d.id}','${d.device_id.replace(/'/g, "\\'")}')">
            <i class="fa fa-bus"></i> Assign to Vehicle
          </button>
        </div>
      </div>`;
  }).join('');
}
