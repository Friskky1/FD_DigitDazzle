# FD_DigitDazzle

A hacking-device minigame for FiveM. A short sequence of shapes, numbers or letters appears at the top of the screen, and the player must find that exact sequence in the grid below before the timer runs out.

Use it for heists, door hacks, ATM hacks, laptops, boosting, or anything else that needs a skill check. One export call starts the game and gives you back `true` (hacked) or `false` (failed).

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [How the game plays](#how-the-game-plays)
- [The export](#the-export)
  - [Parameter 1: modes](#parameter-1-modes)
  - [Parameter 2: options](#parameter-2-options)
  - [Return value](#return-value)
- [Adding it to your own script](#adding-it-to-your-own-script)
- [Difficulty presets](#difficulty-presets)
- [Controls](#controls)
- [Testing](#testing)
- [FAQ and troubleshooting](#faq-and-troubleshooting)
- [Support](#support)

## Features

- **4 modes:** shapes, numeric, alphabet and alphanumeric. You choose which ones can appear, and they mix from round to round.
- **8 shapes:** square, circle, triangle, rectangle, diamond, hexagon, star and cross.
- **Colour matching:** a cyan triangle is not a yellow triangle.
- **Rotated and mirrored decoys:** upside-down triangles, vertical rectangles and backwards letters count as different symbols.
- **Signal noise:** random cells blink out while you search.
- **Multiple rounds:** clear several rounds in a row. One mistake fails the whole hack.
- **Keyboard and mouse:** arrows / WASD and Enter, or hover and click.
- **Scales to the screen:** sized for 1080p, 1440p and 4K.
- **Standalone:** no framework, no dependencies. Idles at 0.00 ms.

## Requirements

None. It works on any framework (QBCore, Qbox, ESX, standalone).

## Installation

1. Put the `FD_DigitDazzle` folder in your `resources` folder.
2. Add this to your `server.cfg`, **before** any script that uses it:
   ```
   ensure FD_DigitDazzle
   ```
   If it sits inside a folder you already ensure (for example `[friskkydev]`), you don't need a separate line.
3. Restart the server or run `ensure FD_DigitDazzle` in the server console.

## How the game plays

1. The panel opens and shows **PREPARING INTERFACE...** for 1 second.
2. A round starts. The **target sequence** (for example 4 symbols) is shown at the top.
3. The **grid** below holds 60 symbols (10 × 6). The target sequence is hidden somewhere in it, reading left to right. A sequence can carry on from the end of one row onto the start of the next, and from the last cell back to the first.
4. The player moves a **highlighted selection** (as long as the target) over the grid and confirms when it lines up with the target.
5. To count as a match, every symbol must have the same **symbol, colour and rotation / mirroring** as the target.
6. Correct → the next round starts with a new grid, and often a different mode. Wrong pick or timer runs out → the hack fails and the correct spot is shown in green.
7. After the last round the panel shows **ACCESS GRANTED** and the export returns `true`.

## The export

```lua
local success = exports.FD_DigitDazzle:DigitDazzle(modes, {
    rounds = 1,       -- how many rounds in a row
    length = 4,       -- symbols in the sequence
    duration = 10000, -- milliseconds per round
    colors = true,
    rotate = true,
    hide = true,
})
```

It takes two arguments: the **modes** (which puzzles can appear) and an **options table** with every setting, including `rounds`. The values above are the defaults, so you only need to write the ones you want to change:

```lua
local success = exports.FD_DigitDazzle:DigitDazzle('numeric', { rounds = 2 })
```

Full example:

```lua
local success = exports.FD_DigitDazzle:DigitDazzle('numeric alphabet alphanumeric', {
    rounds = 3,       -- 3 rounds in a row
    length = 4,       -- 4 symbols to find
    duration = 10000, -- 10 seconds per round
    colors = true,    -- colours must match
    rotate = true,    -- rotated / mirrored decoys
    hide = true,      -- cells blink out
})

if success then
    -- the player hacked it
else
    -- the player failed, ran out of time or pressed Esc
end
```

**Client side only.** Call it from a client script. To use it from the server, trigger a client event that runs the export and send the result back with `TriggerServerEvent`.

### Parameter 1: modes

Which kinds of puzzle can appear. **Each round picks one mode at random** from the ones you give, and never repeats the previous round's mode when you give more than one. With `'numeric alphabet alphanumeric'` and `rounds = 3`, the player could get numbers, then letters, then numbers and letters.

| Mode | What appears in the grid |
|---|---|
| `'shapes'` | Square, circle, triangle, rectangle, diamond, hexagon, star, cross |
| `'numeric'` | Digits `0` to `9` |
| `'alphabet'` | Letters `A` to `Z` |
| `'alphanumeric'` | Digits and letters mixed |
| `'random'` | Any of the four modes above |

You can write it in any of these ways:

```lua
'numeric'                                  -- always numbers
'numeric alphabet'                         -- several modes in one string (spaces)
'numeric,alphabet'                         -- several modes in one string (commas)
{ 'shapes', 'numeric', 'alphanumeric' }    -- a table
'random'                                   -- all four
```

- Case doesn't matter (`'Numeric'` works).
- Unknown names are ignored. If nothing valid is left, it plays `'shapes'`.

### Parameter 2: options

A table with all the settings, including how many rounds. Every field is optional, so you can pass `{}` or leave it out entirely.

| Option | Type | Default | Limits | What it does |
|---|---|---|---|---|
| `rounds` | number | `1` | at least 1 | How many rounds the player must clear **in a row** to win. Each round has its own grid, its own timer and often a different mode. One mistake on any round fails the whole hack. |
| `length` | number | `4` | 2 to 8 | How many symbols are in the target sequence. Longer is harder. |
| `duration` | number | `10000` | at least 1000 | Time per round, in **milliseconds** (`10000` = 10 seconds). The bar under the target shows the time left. |
| `colors` | boolean | `true` | | `true`: symbols come in 5 colours and the colour must match. `false`: everything is white, so only the symbol matters. Easier. |
| `rotate` | boolean | `true` | | `true`: adds decoys. Triangles and stars can be upside down, rectangles and hexagons turned 90°, and letters or digits mirrored (a backwards `R`). These count as **different** symbols. `false`: no decoys. Easier. Symbols that look the same either way (`A`, `O`, `8`, `X`, ...) are never mirrored. |
| `hide` | boolean | `true` | | `true`: a few random cells blink out every half second, which makes searching harder. `false`: the grid stays still. |

Values outside the limits are clamped (for example `length = 20` becomes 8, `rounds = 0` becomes 1).

### Return value

| Value | When |
|---|---|
| `true` | The player cleared every round. |
| `false` | Wrong pick, timer ran out, the player pressed **Esc**, or another hack was **already open** (only one can run at a time). |

The export **waits** until the game ends. Your code below the call runs only after the player wins or fails, so you don't need callbacks.

## Adding it to your own script

### Example

```lua
RegisterCommand('hackdoor', function()
    local success = exports.FD_DigitDazzle:DigitDazzle('random', { rounds = 2, length = 4, duration = 10000 })

    if success then
        print('Door unlocked')
    else
        print('Hack failed')
    end
end, false)
```

### Where you can call it

- Anywhere in a **client** script that runs in a thread: commands, event handlers, target callbacks, `CreateThread`.
- **Not** from a server script. Trigger a client event that runs the export, then send the result back with `TriggerServerEvent`.
- **Not** inside a NUI callback from another resource. Trigger a client event from that callback and run the hack there.

## Difficulty presets

Copy and adjust:

```lua
-- Easy: a beginner door
exports.FD_DigitDazzle:DigitDazzle('numeric', { rounds = 1, length = 3, duration = 15000, colors = false, rotate = false, hide = false })

-- Normal: store safe
exports.FD_DigitDazzle:DigitDazzle('shapes numeric', { rounds = 2, length = 4, duration = 10000 })

-- Hard: bank vault
exports.FD_DigitDazzle:DigitDazzle('random', { rounds = 3, length = 5, duration = 8000 })

-- Very hard: high-end heist
exports.FD_DigitDazzle:DigitDazzle({ 'alphanumeric', 'shapes' }, { rounds = 4, length = 6, duration = 7000 })
```

What makes it harder, roughly from most to least effect: more `rounds`, longer `length`, shorter `duration`, `rotate = true`, `colors = true` (for shapes; for letters it can make them easier to spot), `hide = true`, and `alphanumeric` mode.

## Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Move the selection. Left and right move 1 cell, up and down move 1 row. It wraps around the edges. |
| Enter / Space | Confirm the selection. |
| Mouse hover | Moves the selection to start at that cell. |
| Mouse click | Confirm. |
| Esc | Abort. Counts as a fail. |

## Testing

In game, open the F8 console or chat and run:

```
/digitdazzletest [modes] [rounds] [length] [duration]
```

The numbers fill the options table in that order, so `/digitdazzletest numeric 2 5 8000` runs `DigitDazzle('numeric', { rounds = 2, length = 5, duration = 8000 })`.

| Example | What it does |
|---|---|
| `/digitdazzletest` | Random modes, 3 rounds, length 4, 10 seconds |
| `/digitdazzletest numeric 1 3 15000` | 1 easy numeric round |
| `/digitdazzletest alphanumeric 3 5 8000` | 3 hard alphanumeric rounds |

The result (`success` or `failed`) is printed in the F8 console. In the command, separate modes with commas (`numeric,alphabet`), because spaces split the arguments.

## FAQ and troubleshooting

**The export returned `false` straight away.**
A hack is already open for that player. Only one runs at a time.

**`No such export DigitDazzle in resource FD_DigitDazzle`.**
The resource isn't started, or it starts after your script. Put `ensure FD_DigitDazzle` above your script in `server.cfg`.

**The mouse or keyboard is stuck after the hack.**
This can happen if the resource is restarted while a hack is open. Run `ensure FD_DigitDazzle` again; it releases the cursor when it stops.

**Can I call it from the server?**
No, it's a client export. Trigger a client event and send the result back.

**Can I change the grid size or colours?**
The grid is fixed at 10 × 6. The colours are CSS variables at the top of `html/style.css`.

**`0` and `O` look alike.**
Zero has a dot in the middle. If that's too hard for your players, use `'alphabet'` or `'numeric'` instead of `'alphanumeric'`.

**Does the same sequence ever appear twice?**
Rarely. If it does, either spot counts as correct.

## Support

Join the Friskky Developments Discord: https://discord.gg/xPcKNWZMpG

---

© Friskky Developments · https://discord.gg/xPcKNWZMpG
