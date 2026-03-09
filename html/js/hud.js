/**
 * dybdev-hud | html/js/hud.js
 * Player HUD: stats, compass, voice, wanted
 */

'use strict';

const HUD = (() => {
  // ========================================
  // DOM REFERENCES
  // ========================================
  const dom = {
    playerName:  () => document.getElementById('player-name'),
    playerId:    () => document.getElementById('player-id'),
    playerJob:   () => document.getElementById('player-job'),
    cashVal:     () => document.getElementById('cash-val'),
    bankVal:     () => document.getElementById('bank-val'),

    healthBar:   () => document.getElementById('health-bar'),
    healthVal:   () => document.getElementById('health-val'),
    armorBar:    () => document.getElementById('armor-bar'),
    armorVal:    () => document.getElementById('armor-val'),
    staminaBar:  () => document.getElementById('stamina-bar'),
    staminaVal:  () => document.getElementById('stamina-val'),
    hungerBar:   () => document.getElementById('hunger-bar'),
    hungerVal:   () => document.getElementById('hunger-val'),
    thirstBar:   () => document.getElementById('thirst-bar'),
    thirstVal:   () => document.getElementById('thirst-val'),
    stressBar:   () => document.getElementById('stress-bar'),
    stressVal:   () => document.getElementById('stress-val'),
    oxygenRow:   () => document.getElementById('bar-oxygen'),
    oxygenBar:   () => document.getElementById('oxygen-bar'),
    oxygenVal:   () => document.getElementById('oxygen-val'),

    compassHeading: () => document.getElementById('compass-heading'),
    compassCard:    () => document.getElementById('compass-cardinal'),
    streetName:     () => document.getElementById('street-name'),
    areaName:       () => document.getElementById('area-name'),
    compassCanvas:  () => document.getElementById('compass-canvas'),

    voicePanel: () => document.getElementById('voice-indicator'),
    voiceRange: () => document.getElementById('voice-range'),

    wantedPanel: () => document.getElementById('wanted-panel'),
    wantedStars: () => document.querySelectorAll('.star'),
  };

  // ========================================
  // COMPASS CANVAS
  // ========================================
  let compassCtx = null;
  const COMPASS_WIDTH  = 400;
  const COMPASS_HEIGHT = 36;
  const DIRECTIONS     = ['N','NE','E','SE','S','SW','W','NW'];
  const DEG_PER_DIR    = 45;

  function buildCompassTicks() {
    const canvas = dom.compassCanvas();
    if (!canvas) return;
    compassCtx = canvas.getContext('2d');
    drawCompass(0);
  }

  function drawCompass(heading) {
    if (!compassCtx) return;
    const ctx = compassCtx;
    const W   = COMPASS_WIDTH;
    const H   = COMPASS_HEIGHT;

    ctx.clearRect(0, 0, W, H);

    // Heading offset: degrees per pixel
    const degPx   = W / 90;   // show 90° at a time
    const startDeg = heading - 45;

    // Draw ticks every 5°
    for (let d = -50; d <= 50; d += 5) {
      const deg    = ((heading + d) % 360 + 360) % 360;
      const x      = W / 2 + d * degPx;
      const isMain = (deg % 45 === 0);
      const isMed  = (deg % 10 === 0);

      const tickH  = isMain ? 18 : isMed ? 12 : 6;
      const alpha  = 1.0 - Math.abs(d) / 55;

      // Color cardinal directions
      const dirIdx = DIRECTIONS.indexOf(getDirLabel(deg));
      if (dirIdx !== -1 && deg % 45 === 0) {
        ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
        ctx.fillStyle   = `rgba(0,212,255,${alpha})`;
      } else {
        ctx.strokeStyle = `rgba(150,200,255,${alpha * 0.5})`;
        ctx.fillStyle   = `rgba(150,200,255,${alpha * 0.7})`;
      }

      ctx.lineWidth = isMain ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, tickH);
      ctx.stroke();

      // Direction labels on main ticks
      if (isMain) {
        const label = getDirLabel(deg);
        ctx.font     = `bold ${isMain && label.length === 1 ? '13' : '10'}px Rajdhani,sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, x, H - 2);
      } else if (isMed) {
        ctx.font     = '9px Share Tech Mono,monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(100,150,200,${alpha * 0.5})`;
        ctx.fillText(deg, x, H - 2);
      }
    }
  }

  function getDirLabel(deg) {
    const normalised = ((deg % 360) + 360) % 360;
    if (normalised >= 337.5 || normalised < 22.5)  return 'N';
    if (normalised < 67.5)   return 'NE';
    if (normalised < 112.5)  return 'E';
    if (normalised < 157.5)  return 'SE';
    if (normalised < 202.5)  return 'S';
    if (normalised < 247.5)  return 'SW';
    if (normalised < 292.5)  return 'W';
    return 'NW';
  }

  // ========================================
  // PUBLIC API
  // ========================================

  function updateStats(data) {
    if (data.health  !== undefined) setBar('health',  data.health);
    if (data.armor   !== undefined) setBar('armor',   data.armor);
    if (data.stamina !== undefined) setBar('stamina', data.stamina);
    if (data.hunger  !== undefined) setBar('hunger',  data.hunger);
    if (data.thirst  !== undefined) setBar('thirst',  data.thirst);
    if (data.stress  !== undefined) setBar('stress',  data.stress);
    if (data.oxygen  !== undefined) {
      setBar('oxygen', data.oxygen);
      // Show oxygen bar only when underwater (< 95%)
      const row = dom.oxygenRow();
      if (row) row.classList.toggle('hidden', data.oxygen >= 95);
    }
  }

  function setBar(name, pct) {
    pct = clamp(Math.round(pct), 0, 100);
    const bar = document.getElementById(`${name}-bar`);
    const val = document.getElementById(`${name}-val`);
    if (bar) bar.style.width = pct + '%';
    if (val) val.textContent = pct;

    // Low-value warnings
    if (bar) {
      bar.classList.toggle('low',   pct < 25 && pct >= 10);
      bar.classList.toggle('empty', pct < 10);
    }
  }

  function updatePlayerInfo(data) {
    if (!data) return;

    // Support both flat and nested structures
    const charinfo = data.charinfo || data;
    const name  = (charinfo.firstname || '') + ' ' + (charinfo.lastname || data.name || 'OPERATOR');
    const id    = data.citizenid || data.id || '------';
    const money = data.money || {};
    const job   = data.job   || {};

    const pName = dom.playerName();
    const pId   = dom.playerId();
    const pJob  = dom.playerJob();
    const cash  = dom.cashVal();
    const bank  = dom.bankVal();

    if (pName) pName.textContent = name.toUpperCase().trim();
    if (pId)   pId.textContent   = '#' + String(id).toUpperCase();
    if (pJob)  pJob.textContent  = (job.label || job || 'CIVILIAN').toUpperCase();
    if (cash)  cash.textContent  = formatMoney(money.cash  || data.cash  || 0);
    if (bank)  bank.textContent  = formatMoney(money.bank  || data.bank  || 0);

    // Also update stats if metadata is present
    const meta = data.metadata || {};
    if (meta.hunger  !== undefined) setBar('hunger',  meta.hunger);
    if (meta.thirst  !== undefined) setBar('thirst',  meta.thirst);
    if (meta.stress  !== undefined) setBar('stress',  meta.stress);
    if (meta.oxygen  !== undefined) setBar('oxygen',  meta.oxygen);
  }

  function updateLocation(data) {
    const sn = dom.streetName();
    const an = dom.areaName();
    if (sn && data.street) sn.textContent = data.street;
    if (an && data.area)   an.textContent = data.area;
    updateCompass(data);
  }

  function updateCompass(data) {
    const h  = data.heading;
    const ch = dom.compassHeading();
    const cc = dom.compassCard();
    if (ch) ch.textContent = pad(h, 3) + '°';
    if (cc) cc.textContent = data.cardinal || getDirLabel(h);
    drawCompass(h);
  }

  function updateOxygen(data) {
    setBar('oxygen', data.oxygen);
    const row = dom.oxygenRow();
    if (row) row.classList.toggle('hidden', data.oxygen >= 95);
  }

  function updateWanted(data) {
    const panel = dom.wantedPanel();
    if (!panel) return;
    panel.classList.toggle('hidden', data.level === 0);
    dom.wantedStars().forEach((star, i) => {
      star.classList.toggle('active', i < data.level);
    });
  }

  function updateVoiceRange(data) {
    const panel = dom.voicePanel();
    const range = dom.voiceRange();
    if (range) range.textContent = data.range;
    if (panel) panel.setAttribute('data-range-dots', '•'.repeat(data.range));
  }

  function updateVoiceTalking(data) {
    const panel = dom.voicePanel();
    if (panel) panel.classList.toggle('talking', data.talking);
  }

  // ========================================
  // RETURN
  // ========================================
  return {
    buildCompassTicks,
    updateStats,
    updatePlayerInfo,
    updateLocation,
    updateCompass,
    updateOxygen,
    updateWanted,
    updateVoiceRange,
    updateVoiceTalking,
  };
})();
