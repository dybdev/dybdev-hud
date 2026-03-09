-- dybdev-hud | server/main.lua
-- Server-side logic

-- ==========================================
-- PLAYER CONNECT
-- ==========================================
AddEventHandler('playerConnecting', function(name, _, deferrals)
    deferrals.defer()
    Wait(0)
    deferrals.done()
end)

-- ==========================================
-- VOICE RANGE RELAY
-- ==========================================
RegisterNetEvent('dybdev-hud:server:setVoiceRange', function(range)
    local src = source
    TriggerClientEvent('dybdev-hud:client:voiceUpdate', src, range)
end)

-- ==========================================
-- SERVER INFO BROADCAST
-- ==========================================
RegisterNetEvent('dybdev-hud:server:requestPlayerInfo', function()
    local src    = source
    local Player = exports.qbx_core:GetPlayer(src)
    if not Player then return end

    TriggerClientEvent('dybdev-hud:client:playerInfo', src, {
        name      = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
        citizenid = Player.PlayerData.citizenid,
        job       = Player.PlayerData.job,
        money     = Player.PlayerData.money,
        metadata  = Player.PlayerData.metadata,
    })
end)
