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
