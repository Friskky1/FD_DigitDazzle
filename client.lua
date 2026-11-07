local activeGame = nil

--- Runs the hack and blocks the calling thread until it ends.
--- @param modes string|table 'shapes', 'numeric', 'alphabet', 'alphanumeric' or 'random'; a string like 'numeric alphabet' or a table picks one per round
--- @param options table|nil { rounds = 1, length = 4, duration = 10000, colors = true, rotate = true, hide = true }
--- @return boolean success
local function DigitDazzle(modes, options)
    if activeGame then
        return false
    end

    options = options or {}

    activeGame = promise.new()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'start',
        modes = modes or 'shapes',
        rounds = options.rounds or 1,
        options = options,
    })

    local success = Citizen.Await(activeGame)
    activeGame = nil
    return success
end

exports('DigitDazzle', DigitDazzle)

RegisterNUICallback('finish', function(data, callback)
    SetNuiFocus(false, false)
    if activeGame then
        activeGame:resolve(data.success == true)
    end
    callback('ok')
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() and activeGame then
        SetNuiFocus(false, false)
    end
end)

RegisterCommand('digitdazzletest', function(_, args)
    local success = DigitDazzle(args[1] or 'random', {
        rounds = tonumber(args[2]) or 3,
        length = tonumber(args[3]) or 4,
        duration = tonumber(args[4]) or 10000,
    })
    print(('[FD_DigitDazzle] result: %s'):format(success and 'success' or 'failed'))
end, false)
