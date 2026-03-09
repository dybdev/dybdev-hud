-- dybdev-hud | client/bicycle.lua
-- Bicycle Speedometer & HUD

local function clamp(v, lo, hi)
    return math.max(lo, math.min(hi, v))
end

local function SendNUI(event, data)
    SendNUIMessage({ type = event, data = data })
end

-- ==========================================
-- BICYCLE MODEL HASHES
-- ==========================================
local BICYCLE_MODELS = {
    [GetHashKey('BMX')]      = true,
    [GetHashKey('CRUISER')]  = true,
    [GetHashKey('FIXTER')]   = true,
    [GetHashKey('SCORCHER')] = true,
    [GetHashKey('TRIBIKE')]  = true,
    [GetHashKey('TRIBIKE2')] = true,
    [GetHashKey('TRIBIKE3')] = true,
    [GetHashKey('INDUCTOR')] = true,
}

local function IsBicycle(veh)
    return BICYCLE_MODELS[GetEntityModel(veh)] == true
end

-- ==========================================
-- SESSION DISTANCE TRACKER
-- ==========================================
local totalDistance = 0.0
local lastPos       = nil

local function UpdateDistance(pos)
    if lastPos then
        totalDistance = totalDistance + #(pos - lastPos)
    end
    lastPos = pos
end

-- ==========================================
-- CADENCE SIMULATION
-- (GTA doesn't have real cadence; simulate from speed)
-- ==========================================
local function SimulateCadence(speedKph)
    -- Typical cycling cadence: 60-100 RPM proportional to speed
    if speedKph < 1 then return 0 end
    local cadence = math.floor(60 + (speedKph / 30.0) * 40)
    return math.min(cadence, 120)
end

-- ==========================================
-- BICYCLE TICK
-- ==========================================
CreateThread(function()
    while true do
        local sleep = 500
        local ped   = PlayerPedId()

        if IsPedInAnyVehicle(ped, false) and Config.Bicycle.Enabled then
            local veh = GetVehiclePedIsIn(ped, false)

            if IsBicycle(veh) then
                sleep = 100

                local pos       = GetEntityCoords(veh)
                local speedMs   = GetEntitySpeed(veh)
                local speedKph  = speedMs * 3.6
                local speedMph  = speedMs * 2.236936

                UpdateDistance(pos)

                local cadence   = SimulateCadence(speedKph)

                -- Stamina (remaining sprint = cycling endurance)
                local stamina   = math.clamp(GetPlayerSprintStaminaRemaining(PlayerId()), 0, 100)

                -- Distance in km or miles
                local distKm    = math.floor(totalDistance / 10) / 100
                local distMi    = distKm * 0.621371

                SendNUI('bicycleUpdate', {
                    speed     = Config.Vehicle.SpeedUnit == 'mph' and math.floor(speedMph) or math.floor(speedKph),
                    speedUnit = Config.Vehicle.SpeedUnit,
                    cadence   = cadence,
                    stamina   = stamina,
                    distance  = Config.Vehicle.SpeedUnit == 'mph' and distMi or distKm,
                    distUnit  = Config.Vehicle.SpeedUnit == 'mph' and 'mi' or 'km',
                    model     = GetDisplayNameFromVehicleModel(GetEntityModel(veh)),
                })
            end
        else
            -- Reset distance tracking when off bicycle
            lastPos = nil
        end

        Wait(sleep)
    end
end)

-- ==========================================
-- RESET DISTANCE COMMAND
-- ==========================================
RegisterCommand('resetbikedist', function()
    totalDistance = 0.0
    lastPos       = nil
    SendNUI('bicycleDistanceReset', {})
    lib.notify({ title = locale('bike_distance_reset'), type = 'inform' })
end, false)
