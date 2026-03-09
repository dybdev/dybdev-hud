fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'dybdev-hud'
description 'Arc Raiders inspired HUD for FiveM QBox Framework'
author 'dybdev'
version '1.0.0'

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua',
}

client_scripts {
    'client/main.lua',
    'client/hud.lua',
    'client/vehicle.lua',
    'client/bicycle.lua',
    'client/train.lua',
    'client/editor.lua',
}

server_scripts {
    'server/main.lua',
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/style.css',
    'html/js/app.js',
    'html/js/hud.js',
    'html/js/vehicle.js',
    'html/js/editor.js',
    'html/img/*.png',
    'html/img/*.svg',
    'locales/*.json',
}

