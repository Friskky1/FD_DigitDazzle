const insideFiveM = typeof GetParentResourceName === 'function';
const resourceName = insideFiveM ? GetParentResourceName() : 'FD_DigitDazzle';

const SHAPE_SVG = {
    square: '<rect x="18" y="18" width="64" height="64" />',
    circle: '<circle cx="50" cy="50" r="34" />',
    triangle: '<polygon points="50,14 88,84 12,84" />',
    rectangle: '<rect x="10" y="30" width="80" height="40" />',
    diamond: '<polygon points="50,10 90,50 50,90 10,50" />',
    hexagon: '<polygon points="50,10 85,30 85,70 50,90 15,70 15,30" />',
    star: '<polygon points="50,8 61,38 93,38 67,57 77,89 50,70 23,89 33,57 7,38 39,38" />',
    cross: '<polygon points="38,12 62,12 62,38 88,38 88,62 62,62 62,88 38,88 38,62 12,62 12,38 38,38" />',
};

const elements = {
    app: document.getElementById('app'),
    device: document.getElementById('device'),
    roundLabel: document.getElementById('round-label'),
    target: document.getElementById('target'),
    timerFill: document.getElementById('timer-fill'),
    grid: document.getElementById('grid'),
    status: document.getElementById('status'),
};

let game = null;

// 1.1x at 1080p, 1.25x at 1440p, 1.55x at 2160p: grows gently with screen height, never below 0.6x.
function updateUiScale() {
    const scale = Math.max(0.6, 1.1 + (window.innerHeight - 1080) * (0.15 / 360));
    document.documentElement.style.setProperty('--ui-scale', scale.toFixed(3));
}
updateUiScale();
window.addEventListener('resize', updateUiScale);

function later(milliseconds, callback) {
    game.timers.push(setTimeout(callback, milliseconds));
}

function clearTimers() {
    game.timers.forEach((timer) => {
        clearTimeout(timer);
        clearInterval(timer);
    });
    game.timers = [];
}

function setStatus(text, state) {
    elements.status.textContent = text;
    elements.status.className = 'status ' + (state || '');
    elements.device.className = 'device ' + (state || '');
}

function cellMarkup(token, index) {
    const indexAttribute = index === undefined ? '' : ' data-index="' + index + '"';
    const transformStyle = ' style="transform: ' + (token.transform || 'none') + '"';
    const glyphMarkup = token.mode === 'shapes'
        ? '<svg viewBox="0 0 100 100"' + transformStyle + '>' + SHAPE_SVG[token.glyph] + '</svg>'
        : '<span class="glyph"' + transformStyle + '>' + token.glyph + '</span>';
    return '<div class="cell"' + indexAttribute + ' style="--shape-color: var(--' + token.color + ')">'
        + glyphMarkup
        + '</div>';
}

function renderPuzzle() {
    const puzzle = game.puzzle;
    elements.target.innerHTML = puzzle.target.map((token) => cellMarkup(token)).join('');
    elements.grid.style.setProperty('--columns', game.settings.columns);
    elements.grid.innerHTML = puzzle.cells.map((token, index) => cellMarkup(token, index)).join('');
    game.cellElements = Array.from(elements.grid.children);
    updateSelection();
}

function updateSelection() {
    game.cellElements.forEach((cell) => cell.classList.remove('selected'));
    DigitDazzleLogic.windowIndexes(game.cellElements.length, game.selection, game.settings.length)
        .forEach((index) => game.cellElements[index].classList.add('selected'));
}

function startTimerBar(duration) {
    elements.timerFill.style.transition = 'none';
    elements.timerFill.style.width = '100%';
    void elements.timerFill.offsetWidth; // force reflow so the transition restarts
    elements.timerFill.style.transition = 'width ' + duration + 'ms linear';
    elements.timerFill.style.width = '0%';
}

function startBlinking() {
    game.timers.push(setInterval(() => {
        for (let count = 0; count < 3; count++) {
            const cell = game.cellElements[Math.floor(Math.random() * game.cellElements.length)];
            cell.classList.add('blink');
            later(700, () => cell.classList.remove('blink'));
        }
    }, 450));
}

