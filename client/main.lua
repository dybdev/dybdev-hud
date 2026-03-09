-- dybdev-hud | client/main.lua
-- Main client entry point

local QBX = exports.qbx_core

-- ==========================================
-- STATE
-- ==========================================
local State = {
    hudVisible  = Config.HUD.Enabled,
    inVehicle   = false,
    vehicle     = nil,
    vehicleType = nil,  -- 'car','boat','aircraft','bicycle','train'
    playerData  = {},
    positions   = table.clone(Config.HUD.Positions),
    showElements = table.clone(Config.HUD.Show),
}

-- ==========================================
-- UTILS
-- ==========================================
local function SendNUI(event, data)
    SendNUIMessage({ type = event, data = data })
end

local function GetPlayerData()
    return QBX:GetPlayerData()
end

-- ==========================================
-- STARTUP
-- ==========================================
AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    Wait(500) -- let qbx_core initialise
    local pd = GetPlayerData()

    SendNUI('init', {
        config       = Config,
        playerData   = pd,
        positions    = State.positions,
        showElements = State.showElements,
    })
end)

-- ==========================================
-- QBX CORE EVENTS
-- ==========================================
RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    local pd = GetPlayerData()
    State.playerData = pd
    SendNUI('playerLoaded', { playerData = pd })
    SetHudVisible(true)
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
    SendNUI('playerUnloaded', {})
    SetHudVisible(false)
end)

RegisterNetEvent('QBCore:Player:SetPlayerData', function(data)
    State.playerData = data
    SendNUI('playerDataUpdate', { playerData = data })
end)

-- ==========================================
-- TOGGLE HUD
-- ==========================================
function SetHudVisible(visible)
    State.hudVisible = visible
    SendNUI('toggleHUD', { visible = visible })
    -- Also hide the native GTA HUD when ours is active
    DisplayHud(not visible)
    DisplayRadar(not visible)
end

RegisterCommand('hud', function()
    SetHudVisible(not State.hudVisible)
end, false)

-- ==========================================
-- VEHICLE TYPE DETECTION
-- ==========================================
local BICYCLE_MODELS = {
    GetHashKey('BMX'),
    GetHashKey('CRUISER'),
    GetHashKey('FIXTER'),
    GetHashKey('SCORCHER'),
    GetHashKey('TRIBIKE'),
    GetHashKey('TRIBIKE2'),
    GetHashKey('TRIBIKE3'),
    GetHashKey('INDUCTOR'),
}

local TRAIN_MODELS = {
    GetHashKey('FREIGHT'),
    GetHashKey('FREIGHTCAR'),
    GetHashKey('FREIGHTCONT1'),
    GetHashKey('FREIGHTCONT2'),
    GetHashKey('FREIGHTGRAIN'),
    GetHashKey('METROTRAIN'),
    GetHashKey('TANKERCAR'),
    GetHashKey('TRFLAT'),
}

local function GetVehicleType(veh)
    if not DoesEntityExist(veh) then return nil end
    local model = GetEntityModel(veh)
    for _, hash in ipairs(BICYCLE_MODELS) do
        if hash == model then return 'bicycle' end
    end
    for _, hash in ipairs(TRAIN_MODELS) do
        if hash == model then return 'train' end
    end
    local vType = GetVehicleType(veh)
    if vType == 'boat' then return 'boat' end
    if vType == 'plane' or vType == 'helicopter' then return 'aircraft' end
    return 'car'
end

-- ==========================================
-- MAIN TICK
-- ==========================================
CreateThread(function()
    while true do
        local sleep = 500
        local ped   = PlayerPedId()
        local inVeh = IsPedInAnyVehicle(ped, false)

        if inVeh ~= State.inVehicle then
            State.inVehicle = inVeh
            if inVeh then
                State.vehicle     = GetVehiclePedIsIn(ped, false)
                State.vehicleType = GetVehicleType(State.vehicle)
                SendNUI('enterVehicle', { vehicleType = State.vehicleType })
                sleep = 100
            else
                State.vehicle     = nil
                State.vehicleType = nil
                SendNUI('exitVehicle', {})
            end
        end

        if inVeh then
            sleep = 100
        end

        Wait(sleep)
    end
end)

-- ==========================================
-- EXPORTS
-- ==========================================
exports('SetHudVisible', SetHudVisible)
exports('GetHudVisible', function() return State.hudVisible end)
exports('SetShowElement', function(element, visible)
    State.showElements[element] = visible
    SendNUI('toggleElement', { element = element, visible = visible })
end)
