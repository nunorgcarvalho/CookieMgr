// The code editor for algorithmic code (features/script.js), and the library beside it — used by
// the macro editor and the Garden page's rules. Any number of editors can be on a page, each with
// its own key.
//
//   CA.UI.CodeEditor.html(key, source, { title, hint })   the editor: numbered, coloured lines, the
//                                                          problems under it, what it's doing when it
//                                                          runs, and a "how it reads" crib sheet
//   CA.UI.CodeEditor.libraryHtml(key, { first })           every action / condition / value / keyword,
//                                                          searchable, ★ to pin; `first`: group names
//                                                          (or prefixes) to list first
//   CA.UI.CodeEditor.bind(root, { onChange(key, source), onPick(key, item) })
//                                                          listens on `root`; onPick may handle a
//                                                          library click itself (return true), else
//                                                          the item is inserted into editor `key`
//   CA.UI.CodeEditor.setLive(root, key, { lines, html })   lights up running lines, shows what it does
//
// The code is a <textarea> lying exactly on a highlighted copy of itself — only the outer box
// scrolls, so the caret can't drift from the text.

CA.UI = CA.UI || {};

CA.UI.CodeEditor = (() => {
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const LIB_FAVS = 'libFavs';
  let libItems = [];

  // ---- the library ------------------------------------------------------------------------

  const favs = () =>
    String(CA.Settings.get(LIB_FAVS) || '')
      .split('\n')
      .filter(Boolean);
  function toggleFav(k) {
    const list = favs();
    const i = list.indexOf(k);
    if (i >= 0) list.splice(i, 1);
    else list.push(k);
    CA.Settings.set(LIB_FAVS, list.join('\n'));
  }

  function libraryHtml(key, opts = {}) {
    libItems = CA.Script.library();
    const pins = favs();
    const fk = (it) => `${it.kind}:${it.id}`;
    const row = (it, i) =>
      `<div class="ca-lib-row ca-lib-${it.kind}" data-lib-text="${esc(`${it.sig} ${it.desc} ${it.group}`.toLowerCase())}">` +
      `<button type="button" class="ca-lib-ins" data-lib-insert="${i}" data-tip="Insert it">${I(it.icon || 'bolt', 12)}<code>${esc(it.sig)}</code></button>` +
      `<span class="ca-lib-desc">${esc(it.desc)}</span>` +
      `<button type="button" class="ca-iconbtn ca-lib-fav${pins.includes(fk(it)) ? ' on' : ''}" data-lib-fav="${esc(fk(it))}" data-tip="${pins.includes(fk(it)) ? 'Unpin' : 'Pin it at the top'}">${I(pins.includes(fk(it)) ? 'star' : 'starOutline', 11)}</button>` +
      '</div>';
    const pinned = libItems.map((it, i) => [it, i]).filter(([it]) => pins.includes(fk(it)));
    const groups = {};
    const gname = (it) => (it.kind === 'action' ? `Actions · ${it.group}` : it.group);
    libItems.forEach((it, i) => (groups[gname(it)] = groups[gname(it)] || []).push([it, i]));
    // groups named in opts.first (exactly, or by prefix) come first
    const first = opts.first || [];
    const rank = (g) => {
      const k = first.findIndex((f) => g === f || g.startsWith(f) || g.endsWith(f));
      return k < 0 ? first.length : k;
    };
    const names = Object.keys(groups).sort((a, b) => rank(a) - rank(b));
    return (
      `<aside class="ca-ed-lib" data-ed-lib="${esc(key)}" data-first="${esc(first.join('|'))}">` +
      `<div class="ca-lib-head">${I('search', 12)}<input type="search" placeholder="Actions, conditions, values…" data-lib-search></div>` +
      '<div class="ca-lib-body">' +
      `<div class="ca-lib-group ca-lib-pinned"><div class="ca-lib-ghead">${I('star', 11)} Pinned</div>${
        pinned.length ? pinned.map(([it, i]) => row(it, i)).join('') : '<div class="ca-lib-empty">★ an item to keep it here</div>'
      }</div>` +
      names.map((g) => `<div class="ca-lib-group"><div class="ca-lib-ghead">${esc(g)}</div>${groups[g].map(([it, i]) => row(it, i)).join('')}</div>`).join('') +
      '</div></aside>'
    );
  }

  // ---- the code ---------------------------------------------------------------------------

  // syntax colouring (one line at a time)
  const KW = new Set(['if', 'elif', 'else', 'for', 'in', 'repeat', 'until', 'while', 'times', 'forever', 'parallel', 'branch', 'wait', 'seconds', 'second', 'minutes', 'minute', 'stop', 'log', 'switch', 'on', 'off', 'and', 'or', 'not', 'true', 'false']);
  function highlightLine(line) {
    let out = '';
    let i = 0;
    const span = (cls, t) => `<span class="${cls}">${esc(t)}</span>`;
    while (i < line.length) {
      const rest = line.slice(i);
      let m;
      if (rest[0] === '#') {
        out += span('hc', rest);
        break;
      }
      if ((m = rest.match(/^("[^"]*"?|'[^']*'?)/))) out += span('hs', m[0]);
      else if ((m = rest.match(/^\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:qa|qi|k|m|b|t)?(?![A-Za-z_])/i))) out += span('hn', m[0]);
      else if ((m = rest.match(/^[A-Za-z_][\w.\-']*\w|^[A-Za-z_]/))) {
        const w = m[0];
        const cls = KW.has(w) ? 'hk' : CA.Actions.get(w) ? 'ha' : CA.Conditions.get(w) ? 'hq' : CA.Script.isValue(w) ? 'hv' : 'hi';
        out += span(cls, w);
      } else if ((m = rest.match(/^(>=|<=|==|!=|>|<|=)/))) out += span('ho', m[0]);
      else {
        m = [rest[0]];
        out += esc(rest[0]);
      }
      i += m[0].length;
    }
    return out;
  }

  function view(src) {
    const lines = String(src || '').split('\n');
    const { errors } = CA.Script.compile(src);
    const bad = new Set(errors.map((e) => e.line));
    return {
      gutter: lines.map((_, i) => `<span class="${bad.has(i + 1) ? 'err' : ''}">${i + 1}</span>`).join(''),
      hl: lines.map((l, i) => `<span class="ca-hl-line${bad.has(i + 1) ? ' err' : ''}">${highlightLine(l) || ' '}</span>`).join('\n') + '\n',
      status: errors.length
        ? `<div class="ca-code-bad">${I('close', 11)} ${errors.length} problem${errors.length === 1 ? '' : 's'}</div>` +
          errors
            .slice(0, 6)
            .map((e) => `<div class="ca-code-err" data-code-goto="${e.line}">line ${e.line}: ${esc(e.message)}</div>`)
            .join('')
        : `<div class="ca-code-ok">${I('play', 11)} ${lines.length} line${lines.length === 1 ? '' : 's'} · reads fine</div>`,
      errors,
    };
  }

  const HELP = [
    'pop.golden()                         run an action (options in brackets)',
    'season.keep(christmas)               …by position, or season.keep(season=christmas)',
    'switch on reindeer                   switch another macro on / off',
    'wait until magic() >= 80             wait for something  ·  wait 30 seconds',
    'repeat until owned(easter) >= 20:    a block, each pass, until it holds',
    'while buff(Frenzy):                  …as long as it holds',
    'repeat 5 times:   forever:',
    'if …:   elif …:   else:',
    'for season in [easter, halloween]:   once per item, “season” standing for it',
    'parallel:                            side by side:',
    '  branch a:                            each branch its own block',
    'stop     log "text"     # a comment',
    'conditions: and · or · not · ( … ) · comparisons: >= <= > < == !=',
    'numbers: 1e12, 25K, 2.5M, 3B, 1T',
  ].join('\n');

  function html(key, source, opts = {}) {
    const v = view(source);
    return (
      `<div class="ca-ed-sec ca-ed-code" data-code-ed="${esc(key)}"><div class="ca-ed-sec-head">${I('edit', 12)} ${esc(opts.title || 'Algorithm')} <span class="ca-hint">${esc(
        opts.hint || 'indent a block under a line ending in “:” · Tab indents · click the library to insert'
      )}</span></div>` +
      '<div class="ca-code">' +
      `<div class="ca-code-gutter" data-code-gutter>${v.gutter}</div>` +
      `<div class="ca-code-box"><pre class="ca-code-hl" data-code-hl aria-hidden="true">${v.hl}</pre>` +
      `<textarea class="ca-code-ta" data-code spellcheck="false" wrap="off" autocomplete="off">${esc(source || '')}</textarea></div>` +
      '</div>' +
      `<div class="ca-code-status" data-code-status>${v.status}</div>` +
      '<div class="ca-code-live" data-code-live></div>' +
      `<details class="ca-code-help"><summary>How it reads</summary><pre>${esc(HELP)}</pre></details></div>`
    );
  }

  const editorOf = (el) => el && el.closest && el.closest('[data-code-ed]');

  /** After typing: the colouring, the line numbers and the problems follow the code. */
  function refresh(ta) {
    const ed = editorOf(ta);
    if (!ed) return;
    const v = view(ta.value);
    const hl = ed.querySelector('[data-code-hl]');
    if (hl) hl.innerHTML = v.hl;
    const gut = ed.querySelector('[data-code-gutter]');
    if (gut) gut.innerHTML = v.gutter;
    const st = ed.querySelector('[data-code-status]');
    if (st) st.innerHTML = v.status;
  }

  /** Puts `text` into the code where the cursor is: on its own line, at that line's indentation. */
  function insert(ta, text) {
    const v = ta.value;
    const pos = ta.selectionStart != null ? ta.selectionStart : v.length;
    const lineStart = v.lastIndexOf('\n', pos - 1) + 1;
    let lineEnd = v.indexOf('\n', pos);
    if (lineEnd < 0) lineEnd = v.length;
    const line = v.slice(lineStart, lineEnd);
    const indent = (line.match(/^\s*/) || [''])[0] + (/:\s*$/.test(line) ? '  ' : '');
    const body = text.split('\n').join(`\n${indent}`);
    let next;
    let caret;
    if (!line.trim()) {
      next = v.slice(0, lineStart) + indent + body + v.slice(lineEnd);
      caret = lineStart + indent.length + body.length;
    } else {
      next = `${v.slice(0, lineEnd)}\n${indent}${body}${v.slice(lineEnd)}`;
      caret = lineEnd + 1 + indent.length + body.length;
    }
    ta.value = next;
    ta.focus({ preventScroll: true });
    if (ta.setSelectionRange) ta.setSelectionRange(caret, caret);
    refresh(ta);
  }

  /** Tab / Shift+Tab indent, Enter keeps the indentation (one deeper after a “:”). Returns whether it changed the code. */
  function onKey(e) {
    const ta = e.target;
    if (!ta.matches || !ta.matches('[data-code]')) return false;
    e.stopPropagation(); // the game and CookieMgr's hotkeys don't see what you type
    const v = ta.value;
    const a = ta.selectionStart;
    const b = ta.selectionEnd;
    const lineStart = v.lastIndexOf('\n', a - 1) + 1;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const cut = v.slice(lineStart, lineStart + 2) === '  ' ? 2 : v[lineStart] === ' ' ? 1 : 0;
        ta.value = v.slice(0, lineStart) + v.slice(lineStart + cut);
        ta.setSelectionRange(Math.max(lineStart, a - cut), Math.max(lineStart, b - cut));
      } else {
        ta.value = `${v.slice(0, a)}  ${v.slice(b)}`;
        ta.setSelectionRange(a + 2, a + 2);
      }
      refresh(ta);
      return true;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const line = v.slice(lineStart, a);
      const indent = (line.match(/^\s*/) || [''])[0] + (/:\s*$/.test(line) ? '  ' : '');
      ta.value = `${v.slice(0, a)}\n${indent}${v.slice(b)}`;
      ta.setSelectionRange(a + 1 + indent.length, a + 1 + indent.length);
      refresh(ta);
      return true;
    }
    return false;
  }

  function onLibSearch(input) {
    const q = input.value.trim().toLowerCase();
    const lib = input.closest('[data-ed-lib]');
    lib.querySelectorAll('.ca-lib-row').forEach((r) => r.classList.toggle('hidden', !!q && !r.dataset.libText.includes(q)));
    lib.querySelectorAll('.ca-lib-group').forEach((g) => g.classList.toggle('hidden', !!q && !g.querySelector('.ca-lib-row:not(.hidden)')));
  }

  /** The editor a library belongs to (same key), within `root`. */
  const codeFor = (root, key) => {
    const ed = [...root.querySelectorAll('[data-code-ed]')].find((x) => x.dataset.codeEd === key);
    return ed && ed.querySelector('[data-code]');
  };

  /**
   * Listens on `root` for typing, keys, the library and problem links. handlers.onChange(key, source)
   * after every change; handlers.onPick(key, item) for a library click (return true if handled).
   * Returns a function that stops listening.
   */
  function bind(root, handlers = {}) {
    const changed = (ta) => {
      const ed = editorOf(ta);
      if (ed && handlers.onChange) handlers.onChange(ed.dataset.codeEd, ta.value);
    };
    const onInput = (e) => {
      const t = e.target;
      if (t.matches && t.matches('[data-code]')) {
        refresh(t);
        changed(t);
      } else if (t.matches && t.matches('[data-lib-search]')) onLibSearch(t);
    };
    const onKeyDown = (e) => {
      if (onKey(e)) changed(e.target);
    };
    const onClick = (e) => {
      const t = e.target;
      const lib = t.closest && t.closest('[data-ed-lib]');
      if (lib) {
        const key = lib.dataset.edLib;
        const fav = t.closest('[data-lib-fav]');
        if (fav) {
          e.stopPropagation();
          CA.Util.sound('snd/tick.mp3');
          toggleFav(fav.dataset.libFav);
          // redraw this library (keeping its search)
          const q = (lib.querySelector('[data-lib-search]') || {}).value || '';
          const tmp = document.createElement('div');
          tmp.innerHTML = libraryHtml(key, { first: (lib.dataset.first || '').split('|').filter(Boolean) });
          const next = tmp.firstChild;
          next.dataset.first = lib.dataset.first || '';
          lib.replaceWith(next);
          const s = next.querySelector('[data-lib-search]');
          if (s && q) {
            s.value = q;
            onLibSearch(s);
          }
          return;
        }
        const ins = t.closest('[data-lib-insert]');
        if (!ins) return;
        e.stopPropagation();
        const it = libItems[Number(ins.dataset.libInsert)];
        if (!it) return;
        CA.Util.sound('snd/tick.mp3');
        if (handlers.onPick && handlers.onPick(key, it)) return;
        const ta = codeFor(root, key);
        if (ta) {
          insert(ta, it.insert);
          changed(ta);
        }
        return;
      }
      const go = t.closest && t.closest('[data-code-goto]');
      if (go) {
        const ta = editorOf(go) && editorOf(go).querySelector('[data-code]');
        const n = Number(go.dataset.codeGoto);
        if (ta && n > 0) {
          const pos = ta.value.split('\n').slice(0, n - 1).join('\n').length + (n > 1 ? 1 : 0);
          ta.focus({ preventScroll: true });
          if (ta.setSelectionRange) ta.setSelectionRange(pos, pos);
        }
      }
    };
    root.addEventListener('input', onInput);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('click', onClick, true);
    return () => {
      root.removeEventListener('input', onInput);
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('click', onClick, true);
    };
  }

  /** While code runs: its lines light up in the gutter, and `html` (what it's doing) shows under it. */
  function setLive(root, key, live) {
    const ed = [...root.querySelectorAll('[data-code-ed]')].find((x) => x.dataset.codeEd === key);
    if (!ed) return;
    const lines = (live && live.lines) || [];
    ed.querySelectorAll('[data-code-gutter] span').forEach((sp, i) => sp.classList.toggle('run', lines.includes(i + 1)));
    const box = ed.querySelector('[data-code-live]');
    if (box) CA.UI.Widgets.morph(box, (live && live.html) || '');
  }

  function init() {
    CA.Settings.defineOption({ key: LIB_FAVS, group: 'ui', name: 'Pinned library items', desc: '', default: '' });
  }

  return { init, html, libraryHtml, bind, setLive, insert, refresh, view, highlightLine };
})();
