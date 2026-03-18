/* ================================================================
   TrackIt — Vehicle Management
   modals.js  |  Add / Edit / Delete modal logic, dropdown population
   ================================================================ */

// ── OPEN MODALS ──────────────────────────────────────────────────

/** Open the Add Vehicle form (blank). */
function openAddModal() {
  editingId    = null;
  prefillGpsId = null;

  document.getElementById('formTitle').textContent   = 'Add Vehicle';
  document.getElementById('inputName').value         = '';
  document.getElementById('inputPlate').value        = '';
  document.getElementById('inputStatus').value       = 'available';
  document.getElementById('devicePreviewBox').style.display = 'none';

  populateDropdowns(null, null, null);
  document.getElementById('formModal').classList.add('active');
}

/** Open the Edit Vehicle form pre-filled with existing data. */
function openEditModal(id) {
  const v = vehicles.find(x => x.id === id);
  if (!v) return;

  editingId    = id;
  prefillGpsId = null;

  document.getElementById('formTitle').textContent   = 'Edit Vehicle';
  document.getElementById('inputName').value         = v.vehicle_name;
  document.getElementById('inputPlate').value        = v.plate_number;
  document.getElementById('inputStatus').value       = v.status;
  document.getElementById('devicePreviewBox').style.display = 'none';

  const linkedGps = gpsDevices.find(g => g.vehicle_id === id);
  populateDropdowns(v.route_id, v.driver_id, linkedGps?.id || null);
  document.getElementById('formModal').classList.add('active');
}

/** Open the Add Vehicle form pre-linked to an unregistered device. */
function openRegisterFromDevice(gpsRowId, deviceId) {
  editingId    = null;
  prefillGpsId = gpsRowId;

  document.getElementById('formTitle').textContent          = 'Assign Vehicle to Device';
  document.getElementById('inputName').value                = '';
  document.getElementById('inputPlate').value               = '';
  document.getElementById('inputStatus').value              = 'available';
  document.getElementById('devicePreviewBox').style.display = 'flex';
  document.getElementById('devicePreviewId').textContent    = deviceId;

  populateDropdowns(null, null, gpsRowId);
  document.getElementById('formModal').classList.add('active');
}

/** Open the delete confirmation dialog. */
function openDeleteConfirm(id, plate) {
  deleteTargetId = id;
  document.getElementById('confirmMsg').textContent =
    `Delete vehicle "${plate}"? This cannot be undone.`;
  document.getElementById('confirmModal').classList.add('active');
}

// ── CLOSE MODALS ─────────────────────────────────────────────────
function closeFormModal()    { document.getElementById('formModal').classList.remove('active'); }
function closeConfirmModal() { document.getElementById('confirmModal').classList.remove('active'); }

// ── POPULATE DROPDOWNS ───────────────────────────────────────────
function populateDropdowns(selectedRoute, selectedDriver, selectedGpsId) {
  // Routes
  const rSel = document.getElementById('inputRoute');
  rSel.innerHTML = '<option value="">— No Route —</option>';
  routes.forEach(r => {
    const o       = document.createElement('option');
    o.value       = r.id;
    o.textContent = r.route_name +
      (r.origin && r.destination ? ` (${r.origin} → ${r.destination})` : '');
    if (r.id === selectedRoute) o.selected = true;
    rSel.appendChild(o);
  });

  // Drivers — exclude those already assigned to another vehicle
  const dSel = document.getElementById('inputDriver');
  dSel.innerHTML = '<option value="">— No Driver —</option>';
  drivers.forEach(d => {
    if (vehicles.find(v => v.driver_id === d.id && v.id !== editingId)) return;
    const o       = document.createElement('option');
    o.value       = d.id;
    o.textContent = d.name + (d.status !== 'available' ? ` (${d.status})` : '');
    if (d.id === selectedDriver) o.selected = true;
    dSel.appendChild(o);
  });

  // GPS devices — exclude those linked to a different vehicle
  const gSel = document.getElementById('inputDevice');
  gSel.innerHTML = '<option value="">— No Device —</option>';
  gpsDevices.forEach(g => {
    if (g.vehicle_id && g.vehicle_id !== editingId) return;
    const o       = document.createElement('option');
    o.value       = g.id;
    o.textContent = g.device_id + (g.device_name ? ` – ${g.device_name}` : '');
    if (g.id === selectedGpsId) o.selected = true;
    gSel.appendChild(o);
  });

  // Pre-select device when coming from the Unregistered tab
  if (prefillGpsId) gSel.value = prefillGpsId;
}

// ── SAVE VEHICLE ─────────────────────────────────────────────────
async function saveVehicle() {
  const name     = document.getElementById('inputName').value.trim();
  const plate    = document.getElementById('inputPlate').value.trim();
  const status   = document.getElementById('inputStatus').value;
  const routeId  = document.getElementById('inputRoute').value  || null;
  const driverId = document.getElementById('inputDriver').value || null;
  const gpsId    = document.getElementById('inputDevice').value || null;

  if (!name)  { showToast('Vehicle name is required', 'error'); return; }
  if (!plate) { showToast('Plate number is required',  'error'); return; }

  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-circle-notch fa-spin"></i> Saving…';

  try {
    const now     = new Date().toISOString();
    const payload = {
      vehicle_name: name, plate_number: plate,
      status, route_id: routeId, driver_id: driverId,
      client_id: CLIENT_ID, updated_at: now,
    };
    let vehicleId = editingId;

    if (editingId) {
      // Only update vehicles belonging to this client
      const { error } = await sb.from('vehicle')
        .update(payload)
        .eq('id', editingId)
        .eq('client_id', CLIENT_ID);
      if (error) throw error;
      showToast('Vehicle updated!');
    } else {
      const { data, error } = await sb.from('vehicle')
        .insert([{ id: crypto.randomUUID(), ...payload, created_at: now }])
        .select('id')
        .single();
      if (error) throw error;
      vehicleId = data.id;
      showToast('Vehicle added!');
    }

    // Unlink any previously linked GPS device (if a different one was chosen)
    if (editingId) {
      await sb.from('gps_device')
        .update({ vehicle_id: null, updated_at: now })
        .eq('vehicle_id', vehicleId)
        .eq('client_id', CLIENT_ID)
        .neq('id', gpsId || '00000000-0000-0000-0000-000000000000');
    }

    // Link the selected device to this vehicle
    if (gpsId) {
      await sb.from('gps_device')
        .update({ vehicle_id: vehicleId, updated_at: now })
        .eq('id', gpsId)
        .eq('client_id', CLIENT_ID);
    }

    closeFormModal();
    await loadData();
  } catch (e) {
    console.error(e);
    showToast('Error: ' + e.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fa fa-save"></i> Save';
}

// ── CONFIRM DELETE ────────────────────────────────────────────────
async function confirmDelete() {
  if (!deleteTargetId) return;

  try {
    const now = new Date().toISOString();

    // Unlink any GPS device attached to this vehicle first
    await sb.from('gps_device')
      .update({ vehicle_id: null, updated_at: now })
      .eq('vehicle_id', deleteTargetId)
      .eq('client_id', CLIENT_ID);

    const { error } = await sb.from('vehicle')
      .delete()
      .eq('id', deleteTargetId)
      .eq('client_id', CLIENT_ID);
    if (error) throw error;

    showToast('Vehicle deleted');
    closeConfirmModal();
    await loadData();
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error');
  }

  deleteTargetId = null;
}
