/**
 * dybdev-hud | html/js/vehicle.js
 * Vehicle HUD: speedometer, fuel, RPM, doors, boat, aircraft, bicycle, train
 */

'use strict';

const Vehicle = (() => {
  // ========================================
  // CONSTANTS
  // ========================================
  const SPEEDO_MAX_SPEED = {
    mph: 160,
    kmh: 260,
  };
  // Arc path total length ~283 for our speedo arc
  const ARC_LENGTH = 283;

  // ========================================
  // RPM SEGMENT BUILDER
  // ========================================
  let rpmSegCount = 20;

  function buildRPMSegments(count) {
    rpmSegCount = count;
    const wrap = document.getElementById('rpm-segments');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const seg = document.createElement('div');
      seg.classList.add('rpm-seg');
      seg.dataset.index = i;
      wrap.appendChild(seg);
    }
  }

  function updateRPMSegments(pct) {
    const segs = document.querySelectorAll('.rpm-seg');
    const active = Math.round((pct / 100) * rpmSegCount);
    segs.forEach((seg, i) => {
      const isActive  = i < active;
      const isRedline = i >= Math.floor(rpmSegCount * 0.8) && isActive;
      seg.classList.toggle('active',  isActive && !isRedline);
      seg.classList.toggle('redline', isRedline);
    });
  }

  // ========================================
  // SPEEDOMETER ARC
  // ========================================
  function updateSpeedArc(speed, unit) {
    const arc = document.getElementById('speedo-arc-active');
    if (!arc) return;
    const max  = SPEEDO_MAX_SPEED[unit] || 160;
    const pct  = clamp(speed / max, 0, 1);
    const dash = pct * ARC_LENGTH;
    arc.style.strokeDasharray = `${dash} ${ARC_LENGTH}`;

    // Color shift at high speed
    if (pct > 0.9)      arc.style.stroke = '#e74c3c';
    else if (pct > 0.75) arc.style.stroke = '#f39c12';
    else                 arc.style.stroke = 'var(--accent)';
  }

  // ========================================
  // MAIN VEHICLE UPDATE
  // ========================================
  function update(data) {
    const vType = data.type;

    if (vType === 'car') updateCar(data);
    else if (vType === 'boat')     updateBoat(data);
    else if (vType === 'aircraft') updateAircraft(data);
  }

  function updateCar(data) {
    // Speed
    const speedEl = document.getElementById('speedo-speed');
    const unitEl  = document.getElementById('speedo-unit');
    if (speedEl) speedEl.textContent = data.speed || 0;
    if (unitEl)  unitEl.textContent  = (data.speedUnit || 'mph').toUpperCase();

    updateSpeedArc(data.speed, data.speedUnit);

    // Gear
    const gearEl = document.getElementById('gear-display');
    if (gearEl) gearEl.textContent = data.gear || '1';

    // RPM
    updateRPMSegments(data.rpm || 0);

    // Fuel
    updateFuel(data.fuel || 0);

    // Engine health indicator
    const engIndicator = document.getElementById('engine-indicator');
    if (engIndicator) engIndicator.classList.toggle('active', (data.engineHealth || 100) < 30);

    // Lights
    if (data.lights) updateLights(data.lights);

    // Doors
    if (data.doors) updateDoors(data.doors);

    // Seatbelt
    const sbIndicator = document.getElementById('seatbelt-indicator');
    if (sbIndicator) sbIndicator.classList.toggle('active', !data.seatbelt);

    // Vehicle name
    const nameEl = document.getElementById('vehicle-name');
    if (nameEl && data.name) nameEl.textContent = data.name;
  }

  function updateFuel(pct) {
    const bar = document.getElementById('fuel-bar');
    const val = document.getElementById('fuel-val');
    pct = clamp(Math.round(pct), 0, 100);
    if (bar) {
      bar.style.width = pct + '%';
      bar.classList.toggle('low',   pct < 20 && pct >= 10);
      bar.classList.toggle('empty', pct < 10);
    }
    if (val) val.textContent = pct + '%';
  }

  function updateLights(lights) {
    const left  = document.getElementById('left-indicator');
    const right = document.getElementById('right-indicator');

    if (left)  {
      left.classList.toggle('active',   lights.left   && !lights.hazard);
      left.classList.toggle('blinking', lights.left   || lights.hazard);
    }
    if (right) {
      right.classList.toggle('active',   lights.right  && !lights.hazard);
      right.classList.toggle('blinking', lights.right  || lights.hazard);
    }
  }

  function updateDoors(doors) {
    const idMap = ['door-fl', 'door-fr', 'door-rl', 'door-rr', 'door-hood', 'door-trunk'];
    doors.forEach((door, i) => {
      const el = document.getElementById(idMap[i]);
      if (el) el.classList.toggle('open', door.open);
    });
  }

  function updateSeatbelt(data) {
    const sb = document.getElementById('seatbelt-indicator');
    if (sb) sb.classList.toggle('active', !data.fastened);
  }

  // ========================================
  // BOAT UPDATE
  // ========================================
  function updateBoat(data) {
    // Use main vehicle HUD speedometer for speed
    const speedEl = document.getElementById('speedo-speed');
    const unitEl  = document.getElementById('speedo-unit');
    if (speedEl) speedEl.textContent = data.speed || 0;
    if (unitEl)  unitEl.textContent  = (data.speedUnit || 'mph').toUpperCase();
    updateSpeedArc(data.speed, data.speedUnit);
    updateFuel(data.fuel || 0);

    // Boat extra panel
    const headingEl = document.getElementById('boat-heading');
    const depthEl   = document.getElementById('boat-depth');
    const anchorEl  = document.getElementById('boat-anchor');
    if (headingEl) headingEl.textContent = pad(data.heading || 0, 3) + '°';
    if (depthEl)   depthEl.textContent   = (data.depth || 0) + 'm';
    if (anchorEl)  anchorEl.textContent  = data.anchored ? 'ANCHORED' : 'RELEASED';
    if (anchorEl)  anchorEl.classList.toggle('accent', data.anchored);
  }

  // ========================================
  // AIRCRAFT UPDATE
  // ========================================
  function updateAircraft(data) {
    const speedEl = document.getElementById('speedo-speed');
    const unitEl  = document.getElementById('speedo-unit');
    if (speedEl) speedEl.textContent = data.speed || 0;
    if (unitEl)  unitEl.textContent  = (data.speedUnit || 'mph').toUpperCase();
    updateSpeedArc(data.speed, data.speedUnit);
    updateFuel(data.fuel || 0);

    // Aircraft extra panel
    const altEl      = document.getElementById('aircraft-alt');
    const vsEl       = document.getElementById('aircraft-vs');
    const hdgEl      = document.getElementById('aircraft-heading');
    const gearEl     = document.getElementById('aircraft-gear');
    const gforceEl   = document.getElementById('aircraft-gforce');
    const throttleEl = document.getElementById('aircraft-throttle');
    const throttleBar= document.getElementById('throttle-bar');

    if (altEl)      altEl.textContent      = (data.altitude || 0) + 'm';
    if (vsEl)       vsEl.textContent       = (data.vertSpeed || 0) + ' fpm';
    if (hdgEl)      hdgEl.textContent      = pad(data.heading || 0, 3) + '°';
    if (gearEl)     gearEl.textContent     = data.gearDown ? 'DOWN' : 'UP';
    if (gearEl)     gearEl.classList.toggle('accent', data.gearDown);
    if (gforceEl)   gforceEl.textContent   = (data.gforce || 1.0).toFixed(1) + 'G';
    if (throttleEl) throttleEl.textContent = (data.throttle || 0) + '%';
    if (throttleBar) throttleBar.style.height = (data.throttle || 0) + '%';
  }

  // ========================================
  // BICYCLE UPDATE
  // ========================================
  function updateBicycle(data) {
    const speedEl   = document.getElementById('bicycle-speed');
    const unitEl    = document.getElementById('bicycle-unit');
    const cadEl     = document.getElementById('bicycle-cadence');
    const staminaBar= document.getElementById('bicycle-stamina-bar');
    const distEl    = document.getElementById('bicycle-distance');

    if (speedEl) speedEl.textContent = data.speed || 0;
    if (unitEl)  unitEl.textContent  = (data.speedUnit || 'mph').toUpperCase();
    if (cadEl)   cadEl.textContent   = (data.cadence || 0) + ' RPM';
    if (staminaBar) staminaBar.style.width = (data.stamina || 100) + '%';
    if (distEl)  distEl.textContent  = ((data.distance || 0).toFixed(2)) + ' ' + (data.distUnit || 'km');
  }

  function resetBikeDistance() {
    const distEl = document.getElementById('bicycle-distance');
    if (distEl) distEl.textContent = '0.00 km';
  }

  // ========================================
  // TRAIN UPDATE
  // ========================================
  function updateTrain(data) {
    const speedEl   = document.getElementById('train-speed');
    const unitEl    = document.getElementById('train-unit');
    const dirEl     = document.getElementById('train-direction');
    const nextEl    = document.getElementById('train-next-station');
    const curEl     = document.getElementById('train-cur-station');
    const atRow     = document.getElementById('train-at-station-row');
    const sigLabel  = document.getElementById('signal-label');

    if (speedEl) speedEl.textContent = data.speed || 0;
    if (unitEl)  unitEl.textContent  = (data.speedUnit || 'mph').toUpperCase();
    if (dirEl)   dirEl.textContent   = data.direction === 'REVERSE' ? 'REV' : 'FWD';

    if (nextEl)  nextEl.textContent  = data.nextStation || '—';
    if (curEl)   curEl.textContent   = data.currentStation || '—';
    if (atRow)   atRow.style.display = data.atStation ? '' : 'none';

    // Signal lights
    const greenLight  = document.getElementById('signal-green');
    const yellowLight = document.getElementById('signal-yellow');
    const redLight    = document.getElementById('signal-red');
    [greenLight, yellowLight, redLight].forEach(l => l && l.classList.remove('active'));

    switch (data.signal) {
      case 'clear':
        if (greenLight)  greenLight.classList.add('active');
        if (sigLabel)    sigLabel.textContent = 'CLEAR';
        break;
      case 'caution':
        if (yellowLight) yellowLight.classList.add('active');
        if (sigLabel)    sigLabel.textContent = 'CAUTION';
        break;
      case 'stop':
        if (redLight)    redLight.classList.add('active');
        if (sigLabel)    sigLabel.textContent = 'STOP';
        break;
    }
  }

  function updateTrainPassengers(data) {
    const paxEl = document.getElementById('train-passengers');
    if (paxEl) paxEl.textContent = data.passengers || 0;
  }

  // ========================================
  // RETURN
  // ========================================
  return {
    buildRPMSegments,
    update,
    updateSeatbelt,
    updateBicycle,
    resetBikeDistance,
    updateTrain,
    updateTrainPassengers,
  };
})();
