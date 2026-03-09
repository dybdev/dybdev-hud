-- dybdev-hud | client/editor.lua
-- In-Game HUD Editor & Preview

local function SendNUI(event, data)
    SendNUIMessage({ type = event, data = data })
end

-- ==========================================
-- STATE
-- ==========================================
local editorOpen    = false
local editorPreview = false

-- ==========================================
-- OPEN / CLOSE EDITOR
-- ==========================================
local function OpenEditor()
    if editorOpen then return end
    editorOpen = true
    SetNuiFocus(true, true)
    SendNUI('openEditor', {
        config       = Config,
        positions    = Config.HUD.Positions,
        showElements = Config.HUD.Show,
        colors       = Config.Colors,
    })
    -- Freeze player while editor is open
    FreezeEntityPosition(PlayerPedId(), true)
end

local function CloseEditor()
    if not editorOpen then return end
    editorOpen = false
    SetNuiFocus(false, false)
    SendNUI('closeEditor', {})
    FreezeEntityPosition(PlayerPedId(), false)
end

RegisterCommand('hudeditor', function()
    if editorOpen then
        CloseEditor()
    else
        OpenEditor()
    end
end, false)

RegisterKeyMapping('hudeditor', 'Open HUD Editor', 'keyboard', Config.Editor.OpenKey)

-- ==========================================
-- NUI CALLBACKS
-- ==========================================

-- Save positions from drag & drop
RegisterNUICallback('savePositions', function(data, cb)
    Config.HUD.Positions = data.positions
    -- Persist via KVP
    SetResourceKvp('hud_positions', json.encode(data.positions))
    cb({ ok = true })
end)

-- Save element visibility
RegisterNUICallback('saveElements', function(data, cb)
    Config.HUD.Show = data.elements
    SetResourceKvp('hud_elements', json.encode(data.elements))
    cb({ ok = true })
end)

-- Save colors
RegisterNUICallback('saveColors', function(data, cb)
    Config.Colors = data.colors
    SetResourceKvp('hud_colors', json.encode(data.colors))
    SendNUI('colorsUpdate', { colors = Config.Colors })
    cb({ ok = true })
end)

-- Save speed unit
RegisterNUICallback('saveSpeedUnit', function(data, cb)
    Config.Vehicle.SpeedUnit = data.unit
    SetResourceKvp('hud_speed_unit', data.unit)
    cb({ ok = true })
end)

-- Reset to defaults
RegisterNUICallback('resetDefaults', function(_, cb)
    DeleteResourceKvp('hud_positions')
    DeleteResourceKvp('hud_elements')
    DeleteResourceKvp('hud_colors')
    DeleteResourceKvp('hud_speed_unit')
    -- Re-read config defaults
    SendNUI('init', {
        config       = Config,
        positions    = Config.HUD.Positions,
        showElements = Config.HUD.Show,
        colors       = Config.Colors,
    })
    cb({ ok = true })
end)

-- Close editor via NUI button
RegisterNUICallback('closeEditor', function(_, cb)
    CloseEditor()
    cb({ ok = true })
end)

-- Toggle preview mode
RegisterNUICallback('togglePreview', function(data, cb)
    editorPreview = data.enabled
    SendNUI('previewMode', { enabled = editorPreview })
    cb({ ok = true })
end)

-- ==========================================
-- LOAD SAVED SETTINGS ON START
-- ==========================================
AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    Wait(600)

    local savedPositions = GetResourceKvpString('hud_positions')
    if savedPositions then
        local ok, decoded = pcall(json.decode, savedPositions)
        if ok and decoded then
            Config.HUD.Positions = decoded
        end
    end

    local savedElements = GetResourceKvpString('hud_elements')
    if savedElements then
        local ok, decoded = pcall(json.decode, savedElements)
        if ok and decoded then
            Config.HUD.Show = decoded
        end
    end

    local savedColors = GetResourceKvpString('hud_colors')
    if savedColors then
        local ok, decoded = pcall(json.decode, savedColors)
        if ok and decoded then
            Config.Colors = decoded
        end
    end

    local savedSpeedUnit = GetResourceKvpString('hud_speed_unit')
    if savedSpeedUnit then
        Config.Vehicle.SpeedUnit = savedSpeedUnit
    end
end)

-- ==========================================
-- EXPORTS
-- ==========================================
exports('OpenHudEditor', OpenEditor)
exports('CloseHudEditor', CloseEditor)
exports('IsHudEditorOpen', function() return editorOpen end)
