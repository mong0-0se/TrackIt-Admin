/* ================================================================
   TrackIt — Vehicle Management
   vehicles.js  |  Tab filter, search, and vehicle card rendering
   ================================================================ */

// ── TAB SWITCHING ────────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
}

// ── STATUS FILTER ────────────────────────────────────────────────
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderVehicles();
}

// ── RENDER VEHICLE CARDS ─────────────────────────────────────────
function renderVehicles() {
  const query = document.getElementById('searchInput').value.toLowerCase();

  const list = vehicles.filter(v => {
    if (currentFilter !== 'all' && v.status !== currentFilter) return false;
    if (query &&
        !v.vehicle_name.toLowerCase().includes(query) &&
        !v.plate_number.toLowerCase().includes(query)) return false;
    return true;
  });

  const grid = document.getElementById('vehiclesGrid');

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon-box"><i class="fa fa-bus"></i></div>
        <h3>No vehicles found</h3>
        <p>${vehicles.length
          ? 'Try adjusting your search or filter.'
          : 'Click "Add Vehicle" to get started.'}</p>
      </div>`;
    return;
  }

  const statusLabel = {
    available:      'Available',
    in_service:     'In Service',
    maintenance:    'Maintenance',
    out_of_service: 'Out of Service',
  };

  grid.innerHTML = list.map(v => {
    const driver = drivers.find(d => d.id === v.driver_id);
    const route  = routes.find(r => r.id === v.route_id);
    const gps    = gpsDevices.find(g => g.vehicle_id === v.id);

    const driverHtml = driver
      ? `<span class="driver-tag"><i class="fa fa-id-badge"></i> ${driver.name}</span>`
      : '<span class="no-tag">No driver</span>';

    const routeHtml = route
      ? `<span class="route-tag"><i class="fa fa-route"></i> ${route.route_name}</span>`
      : '<span class="no-tag">No route</span>';

    const gpsId = gps
      ? (gps.device_id.length > 14 ? gps.device_id.slice(0, 14) + '…' : gps.device_id)
      : null;
    const gpsHtml = gps
      ? `<span class="device-tag"><i class="fa fa-satellite-dish"></i> ${gpsId}</span>`
      : '<span class="no-tag">No GPS</span>';

    return `
      <div class="vehicle-card">
        <div class="card-strip strip-${v.status}"></div>

        <div class="card-header">
          <div class="card-icon-wrap">
            <div class="card-icon"><i class="fa fa-bus"></i></div>
            <div>
              <div class="card-plate">${v.plate_number}</div>
              <div class="card-name">${v.vehicle_name}</div>
            </div>
          </div>
          <span class="status-badge badge-${v.status}">
            ${statusLabel[v.status] || v.status}
          </span>
        </div>

        <div class="card-info">
          <div class="info-item">
            <span class="info-label">Driver</span>
            <span class="info-value">${driverHtml}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Route</span>
            <span class="info-value">${routeHtml}</span>
          </div>
          <div class="info-item">
            <span class="info-label">GPS Device</span>
            <span class="info-value">${gpsHtml}</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="card-btn cb-primary" onclick="openEditModal('${v.id}')">
            <i class="fa fa-pen"></i> Edit
          </button>
          <button class="card-btn cb-danger"
            onclick="openDeleteConfirm('${v.id}','${v.plate_number.replace(/'/g, "\\'")}')">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}
