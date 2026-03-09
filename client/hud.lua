-- dybdev-hud | client/hud.lua
-- Player Info, Status Bars, Compass, Voice

local QBX = exports.qbx_core

-- ==========================================
-- CACHE
-- ==========================================
local cache = {
    health  = 100,
    armor   = 0,
    stamina = 100,
    hunger  = 100,
    thirst  = 100,
    stress  = 0,
    oxygen  = 100,
    voice   = 0,
    cash    = 0,
    bank    = 0,
    job     = '',
    grade   = '',
    id      = 0,
    name    = '',
    street  = '',
    area    = '',
    heading = 0,
}

-- ==========================================
-- UTILS
-- ==========================================
local function clamp(v, lo, hi)
    return math.max(lo, math.min(hi, v))
end

local function SendNUI(event, data)
    SendNUIMessage({ type = event, data = data })
end

-- ==========================================
-- HEALTH / ARMOR
-- ==========================================
local function GetHealthPct()
    local ped    = PlayerPedId()
    local health = GetEntityHealth(ped) - 100  -- GTA health is 100-200
    return math.clamp(health, 0, 100)
end

local function GetArmorPct()
    local ped = PlayerPedId()
    return math.clamp(GetPedArmour(ped), 0, 100)
end

-- ==========================================
-- VOICE INDICATOR
-- ==========================================
local voiceRange  = 1
local voiceRanges = { 1, 2, 3 }  -- proximity ranges

RegisterNetEvent('dybdev-hud:client:voiceUpdate', function(range)
    voiceRange = range
    SendNUI('voiceUpdate', { range = range })
end)

-- Support for pma-voice
AddEventHandler('pma-voice:setTalkingState', function(source, state)
    if source ~= GetPlayerServerId(PlayerId()) then return end
    SendNUI('voiceTalking', { talking = state })
end)

-- Support for mumble-voip / saltychat
AddEventHandler('SaltyChat_TalkStateChanged', function(isTalking)
    SendNUI('voiceTalking', { talking = isTalking })
end)

-- ==========================================
-- COMPASS / STREET
-- ==========================================
local function GetCardinalDirection(heading)
    if heading >= 337.5 or heading < 22.5 then
        return 'N'
    elseif heading < 67.5 then
        return 'NE'
    elseif heading < 112.5 then
        return 'E'
    elseif heading < 157.5 then
        return 'SE'
    elseif heading < 202.5 then
        return 'S'
    elseif heading < 247.5 then
        return 'SW'
    elseif heading < 292.5 then
        return 'W'
    else
        return 'NW'
    end
end

local function GetStreetName()
    local ped     = PlayerPedId()
    local pos     = GetEntityCoords(ped)
    local street1, street2 = GetStreetNameAtCoord(pos.x, pos.y, pos.z)
    local name1   = GetStreetNameFromHashKey(street1)
    local name2   = GetStreetNameFromHashKey(street2)
    return name1, name2
end

local function GetZoneName()
    local ped  = PlayerPedId()
    local pos  = GetEntityCoords(ped)
    return GetLabelText(GetNameOfZone(pos.x, pos.y, pos.z))
end

-- ==========================================
-- PLAYER META (hunger/thirst/stress/oxygen)
-- ==========================================
RegisterNetEvent('QBCore:Player:SetPlayerData', function(data)
    if data.metadata then
        local meta   = data.metadata
        cache.hunger  = meta.hunger  or 100
        cache.thirst  = meta.thirst  or 100
        cache.stress  = meta.stress  or 0
        cache.oxygen  = meta.oxygen  or 100
    end
    if data.money then
        cache.cash = data.money.cash  or 0
        cache.bank = data.money.bank  or 0
    end
    if data.job then
        cache.job   = data.job.label  or ''
        cache.grade = data.job.grade  and data.job.grade.name or ''
    end
    if data.citizenid then
        cache.id = data.citizenid
    end
    if data.charinfo then
        cache.name = (data.charinfo.firstname or '') .. ' ' .. (data.charinfo.lastname or '')
    end
    SendNUI('playerStats', {
        hunger  = cache.hunger,
        thirst  = cache.thirst,
        stress  = cache.stress,
        oxygen  = cache.oxygen,
        cash    = cache.cash,
        bank    = cache.bank,
        job     = cache.job,
        grade   = cache.grade,
        id      = cache.id,
        name    = cache.name,
    })
end)

-- ==========================================
-- MAIN HUD TICK
-- ==========================================
CreateThread(function()
    while true do
        Wait(250)

        local ped     = PlayerPedId()
        local health  = GetHealthPct()
        local armor   = GetArmorPct()
        local heading = GetEntityHeading(ped)
        heading       = (360 - heading) % 360  -- convert to compass heading

        -- Stamina (GTA native: 0-100 via stat)
        local staminaStat = 0
        staminaStat = GetPlayerSprintStaminaRemaining(PlayerId())

        local changed = false
        if math.abs(health  - cache.health)  > 0.5 then cache.health  = health;  changed = true end
        if math.abs(armor   - cache.armor)   > 0.5 then cache.armor   = armor;   changed = true end
        if math.abs(staminaStat - cache.stamina) > 1.0 then cache.stamina = staminaStat; changed = true end
        if math.abs(heading - cache.heading) > 0.5 then cache.heading = heading; changed = true end

        if changed then
            SendNUI('hudUpdate', {
                health  = cache.health,
                armor   = cache.armor,
                stamina = cache.stamina,
                hunger  = cache.hunger,
                thirst  = cache.thirst,
                stress  = cache.stress,
                oxygen  = cache.oxygen,
            })
        end

        -- Street / compass update (every second)
        local street1, _ = GetStreetName()
        local zone        = GetZoneName()
        local cardinal    = GetCardinalDirection(heading)

        if street1 ~= cache.street or zone ~= cache.area then
            cache.street = street1
            cache.area   = zone
            SendNUI('locationUpdate', {
                street   = cache.street,
                area     = cache.area,
                heading  = math.floor(cache.heading),
                cardinal = cardinal,
            })
        else
            SendNUI('compassUpdate', {
                heading  = math.floor(cache.heading),
                cardinal = cardinal,
            })
        end
    end
end)

-- ==========================================
-- OXYGEN TICK (underwater)
-- ==========================================
CreateThread(function()
    while true do
        Wait(500)
        local ped    = PlayerPedId()
        local oxygen = math.clamp(GetPlayerRemainingAirTime(PlayerId()) * 100.0 / 3.0, 0, 100)
        if math.abs(oxygen - cache.oxygen) > 1.0 then
            cache.oxygen = oxygen
            SendNUI('oxygenUpdate', { oxygen = oxygen })
        end
    end
end)

-- ==========================================
-- WANTED LEVEL
-- ==========================================
CreateThread(function()
    local lastWanted = -1
    while true do
        Wait(1000)
        local wanted = GetPlayerWantedLevel(PlayerId())
        if wanted ~= lastWanted then
            lastWanted = wanted
            SendNUI('wantedUpdate', { level = wanted })
        end
    end
end)
