// Global keyboard shortcuts + "press a key to bind" capture mode.
//
// A combo is stored as a string of optional modifiers followed by a KeyboardEvent.code,
// e.g. 'KeyG', 'Shift+KeyG', 'Ctrl+Alt+Digit1'. Using `code` (physical key) keeps
// bindings stable across keyboard layouts and Shift states.

CA.Hotkeys = (() => {
  const MODIFIER_CODES = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock'];
  const RESERVED = ['Ctrl+KeyS', 'Ctrl+KeyO']; // the game's own save/import shortcuts

  const PRETTY = {
    Space: 'Space', Enter: 'Enter', Tab: 'Tab', Backquote: '`', Minus: '-', Equal: '=',
    BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'",
    Comma: ',', Period: '.', Slash: '/', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    PageUp: 'PgUp', PageDown: 'PgDn', Insert: 'Ins', Home: 'Home', End: 'End',
    NumpadAdd: 'Num +', NumpadSubtract: 'Num -', NumpadMultiply: 'Num *', NumpadDivide: 'Num /',
    NumpadDecimal: 'Num .', NumpadEnter: 'Num Enter',
  };

  let capture = null; // { actionId, onDone }

  function fromEvent(e) {
    if (!e.code || MODIFIER_CODES.includes(e.code)) return null;
    let combo = '';
    if (e.ctrlKey) combo += 'Ctrl+';
    if (e.altKey) combo += 'Alt+';
    if (e.shiftKey) combo += 'Shift+';
    if (e.metaKey) combo += 'Meta+';
    return combo + e.code;
  }

  /** 'Shift+KeyG' -> 'Shift + G' (plain text) */
  function format(combo) {
    if (!combo) return '';
    return combo
      .split('+')
      .map((part) => {
        if (PRETTY[part]) return PRETTY[part];
        if (/^Key[A-Z]$/.test(part)) return part.slice(3);
        if (/^Digit\d$/.test(part)) return part.slice(5);
        if (/^Numpad\d$/.test(part)) return `Num ${part.slice(6)}`;
        return part;
      })
      .join(' + ');
  }

  function isTypingTarget(e) {
    const t = e.target;
    if (!t || !t.tagName) return false;
    return /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
  }

  // ---- capture mode ------------------------------------------------------------

  function startCapture(actionId, onDone) {
    capture = { actionId, onDone };
    CA.Events.emit('hotkeys', actionId);
  }

  function cancelCapture() {
    if (!capture) return;
    const { actionId } = capture;
    capture = null;
    CA.Events.emit('hotkeys', actionId);
  }

  function capturing() {
    return capture ? capture.actionId : null;
  }

  function handleCapture(e) {
    e.preventDefault();
    e.stopPropagation();
    if (MODIFIER_CODES.includes(e.code)) return; // wait for the actual key

    const { actionId, onDone } = capture;
    const noMods = !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey;

    if (e.code === 'Escape' && noMods) {
      cancelCapture();
      return;
    }
    if ((e.code === 'Backspace' || e.code === 'Delete') && noMods) {
      capture = null;
      CA.Settings.setHotkey(actionId, '');
      if (onDone) onDone('', []);
      return;
    }

    const combo = fromEvent(e);
    if (!combo) return;
    if (RESERVED.includes(combo)) {
      CA.Util.notify('CookieMgr', `<b>${format(combo)}</b> is used by the game itself. Pick another key.`, [32, 17], 3);
      return; // keep listening
    }
    capture = null;
    const displaced = CA.Settings.setHotkey(actionId, combo);
    if (onDone) onDone(combo, displaced);
  }

  // ---- global listener -----------------------------------------------------------

  function onKeyDown(e) {
    if (capture) {
      handleCapture(e);
      return;
    }
    if (e.repeat || isTypingTarget(e)) return;
    if (typeof Game !== 'undefined' && Game.promptOn) return; // a game dialog is open

    const actionId = CA.Settings.actionForCombo(fromEvent(e));
    if (!actionId) return;
    e.preventDefault();
    CA.Actions.run(actionId);
  }

  function init() {
    // capture phase so binding mode can swallow the key before anything else reacts to it
    window.addEventListener('keydown', onKeyDown, true);
  }

  return { init, fromEvent, format, startCapture, cancelCapture, capturing };
})();
