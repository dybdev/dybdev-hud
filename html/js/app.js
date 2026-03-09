/**
 * dybdev-hud | html/js/app.js
 * Main NUI application - message dispatcher & core utilities
 */

'use strict';

// ==========================================
// CONFIG & STATE
// ==========================================
const App = {
  config: {},
  positions: {},
  showElements: {},
  colors: {},
  visible: true,
  inVehicle: false,
  vehicleType: null,
};

// ==========================================
// NUI MESSAGE DISPATCHER
// ==========================================
window.addEventListener('message', (ev) => {
  const { type, data } = ev.data;
  if (!type) return;

  switch (type) {
    // --- Core ---
    case 'init':           onInit(data);              break;
    case 'toggleHUD':      onToggleHUD(data);          break;
    case 'playerLoaded':   onPlayerLoaded(data);       break;
    case 'playerUnloaded': onPlayerUnloaded();         break;

    // --- Player Stats ---
    case 'hudUpdate':      HUD.updateStats(data);      break;
    case 'playerStats':    HUD.updatePlayerInfo(data); break;
    case 'playerDataUpdate': HUD.updatePlayerInfo(data.playerData); break;
    case 'locationUpdate': HUD.updateLocation(data);   break;
    case 'compassUpdate':  HUD.updateCompass(data);    break;
    case 'oxygenUpdate':   HUD.updateOxygen(data);     break;
    case 'wantedUpdate':   HUD.updateWanted(data);     break;
    case 'voiceUpdate':    HUD.updateVoiceRange(data); break;
    case 'voiceTalking':   HUD.updateVoiceTalking(data); break;

    // --- Vehicle ---
    case 'enterVehicle':   onEnterVehicle(data);        break;
    case 'exitVehicle':    onExitVehicle();              break;
    case 'vehicleUpdate':  Vehicle.update(data);         break;
    case 'seatbeltUpdate': Vehicle.updateSeatbelt(data); break;
    case 'bicycleUpdate':  Vehicle.updateBicycle(data);  break;
    case 'bicycleDistanceReset': Vehicle.resetBikeDistance(); break;
    case 'trainUpdate':    Vehicle.updateTrain(data);    break;
    case 'trainPassengers': Vehicle.updateTrainPassengers(data); break;

    // --- Editor ---
    case 'openEditor':     Editor.open(data);     break;
    case 'closeEditor':    Editor.close();        break;
    case 'previewMode':    Editor.setPreview(data.enabled); break;
    case 'colorsUpdate':   onColorsUpdate(data);  break;
    case 'toggleElement':  onToggleElement(data); break;
  }
});

// ==========================================
// INIT
// ==========================================
function onInit(data) {
  App.config       = data.config       || {};
  App.positions    = data.positions    || {};
  App.showElements = data.showElements || {};
  App.colors       = data.colors       || {};

  applyPositions(App.positions);
  applyColors(App.colors);
  applyElementVisibility(App.showElements);

  // Build RPM segments
  Vehicle.buildRPMSegments(20);

  // Build compass ticks
  HUD.buildCompassTicks();
}

// ==========================================
// HUD VISIBILITY
// ==========================================
function onToggleHUD(data) {
  App.visible = data.visible;
  const panels = document.querySelectorAll('#player-info, #voice-indicator, #compass-container, #wanted-panel');
  panels.forEach(el => el.style.opacity = data.visible ? '1' : '0');
}

// ==========================================
// PLAYER LOADED / UNLOADED
// ==========================================
function onPlayerLoaded(data) {
  document.getElementById('player-info').classList.remove('hidden');
  document.getElementById('voice-indicator').classList.remove('hidden');
  document.getElementById('compass-container').classList.remove('hidden');
  HUD.updatePlayerInfo(data.playerData);
}

function onPlayerUnloaded() {
  document.getElementById('player-info').classList.add('hidden');
  document.getElementById('voice-indicator').classList.add('hidden');
  document.getElementById('compass-container').classList.add('hidden');
}

// ==========================================
// VEHICLE ENTER / EXIT
// ==========================================
function onEnterVehicle(data) {
  App.inVehicle   = true;
  App.vehicleType = data.vehicleType;

  // Hide non-vehicle panels
  document.getElementById('player-info').style.display = 'none';

  // Show appropriate HUD
  showVehicleHUD(data.vehicleType);

  // Show control panel toggle
  document.getElementById('cp-toggle').classList.remove('hidden');
}

function onExitVehicle() {
  App.inVehicle   = false;
  App.vehicleType = null;

  // Hide all vehicle HUDs
  hideAllVehicleHUDs();

  // Show player info again
  document.getElementById('player-info').style.display = '';

  // Hide control panel
  document.getElementById('control-panel').classList.add('hidden');
  document.getElementById('cp-toggle').classList.add('hidden');
}

