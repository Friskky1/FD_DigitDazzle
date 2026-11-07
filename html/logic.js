// Pure puzzle logic (no DOM).
const DigitDazzleLogic = (() => {
    const SHAPE_NAMES = ['square', 'circle', 'triangle', 'rectangle', 'diamond', 'hexagon', 'star', 'cross'];
    // Only shapes that look different when turned get a rotated variant.
    const TURN_DEGREES = { triangle: 180, rectangle: 90, hexagon: 90, star: 180 };
    const DIGITS = '0123456789'.split('');
    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    // Characters that look the same mirrored never get a mirrored variant.
    const SYMMETRIC_CHARACTERS = 'AHIMOTUVWXY08'.split('');
    const GLYPHS_BY_MODE = {
        shapes: SHAPE_NAMES,
        numeric: DIGITS,
        alphabet: LETTERS,
        alphanumeric: DIGITS.concat(LETTERS),
    };
    const MODE_NAMES = Object.keys(GLYPHS_BY_MODE);
    const COLOR_NAMES = ['cyan', 'magenta', 'yellow', 'lime', 'orange'];

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function randomItem(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    // Accepts "numeric alphabet", "numeric,alphabet", ["numeric", "alphabet"] or "random". Unknown names are ignored.
    function parseModes(modes) {
        const words = Array.isArray(modes) ? modes : String(modes || '').split(/[\s,]+/);
        const lowerWords = words.map((word) => String(word).toLowerCase());
        if (lowerWords.includes('random')) {
            return MODE_NAMES.slice();
        }
        const parsed = MODE_NAMES.filter((mode) => lowerWords.includes(mode));
        return parsed.length > 0 ? parsed : ['shapes'];
    }

    function normaliseSettings(options, modes) {
        const userOptions = options || {};
        return {
            modes: parseModes(modes),
            length: clamp(Math.floor(Number(userOptions.length) || 4), 2, 8),
            duration: Math.max(1000, Number(userOptions.duration) || 10000),
            colors: userOptions.colors !== false,
            rotate: userOptions.rotate !== false,
            hide: userOptions.hide !== false,
            columns: 10,
            rows: 6,
        };
    }

    function variantTransform(mode, glyph) {
        if (mode === 'shapes') {
            return TURN_DEGREES[glyph] ? 'rotate(' + TURN_DEGREES[glyph] + 'deg)' : '';
        }
        return SYMMETRIC_CHARACTERS.includes(glyph) ? '' : 'scaleX(-1)';
    }

    function createToken(settings, mode) {
        const glyph = randomItem(GLYPHS_BY_MODE[mode]);
        const variant = settings.rotate && Math.random() < 0.5 ? variantTransform(mode, glyph) : '';
        const color = settings.colors ? randomItem(COLOR_NAMES) : 'white';
        return { mode, glyph, transform: variant, color, key: glyph + ':' + variant + ':' + color };
    }

    // The selection window wraps from the end of a row into the next, and from the last cell to the first.
    function windowIndexes(totalCells, start, length) {
        const indexes = [];
        for (let offset = 0; offset < length; offset++) {
            indexes.push((start + offset) % totalCells);
        }
        return indexes;
    }

    function windowKey(cells, start, length) {
        return windowIndexes(cells.length, start, length).map((index) => cells[index].key).join('|');
    }

    // With more than one mode, each layer avoids repeating the previous layer's mode.
    function pickMode(modes, previousMode) {
        const choices = modes.length > 1 ? modes.filter((mode) => mode !== previousMode) : modes;
        return randomItem(choices);
    }

    function buildPuzzle(settings, previousMode) {
        const mode = pickMode(settings.modes, previousMode);
        const totalCells = settings.columns * settings.rows;
        const cells = Array.from({ length: totalCells }, () => createToken(settings, mode));
        const answer = Math.floor(Math.random() * totalCells);
        const target = windowIndexes(totalCells, answer, settings.length).map((index) => cells[index]);
        return { mode, cells, answer, target, targetKey: windowKey(cells, answer, settings.length) };
    }

    // Any window that matches is accepted, so a rare duplicate of the target is never a false fail.
    function isCorrect(puzzle, selection, length) {
        return windowKey(puzzle.cells, selection, length) === puzzle.targetKey;
    }

    return { normaliseSettings, parseModes, buildPuzzle, isCorrect, windowIndexes, MODE_NAMES };
})();

if (typeof module !== 'undefined') {
    module.exports = DigitDazzleLogic;
}
