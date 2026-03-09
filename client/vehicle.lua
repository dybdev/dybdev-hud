-- dybdev-hud | client/vehicle.lua
-- Vehicle HUD, Control Panel, Boat & Aircraft additional info

local function SendNUI(event, data)
    SendNUIMessage({ type = event, data = data })
end

-- ==========================================
-- SPEED CONVERSION
-- ==========================================
local function GetSpeed(veh)
    local speedMs = GetEntitySpeed(veh)
    if Config.Vehicle.SpeedUnit == 'mph' then
        return math.floor(speedMs * 2.236936)
    else
        return math.floor(speedMs * 3.6)
    end
end

-- ==========================================
-- FUEL (supports multiple fuel scripts)
-- ==========================================
local function GetFuelLevel(veh)
    -- Try LegacyFuel first
    if GetResourceState('LegacyFuel') == 'started' then
        return exports.LegacyFuel:GetFuel(veh)
    end
    -- Try ox_fuel
    if GetResourceState('ox_fuel') == 'started' then
        return exports.ox_fuel:GetFuel(veh)
    end
    -- Try ps-fuel
    if GetResourceState('ps-fuel') == 'started' then
        return exports['ps-fuel']:GetFuel(veh)
    end
    -- Fallback: native GTA fuel (inaccurate but functional)
    return GetVehicleFuelLevel(veh)
end

-- ==========================================
-- RPM GAUGE (0–1 normalised → 0–100)
-- ==========================================
local function GetRPMPct(veh)
    return math.floor(GetVehicleCurrentRpm(veh) * 100)
end

-- ==========================================
-- ENGINE HEALTH (0–1000 → 0–100)
-- ==========================================
local function GetEngineHealthPct(veh)
    return math.floor(GetVehicleEngineHealth(veh) / 10)
end

-- ==========================================
-- DOORS STATE
-- ==========================================
local DOOR_NAMES = { 'FL', 'FR', 'RL', 'RR', 'Hood', 'Trunk' }
local function GetDoors(veh)
    local doors = {}
    for i = 0, 5 do
        doors[i + 1] = {
            name  = DOOR_NAMES[i + 1],
            open  = IsVehicleDoorFullyOpen(veh, i),
            index = i,
        }
    end
    return doors
end

-- ==========================================
-- LIGHTS / INDICATORS
-- ==========================================
local function GetLightsState(veh)
    local lights, extras, _, _ = GetVehicleLightsState(veh)
    local hazards = IsVehicleExtraLightOn(veh, 0)
    local left, right = GetVehicleIndicatorLights(veh)
    return {
        lights   = lights == 1,
        highBeam = extras == 1,
        left     = left == 1,
        right    = right == 1,
        hazard   = hazards,
    }
end

-- ==========================================
-- GEAR DISPLAY
-- ==========================================
local function GetGearLabel(gear)
    if gear == 0 then return 'R' end
    if gear == 1 then return '1' end
    if gear == 2 then return '2' end
    if gear == 3 then return '3' end
    if gear == 4 then return '4' end
    if gear == 5 then return '5' end
    if gear == 6 then return '6' end
    if gear == 7 then return '7' end
    return tostring(gear)
end

-- ==========================================
-- NOS DETECTION
-- ==========================================
local function HasNOS(veh)
    for i = 0, GetNumVehicleMods(veh) - 1 do
        if GetVehicleMod(veh, i) >= 0 then end
    end
    -- Check for nos mod (type 25 in GTA)
    return GetVehicleMod(veh, 25) >= 0
end

-- ==========================================
-- SEATBELT (simple toggle tracker)
-- ==========================================
local seatbelt = false

RegisterCommand('seatbelt', function()
    seatbelt = not seatbelt
    SendNUI('seatbeltUpdate', { fastened = seatbelt })
    lib.notify({ title = seatbelt and locale('seatbelt_on') or locale('seatbelt_off'), type = 'inform' })
end, false)

RegisterKeyMapping('seatbelt', 'Toggle Seatbelt', 'keyboard', 'b')

-- Reset seatbelt on exit
AddEventHandler('dybdev-hud:exitVehicle', function()
    seatbelt = false
    SendNUI('seatbeltUpdate', { fastened = false })
end)

-- ==========================================
-- CAR HUD TICK
-- ==========================================
local function VehicleCarTick(veh)
    local speed      = GetSpeed(veh)
    local fuel       = math.floor(GetFuelLevel(veh))
    local rpm        = GetRPMPct(veh)
    local gear       = GetCurrentGear(veh)
    local gearLabel  = GetGearLabel(gear)
    local engineHp   = GetEngineHealthPct(veh)
    local lights     = GetLightsState(veh)
    local doors      = GetDoors(veh)

    SendNUI('vehicleUpdate', {
        type        = 'car',
        speed       = speed,
        speedUnit   = Config.Vehicle.SpeedUnit,
        fuel        = fuel,
        rpm         = rpm,
        gear        = gearLabel,
        engineHealth = engineHp,
        lights      = lights,
        doors       = doors,
        seatbelt    = seatbelt,
        name        = GetDisplayNameFromVehicleModel(GetEntityModel(veh)),
    })
