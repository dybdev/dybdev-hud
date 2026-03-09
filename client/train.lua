-- dybdev-hud | client/train.lua
-- Train HUD Manager

local function SendNUI(event, data)
    SendNUIMessage({ type = event, data = data })
end

-- ==========================================
-- TRAIN MODEL HASHES
-- ==========================================
local TRAIN_MODELS = {
    [GetHashKey('FREIGHT')]      = true,
    [GetHashKey('FREIGHTCAR')]   = true,
    [GetHashKey('FREIGHTCONT1')] = true,
    [GetHashKey('FREIGHTCONT2')] = true,
    [GetHashKey('FREIGHTGRAIN')] = true,
    [GetHashKey('METROTRAIN')]   = true,
    [GetHashKey('TANKERCAR')]    = true,
    [GetHashKey('TRFLAT')]       = true,
}

local function IsTrain(veh)
    return TRAIN_MODELS[GetEntityModel(veh)] == true
end

-- ==========================================
-- STATION DATA
-- (approximate positions of GTA train stations)
-- ==========================================
local STATIONS = {
    { name = 'Davis Station',       pos = vector3(104.1,  -1722.4, 29.6)  },
    { name = 'Strawberry Station',  pos = vector3(-312.9, -1474.5, 28.8)  },
    { name = 'Pillbox Hill Station',pos = vector3(373.1,  -610.7,  28.7)  },
    { name = 'Burton Station',      pos = vector3(-273.0, -596.6,  34.4)  },
    { name = 'Del Perro Station',   pos = vector3(-1095.5,-228.5,  37.9)  },
    { name = 'Rockford Hills',      pos = vector3(-654.7, 308.0,   85.7)  },
    { name = 'LSIA Station',        pos = vector3(-1593.4,-603.0,  31.0)  },
    { name = 'Chamberlain Hills',   pos = vector3(26.2,   -1378.3, 29.3)  },
}

local STATION_RADIUS = 80.0  -- metres

local function GetNearestStation(pos)
    local nearest     = nil
    local nearestDist = math.huge
    for _, station in ipairs(STATIONS) do
        local dist = #(pos - station.pos)
        if dist < nearestDist then
            nearestDist = dist
            nearest     = station
        end
    end
    return nearest, nearestDist
end

-- ==========================================
-- TRAIN STATE
-- ==========================================
local trainState = {
    atStation      = false,
    nextStation    = nil,
    currentStation = nil,
    passengers     = 0,
    signal         = 'clear',  -- 'clear' | 'caution' | 'stop'
    direction      = 'FORWARD',
}

-- ==========================================
-- SIGNAL SIMULATION
-- (checks for other train entities nearby)
-- ==========================================
local function GetSignalState(veh, pos)
    local entities = GetGamePool('CVehicle')
    for _, e in ipairs(entities) do
        if e ~= veh and IsTrain(e) then
            local dist = #(GetEntityCoords(e) - pos)
            if dist < 50 then return 'stop'
            elseif dist < 150 then return 'caution'
            end
        end
    end
    return 'clear'
end

-- ==========================================
-- TRAIN TICK
-- ==========================================
CreateThread(function()
    while true do
        local sleep = 500
        local ped   = PlayerPedId()

        if IsPedInAnyVehicle(ped, false) and Config.Train.Enabled then
            local veh = GetVehiclePedIsIn(ped, false)

            if IsTrain(veh) then
                sleep = 200

                local pos         = GetEntityCoords(veh)
                local speedMs     = GetEntitySpeed(veh)
                local speed       = Config.Vehicle.SpeedUnit == 'mph'
                                    and math.floor(speedMs * 2.236936)
                                    or  math.floor(speedMs * 3.6)

                local nearest, dist = GetNearestStation(pos)
                local atStation     = dist < STATION_RADIUS

                trainState.atStation = atStation
                trainState.signal    = GetSignalState(veh, pos)

                if atStation then
                    trainState.currentStation = nearest.name
                else
                    trainState.currentStation = nil
                    trainState.nextStation    = nearest.name
                end

                -- Detect direction: project velocity onto forward vector
                local vel = GetEntityVelocity(veh)
                if #(vel) > 0.5 then
                    local fwd = GetEntityForwardVector(veh)
                    local dot = fwd.x * vel.x + fwd.y * vel.y
                    trainState.direction = (dot >= 0) and 'FORWARD' or 'REVERSE'
                end

                SendNUI('trainUpdate', {
                    speed           = speed,
                    speedUnit       = Config.Vehicle.SpeedUnit,
                    atStation       = trainState.atStation,
                    currentStation  = trainState.currentStation,
                    nextStation     = trainState.nextStation,
                    direction       = trainState.direction,
                    signal          = trainState.signal,
                    passengers      = trainState.passengers,
                })
            end
        end

        Wait(sleep)
    end
end)

-- ==========================================
-- PASSENGER COUNT (simplified)
-- ==========================================
CreateThread(function()
    while true do
        Wait(5000)
        local ped = PlayerPedId()
        if IsPedInAnyVehicle(ped, false) then
            local veh = GetVehiclePedIsIn(ped, false)
            if IsTrain(veh) then
                local count = 0
                for seat = -1, GetVehicleMaxNumberOfPassengers(veh) do
                    if not IsVehicleSeatFree(veh, seat) then
                        count = count + 1
                    end
                end
                trainState.passengers = math.max(0, count - 1)  -- subtract driver
                SendNUI('trainPassengers', { passengers = trainState.passengers })
            end
        end
    end
end)
