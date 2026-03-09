Config = {}

-- ==========================================
-- GENERAL SETTINGS
-- ==========================================
Config.Locale = 'en'
Config.Debug = false

-- ==========================================
-- HUD VISIBILITY
-- ==========================================
Config.HUD = {
    -- Default visibility state on resource start
    Enabled = true,

    -- Default positions (percentage of screen)
    Positions = {
        playerInfo  = { x = 1.5,  y = 91.0 },
        statusBars  = { x = 1.5,  y = 78.0 },
        minimap     = { x = 0.0,  y = 0.0  },
        vehicle     = { x = 98.5, y = 91.0 },
        compass     = { x = 50.0, y = 2.0  },
        notifications = { x = 80.0, y = 5.0  },
    },

    -- Which elements to show by default
    Show = {
        playerInfo   = true,
        health       = true,
        armor        = true,
        stamina      = true,
        hunger       = true,
        thirst       = true,
        stress       = true,
        oxygen       = true,
        voice        = true,
        compass      = true,
        streetName   = true,
        area         = true,
        cash         = true,
        bank         = true,
        job          = true,
        id           = true,
    },
}

-- ==========================================
-- VEHICLE HUD
-- ==========================================
Config.Vehicle = {
    Enabled = true,
    ShowSpeedometer      = true,
    ShowFuel             = true,
    ShowGear             = true,
    ShowRPM              = true,
    ShowSeatbelt         = true,
    ShowEngineHealth     = true,
    ShowDoors            = true,
    ShowTurnsignals      = true,
    ShowLights           = true,
    ShowNOS              = true,
    SpeedUnit            = 'mph',   -- 'kmh' or 'mph'

    -- Control Panel overlay
    ControlPanel = {
        Enabled = true,
        ShowOnEnter = false,   -- auto-show when entering vehicle
    },
}

-- ==========================================
-- BOAT HUD
-- ==========================================
Config.Boat = {
    Enabled          = true,
    ShowSpeed        = true,
    ShowDepth        = true,
    ShowHeading      = true,
    ShowAnchorStatus = true,
    ShowFuel         = true,
}

-- ==========================================
-- AIRCRAFT HUD
-- ==========================================
Config.Aircraft = {
    Enabled       = true,
    ShowSpeed     = true,
    ShowAltitude  = true,
    ShowHeading   = true,
    ShowGear      = true,
    ShowFuel      = true,
    ShowVertSpeed = true,
    ShowGForce    = true,
    ShowThrottle  = true,
}

-- ==========================================
-- BICYCLE HUD
-- ==========================================
Config.Bicycle = {
    Enabled        = true,
    ShowSpeed      = true,
    ShowCadence    = true,
    ShowStamina    = true,
    ShowDistance   = true,
}

-- ==========================================
-- TRAIN HUD
-- ==========================================
Config.Train = {
    Enabled      = true,
    ShowSpeed    = true,
    ShowStations = true,
    ShowPassengers = true,
    ShowSignal   = true,
}

-- ==========================================
-- STATUS BAR COLORS
-- ==========================================
Config.Colors = {
    health   = '#e74c3c',  -- Red
    armor    = '#3498db',  -- Blue
    stamina  = '#f39c12',  -- Orange
    hunger   = '#e67e22',  -- Orange
    thirst   = '#2980b9',  -- Blue
    stress   = '#9b59b6',  -- Purple
    oxygen   = '#1abc9c',  -- Teal
    fuel     = '#27ae60',  -- Green
    engine   = '#e74c3c',  -- Red
    nos      = '#00d4ff',  -- Cyan
    accent   = '#00d4ff',  -- Main accent cyan
    accent2  = '#00ffcc',  -- Secondary accent teal
    warning  = '#f39c12',  -- Warning orange
    danger   = '#e74c3c',  -- Danger red
    success  = '#27ae60',  -- Success green
}

-- ==========================================
-- EDITOR SETTINGS
-- ==========================================
Config.Editor = {
    -- Key to open HUD Editor (default: F5)
    OpenKey       = 'F5',
    GridSnap      = true,
    GridSize      = 0.5,
    AutoSave      = true,
    PreviewMode   = true,
}

-- ==========================================
-- COMPASS
-- ==========================================
Config.Compass = {
    Enabled    = true,
    ShowDegrees = true,
    ShowStreet  = true,
    FadeOnFoot  = false,
}

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
Config.Notifications = {
    Position  = 'top-right',
    Duration  = 5000,
    MaxStack  = 5,
}