end

-- ==========================================
-- BOAT HUD TICK
-- ==========================================
local function VehicleBoatTick(veh)
    local speed   = GetSpeed(veh)
    local fuel    = math.floor(GetFuelLevel(veh))
    local heading = GetEntityHeading(veh)
    heading       = (360 - heading) % 360

    -- Depth under keel (water level)
    local coords  = GetEntityCoords(veh)
    local waterZ  = 0.0
    local hasWater, waterLevel = GetWaterHeight(coords.x, coords.y, coords.z, waterZ)
    local depth   = 0
    if hasWater then
        depth = math.max(0, math.floor((waterLevel or 0) - coords.z))
    end

    -- Anchor: if speed < 1 and engine off treat as anchored
    local anchored = GetIsVehicleEngineRunning(veh) == false and speed < 1

    SendNUI('vehicleUpdate', {
        type     = 'boat',
        speed    = speed,
        speedUnit = Config.Vehicle.SpeedUnit,
        fuel     = fuel,
        heading  = math.floor(heading),
        depth    = depth,
        anchored = anchored,
    })
end

-- ==========================================
-- AIRCRAFT HUD TICK
-- ==========================================
local function VehicleAircraftTick(veh)
    local speed     = GetSpeed(veh)
    local fuel      = math.floor(GetFuelLevel(veh))
    local heading   = GetEntityHeading(veh)
    heading         = (360 - heading) % 360

    local coords    = GetEntityCoords(veh)
    local altitude  = math.floor(coords.z)  -- meters above sea level

    -- Vertical speed
    local vz        = GetEntityVelocity(veh)
    local vertSpeed = math.floor(vz.z * 196.85) -- ft/min

    -- Landing gear state (0=retracted, 1=retracting, 2=extending, 3=extended, 4=broken)
    local gearState = GetLandingGearState(veh)
    local gearDown  = (gearState == 3 or gearState == 4)

    -- G-Force (approximate)
    local gforce = math.abs(GetEntitySpeedVector(veh, true).z) / 9.81
    gforce       = math.floor(gforce * 10) / 10

    -- Throttle (0-1)
    local throttle = GetVehicleThrottleOffset(veh)

    -- Check if helicopter
    local isHeli = IsThisModelAHeli(GetEntityModel(veh))

    SendNUI('vehicleUpdate', {
        type       = 'aircraft',
        isHeli     = isHeli,
        speed      = speed,
        speedUnit  = Config.Vehicle.SpeedUnit,
        fuel       = fuel,
        heading    = math.floor(heading),
        altitude   = altitude,
        vertSpeed  = vertSpeed,
        gearDown   = gearDown,
        gforce     = gforce,
        throttle   = math.floor(throttle * 100),
    })
end

-- ==========================================
-- CONTROL PANEL (NUI callback)
-- ==========================================
RegisterNUICallback('controlPanel', function(data, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if not DoesEntityExist(veh) then cb({}) return end

    local action = data.action
    if action == 'lights' then
        SetVehicleLights(veh, data.state and 2 or 0)
    elseif action == 'hazard' then
        SetVehicleHazardLights(veh, data.state)
    elseif action == 'leftIndicator' then
        SetVehicleIndicatorLights(veh, 1, data.state)
    elseif action == 'rightIndicator' then
        SetVehicleIndicatorLights(veh, 0, data.state)
    elseif action == 'engine' then
        SetVehicleEngineOn(veh, data.state, false, true)
    elseif action == 'lockDoor' then
        SetVehicleDoorsLockedForAllPlayers(veh, data.state)
        SetVehicleDoorsLocked(veh, data.state and 2 or 1)
    elseif action == 'openHood' then
        SetVehicleDoorOpen(veh, 4, false, false)
    elseif action == 'openTrunk' then
        SetVehicleDoorOpen(veh, 5, false, false)
    end
    cb({ ok = true })
end)

-- ==========================================
-- VEHICLE TICK DISPATCHER
-- ==========================================
CreateThread(function()
    while true do
        local sleep = 500
        local ped   = PlayerPedId()

        if IsPedInAnyVehicle(ped, false) then
            sleep     = 100
            local veh = GetVehiclePedIsIn(ped, false)
            local vt  = GetVehicleType(veh)

            if Config.Vehicle.Enabled then
                if vt == 'boat' then
                    if Config.Boat.Enabled then VehicleBoatTick(veh) end
                elseif vt == 'plane' or vt == 'helicopter' then
                    if Config.Aircraft.Enabled then VehicleAircraftTick(veh) end
                else
                    VehicleCarTick(veh)
                end
            end
        end

        Wait(sleep)
    end
end)
