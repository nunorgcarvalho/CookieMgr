// One small icon set for everything CookieMgr draws: sidebar, page headers, buttons, widgets.
// Inline SVG (24×24 viewBox, fill="currentColor") so icons inherit text colour and need no
// extra assets — except the cookie, which reuses the game's own perfectCookie.png.

CA.UI = CA.UI || {};

CA.UI.Icons = (() => {
  const gear =
    '<circle cx="12" cy="12" r="6.3" fill="none" stroke="currentColor" stroke-width="3"/>' +
    [0, 45, 90, 135, 180, 225, 270, 315]
      .map((a) => `<rect x="10.4" y="1.6" width="3.2" height="5" rx="1" transform="rotate(${a} 12 12)"/>`)
      .join('');

  const stroke = (d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;

  const PATHS = {
    bolt: '<path d="M13 2 4 14h7l-1 8 10-13h-7z"/>',
    graphs: '<rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>',
    stocks: stroke('M3 17l6-6 4 4 8-9') + stroke('M15 6h6v6'),
    events:
      '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="5" cy="18" r="2"/>' +
      '<rect x="9" y="5" width="12" height="2" rx="1"/><rect x="9" y="11" width="12" height="2" rx="1"/><rect x="9" y="17" width="12" height="2" rx="1"/>',
    wizard: stroke('M4 20 14 10') + '<path d="M17 2l1.2 3.3 3.5.2-2.7 2.2.9 3.3-2.9-1.9-2.9 1.9.9-3.3-2.7-2.2 3.5-.2z"/>',
    settings: gear,
    star: '<path d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 17.3l-6.1 3.4 1.5-6.7L2.3 9.4l6.8-.7z"/>',
    starOutline:
      '<path d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 17.3l-6.1 3.4 1.5-6.7L2.3 9.4l6.8-.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    plus: '<path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/>',
    trash: '<path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7z"/>',
    edit: '<path d="M4 17.5V20h2.5L17 9.5 14.5 7zM19.7 6.8a1 1 0 0 0 0-1.4l-1.1-1.1a1 1 0 0 0-1.4 0l-1.3 1.3 2.5 2.5z"/>',
    open: '<path d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14zM5 5h6v2H7v10h10v-4h2v6H5z"/>',
    widget: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    dollar: '<text x="12" y="19" text-anchor="middle" font-size="20" font-weight="bold" font-family="Tahoma,Arial,sans-serif">$</text>',
    close: stroke('M6 6l12 12M18 6 6 18'),
    grip: '<circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>',
    download: '<path d="M11 3h2v9.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4 3.3 3.3zM4 18h16v2H4z"/>',
    upload: '<path d="M11 16h2V6.8l3.3 3.3 1.4-1.4L12 3 6.3 8.7l1.4 1.4L11 6.8zM4 18h16v2H4z"/>',
    puzzle: '<path d="M10 3a2 2 0 0 1 4 0v2h4a1 1 0 0 1 1 1v4h-2a2 2 0 0 0 0 4h2v4a1 1 0 0 1-1 1h-4v-2a2 2 0 0 0-4 0v2H6a1 1 0 0 1-1-1v-4h2a2 2 0 0 0 0-4H5V6a1 1 0 0 1 1-1h4z"/>',
    bell: '<path d="M12 3a6 6 0 0 0-6 6v4l-2 3v1h16v-1l-2-3V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0z"/>',
    ascend: stroke('M12 20V5M6 11l6-6 6 6') + '<rect x="5" y="20" width="14" height="2" rx="1"/>',
    save: '<path d="M4 3h13l3 3v15H4zM7 5v5h9V5zM7 14v5h10v-5z"/>',
    record: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.5"/>',
    refresh: stroke('M20 12a8 8 0 1 1-2.4-5.7') + '<path d="M21 3v7h-7z"/>',
    keyboard: '<path d="M2 6h20v12H2zm2 2v2h2V8zm4 0v2h2V8zm4 0v2h2V8zm4 0v2h2V8zM4 12v2h2v-2zm4 0v2h2v-2zm4 0v2h2v-2zm4 0v2h2v-2zM7 15.5v1.5h10v-1.5z" fill-rule="evenodd"/>',
    panel: '<path d="M3 4h18v16H3zm2 2v12h4V6zm6 0v12h8V6z" fill-rule="evenodd"/>',
    tag: '<path d="M3 3h8l10 10-8 8L3 11zm4.5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill-rule="evenodd"/>',
    drop: '<path d="M12 2.5S5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-12.5-7-12.5z"/>',
    link: stroke('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1') + stroke('M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'),
    log: stroke('M3 20h18M4 20V4') + stroke('M6 18c3-1 4-6 7-9s5-4 8-4'),
    shade: '<path d="M3 4h18v16H3z" opacity=".25"/><rect x="8" y="4" width="6" height="16" opacity=".75"/>',
    marker: '<path d="M12 3l6 9-6 9-6-9z"/>',
    toolbar: '<path d="M3 5h18v6H3zm2 2v2h4V7zm6 0v2h4V7z" fill-rule="evenodd"/><rect x="3" y="14" width="18" height="5" rx="1" opacity=".4"/>',
    plug: '<path d="M8 2h2v5h4V2h2v5h2v4a6 6 0 0 1-5 5.9V22h-2v-5.1A6 6 0 0 1 6 11V7h2z"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/>' + stroke('M12 7v5l3 3'),
    filter: '<path d="M3 4h18l-7 8.5V20l-4-2v-5.5z"/>',
    sparkle: '<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/>',
    trophy: '<path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.4A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.4 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1 1.7zm10 0v2.7A2 2 0 0 0 18 8V7z"/>',
    wrinkler: '<path d="M12 3c-4 0-7 3-7 7 0 3 1.6 5.4 4 6.6V21h2v-3.6h2V21h2v-4.4c2.4-1.2 4-3.6 4-6.6 0-4-3-7-7-7zm-3 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill-rule="evenodd"/>',
    lump: '<path d="M12 2l7 4.5v9L12 22l-7-6.5v-9z" opacity=".9"/><path d="M12 2v20M5 6.5l14 9M19 6.5l-14 9" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/>' + stroke('M15 15l5.5 5.5'),
    timeline:stroke('M3 12h4M10 12h4M17 12h4') + '<circle cx="8.5" cy="12" r="1.5"/><circle cx="15.5" cy="12" r="1.5"/>',
  };

  /** HTML for icon `name` at `size` px. Unknown names render as nothing. */
  function html(name, size = 16, extraClass = '') {
    const cls = `ca-ico${extraClass ? ' ' + extraClass : ''}`;
    if (name === 'cookie') return `<span class="${cls} ca-ico-cookie" style="width:${size}px;height:${size}px"></span>`;
    const p = PATHS[name];
    if (!p) return '';
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${p}</svg>`;
  }

  const has = (name) => name === 'cookie' || name in PATHS;

  return { html, has };
})();
