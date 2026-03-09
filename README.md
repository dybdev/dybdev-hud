# dybdev-hud

**Arc Raiders–inspired HUD for FiveM QBox Framework**

A feature-rich, fully customisable HUD resource built for the [qbx_core](https://github.com/Qbox-project/qbx_core) framework.  
Inspired by the clean, sci-fi aesthetic of *Arc Raiders*.

---

## Preview

> Dark translucent panels · Cyan/teal accent glow · Segmented RPM bar · Arc speedometer · Angular corners

---

## Features

| Category | Details |
|---|---|
| **Player Info** | Name, ID, job/grade, cash & bank balance |
| **Status HUD** | Health · Armor · Stamina · Hunger · Thirst · Stress · Oxygen (underwater) |
| **Vehicle HUD** | Arc speedometer · Gear · RPM segments · Fuel bar · Engine health · Doors · Indicators · Seatbelt · NOS · Vehicle name |
| **Boat HUD** | Speed · Heading · Water depth · Anchor status · Fuel |
| **Aircraft HUD** | Speed · Altitude · Vertical speed · Heading · Gear state · G-Force · Throttle bar · Fuel |
| **Bicycle HUD** | Speed · Cadence (simulated) · Stamina · Session distance |
| **Train HUD** | Speed · Direction · Signal (green/yellow/red) · Next station · At-station display · Passenger count |
| **Compass** | Animated canvas compass bar · Cardinal direction · Street name · Zone area |
| **Wanted Level** | Star indicators that glow on wanted level |
| **Voice Indicator** | Talking animation · Proximity range display (pma-voice / saltychat / mumble-voip) |
| **Vehicle Control Panel** | Toggleable overlay — engine, lights, hazards, indicators, door lock, hood, trunk |
| **HUD Editor** | Drag & drop repositioning · Element toggles · Accent colour presets & custom picker · Speed unit toggle · Preview mode with live fake data · Save / Reset to defaults |

---

## Dependencies

| Resource | Required |
|---|---|
| [qbx_core](https://github.com/Qbox-project/qbx_core) | ✅ Required |
| [ox_lib](https://github.com/overextended/ox_lib) | ✅ Required |
| LegacyFuel / ox_fuel / ps-fuel | ⚡ Optional (auto-detected) |
| pma-voice / saltychat / mumble-voip | 🎙️ Optional |

---

## Installation

1. Clone or download this resource into your `resources/` folder:
   ```
   resources/[scripts]/dybdev-hud/
   ```
2. Add to `server.cfg`:
   ```cfg
   ensure dybdev-hud
   ```
3. Configure `config.lua` to your liking.
4. Restart your server or use `refresh` + `ensure dybdev-hud`.

---

## Configuration

Edit `config.lua` to adjust:

- **`Config.HUD.Positions`** – default X/Y positions (% of screen) for each panel
- **`Config.HUD.Show`** – which elements are visible by default
- **`Config.Vehicle.SpeedUnit`** – `'mph'` or `'kmh'`
- **`Config.Colors`** – accent and bar colours (hex strings)
- **`Config.Editor.OpenKey`** – keyboard key to open the HUD Editor (default: `F5`)

All editor changes are persisted via `SetResourceKvp` (client-side storage), overriding `config.lua` defaults.

---

## Commands

| Command | Description |
|---|---|
| `/hud` | Toggle HUD visibility |
| `/hudeditor` or `F5` | Open the in-game HUD Editor |
| `/seatbelt` or `B` | Toggle seatbelt (also mapped to key binding) |
| `/resetbikedist` | Reset bicycle session distance |

---

## HUD Editor Usage

1. Press **F5** (or `/hudeditor`) to open the editor.
2. **Drag** any HUD panel to reposition it.
3. Use the **Elements** panel to show/hide individual elements.
4. Pick an **Accent Color** from presets or the custom colour picker.
5. Switch between **MPH / KM/H**.
6. Enable **Preview** to see live fake data while editing.
7. Click **SAVE** to persist your layout.
8. Click **RESET** to restore all defaults.

---

## Exports

```lua
-- Client-side
exports['dybdev-hud']:SetHudVisible(true/false)
exports['dybdev-hud']:GetHudVisible()
exports['dybdev-hud']:SetShowElement('health', true/false)
exports['dybdev-hud']:OpenHudEditor()
exports['dybdev-hud']:CloseHudEditor()
exports['dybdev-hud']:IsHudEditorOpen()
```

---

## License

MIT © dybdev