function showVehicleHUD(vType) {
  hideAllVehicleHUDs();
  switch (vType) {
    case 'bicycle':
      document.getElementById('bicycle-hud').classList.remove('hidden');
      break;
    case 'train':
      document.getElementById('train-hud').classList.remove('hidden');
      break;
    case 'boat':
      document.getElementById('vehicle-hud').classList.remove('hidden');
      document.getElementById('boat-hud').classList.remove('hidden');
      break;
    case 'aircraft':
      document.getElementById('vehicle-hud').classList.remove('hidden');
      document.getElementById('aircraft-hud').classList.remove('hidden');
      break;
    default: // car / motorcycle
      document.getElementById('vehicle-hud').classList.remove('hidden');
      break;
  }
}

function hideAllVehicleHUDs() {
  ['vehicle-hud', 'boat-hud', 'aircraft-hud', 'bicycle-hud', 'train-hud'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

// ==========================================
// COLORS
// ==========================================
function applyColors(colors) {
  if (!colors) return;
  const root = document.documentElement;
  if (colors.accent)  root.style.setProperty('--accent',  colors.accent);
  if (colors.accent2) root.style.setProperty('--accent2', colors.accent2);
  if (colors.health)  root.style.setProperty('--health-color',  colors.health);
  if (colors.armor)   root.style.setProperty('--armor-color',   colors.armor);
  if (colors.stamina) root.style.setProperty('--stamina-color', colors.stamina);
  if (colors.hunger)  root.style.setProperty('--hunger-color',  colors.hunger);
  if (colors.thirst)  root.style.setProperty('--thirst-color',  colors.thirst);
  if (colors.stress)  root.style.setProperty('--stress-color',  colors.stress);
  if (colors.oxygen)  root.style.setProperty('--oxygen-color',  colors.oxygen);
  if (colors.fuel)    root.style.setProperty('--fuel-color',    colors.fuel);

  // Update glow var as well
  if (colors.accent) {
    root.style.setProperty('--accent-glow', hexToRgba(colors.accent, 0.4));
  }
}

function onColorsUpdate(data) {
  App.colors = data.colors;
  applyColors(data.colors);
}

// ==========================================
// ELEMENT VISIBILITY
// ==========================================
function applyElementVisibility(elements) {
  if (!elements) return;
  Object.keys(elements).forEach(key => {
    onToggleElement({ element: key, visible: elements[key] });
  });
}

function onToggleElement(data) {
  App.showElements[data.element] = data.visible;
  const el = document.querySelector(`[data-element="${data.element}"]`);
  if (el) el.classList.toggle('hidden', !data.visible);
}

// ==========================================
// POSITIONS
// ==========================================
function applyPositions(positions) {
  if (!positions) return;
  const map = {
    playerInfo: '#player-info',
    vehicle:    '#vehicle-hud',
    compass:    '#compass-container',
  };
  Object.keys(map).forEach(key => {
    const pos = positions[key];
    const el  = document.querySelector(map[key]);
    if (!pos || !el) return;
    el.style.left   = pos.x + '%';
    // Convert stored bottom-% to CSS bottom (subtract estimated panel height %)
    const PANEL_HEIGHT_PCT = 10; // approx panel height as % of screen
    el.style.bottom = (100 - pos.y - PANEL_HEIGHT_PCT) + '%';
    el.style.right  = '';
    el.style.top    = '';
  });
}

// ==========================================
// NUI POST (callback to Lua)
// ==========================================
function nuiPost(endpoint, data) {
  return fetch(`https://${GetParentResourceName()}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data || {}),
  }).then(r => r.json()).catch(() => ({}));
}

// ==========================================
// UTILS
// ==========================================
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function pad(n, w) {
  return String(n).padStart(w, '0');
}

function formatMoney(n) {
  return n.toLocaleString('en-US');
}

// ==========================================
// GetParentResourceName polyfill for dev
// ==========================================
function GetParentResourceName() {
  return window.GetParentResourceName ? window.GetParentResourceName() : 'dybdev-hud';
}

// ==========================================
// CONTROL PANEL TOGGLE
// ==========================================
document.getElementById('cp-toggle').addEventListener('click', () => {
  const panel = document.getElementById('control-panel');
  panel.classList.toggle('hidden');
});

document.getElementById('cp-close').addEventListener('click', () => {
  document.getElementById('control-panel').classList.add('hidden');
});

// Control panel buttons
document.querySelectorAll('.cp-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    let state  = btn.dataset.state === 'true';
    state = !state;
    btn.dataset.state = String(state);
    btn.classList.toggle('active', state);

    nuiPost('controlPanel', { action, state });
  });
});
