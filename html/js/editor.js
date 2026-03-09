/**
 * dybdev-hud | html/js/editor.js
 * In-Game HUD Editor – drag & drop repositioning, element toggles,
 * color presets, speed unit selector, preview mode
 */

'use strict';

const Editor = (() => {
  // ========================================
  // ELEMENT DEFINITIONS
  // ========================================
  const ELEMENTS = [
    { key: 'health',    label: 'Health Bar' },
    { key: 'armor',     label: 'Armor Bar' },
    { key: 'stamina',   label: 'Stamina Bar' },
    { key: 'hunger',    label: 'Hunger Bar' },
    { key: 'thirst',    label: 'Thirst Bar' },
    { key: 'stress',    label: 'Stress Bar' },
    { key: 'oxygen',    label: 'Oxygen Bar' },
    { key: 'voice',     label: 'Voice Indicator' },
    { key: 'compass',   label: 'Compass' },
    { key: 'streetName',label: 'Street Name' },
    { key: 'cash',      label: 'Cash Display' },
    { key: 'bank',      label: 'Bank Display' },
    { key: 'job',       label: 'Job Display' },
    { key: 'id',        label: 'Player ID' },
  ];

  // Draggable panel IDs and their config keys
  const DRAGGABLE_PANELS = [
    { id: 'player-info',       key: 'playerInfo'  },
    { id: 'vehicle-hud',       key: 'vehicle'     },
    { id: 'compass-container', key: 'compass'     },
  ];

  // ========================================
  // STATE
  // ========================================
  let isOpen     = false;
  let isPreview  = false;
  let dragTarget = null;
  let dragOffX   = 0;
  let dragOffY   = 0;
  const localPositions    = {};
  const localElements     = {};
  let localColors         = {};
  let localSpeedUnit      = 'mph';

  // ========================================
  // OPEN EDITOR
  // ========================================
  function open(data) {
    if (isOpen) return;
    isOpen = true;

    // Store working copies
    Object.assign(localPositions, data.positions || App.positions || {});
    Object.assign(localElements,  data.showElements || App.showElements || {});
    localColors    = Object.assign({}, data.colors || App.colors || {});
    localSpeedUnit = (data.config && data.config.Vehicle && data.config.Vehicle.SpeedUnit) || 'mph';

    const overlay = document.getElementById('hud-editor');
    overlay.classList.remove('hidden');

    buildElementsList();
    buildColorPresets();
    syncSpeedUnitButtons();
    enableDrag();

    if (isPreview) enablePreviewData();
  }

  // ========================================
  // CLOSE EDITOR
  // ========================================
  function close() {
    if (!isOpen) return;
    isOpen = false;

    document.getElementById('hud-editor').classList.add('hidden');
    disableDrag();
    disablePreviewData();
  }

  // ========================================
  // ELEMENTS LIST
  // ========================================
  function buildElementsList() {
    const list = document.getElementById('elements-list');
    list.innerHTML = '';

    ELEMENTS.forEach(({ key, label }) => {
      const row = document.createElement('div');
      row.classList.add('element-row');

      const lbl = document.createElement('span');
      lbl.classList.add('element-label');
      lbl.textContent = label;

      const toggleLabel = document.createElement('label');
      toggleLabel.classList.add('toggle-switch');

      const input   = document.createElement('input');
      input.type    = 'checkbox';
      input.checked = localElements[key] !== false;
      input.addEventListener('change', () => {
        localElements[key] = input.checked;
        onToggleElement({ element: key, visible: input.checked });
      });

      const slider = document.createElement('span');
      slider.classList.add('toggle-slider');

      toggleLabel.appendChild(input);
      toggleLabel.appendChild(slider);
      row.appendChild(lbl);
      row.appendChild(toggleLabel);
      list.appendChild(row);
    });
  }

  // ========================================
  // COLOR PRESETS
  // ========================================
  function buildColorPresets() {
    const presets = document.querySelectorAll('.color-preset');
    presets.forEach(preset => {
      preset.addEventListener('click', () => {
        presets.forEach(p => p.classList.remove('selected'));
        preset.classList.add('selected');
        applyAccentColor(preset.dataset.color);
      });
    });

    const customPicker = document.getElementById('custom-color-picker');
    if (customPicker) {
      customPicker.value = localColors.accent || '#00d4ff';
      customPicker.addEventListener('input', () => {
        applyAccentColor(customPicker.value);
      });
    }

    // Mark the currently active preset
    const currentAccent = localColors.accent || '#00d4ff';
    presets.forEach(p => {
      if (p.dataset.color.toLowerCase() === currentAccent.toLowerCase()) {
        p.classList.add('selected');
      }
    });
  }

  function applyAccentColor(hex) {
    localColors.accent = hex;
    // Update custom picker value too
    const picker = document.getElementById('custom-color-picker');
    if (picker) picker.value = hex;
    // Live preview
    applyColors({ ...localColors, accent: hex });
  }

  // ========================================
  // SPEED UNIT
  // ========================================
  function syncSpeedUnitButtons() {
    document.getElementById('su-mph').classList.toggle('active', localSpeedUnit === 'mph');
    document.getElementById('su-kmh').classList.toggle('active', localSpeedUnit === 'kmh');
  }

  document.getElementById('su-mph')?.addEventListener('click', () => {
    localSpeedUnit = 'mph';
    syncSpeedUnitButtons();
  });

  document.getElementById('su-kmh')?.addEventListener('click', () => {
    localSpeedUnit = 'kmh';
    syncSpeedUnitButtons();
  });

  // ========================================
  // SAVE / RESET / CLOSE BUTTONS
  // ========================================
  document.getElementById('editor-save')?.addEventListener('click', saveChanges);
  document.getElementById('editor-reset')?.addEventListener('click', resetDefaults);
  document.getElementById('editor-close')?.addEventListener('click', () => {
    nuiPost('closeEditor', {});
    close();
  });

  document.getElementById('preview-toggle')?.addEventListener('change', (e) => {
    isPreview = e.target.checked;
    if (isPreview) enablePreviewData();
    else           disablePreviewData();
    nuiPost('togglePreview', { enabled: isPreview });
  });

  function saveChanges() {
    // Collect pixel positions → percentage positions
    DRAGGABLE_PANELS.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      localPositions[key] = {
        x: (rect.left / window.innerWidth) * 100,
        y: ((window.innerHeight - rect.bottom) / window.innerHeight) * 100,
      };
    });

    nuiPost('savePositions',  { positions: localPositions  });
    nuiPost('saveElements',   { elements:  localElements   });
    nuiPost('saveColors',     { colors:    localColors     });
    nuiPost('saveSpeedUnit',  { unit:      localSpeedUnit  });

    showSavedToast();
  }

  function resetDefaults() {
    if (!confirm('Reset all HUD settings to defaults?')) return;
    nuiPost('resetDefaults', {});
    close();
  }

  function showSavedToast() {
    const btn = document.getElementById('editor-save');
    if (!btn) return;
    btn.textContent = '✓ SAVED';
    setTimeout(() => {
      // Rebuild button content safely without innerHTML
      btn.textContent = '';
      const svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z');
      svg.appendChild(path);
      btn.appendChild(svg);
      btn.appendChild(document.createTextNode(' SAVE'));
    }, 2000);
  }

  // ========================================
  // DRAG & DROP
  // ========================================
  function enableDrag() {
    DRAGGABLE_PANELS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add('draggable');
      el.addEventListener('mousedown', onDragStart);
    });
  }

  function disableDrag() {
    DRAGGABLE_PANELS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('draggable', 'drag-hover');
      el.removeEventListener('mousedown', onDragStart);
    });
  }

  function onDragStart(e) {
    if (e.button !== 0) return;
    dragTarget = e.currentTarget;
    dragTarget.classList.add('drag-hover');

    const rect = dragTarget.getBoundingClientRect();
    dragOffX   = e.clientX - rect.left;
    dragOffY   = e.clientY - rect.top;

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup',   onDragEnd);
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!dragTarget) return;
    const W  = window.innerWidth;
    const H  = window.innerHeight;
    const el = dragTarget;
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    let newLeft = e.clientX - dragOffX;
    let newTop  = e.clientY - dragOffY;

    // Clamp within viewport
    newLeft = clamp(newLeft, 0, W - elW);
    newTop  = clamp(newTop,  0, H - elH);

    el.style.left   = newLeft + 'px';
    el.style.top    = newTop  + 'px';
    el.style.right  = '';
    el.style.bottom = '';
  }

  function onDragEnd() {
    if (dragTarget) dragTarget.classList.remove('drag-hover');
    dragTarget = null;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup',   onDragEnd);
  }

  // ========================================
  // PREVIEW MODE (fake data injection)
  // ========================================
  let previewInterval = null;

  function enablePreviewData() {
    if (previewInterval) return;
    let tick = 0;

    // Show all vehicle HUDs for preview
    ['vehicle-hud', 'boat-hud', 'aircraft-hud'].forEach(id => {
      document.getElementById(id)?.classList.remove('hidden');
    });
    document.getElementById('player-info')?.classList.remove('hidden');

    previewInterval = setInterval(() => {
      tick++;
      const speed = 60 + Math.round(Math.sin(tick * 0.1) * 40);

      HUD.updateStats({
        health:  Math.max(10, 85 - tick % 20),
        armor:   60,
        stamina: 75,
        hunger:  70,
        thirst:  55,
        stress:  15,
        oxygen:  100,
      });

      HUD.updatePlayerInfo({
        charinfo: { firstname: 'ARC', lastname: 'OPERATOR' },
        citizenid: 'ABC123',
        job: { label: 'Police' },
        money: { cash: 4250, bank: 58000 },
      });

      HUD.updateCompass({ heading: (tick * 2) % 360, cardinal: 'N' });

      Vehicle.update({
        type:         'car',
        speed:        speed,
        speedUnit:    localSpeedUnit,
        fuel:         75,
        rpm:          30 + Math.round(Math.sin(tick * 0.2) * 30),
        gear:         speed < 20 ? '1' : speed < 40 ? '2' : speed < 70 ? '3' : '4',
        engineHealth: 95,
        seatbelt:     true,
        lights:       { left: false, right: false, hazard: false },
        doors:        Array(6).fill({ open: false }),
        name:         'PREVIEW VEHICLE',
      });
    }, 200);
  }

  function disablePreviewData() {
    if (previewInterval) {
      clearInterval(previewInterval);
      previewInterval = null;
    }
    hideAllVehicleHUDs();
  }

  // ========================================
  // SET PREVIEW (from Lua)
  // ========================================
  function setPreview(enabled) {
    isPreview = enabled;
    document.getElementById('preview-toggle').checked = enabled;
    if (enabled) enablePreviewData();
    else         disablePreviewData();
  }

  // ========================================
  // RETURN
  // ========================================
  return {
    open,
    close,
    setPreview,
  };
})();