function nextRound() {
    game.round += 1;
    game.puzzle = DigitDazzleLogic.buildPuzzle(game.settings, game.puzzle && game.puzzle.mode);
    game.selection = 0;
    elements.roundLabel.textContent = 'ROUND ' + game.round + '/' + game.totalRounds + ' · ' + game.puzzle.mode.toUpperCase();
    setStatus('SCANNING...');
    renderPuzzle();
    startTimerBar(game.settings.duration);
    later(game.settings.duration, () => failRound('TIME EXPIRED'));
    if (game.settings.hide) {
        startBlinking();
    }
    game.locked = false;
}

function failRound(reason) {
    game.locked = true;
    clearTimers();
    elements.timerFill.style.transition = 'none';
    DigitDazzleLogic.windowIndexes(game.cellElements.length, game.selection, game.settings.length)
        .forEach((index) => game.cellElements[index].classList.add('wrong'));
    DigitDazzleLogic.windowIndexes(game.cellElements.length, game.puzzle.answer, game.settings.length)
        .forEach((index) => game.cellElements[index].classList.add('answer'));
    setStatus(reason + ' // ACCESS DENIED', 'failure');
    later(1500, () => finish(false));
}

function submitSelection() {
    if (!DigitDazzleLogic.isCorrect(game.puzzle, game.selection, game.settings.length)) {
        failRound('WRONG SEQUENCE');
        return;
    }
    game.locked = true;
    clearTimers();
    elements.timerFill.style.transition = 'none';
    if (game.round >= game.totalRounds) {
        setStatus('ACCESS GRANTED', 'success');
        later(900, () => finish(true));
    } else {
        setStatus('ROUND ' + game.round + ' BYPASSED', 'success');
        later(700, nextRound);
    }
}

function moveSelection(step) {
    const totalCells = game.cellElements.length;
    game.selection = (game.selection + step + totalCells) % totalCells;
    updateSelection();
}

function startGame(modes, rounds, options) {
    if (game) {
        return;
    }
    game = {
        totalRounds: Math.max(1, Math.floor(Number(rounds)) || 1),
        settings: DigitDazzleLogic.normaliseSettings(options, modes),
        puzzle: null,
        round: 0,
        selection: 0,
        locked: true,
        timers: [],
        cellElements: [],
    };
    elements.target.innerHTML = '';
    elements.grid.innerHTML = '';
    elements.roundLabel.textContent = '';
    elements.timerFill.style.transition = 'none';
    elements.timerFill.style.width = '100%';
    setStatus('PREPARING INTERFACE...');
    elements.app.classList.remove('hidden');
    later(1000, nextRound);
}

function finish(success) {
    clearTimers();
    game = null;
    elements.app.classList.add('hidden');
    if (!insideFiveM) {
        // Browser preview: show the result and start another game.
        console.log('[FD_DigitDazzle] result:', success);
        setTimeout(() => startGame('random', 3, {}), 500);
        return;
    }
    fetch('https://' + resourceName + '/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ success }),
    });
}

window.addEventListener('message', (event) => {
    if (event.data.action === 'start') {
        startGame(event.data.modes, event.data.rounds, event.data.options);
    }
});

const KEY_STEPS = {
    ArrowLeft: -1, a: -1,
    ArrowRight: 1, d: 1,
    ArrowUp: 'up', w: 'up',
    ArrowDown: 'down', s: 'down',
};

window.addEventListener('keydown', (event) => {
    if (!game) {
        return;
    }
    if (event.key === 'Escape') {
        finish(false);
        return;
    }
    if (game.locked) {
        return;
    }
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const step = KEY_STEPS[key];
    if (step === 'up') {
        moveSelection(-game.settings.columns);
    } else if (step === 'down') {
        moveSelection(game.settings.columns);
    } else if (step) {
        moveSelection(step);
    } else if (key === 'Enter' || key === ' ') {
        submitSelection();
    }
});

if (!insideFiveM) {
    document.body.style.background = '#1b1f2a';
    startGame('random', 3, {});
}

elements.grid.addEventListener('mouseover', (event) => {
    const cell = event.target.closest('.cell');
    if (!game || game.locked || !cell) {
        return;
    }
    game.selection = Number(cell.dataset.index);
    updateSelection();
});

elements.grid.addEventListener('click', (event) => {
    if (game && !game.locked && event.target.closest('.cell')) {
        submitSelection();
    }
});
