/*! CookieMgr v2.11.0 */
(function () {
'use strict';
const CA = {};
CA.VERSION = "2.11.0";
CA.CSS = "/* ==========================================================================\n   CookieMgr — styles\n   Colours and borders borrow from the game's own \"framed\" look so the panel\n   feels native. Everything is scoped under #CookieMgrTab / #CookieMgrMenu.\n   ========================================================================== */\n\n/* ---------- Sidebar (icon tabs sticking out of the left beam, one per page) ---------- */\n\n#CookieMgrTab {\n  position: absolute;\n  left: 30%;\n  top: calc(10% + 96px); /* fallback; tab.js pins it just under the game's cookie-count banner */\n  margin-left: 3px; /* tuck slightly under the beam */\n  transform: translateX(-100%);\n  z-index: 110;\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end; /* items grow leftwards, away from the beam */\n  gap: 4px;\n}\n#CookieMgrTab .ca-tab-item {\n  box-sizing: border-box;\n  height: 32px;\n  display: flex;\n  align-items: center;\n  cursor: pointer;\n  user-select: none;\n  background: linear-gradient(to right, #3d2716, #221409);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-right: none;\n  border-radius: 8px 0 0 8px;\n  box-shadow:\n    -3px 3px 10px rgba(0, 0, 0, 0.65),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.18);\n  transition:\n    background 0.2s,\n    box-shadow 0.2s;\n  outline: none;\n}\n#CookieMgrTab .ca-tab-item:hover,\n#CookieMgrTab .ca-tab-item:focus-visible {\n  box-shadow:\n    -3px 3px 12px rgba(0, 0, 0, 0.75),\n    0 0 12px rgba(255, 215, 110, 0.35),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.25);\n}\n#CookieMgrTab .ca-tab-item.selected {\n  background: linear-gradient(to right, #7a4f22, #43290f);\n  box-shadow:\n    -3px 3px 12px rgba(0, 0, 0, 0.75),\n    0 0 14px rgba(255, 215, 110, 0.55),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.3);\n}\n#CookieMgrTab .ca-tab-label {\n  max-width: 0;\n  overflow: hidden;\n  opacity: 0;\n  padding: 0;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 13px;\n  letter-spacing: 0.5px;\n  color: #f4e6c3;\n  text-shadow:\n    0 1px 2px #000,\n    0 0 6px rgba(255, 200, 120, 0.25);\n  white-space: nowrap;\n  transition:\n    max-width 0.22s ease-out,\n    opacity 0.15s,\n    padding 0.22s ease-out;\n}\n#CookieMgrTab .ca-tab-item:hover .ca-tab-label,\n#CookieMgrTab .ca-tab-item:focus-visible .ca-tab-label {\n  max-width: 180px;\n  opacity: 1;\n  padding: 0 2px 0 12px;\n}\n#CookieMgrTab .ca-tab-icon {\n  position: relative;\n  flex: none;\n  width: 30px;\n  height: 30px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #f4e6c3;\n  filter: drop-shadow(0 1px 1px #000);\n}\n#CookieMgrTab .ca-tab-item.selected .ca-tab-icon,\n#CookieMgrTab .ca-tab-item:hover .ca-tab-icon {\n  color: #ffeab0;\n}\n#CookieMgrTab .ca-tab-badge {\n  display: none;\n  position: absolute;\n  top: -5px;\n  left: -5px;\n  min-width: 15px;\n  height: 15px;\n  padding: 0 3px;\n  box-sizing: border-box;\n  border-radius: 8px;\n  font:\n    bold 9px/15px Tahoma,\n    Arial,\n    sans-serif;\n  text-align: center;\n  color: #fff;\n  background: linear-gradient(#63c64a, #2f7d24);\n  box-shadow:\n    0 0 6px rgba(120, 240, 100, 0.8),\n    0 1px 1px #000;\n  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.6);\n}\n#CookieMgrTab .ca-tab-item.active .ca-tab-badge {\n  display: block;\n  animation: caBadgeGlow 2s infinite ease-in-out;\n}\n@keyframes caBadgeGlow {\n  0%,\n  100% {\n    box-shadow:\n      0 0 4px rgba(120, 240, 100, 0.6),\n      0 1px 1px #000;\n  }\n  50% {\n    box-shadow:\n      0 0 10px rgba(120, 240, 100, 1),\n      0 1px 1px #000;\n  }\n}\n#game.ascending #CookieMgrTab,\n#game.ascendIntro #CookieMgrTab,\n#game.reincarnating #CookieMgrTab {\n  display: none;\n}\n\n/* ---------- Icons (used everywhere, not just inside the panel) ---------- */\n\n.ca-ico {\n  display: inline-block;\n  flex: none;\n  vertical-align: middle;\n}\n.ca-ico-cookie {\n  background: url(img/perfectCookie.png) center / contain no-repeat;\n}\n\n/* ---------- Stock market toolbar inside the Bank minigame ---------- */\n\n#cm-bank-toolbar {\n  position: relative;\n  z-index: 10;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 4px 4px 6px;\n}\n#cm-bank-toolbar .bankButton {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 11px;\n  padding: 3px 9px;\n}\n#cm-bank-toolbar .cm-bt-open {\n  color: #f4e6c3;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n}\n\n/* ---------- Panel ---------- */\n\n#CookieMgrMenu {\n  max-width: none; /* use the whole middle section */\n  margin: 0 auto;\n  padding: 0 16px 120px;\n  color: #ddd;\n}\n#CookieMgrMenu .ca-tagline {\n  text-align: center;\n  margin: -6px 0 14px;\n  font-size: 12px;\n  font-style: italic;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n}\n\n/* Cards */\n#CookieMgrMenu .ca-card {\n  margin: 14px 4px;\n  border-radius: 6px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  background: rgba(0, 0, 0, 0.38);\n  box-shadow:\n    0 0 1px #000,\n    inset 0 0 1px #000,\n    0 6px 16px rgba(0, 0, 0, 0.35);\n  overflow: hidden;\n}\n#CookieMgrMenu .ca-card-head {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 10px;\n  padding: 9px 14px;\n  background: linear-gradient(to right, rgba(255, 235, 190, 0.09), rgba(255, 235, 190, 0));\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-card-title {\n  flex: 1;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-size: 20px;\n  color: #fff;\n  text-shadow:\n    0 -1px 5px rgba(255, 255, 200, 0.35),\n    0 1px 3px #000;\n}\n#CookieMgrMenu .ca-card-ico {\n  margin-right: 8px;\n  vertical-align: -1px;\n  color: #ffd98a;\n  filter: drop-shadow(0 1px 2px #000);\n}\n#CookieMgrMenu .ca-row-ico {\n  flex: 0 0 28px;\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #e8d7b0;\n  background: radial-gradient(circle at 35% 30%, rgba(255, 230, 170, 0.18), rgba(0, 0, 0, 0.25));\n  box-shadow:\n    inset 0 0 0 1px rgba(255, 220, 150, 0.25),\n    0 1px 3px rgba(0, 0, 0, 0.6);\n}\n#CookieMgrMenu .ca-row-option:has(.ca-switch.on) .ca-row-ico {\n  color: #ffeab0;\n  box-shadow:\n    inset 0 0 0 1px rgba(255, 220, 150, 0.55),\n    0 0 8px rgba(255, 210, 110, 0.35);\n}\n#CookieMgrMenu .ca-row-ico .ca-ico-cookie {\n  width: 18px !important;\n  height: 18px !important;\n}\n#CookieMgrMenu .ca-pill {\n  font-size: 11px;\n  white-space: nowrap;\n  padding: 3px 10px;\n  border-radius: 10px;\n  color: #bbb;\n  background: rgba(255, 255, 255, 0.07);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  transition: all 0.2s;\n}\n#CookieMgrMenu .ca-pill.on {\n  color: #cfc;\n  background: rgba(80, 200, 90, 0.16);\n  border-color: rgba(130, 235, 120, 0.5);\n}\n\n/* Rows */\n#CookieMgrMenu .ca-row {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px 12px;\n  padding: 8px 14px;\n  border-top: 1px solid rgba(255, 255, 255, 0.05);\n  transition: background 0.2s;\n}\n#CookieMgrMenu .ca-list .ca-row:first-child {\n  border-top: none;\n}\n#CookieMgrMenu .ca-row:hover {\n  background: rgba(255, 255, 255, 0.035);\n}\n#CookieMgrMenu .ca-row.on {\n  background: linear-gradient(to right, rgba(255, 210, 90, 0.12), rgba(255, 210, 90, 0) 65%);\n}\n#CookieMgrMenu .ca-row-master {\n  background: rgba(0, 0, 0, 0.22);\n  border-top: none;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-row-option {\n  padding-top: 10px;\n  padding-bottom: 10px;\n}\n#CookieMgrMenu .ca-row-text {\n  flex: 1 1 160px;\n  min-width: 0;\n}\n#CookieMgrMenu .ca-row-option {\n  flex-wrap: nowrap;\n}\n#CookieMgrMenu .ca-row-option .ca-row-text {\n  flex-basis: 0;\n}\n#CookieMgrMenu .ca-controls {\n  flex: 0 1 auto;\n  max-width: 100%;\n  margin-left: auto;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n}\n#CookieMgrMenu .ca-row-name {\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 14px;\n  color: #f2ead2;\n  text-shadow: 0 1px 2px #000;\n}\n#CookieMgrMenu .ca-row-desc {\n  margin-top: 2px;\n  font-size: 11px;\n  color: #b3a590;\n  text-shadow: 0 1px 1px #000;\n}\n\n/* Icons */\n#CookieMgrMenu .ca-icon {\n  flex: 0 0 36px;\n  width: 36px;\n  height: 36px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition:\n    filter 0.25s,\n    transform 0.25s;\n  filter: grayscale(0.55) brightness(0.8);\n}\n#CookieMgrMenu .ca-row.on .ca-icon,\n#CookieMgrMenu .ca-row-master .ca-icon {\n  filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.75));\n}\n#CookieMgrMenu .ca-row.on .ca-icon {\n  transform: scale(1.06);\n}\n#CookieMgrMenu .ca-img {\n  width: 36px;\n  height: 36px;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}\n#CookieMgrMenu .ca-sprite {\n  flex: none;\n  width: 48px;\n  height: 48px;\n  background-image: url(img/icons.png);\n  transform: scale(0.75);\n}\n\n/* Toggle switch */\n#CookieMgrMenu .ca-switch {\n  flex: none;\n  padding: 2px;\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n#CookieMgrMenu .ca-switch:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-switch-track {\n  display: block;\n  position: relative;\n  width: 42px;\n  height: 22px;\n  box-sizing: border-box;\n  border-radius: 11px;\n  background: #2a211c;\n  border: 1px solid rgba(255, 255, 255, 0.22);\n  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.75);\n  transition:\n    background 0.2s,\n    border-color 0.2s,\n    box-shadow 0.2s;\n}\n#CookieMgrMenu .ca-switch-knob {\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 35% 30%, #fff, #c9c1b5 55%, #8a8178);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);\n  transition: left 0.18s ease-out;\n}\n#CookieMgrMenu .ca-switch:hover .ca-switch-track {\n  border-color: rgba(255, 225, 150, 0.6);\n}\n#CookieMgrMenu .ca-switch.on .ca-switch-track {\n  background: linear-gradient(#66c84b, #2f7d24);\n  border-color: #a5ea93;\n  box-shadow:\n    inset 0 1px 3px rgba(0, 0, 0, 0.35),\n    0 0 9px rgba(110, 230, 90, 0.45);\n}\n#CookieMgrMenu .ca-switch.on .ca-switch-knob {\n  left: 22px;\n}\n#CookieMgrMenu .ca-switch:focus-visible .ca-switch-track {\n  outline: 2px solid #ffd76a;\n  outline-offset: 2px;\n}\n\n/* Hotkey chips */\n#CookieMgrMenu .ca-hotkey {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n}\n#CookieMgrMenu .ca-key {\n  min-width: 46px;\n  height: 26px;\n  padding: 0 10px;\n  font:\n    bold 12px Tahoma,\n    Arial,\n    sans-serif;\n  color: #f4e6c3;\n  text-shadow: 0 1px 1px #000;\n  background: linear-gradient(#4d3c2d, #2a2018);\n  border: 1px solid;\n  border-color: #9a7d5b #3b2c1f #2a1f15 #74604a;\n  border-radius: 5px;\n  box-shadow:\n    0 2px 0 #140d08,\n    inset 0 1px 0 rgba(255, 255, 255, 0.16);\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    border-color 0.15s,\n    box-shadow 0.15s;\n}\n#CookieMgrMenu .ca-key:hover {\n  color: #fff;\n  border-color: #e0c08a #5a4430 #3d2e20 #b39468;\n}\n#CookieMgrMenu .ca-key:active {\n  transform: translateY(1px);\n  box-shadow:\n    0 1px 0 #140d08,\n    inset 0 1px 0 rgba(255, 255, 255, 0.16);\n}\n#CookieMgrMenu .ca-key:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-hotkey.unset .ca-key {\n  color: #8f877a;\n  font-weight: normal;\n  font-style: italic;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px dashed rgba(255, 255, 255, 0.22);\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-hotkey.capturing .ca-key {\n  color: #ffe9a6;\n  border-color: #ffd76a;\n  animation: caCapture 1.1s infinite ease-in-out;\n}\n@keyframes caCapture {\n  0%,\n  100% {\n    box-shadow:\n      0 2px 0 #140d08,\n      0 0 0 0 rgba(255, 215, 106, 0.5);\n  }\n  50% {\n    box-shadow:\n      0 2px 0 #140d08,\n      0 0 12px 2px rgba(255, 215, 106, 0.55);\n  }\n}\n#CookieMgrMenu .ca-key-clear {\n  width: 18px;\n  height: 18px;\n  margin-left: 3px;\n  padding: 0;\n  border: none;\n  border-radius: 50%;\n  background: transparent;\n  color: #b09a8a;\n  font-size: 14px;\n  line-height: 18px;\n  cursor: pointer;\n  opacity: 0;\n  transition:\n    opacity 0.15s,\n    background 0.15s;\n}\n#CookieMgrMenu .ca-row:hover .ca-key-clear {\n  opacity: 0.8;\n}\n#CookieMgrMenu .ca-key-clear:hover {\n  color: #fff;\n  background: rgba(255, 80, 80, 0.35);\n}\n#CookieMgrMenu .ca-hotkey.unset .ca-key-clear,\n#CookieMgrMenu .ca-hotkey.capturing .ca-key-clear {\n  visibility: hidden;\n}\n\n/* Buttons */\n#CookieMgrMenu .ca-btn {\n  padding: 4px 12px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 12px;\n  color: #ddd;\n  text-shadow: 0 1px 1px #000;\n  background: linear-gradient(#3e2f23, #1d140f);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 4px;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    inset 0 1px 0 rgba(255, 255, 255, 0.12);\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    box-shadow 0.15s,\n    opacity 0.15s;\n}\n#CookieMgrMenu .ca-btn:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-btn:not(:disabled):hover {\n  color: #fff;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    0 0 9px rgba(255, 220, 120, 0.35),\n    inset 0 1px 0 rgba(255, 255, 255, 0.18);\n}\n#CookieMgrMenu .ca-btn:not(:disabled):active {\n  transform: translateY(1px);\n}\n#CookieMgrMenu .ca-btn-on:not(:disabled):hover {\n  color: #d6ffcc;\n}\n#CookieMgrMenu .ca-btn-off:not(:disabled):hover {\n  color: #ffd2cc;\n}\n#CookieMgrMenu .ca-btn:disabled {\n  opacity: 0.38;\n  cursor: default;\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-btn-small {\n  font-size: 11px;\n  padding: 3px 10px;\n}\n#CookieMgrMenu .ca-btn .ca-ico {\n  vertical-align: -2px;\n}\n#CookieMgrMenu .ca-btn.ca-armed {\n  color: #fff;\n  background: #8a2a22;\n  box-shadow: 0 0 0 1px #e5484d, 0 0 8px rgba(229, 72, 77, 0.6);\n}\n#CookieMgrMenu .ca-btn-lg {\n  padding: 10px 20px;\n  font-size: 15px;\n  border-radius: 6px;\n}\n#CookieMgrMenu .ca-btn-danger {\n  color: #ffdcd2;\n  background: linear-gradient(#6b2420, #3a1210);\n  border-color: #ffb199 #7a2a1e #5c1b12 #d98a6e;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    0 0 10px rgba(255, 90, 60, 0.25),\n    inset 0 1px 0 rgba(255, 255, 255, 0.15);\n}\n#CookieMgrMenu .ca-btn-danger:not(:disabled):hover {\n  color: #fff;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    0 0 16px rgba(255, 90, 60, 0.5),\n    inset 0 1px 0 rgba(255, 255, 255, 0.2);\n}\n#CookieMgrMenu .ca-card-danger {\n  border-color: rgba(255, 110, 80, 0.3);\n  box-shadow:\n    0 0 1px #000,\n    inset 0 0 1px #000,\n    0 0 14px rgba(255, 70, 40, 0.12),\n    0 6px 16px rgba(0, 0, 0, 0.35);\n}\n#CookieMgrMenu .ca-row-sellall {\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n}\n\n/* Footer */\n#CookieMgrMenu .ca-footer {\n  margin: 18px 8px 0;\n  font-size: 11px;\n  line-height: 1.7;\n  text-align: center;\n  color: #9b907f;\n  text-shadow: 0 1px 1px #000;\n}\n#CookieMgrMenu .ca-footer b {\n  color: #c9bba3;\n}\n#CookieMgrMenu kbd {\n  display: inline-block;\n  padding: 0 5px;\n  font:\n    bold 10px/16px Tahoma,\n    Arial,\n    sans-serif;\n  color: #e8dcc2;\n  background: #2a2018;\n  border: 1px solid #5a4632;\n  border-radius: 3px;\n  box-shadow: 0 1px 0 #140d08;\n}\n#CookieMgrMenu .ca-footer-actions {\n  margin-top: 8px;\n}\n\n#CookieMgrMenu .ca-page {\n  animation: caFade 0.18s ease-out;\n}\n@keyframes caFade {\n  from {\n    opacity: 0;\n    transform: translateY(3px);\n  }\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n#CookieMgrMenu a {\n  color: #ffd98a;\n}\n\n/* ---------- Graph ---------- */\n\n#CookieMgrMenu .ca-live {\n  font-size: 11px;\n  padding: 3px 10px 3px 20px;\n  position: relative;\n  border-radius: 10px;\n  color: #cfc;\n  background: rgba(80, 200, 90, 0.16);\n  border: 1px solid rgba(130, 235, 120, 0.5);\n}\n#CookieMgrMenu .ca-live:before {\n  content: '';\n  position: absolute;\n  left: 8px;\n  top: 50%;\n  width: 6px;\n  height: 6px;\n  margin-top: -3px;\n  border-radius: 50%;\n  background: #7be07b;\n  box-shadow: 0 0 6px #7be07b;\n  animation: caBadgeGlow 1.6s infinite ease-in-out;\n}\n#CookieMgrMenu .ca-live.paused {\n  color: #ffd9a0;\n  background: rgba(255, 170, 60, 0.14);\n  border-color: rgba(255, 190, 100, 0.5);\n}\n#CookieMgrMenu .ca-live.paused:before {\n  background: #ffb45c;\n  box-shadow: none;\n  animation: none;\n}\n\n#CookieMgrMenu .ca-stats {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));\n  gap: 1px;\n  background: rgba(255, 255, 255, 0.06);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-stat {\n  min-width: 0; /* lets the grid cell shrink below its content so overflow/ellipsis below can work */\n  padding: 8px 12px;\n  background: rgba(0, 0, 0, 0.32);\n}\n#CookieMgrMenu .ca-stat-label {\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #a89a83;\n}\n#CookieMgrMenu .ca-stat-value {\n  margin-top: 2px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 17px;\n  color: #ffeab0;\n  text-shadow: 0 1px 3px #000;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n#CookieMgrMenu .ca-stat-sub {\n  margin-top: 1px;\n  font-size: 10px;\n  color: #93866f;\n  white-space: nowrap;\n}\n\n#CookieMgrMenu .ca-toolbar {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px 12px;\n  padding: 8px 12px;\n}\n#CookieMgrMenu .ca-toolbar-bottom {\n  padding-top: 6px;\n}\n#CookieMgrMenu .ca-chipgroup {\n  display: inline-flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 4px;\n}\n#CookieMgrMenu .ca-chip-label {\n  margin-right: 2px;\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #93866f;\n}\n#CookieMgrMenu .ca-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 3px 9px;\n  font:\n    bold 11px Tahoma,\n    Arial,\n    sans-serif;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.14);\n  border-radius: 11px;\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    background 0.15s,\n    border-color 0.15s;\n}\n#CookieMgrMenu .ca-chip:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-chip:hover {\n  color: #fff;\n  border-color: rgba(255, 225, 150, 0.5);\n}\n#CookieMgrMenu .ca-chip.on {\n  color: #fff3cf;\n  background: rgba(255, 200, 100, 0.18);\n  border-color: rgba(255, 210, 120, 0.6);\n}\n#CookieMgrMenu .ca-sw {\n  display: inline-block;\n  width: 9px;\n  height: 9px;\n  margin-right: 1px;\n  border-radius: 50%;\n  vertical-align: -1px;\n  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55);\n}\n\n#CookieMgrMenu .ca-graph-wrap {\n  position: relative;\n  margin: 0 8px;\n}\n#CookieMgrMenu canvas.ca-graph {\n  display: block;\n  width: 100%;\n  height: 300px;\n  cursor: crosshair;\n}\n#CookieMgrMenu canvas.ca-graph.ca-graph-small {\n  height: 160px;\n}\n#CookieMgrMenu .ca-tip {\n  display: none;\n  position: absolute;\n  z-index: 5;\n  max-width: 270px;\n  min-width: 150px;\n  padding: 7px 10px;\n  pointer-events: none;\n  font-size: 11px;\n  line-height: 1.35;\n  color: #e6dcc6;\n  background: rgba(14, 10, 6, 0.95);\n  border: 1px solid;\n  border-color: #b98a4e #6a4626 #55301c #a0764a;\n  border-radius: 5px;\n  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);\n}\n#CookieMgrMenu .ca-tip-head {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-bottom: 4px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 12px;\n  color: #ffeab0;\n}\n#CookieMgrMenu .ca-tip-head span {\n  margin-left: auto;\n  padding-left: 10px;\n  font:\n    normal 10px Tahoma,\n    Arial,\n    sans-serif;\n  color: #a89a83;\n}\n#CookieMgrMenu .ca-tip-row {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 1px 0;\n}\n#CookieMgrMenu .ca-tip-row b {\n  font-weight: normal;\n  color: #b9ab93;\n}\n#CookieMgrMenu .ca-tip-row span {\n  margin-left: auto;\n  padding-left: 12px;\n  text-align: right;\n  color: #f2ead2;\n}\n#CookieMgrMenu .ca-tip-row.strong b,\n#CookieMgrMenu .ca-tip-row.strong span {\n  color: #fff3cf;\n  font-weight: bold;\n}\n#CookieMgrMenu .ca-tip-sep {\n  height: 1px;\n  margin: 5px 0;\n  background: rgba(255, 255, 255, 0.14);\n}\n#CookieMgrMenu .ca-tip-note {\n  margin: 2px 0 4px;\n  font-style: italic;\n  color: #a89a83;\n}\n\n#CookieMgrMenu .ca-legend {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px 12px;\n  min-height: 16px;\n  padding: 2px 14px 12px;\n  font-size: 11px;\n  color: #b9ab93;\n}\n#CookieMgrMenu .ca-legend-item em {\n  font-style: normal;\n  color: #93866f;\n}\n#CookieMgrMenu .ca-legend-empty {\n  font-style: italic;\n  color: #7f735f;\n}\n\n#CookieMgrMenu .ca-hidden {\n  display: none;\n}\n\n/* ---------- Stock transaction log + ticker ---------- */\n\n#CookieMgrMenu .cm-tx-wrap {\n  max-height: 220px;\n  overflow-y: auto;\n  margin: 0 4px 6px;\n}\n#CookieMgrMenu .cm-tx-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 11px;\n}\n#CookieMgrMenu .cm-tx-table th {\n  position: sticky;\n  top: 0;\n  text-align: left;\n  padding: 4px 8px;\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #93866f;\n  background: #1c150d;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n}\n#CookieMgrMenu .cm-tx-table td {\n  padding: 3px 8px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n  white-space: nowrap;\n  color: #d8cbb0;\n}\n#CookieMgrMenu .cm-tx-row:hover td {\n  background: rgba(255, 255, 255, 0.04);\n}\n#CookieMgrMenu .cm-tx-buy {\n  color: #8f8;\n  font-weight: bold;\n}\n#CookieMgrMenu .cm-tx-sell {\n  color: #f88;\n  font-weight: bold;\n}\n#CookieMgrMenu .cm-tx-empty {\n  padding: 14px 8px;\n  text-align: center;\n  font-style: italic;\n  color: #7f735f;\n  font-size: 12px;\n}\n\n#CookieMgrMenu .cm-tickbars {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  margin: 0 8px 8px;\n}\n#CookieMgrMenu .cm-tickbar {\n  flex: 1 1 90px;\n  min-width: 70px;\n  padding: 5px 6px;\n  background: rgba(0, 0, 0, 0.28);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 4px;\n  font-size: 10px;\n}\n#CookieMgrMenu .cm-tickbar-time {\n  color: #93866f;\n  text-align: center;\n  margin-bottom: 3px;\n  white-space: nowrap;\n}\n#CookieMgrMenu .cm-tickbar-row {\n  height: 5px;\n  background: rgba(255, 255, 255, 0.06);\n  border-radius: 3px;\n  margin-bottom: 2px;\n  overflow: hidden;\n}\n#CookieMgrMenu .cm-tickbar-fill {\n  display: block;\n  height: 100%;\n  border-radius: 3px;\n}\n#CookieMgrMenu .cm-tickbar-buy {\n  background: #8f8;\n}\n#CookieMgrMenu .cm-tickbar-sell {\n  background: #f88;\n}\n#CookieMgrMenu .cm-tickbar-net {\n  text-align: center;\n  font-weight: bold;\n  margin-top: 3px;\n}\n#CookieMgrMenu .cm-ticks-empty {\n  margin: 0 8px 8px;\n  padding: 10px;\n  text-align: center;\n  font-style: italic;\n  color: #7f735f;\n  font-size: 11px;\n}\n\n#CookieMgrMenu .cm-ticker {\n  margin: 8px 8px 10px;\n  padding: 6px 0;\n  overflow: hidden;\n  white-space: nowrap;\n  background: rgba(0, 0, 0, 0.32);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 4px;\n}\n#CookieMgrMenu .cm-ticker-track {\n  display: inline-block;\n  will-change: transform;\n}\n#CookieMgrMenu .cm-tick-item {\n  display: inline-block;\n  padding: 0 16px;\n  font:\n    bold 11px Tahoma,\n    Arial,\n    sans-serif;\n  color: #cbbfa6;\n}\n#CookieMgrMenu .cm-tick-buy {\n  color: #8f8;\n}\n#CookieMgrMenu .cm-tick-sell {\n  color: #f88;\n}\n#CookieMgrMenu .cm-tick-empty {\n  color: #7f735f;\n  font-style: italic;\n  font-weight: normal;\n}\n#CookieMgrMenu .cm-tick-sep {\n  color: #4a4232;\n  padding: 0 4px;\n}\n\n@keyframes cmTickerScroll {\n  from {\n    transform: translateX(0);\n  }\n  to {\n    transform: translateX(-50%);\n  }\n}\n\n/* ---------- Sub-tabs (Graphs page and others) ---------- */\n\n#CookieMgrMenu .ca-subtabs {\n  display: flex;\n  gap: 4px;\n  margin: 2px 0 10px;\n  padding: 0 4px;\n  border-bottom: 1px solid rgba(255, 220, 150, 0.25);\n}\n#CookieMgrMenu .ca-subtab {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 14px 5px;\n  margin-bottom: -1px;\n  font:\n    bold 12px Tahoma,\n    Arial,\n    sans-serif;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n  background: rgba(0, 0, 0, 0.25);\n  border: 1px solid rgba(255, 220, 150, 0.18);\n  border-bottom-color: transparent;\n  border-radius: 6px 6px 0 0;\n  cursor: pointer;\n}\n#CookieMgrMenu .ca-subtab:hover {\n  color: #f0e2c0;\n}\n#CookieMgrMenu .ca-subtab.on {\n  color: #fff3cf;\n  background: linear-gradient(to bottom, rgba(255, 200, 100, 0.2), rgba(0, 0, 0, 0.3));\n  border-color: rgba(255, 220, 150, 0.45);\n  border-bottom-color: #1c150d;\n}\n#CookieMgrMenu .ca-subtab .ca-ico-cookie {\n  width: 14px !important;\n  height: 14px !important;\n}\n\n/* ---------- Tables, notes ---------- */\n\n#CookieMgrMenu .ca-card-note {\n  padding: 0 14px 6px;\n  font-size: 11px;\n  line-height: 1.4;\n  color: #a39477;\n}\n#CookieMgrMenu .ca-table-wrap {\n  padding: 4px 10px 6px;\n  overflow: hidden;\n}\n#CookieMgrMenu .ca-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 11px;\n}\n#CookieMgrMenu .ca-table th {\n  text-align: right;\n  padding: 4px 8px;\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #93866f;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  white-space: nowrap;\n}\n#CookieMgrMenu .ca-table th:first-child,\n#CookieMgrMenu .ca-table td:first-child {\n  text-align: left;\n}\n#CookieMgrMenu .ca-table td {\n  text-align: right;\n  padding: 3px 8px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n  white-space: nowrap;\n  color: #d8cbb0;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrMenu .ca-table tr.strong td {\n  color: #fff3cf;\n  font-weight: bold;\n}\n#CookieMgrMenu .ca-table tbody tr:hover td {\n  background: rgba(255, 255, 255, 0.04);\n}\n#CookieMgrMenu .ca-sw.ca-sw-dash {\n  width: 10px;\n  height: 0;\n  border-radius: 0;\n  border-top: 2px dashed;\n  box-shadow: none;\n  vertical-align: 2px;\n}\n#CookieMgrMenu .ca-chip .ca-ico {\n  vertical-align: -2px;\n}\n\n/* ---------- Events page ---------- */\n\n#CookieMgrMenu .ca-table td.pos {\n  color: #9be89b;\n}\n#CookieMgrMenu .ca-table td.neg {\n  color: #ff9a8a;\n}\n#CookieMgrMenu .ca-table tr.muted td {\n  color: #6f6555;\n}\n#CookieMgrMenu .ca-ev-dot {\n  display: inline-flex;\n  width: 16px;\n  margin-right: 5px;\n  vertical-align: -2px;\n}\n#CookieMgrMenu .ca-ev-chip em {\n  font-style: normal;\n  opacity: 0.6;\n  font-weight: normal;\n}\n#CookieMgrMenu .ca-ev-chip .ca-ico {\n  color: var(--c);\n}\n#CookieMgrMenu .ca-ev-chip:not(.on) {\n  opacity: 0.5;\n}\n#CookieMgrMenu .ca-ev-chip:not(.on) .ca-ico {\n  color: inherit;\n}\n#CookieMgrMenu .ca-search {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex: 1 1 160px;\n  padding: 3px 8px;\n  color: #93866f;\n  background: rgba(0, 0, 0, 0.35);\n  border: 1px solid rgba(255, 220, 150, 0.2);\n  border-radius: 12px;\n}\n#CookieMgrMenu .ca-search input {\n  flex: 1;\n  min-width: 0;\n  font: 12px Tahoma, Arial, sans-serif;\n  color: #f0e2c0;\n  background: transparent;\n  border: none;\n  outline: none;\n}\n#CookieMgrMenu .ca-ev-list {\n  max-height: 420px;\n  overflow-y: auto;\n  padding: 0 6px 8px;\n}\n#CookieMgrMenu .ca-ev-row {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding: 4px 8px;\n  font-size: 11px;\n  color: #d8cbb0;\n  border-left: 2px solid var(--c);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.04);\n}\n#CookieMgrMenu .ca-ev-row:hover {\n  background: rgba(255, 255, 255, 0.04);\n}\n#CookieMgrMenu .ca-ev-ico {\n  flex: none;\n  color: var(--c);\n  align-self: center;\n  display: inline-flex;\n}\n#CookieMgrMenu .ca-ev-ico .ca-ico-cookie {\n  width: 14px !important;\n  height: 14px !important;\n}\n#CookieMgrMenu .ca-ev-time {\n  flex: none;\n  color: #93866f;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrMenu .ca-ev-text {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n#CookieMgrMenu .ca-ev-text b {\n  color: #f0e2c0;\n}\n#CookieMgrMenu .ca-ev-text span {\n  color: #a39477;\n}\n#CookieMgrMenu .ca-ev-cookies {\n  flex: none;\n  font-weight: bold;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrMenu .ca-ev-cookies.pos {\n  color: #9be89b;\n}\n#CookieMgrMenu .ca-ev-cookies.neg {\n  color: #ff9a8a;\n}\n#CookieMgrMenu .ca-ev-more {\n  display: block;\n  margin: 8px auto 0;\n}\n#CookieMgrMenu .ca-ev-empty {\n  display: block;\n  padding: 12px;\n  text-align: center;\n}\n\n/* ---------- Macros ---------- */\n\n#CookieMgrMenu .ca-icon-ico {\n  color: #ffd98a;\n  border-radius: 50%;\n  background: radial-gradient(circle at 35% 30%, rgba(255, 230, 170, 0.22), rgba(0, 0, 0, 0.3));\n  box-shadow: inset 0 0 0 1px rgba(255, 220, 150, 0.3);\n}\n#CookieMgrMenu .ca-icon-ico.small {\n  flex: 0 0 20px;\n  width: 20px;\n  height: 20px;\n}\n#CookieMgrMenu .ca-status-head .ca-icon {\n  flex: 0 0 20px;\n  width: 20px;\n  height: 20px;\n}\n#CookieMgrMenu .ca-status-head .ca-img,\n#CookieMgrMenu .ca-status-head .ca-sprite {\n  transform: scale(0.42);\n  transform-origin: center;\n}\n#CookieMgrMenu .ca-badge {\n  display: inline-block;\n  margin-left: 6px;\n  padding: 1px 7px;\n  font:\n    bold 9px Tahoma,\n    Arial,\n    sans-serif;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  vertical-align: 2px;\n  color: #c9bba0;\n  border-radius: 8px;\n  background: rgba(255, 255, 255, 0.07);\n  border: 1px solid rgba(255, 255, 255, 0.12);\n}\n#CookieMgrMenu .ca-badge-when {\n  color: #9fd3ff;\n  border-color: rgba(120, 190, 255, 0.35);\n}\n#CookieMgrMenu .ca-badge-once {\n  color: #ffd27a;\n  border-color: rgba(255, 200, 100, 0.35);\n}\n#CookieMgrMenu .ca-steps {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 3px;\n  margin-top: 4px;\n}\n#CookieMgrMenu .ca-step {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 1px 7px 1px 5px;\n  font-size: 10px;\n  color: #d8cbb0;\n  border-radius: 9px;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px solid rgba(255, 220, 150, 0.15);\n}\n#CookieMgrMenu .ca-step .ca-ico {\n  color: #ffd98a;\n}\n#CookieMgrMenu .ca-step .ca-ico-cookie {\n  width: 12px !important;\n  height: 12px !important;\n}\n#CookieMgrMenu .ca-step-arrow {\n  color: #93866f;\n  font-weight: bold;\n}\n#CookieMgrMenu .ca-macro-status {\n  margin-top: 3px;\n  font-size: 10px;\n  color: #8fd18f;\n}\n#CookieMgrMenu .ca-macro-status:empty {\n  display: none;\n}\n#CookieMgrMenu .ca-macro:not(.on) .ca-macro-status {\n  color: #93866f;\n}\n#CookieMgrMenu .ca-iconbtn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 24px;\n  height: 24px;\n  padding: 0 4px;\n  font-size: 10px;\n  color: #b9ab93;\n  background: rgba(0, 0, 0, 0.25);\n  border: 1px solid rgba(255, 220, 150, 0.15);\n  border-radius: 6px;\n  cursor: pointer;\n}\n#CookieMgrMenu .ca-iconbtn:hover:not(:disabled) {\n  color: #fff3cf;\n  border-color: rgba(255, 220, 150, 0.45);\n}\n#CookieMgrMenu .ca-iconbtn:disabled {\n  opacity: 0.3;\n  cursor: default;\n}\n#CookieMgrMenu .ca-iconbtn.on,\n#CookieMgrMenu .ca-fav.on {\n  color: #ffd54a;\n  border-color: rgba(255, 213, 74, 0.55);\n}\n#CookieMgrMenu .ca-btn-run .ca-ico {\n  vertical-align: -1px;\n}\n\n/* status block (\"Running now\", also a widget) */\n#CookieMgrMenu .ca-status {\n  padding: 4px 12px 10px;\n}\n.ca-status-empty {\n  padding: 6px 2px;\n  font-size: 11px;\n  color: #93866f;\n}\n.ca-status-macro {\n  padding: 5px 0 6px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n.ca-status-macro:last-child {\n  border-bottom: none;\n}\n.ca-status-head {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  font-size: 12px;\n  color: #f0e2c0;\n}\n.ca-status-head > span:not(.ca-icon) {\n  flex: 1;\n  font-size: 10px;\n  color: #93866f;\n}\n.ca-status-step {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin: 3px 0 0 27px;\n  font-size: 10.5px;\n  color: #c9bba0;\n}\n.ca-status-step .ca-ico {\n  color: #93866f;\n}\n.ca-status-step.hot .ca-ico {\n  color: #7fe08b;\n  filter: drop-shadow(0 0 3px rgba(127, 224, 139, 0.8));\n}\n.ca-status-step.err {\n  color: #ff9a8a;\n}\n.ca-status-step.idle {\n  opacity: 0.55;\n}\n.ca-status-name {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.ca-status-val {\n  flex: none;\n  font-variant-numeric: tabular-nums;\n  color: #a39477;\n}\n\n/* editor */\n#CookieMgrMenu .ca-editor {\n  box-shadow:\n    0 0 0 1px rgba(255, 210, 120, 0.45),\n    0 0 18px rgba(255, 200, 100, 0.15);\n}\n#CookieMgrMenu .ca-editor-body {\n  padding: 4px 14px 12px;\n}\n#CookieMgrMenu .ca-editor-row {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px 12px;\n  margin: 6px 0;\n}\n#CookieMgrMenu .ca-editor-block {\n  margin: 8px 0;\n  padding: 4px 10px;\n  border-left: 2px solid rgba(120, 190, 255, 0.5);\n  background: rgba(120, 190, 255, 0.05);\n}\n#CookieMgrMenu .ca-field {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 11px;\n  color: #b9ab93;\n}\n#CookieMgrMenu .ca-field.ca-grow {\n  flex: 1 1 200px;\n}\n#CookieMgrMenu .ca-field.ca-grow input {\n  flex: 1;\n}\n#CookieMgrMenu .ca-field em {\n  font-style: normal;\n  color: #93866f;\n}\n#CookieMgrMenu .ca-field-label {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  min-width: 64px;\n  font:\n    bold 11px Tahoma,\n    Arial,\n    sans-serif;\n  color: #e8d7b0;\n}\n#CookieMgrMenu .ca-hint {\n  font-size: 10.5px;\n  color: #93866f;\n}\n#CookieMgrMenu .ca-editor input[type='text'],\n#CookieMgrMenu .ca-editor input[type='number'],\n#CookieMgrMenu .ca-editor select {\n  font: 12px Tahoma, Arial, sans-serif;\n  color: #f0e2c0;\n  background: rgba(0, 0, 0, 0.45);\n  border: 1px solid rgba(255, 220, 150, 0.25);\n  border-radius: 4px;\n  padding: 3px 6px;\n}\n#CookieMgrMenu .ca-editor input[type='number'] {\n  width: 80px;\n}\n#CookieMgrMenu .ca-editor select option,\n#CookieMgrMenu .ca-editor select optgroup {\n  background: #1c150d;\n  color: #f0e2c0;\n}\n#CookieMgrMenu .ca-iconpick {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n}\n#CookieMgrMenu .ca-editor-steps {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 6px;\n  margin: 4px 0 8px;\n}\n#CookieMgrMenu .ca-editor-step {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px 10px;\n  width: 100%;\n  box-sizing: border-box;\n  padding: 6px 8px;\n  border-radius: 6px;\n  background: rgba(0, 0, 0, 0.25);\n  border: 1px solid rgba(255, 220, 150, 0.12);\n}\n#CookieMgrMenu .ca-step-n {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 18px;\n  height: 18px;\n  font:\n    bold 10px Tahoma,\n    Arial,\n    sans-serif;\n  color: #1c150d;\n  background: #ffd98a;\n  border-radius: 50%;\n}\n#CookieMgrMenu .ca-step-tools {\n  margin-left: auto;\n  display: inline-flex;\n  gap: 3px;\n}\n#CookieMgrMenu .ca-editor-error {\n  margin: 6px 0;\n  padding: 5px 9px;\n  font-size: 11px;\n  color: #ffd2cc;\n  background: rgba(229, 72, 77, 0.18);\n  border: 1px solid rgba(229, 72, 77, 0.5);\n  border-radius: 5px;\n}\n#CookieMgrMenu .ca-editor-actions {\n  display: flex;\n  gap: 8px;\n  margin-top: 10px;\n}\n\n/* ---------- Widgets (left panel) ---------- */\n\n#CookieMgrWidgets {\n  position: absolute;\n  inset: 0;\n  /* above the game's big-cookie click target (#bigCookie, 10000) so widgets dragged over the\n     cookie can still be grabbed; below its popups (20000+), golden cookies, notes and tooltips */\n  z-index: 15000;\n  pointer-events: none;\n  font-family: Tahoma, Arial, sans-serif;\n}\n#CookieMgrWidgets.ca-hidden,\n#game.ascending #CookieMgrWidgets,\n#game.ascendIntro #CookieMgrWidgets,\n#game.reincarnating #CookieMgrWidgets {\n  display: none;\n}\n#CookieMgrWidgets .ca-w {\n  position: absolute;\n  pointer-events: auto;\n  box-sizing: border-box;\n  max-width: calc(100% - 4px);\n  color: #e8d7b0;\n  background:\n    linear-gradient(to bottom, rgba(70, 45, 22, 0.92), rgba(28, 18, 9, 0.92)),\n    #1c120a;\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 6px;\n  box-shadow:\n    0 4px 14px rgba(0, 0, 0, 0.7),\n    inset 0 1px 0 rgba(255, 255, 255, 0.15);\n  user-select: none;\n}\n#CookieMgrWidgets .ca-w.dragging {\n  box-shadow:\n    0 8px 24px rgba(0, 0, 0, 0.85),\n    0 0 14px rgba(255, 215, 110, 0.35);\n  opacity: 0.95;\n}\n#CookieMgrWidgets .ca-w-head {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 3px 4px 3px 8px;\n  cursor: grab;\n  border-bottom: 1px solid rgba(255, 220, 150, 0.18);\n  color: #ffd98a;\n}\n#CookieMgrWidgets.locked .ca-w-head {\n  cursor: default;\n}\n#CookieMgrWidgets .ca-w.collapsed .ca-w-head {\n  border-bottom: none;\n}\n#CookieMgrWidgets .ca-w-title {\n  flex: 1;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-size: 13px;\n  color: #fff;\n  text-shadow: 0 1px 2px #000;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n#CookieMgrWidgets .ca-w-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 18px;\n  height: 18px;\n  padding: 0;\n  font-size: 10px;\n  color: #b9ab93;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px solid rgba(255, 220, 150, 0.15);\n  border-radius: 4px;\n  cursor: pointer;\n  opacity: 0;\n  transition: opacity 0.15s;\n}\n#CookieMgrWidgets .ca-w:hover .ca-w-btn {\n  opacity: 1;\n}\n#CookieMgrWidgets .ca-w-btn:hover {\n  color: #fff3cf;\n}\n#CookieMgrWidgets .ca-w-body {\n  padding: 6px 8px 8px;\n  max-height: 320px;\n  overflow-y: auto;\n}\n#CookieMgrWidgets .ca-w.collapsed .ca-w-body {\n  display: none;\n}\n#CookieMgrWidgets .ca-w-empty {\n  font-size: 11px;\n  color: #93866f;\n  line-height: 1.4;\n}\n/* bare widgets: no frame, dragged from anywhere */\n#CookieMgrWidgets .ca-w.ca-w-bare {\n  background: none;\n  border: none;\n  box-shadow: none;\n  cursor: grab;\n}\n#CookieMgrWidgets.locked .ca-w.ca-w-bare {\n  cursor: default;\n}\n#CookieMgrWidgets .ca-w-bare > .ca-w-body {\n  padding: 0;\n  max-height: none;\n  overflow: visible;\n}\n#CookieMgrWidgets .ca-w-x {\n  position: absolute;\n  top: -6px;\n  right: -6px;\n  z-index: 2;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 15px;\n  height: 15px;\n  padding: 0;\n  color: #f0e2c0;\n  background: #3a2414;\n  border: 1px solid #875526;\n  border-radius: 50%;\n  cursor: pointer;\n  opacity: 0;\n  transition: opacity 0.15s;\n}\n#CookieMgrWidgets .ca-w-bare:hover .ca-w-x {\n  opacity: 1;\n}\n#CookieMgrWidgets .ca-w-bare.dragging .ca-w-x {\n  opacity: 0;\n}\n\n/* a macro's own button */\n#CookieMgrWidgets .ca-wb {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 38px;\n  height: 38px;\n  padding: 0;\n  border-radius: 50%;\n  cursor: inherit;\n  background: radial-gradient(circle at 35% 30%, rgba(110, 72, 36, 0.95), rgba(28, 18, 9, 0.95));\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  box-shadow:\n    0 3px 8px rgba(0, 0, 0, 0.7),\n    inset 0 1px 0 rgba(255, 255, 255, 0.2);\n  transition:\n    box-shadow 0.2s,\n    transform 0.1s,\n    filter 0.2s;\n}\n#CookieMgrWidgets .ca-wb:not(.on):not(.once) {\n  filter: grayscale(0.6) brightness(0.8);\n}\n#CookieMgrWidgets .ca-wb:hover {\n  filter: none;\n  box-shadow:\n    0 3px 10px rgba(0, 0, 0, 0.8),\n    0 0 10px rgba(255, 215, 110, 0.45),\n    inset 0 1px 0 rgba(255, 255, 255, 0.25);\n}\n#CookieMgrWidgets .ca-wb.on {\n  box-shadow:\n    0 3px 8px rgba(0, 0, 0, 0.7),\n    0 0 0 2px #1a3d12,\n    0 0 0 4px #4dff5e,\n    0 0 16px 2px rgba(77, 255, 94, 0.75);\n}\n#CookieMgrWidgets .ca-wb:active {\n  transform: scale(0.94);\n}\n#CookieMgrWidgets .ca-wb .ca-icon,\n#CookieMgrWidgets .ca-wb .ca-icon-ico {\n  flex: 0 0 26px;\n  width: 26px;\n  height: 26px;\n  background: none;\n  box-shadow: none;\n}\n#CookieMgrWidgets .ca-wb .ca-img {\n  width: 26px;\n  height: 26px;\n}\n#CookieMgrWidgets .ca-wb .ca-sprite {\n  transform: scale(0.54);\n}\n#CookieMgrWidgets .ca-wb .ca-icon-ico .ca-ico {\n  width: 20px;\n  height: 20px;\n}\n#CookieMgrWidgets .ca-wb-label {\n  position: absolute;\n  top: 100%;\n  left: 50%;\n  margin-top: 4px;\n  padding: 2px 7px;\n  font:\n    bold 10px Tahoma,\n    Arial,\n    sans-serif;\n  color: #fff3cf;\n  white-space: nowrap;\n  text-shadow: 0 1px 1px #000;\n  background: rgba(20, 12, 6, 0.92);\n  border: 1px solid rgba(255, 220, 150, 0.35);\n  border-radius: 8px;\n  transform: translateX(-50%) translateY(-3px);\n  opacity: 0;\n  pointer-events: none;\n  transition:\n    opacity 0.15s,\n    transform 0.15s;\n}\n#CookieMgrWidgets .ca-wb-label b,\n#CookieMgrWidgets .ca-wb-label em {\n  display: block;\n  text-align: center;\n}\n#CookieMgrWidgets .ca-wb-label em {\n  font-style: normal;\n  font-weight: normal;\n  font-size: 9.5px;\n  color: #b9ab93;\n}\n#CookieMgrWidgets .ca-wb-label em.on {\n  color: #7dff8a;\n}\n#CookieMgrWidgets .ca-w-macro:hover .ca-wb-label {\n  opacity: 1;\n  transform: translateX(-50%) translateY(0);\n}\n#CookieMgrWidgets .ca-w-macro.dragging .ca-wb-label {\n  opacity: 0;\n}\n\n/* \"Running now\" as a status bar */\n#CookieMgrWidgets .ca-w-status > .ca-w-body {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  min-height: 30px;\n  padding: 3px 8px 3px 6px;\n  background: linear-gradient(to bottom, rgba(70, 45, 22, 0.9), rgba(28, 18, 9, 0.9));\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 16px;\n  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.7);\n}\n#CookieMgrWidgets .ca-wbar-lead {\n  display: inline-flex;\n  color: #93866f;\n  margin-right: 2px;\n}\n#CookieMgrWidgets .ca-wbar-idle {\n  font-size: 10px;\n  font-style: italic;\n  color: #93866f;\n}\n#CookieMgrWidgets .ca-wbar-item {\n  position: relative;\n  display: inline-flex;\n  border-radius: 50%;\n  cursor: pointer;\n  box-shadow:\n    0 0 0 2px #4dff5e,\n    0 0 7px rgba(77, 255, 94, 0.6);\n}\n#CookieMgrWidgets .ca-wbar-item .ca-icon,\n#CookieMgrWidgets .ca-wbar-item .ca-icon-ico {\n  flex: 0 0 22px;\n  width: 22px;\n  height: 22px;\n}\n#CookieMgrWidgets .ca-wbar-item .ca-img {\n  width: 22px;\n  height: 22px;\n}\n#CookieMgrWidgets .ca-wbar-item .ca-sprite {\n  transform: scale(0.45);\n}\n#CookieMgrWidgets .ca-wbar-item.hot {\n  animation: caWbarPulse 1s ease-in-out infinite;\n}\n#CookieMgrWidgets .ca-wbar-item.err {\n  box-shadow: 0 0 0 2px rgba(229, 72, 77, 0.85);\n}\n@keyframes caWbarPulse {\n  0%,\n  100% {\n    box-shadow:\n      0 0 0 2px #4dff5e,\n      0 0 7px rgba(77, 255, 94, 0.6);\n  }\n  50% {\n    box-shadow:\n      0 0 0 3px #8dff98,\n      0 0 16px 3px rgba(77, 255, 94, 0.9);\n  }\n}\n#CookieMgrWidgets .ca-icon {\n  flex: 0 0 22px;\n  width: 22px;\n  height: 22px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n}\n#CookieMgrWidgets .ca-img {\n  width: 22px;\n  height: 22px;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}\n#CookieMgrWidgets .ca-sprite {\n  flex: none;\n  width: 48px;\n  height: 48px;\n  background-image: url(img/icons.png);\n  transform: scale(0.45);\n}\n#CookieMgrWidgets .ca-icon-ico {\n  color: #ffd98a;\n  border-radius: 50%;\n  background: radial-gradient(circle at 35% 30%, rgba(255, 230, 170, 0.22), rgba(0, 0, 0, 0.3));\n}\n/* status block inside a widget */\n#CookieMgrWidgets .ca-status-head .ca-icon,\n#CookieMgrWidgets .ca-status-head .ca-icon-ico {\n  flex: 0 0 18px;\n  width: 18px;\n  height: 18px;\n}\n#CookieMgrWidgets .ca-status-head .ca-sprite {\n  transform: scale(0.38);\n}\n#CookieMgrWidgets .ca-status-step {\n  margin-left: 24px;\n}\n#CookieMgrWidgets .ca-iconbtn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 18px;\n  height: 18px;\n  padding: 0;\n  color: #b9ab93;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px solid rgba(255, 220, 150, 0.15);\n  border-radius: 4px;\n  cursor: pointer;\n}\n/* quick stats */\n#CookieMgrWidgets .ca-w-stat {\n  display: flex;\n  justify-content: space-between;\n  gap: 10px;\n  padding: 2px 0;\n  font-size: 11px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n#CookieMgrWidgets .ca-w-stat:last-child {\n  border-bottom: none;\n}\n#CookieMgrWidgets .ca-w-stat span {\n  color: #a39477;\n}\n#CookieMgrWidgets .ca-w-stat b {\n  color: #fff3cf;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrWidgets .ca-w-stat em {\n  font-style: normal;\n  font-weight: normal;\n  color: #93866f;\n}\n/* latest events */\n#CookieMgrWidgets .ca-ev-row {\n  display: flex;\n  align-items: baseline;\n  gap: 6px;\n  padding: 2px 4px;\n  font-size: 10.5px;\n  color: #d8cbb0;\n  border-left: 2px solid var(--c);\n}\n#CookieMgrWidgets .ca-ev-ico {\n  flex: none;\n  align-self: center;\n  display: inline-flex;\n  color: var(--c);\n}\n#CookieMgrWidgets .ca-ev-ico .ca-ico-cookie {\n  width: 12px !important;\n  height: 12px !important;\n}\n#CookieMgrWidgets .ca-ev-time {\n  flex: none;\n  color: #93866f;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrWidgets .ca-ev-text {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n#CookieMgrWidgets .ca-ev-text span {\n  display: none;\n}\n#CookieMgrWidgets .ca-ev-cookies {\n  flex: none;\n  font-weight: bold;\n}\n#CookieMgrWidgets .ca-ev-cookies.pos {\n  color: #9be89b;\n}\n#CookieMgrWidgets .ca-ev-cookies.neg {\n  color: #ff9a8a;\n}\n#CookieMgrMenu .ca-status-head .ca-icon {\n  filter: none;\n}\n#CookieMgrMenu .ca-card-meta .ca-iconbtn {\n  margin-left: 4px;\n}\n\n/* ---------- Wizard tower ---------- */\n\n#CookieMgrMenu .ca-magic {\n  position: relative;\n  height: 18px;\n  margin: 6px 14px 4px;\n  border-radius: 9px;\n  overflow: hidden;\n  background: rgba(0, 0, 0, 0.5);\n  box-shadow:\n    inset 0 1px 3px rgba(0, 0, 0, 0.8),\n    0 0 0 1px rgba(179, 136, 255, 0.35);\n}\n#CookieMgrMenu .ca-magic-fill {\n  position: absolute;\n  inset: 0 auto 0 0;\n  width: 0;\n  background: linear-gradient(to bottom, #c9a6ff, #7c4dff);\n  box-shadow: 0 0 10px rgba(179, 136, 255, 0.7);\n  transition: width 0.4s;\n}\n#CookieMgrMenu .ca-magic-text {\n  position: relative;\n  text-align: center;\n  font:\n    bold 11px/18px Tahoma,\n    Arial,\n    sans-serif;\n  color: #fff;\n  text-shadow:\n    0 0 3px #000,\n    0 1px 1px #000;\n}\n#CookieMgrMenu .ca-spells {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));\n  gap: 8px;\n  padding: 6px 12px 12px;\n}\n#CookieMgrMenu .ca-spell {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 3px;\n  padding: 8px 6px;\n  text-align: center;\n  border-radius: 8px;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px solid rgba(179, 136, 255, 0.2);\n  opacity: 0.75;\n  transition:\n    opacity 0.2s,\n    box-shadow 0.2s;\n}\n#CookieMgrMenu .ca-spell.ready {\n  opacity: 1;\n  border-color: rgba(179, 136, 255, 0.55);\n  box-shadow: 0 0 10px rgba(179, 136, 255, 0.25);\n}\n#CookieMgrMenu .ca-spell-ico {\n  display: block;\n  width: 48px;\n  height: 48px;\n  margin: -6px 0 -8px;\n  transform: scale(0.75);\n}\n#CookieMgrMenu .ca-spell:not(.ready) .ca-spell-ico {\n  filter: grayscale(0.7) brightness(0.75);\n}\n#CookieMgrMenu .ca-spell-name {\n  font-family: 'Merriweather', Georgia, serif;\n  font-size: 12px;\n  color: #f0e2c0;\n}\n#CookieMgrMenu .ca-spell-meta {\n  min-height: 26px;\n  font-size: 10px;\n  color: #a39477;\n}\n#CookieMgrMenu .ca-spell-actions {\n  display: flex;\n  gap: 5px;\n  align-items: center;\n}\n#CookieMgrMenu .ca-cond + .ca-cond .ca-field-label {\n  color: #9fd3ff;\n}\n\n/* toolbar inside the Grimoire */\n#cm-grimoire-toolbar {\n  position: relative;\n  z-index: 10;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: center;\n  gap: 6px;\n  margin: 6px auto 2px;\n}\n#cm-grimoire-toolbar .cm-gt-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 3px 9px;\n  font:\n    11px Merriweather,\n    Georgia,\n    serif;\n  color: #ccc;\n  cursor: pointer;\n  background: rgba(0, 0, 0, 0.45);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 4px;\n  text-shadow: 0 1px 1px #000;\n}\n#cm-grimoire-toolbar .cm-gt-btn:hover {\n  color: #fff;\n  box-shadow: 0 0 6px rgba(255, 220, 150, 0.4);\n}\n#cm-grimoire-toolbar .cm-gt-btn.on {\n  color: #e9d8ff;\n  background: rgba(124, 77, 255, 0.35);\n  box-shadow: 0 0 8px rgba(179, 136, 255, 0.55);\n}\n\n/* ---------- v2.4: hover stacking, status popups, groups, stages, prestige target ---------- */\n\n/* whatever you hover comes to the front, so its label/popup is never under a neighbour */\n#CookieMgrWidgets .ca-w:hover,\n#CookieMgrWidgets .ca-w.dragging {\n  z-index: 20;\n}\n#CookieMgrWidgets .ca-w-macro.pop-below .ca-wb-label {\n  top: auto;\n  bottom: 100%;\n  margin: 0 0 4px;\n}\n\n/* styled popup over a status-bar icon */\n#CookieMgrWidgets .ca-wpop {\n  position: absolute;\n  left: 50%;\n  bottom: calc(100% + 10px);\n  z-index: 30;\n  display: none;\n  width: 250px;\n  padding: 7px 9px 6px;\n  text-align: left;\n  font-size: 10.5px;\n  line-height: 1.35;\n  color: #e8d7b0;\n  background: linear-gradient(to bottom, rgba(64, 40, 18, 0.98), rgba(24, 15, 7, 0.98));\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 7px;\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.85);\n  transform: translateX(-50%);\n  cursor: default;\n  pointer-events: none;\n}\n#CookieMgrWidgets .ca-wbar-item:hover .ca-wpop {\n  display: block;\n}\n#CookieMgrWidgets .ca-w-status:not(.pop-left) .ca-wpop {\n  left: -6px;\n  transform: none;\n}\n#CookieMgrWidgets .ca-w-status.pop-left .ca-wpop {\n  left: auto;\n  right: -6px;\n  transform: none;\n}\n#CookieMgrWidgets .ca-w-status.pop-below .ca-wpop {\n  bottom: auto;\n  top: calc(100% + 10px);\n}\n#CookieMgrWidgets .ca-wpop-head {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 12px;\n  color: #fff3cf;\n}\n#CookieMgrWidgets .ca-wpop-head .ca-icon,\n#CookieMgrWidgets .ca-wpop-head .ca-icon-ico {\n  flex: 0 0 18px;\n  width: 18px;\n  height: 18px;\n}\n#CookieMgrWidgets .ca-wpop-head .ca-sprite {\n  transform: scale(0.38);\n}\n#CookieMgrWidgets .ca-wpop-sub {\n  display: block;\n  margin: 1px 0 5px 24px;\n  color: #93866f;\n}\n#CookieMgrWidgets .ca-wpop-row {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 2px 0;\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n}\n#CookieMgrWidgets .ca-wpop-row .ca-ico {\n  color: #93866f;\n}\n#CookieMgrWidgets .ca-wpop-row.hot .ca-ico {\n  color: #4dff5e;\n}\n#CookieMgrWidgets .ca-wpop-row.err {\n  color: #ff9a8a;\n}\n#CookieMgrWidgets .ca-wpop-name {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n#CookieMgrWidgets .ca-wpop-val {\n  flex: none;\n  color: #c9bba0;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrWidgets .ca-wpop-foot {\n  display: block;\n  margin-top: 4px;\n  font-size: 9.5px;\n  font-style: italic;\n  color: #7d7262;\n}\n\n/* group members (macro rows and the editor) */\n#CookieMgrMenu .ca-step-member .ca-icon,\n#CookieMgrMenu .ca-member .ca-icon {\n  flex: 0 0 16px;\n  width: 16px;\n  height: 16px;\n  filter: none;\n}\n#CookieMgrMenu .ca-step-member .ca-img,\n#CookieMgrMenu .ca-member .ca-img {\n  width: 16px;\n  height: 16px;\n}\n#CookieMgrMenu .ca-step-member .ca-sprite,\n#CookieMgrMenu .ca-member .ca-sprite {\n  transform: scale(0.33);\n}\n#CookieMgrMenu .ca-step-member .ca-icon-ico .ca-ico,\n#CookieMgrMenu .ca-member .ca-icon-ico .ca-ico {\n  width: 11px;\n  height: 11px;\n}\n#CookieMgrMenu .ca-members {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));\n  gap: 5px;\n  margin: 4px 0 8px;\n}\n#CookieMgrMenu .ca-member {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  padding: 5px 8px;\n  font-size: 11px;\n  color: #c9bba0;\n  border-radius: 6px;\n  background: rgba(0, 0, 0, 0.25);\n  border: 1px solid rgba(255, 220, 150, 0.12);\n  cursor: pointer;\n}\n#CookieMgrMenu .ca-member.on {\n  color: #fff3cf;\n  border-color: rgba(77, 255, 94, 0.55);\n  background: rgba(77, 255, 94, 0.08);\n}\n\n/* CpS stages table */\n#CookieMgrMenu .ca-stage-n {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 16px;\n  height: 16px;\n  margin-right: 7px;\n  font:\n    bold 10px Tahoma,\n    Arial,\n    sans-serif;\n  color: #10141a;\n  border-radius: 50%;\n  vertical-align: 1px;\n}\n#CookieMgrMenu .ca-stage-x {\n  color: #ffd98a;\n  background: rgba(255, 217, 138, 0.15);\n  border: 1px solid rgba(255, 217, 138, 0.4);\n}\n#CookieMgrMenu .ca-row-sub {\n  display: block;\n  margin: 1px 0 0 23px;\n  font-size: 9.5px;\n  font-weight: normal;\n  color: #8a7e69;\n  white-space: normal;\n}\n#CookieMgrMenu .ca-stages tr.mult td {\n  color: #ffd98a;\n}\n\n/* prestige target */\n#CookieMgrMenu .ca-target {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px;\n  padding: 4px 14px 8px;\n}\n#CookieMgrMenu .ca-target input[type='number'],\n#CookieMgrMenu .ca-target select {\n  font: 13px Tahoma, Arial, sans-serif;\n  color: #f0e2c0;\n  background: rgba(0, 0, 0, 0.45);\n  border: 1px solid rgba(255, 220, 150, 0.3);\n  border-radius: 4px;\n  padding: 3px 6px;\n}\n#CookieMgrMenu .ca-target input[type='number'] {\n  width: 70px;\n}\n#CookieMgrMenu .ca-target select option {\n  background: #1c150d;\n}\n#CookieMgrMenu .ca-progress {\n  position: relative;\n  height: 14px;\n  margin: 2px 14px 10px;\n  border-radius: 7px;\n  overflow: hidden;\n  background: rgba(0, 0, 0, 0.5);\n  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8);\n}\n#CookieMgrMenu .ca-progress-fill {\n  position: absolute;\n  inset: 0 auto 0 0;\n  background: linear-gradient(to bottom, #e6dcff, #9c7cff);\n  box-shadow: 0 0 8px rgba(201, 188, 255, 0.7);\n  transition: width 0.4s;\n}\n#CookieMgrMenu .ca-progress-text {\n  position: relative;\n  text-align: center;\n  font:\n    bold 10px/14px Tahoma,\n    Arial,\n    sans-serif;\n  color: #fff;\n  text-shadow: 0 0 3px #000;\n}\n\n/* tables that update live: fixed column widths, so changing numbers never resize them */\n#CookieMgrMenu .ca-table.ca-stages {\n  table-layout: fixed;\n}\n#CookieMgrMenu .ca-table.ca-stages th:first-child,\n#CookieMgrMenu .ca-table.ca-stages td:first-child {\n  width: 28%;\n}\n#CookieMgrMenu .ca-table.ca-stages td,\n#CookieMgrMenu .ca-table.ca-stages th {\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n#CookieMgrMenu .ca-table.ca-stages td:first-child {\n  white-space: normal;\n}\n#CookieMgrMenu .ca-stages tr.sep td {\n  border-top: 1px solid rgba(255, 217, 138, 0.25);\n}\n\n/* ---------- v2.6: resizable widgets ---------- */\n\n#CookieMgrWidgets .ca-w {\n  transform-origin: 0 0; /* scaling and the percentage translate both anchor at the top-left */\n}\n#CookieMgrWidgets .ca-w-resize {\n  position: absolute;\n  right: -3px;\n  bottom: -3px;\n  z-index: 3;\n  width: 12px;\n  height: 12px;\n  cursor: nwse-resize;\n  opacity: 0;\n  transition: opacity 0.15s;\n  background:\n    linear-gradient(135deg, transparent 45%, rgba(255, 220, 150, 0.9) 45%, rgba(255, 220, 150, 0.9) 55%, transparent 55%),\n    linear-gradient(135deg, transparent 70%, rgba(255, 220, 150, 0.9) 70%, rgba(255, 220, 150, 0.9) 80%, transparent 80%);\n}\n#CookieMgrWidgets .ca-w:hover .ca-w-resize,\n#CookieMgrWidgets .ca-w.resizing .ca-w-resize {\n  opacity: 1;\n}\n#CookieMgrWidgets.locked .ca-w-resize {\n  display: none;\n}\n#CookieMgrWidgets .ca-w.resizing {\n  box-shadow:\n    0 6px 20px rgba(0, 0, 0, 0.8),\n    0 0 0 1px rgba(255, 220, 150, 0.6);\n}\n#CookieMgrWidgets .ca-w.ca-w-bare.resizing {\n  box-shadow: none;\n  outline: 1px dashed rgba(255, 220, 150, 0.6);\n  outline-offset: 3px;\n}\n/* framed boxes given a height: the body fills it and scrolls */\n#CookieMgrWidgets .ca-w.sized {\n  display: flex;\n  flex-direction: column;\n}\n#CookieMgrWidgets .ca-w.sized > .ca-w-body {\n  flex: 1;\n  min-height: 0;\n  max-height: none;\n}\n\n/* category chips on the Actual CpS / Cookie bank charts */\n#CookieMgrMenu .ca-togglegroup .ca-chip:not(.on) .ca-sw {\n  opacity: 0.35;\n}\n/* simple total rows (In, Out, Net, multipliers…): no subtitle, shorter */\n#CookieMgrMenu .ca-stages tr.thin td {\n  padding-top: 2px;\n  padding-bottom: 2px;\n}\n#CookieMgrMenu .ca-stages tr.thin .ca-stage-n {\n  width: 13px;\n  height: 13px;\n  font-size: 9px;\n}\n#CookieMgrMenu .ca-table td span.pos {\n  color: #9be89b;\n}\n#CookieMgrMenu .ca-table td span.neg {\n  color: #ff9a8a;\n}\n\n/* ---------- v2.8: spell feedback ---------- */\n\n/* spells you can't afford yet: still clickable, dimmed; a click shakes them */\n#CookieMgrMenu .ca-btn.ca-unaffordable {\n  opacity: 0.5;\n  filter: grayscale(0.6);\n}\n.ca-shake {\n  animation: caShake 0.45s ease-in-out;\n}\n@keyframes caShake {\n  0%,\n  100% {\n    transform: translateX(0);\n  }\n  20%,\n  60% {\n    transform: translateX(-4px);\n  }\n  40%,\n  80% {\n    transform: translateX(4px);\n  }\n}\n#CookieMgrWidgets .ca-wb.ca-shake {\n  box-shadow:\n    0 3px 8px rgba(0, 0, 0, 0.7),\n    0 0 0 3px #e5484d,\n    0 0 14px rgba(229, 72, 77, 0.8);\n}\n\n/* ---------- v2.9: round minigame widgets, widget settings ---------- */\n\n/* text size (a widget's settings): scales its text, labels and popups */\n#CookieMgrWidgets .ca-wt {\n  zoom: var(--wfs, 1);\n}\n#CookieMgrWidgets .ca-w-events {\n  max-height: 100%;\n}\n#CookieMgrWidgets .ca-w-stat em {\n  font-style: normal;\n  color: #93866f;\n}\n\n/* ⚙ next to the × on bare widgets */\n#CookieMgrWidgets .ca-w-x.ca-w-gear {\n  right: 11px;\n}\n\n/* the round widget: a ring (the timer), an icon in the middle, a label under it */\n#CookieMgrWidgets .ca-orb {\n  --ring: #d9c4ff;\n  --glow: rgba(179, 136, 255, 0.55);\n  --bg: rgba(40, 22, 70, 0.92);\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  width: 44px;\n  cursor: pointer;\n}\n#CookieMgrWidgets .ca-orb-garden {\n  --ring: #a8f06a;\n  --glow: rgba(150, 230, 90, 0.5);\n  --bg: rgba(26, 50, 16, 0.92);\n}\n#CookieMgrWidgets .ca-orb-market {\n  --ring: #6fe6ef;\n  --glow: rgba(80, 220, 230, 0.5);\n  --bg: rgba(12, 42, 48, 0.92);\n}\n#CookieMgrWidgets .ca-orb-pantheon {\n  --ring: #ffd36a;\n  --glow: rgba(255, 210, 110, 0.5);\n  --bg: rgba(60, 40, 14, 0.92);\n}\n#CookieMgrWidgets .ca-orb-ring {\n  display: block;\n  width: 44px;\n  height: 44px;\n  border-radius: 50%;\n  background: radial-gradient(circle, var(--bg) 60%, rgba(0, 0, 0, 0.6) 100%);\n  box-shadow:\n    0 3px 8px rgba(0, 0, 0, 0.7),\n    0 0 0 1px rgba(0, 0, 0, 0.6);\n  transform: rotate(-90deg);\n}\n#CookieMgrWidgets .ca-orb-track,\n#CookieMgrWidgets .ca-orb-fill {\n  fill: none;\n  stroke-width: 4;\n}\n#CookieMgrWidgets .ca-orb-track {\n  stroke: rgba(0, 0, 0, 0.55);\n}\n#CookieMgrWidgets .ca-orb-fill {\n  stroke: var(--ring);\n  stroke-linecap: round;\n  filter: drop-shadow(0 0 2px var(--glow));\n  transition: stroke-dashoffset 0.45s linear;\n}\n#CookieMgrWidgets .ca-orb-ico {\n  position: absolute;\n  top: 13px;\n  left: 13px;\n  width: 18px;\n  height: 18px;\n  color: var(--ring);\n  pointer-events: none;\n}\n#CookieMgrWidgets .ca-orb:hover .ca-orb-ring {\n  box-shadow:\n    0 3px 8px rgba(0, 0, 0, 0.7),\n    0 0 10px var(--glow);\n}\n#CookieMgrWidgets .ca-orb-label {\n  margin-top: 2px;\n  padding: 0 4px;\n  font-size: 10px;\n  font-weight: bold;\n  line-height: 13px;\n  white-space: nowrap;\n  color: #fff3cf;\n  text-shadow:\n    0 0 3px #000,\n    0 1px 2px #000;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrWidgets .ca-orb-label .pos {\n  color: #9be89b;\n}\n#CookieMgrWidgets .ca-orb-label .neg {\n  color: #ff9a8a;\n}\n/* garden: plants by stage, as four coloured dots with counts */\n#CookieMgrWidgets .ca-orb-dots {\n  display: flex;\n  gap: 3px;\n  margin-top: 1px;\n  font-size: 9px;\n  line-height: 10px;\n  color: #e8f5d8;\n  text-shadow: 0 0 2px #000;\n}\n#CookieMgrWidgets .ca-orb-dots span {\n  display: inline-flex;\n  align-items: center;\n  gap: 1px;\n}\n#CookieMgrWidgets .ca-orb-dots i {\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n}\n#CookieMgrWidgets .ca-orb-dots .s0 i {\n  background: #6b8a52;\n}\n#CookieMgrWidgets .ca-orb-dots .s1 i {\n  background: #8fc25e;\n}\n#CookieMgrWidgets .ca-orb-dots .s2 i {\n  background: #b5ec6e;\n}\n#CookieMgrWidgets .ca-orb-dots .s3 i {\n  background: #eaff8a;\n  box-shadow: 0 0 4px #eaff8a;\n}\n/* pantheon: the three slotted spirits under the ring */\n#CookieMgrWidgets .ca-orb-gods {\n  display: flex;\n  gap: 1px;\n  margin-top: 1px;\n}\n#CookieMgrWidgets .ca-orb-god {\n  display: block;\n  width: 48px;\n  height: 48px;\n  margin: -17px;\n  transform: scale(0.29);\n  border-radius: 8px;\n}\n#CookieMgrWidgets .ca-orb-god.empty {\n  background: rgba(0, 0, 0, 0.45);\n  box-shadow: inset 0 0 0 3px rgba(255, 210, 110, 0.4);\n}\n/* hover details */\n#CookieMgrWidgets .ca-orb-pop {\n  width: 190px;\n  left: 50%;\n  transform: translateX(-50%);\n}\n#CookieMgrWidgets .ca-orb:hover .ca-orb-pop {\n  display: block;\n}\n#CookieMgrWidgets .ca-w.pop-below .ca-orb-pop {\n  bottom: auto;\n  top: calc(100% + 6px);\n}\n#CookieMgrWidgets .ca-w.dragging .ca-orb-pop,\n#CookieMgrWidgets .ca-w.resizing .ca-orb-pop {\n  display: none;\n}\n\n/* the widget settings editor (Widgets page) */\n#CookieMgrMenu .ca-weditor-body {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 4px 2px 2px;\n}\n#CookieMgrMenu .ca-weditor-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n#CookieMgrMenu .ca-weditor-row .ca-field-label {\n  flex: 0 0 110px;\n}\n#CookieMgrMenu .ca-weditor-row input[type='range'] {\n  flex: 1;\n  max-width: 220px;\n}\n#CookieMgrMenu .ca-weditor-row input[type='text'] {\n  flex: 1;\n  max-width: 220px;\n}\n#CookieMgrMenu .ca-weditor-row input[type='number'] {\n  width: 64px;\n}\n#CookieMgrMenu .ca-range-val {\n  min-width: 38px;\n  color: #c9bba0;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrMenu .ca-weditor input[type='text'],\n#CookieMgrMenu .ca-weditor input[type='number'] {\n  font: 12px Tahoma, Arial, sans-serif;\n  color: #f0e2c0;\n  background: rgba(0, 0, 0, 0.45);\n  border: 1px solid rgba(255, 220, 150, 0.25);\n  border-radius: 4px;\n  padding: 3px 6px;\n}\n\n/* ---------- v2.10: built-in macro choices (season, lump ripeness) ---------- */\n\n#CookieMgrMenu .ca-macro-options {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  margin-top: 5px;\n}\n#CookieMgrMenu .ca-macro-options select {\n  font: 11px Tahoma, Arial, sans-serif;\n  color: #f0e2c0;\n  background: rgba(0, 0, 0, 0.45);\n  border: 1px solid rgba(255, 220, 150, 0.25);\n  border-radius: 4px;\n  padding: 2px 5px;\n}\n#CookieMgrMenu .ca-macro-options select option {\n  background: #1c150d;\n  color: #f0e2c0;\n}\n\n/* ---------- v2.11: Garden page ---------- */\n\n#CookieMgrMenu .ca-garden-wrap {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  align-items: flex-start;\n}\n#CookieMgrMenu .ca-gplot {\n  display: grid;\n  grid-template-columns: repeat(6, 40px);\n  grid-auto-rows: 40px;\n  gap: 2px;\n  padding: 4px;\n  border-radius: 6px;\n  background: rgba(40, 26, 12, 0.6);\n  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.7);\n}\n#CookieMgrMenu .ca-gstats {\n  flex: 1 1 200px;\n}\n#CookieMgrMenu .ca-gtile {\n  position: relative;\n  border-radius: 4px;\n  background: rgba(92, 60, 30, 0.75);\n  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);\n}\n#CookieMgrMenu .ca-gtile.locked {\n  background: rgba(0, 0, 0, 0.25);\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-gtile.off {\n  box-shadow: inset 0 0 0 2px #e5484d;\n}\n#CookieMgrMenu .ca-gtile:hover {\n  z-index: 5;\n  background: rgba(120, 82, 42, 0.85);\n}\n/* a 48px sprite from gardenPlants.png, shown at 40px */\n#CookieMgrMenu .ca-gs {\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 48px;\n  height: 48px;\n  zoom: 0.8333;\n  pointer-events: none;\n}\n#CookieMgrMenu .ca-gs.ghost {\n  opacity: 0.35;\n  filter: grayscale(0.5);\n}\n#CookieMgrMenu .ca-gdecay {\n  position: absolute;\n  right: 1px;\n  bottom: 1px;\n  padding: 0 2px;\n  font: bold 9px/11px Tahoma, Arial, sans-serif;\n  color: #ffe9a8;\n  background: rgba(0, 0, 0, 0.65);\n  border-radius: 3px;\n}\n#CookieMgrMenu .ca-gdecay.hi {\n  color: #ff9a8a;\n}\n#CookieMgrMenu .ca-gnew {\n  position: absolute;\n  left: 1px;\n  top: 1px;\n  color: #ffd36a;\n  filter: drop-shadow(0 0 2px #000);\n}\n/* tile details on hover (same look as the widget popups) */\n#CookieMgrMenu .ca-gpop {\n  position: absolute;\n  left: 50%;\n  bottom: calc(100% + 6px);\n  z-index: 30;\n  display: none;\n  width: 210px;\n  padding: 7px 9px 6px;\n  font-size: 10.5px;\n  line-height: 1.35;\n  text-align: left;\n  color: #e8d7b0;\n  background: linear-gradient(to bottom, rgba(64, 40, 18, 0.98), rgba(24, 15, 7, 0.98));\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 7px;\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.85);\n  transform: translateX(-50%);\n  pointer-events: none;\n}\n#CookieMgrMenu .ca-gtile:hover .ca-gpop {\n  display: block;\n}\n#CookieMgrMenu .ca-gpop .ca-wpop-head {\n  display: block;\n  font-size: 12px;\n  color: #fff3cf;\n}\n#CookieMgrMenu .ca-gpop .ca-wpop-row {\n  display: flex;\n  gap: 6px;\n  padding: 2px 0;\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n}\n#CookieMgrMenu .ca-gpop .ca-wpop-name {\n  flex: 1;\n  color: #a39477;\n}\n#CookieMgrMenu .ca-gpop .ca-wpop-val {\n  color: #fff3cf;\n  text-align: right;\n}\n\n/* auto-gardener settings */\n#CookieMgrMenu .ca-gsettings {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 6px 4px 8px;\n}\n#CookieMgrMenu .ca-gsettings input[type='number'],\n#CookieMgrMenu .ca-gsettings select,\n#CookieMgrMenu .ca-gsave input,\n#CookieMgrMenu .ca-gprofile input {\n  font: 12px Tahoma, Arial, sans-serif;\n  color: #f0e2c0;\n  background: rgba(0, 0, 0, 0.45);\n  border: 1px solid rgba(255, 220, 150, 0.25);\n  border-radius: 4px;\n  padding: 3px 6px;\n}\n#CookieMgrMenu .ca-gsettings input[type='number'] {\n  width: 56px;\n}\n#CookieMgrMenu .ca-gsettings select option {\n  background: #1c150d;\n}\n\n/* profiles */\n#CookieMgrMenu .ca-gsave {\n  display: flex;\n  gap: 6px;\n  padding: 4px 4px 8px;\n}\n#CookieMgrMenu .ca-gsave input {\n  flex: 1;\n  max-width: 220px;\n}\n#CookieMgrMenu .ca-gprofiles {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n#CookieMgrMenu .ca-gprofile {\n  display: flex;\n  gap: 8px;\n  flex: 1 1 260px;\n  padding: 6px;\n  border-radius: 6px;\n  background: rgba(0, 0, 0, 0.25);\n}\n#CookieMgrMenu .ca-gprofile.on {\n  box-shadow: 0 0 0 1px rgba(160, 230, 100, 0.6);\n}\n#CookieMgrMenu .ca-gprofile-text {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n}\n#CookieMgrMenu .ca-gmini {\n  display: grid;\n  grid-template-columns: repeat(6, 14px);\n  grid-auto-rows: 14px;\n  gap: 1px;\n  flex: none;\n}\n#CookieMgrMenu .ca-gmini span {\n  position: relative;\n  overflow: hidden;\n  border-radius: 2px;\n  background: rgba(92, 60, 30, 0.75);\n}\n#CookieMgrMenu .ca-gmini .ca-gs {\n  zoom: 0.2917;\n}\n";

// ---- src/core/util.js ------------------------------------------------
// Small helpers shared by every module.

CA.ID = 'CookieMgr';
CA.MENU_ID = 'cookiemgr';
CA.ICON = [10, 14]; // default notification icon (golden cookie)

CA.Util = {
  /** document.getElementById shorthand (the game has `l()` too, but keep ours self-contained). */
  $(id) {
    return document.getElementById(id);
  },

  /** Resolves a game asset path such as 'img/icons.png' the same way the game does. */
  res(path) {
    const base = typeof Game !== 'undefined' && Game.resPath ? Game.resPath : '';
    return base + path;
  },

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  },

  /** Plays one of the game's built-in sounds, e.g. 'snd/tick.mp3'. Never throws. */
  sound(name) {
    try {
      if (typeof PlaySound === 'function') PlaySound(name);
    } catch (e) {
      /* ignore */
    }
  },

  /**
   * Game notification (bottom of the screen).
   * @param {string} title
   * @param {string} desc   HTML allowed
   * @param {number[]} icon [x, y] on img/icons.png
   * @param {number} quick  seconds-ish before auto-dismiss (game caps at 6)
   */
  notify(title, desc, icon, quick = 2) {
    try {
      Game.Notify(title, desc || '', icon || CA.ICON, quick, 1);
    } catch (e) {
      console.log(`[CookieMgr] ${title}: ${desc}`);
    }
  },

  injectCss(id, css) {
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.textContent = css;
  },

  /** Replaces obj[name] with a wrapper; `wrapper(original, args, thisArg)` decides what to call. */
  wrap(obj, name, wrapper) {
    const original = obj[name];
    if (typeof original !== 'function') return false;
    obj[name] = function (...args) {
      return wrapper(original, args, this);
    };
    obj[name].caOriginal = original;
    return true;
  },

  log(...args) {
    console.log('[CookieMgr]', ...args);
  },

  /** Widest rendered width among `texts` in the given canvas font (0 if ctx/texts is empty). */
  maxTextWidth(ctx, font, texts) {
    const prevFont = ctx.font;
    ctx.font = font;
    let max = 0;
    texts.forEach((t) => {
      const w = ctx.measureText(t).width;
      if (w > max) max = w;
    });
    ctx.font = prevFont;
    return max;
  },
};

// ---- src/core/events.js ----------------------------------------------
// Tiny publish/subscribe bus so features and UI stay decoupled.
//
// Events currently emitted:
//   'macros'    (id)          a macro was switched on/off, run, saved or removed
//   'settings'  (key)         an option changed
//   'hotkeys'   (actionId)    a hotkey binding changed (or capture started/stopped)
//   'ascend'    ()            the player just started ascending
//   'stockTrade' (entry)      a stock was bought or sold, by the autoclicker or by hand

CA.Events = (() => {
  const handlers = {};

  function on(event, fn) {
    (handlers[event] = handlers[event] || []).push(fn);
    return () => off(event, fn);
  }

  function off(event, fn) {
    const list = handlers[event];
    if (!list) return;
    const i = list.indexOf(fn);
    if (i !== -1) list.splice(i, 1);
  }

  function emit(event, ...args) {
    (handlers[event] || []).slice().forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        console.error('[CookieMgr] event handler error', event, e);
      }
    });
  }

  return { on, off, emit };
})();

// ---- src/core/actions.js ---------------------------------------------
// Registry of **actions**: single things CookieMgr can do in the game, once — click the big
// cookie, pop the golden cookies on screen, trade stocks, cast a spell… Macros (features/macros.js)
// are built by chaining actions; hotkeys trigger macros. The game-facing actions themselves are
// defined in features/gameActions.js.
//
//   CA.Actions.register({
//     id: 'pop.golden',                 // unique, stable (stored in saved macros)
//     name: 'Pop golden cookies',       // shown in the UI
//     icon: 'cookie',                   // ui/icons.js name
//     group: 'Shimmers',                // heading in the macro editor's action picker
//     unit: 'popped',                   // what run()'s return value counts, for status displays
//     params: [{ key, label, type: 'select'|'number'|'bool', options: () => [{ v, label }], default }],
//     available: () => true,            // false = can't run right now (minigame closed, …)
//     run(params) { return 3; },        // a number = how many things it did (0 = nothing to do)
//   });

CA.Actions = (() => {
  const list = [];
  const byId = {};

  function register(action) {
    if (byId[action.id]) throw new Error(`Action "${action.id}" already registered`);
    const a = { group: 'General', icon: 'bolt', unit: '', params: [], available: () => true, ...action };
    list.push(a);
    byId[a.id] = a;
    return a;
  }

  const get = (id) => byId[id];
  const all = () => list.slice();

  /** Default parameter values for an action, overlaid with `params`. */
  function paramsFor(id, params) {
    const a = byId[id];
    const out = {};
    if (a) a.params.forEach((p) => (out[p.key] = p.default));
    return { ...out, ...(params || {}) };
  }

  /** Runs action `id` once. Returns its count (0 if it couldn't run), throws on errors. */
  function run(id, params) {
    const a = byId[id];
    if (!a || !a.available()) return 0;
    const r = a.run(paramsFor(id, params));
    return typeof r === 'number' ? r : r ? 1 : 0;
  }

  /** "Pop golden cookies" / "Cast Force the Hand of Fate" — the action's name with its params folded in. */
  function describe(step) {
    const a = byId[step.action];
    if (!a) return `Unknown action (${step.action})`;
    return a.describe ? a.describe(paramsFor(step.action, step.params)) : a.name;
  }

  return { register, get, all, run, paramsFor, describe };
})();

// ---- src/core/conditions.js ------------------------------------------
// Registry of **conditions** a "when" macro can wait for: a buff being active, a golden cookie on
// screen, any recorded state (core/states.js) crossing a value, a spell being affordable…
//
//   CA.Conditions.register({
//     id: 'buff', name: 'Effect is active', icon: 'sparkle',
//     params: [{ key: 'name', label: 'Effect', type: 'select', options: () => [...], default: 'Frenzy' }],
//     test(params) { return !!Game.hasBuff(params.name); },
//     describe(params) { return `${params.name} is active`; },
//   });

CA.Conditions = (() => {
  const list = [];
  const byId = {};

  function register(cond) {
    if (byId[cond.id]) throw new Error(`Condition "${cond.id}" already registered`);
    const c = { icon: 'filter', params: [], ...cond };
    list.push(c);
    byId[c.id] = c;
    return c;
  }

  const get = (id) => byId[id];
  const all = () => list.slice();

  function paramsFor(id, params) {
    const c = byId[id];
    const out = {};
    if (c) c.params.forEach((p) => (out[p.key] = p.default));
    return { ...out, ...(params || {}) };
  }

  /** A macro's `when` is either one condition { cond, params, not } or { all: [those…] } —
   *  every one of which must hold. */
  const parts = (when) => (!when ? [] : Array.isArray(when.all) ? when.all : [when]);

  function testOne(one) {
    const c = one && byId[one.cond];
    if (!c) return false;
    let r = false;
    try {
      r = !!c.test(paramsFor(one.cond, one.params));
    } catch (e) {
      r = false;
    }
    return one.not ? !r : r;
  }

  /** Whether `when` holds right now; unknown conditions never do, nor does an empty list. */
  function test(when) {
    const list = parts(when);
    return list.length > 0 && list.every(testOne);
  }

  function describeOne(one) {
    const c = one && byId[one.cond];
    if (!c) return 'unknown condition';
    const text = c.describe ? c.describe(paramsFor(one.cond, one.params)) : c.name;
    return one.not ? `not ${text}` : text;
  }

  const describe = (when) => parts(when).map(describeOne).join(' and ') || 'never';

  return { register, get, all, paramsFor, test, describe, parts };
})();

// ---- src/core/settings.js --------------------------------------------
// Persistent settings: options (booleans for now) and hotkey bindings.
// Saved inside the regular Cookie Clicker save through the mod API (see main.js),
// so they follow exports/imports and cloud saves like any other game data.

CA.Settings = (() => {
  const SAVE_VERSION = 1;

  const optionDefs = []; // { key, name, desc, group, default }
  const options = {};
  let hotkeyOverrides = {}; // actionId -> combo ('' = explicitly unbound)

  // ---- options ---------------------------------------------------------------

  function defineOption(def) {
    optionDefs.push(def);
    if (!(def.key in options)) options[def.key] = def.default;
    return def;
  }

  function optionsIn(group) {
    return optionDefs.filter((d) => d.group === group);
  }

  function get(key) {
    return options[key];
  }

  function set(key, value) {
    if (options[key] === value) return;
    options[key] = value;
    CA.Events.emit('settings', key);
  }

  // ---- hotkeys ---------------------------------------------------------------

  // Hotkeys bind to bindables (CA.Hotkeys.register): macros and a few panel commands.
  // Up to v1.6 the autoclickers were bound as 'clicker.<id>'; they're macros now.
  const LEGACY_HOTKEY_IDS = { 'clicker.stockTrader': 'macro.stockTrader' };
  const migrateHotkeyId = (id) => LEGACY_HOTKEY_IDS[id] || (id.startsWith('clicker.') ? `macro.${id.slice(8)}` : id);

  function getHotkey(id) {
    if (id in hotkeyOverrides) return hotkeyOverrides[id];
    const b = CA.Hotkeys.get(id);
    return b ? b.defaultKey : '';
  }

  /** Every bindable a combo triggers (a key may be shared by several macros). */
  function targetsForCombo(combo) {
    if (!combo) return [];
    return CA.Hotkeys.all()
      .filter((b) => getHotkey(b.id) === combo)
      .map((b) => b.id);
  }

  /**
   * Binds `combo` to bindable `id`. Keys can be shared, so nothing else is unbound.
   * @returns {string[]} ids of the other bindables that the same key also triggers
   */
  function setHotkey(id, combo) {
    storeOverride(id, combo);
    CA.Events.emit('hotkeys', id);
    return combo ? targetsForCombo(combo).filter((x) => x !== id) : [];
  }

  function storeOverride(id, combo) {
    const b = CA.Hotkeys.get(id);
    if (b && b.defaultKey === combo) delete hotkeyOverrides[id];
    else hotkeyOverrides[id] = combo;
  }

  function resetHotkeys() {
    hotkeyOverrides = {};
    CA.Events.emit('hotkeys', null);
  }

  // ---- save / load -------------------------------------------------------------

  function serialize() {
    const data = { v: SAVE_VERSION, options: { ...options }, hotkeys: { ...hotkeyOverrides } };
    if (CA.Macros) {
      data.macros = CA.Macros.serialize(); // your own macros + per-macro preferences
      if (options.rememberStates) data.running = CA.Macros.runningIds();
    }
    if (CA.UI && CA.UI.Widgets) data.widgets = CA.UI.Widgets.serialize();
    if (CA.Garden) data.garden = CA.Garden.serialize(); // garden profiles
    return JSON.stringify(data);
  }

  /** @returns {object|null} the parsed save (so callers can read extra fields such as clickers) */
  function deserialize(str) {
    if (!str) return null;
    let data;
    try {
      data = JSON.parse(str);
    } catch (e) {
      CA.Util.log('Could not read saved settings, using defaults.', e);
      return null;
    }
    if (!data || typeof data !== 'object') return null;

    if (data.options && typeof data.options === 'object') {
      optionDefs.forEach((d) => {
        if (typeof data.options[d.key] === typeof d.default) options[d.key] = data.options[d.key];
      });
    }
    if (data.hotkeys && typeof data.hotkeys === 'object') {
      hotkeyOverrides = {};
      Object.keys(data.hotkeys).forEach((id) => {
        if (typeof data.hotkeys[id] === 'string') hotkeyOverrides[migrateHotkeyId(id)] = data.hotkeys[id];
      });
    }
    CA.Events.emit('settings', null);
    CA.Events.emit('hotkeys', null);
    return data;
  }

  // ---- local mirror (survives a quick refresh) ----------------------------------
  // Cookie Clicker only autosaves once every 60 real seconds (see Game.T%(fps*60) in its own
  // source) and does not force a save on tab close/refresh — so toggling a setting and
  // reloading soon after can lose it, through no fault of this mod (any mod's save data has
  // the same gap). We mirror our own serialized state to localStorage on every change (plus a
  // periodic safety net and on page hide), and prefer it over whatever came from the game's own
  // save on load, since ours is never more than moments out of date.

  const STORE_KEY = 'CookieMgr.settings.v1';
  const PERSIST_MS = 30000;
  let persistTimer = null;

  function persistToLocal() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), payload: serialize() }));
    } catch (e) {
      /* storage full/blocked (private mode, quota, ...) — this is a convenience mirror, never fatal */
    }
  }

  /** The mirrored payload string, or null. Read it *before* deserialize()ing anything: that
   *  emits 'settings', which re-mirrors the current (not yet restored) state over it. */
  function localPayload() {
    let raw;
    try {
      raw = localStorage.getItem(STORE_KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return null;
    }
    return data && typeof data.payload === 'string' ? data.payload : null;
  }

  /** @returns {object|null} same shape as deserialize()'s return, or null if nothing local */
  function restoreFromLocal() {
    const payload = localPayload();
    return payload ? deserialize(payload) : null;
  }

  function startAutoPersist() {
    CA.Events.on('settings', persistToLocal);
    CA.Events.on('hotkeys', persistToLocal);
    CA.Events.on('macros', persistToLocal);
    CA.Events.on('widgets', persistToLocal);
    CA.Events.on('garden', persistToLocal);
    persistTimer = setInterval(persistToLocal, PERSIST_MS);
    addEventListener('pagehide', persistToLocal);
    addEventListener('beforeunload', persistToLocal);
  }

  return {
    defineOption,
    optionsIn,
    get,
    set,
    getHotkey,
    setHotkey,
    targetsForCombo,
    resetHotkeys,
    serialize,
    deserialize,
    restoreFromLocal,
    localPayload,
    startAutoPersist,
  };
})();

// ---- src/core/store.js -----------------------------------------------
// Persistent storage for everything CookieMgr *records* (state history, the event log, small
// key/value blobs), in IndexedDB rather than localStorage.
//
// Why not localStorage: the real Cookie Clicker save lives in localStorage, browsers give
// localStorage only ~5-10MB per site, and the game silently swallows its own quota errors —
// so add-on data there can quietly stop the game from saving (see v1.2.2). IndexedDB has its
// own, far larger quota, so nothing we store here can crowd out the game's save.
//
// Three object stores, each record carrying the save it belongs to (`s`, see saveId()):
//   chunks  { id, s, tier, start, frames: [...] }   recorded state history (core/recorder.js)
//   events  { id, s, t, ... }                       the event log (core/eventLog.js)
//   kv      { id, s, k, v }                         small blobs (stock cost basis, buff log, …)
// If IndexedDB is unavailable (very old browser, some private modes) every call resolves to an
// empty result and CookieMgr just runs without persistence.

CA.Store = (() => {
  const DB_NAME = 'CookieMgr';
  const DB_VERSION = 1;
  const STORES = ['chunks', 'events', 'kv'];
  let dbPromise = null;

  /** Identifies the current save, so two bakeries in one browser don't mix their history. */
  function saveId() {
    return typeof Game !== 'undefined' && Game.fullDate ? String(Game.fullDate) : 'default';
  }

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const idb = typeof indexedDB !== 'undefined' ? indexedDB : null;
      if (!idb) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = idb.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        STORES.forEach((name) => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' }).createIndex('s', 's');
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch((e) => CA.Util.log('IndexedDB unavailable — recorded history will not persist.', e));
    return dbPromise;
  }

  /** Runs `fn(objectStore)` in one transaction; resolves with fn's IDBRequest result (if any). */
  function run(store, mode, fn) {
    return open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(store, mode);
          const req = fn(tx.objectStore(store));
          tx.oncomplete = () => resolve(req && 'result' in req ? req.result : undefined);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        })
    );
  }

  const quiet = (p, fallback) => p.catch(() => fallback);

  const put = (store, record) => quiet(run(store, 'readwrite', (os) => os.put(record)));
  const putMany = (store, records) =>
    records.length
      ? quiet(
          run(store, 'readwrite', (os) => {
            records.forEach((r) => os.put(r));
          })
        )
      : Promise.resolve();
  const remove = (store, id) => quiet(run(store, 'readwrite', (os) => os.delete(id)));
  const removeMany = (store, ids) =>
    ids.length
      ? quiet(
          run(store, 'readwrite', (os) => {
            ids.forEach((id) => os.delete(id));
          })
        )
      : Promise.resolve();
  /** Every record in `store` belonging to save `s`. */
  const allFor = (store, s) => quiet(run(store, 'readonly', (os) => os.index('s').getAll(s)), []);

  /** Deletes every record for save `s` across all stores. */
  function clearSave(s) {
    return Promise.all(
      STORES.map((store) =>
        quiet(
          run(store, 'readwrite', (os) => {
            const req = os.index('s').openKeyCursor(s);
            req.onsuccess = () => {
              const cur = req.result;
              if (!cur) return;
              os.delete(cur.primaryKey);
              cur.continue();
            };
          })
        )
      )
    );
  }

  // ---- key/value convenience ------------------------------------------------------------
  const kvId = (s, k) => `${s}|${k}`;
  const getKV = (k, s = saveId()) => quiet(run('kv', 'readonly', (os) => os.get(kvId(s, k)))).then((r) => (r ? r.v : undefined));
  const setKV = (k, v, s = saveId()) => put('kv', { id: kvId(s, k), s, k, v });

  const available = () => open().then(
    () => true,
    () => false
  );

  return { saveId, open, available, put, putMany, remove, removeMany, allFor, clearSave, getKV, setKV };
})();

// ---- src/core/states.js ----------------------------------------------
// Registry of **states**: named values CookieMgr can read from the game at any moment. Plots
// are just ways of drawing recorded states, and (from v2) macro conditions test them.
//
//   CA.States.define({
//     id: 'cps',                 // stable — it's a field name in recorded frames
//     name: 'CpS', unit: '/s',   // for UI
//     kind: 'gauge',             // 'gauge'   a level (bank, CpS)          — downsampled by mean
//                                // 'counter' a running total (cookies baked) — downsampled by last value
//                                // 'flow'    an amount during one frame (earned from clicks) — summed
//     record: true,              // sample it into the recorder (false = live-only, e.g. conditions)
//     get(ctx) { ... },          // returns a number; ctx = { dt, prev, frame, events } (see recorder)
//   });
//
// Flows are computed after gauges and counters, so a flow's get() can compare ctx.frame (this
// frame's gauges/counters so far) against ctx.prev (the previous frame).

CA.States = (() => {
  const defs = [];
  const byId = {};
  const AGG = { gauge: 'mean', counter: 'last', flow: 'sum' };

  function define(def) {
    if (byId[def.id]) throw new Error(`State "${def.id}" already defined`);
    const d = { record: true, unit: '', group: 'game', kind: 'gauge', ...def };
    d.agg = d.agg || AGG[d.kind] || 'mean';
    defs.push(d);
    byId[d.id] = d;
    return d;
  }

  const get = (id) => byId[id] || null;
  const list = () => defs.slice();
  /** Recorded states in evaluation order: gauges and counters first, then flows. */
  const recorded = () => defs.filter((d) => d.record && d.kind !== 'flow').concat(defs.filter((d) => d.record && d.kind === 'flow'));

  /** Reads one state now; undefined if it isn't defined or its getter throws. */
  function value(id, ctx) {
    const d = byId[id];
    if (!d) return undefined;
    try {
      return d.get(ctx || {});
    } catch (e) {
      return undefined;
    }
  }

  return { define, get, list, recorded, value };
})();

// ---- src/core/recorder.js --------------------------------------------
// Records every recorded state (core/states.js) once a second into **frames**:
//   { t: wall-clock ms, a: active-play ms, dt: seconds covered, <stateId>: value, ... }
//
// Active play time: time only counts while the game is actually running. A gap of more than
// MAX_GAP_MS between ticks (page closed, computer asleep, a throttled background tab) adds just
// one tick's worth, and flows aren't computed across it — so offline/background earnings never
// land in a 1-second frame, and graphs can drop inactive time entirely (frame.a).
//
// Progressive resolution, by active-time age:
//   tier 0  every second    for the last 3 hours of active play
//   tier 1  every 15 s      up to 24 hours back
//   tier 2  every 2 min     up to 7 days back
//   tier 3  every 15 min    beyond that, kept indefinitely
// Frames are grouped into chunks (per tier); once a chunk ages past its tier it is merged into
// the next tier's resolution (gauges by time-weighted mean, counters by last value, flows by
// sum — see CA.States) and deleted. Everything lives in IndexedDB (core/store.js) per save,
// and the whole history can be exported to / imported from a file.

CA.Recorder = (() => {
  const SAMPLE_MS = 1000;
  const MAX_GAP_MS = 5000;
  const FLUSH_MS = 15000;
  const COMPACT_MS = 60000;
  const HOUR = 3600 * 1000;
  const TIERS = [
    { res: 1000, maxAge: 3 * HOUR, chunk: 600, label: '1 s' },
    { res: 15000, maxAge: 24 * HOUR, chunk: 480, label: '15 s' },
    { res: 120000, maxAge: 7 * 24 * HOUR, chunk: 720, label: '2 min' },
    { res: 900000, maxAge: Infinity, chunk: 672, label: '15 min' },
  ];
  const EXPORT_FORMAT = 'cookiemgr-history';

  let saveId = null;
  let tiers = TIERS.map(() => []); // per tier: chunks { id, s, tier, start, frames }, oldest first
  let all = []; // every frame across tiers, oldest first (tiers cover disjoint, ordered spans)
  let active = 0;
  let lastTick = 0;
  let prev = null;
  let ready = false;
  let loading = null;
  let rev = 0; // bumped whenever frames() changes
  const dirty = new Set();
  let toDelete = [];

  const inAscension = () => Game.OnAscend || Game.AscendTimer > 0;

  // ---- frames ----------------------------------------------------------------------------

  /** Merges consecutive frames into one: gauges by dt-weighted mean, counters by last value,
   *  flows by sum. Keys from states no longer defined fall back to mean. */
  function merge(group) {
    const last = group[group.length - 1];
    const out = { t: last.t, a: last.a, dt: 0 };
    const keys = new Set();
    group.forEach((f) => {
      out.dt += f.dt || 0;
      Object.keys(f).forEach((k) => {
        if (k !== 't' && k !== 'a' && k !== 'dt') keys.add(k);
      });
    });
    keys.forEach((k) => {
      const def = CA.States.get(k);
      const agg = def ? def.agg : 'mean';
      let sum = 0;
      let w = 0;
      let lastV;
      let n = 0;
      group.forEach((f) => {
        const v = f[k];
        if (!Number.isFinite(v)) return;
        n++;
        lastV = v;
        const fw = f.dt || 0;
        if (agg === 'mean') {
          sum += v * fw;
          w += fw;
        } else sum += v;
      });
      if (!n) return;
      if (agg === 'last') out[k] = lastV;
      else if (agg === 'sum') out[k] = sum;
      else out[k] = w > 0 ? sum / w : lastV;
    });
    return out;
  }

  /** Groups frames into `res`-ms buckets of active time and merges each bucket. */
  function downsample(frames, res) {
    const out = [];
    let group = [];
    let idx = null;
    frames.forEach((f) => {
      const b = Math.floor(f.a / res);
      if (idx !== null && b !== idx) {
        out.push(merge(group));
        group = [];
      }
      idx = b;
      group.push(f);
    });
    if (group.length) out.push(merge(group));
    return out;
  }

  // ---- chunks ----------------------------------------------------------------------------

  const newChunk = (tier, start) => ({ id: `${saveId}|${tier}|${start}`, s: saveId, tier, start, frames: [] });

  function appendTo(tier, frames) {
    if (!frames.length) return;
    const list = tiers[tier];
    const res = TIERS[tier].res;
    let chunk = list[list.length - 1];
    frames.forEach((f) => {
      // A bucket can straddle two source chunks; fold its second half into the first.
      if (tier > 0 && chunk && chunk.frames.length) {
        const tail = chunk.frames[chunk.frames.length - 1];
        if (Math.floor(tail.a / res) === Math.floor(f.a / res)) {
          chunk.frames[chunk.frames.length - 1] = merge([tail, f]);
          dirty.add(chunk);
          return;
        }
      }
      if (!chunk || chunk.frames.length >= TIERS[tier].chunk) {
        chunk = newChunk(tier, f.a);
        list.push(chunk);
      }
      chunk.frames.push(f);
      dirty.add(chunk);
    });
  }

  function rebuildAll() {
    rev++;
    all = [];
    for (let k = TIERS.length - 1; k >= 0; k--) tiers[k].forEach((c) => (all = all.concat(c.frames)));
  }

  /** Moves chunks that have aged out of their tier into the next tier's resolution. */
  function compact() {
    let changed = false;
    for (let k = 0; k < TIERS.length - 1; k++) {
      while (tiers[k].length > 1) {
        const c = tiers[k][0];
        const end = c.frames.length ? c.frames[c.frames.length - 1].a : c.start;
        if (active - end <= TIERS[k].maxAge) break;
        appendTo(k + 1, downsample(c.frames, TIERS[k + 1].res));
        tiers[k].shift();
        dirty.delete(c);
        toDelete.push(c.id);
        changed = true;
      }
    }
    if (changed) {
      rebuildAll();
      CA.Events.emit('history', 'compact');
    }
    return changed;
  }

  // ---- sampling --------------------------------------------------------------------------

  function tick() {
    if (!ready || typeof Game === 'undefined' || !Game.ready) return;
    if (CA.Store.saveId() !== saveId) {
      switchSave();
      return;
    }
    if (!CA.Settings.get('trackHistory') || inAscension()) {
      // nothing to measure; start clean afterwards
      lastTick = 0;
      prev = null;
      return;
    }
    const now = Date.now();
    const gap = lastTick ? now - lastTick : SAMPLE_MS;
    const continuous = lastTick && gap <= MAX_GAP_MS;
    const step = continuous ? gap : SAMPLE_MS;
    active += step;
    lastTick = now;
    const frame = { t: now, a: active, dt: step / 1000 };
    const ctx = {
      dt: frame.dt,
      prev: continuous ? prev : null,
      frame,
      events: CA.EventLog.since(continuous && prev ? prev.t : now),
    };
    CA.States.recorded().forEach((d) => {
      const v = CA.States.value(d.id, ctx);
      if (Number.isFinite(v)) frame[d.id] = v;
    });
    prev = frame;
    appendTo(0, [frame]);
    all.push(frame);
    rev++;
    CA.Events.emit('history', 'sample');
  }

  // ---- persistence -----------------------------------------------------------------------

  function flush() {
    if (!saveId) return Promise.resolve();
    const chunks = [...dirty];
    dirty.clear();
    const dels = toDelete;
    toDelete = [];
    return Promise.all([
      CA.Store.putMany('chunks', chunks),
      CA.Store.removeMany('chunks', dels),
      CA.Store.setKV('recorder', { active }, saveId),
    ]);
  }

  function load() {
    ready = false;
    saveId = CA.Store.saveId();
    const s = saveId;
    loading = Promise.all([CA.Store.allFor('chunks', s), CA.Store.getKV('recorder', s)]).then(([chunks, meta]) => {
      if (s !== saveId) return; // switched again meanwhile
      tiers = TIERS.map(() => []);
      chunks
        .filter((c) => tiers[c.tier] && Array.isArray(c.frames))
        .sort((x, y) => x.tier - y.tier || x.start - y.start)
        .forEach((c) => tiers[c.tier].push(c));
      let maxA = 0;
      tiers.forEach((list) => list.forEach((c) => c.frames.forEach((f) => (maxA = Math.max(maxA, f.a)))));
      active = Math.max((meta && meta.active) || 0, maxA);
      dirty.clear();
      toDelete = [];
      rebuildAll();
      compact();
      prev = null;
      lastTick = 0;
      ready = true;
      CA.Events.emit('history', 'load');
    });
    return loading;
  }

  function switchSave() {
    ready = false;
    flush().then(load);
  }

  /** Erases this save's recorded state history (chunks only). */
  function clear() {
    const ids = [];
    tiers.forEach((list) => list.forEach((c) => ids.push(c.id)));
    tiers = TIERS.map(() => []);
    all = [];
    rev++;
    dirty.clear();
    toDelete = [];
    prev = null;
    return CA.Store.removeMany('chunks', ids).then(() => CA.Events.emit('history', 'clear'));
  }

  // ---- queries ---------------------------------------------------------------------------

  const frames = () => all;

  /** Frames that have `key`, as { t, a, v } points — cached until the frames change. */
  const seriesCache = new Map();
  function series(key) {
    let c = seriesCache.get(key);
    if (c && c.rev === rev) return c.pts;
    // sampling only appends; anything else (load/compact/clear) replaces `all` → rebuild
    if (!c || c.src !== all) c = { src: all, n: 0, pts: [] };
    for (let i = c.n; i < all.length; i++) {
      const f = all[i];
      if (Number.isFinite(f[key])) c.pts.push({ t: f.t, a: f.a, v: f[key] });
    }
    c.n = all.length;
    c.rev = rev;
    seriesCache.set(key, c);
    return c.pts;
  }

  /** Index of the first frame with `key` (default t) >= value — binary search. */
  function lowerBound(value, key = 't') {
    let lo = 0;
    let hi = all.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (all[mid][key] < value) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** Wall-clock time at active-play time `a`. Within a frame both clocks run together. */
  function timeAt(a) {
    if (!all.length) return Date.now() - (active - a);
    const i = lowerBound(a, 'a');
    if (i >= all.length) {
      const l = all[all.length - 1];
      return l.t + (a - l.a);
    }
    return all[i].t - (all[i].a - a);
  }

  /** Active-play time at wall-clock time `t`; a moment while the game wasn't running maps to
   *  where play resumed. */
  function activeAt(t) {
    if (!all.length) return active;
    const i = lowerBound(t);
    if (i >= all.length) {
      const l = all[all.length - 1];
      return l.a + Math.max(0, Math.min(t - l.t, MAX_GAP_MS));
    }
    const f = all[i];
    return f.a - Math.min(f.t - t, (f.dt || 1) * 1000);
  }

  function summary() {
    const perTier = tiers.map((list, k) => ({
      label: TIERS[k].label,
      frames: list.reduce((n, c) => n + c.frames.length, 0),
      chunks: list.length,
    }));
    return { active, frames: all.length, perTier, first: all[0] || null, ready };
  }

  // ---- export / import -------------------------------------------------------------------

  /** Everything recorded for this save (state history, event log, small blobs) as one object. */
  function exportData() {
    return flush()
      .then(() => CA.EventLog.flush())
      .then(() => Promise.all([CA.Store.allFor('chunks', saveId), CA.Store.allFor('events', saveId), CA.Store.allFor('kv', saveId)]))
      .then(([chunks, events, kv]) => ({
        format: EXPORT_FORMAT,
        version: 1,
        cookieMgr: CA.VERSION,
        exportedAt: Date.now(),
        bakery: typeof Game !== 'undefined' ? Game.bakeryName : '',
        saveId,
        chunks,
        events,
        kv,
      }));
  }

  /** Replaces this save's recorded data with an export (from any save/browser). */
  function importData(data) {
    if (!data || data.format !== EXPORT_FORMAT || !Array.isArray(data.chunks)) {
      return Promise.reject(new Error('Not a CookieMgr history export.'));
    }
    const s = saveId;
    const rekey = (r, rest) => ({ ...r, s, id: `${s}|${rest}` });
    const chunks = data.chunks.filter((c) => c && Array.isArray(c.frames)).map((c) => rekey(c, `${c.tier}|${c.start}`));
    const events = (data.events || []).filter((e) => e && Number.isFinite(e.t)).map((e, i) => rekey(e, `${e.t}|i${i}`));
    const kv = (data.kv || []).filter((r) => r && r.k).map((r) => rekey(r, r.k));
    return CA.Store.clearSave(s)
      .then(() => Promise.all([CA.Store.putMany('chunks', chunks), CA.Store.putMany('events', events), CA.Store.putMany('kv', kv)]))
      .then(() => {
        CA.Events.emit('storeReloaded');
        return load();
      })
      .then(() => ({ chunks: chunks.length, events: events.length }));
  }

  /** Downloads exportData() as a .json file. */
  function exportFile() {
    return exportData().then((data) => {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = String(data.bakery || 'bakery').replace(/[^\w-]+/g, '_');
      a.href = url;
      a.download = `cookiemgr-history-${name}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return data;
    });
  }

  /** Reads a File chosen by the user and imports it. */
  function importFile(file) {
    return file.text().then((txt) => importData(JSON.parse(txt)));
  }

  function init() {
    CA.Settings.defineOption({
      key: 'trackHistory',
      icon: 'record',
      group: 'general',
      name: 'Record history',
      desc: 'Records CpS, cookies, prestige and more over time for the graphs — every second for the last 3 hours of play, coarser further back. Kept in this browser (not in your game save); export it from Settings.',
      default: true,
    });
    load();
    setInterval(tick, SAMPLE_MS);
    setInterval(flush, FLUSH_MS);
    setInterval(compact, COMPACT_MS);
    addEventListener('pagehide', flush);
  }

  return {
    init,
    frames,
    series,
    revision: () => rev,
    lowerBound,
    timeAt,
    activeAt,
    summary,
    clear,
    flush,
    compact,
    exportData,
    importData,
    exportFile,
    importFile,
    activeNow: () => active,
    isReady: () => ready,
    whenLoaded: () => loading,
    TIERS,
    _merge: merge,
    _downsample: downsample,
  };
})();

// ---- src/core/eventLog.js --------------------------------------------
// The central **event** log: one place for everything that *happened* — golden/wrath cookies,
// reindeer, ascensions, stock trades, and (later) spells and macro runs. Pages show filtered
// views of it; the recorder uses it to attribute golden-cookie income.
//
//   CA.EventLog.add({ type: 'golden', title, text, cookies: +1234, data: {...} })
//
// Each event also gets t (wall ms), a (active-play ms, see core/recorder.js) and an id.
// `cookies` is the signed change to the bank the event caused (0 if none). Persisted per save
// in IndexedDB (core/store.js); the newest MAX_MEMORY are kept in memory.

CA.EventLog = (() => {
  const MAX_MEMORY = 5000;
  const MAX_STORED = 20000;
  const FLUSH_MS = 5000;

  const TYPES = {}; // type -> { name, icon, color, income }
  let saveId = null;
  let events = []; // oldest first
  let pending = [];
  let seq = 0;
  let version = 0;

  /** Describes an event type for filters/legends. `income`: its cookies count as income. */
  function defineType(type, meta) {
    TYPES[type] = { name: type, icon: '', color: '#ccc', income: false, ...meta };
  }

  function add(ev) {
    const t = Date.now();
    const s = saveId || CA.Store.saveId();
    const e = {
      title: '',
      text: '',
      cookies: 0,
      data: {},
      ...ev,
      t,
      a: CA.Recorder.activeNow(),
      s,
      id: `${s}|${t}|${++seq}`,
    };
    events.push(e);
    if (events.length > MAX_MEMORY + 200) events.splice(0, events.length - MAX_MEMORY);
    pending.push(e);
    version++;
    CA.Events.emit('eventLogged', e);
    return e;
  }

  function flush() {
    const batch = pending;
    pending = [];
    return CA.Store.putMany('events', batch);
  }

  function load() {
    const s = CA.Store.saveId();
    saveId = s;
    return CA.Store.allFor('events', s).then((stored) => {
      if (s !== saveId) return;
      // whatever was logged for this save while the read was in flight (not a snapshot from
      // before it — events keep arriving during the read)
      const addedMeanwhile = events.filter((e) => e.s === s);
      stored.sort((x, y) => x.t - y.t);
      if (stored.length > MAX_STORED) {
        const drop = stored.splice(0, stored.length - MAX_STORED);
        CA.Store.removeMany(
          'events',
          drop.map((e) => e.id)
        );
      }
      const ids = new Set(stored.map((e) => e.id));
      events = stored.concat(addedMeanwhile.filter((e) => !ids.has(e.id))).slice(-MAX_MEMORY);
      seq = Math.max(seq, stored.length);
      version++;
      CA.Events.emit('eventLogged', null);
    });
  }

  /** Erases this save's event log. */
  function clear() {
    const ids = events.map((e) => e.id);
    events = [];
    pending = [];
    version++;
    return CA.Store.allFor('events', saveId).then((stored) =>
      CA.Store.removeMany('events', ids.concat(stored.map((e) => e.id)))
    );
  }

  /** Events of the given types (all if omitted), oldest first. */
  function list(types) {
    if (!types) return events;
    const set = new Set(types);
    return events.filter((e) => set.has(e.type));
  }

  /** Events strictly after wall time `t`. */
  function since(t) {
    let lo = 0;
    let hi = events.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (events[mid].t <= t) lo = mid + 1;
      else hi = mid;
    }
    return events.slice(lo);
  }

  function init() {
    defineType('golden', { name: 'Golden cookie', icon: 'cookie', color: '#ffd54a', income: true });
    defineType('wrath', { name: 'Wrath cookie', icon: 'cookie', color: '#e5484d', income: true });
    defineType('reindeer', { name: 'Reindeer', icon: 'star', color: '#c48a5a', income: true });
    defineType('ascend', { name: 'Ascension', icon: 'star', color: '#c9bcff' });
    defineType('trade', { name: 'Stock trade', icon: 'stocks', color: '#7fe08b' });
    load();
    setInterval(flush, FLUSH_MS);
    addEventListener('pagehide', flush);
    CA.Events.on('storeReloaded', load);
    // A different save was loaded (import/hard reset): switch logs along with the recorder.
    CA.Events.on('history', (why) => {
      if (why === 'load' && CA.Store.saveId() !== saveId) load();
    });
  }

  return { init, add, list, since, flush, clear, defineType, types: () => TYPES, version: () => version };
})();

// ---- src/core/hotkeys.js ---------------------------------------------
// Global keyboard shortcuts + "press a key to bind" capture mode.
//
// hotkey → macro(s) → action(s): a hotkey is bound to *bindables* — every macro registers one
// (features/macros.js), plus a couple of panel commands (open/close the panel, all autoclickers).
// One key may trigger several macros at once.
//
// A combo is stored as a string of optional modifiers followed by a KeyboardEvent.code,
// e.g. 'KeyG', 'Shift+KeyG', 'Ctrl+Alt+Digit1'. Using `code` (physical key) keeps
// bindings stable across keyboard layouts and Shift states.

CA.Hotkeys = (() => {
  // ---- bindables ---------------------------------------------------------------------
  const targets = [];
  const byId = {};

  /** { id, name, group, defaultKey, run } — registering an existing id replaces it. */
  function register(t) {
    const b = { group: 'general', defaultKey: '', ...t };
    if (!byId[b.id]) targets.push(b);
    else targets[targets.indexOf(byId[b.id])] = b;
    byId[b.id] = b;
    return b;
  }
  function unregister(id) {
    const b = byId[id];
    if (!b) return;
    targets.splice(targets.indexOf(b), 1);
    delete byId[id];
  }
  const get = (id) => byId[id];
  const all = () => targets.slice();

  const MODIFIER_CODES = [
    'ShiftLeft',
    'ShiftRight',
    'ControlLeft',
    'ControlRight',
    'AltLeft',
    'AltRight',
    'MetaLeft',
    'MetaRight',
    'CapsLock',
  ];
  const RESERVED = ['Ctrl+KeyS', 'Ctrl+KeyO']; // the game's own save/import shortcuts

  const PRETTY = {
    Space: 'Space',
    Enter: 'Enter',
    Tab: 'Tab',
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    PageUp: 'PgUp',
    PageDown: 'PgDn',
    Insert: 'Ins',
    Home: 'Home',
    End: 'End',
    NumpadAdd: 'Num +',
    NumpadSubtract: 'Num -',
    NumpadMultiply: 'Num *',
    NumpadDivide: 'Num /',
    NumpadDecimal: 'Num .',
    NumpadEnter: 'Num Enter',
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

    const ids = CA.Settings.targetsForCombo(fromEvent(e));
    if (!ids.length) return;
    e.preventDefault();
    ids.forEach((id) => {
      try {
        byId[id].run();
      } catch (err) {
        console.error(`[CookieMgr] hotkey ${id} failed`, err);
      }
    });
  }

  function init() {
    // capture phase so binding mode can swallow the key before anything else reacts to it
    window.addEventListener('keydown', onKeyDown, true);
  }

  return { init, register, unregister, get, all, fromEvent, format, startCapture, cancelCapture, capturing };
})();

// ---- src/core/ascension.js -------------------------------------------
// Detects the moment the player ascends and emits an 'ascend' event.
//
// Primary signal: Game.Ascend(bypass) — the game calls it with a truthy argument once the
// player confirms the prompt. A light watchdog also checks Game.AscendTimer / Game.OnAscend
// in case another mod (or a future game version) starts the ascension some other way.

CA.Ascension = (() => {
  let ascending = false;

  function fire() {
    if (ascending) return;
    ascending = true;
    CA.Events.emit('ascend');
  }

  function watchdog() {
    const inAscension = Game.OnAscend || Game.AscendTimer > 0;
    if (inAscension) fire();
    else ascending = false;
  }

  function init() {
    CA.Util.wrap(Game, 'Ascend', (original, args, self) => {
      const result = original.apply(self, args);
      if (args[0]) fire();
      return result;
    });
    setInterval(watchdog, 500);
  }

  return { init };
})();

// ---- src/core/update.js ----------------------------------------------
// Periodically checks GitHub Pages for a newer build and lets you know with one click to
// reload — it deliberately does NOT try to hot-swap the running mod in place. CookieMgr
// monkey-patches several Game.* functions (see CA.Util.wrap) and injects DOM/CSS with no
// matching teardown, so re-initializing over itself without a full page reload risks
// double-wrapped functions and leaked listeners/timers. A plain "click to reload" is the safe
// way to actually apply an update; this only ever removes the manual "go check GitHub" step.

CA.Update = (() => {
  const VERSION_URL = 'https://nunorgcarvalho.github.io/CookieMgr/dist/version.txt';
  const CHECK_MS = 15 * 60 * 1000;
  const FIRST_CHECK_MS = 30000;

  let timer = null;
  let notifiedVersion = null;

  /** True if `a` (e.g. "0.4.0") is a newer semver-ish version than `b`. */
  function isNewer(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const va = pa[i] || 0;
      const vb = pb[i] || 0;
      if (va !== vb) return va > vb;
    }
    return false;
  }

  async function check() {
    if (typeof fetch !== 'function' || !CA.Settings.get('updateCheck')) return;
    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const remote = (await res.text()).trim();
      if (!/^\d+\.\d+\.\d+$/.test(remote) || remote === notifiedVersion || !isNewer(remote, CA.VERSION)) return;
      notifiedVersion = remote;
      CA.Util.notify(
        `CookieMgr v${remote} is available`,
        `You're on v${CA.VERSION}. <a href="javascript:void(0)" onclick="location.reload()">Reload now</a> to update — ` +
          `CookieMgr can't safely update itself without a page reload.`,
        CA.ICON,
        6
      );
    } catch (e) {
      /* offline, blocked, CORS-blocked, whatever — this is a convenience check, never fatal */
    }
  }

  function init() {
    CA.Settings.defineOption({
      key: 'updateCheck',
      icon: 'refresh',
      group: 'general',
      name: 'Check for updates',
      desc: 'Periodically checks GitHub for a newer CookieMgr build and lets you know — never updates automatically.',
      default: true,
    });
    setTimeout(check, FIRST_CHECK_MS);
    timer = setInterval(check, CHECK_MS);
  }

  return { init };
})();

// ---- src/features/gameActions.js -------------------------------------
// The game-facing **actions** (core/actions.js) and **conditions** (core/conditions.js) macros
// are built from. Each action does one thing once and returns how many things it did.
// Spells live in features/grimoire.js.

CA.GameActions = (() => {
  const popShimmers = (filter) => {
    const list = (Game.shimmers || []).filter(filter);
    list.forEach((s) => s.pop());
    return list.length;
  };

  // Effect names as the game keys them in Game.buffs (the common golden-cookie ones).
  const BUFFS = [
    'Frenzy',
    'Click frenzy',
    'Elder frenzy',
    'Dragonflight',
    'Dragon Harvest',
    'Cookie storm',
    'Clot',
    'Cursed finger',
    'Everything must go',
    'Sugar blessing',
    'Devastation',
    'Sugar frenzy',
  ];
  const buffOptions = () => {
    const names = new Set(BUFFS);
    Object.keys(Game.buffs || {}).forEach((n) => names.add(n));
    return [...names].map((n) => ({ v: n, label: n }));
  };
  const isBuildingSpecial = (b) => b && b.type && b.type.name === 'building buff';

  const OPS = [
    { v: '>=', label: '≥' },
    { v: '<=', label: '≤' },
    { v: '>', label: '>' },
    { v: '<', label: '<' },
  ];
  const compare = (a, op, b) => (op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : a < b);

  function registerActions() {
    const A = CA.Actions.register;
    A({
      id: 'click.bigCookie',
      name: 'Click the big cookie',
      icon: 'cookie',
      group: 'Clicking',
      unit: 'clicks',
      run: () => {
        Game.ClickCookie();
        return 1;
      },
    });
    A({
      id: 'pop.golden',
      name: 'Pop golden cookies',
      icon: 'cookie',
      group: 'Shimmers',
      unit: 'popped',
      run: () => popShimmers((s) => s.type === 'golden' && !s.wrath),
    });
    A({
      id: 'pop.wrath',
      name: 'Pop wrath cookies',
      icon: 'cookie',
      group: 'Shimmers',
      unit: 'popped',
      run: () => popShimmers((s) => s.type === 'golden' && s.wrath),
    });
    A({
      id: 'pop.reindeer',
      name: 'Pop reindeer',
      icon: 'star',
      group: 'Shimmers',
      unit: 'popped',
      run: () => popShimmers((s) => s.type === 'reindeer'),
    });
    A({
      id: 'click.fortune',
      name: 'Click fortune news',
      icon: 'tag',
      group: 'Clicking',
      unit: 'fortunes',
      run: () => {
        if (!(Game.TickerEffect && Game.TickerEffect.type === 'fortune' && Game.tickerL)) return 0;
        Game.tickerL.click();
        return 1;
      },
    });
    A({
      id: 'pop.wrinklers',
      name: 'Pop wrinklers',
      icon: 'wrinkler',
      group: 'Shimmers',
      unit: 'popped',
      params: [
        {
          key: 'shiny',
          label: 'Shiny wrinklers',
          type: 'select',
          default: 'pop',
          options: () => [
            { v: 'pop', label: 'Pop them too' },
            { v: 'keep', label: 'Leave them alone' },
          ],
        },
      ],
      describe: (p) => (p.shiny === 'keep' ? 'Pop wrinklers (not shiny ones)' : 'Pop wrinklers'),
      run: (p) => {
        let n = 0;
        (Game.wrinklers || []).forEach((w) => {
          if (w.phase > 0 && w.hp > 0 && !(p.shiny === 'keep' && w.type === 1)) {
            w.hp = 0; // the game pops it on its next frame, paying out as usual
            n++;
          }
        });
        return n;
      },
    });
    A({
      id: 'stocks.trade',
      name: 'Trade stocks: buy rising, sell the rest',
      icon: 'stocks',
      group: 'Stock market',
      unit: 'trades',
      available: () => !!CA.Stocks.minigame(),
      run: () => CA.StockTrader.trade(),
    });
    A({
      id: 'stocks.sellAll',
      name: 'Sell all stocks',
      icon: 'dollar',
      group: 'Stock market',
      unit: 'sold',
      available: () => !!CA.Stocks.minigame(),
      run: () => CA.StockTrader.sellEverything(),
    });
    A({
      id: 'lump.harvest',
      name: 'Harvest the sugar lump',
      icon: 'lump',
      group: 'Other',
      unit: 'harvested',
      // ripe: always pays out. mature (an hour or so sooner): the game gives a 50% chance of nothing
      params: [
        {
          key: 'when',
          label: 'Harvest when',
          type: 'select',
          default: 'ripe',
          options: () => [
            { v: 'ripe', label: 'ripe (always pays)' },
            { v: 'mature', label: 'mature (50% chance)' },
          ],
        },
      ],
      describe: (p) => `Harvest the sugar lump once ${p.when === 'mature' ? 'mature (50%)' : 'ripe'}`,
      available: () => typeof Game.canLumps === 'function' && Game.canLumps(),
      run: (p) => {
        const age = Date.now() - (Game.lumpT || Date.now());
        if (!Game.lumpT || age < (p.when === 'mature' ? Game.lumpMatureAge : Game.lumpRipeAge)) return 0;
        Game.clickLump();
        return 1;
      },
    });
    const SEASONS = () =>
      Object.keys(Game.seasons || {}).map((k) => ({ v: k, label: Game.seasons[k].name }));
    A({
      id: 'season.keep',
      name: 'Keep a season going',
      icon: 'calendar',
      group: 'Other',
      unit: 'switched',
      params: [{ key: 'season', label: 'Season', type: 'select', default: 'christmas', options: SEASONS }],
      describe: (p) => `Keep ${(Game.seasons && Game.seasons[p.season] && Game.seasons[p.season].name) || 'a season'} going`,
      // the season switcher (a heavenly upgrade) puts the seasons' biscuits in the store
      available: () => typeof Game.Has === 'function' && Game.Has('Season switcher'),
      run: (p) => {
        const s = Game.seasons && Game.seasons[p.season];
        if (!s || Game.season === p.season) return 0;
        const up = Game.Upgrades[s.trigger];
        // the game unlocks it again (bought = 0) when a season ends or another starts
        if (!up || !up.unlocked || up.bought || !up.canBuy()) return 0;
        up.buy();
        return Game.season === p.season ? 1 : 0;
      },
    });
    const macroOptions = (pred) => () => CA.Macros.list().filter(pred).map((m) => ({ v: m.id, label: m.name }));
    A({
      id: 'macro.set',
      name: 'Switch a macro on or off',
      icon: 'bolt',
      group: 'Macros',
      params: [
        { key: 'macro', label: 'Macro', type: 'select', default: '', options: macroOptions((m) => m.mode !== 'once') },
        {
          key: 'to',
          label: 'Switch',
          type: 'select',
          default: 'on',
          options: () => [
            { v: 'on', label: 'On' },
            { v: 'off', label: 'Off' },
            { v: 'toggle', label: 'Toggle' },
          ],
        },
      ],
      describe: (p) => {
        const m = CA.Macros.get(p.macro);
        return `Switch ${m ? `“${m.name}”` : 'a macro'} ${p.to === 'toggle' ? 'on/off' : p.to}`;
      },
      run: (p) => {
        const m = CA.Macros.get(p.macro);
        if (!m) return 0;
        const on = p.to === 'toggle' ? !CA.Macros.isOn(m.id) : p.to === 'on';
        if (CA.Macros.isOn(m.id) === on) return 0;
        CA.Macros.set(m.id, on);
        return 1;
      },
    });
    A({
      id: 'macro.run',
      name: 'Run another macro once',
      icon: 'play',
      group: 'Macros',
      params: [{ key: 'macro', label: 'Macro', type: 'select', default: '', options: macroOptions(() => true) }],
      describe: (p) => {
        const m = CA.Macros.get(p.macro);
        return `Run ${m ? `“${m.name}”` : 'a macro'}`;
      },
      run: (p) => (CA.Macros.get(p.macro) ? CA.Macros.runOnce(p.macro) : 0),
    });
  }

  function registerConditions() {
    const C = CA.Conditions.register;
    C({
      id: 'buff',
      name: 'An effect is active',
      icon: 'sparkle',
      params: [{ key: 'name', label: 'Effect', type: 'select', default: 'Frenzy', options: buffOptions }],
      describe: (p) => `${p.name} is active`,
      test: (p) => {
        const b = Game.buffs && Game.buffs[p.name];
        return !!(b && b.time > 0);
      },
    });
    C({
      id: 'buildingSpecial',
      name: 'A building special is active',
      icon: 'sparkle',
      describe: () => 'a building special is active',
      test: () => Object.values(Game.buffs || {}).some((b) => isBuildingSpecial(b) && b.time > 0),
    });
    C({
      id: 'buffCount',
      name: 'Several effects at once',
      icon: 'sparkle',
      params: [{ key: 'n', label: 'At least', type: 'number', default: 2, min: 1 }],
      describe: (p) => `${p.n}+ effects are active`,
      test: (p) => Object.values(Game.buffs || {}).filter((b) => b && b.time > 0).length >= p.n,
    });
    C({
      id: 'shimmer',
      name: 'Something to pop is on screen',
      icon: 'cookie',
      params: [
        {
          key: 'type',
          label: 'What',
          type: 'select',
          default: 'golden',
          options: () => [
            { v: 'golden', label: 'Golden cookie' },
            { v: 'wrath', label: 'Wrath cookie' },
            { v: 'reindeer', label: 'Reindeer' },
          ],
        },
      ],
      describe: (p) => `a ${p.type === 'golden' ? 'golden cookie' : p.type === 'wrath' ? 'wrath cookie' : 'reindeer'} is on screen`,
      test: (p) =>
        (Game.shimmers || []).some((s) =>
          p.type === 'reindeer' ? s.type === 'reindeer' : s.type === 'golden' && !!s.wrath === (p.type === 'wrath')
        ),
    });
    C({
      id: 'state',
      name: 'A value crosses a threshold',
      icon: 'graphs',
      params: [
        {
          key: 'state',
          label: 'Value',
          type: 'select',
          default: 'cps',
          options: () =>
            CA.States.list()
              .filter((d) => d.kind !== 'flow')
              .map((d) => ({ v: d.id, label: d.name })),
        },
        { key: 'op', label: 'Is', type: 'select', default: '>=', options: () => OPS },
        { key: 'value', label: 'Than', type: 'number', default: 0 },
      ],
      describe: (p) => {
        const d = CA.States.get(p.state);
        const op = (OPS.find((o) => o.v === p.op) || OPS[0]).label;
        return `${d ? d.name : p.state} ${op} ${CA.UI.Plot.fmt.beautify(p.value)}`;
      },
      test: (p) => {
        const v = CA.States.value(p.state);
        return Number.isFinite(v) && compare(v, p.op, Number(p.value));
      },
    });
  }

  function init() {
    registerActions();
    registerConditions();
  }

  return { init, BUFFS };
})();

// ---- src/features/macros.js ------------------------------------------
// **Macros**: automations built by chaining actions (core/actions.js). hotkey → macro(s) → action(s).
//
// A macro has a trigger mode:
//   repeat   while it's on, runs its steps every `every` ms              (the autoclickers)
//   when     while it's on, checks a condition (core/conditions.js) every `every` ms and runs its
//            steps when it becomes true ("rise") or on every check while it holds ("while")
//   once     no on/off — a button or hotkey runs its steps one time       (Sell all stocks)
//   group    a switch for several other macros: on turns them all on, off turns them all off.
//            It has no steps or timer of its own; it counts as on while all its members are on,
//            so it stays right however its members get switched.
//
// Built-in macros (the original autoclickers, the stock autobuyer, Sell all…) can't be removed or
// edited, only duplicated. Your own macros are saved in the game save with the rest of the
// settings. Every macro is also a hotkey bindable ('macro.<id>'): repeat/when macros toggle,
// once macros run.

CA.Macros = (() => {
  const MIN_EVERY = 20;
  const MAX_DEPTH = 4; // macros running macros running macros…

  const sprite = (x, y, img) => ({ sprite: [x, y], img });

  const BUILTINS = [
    {
      id: 'bigCookie',
      name: 'Big cookie',
      desc: 'Clicks the big cookie 20 times a second.',
      icon: sprite(11, 0, 'img/perfectCookie.png'),
      mode: 'repeat',
      every: 50,
      steps: [{ action: 'click.bigCookie' }],
      defaultKey: 'KeyC',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'golden',
      name: 'Golden cookies',
      desc: 'Pops golden cookies the moment they appear.',
      icon: sprite(10, 14, 'img/goldCookie.png'),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.golden' }],
      defaultKey: 'KeyG',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'wrath',
      name: 'Wrath cookies',
      desc: 'Pops red wrath cookies too (they can be good or bad).',
      icon: sprite(15, 5, 'img/wrathCookie.png'),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.wrath' }],
      defaultKey: 'KeyW',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'reindeer',
      name: 'Reindeer',
      desc: 'Pops reindeer during the Christmas season.',
      icon: sprite(12, 9, 'img/frostedReindeer.png'),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.reindeer' }],
      defaultKey: 'KeyR',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'fortune',
      name: 'Fortune news',
      desc: 'Clicks fortunes as they scroll through the news ticker.',
      icon: sprite(29, 8),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'click.fortune' }],
      defaultKey: 'KeyF',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'wrinklers',
      name: 'Wrinklers',
      desc: 'Pops wrinklers as soon as they latch onto the cookie.',
      icon: sprite(19, 8),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.wrinklers' }],
      defaultKey: 'KeyK',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'stockTrader',
      name: 'Stock market autobuyer',
      desc: 'Once a second: buys the max it can afford of fast-rising stocks, then slow-rising ones, and sells anything it holds that isn’t rising.',
      icon: sprite(9, 33),
      mode: 'repeat',
      every: 1000,
      steps: [{ action: 'stocks.trade' }],
      defaultKey: '',
      keepOnAscend: true,
      section: 'stocks',
    },
    {
      id: 'sellAll',
      name: 'Sell all stocks',
      desc: 'Turns the autobuyer off (so it doesn’t buy it all straight back), then sells every stock you hold.',
      icon: { ico: 'dollar' },
      mode: 'once',
      steps: [{ action: 'macro.set', params: { macro: 'stockTrader', to: 'off' } }, { action: 'stocks.sellAll' }],
      defaultKey: '',
      section: 'stocks',
    },
    {
      id: 'season',
      name: 'Season keeper',
      desc: 'Keeps the season you pick going: buys its biscuit as soon as you can afford it, and again whenever the season runs out. Needs the Season switcher.',
      icon: sprite(16, 6),
      mode: 'repeat',
      every: 1000,
      steps: [{ action: 'season.keep', params: { season: 'christmas' } }],
      options: [{ step: 0, key: 'season' }],
      defaultKey: '',
      section: 'upkeep',
    },
    {
      id: 'lumps',
      name: 'Sugar lump harvester',
      desc: 'Harvests your sugar lump when it’s ripe (always pays) — or as soon as it’s mature, a little earlier but with the game’s 50% chance of getting nothing.',
      icon: sprite(29, 14),
      mode: 'repeat',
      every: 1000,
      steps: [{ action: 'lump.harvest', params: { when: 'ripe' } }],
      options: [{ step: 0, key: 'when' }],
      defaultKey: '',
      keepOnAscend: true,
      section: 'upkeep',
    },
  ];

  const macros = []; // builtins first, then yours, in order
  const byId = {};
  const running = {}; // id -> { timer, since, condWas, lastFire }
  const status = {}; // id -> { runs, lastRun, steps: [{ total, runs, last, lastAt, error }] }
  let prefs = {}; // id -> { fav }
  let depth = 0;

  // ---- definitions --------------------------------------------------------------------

  function clean(def) {
    const mode = ['repeat', 'when', 'once', 'group'].includes(def.mode) ? def.mode : 'repeat';
    const m = {
      id: String(def.id),
      name: String(def.name || 'Macro').slice(0, 60),
      desc: String(def.desc || '').slice(0, 300),
      icon: def.icon && typeof def.icon === 'object' ? def.icon : { ico: 'bolt' },
      mode,
      every: Math.max(MIN_EVERY, Math.round(Number(def.every) || (mode === 'when' ? 250 : 1000))),
      steps: (Array.isArray(def.steps) ? def.steps : [])
        .filter((s) => s && typeof s.action === 'string')
        .map((s) => ({ action: s.action, params: s.params && typeof s.params === 'object' ? { ...s.params } : {} })),
      inAll: !!def.inAll,
      builtin: !!def.builtin,
    };
    if (mode === 'group') {
      m.steps = [];
      m.members = (Array.isArray(def.members) ? def.members : []).map(String).filter((id) => id !== m.id);
    }
    if (mode === 'when') {
      // { all: [{ cond, params, not }, …], edge } — v2.0 saved a single condition at the top level
      const w = def.when || {};
      const list = (Array.isArray(w.all) ? w.all : [w]).filter((c) => c && c.cond);
      m.when = {
        all: (list.length ? list : [{ cond: 'buff' }]).map((c) => ({
          cond: String(c.cond),
          params: c.params && typeof c.params === 'object' ? { ...c.params } : {},
          not: !!c.not,
        })),
        edge: w.edge === 'while' ? 'while' : 'rise',
      };
    }
    ['defaultKey', 'keepOnAscend', 'section', 'spell'].forEach((k) => def[k] !== undefined && (m[k] = def[k]));
    // built-ins can let you choose some of their steps' params right on their row (saved in prefs)
    if (m.builtin && Array.isArray(def.options)) m.options = def.options.filter((o) => m.steps[o.step]);
    return m;
  }

  function add(def) {
    const m = clean(def);
    if (byId[m.id]) {
      macros[macros.indexOf(byId[m.id])] = m;
    } else macros.push(m);
    byId[m.id] = m;
    status[m.id] = status[m.id] || freshStatus(m);
    if (status[m.id].steps.length !== m.steps.length) status[m.id] = freshStatus(m);
    CA.Hotkeys.register({
      id: `macro.${m.id}`,
      name: m.name,
      group: 'macros',
      defaultKey: m.defaultKey || '',
      run: () => trigger(m.id),
    });
    return m;
  }

  const freshStatus = (m) => ({ runs: 0, lastRun: 0, steps: m.steps.map(() => ({ total: 0, runs: 0, last: 0, lastAt: 0, error: '' })) });

  const newId = () => `m${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

  /** For features that bring their own built-in macros (e.g. features/grimoire.js). Call during init. */
  const addBuiltin = (def) => add({ ...def, builtin: true });

  /** Creates or updates one of your macros; returns it. Built-ins can't be changed. */
  function save(def) {
    if (def.id && byId[def.id] && byId[def.id].builtin) throw new Error('Built-in macros can’t be edited — duplicate it instead.');
    const wasOn = def.id && isOn(def.id);
    if (wasOn) stop(def.id);
    const m = add({ ...def, id: def.id || newId(), builtin: false });
    if (wasOn && m.mode !== 'once') start(m.id);
    changed(m.id);
    return m;
  }

  function remove(id) {
    const m = byId[id];
    if (!m || m.builtin) return false;
    stop(id);
    macros.splice(macros.indexOf(m), 1);
    delete byId[id];
    delete status[id];
    delete prefs[id];
    CA.Hotkeys.unregister(`macro.${id}`);
    changed(id);
    return true;
  }

  function duplicate(id) {
    const m = byId[id];
    if (!m) return null;
    const copy = JSON.parse(JSON.stringify({ ...m, steps: stepsOf(m) }));
    delete copy.options;
    delete copy.defaultKey;
    delete copy.section;
    delete copy.keepOnAscend;
    return save({ ...copy, id: null, builtin: false, name: `${m.name} (copy)`.slice(0, 60) });
  }

  // ---- running ----------------------------------------------------------------------------

  const ascending = () => Game.OnAscend || Game.AscendTimer > 0;

  function runSteps(m) {
    if (ascending() || depth >= MAX_DEPTH) return 0;
    const st = status[m.id];
    let done = 0;
    depth++;
    try {
      stepsOf(m).forEach((step, i) => {
        const s = st.steps[i];
        try {
          const n = CA.Actions.run(step.action, step.params);
          s.runs++;
          s.last = n;
          if (n > 0) {
            s.total += n;
            s.lastAt = Date.now();
          }
          s.error = '';
          done += n;
        } catch (e) {
          s.error = String((e && e.message) || e);
          console.error(`[CookieMgr] macro "${m.name}" step ${i + 1} failed`, e);
        }
      });
    } finally {
      depth--;
    }
    st.runs++;
    st.lastRun = Date.now();
    return done;
  }

  function tick(m) {
    const r = running[m.id];
    if (!r) return;
    if (m.mode === 'repeat') {
      runSteps(m);
      return;
    }
    // when
    const now = CA.Conditions.test(m.when);
    const fire = now && (m.when.edge === 'while' || !r.condWas);
    r.condWas = now;
    if (fire) {
      r.lastFire = Date.now();
      runSteps(m);
    }
  }

  function start(id) {
    const m = byId[id];
    if (!m || m.mode === 'once' || running[id]) return;
    running[id] = { since: Date.now(), condWas: false, lastFire: 0, timer: setInterval(() => tick(m), m.every) };
  }

  function stop(id) {
    const r = running[id];
    if (!r) return;
    clearInterval(r.timer);
    delete running[id];
  }

  function announce(m, on) {
    if (!CA.Settings.get('notifications')) return;
    const icon = m.icon && m.icon.sprite ? m.icon.sprite : CA.ICON;
    CA.Util.notify(m.name, on ? '<b style="color:#8f8">ON</b>' : '<b style="color:#f88">OFF</b>', icon, 2);
  }

  function changed(id) {
    CA.Events.emit('macros', id);
  }

  /** A group's members that exist and can be switched (no once macros, no other groups). */
  const membersOf = (m) => (m && m.mode === 'group' ? m.members.map((id) => byId[id]).filter((x) => x && x.mode !== 'once' && x.mode !== 'group') : []);

  /** Turns a repeat/when macro — or every member of a group — on or off. */
  function set(id, on, { silent = false } = {}) {
    const m = byId[id];
    if (!m || m.mode === 'once') return;
    on = !!on;
    if (m.mode === 'group') {
      const members = membersOf(m);
      if (!members.length || (isOn(id) === on && members.every((x) => isOn(x.id) === on))) return;
      members.forEach((x) => set(x.id, on, { silent: true }));
      if (!silent) announce(m, on);
      changed(id);
      return;
    }
    if (isOn(id) === on) return;
    if (on) start(id);
    else stop(id);
    if (!silent) announce(m, on);
    changed(id);
  }

  const toggle = (id) => set(id, !isOn(id));

  /** Runs a macro's steps one time right now (any mode). Returns how many things it did. */
  function runOnce(id) {
    const m = byId[id];
    if (!m) return 0;
    const n = runSteps(m);
    changed(id);
    return n;
  }

  /** What a hotkey or shortcut button does: once macros run, the others switch on/off. */
  function trigger(id) {
    const m = byId[id];
    if (!m) return;
    if (m.mode === 'once') runOnce(id);
    else toggle(id);
  }

  // ---- "All autoclickers" -------------------------------------------------------------------

  const inAll = () => macros.filter((m) => m.inAll && m.mode !== 'once');
  const allOn = () => inAll().every((m) => isOn(m.id));
  function setAll(on, { silent = false } = {}) {
    inAll().forEach((m) => set(m.id, on, { silent: true }));
    if (!silent && CA.Settings.get('notifications')) CA.Util.notify('All autoclickers', on ? '<b style="color:#8f8">ON</b>' : '<b style="color:#f88">OFF</b>', CA.ICON, 2);
  }
  /** Same as v0.1: if anything is off, turn everything on; otherwise turn all off. */
  const toggleAll = () => setAll(!allOn());

  // ---- queries --------------------------------------------------------------------------------

  function isOn(id) {
    const m = byId[id];
    if (m && m.mode === 'group') {
      const members = membersOf(m);
      return members.length > 0 && members.every((x) => !!running[x.id]);
    }
    return !!running[id];
  }
  const list = () => macros.slice();
  const get = (id) => byId[id] || null;
  const activeCount = () => Object.keys(running).length;
  const runningIds = () => Object.keys(running);
  const statusOf = (id) => status[id] || null;
  const since = (id) => (running[id] ? running[id].since : 0);
  /** A macro's steps with the choices you made on a built-in's row applied. */
  function stepsOf(m) {
    const chosen = (prefs[m.id] && prefs[m.id].params) || {};
    if (!m.options || !m.options.length) return m.steps;
    return m.steps.map((s, i) => {
      const own = {};
      m.options.forEach((o) => o.step === i && chosen[`${i}.${o.key}`] !== undefined && (own[o.key] = chosen[`${i}.${o.key}`]));
      return Object.keys(own).length ? { ...s, params: { ...s.params, ...own } } : s;
    });
  }
  /** Sets one of a built-in's row choices (one of its `options`). */
  function setParam(id, step, key, value) {
    const m = byId[id];
    if (!m || !(m.options || []).some((o) => o.step === step && o.key === key)) return;
    const p = { ...(prefs[id] || {}) };
    p.params = { ...(p.params || {}), [`${step}.${key}`]: value };
    prefs[id] = p;
    changed(id);
  }
  const isFav = (id) => !!(prefs[id] && prefs[id].fav);
  function setFav(id, on) {
    if (!byId[id]) return;
    prefs[id] = { ...(prefs[id] || {}), fav: !!on };
    changed(id);
  }

  /** Human summary of when a macro runs: "every 0.1s", "when Click frenzy is active", "on demand". */
  function triggerText(m) {
    const secs = (ms) => (ms < 1000 ? `${ms / 1000}s` : `${Math.round(ms / 100) / 10}s`);
    if (m.mode === 'once') return 'on demand';
    if (m.mode === 'group') return `group of ${membersOf(m).length}`;
    if (m.mode === 'repeat') return `every ${secs(m.every)}`;
    return `${m.when.edge === 'while' ? 'while' : 'when'} ${CA.Conditions.describe(m.when)}`;
  }

  // ---- save / load ---------------------------------------------------------------------------

  function serialize() {
    return {
      custom: macros.filter((m) => !m.builtin).map(({ builtin, ...rest }) => rest),
      prefs: { ...prefs },
    };
  }

  /** Loads your macros and preferences from a save (replacing the ones defined now). */
  function load(data) {
    if (!data || typeof data !== 'object') return;
    macros.filter((m) => !m.builtin).forEach((m) => remove(m.id));
    (Array.isArray(data.custom) ? data.custom : []).forEach((d) => {
      if (d && d.id && !(byId[d.id] && byId[d.id].builtin)) add({ ...d, builtin: false });
    });
    prefs = data.prefs && typeof data.prefs === 'object' ? { ...data.prefs } : {};
    changed(null);
  }

  /** Groups that `id` is a member of (so the UI can refresh them too). */
  const groupsWith = (id) => macros.filter((m) => m.mode === 'group' && m.members.includes(id));

  /** Turns on the macros that were running when the game was saved (rememberStates). */
  function restore(ids) {
    (ids || []).forEach((id) => set(id, true, { silent: true }));
  }

  function init() {
    BUILTINS.forEach((d) => add({ ...d, builtin: true }));
    CA.Hotkeys.register({ id: 'clickers.toggleAll', name: 'All autoclickers', group: 'macros', defaultKey: 'KeyA', run: toggleAll });

    CA.Settings.defineOption({
      key: 'disableOnAscend',
      icon: 'ascend',
      group: 'macros',
      name: 'Turn off when ascending',
      desc: 'Switches every running macro off as soon as you ascend (the stock autobuyer keeps going).',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'rememberStates',
      icon: 'save',
      group: 'macros',
      name: 'Remember on/off states',
      desc: 'Restores which macros were running when you reload the game.',
      default: false,
    });
    CA.Settings.defineOption({
      key: 'notifications',
      icon: 'bell',
      group: 'macros',
      name: 'On/off notifications',
      desc: 'Shows a small ON/OFF popup whenever a macro is switched.',
      default: true,
    });

    CA.Events.on('ascend', () => {
      if (!CA.Settings.get('disableOnAscend')) return;
      const stopping = runningIds().filter((id) => !byId[id].keepOnAscend);
      if (!stopping.length) return;
      stopping.forEach((id) => set(id, false, { silent: true }));
      CA.Util.notify('CookieMgr', 'Your macros were turned off for your ascension.', [20, 7], 4);
    });
  }

  return {
    init,
    list,
    get,
    addBuiltin,
    save,
    remove,
    duplicate,
    set,
    toggle,
    trigger,
    runOnce,
    isOn,
    since,
    setAll,
    toggleAll,
    allOn,
    inAll,
    activeCount,
    runningIds,
    status: statusOf,
    membersOf,
    groupsWith,
    isFav,
    setFav,
    stepsOf,
    setParam,
    triggerText,
    serialize,
    load,
    restore,
    MIN_EVERY,
  };
})();

// ---- src/features/grimoire.js ----------------------------------------
// The Wizard tower's Grimoire minigame: spells as actions and macros.
//
//   action      spell.cast {spell}             casts one spell (if there's enough magic)
//   conditions  spellAffordable {spell}        there's enough magic for that spell right now
//               magicPct {op, value}           magic as a % of the maximum
//   macros      one built-in "Cast …" macro per spell (buttons, hotkeys, shortcut widgets), and the
//               hardcoded, non-removable "Force the Hand of Fate on Click frenzy"
//   events      'spell' — every cast (yours, a macro's, or the Grimoire's own buttons), and whether
//               it backfired
//
// Game facts (minigameGrimoire.js): spells live in M.spells keyed by lowercase name and in
// M.spellsById; M.castSpell(spell) returns true when the spell went off (win or backfire) and
// false when there wasn't enough magic; M.getSpellCost(spell) and M.getFailChance(spell) give
// the live cost and backfire chance; magic refills by M.magicPS per logic frame (30 fps), which
// is max(0.002, (magic / max(magicM, 100))^0.5) × 0.002.

CA.Grimoire = (() => {
  const POLL_MS = 1000;
  const FPS = 30;

  // Every spell, in the Grimoire's own order (keys/names/icons verified against minigameGrimoire.js).
  const SPELLS = [
    { key: 'conjure baked goods', id: 'castConjure', name: 'Conjure Baked Goods', icon: [21, 11] },
    { key: 'hand of fate', id: 'castFthof', name: 'Force the Hand of Fate', icon: [22, 11] },
    { key: 'stretch time', id: 'castStretch', name: 'Stretch Time', icon: [23, 11] },
    { key: 'spontaneous edifice', id: 'castEdifice', name: 'Spontaneous Edifice', icon: [24, 11] },
    { key: "haggler's charm", id: 'castHaggler', name: "Haggler's Charm", icon: [25, 11] },
    { key: 'summon crafty pixies', id: 'castPixies', name: 'Summon Crafty Pixies', icon: [26, 11] },
    { key: "gambler's fever dream", id: 'castGfd', name: "Gambler's Fever Dream", icon: [27, 11] },
    { key: 'resurrect abomination', id: 'castResurrect', name: 'Resurrect Abomination', icon: [28, 11] },
    { key: 'diminish ineptitude', id: 'castDiminish', name: 'Diminish Ineptitude', icon: [29, 11] },
  ];
  const byKey = {};
  SPELLS.forEach((s) => (byKey[s.key] = s));
  const AUTO_ID = 'fthofOnClickFrenzy';

  function minigame() {
    const tower = typeof Game !== 'undefined' && Game.Objects && Game.Objects['Wizard tower'];
    const m = tower && tower.minigame;
    return m && m.spells && typeof m.castSpell === 'function' ? m : null;
  }

  const spellOf = (key) => {
    const m = minigame();
    return m ? m.spells[key] || null : null;
  };
  const nameOf = (key) => (byKey[key] ? byKey[key].name : key);
  const costOf = (key) => {
    const m = minigame();
    const sp = spellOf(key);
    return m && sp ? m.getSpellCost(sp) : Infinity;
  };
  const failOf = (key) => {
    const m = minigame();
    const sp = spellOf(key);
    return m && sp && typeof m.getFailChance === 'function' ? m.getFailChance(sp) : null;
  };

  /** Seconds until magic reaches `target`, following the game's own refill formula. */
  function secondsUntil(target) {
    const m = minigame();
    if (!m) return Infinity;
    let magic = m.magic;
    const max = m.magicM;
    if (magic >= target) return 0;
    if (target > max) return Infinity;
    let s = 0;
    while (magic < target && s < 86400) {
      for (let f = 0; f < FPS && magic < target; f++) magic += Math.max(0.002, Math.pow(magic / Math.max(max, 100), 0.5)) * 0.002;
      s++;
    }
    return magic >= target ? s : Infinity;
  }

  /** Live info about every spell for the Wizard tower page. */
  function spells() {
    const m = minigame();
    return SPELLS.map((s) => {
      const cost = costOf(s.key);
      return { ...s, cost, fail: failOf(s.key), affordable: !!m && m.magic >= cost, wait: m ? secondsUntil(cost) : Infinity, macro: s.id };
    });
  }

  function magicNow() {
    const m = minigame();
    if (!m) return null;
    const perSec = Math.max(0.002, Math.pow(m.magic / Math.max(m.magicM, 100), 0.5)) * 0.002 * FPS;
    return { magic: m.magic, max: m.magicM, perSec: m.magic < m.magicM ? perSec : 0, fullIn: secondsUntil(m.magicM), cast: m.spellsCast || 0, castTotal: m.spellsCastTotal || 0 };
  }

  // ---- logging every cast ----------------------------------------------------------------

  let backfired = false;

  function watch() {
    const m = minigame();
    if (!m || m.__cmWatched) return;
    m.__cmWatched = true;
    Object.keys(m.spells).forEach((key) => {
      const sp = m.spells[key];
      if (typeof sp.fail !== 'function') return;
      const fail = sp.fail;
      sp.fail = function () {
        backfired = true;
        return fail.apply(this, arguments);
      };
    });
    const cast = m.castSpell;
    m.castSpell = function (spell, obj) {
      backfired = false;
      const cookies = Game.cookies;
      const ok = cast.apply(this, arguments);
      try {
        if (ok && spell && !(obj && obj.passthrough)) {
          const key = Object.keys(m.spells).find((k) => m.spells[k] === spell);
          const name = nameOf(key) || spell.name;
          CA.EventLog.add({
            type: 'spell',
            title: backfired ? `${name} backfired` : `Cast ${name}`,
            text: backfired ? 'Backfire!' : '',
            cookies: Game.cookies - cookies,
            data: { spell: key, backfired },
          });
        }
      } catch (e) {
        /* never break the game over a log entry */
      }
      return ok;
    };
  }

  // ---- actions, conditions, macros ------------------------------------------------------------

  const spellOptions = () => SPELLS.map((s) => ({ v: s.key, label: s.name }));

  function register() {
    CA.Actions.register({
      id: 'spell.cast',
      name: 'Cast a spell',
      icon: 'wizard',
      group: 'Wizard tower',
      unit: 'cast',
      params: [{ key: 'spell', label: 'Spell', type: 'select', default: 'hand of fate', options: spellOptions }],
      describe: (p) => `Cast ${nameOf(p.spell)}`,
      available: () => !!minigame(),
      run: (p) => {
        const m = minigame();
        const sp = spellOf(p.spell);
        if (!m || !sp || m.magic < m.getSpellCost(sp)) return 0;
        return m.castSpell(sp) ? 1 : 0;
      },
    });
    CA.Conditions.register({
      id: 'spellAffordable',
      name: 'Enough magic for a spell',
      icon: 'wizard',
      params: [{ key: 'spell', label: 'Spell', type: 'select', default: 'hand of fate', options: spellOptions }],
      describe: (p) => `there's magic for ${nameOf(p.spell)}`,
      test: (p) => {
        const m = minigame();
        return !!m && m.magic >= costOf(p.spell);
      },
    });
    CA.Conditions.register({
      id: 'magicPct',
      name: 'Magic is at a % of the maximum',
      icon: 'wizard',
      params: [
        {
          key: 'op',
          label: 'Is',
          type: 'select',
          default: '>=',
          options: () => [
            { v: '>=', label: '≥' },
            { v: '<=', label: '≤' },
          ],
        },
        { key: 'value', label: '% of max', type: 'number', default: 100, min: 0 },
      ],
      describe: (p) => `magic ${p.op === '<=' ? '≤' : '≥'} ${p.value}%`,
      test: (p) => {
        const m = minigame();
        if (!m || !m.magicM) return false;
        const pct = (m.magic / m.magicM) * 100;
        return p.op === '<=' ? pct <= p.value : pct >= p.value - 1e-9;
      },
    });

    SPELLS.forEach((s) =>
      CA.Macros.addBuiltin({
        id: s.id,
        name: `Cast ${s.name}`,
        desc: '',
        icon: { sprite: s.icon },
        mode: 'once',
        steps: [{ action: 'spell.cast', params: { spell: s.key } }],
        defaultKey: '',
        section: 'grimoire',
        spell: s.key,
      })
    );
    CA.Macros.addBuiltin({
      id: AUTO_ID,
      name: 'Force the Hand of Fate on Click frenzy',
      desc: 'While on: as soon as a Click frenzy is running and there’s enough magic, casts Force the Hand of Fate — its golden cookie can stack another effect on top. Pair it with the Golden cookies macro to pop it.',
      icon: { sprite: [22, 11] },
      mode: 'when',
      every: 250,
      when: {
        all: [
          { cond: 'buff', params: { name: 'Click frenzy' } },
          { cond: 'spellAffordable', params: { spell: 'hand of fate' } },
        ],
        edge: 'rise',
      },
      steps: [{ action: 'spell.cast', params: { spell: 'hand of fate' } }],
      defaultKey: '',
      section: 'grimoire',
    });
  }

  function init() {
    CA.EventLog.defineType('spell', { name: 'Spell', icon: 'wizard', color: '#b388ff' });
    register();
    setInterval(watch, POLL_MS);
    watch();
  }

  return { init, minigame, spells, magicNow, secondsUntil, SPELLS, AUTO_ID };
})();

// ---- src/features/garden.js ------------------------------------------
// The **auto-gardener**: keeps the Garden (Farm minigame) matching a saved layout.
//
// A **profile** is a snapshot of a garden: which seed is on every tile (or nothing) and the soil.
// While the "Auto-gardener" macro is on, once a second it tends the garden towards the active one:
//
//   - in the last `lead` seconds before a garden tick (15 by default):
//       · harvests plants that aren't the profile's seed for their tile (weeds, mutations, leftovers)
//       · harvests the profile's own mature plants when the chance that they die of old age on the
//         coming tick is above your threshold (50% by default; 100% = let them die)
//       · plants the profile's seed on every empty tile, when you can afford it
//       · switches the soil to the profile's, when the game lets you (10-minute cooldown)
//   - any time: harvests a plant whose seed you haven't unlocked yet as soon as it's mature, which
//     unlocks it (if "Unlock new seeds" is on; off, a new seed is a mismatch like any other)
//
// Why harvest before a plant dies? A harvest of a mature plant unlocks its seed if it's new, counts
// towards the harvest achievements, and some plants pay out on harvest (Bakeberry, Chocoroot, Queenbeet…);
// a plant that dies of old age just disappears (except on Pebbles, which has a 35% chance to unlock
// its seed). The game's own formulas (minigameGarden.js M.logic) give the death chance exactly:
// each tick a plant ages by randomFloor((ageTick + ageTickR·random) × tile boost × dragon boost)
// and dies at 100.

CA.Garden = (() => {
  const SIZE = 6;
  let profiles = []; // { id, name, soil, plot: [[key|null × 6] × 6] }
  const S = () => CA.Settings;

  function minigame() {
    const farm = Game.Objects && Game.Objects.Farm;
    const M = farm && farm.minigame;
    return M && M.plot && M.plantsById ? M : null;
  }

  const unlockedTile = (M, x, y) => (typeof M.isTileUnlocked === 'function' ? M.isTileUnlocked(x, y) : true);
  const plantAt = (M, x, y) => {
    const t = M.plot[y] && M.plot[y][x];
    return t && t[0] > 0 ? M.plantsById[t[0] - 1] || null : null;
  };
  /** Seconds until the next garden tick. */
  const nextTickIn = (M) => (M.nextStep ? Math.max(0, (M.nextStep - Date.now()) / 1000) : Infinity);

  // ---- the chance a plant dies on the next tick -------------------------------------------------

  /**
   * P(the plant on (x, y) reaches age 100 on the next tick). Its growth that tick is
   * randomFloor(v) with v uniform on [a, b] = boost × [ageTick, ageTick + ageTickR]; randomFloor(v)
   * is ⌈v⌉ with probability frac(v), else ⌊v⌋. So with n = 100 − age it dies with probability
   * 1 when v ≥ n, v − (n − 1) when n − 1 < v < n, and 0 below — averaged over v.
   */
  function decayChance(M, x, y) {
    const me = plantAt(M, x, y);
    if (!me || me.immortal) return 0;
    const n = 100 - M.plot[y][x][1];
    if (n <= 0) return 1;
    const tileBoost = M.plotBoost && M.plotBoost[y] && M.plotBoost[y][x] ? M.plotBoost[y][x][0] : 1;
    const dragon = 1 + 0.05 * (typeof Game.auraMult === 'function' ? Game.auraMult('Supreme Intellect') : 0);
    const k = tileBoost * dragon;
    const a = k * me.ageTick;
    const b = k * (me.ageTick + (me.ageTickR || 0));
    const p = (v) => (v >= n ? 1 : v > n - 1 ? v - (n - 1) : 0);
    if (b - a < 1e-9) return p(a);
    // antiderivative of p
    const F = (v) => (v <= n - 1 ? 0 : v < n ? (v - n + 1) ** 2 / 2 : 0.5 + (v - n));
    return Math.max(0, Math.min(1, (F(b) - F(a)) / (b - a)));
  }

  // ---- profiles ------------------------------------------------------------------------------

  const newId = () => `g${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  const active = () => profiles.find((p) => p.id === S().get('gardenProfile')) || null;

  /** Saves the current garden (seeds on every tile + the soil) as a new profile. */
  function snapshot(name) {
    const M = minigame();
    if (!M) return null;
    const plot = [];
    for (let y = 0; y < SIZE; y++) {
      plot.push([]);
      for (let x = 0; x < SIZE; x++) {
        const me = unlockedTile(M, x, y) ? plantAt(M, x, y) : null;
        plot[y].push(me ? me.key : null);
      }
    }
    const soil = M.soilsById && M.soilsById[M.soil] ? M.soilsById[M.soil].key : 'dirt';
    const p = { id: newId(), name: String(name || `Garden ${profiles.length + 1}`).slice(0, 40), soil, plot };
    profiles.push(p);
    if (!active()) S().set('gardenProfile', p.id);
    changed();
    return p;
  }

  function removeProfile(id) {
    const i = profiles.findIndex((p) => p.id === id);
    if (i < 0) return;
    profiles.splice(i, 1);
    if (S().get('gardenProfile') === id) S().set('gardenProfile', profiles[0] ? profiles[0].id : '');
    changed();
  }

  function rename(id, name) {
    const p = profiles.find((x) => x.id === id);
    if (!p || !String(name).trim()) return;
    p.name = String(name).trim().slice(0, 40);
    changed();
  }

  const use = (id) => S().set('gardenProfile', profiles.some((p) => p.id === id) ? id : '');
  const changed = () => CA.Events.emit('garden');

  // ---- tending ------------------------------------------------------------------------------

  function plant(M, me, x, y) {
    if (!me.unlocked || (typeof M.canPlant === 'function' && !M.canPlant(me))) return false;
    // as M.useTool does, minus the mouse sparkle and sound
    M.plot[y][x] = [me.id + 1, 0];
    M.toRebuild = true;
    Game.Spend(typeof M.getCost === 'function' ? M.getCost(me) : 0);
    return true;
  }

  function setSoil(M, key) {
    const soil = M.soils && M.soils[key];
    if (!soil || M.soil === soil.id || M.freeze || M.nextSoil > Date.now() || M.parent.amount < soil.req) return false;
    // through the game's own button when it's there (it updates its highlight), else as it does
    const btn = document.getElementById(`gardenSoil-${soil.id}`);
    if (btn) btn.click();
    if (M.soil !== soil.id) {
      M.nextSoil = Date.now() + (Game.Has('Turbo-charged soil') ? 1 : 1000 * 60 * 10);
      M.toCompute = true;
      M.soil = soil.id;
      if (typeof M.computeStepT === 'function') M.computeStepT();
    }
    return true;
  }

  /**
   * One pass of the auto-gardener over the active profile. Returns how many things it did and
   * logs them by kind in `last` (for the page).
   */
  let last = { at: 0, harvested: 0, planted: 0, saved: 0, unlocked: 0, soil: false };
  function tend() {
    const M = minigame();
    const p = active();
    if (!M || !p || M.freeze) return 0;
    const lead = Math.max(1, Number(S().get('gardenLead')) || 15);
    const threshold = Math.max(0, Math.min(100, Number(S().get('gardenThreshold')))) / 100;
    const inWindow = nextTickIn(M) <= lead;
    const unlockNew = !!S().get('gardenUnlockNew');
    const did = { harvested: 0, planted: 0, saved: 0, unlocked: 0, soil: false };
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!unlockedTile(M, x, y)) continue;
        const want = (p.plot[y] && p.plot[y][x]) || null;
        const me = plantAt(M, x, y);
        if (me) {
          const mature = M.plot[y][x][1] >= me.mature;
          if (!me.unlocked && unlockNew) {
            // a new seed: let it grow, harvest it the moment it can unlock
            if (mature && M.harvest(x, y)) did.unlocked++;
            continue;
          }
          if (me.key !== want) {
            if (inWindow && M.harvest(x, y)) did.harvested++;
            else continue;
          } else if (mature && threshold < 1 && inWindow && decayChance(M, x, y) > threshold) {
            if (M.harvest(x, y)) did.saved++;
          } else continue;
        }
        if (inWindow && want && M.plants[want] && !plantAt(M, x, y) && plant(M, M.plants[want], x, y)) did.planted++;
      }
    }
    if (inWindow && p.soil) did.soil = setSoil(M, p.soil);
    const n = did.harvested + did.planted + did.saved + did.unlocked + (did.soil ? 1 : 0);
    if (n) last = { at: Date.now(), ...did };
    return n;
  }

  /** What the current garden looks like against the active profile, tile by tile (for the page). */
  function view() {
    const M = minigame();
    if (!M) return null;
    const p = active();
    const tiles = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const open = unlockedTile(M, x, y);
        const me = open ? plantAt(M, x, y) : null;
        const want = p && p.plot[y] ? p.plot[y][x] : null;
        tiles.push({
          x,
          y,
          open,
          plant: me,
          age: me ? M.plot[y][x][1] : 0,
          want: want && M.plants[want] ? M.plants[want] : null,
          match: !p || (me ? me.key : null) === want,
          decay: me ? decayChance(M, x, y) : 0,
        });
      }
    }
    return { M, profile: p, tiles, next: nextTickIn(M), step: M.stepT || 0, soil: M.soilsById && M.soilsById[M.soil] };
  }

  // ---- save / load ---------------------------------------------------------------------------

  const serialize = () => profiles.map((p) => ({ id: p.id, name: p.name, soil: p.soil, plot: p.plot.map((r) => r.slice()) }));
  function load(data) {
    profiles = (Array.isArray(data) ? data : [])
      .filter((p) => p && p.id && Array.isArray(p.plot))
      .map((p) => ({
        id: String(p.id),
        name: String(p.name || 'Garden').slice(0, 40),
        soil: typeof p.soil === 'string' ? p.soil : 'dirt',
        plot: Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => (p.plot[y] && typeof p.plot[y][x] === 'string' ? p.plot[y][x] : null))),
      }));
    changed();
  }

  const GARDENER = 'gardener';

  function init() {
    S().defineOption({ key: 'gardenProfile', group: 'garden-hidden', name: 'Active garden profile', desc: '', default: '' });
    S().defineOption({ key: 'gardenThreshold', group: 'garden-hidden', name: 'Harvest before dying at', desc: '', default: 50 });
    S().defineOption({ key: 'gardenLead', group: 'garden-hidden', name: 'Seconds before the tick', desc: '', default: 15 });
    S().defineOption({
      key: 'gardenUnlockNew',
      group: 'garden',
      icon: 'leaf',
      name: 'Unlock new seeds',
      desc: 'Lets a seed you haven’t unlocked yet grow wherever it appears, and harvests it the moment it’s mature (which unlocks it) — instead of pulling it out as a mismatch.',
      default: true,
    });
    CA.Actions.register({
      id: 'garden.tend',
      name: 'Tend the garden (active profile)',
      icon: 'leaf',
      group: 'Garden',
      unit: 'done',
      available: () => !!minigame() && !!active(),
      run: () => tend(),
    });
    CA.Macros.addBuiltin({
      id: GARDENER,
      name: 'Auto-gardener',
      desc: 'Keeps your garden like the active profile on the Garden page: replants, pulls out what doesn’t belong, saves plants about to die and unlocks new seeds.',
      icon: { sprite: [0, 0], img: 'img/gardenPlants.png' },
      mode: 'repeat',
      every: 1000,
      steps: [{ action: 'garden.tend' }],
      defaultKey: '',
      keepOnAscend: false,
      section: 'garden',
    });
  }

  return { init, minigame, decayChance, snapshot, removeProfile, rename, use, active, profiles: () => profiles.slice(), tend, view, last: () => last, serialize, load, GARDENER, nextTickIn };
})();

// ---- src/features/stocks.js ------------------------------------------
// Stock market helper: shows every stock's trend right on its box in the Bank minigame,
// so you can trade at a glance instead of hovering for the tooltip.
//
//   - a coloured strip with a symbol + label (Stable, Slow rise, Fast rise, ...)
//   - the whole box is tinted in the trend's colour, and glows brighter while you own the stock
//
// The game keeps each stock's trend in `good.mode`:
//   0 stable · 1 slow rise · 2 slow fall · 3 fast rise · 4 fast fall · 5 chaotic

CA.Stocks = (() => {
  const TICK_MS = 250;

  // Colours are paired with distinct symbols so the trend never depends on colour alone.
  const MODES = [
    { key: 'stable', label: 'Stable', sym: '▬', color: '#7fa6c9', hint: 'Barely moves.' },
    { key: 'rise', label: 'Slow rise', sym: '▲', color: '#a6e35a', hint: 'Drifting up.' },
    { key: 'fall', label: 'Slow fall', sym: '▼', color: '#ffa640', hint: 'Drifting down.' },
    { key: 'surge', label: 'Fast rise', sym: '▲▲', color: '#2fe07a', hint: 'Climbing quickly, but can turn into a fast fall.' },
    { key: 'crash', label: 'Fast fall', sym: '▼▼', color: '#ff4d4d', hint: 'Dropping quickly.' },
    { key: 'chaos', label: 'Chaotic', sym: '↯', color: '#c77dff', hint: 'Swings wildly in both directions.' },
  ];

  const CSS = `
.bankGood.cm-stock { background-image: linear-gradient(var(--cm-tint), var(--cm-tint)); transition: box-shadow .25s, background-image .25s; }
.bankGood.cm-stock.cm-owned { background-image: linear-gradient(var(--cm-tint-strong), var(--cm-tint-strong)); }
.bankGood.cm-stock {
  --cm-tint: color-mix(in srgb, var(--cm-c) 15%, transparent);
  --cm-tint-strong: color-mix(in srgb, var(--cm-c) 40%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--cm-c) 40%, transparent), 2px 2px 4px rgba(0,0,0,.5) inset;
}
.bankGood.cm-stock.cm-owned {
  box-shadow: 0 0 0 2px var(--cm-c), 0 0 10px 1px color-mix(in srgb, var(--cm-c) 70%, transparent), 2px 2px 4px rgba(0,0,0,.5) inset;
}
.bankGood.cm-stock.cm-notint, .bankGood.cm-stock.cm-notint.cm-owned { background-image: none; }
.cm-stockbadge {
  display: block; box-sizing: border-box; width: 100%; padding: 2px 20px 2px 22px; position: relative; margin: 0 0 1px;
  font: bold 10px/14px Tahoma, Arial, sans-serif; letter-spacing: .04em; text-transform: uppercase; text-align: center;
  color: #10141a; background: var(--cm-c); text-shadow: none; white-space: nowrap; overflow: hidden;
}
.cm-stockbadge b { font-size: 11px; margin-right: 4px; letter-spacing: 0; }
.bankGood.cm-owned .cm-stockbadge { box-shadow: 0 0 6px var(--cm-c); }
.bankGood.cm-owned .cm-stockbadge::before { content: '\\2605'; color: #fff; margin-right: 4px; text-shadow: 0 0 3px #000; }
`;


  const minigame = () => {
    const bank = typeof Game !== 'undefined' && Game.Objects && Game.Objects.Bank;
    const m = bank && bank.minigame;
    return m && m.goodsById ? m : null;
  };

  // ---- portfolio (cost basis + realized/unrealized gain) ---------------------------
  // The game only shows you the current price and share count, not what you paid for
  // them, so we watch `good.stock` ourselves: any increase is a buy at the current price
  // (rolled into a running average cost), any decrease is a sell that realizes the gap
  // between that average cost and the current price. There is no way to know what happened
  // before the mod was first loaded. Holdings are stored per save in IndexedDB.
  //
  // Prices and portfolio totals are recorded over time as states (price:<id>, portfolioValue,
  // portfolioCost, portfolioRealized) by core/recorder.js — this module keeps no history.

  const SAMPLE_MS = 1000;
  const PERSIST_MS = 10000;
  const LEGACY_KEY = 'CookieMgr.stocks.v1';

  const priceOf = (good) => (typeof good.val === 'number' ? good.val : 0);

  let holdings = {}; // good.id -> { shares, avgCost, realized }
  let holdingsFor = null; // save the loaded holdings belong to
  let dirty = false;

  function holdingOf(id) {
    return holdings[id] || (holdings[id] = { shares: 0, avgCost: 0, realized: 0 });
  }

  function updateHolding(good) {
    const h = holdingOf(good.id);
    const shares = good.stock || 0;
    const price = priceOf(good);
    const delta = shares - h.shares;
    if (delta > 0) {
      h.avgCost = (h.avgCost * h.shares + delta * price) / shares;
    } else if (delta < 0) {
      h.realized += -delta * (price - h.avgCost);
    }
    if (delta) dirty = true;
    h.shares = shares;
    return h;
  }

  /** One recorded state per stock price, defined the first time the Bank minigame is seen. */
  function ensurePriceStates(m) {
    m.goodsById.forEach((good) => {
      const id = `price:${good.id}`;
      if (CA.States.get(id)) return;
      CA.States.define({
        id,
        name: `${good.name} price`,
        unit: '$',
        group: 'stocks',
        kind: 'gauge',
        get: () => {
          const mm = minigame();
          const g = mm && mm.goodsById[good.id];
          return g ? priceOf(g) : undefined;
        },
      });
    });
  }

  function sample() {
    const m = minigame();
    if (!m) return;
    watchTicks(m);
    if (holdingsFor !== CA.Store.saveId()) return;
    ensurePriceStates(m);
    m.goodsById.forEach(updateHolding);
  }

  // ---- market ticks ---------------------------------------------------------------------
  // The market moves once a tick (M.ticks counts them; every 60 s by default). At each tick we
  // note what you held and the prices, so the change over the last tick — for the stocks you held
  // going into it — is Σ shares then × (price now − price then).

  let tickSnap = null; // { ticks, goods: [{ stock, val }] }
  let lastTick = null; // { dollars, cookies, held, t }

  function watchTicks(m) {
    const ticks = m.ticks || 0;
    if (tickSnap && tickSnap.ticks === ticks) return;
    if (tickSnap) {
      let dollars = 0;
      let held = 0;
      m.goodsById.forEach((g, i) => {
        const before = tickSnap.goods[i];
        if (!before || !(before.stock > 0)) return;
        held++;
        dollars += before.stock * (priceOf(g) - before.val);
      });
      lastTick = { dollars, cookies: dollars * (Game.cookiesPsRawHighest || 0), held, t: Date.now() };
    }
    tickSnap = { ticks, goods: m.goodsById.map((g) => ({ stock: g.stock || 0, val: priceOf(g) })) };
  }

  /** Seconds until the market's next tick (null without the minigame). */
  function nextTickIn() {
    const m = minigame();
    if (!m || !Number.isFinite(m.tickT) || !m.secondsPerTick) return null;
    return Math.max(0, (Game.fps * m.secondsPerTick - m.tickT) / Game.fps);
  }

  /** Current totals plus a per-stock breakdown; null while the Bank minigame isn't open. */
  function portfolioNow() {
    const m = minigame();
    if (!m) return null;
    sample();
    let value = 0;
    let cost = 0;
    let realized = 0;
    const rows = m.goodsById.map((good) => {
      const h = holdingOf(good.id);
      const price = priceOf(good);
      value += h.shares * price;
      cost += h.shares * h.avgCost;
      realized += h.realized;
      return {
        id: good.id,
        name: good.name,
        shares: h.shares,
        price,
        value: h.shares * price,
        avgCost: h.avgCost,
        unrealized: h.shares * (price - h.avgCost),
        realized: h.realized,
      };
    });
    const unrealized = value - cost;
    return { value, cost, unrealized, realized, gain: unrealized + realized, rows };
  }

  /** Every stock, with its display name and whether you currently hold any. */
  function list() {
    const m = minigame();
    if (!m) return [];
    return m.goodsById.map((good) => ({ id: good.id, name: good.name, owned: good.stock > 0 }));
  }

  // ---- persistence ------------------------------------------------------------------

  function cleanHoldings(obj) {
    const out = {};
    Object.keys(obj || {}).forEach((id) => {
      const h = obj[id];
      if (h && typeof h.shares === 'number' && typeof h.avgCost === 'number' && typeof h.realized === 'number') {
        out[id] = { shares: h.shares, avgCost: h.avgCost, realized: h.realized };
      }
    });
    return out;
  }

  function persist() {
    if (!dirty || !holdingsFor) return Promise.resolve();
    dirty = false;
    return CA.Store.setKV('stockHoldings', holdings, holdingsFor);
  }

  /** Up to v1.3 holdings lived in localStorage (with price history). Take the holdings, free the rest. */
  function takeLegacyHoldings() {
    let legacy = null;
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw) legacy = cleanHoldings((JSON.parse(raw) || {}).holdings);
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) {
      /* unreadable — nothing to migrate */
    }
    return legacy;
  }

  function load() {
    const s = CA.Store.saveId();
    holdingsFor = null;
    return CA.Store.getKV('stockHoldings', s).then((stored) => {
      const legacy = takeLegacyHoldings();
      holdings = stored ? cleanHoldings(stored) : legacy || {};
      holdingsFor = s;
      dirty = !stored && !!legacy;
    });
  }

  function clear(el) {
    el.classList.remove('cm-stock', 'cm-owned', 'cm-notint');
    el.style.removeProperty('--cm-c');
    const badge = el.querySelector('.cm-stockbadge');
    if (badge) badge.remove();
    delete el.dataset.cmMode;
  }

  function decorate(el, good) {
    const info = MODES[good.mode];
    if (!info) return clear(el);
    el.classList.add('cm-stock');
    el.classList.toggle('cm-owned', good.stock > 0);
    el.classList.toggle('cm-notint', !CA.Settings.get('stockTint'));
    if (el.dataset.cmMode !== String(good.mode) || !el.querySelector('.cm-stockbadge')) {
      el.dataset.cmMode = String(good.mode);
      el.style.setProperty('--cm-c', info.color);
      let badge = el.querySelector('.cm-stockbadge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'cm-stockbadge';
        el.insertBefore(badge, el.firstChild);
      }
      badge.title = `${info.label}: ${info.hint}`;
      badge.innerHTML = `<b>${info.sym}</b>${info.label}`;
    }
  }

  function refresh() {
    const m = minigame();
    if (!m) return;
    const on = CA.Settings.get('stockIndicators');
    m.goodsById.forEach((good) => {
      const el = document.getElementById(`bankGood-${good.id}`);
      if (!el) return;
      if (on && good.active !== false) decorate(el, good);
      else clear(el);
    });
  }

  function init() {
    CA.Settings.defineOption({
      key: 'stockIndicators',
      icon: 'tag',
      group: 'stocks',
      name: 'Stock market trend indicators',
      desc: 'Shows each stock’s trend (stable, rising, falling, chaotic) on its box in the Bank minigame.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'stockTint',
      icon: 'drop',
      group: 'stocks',
      name: 'Tint stock boxes',
      desc: 'Colours each stock box by its trend; boxes glow brighter while you hold that stock.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'stockGraphSync',
      icon: 'link',
      group: 'stocks',
      name: 'Sync graph to owned stocks',
      desc: 'The per-stock price view only plots stocks you currently hold; turn off to show all of them.',
      default: true,
    });
    CA.Util.injectCss('CookieMgrStocksStyles', CSS);
    load();
    CA.Events.on('settings', refresh);
    CA.Events.on('storeReloaded', load);
    CA.Events.on('history', (why) => {
      if (why === 'load' && holdingsFor && holdingsFor !== CA.Store.saveId()) persist().then(load); // a different save
    });
    setInterval(refresh, TICK_MS);
    setInterval(sample, SAMPLE_MS);
    setInterval(persist, PERSIST_MS);
    addEventListener('pagehide', persist);
    refresh();
  }

  return { init, refresh, MODES, list, portfolioNow, minigame, lastTick: () => lastTick, nextTickIn, sample };
})();

// ---- src/features/gameStates.js --------------------------------------
// The built-in states (core/states.js) — what the recorder samples every second and what the
// graphs are built from. Grouped:
//
//   CpS        cps, base (unbuffed), click (cookies/s from clicking)
//   cookies    cookies (bank), baked (this ascension), bakedAllTime, handmade
//   earnings   per-frame flows splitting "baked" by source — see attribute() below
//   bank       per-frame flows for what else moves the bank: spending, wrinkler withering, other
//   ledger     every change to the bank in seven categories, in and out separately — see ledger()
//   prestige   prestige, prestigeTotal (level if you ascended now), prestigeGain, heavenlyChips
//   stocks     portfolioValue/Cost/Realized (+ one price:<id> per stock, see features/stocks.js)
//   magic      grimoire magic, when the Wizard tower minigame is open
//
// Game facts this relies on (from the game's own source): each logic frame does
// Game.Earn(Game.cookiesPs / fps), adding to both Game.cookies and Game.cookiesEarned; wrinklers
// then dissolve cookiesPs × cpsSucked from the bank only; clicks add to handmadeCookies;
// ascending resets cookiesEarned (so a negative delta means "new run", not negative income).

CA.GameStates = (() => {
  const S = (def) => CA.States.define(def);
  const shown = () => 1 - (Game.cpsSucked || 0);
  const delta = (ctx, id) => (ctx.prev && Number.isFinite(ctx.prev[id]) && Number.isFinite(ctx.frame[id]) ? ctx.frame[id] - ctx.prev[id] : 0);
  const INCOME_TYPES = new Set(['golden', 'wrath', 'reindeer']);

  /**
   * Splits this frame's increase in cookies baked into sources, in this order (each takes at
   * most what's left, so the parts always add up to the total):
   *   click       what clicking added (handmadeCookies)
   *   golden      instant golden/wrath/reindeer payouts logged this frame, plus the extra
   *               production buffs added on top of unbuffed CpS (Frenzy & co.)
   *   production  unbuffed CpS × time
   *   other       whatever's left (wrinkler pops, sugar lumps, …)
   * Computed once per frame and cached on ctx.
   */
  // The first frame after a gap (page load, closed tab…) has nothing to compare against: its
  // flows are unknown, not zero — recording 0 would drag every average down.
  const UNKNOWN_EARN = { total: undefined, click: undefined, golden: undefined, production: undefined, other: undefined };
  const UNKNOWN_BANK = { withered: undefined, spent: undefined, otherIn: undefined };

  function attribute(ctx) {
    if (ctx._earn) return ctx._earn;
    if (!ctx.prev) return (ctx._earn = UNKNOWN_EARN);
    const total = Math.max(0, delta(ctx, 'baked'));
    let left = total;
    const take = (want) => {
      const v = Math.max(0, Math.min(left, want));
      left -= v;
      return v;
    };
    const click = take(delta(ctx, 'handmade'));
    let instant = 0;
    (ctx.events || []).forEach((e) => {
      if (INCOME_TYPES.has(e.type) && e.cookies > 0) instant += e.cookies;
    });
    const buffExtra = Math.max(0, (Game.cookiesPs || 0) - (Game.unbuffedCps || Game.cookiesPs || 0)) * ctx.dt;
    const golden = take(instant + buffExtra);
    const production = take((Game.unbuffedCps || Game.cookiesPs || 0) * ctx.dt);
    const other = left;
    ctx._earn = { total, click, golden, production, other };
    return ctx._earn;
  }

  /** What one click would be worth with no temporary effects (see clickRaw). */
  function rawPerClick() {
    if (typeof Game.mouseCps !== 'function') return undefined;
    const cps = Game.cookiesPs;
    const buffs = Game.buffs;
    try {
      Game.cookiesPs = Game.unbuffedCps || cps;
      Game.buffs = {};
      const v = Game.mouseCps();
      return Number.isFinite(v) ? v : undefined;
    } catch (e) {
      return undefined;
    } finally {
      Game.cookiesPs = cps;
      Game.buffs = buffs;
    }
  }

  /**
   * The ledger: this frame's change to the bank split into the categories the Actual CpS chart
   * shows, money in and money out kept apart (outs are positive amounts):
   *   building CpS   production; split into unboosted (unbuffed CpS) and the extra from CpS
   *                  effects (Frenzy & co.)
   *   clicking       split into unboosted (clicks × a click's no-effects worth) and the extra
   *   drops          golden / wrath cookies and reindeer: Lucky!, chains, storms… and Ruin's losses;
   *                  split into unboosted and the extra a CpS effect added (see features/history.js)
   *   stocks         buying (out) and selling (in) stocks
   *   buildings      buying (out) and selling (in) buildings
   *   upgrades       buying upgrades (out)
   *   other          whatever is left: wrinklers, sugar lumps, spells, Santa, the dragon…
   * "Other" is the bank change minus everything else, so the categories always add up to exactly
   * what the bank did — integrating the chart gives back the bank.
   *
   * Stock equity sits outside the bank: what your stocks would sell for right now, in cookies. Its
   * change (equityUp / equityDown) mirrors the stocks cash flow at each trade — buying moves cookies
   * from the bank into equity, minus the broker's cut — and in between moves with the prices.
   */
  const UNKNOWN_LEDGER = {};
  const LEDGER_KEYS = ['build', 'buildBoost', 'click', 'clickBoost', 'dropsIn', 'dropsBoost', 'dropsOut', 'stocksIn', 'stocksOut', 'bldIn', 'bldOut', 'upgOut', 'otherIn', 'otherOut', 'equityUp', 'equityDown'];
  LEDGER_KEYS.forEach((k) => (UNKNOWN_LEDGER[k] = undefined));
  const DROP_TYPES = new Set(['golden', 'wrath', 'reindeer']);

  function ledger(ctx) {
    if (ctx._ledger) return ctx._ledger;
    if (!ctx.prev) return (ctx._ledger = UNKNOWN_LEDGER);
    const baked = delta(ctx, 'baked');
    const bank = delta(ctx, 'cookies');
    if (baked < 0) return (ctx._ledger = UNKNOWN_LEDGER); // ascended mid-frame
    const sums = { dropsIn: 0, dropsBoost: 0, dropsOut: 0, stocksIn: 0, stocksOut: 0, bldIn: 0, bldOut: 0, upgOut: 0 };
    (ctx.events || []).forEach((e) => {
      const c = e.cookies || 0;
      if (DROP_TYPES.has(e.type)) {
        if (c < 0) sums.dropsOut -= c;
        else {
          const boost = Math.min(c, Math.max(0, (e.data && e.data.boost) || 0));
          sums.dropsIn += c - boost;
          sums.dropsBoost += boost;
        }
      }
      else if (e.type === 'trade') c >= 0 ? (sums.stocksIn += c) : (sums.stocksOut -= c);
      else if (e.type === 'building') c >= 0 ? (sums.bldIn += c) : (sums.bldOut -= c);
      else if (e.type === 'upgrade' && c < 0) sums.upgOut -= c;
    });
    // clicking: what handmadeCookies says, the unboosted part from clicks × raw per-click worth
    const click = Math.max(0, delta(ctx, 'handmade'));
    const rawRate = ctx.frame && Number.isFinite(ctx.frame.clickRaw) ? ctx.frame.clickRaw : click / ctx.dt;
    const clickBase = Math.min(click, rawRate * ctx.dt);
    // building CpS: the rest of what was baked, up to what CpS would bake in this time
    const left = Math.max(0, baked - click - sums.dropsIn - sums.dropsBoost - sums.bldIn);
    const production = Math.min(left, (Game.cookiesPs || 0) * ctx.dt);
    const base = Math.min(production, (Game.unbuffedCps || Game.cookiesPs || 0) * ctx.dt);
    const known = production + click + sums.dropsIn + sums.dropsBoost - sums.dropsOut + sums.stocksIn - sums.stocksOut + sums.bldIn - sums.bldOut - sums.upgOut;
    const other = bank - known;
    ctx._ledger = {
      build: base,
      buildBoost: production - base,
      click: clickBase,
      clickBoost: click - clickBase,
      ...sums,
      otherIn: Math.max(0, other),
      otherOut: Math.max(0, -other),
      equityUp: Math.max(0, delta(ctx, 'stockEquity')),
      equityDown: Math.max(0, -delta(ctx, 'stockEquity')),
    };
    return ctx._ledger;
  }

  function bankFlows(ctx) {
    if (ctx._bank) return ctx._bank;
    if (!ctx.prev) return (ctx._bank = UNKNOWN_BANK);
    const earned = attribute(ctx).total;
    const withered = (Game.cookiesPs || 0) * (Game.cpsSucked || 0) * ctx.dt;
    const change = delta(ctx, 'cookies');
    const expected = earned - withered;
    ctx._bank = {
      withered,
      spent: Math.max(0, expected - change), // buildings, upgrades, stock purchases, …
      otherIn: Math.max(0, change - expected), // stock sales and anything else not "baked"
    };
    return ctx._bank;
  }

  /** 'buildBoost' → 'lBuildBoost' */
  const ledgerId = (k) => 'l' + k[0].toUpperCase() + k.slice(1);

  function init() {
    // cookies — defined first: states below compute deltas of these within the same frame
    S({ id: 'cookies', name: 'Cookies in bank', group: 'cookies', kind: 'gauge', get: () => Game.cookies });
    S({ id: 'baked', name: 'Cookies baked (this ascension)', group: 'cookies', kind: 'counter', get: () => Game.cookiesEarned });
    S({ id: 'bakedAllTime', name: 'Cookies baked (all time)', group: 'cookies', kind: 'counter', get: () => (Game.cookiesEarned || 0) + (Game.cookiesReset || 0) });
    S({ id: 'handmade', name: 'Cookies from clicking (total)', group: 'cookies', kind: 'counter', get: () => Game.handmadeCookies });
    S({ id: 'clicks', name: 'Big cookie clicks (total)', group: 'cookies', kind: 'counter', get: () => Game.cookieClicks });

    // CpS — field names match what the CpS graph has always read (s.cps, s.base, s.click)
    S({ id: 'cps', name: 'CpS', unit: '/s', group: 'cps', kind: 'gauge', get: () => (Game.cookiesPs || 0) * shown() });
    S({ id: 'base', name: 'Unbuffed CpS', unit: '/s', group: 'cps', kind: 'gauge', get: () => (Game.unbuffedCps || Game.cookiesPs || 0) * shown() });
    S({ id: 'click', name: 'Clicking', unit: '/s', group: 'cps', kind: 'gauge', get: (ctx) => (ctx.prev && ctx.dt ? Math.max(0, delta(ctx, 'handmade')) / ctx.dt : undefined) });
    // Raw clicking = clicks per second × what one click would give with no temporary effects.
    // A click's value depends on effects twice over: buffs' multClick (Click frenzy…) and, through
    // the mouse upgrades' "+1% of CpS", on the *buffed* CpS (Frenzy…). So rather than dividing,
    // ask the game's own Game.mouseCps() with CpS set to unbuffed CpS and no buffs active —
    // swapped in and restored within this one synchronous call.
    S({ id: 'clickRate', name: 'Clicks per second', unit: '/s', group: 'cps', kind: 'gauge', get: (ctx) => (ctx.prev && ctx.dt ? Math.max(0, delta(ctx, 'clicks')) / ctx.dt : undefined) });
    S({ id: 'perClick', name: 'Cookies per click', group: 'cps', kind: 'gauge', get: () => Game.computedMouseCps });
    S({ id: 'perClickRaw', name: 'Cookies per click, no effects', group: 'cps', kind: 'gauge', get: rawPerClick });
    S({
      id: 'clickRaw',
      name: 'Clicking without effects',
      unit: '/s',
      group: 'cps',
      kind: 'gauge',
      get: (ctx) => {
        const f = ctx.frame || {};
        if (Number.isFinite(f.clickRate) && Number.isFinite(f.perClickRaw)) return f.clickRate * f.perClickRaw;
        return undefined;
      },
    });

    // earnings — where this frame's baked cookies came from
    S({ id: 'earned', name: 'Baked', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).total });
    S({ id: 'earnProduction', name: 'Production', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).production });
    S({ id: 'earnClick', name: 'Clicking', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).click });
    S({ id: 'earnGolden', name: 'Golden cookies & reindeer', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).golden });
    S({ id: 'earnOther', name: 'Other', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).other });

    // bank — what else moves the bank besides baking
    S({ id: 'spent', name: 'Spent', group: 'bank', kind: 'flow', get: (ctx) => bankFlows(ctx).spent });
    S({ id: 'withered', name: 'Withered by wrinklers', group: 'bank', kind: 'flow', get: (ctx) => bankFlows(ctx).withered });
    S({ id: 'bankOtherIn', name: 'Other income (stock sales, …)', group: 'bank', kind: 'flow', get: (ctx) => bankFlows(ctx).otherIn });

    // ledger — every change to the bank by category (state ids: 'l' + key, e.g. lBuildBoost)
    const LEDGER_NAMES = {
      build: 'Building CpS (unboosted)',
      buildBoost: 'Building CpS: extra from CpS effects',
      click: 'Clicking (unboosted)',
      clickBoost: 'Clicking: extra from effects',
      dropsIn: 'Drops (golden cookies, reindeer…)',
      dropsBoost: 'Drops: extra from CpS effects',
      dropsOut: 'Drops lost (wrath)',
      stocksIn: 'Stocks sold',
      stocksOut: 'Stocks bought',
      bldIn: 'Buildings sold',
      bldOut: 'Buildings bought',
      upgOut: 'Upgrades bought',
      otherIn: 'Other in',
      otherOut: 'Other out',
      equityUp: 'Stock equity up',
      equityDown: 'Stock equity down',
    };
    LEDGER_KEYS.forEach((k) =>
      S({ id: ledgerId(k), name: LEDGER_NAMES[k], group: 'ledger', kind: 'flow', get: (ctx) => ledger(ctx)[k] })
    );

    // prestige
    const totalLevel = () => Math.floor(Game.HowMuchPrestige((Game.cookiesReset || 0) + (Game.cookiesEarned || 0)));
    S({ id: 'prestige', name: 'Prestige level', group: 'prestige', kind: 'counter', get: () => Game.prestige });
    S({ id: 'prestigeTotal', name: 'Prestige level if you ascended now', group: 'prestige', kind: 'counter', get: totalLevel });
    S({ id: 'prestigeGain', name: 'Prestige gained this run', group: 'prestige', kind: 'counter', get: () => totalLevel() - (Game.prestige || 0) });
    S({ id: 'heavenlyChips', name: 'Heavenly chips', group: 'prestige', kind: 'counter', get: () => Game.heavenlyChips });

    // stocks (undefined while the Bank minigame isn't open — the recorder then skips them)
    const p = (k) => () => {
      const now = CA.Stocks.portfolioNow();
      return now ? now[k] : undefined;
    };
    S({ id: 'portfolioValue', name: 'Portfolio value', unit: '$', group: 'stocks', kind: 'gauge', get: p('value') });
    S({ id: 'portfolioCost', name: 'Portfolio cost basis', unit: '$', group: 'stocks', kind: 'gauge', get: p('cost') });
    S({
      id: 'stockEquity',
      name: 'Stock equity (cookies if sold now)',
      group: 'stocks',
      kind: 'gauge',
      get: () => (CA.Stocks.minigame() ? CA.StockTrader.previewSellAllCookies() : undefined),
    });
    S({ id: 'portfolioRealized', name: 'Realized stock profit', unit: '$', group: 'stocks', kind: 'counter', get: p('realized') });

    // magic
    S({
      id: 'magic',
      name: 'Magic',
      group: 'magic',
      kind: 'gauge',
      get: () => {
        const tower = Game.Objects && Game.Objects['Wizard tower'];
        const m = tower && tower.minigame;
        return m && Number.isFinite(m.magic) ? m.magic : undefined;
      },
    });
    S({
      id: 'magicMax',
      name: 'Maximum magic',
      group: 'magic',
      kind: 'gauge',
      get: () => {
        const tower = Game.Objects && Game.Objects['Wizard tower'];
        const m = tower && tower.minigame;
        return m && Number.isFinite(m.magicM) ? m.magicM : undefined;
      },
    });
  }

  return { init, attribute, LEDGER_KEYS, ledgerId };
})();

// ---- src/features/stockTrader.js -------------------------------------
// Stock market trading logic: buys the max it can afford of fast-rising stocks, then slow-rising
// ones, and sells anything it holds that isn't currently rising. That's the whole strategy —
// no price targets, no per-stock tuning.
//
// The logic lives here as two actions (features/gameActions.js: stocks.trade, stocks.sellAll);
// switching it on and off is the built-in "Stock market autobuyer" macro (features/macros.js), so
// the Stock market page, the Bank minigame toolbar and the Macros page all show the same switch.
// It isn't part of "All autoclickers" and keeps running through an ascension.
//
// Uses the Bank minigame's own buy/sell API (M.buyGood/M.sellGood with the amount `10000`,
// the same sentinel value the game's own "buy max"/"sell max" buttons use — verified against
// minigameMarket.js) rather than computing an affordable amount ourselves.

CA.StockTrader = (() => {
  const RISING = [3, 1]; // fast rise, then slow rise — good.mode values (see features/stocks.js)
  const MACRO = 'stockTrader';

  /** One trading pass. Returns how many buy/sell orders went through. */
  function trade() {
    const m = CA.Stocks.minigame();
    if (!m) return 0;
    let n = 0;
    const goods = m.goodsById.filter((g) => g.active !== false);
    goods.forEach((g) => {
      if (g.stock > 0 && !RISING.includes(g.mode) && m.sellGood(g.id, 10000)) n++;
    });
    RISING.forEach((mode) =>
      goods.forEach((g) => {
        if (g.mode === mode && m.buyGood(g.id, 10000)) n++;
      })
    );
    return n;
  }

  /** Sells every stock held. Returns how many stocks were sold. */
  function sellEverything() {
    const m = CA.Stocks.minigame();
    if (!m) return 0;
    let n = 0;
    m.goodsById.forEach((g) => {
      if (g.stock > 0 && m.sellGood(g.id, 10000)) n++;
    });
    return n;
  }

  const set = (on, opts) => CA.Macros.set(MACRO, on, opts);
  const toggle = () => CA.Macros.toggle(MACRO);
  const isOn = () => CA.Macros.isOn(MACRO);

  /** The built-in "Sell all stocks" macro: autobuyer off first, then sell everything. */
  const sellAll = () => CA.Macros.runOnce('sellAll');

  /** Cookies selling everything right now would actually pay out — the same formula the Bank
   *  minigame's own sellGood uses (cookiesPsRawHighest × price × shares, per stock), so this
   *  matches exactly rather than approximating. For a hover preview, not an action. */
  function previewSellAllCookies() {
    const m = CA.Stocks.minigame();
    if (!m) return 0;
    const cpsHighest = (typeof Game !== 'undefined' && Game.cookiesPsRawHighest) || 0;
    let total = 0;
    m.goodsById.forEach((g) => {
      if (g.stock > 0) total += cpsHighest * g.val * g.stock;
    });
    return total;
  }

  /** Hover text for any "Sell all" button: the live cookie payout, or that there's nothing held. */
  function sellAllTitle() {
    const cookies = previewSellAllCookies();
    const beautify = (v) => (typeof Beautify === 'function' ? Beautify(v) : Math.round(v).toString());
    return cookies > 0 ? `Sells for ~${beautify(cookies)} cookies right now` : 'Nothing to sell right now';
  }

  return { trade, sellEverything, set, toggle, isOn, sellAll, previewSellAllCookies, sellAllTitle };
})();

// ---- src/features/stockLog.js ----------------------------------------
// Records every stock trade — bought or sold, by the "buy fast/slow rise" autoclicker or by you
// clicking the Bank minigame's own buy/sell buttons — as 'trade' events in the central event log
// (core/eventLog.js), so they're persisted per save and show up anywhere events are listed.
//
// There is no separate "manual trade" event to hook: the Bank minigame's own UI buttons call
// straight into `minigame.buyGood`/`minigame.sellGood` (verified against minigameMarket.js), the
// exact same functions our autoclicker calls. So we wrap those two functions once, the same way
// CA.Util.wrap() wraps Game.* elsewhere — one wrapper sees every trade regardless of who made it.

CA.StockLog = (() => {
  const POLL_MS = 1000;

  let cache = { version: -1, list: [] };

  function wrap(m) {
    if (m.__cmLogWrapped) return;
    m.__cmLogWrapped = true;

    const origBuy = m.buyGood;
    const origSell = m.sellGood;

    m.buyGood = function (id, n) {
      const good = m.goodsById[id];
      const beforeStock = good ? good.stock : 0;
      const beforeCookies = Game.cookies;
      const ok = origBuy.call(this, id, n);
      if (ok && good) {
        const shares = good.stock - beforeStock;
        if (shares > 0) record('buy', good, shares, beforeCookies - Game.cookies);
      }
      return ok;
    };

    m.sellGood = function (id, n) {
      const good = m.goodsById[id];
      const beforeStock = good ? good.stock : 0;
      const beforeCookies = Game.cookies;
      const ok = origSell.call(this, id, n);
      if (ok && good) {
        const shares = beforeStock - good.stock;
        if (shares > 0) record('sell', good, shares, Game.cookies - beforeCookies);
      }
      return ok;
    };
  }

  /** `cookies` is the unsigned amount the trade cost or paid out. */
  function record(kind, good, shares, cookies) {
    const verb = kind === 'buy' ? 'Bought' : 'Sold';
    const e = CA.EventLog.add({
      type: 'trade',
      title: `${verb} ${shares} ${good.name}`,
      text: `@ $${Math.round(good.val * 100) / 100}`,
      cookies: kind === 'buy' ? -cookies : cookies,
      data: { kind, id: good.id, name: good.name, shares, price: good.val },
    });
    CA.Events.emit('stockTrade', e);
  }

  function poll() {
    const m = CA.Stocks.minigame();
    if (m) wrap(m);
  }

  /** Every logged trade, oldest first, in the flat shape the Stock market page uses:
   *  { t, kind: 'buy'|'sell', id, name, shares, price, cookies (unsigned) }. */
  function list() {
    const v = CA.EventLog.version();
    if (cache.version !== v) {
      cache = {
        version: v,
        list: CA.EventLog.list(['trade']).map((e) => ({ t: e.t, ...e.data, cookies: Math.abs(e.cookies) })),
      };
    }
    return cache.list;
  }

  function init() {
    setInterval(poll, POLL_MS);
    poll();
  }

  return { init, list };
})();

// ---- src/features/history.js -----------------------------------------
// What the CpS graph needs beyond plain state history:
//
//   samples    the recorder's frames (core/recorder.js) — t, cps, base, click and every other
//              recorded state; this module no longer samples anything itself
//   intervals  every buff/effect that was active, with start and end (they can overlap = stacking)
//   events     golden/wrath cookie and reindeer pops (with their outcome) and ascensions, as
//              entries in the central event log (core/eventLog.js)
//
// The buff log is stored in IndexedDB (core/store.js) per save. Nothing here touches
// localStorage — see core/store.js for why that matters.

CA.History = (() => {
  const TICK_MS = 1000;
  const MAX_INTERVALS = 1500;
  const PERSIST_MS = 30000;
  const FPS = 30; // buff timers are counted in logic frames
  const MARKER_TYPES = ['golden', 'wrath', 'reindeer', 'ascend'];
  const LEGACY_KEY = 'CookieMgr.history.v1';

  let intervals = []; // { name, label, desc, icon, start, end|null, multCps, multClick, ... }
  const open = {}; // buff name -> currently open interval
  let dirty = false;

  // ---- colours -------------------------------------------------------------------

  const KNOWN_COLORS = {
    Frenzy: '#f4c430',
    'Elder frenzy': '#ef5350',
    'Click frenzy': '#42a5f5',
    Dragonflight: '#ff8a3d',
    'Dragon Harvest': '#aeea00',
    'Blood frenzy': '#c62828',
    Clot: '#8e6bbf',
    'Cursed finger': '#8d6e63',
    'Cookie storm': '#26c6da',
    'Everything must go': '#ec407a',
    'Sugar frenzy': '#f8bbd0',
    Devastation: '#b71c1c',
    'Sugar blessing': '#ffd54f',
  };
  const colorCache = {};
  function colorFor(name) {
    if (KNOWN_COLORS[name]) return KNOWN_COLORS[name];
    if (!colorCache[name]) {
      let h = 0;
      for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
      colorCache[name] = `hsl(${(h * 137.508) % 360}, 62%, 58%)`;
    }
    return colorCache[name];
  }

  // ---- helpers -------------------------------------------------------------------

  const stripHtml = (s) =>
    String(s || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const inAscension = () => Game.OnAscend || Game.AscendTimer > 0;

  // ---- buff intervals --------------------------------------------------------------

  function closeInterval(iv, now) {
    iv.end = Math.min(now, iv.projEnd || now);
    delete open[iv.name];
    dirty = true;
  }

  function openInterval(b, now) {
    const elapsed = Math.max(0, ((b.maxTime || 0) - (b.time || 0)) / FPS) * 1000;
    const iv = {
      name: b.name,
      label: b.dname || b.name,
      desc: stripHtml(b.desc),
      icon: b.icon || [0, 0],
      start: now - Math.min(elapsed, TICK_MS),
      end: null,
      projEnd: now + ((b.time || 0) / FPS) * 1000,
      duration: (b.maxTime || 0) / FPS,
      multCps: typeof b.multCpS === 'number' ? b.multCpS : 1,
      multClick: typeof b.multClick === 'number' ? b.multClick : 1,
      ref: b,
    };
    open[b.name] = iv;
    intervals.push(iv);
    // Log effects that just started (not ones already running when we first looked, e.g. after a reload).
    if (elapsed <= TICK_MS * 2) {
      const bits = [];
      if (Math.abs(iv.multCps - 1) > 0.001) bits.push(`×${Math.round(iv.multCps * 100) / 100} CpS`);
      if (Math.abs(iv.multClick - 1) > 0.001) bits.push(`×${Math.round(iv.multClick * 100) / 100} clicks`);
      CA.EventLog.add({
        type: 'effect',
        title: `${iv.label} started`,
        text: [bits.join(', '), iv.duration ? `${Math.round(iv.duration)}s` : ''].filter(Boolean).join(' · '),
        data: { name: iv.name, duration: iv.duration, multCps: iv.multCps, multClick: iv.multClick },
      });
    }
    if (intervals.length > MAX_INTERVALS + 200) intervals.splice(0, intervals.length - MAX_INTERVALS);
    dirty = true;
    return iv;
  }

  function trackBuffs(now) {
    const seen = {};
    for (const name in Game.buffs) {
      const b = Game.buffs[name];
      if (!b || b.time <= 0) continue;
      seen[name] = true;
      let iv = open[name];
      if (iv && iv.ref !== b) {
        closeInterval(iv, now);
        iv = null;
      }
      if (!iv) iv = openInterval(b, now);
      iv.projEnd = now + (b.time / FPS) * 1000;
      iv.duration = Math.max(iv.duration, (now - iv.start) / 1000 + b.time / FPS);
      if (typeof b.multCpS === 'number') iv.multCps = b.multCpS;
      if (typeof b.multClick === 'number') iv.multClick = b.multClick;
    }
    Object.keys(open).forEach((name) => {
      if (!seen[name]) closeInterval(open[name], now);
    });
  }

  function closeAll(now) {
    Object.keys(open).forEach((name) => closeInterval(open[name], now));
  }

  function tick() {
    if (typeof Game === 'undefined' || !Game.ready || !CA.Settings.get('trackHistory')) return;
    const now = Date.now();
    if (inAscension()) closeAll(now);
    else trackBuffs(now);
  }

  // ---- one-off events -------------------------------------------------------------

  const EVENT_ICON = { golden: [10, 14], wrath: [15, 5], reindeer: [12, 9] };

  function addEvent(ev) {
    const e = CA.EventLog.add(ev);
    CA.Events.emit('history', 'event');
    return e;
  }

  /** Wraps a shimmer type's popFunc so we can log what each pop actually did, notify about it
   *  right away, and record exactly which buffs it granted (name/duration/multipliers), not
   *  just the scraped popup text. */
  function watchShimmers() {
    if (!Game.shimmerTypes) return;
    ['golden', 'reindeer'].forEach((shimmer) => {
      const st = Game.shimmerTypes[shimmer];
      if (!st || typeof st.popFunc !== 'function') return;
      const original = st.popFunc;
      st.popFunc = function (me) {
        if (!CA.Settings.get('trackHistory')) return original.apply(this, arguments);
        const before = Game.cookies;
        const cpsBefore = Game.cookiesPs || 0;
        const unbuffed = Game.unbuffedCps || cpsBefore;
        const buffsBefore = Object.keys(Game.buffs || {});
        const texts = [];
        const popup = Game.Popup;
        const notify = Game.Notify;
        Game.Popup = function (text) {
          texts.push(stripHtml(text));
          return popup.apply(this, arguments);
        };
        Game.Notify = function (title) {
          if (title) texts.push(stripHtml(title));
          return notify.apply(this, arguments);
        };
        let result;
        try {
          result = original.apply(this, arguments);
        } finally {
          Game.Popup = popup;
          Game.Notify = notify;
        }
        try {
          const wrath = shimmer === 'golden' && me && me.wrath;
          const type = wrath ? 'wrath' : shimmer;
          const title = shimmer === 'reindeer' ? 'Reindeer' : wrath ? 'Wrath cookie' : 'Golden cookie';
          const text = texts.filter(Boolean).slice(0, 2).join(' — ');
          const cookies = Game.cookies - before;
          // Buffs that didn't exist a moment ago must have come from this pop.
          const effects = Object.keys(Game.buffs || {})
            .filter((name) => !buffsBefore.includes(name))
            .map((name) => {
              const b = Game.buffs[name];
              return {
                name,
                duration: (b.maxTime || 0) / FPS,
                multCps: typeof b.multCpS === 'number' ? b.multCpS : 1,
                multClick: typeof b.multClick === 'number' ? b.multClick : 1,
              };
            });
          // Drops pay out minutes of CpS (Lucky!, chains, storms…), so under a CpS effect part of the
          // payout is that effect's doing: payout × (1 − unbuffed ÷ buffed CpS). Not when Lucky! (or
          // a chain) hit their cap of a share of the bank instead — then CpS didn't matter.
          const bankCapped = cookies >= 0.149 * before;
          const boost = cookies > 0 && cpsBefore > unbuffed && !bankCapped ? cookies * (1 - unbuffed / cpsBefore) : 0;
          // effect-only pops (Frenzy…): the CpS they add, for event lists
          const mult = effects.reduce((m, ef) => m * ef.multCps, 1);
          const cpsGain = mult !== 1 ? cpsBefore * (mult - 1) : 0;
          addEvent({ type, title, text, cookies, data: { effects, boost, cpsGain } });
          if (CA.Settings.get('goldenNotify')) {
            const beautify = (v) => (typeof Beautify === 'function' ? Beautify(v) : Math.round(v).toString());
            const desc = text || (Math.abs(cookies) >= 1 ? `${cookies >= 0 ? '+' : '−'}${beautify(Math.abs(cookies))} cookies` : '');
            CA.Util.notify(title, desc, EVENT_ICON[type] || CA.ICON, 1.5);
          }
        } catch (e) {
          /* never break the game over a log entry */
        }
        return result;
      };
    });
  }

  // ---- queries ---------------------------------------------------------------------

  const samples = () => CA.Recorder.frames();
  const lowerBound = (time) => CA.Recorder.lowerBound(time);
  /** Golden/wrath/reindeer pops and ascensions, oldest first. */
  const events = () => CA.EventLog.list(MARKER_TYPES);

  /** Summary numbers for [t0, t1]. */
  function stats(t0, t1) {
    const all = samples();
    const from = lowerBound(t0);
    let n = 0;
    let sumCps = 0;
    let sumClick = 0;
    let peak = 0;
    let peakT = 0;
    for (let i = from; i < all.length && all[i].t <= t1; i++) {
      const s = all[i];
      const cps = s.cps || 0;
      n++;
      sumCps += cps;
      sumClick += s.click || 0;
      if (cps >= peak) {
        peak = cps;
        peakT = s.t;
      }
    }
    const avg = n ? sumCps / n : 0;
    const avgClick = n ? sumClick / n : 0;
    return { n, avg, avgClick, peak, peakT, clickShare: avg + avgClick > 0 ? avgClick / (avg + avgClick) : 0 };
  }

  /** Intervals overlapping [t0, t1]; open ones end "now". */
  function intervalsIn(t0, t1) {
    const now = Date.now();
    return intervals.filter((iv) => (iv.end || now) >= t0 && iv.start <= t1);
  }

  // ---- persistence -------------------------------------------------------------------

  function persist() {
    if (!dirty || loadedFor !== CA.Store.saveId()) return Promise.resolve();
    dirty = false;
    // ref points at a live game buff object — not storable
    return CA.Store.setKV(
      'buffs',
      intervals.map(({ ref, ...rest }) => rest),
      loadedFor
    );
  }

  let loadedFor = null;

  function load() {
    Object.keys(open).forEach((k) => delete open[k]);
    loadedFor = CA.Store.saveId();
    return CA.Store.getKV('buffs').then((stored) => {
      intervals = (Array.isArray(stored) ? stored : []).map((iv) => {
        // An interval still "open" as of the last save can't be trusted to still be running
        // (there's no live Game.buffs reference for it any more): close it where we last saw it.
        // If the buff really is still active, the next tick opens a fresh interval for it.
        if (iv.end == null) iv.end = iv.projEnd ? Math.min(iv.projEnd, Date.now()) : iv.start;
        return iv;
      });
      CA.Events.emit('history', 'buffs');
    });
  }

  /** Erases everything recorded for this save: state history, event log, buff log. */
  function clear() {
    intervals = [];
    Object.keys(open).forEach((k) => delete open[k]);
    dirty = true;
    return Promise.all([CA.Recorder.clear(), CA.EventLog.clear(), persist()]).then(() => CA.Events.emit('history', 'clear'));
  }

  function init() {
    CA.Settings.defineOption({
      key: 'goldenNotify',
      icon: 'sparkle',
      group: 'general',
      name: 'Golden cookie notifications',
      desc: 'A quick notification the moment a golden or wrath cookie (or reindeer) is popped.',
      default: true,
    });
    // Up to v1.2 the history lived in localStorage; it's in IndexedDB now. Free that space.
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) {
      /* ignore */
    }
    load();
    watchShimmers();
    CA.Events.on('ascend', () => {
      closeAll(Date.now());
      addEvent({ type: 'ascend', title: 'Ascended', text: 'A new run begins.' });
    });
    CA.Events.on('storeReloaded', load);
    CA.Events.on('history', (why) => {
      if (why === 'load' && loadedFor !== CA.Store.saveId()) load(); // a different save was loaded
    });
    setInterval(tick, TICK_MS);
    setInterval(persist, PERSIST_MS);
    addEventListener('pagehide', persist);
  }

  return {
    init,
    get samples() {
      return samples();
    },
    get intervals() {
      return intervals;
    },
    get events() {
      return events();
    },
    colorFor,
    lowerBound,
    stats,
    intervalsIn,
    clear,
    addEvent,
  };
})();

// ---- src/features/cookieMonster.js -----------------------------------
// Loads Cookie Monster (https://github.com/CookieMonsterTeam/CookieMonster) on request, or
// automatically when CookieMgr starts. Its dist URL always serves the latest release, and it
// registers itself with the game as mod "CookieMonster" (verified against its built bundle),
// which is how we tell whether it's already running.

CA.CookieMonster = (() => {
  const URL = 'https://cookiemonsterteam.github.io/CookieMonster/dist/CookieMonster.js';
  let loading = false;

  const isLoaded = () =>
    typeof Game !== 'undefined' && !!((Game.mods && Game.mods.CookieMonster) || window.CookieMonsterData);

  /** Loads Cookie Monster unless it's already running (or already on its way). */
  function load() {
    if (isLoaded() || loading) return false;
    loading = true;
    Game.LoadMod(
      URL,
      () => {
        loading = false;
        CA.Events.emit('integrations', 'cookieMonster');
      },
      () => {
        loading = false;
        CA.Util.notify('CookieMgr', "Couldn't load Cookie Monster — check your connection.", CA.ICON, 4);
      }
    );
    CA.Events.emit('integrations', 'cookieMonster');
    return true;
  }

  function init() {
    CA.Settings.defineOption({
      key: 'cmAutoLoad',
      icon: 'plug',
      group: 'integrations',
      name: 'Load Cookie Monster on start-up',
      desc: 'Whenever CookieMgr starts, also load the latest Cookie Monster release — unless it is already running.',
      default: false,
    });
    // The game calls our load() (restoring saved settings) right after init(), synchronously,
    // so wait a moment before reading the setting — and give a separately-bookmarked Cookie
    // Monster a chance to register first so we don't load it twice.
    setTimeout(() => {
      if (CA.Settings.get('cmAutoLoad')) load();
    }, 1500);
  }

  return { init, load, isLoaded, isLoading: () => loading };
})();

// ---- src/features/gameEvents.js --------------------------------------
// Feeds more of what happens in the game into the central event log (core/eventLog.js), beyond
// golden cookies (features/history.js) and stock trades (features/stockLog.js):
//
//   wrinkler      a wrinkler popped, with what it gave back
//   lump          sugar lumps harvested (and the cookies a caramelized/golden lump paid)
//   achievement   an achievement unlocked
//   effect        a golden cookie effect / buff started (logged by features/history.js)
//
// Wrinklers: the game pops them inside Game.UpdateWrinklers with nothing to hook, multiplying
// the cookies a wrinkler had sucked by a bonus and paying that out (verified in main.js). So we
// watch each wrinkler's `sucked` a few times a second, and when Game.wrinklersPopped goes up,
// whichever wrinkler just went back to phase 0 popped — its last `sucked` times the same bonus
// the game applies (Sacrilegious corruption, Dragon Guts, shiny ×3, Wrinklerspawn, Scorn) is the payout.

CA.GameEvents = (() => {
  const POLL_MS = 200;

  let lastPopped = null;
  let seen = []; // per wrinkler slot: { phase, sucked, type }

  const has = (name) => typeof Game.Has === 'function' && Game.Has(name);

  /** The multiplier main.js applies to a popped wrinkler's sucked cookies. */
  function popBonus(type) {
    let m = 1.1;
    if (has('Sacrilegious corruption')) m *= 1.05;
    if (typeof Game.auraMult === 'function') m *= 1 + Game.auraMult('Dragon Guts') * 0.2;
    if (type === 1) m *= 3;
    if (has('Wrinklerspawn')) m *= 1.05;
    if (Game.hasGod) {
      const lvl = Game.hasGod('scorn');
      if (lvl === 1) m *= 1.15;
      else if (lvl === 2) m *= 1.1;
      else if (lvl === 3) m *= 1.05;
    }
    return m;
  }

  function pollWrinklers() {
    const list = Game.wrinklers;
    if (!Array.isArray(list)) return;
    const popped = Game.wrinklersPopped || 0;
    if (lastPopped !== null && popped > lastPopped) {
      let found = 0;
      list.forEach((w, i) => {
        const before = seen[i];
        if (!before || !(before.phase > 0) || w.phase !== 0) return;
        found++;
        const cookies = before.sucked * popBonus(before.type);
        if (cookies > 0.5 || CA.Settings.get('logEmptyWrinklers')) {
          CA.EventLog.add({
            type: 'wrinkler',
            title: before.type === 1 ? 'Shiny wrinkler popped' : 'Wrinkler popped',
            text: cookies > 0.5 ? '' : 'It hadn’t eaten anything yet.',
            cookies,
            data: { shiny: before.type === 1, sucked: before.sucked },
          });
        }
      });
      // popped between two polls of ours (spawned and popped within 200ms): nothing to measure
      if (!found && CA.Settings.get('logEmptyWrinklers')) CA.EventLog.add({ type: 'wrinkler', title: 'Wrinkler popped', cookies: 0 });
    }
    lastPopped = popped;
    seen = list.map((w) => ({ phase: w.phase, sucked: w.sucked || 0, type: w.type }));
  }

  function watchLumps() {
    if (typeof Game.harvestLumps !== 'function') return;
    CA.Util.wrap(Game, 'harvestLumps', (original, args, self) => {
      const lumps = Game.lumps;
      const cookies = Game.cookies;
      const type = Game.lumpCurrentType;
      const result = original.apply(self, args);
      try {
        const got = (Game.lumps || 0) - (lumps || 0);
        const paid = Game.cookies - cookies;
        if (got > 0 || paid > 0) {
          const kind = ['', 'Bifurcated', 'Golden', 'Meaty', 'Caramelized'][type] || '';
          CA.EventLog.add({
            type: 'lump',
            title: `Harvested ${got} sugar lump${got === 1 ? '' : 's'}`,
            text: kind ? `${kind} lump` : '',
            cookies: paid > 0 ? paid : 0,
            data: { lumps: got, lumpType: type },
          });
        }
      } catch (e) {
        /* never break the game over a log entry */
      }
      return result;
    });
  }

  function watchAchievements() {
    if (typeof Game.Win !== 'function') return;
    CA.Util.wrap(Game, 'Win', (original, args, self) => {
      const what = args[0];
      const ach = typeof what === 'string' && Game.Achievements ? Game.Achievements[what] : null;
      const wasWon = ach ? ach.won : 1;
      const result = original.apply(self, args);
      try {
        if (ach && !wasWon && ach.won) {
          CA.EventLog.add({
            type: 'achievement',
            title: ach.shortName || ach.dname || ach.name || what,
            text: 'Achievement unlocked',
            data: { id: ach.id, icon: ach.icon },
          });
        }
      } catch (e) {
        /* ignore */
      }
      return result;
    });
  }

  // ---- buildings and upgrades --------------------------------------------------------------
  // Each building has its own buy()/sell() methods (main.js defines them per instance, not on a
  // prototype); upgrades share Game.Upgrade.prototype.buy. Wrapped once each, measuring the bank
  // before and after, so bulk buys, sales and refunds land as one event with the exact amount.

  function measured(type, fn, describe) {
    return function () {
      const before = Game.cookies;
      const amountBefore = this.amount;
      const result = fn.apply(this, arguments);
      try {
        const cookies = Game.cookies - before;
        if (Math.abs(cookies) >= 1) CA.EventLog.add({ type, ...describe(this, cookies, amountBefore), cookies });
      } catch (e) {
        /* never break a purchase over a log entry */
      }
      return result;
    };
  }

  function watchPurchases() {
    Object.values(Game.Objects || {}).forEach((b) => {
      if (!b || b.__cmWatched || typeof b.buy !== 'function') return;
      b.__cmWatched = true;
      const name = (o, n) => (n === 1 ? o.dname || o.name : o.plural || o.dname || o.name);
      const desc = (o, cookies, before) => {
        const n = Math.abs((o.amount || 0) - (before || 0));
        return { title: `${cookies < 0 ? 'Bought' : 'Sold'} ${n} ${name(o, n)}`, data: { building: o.name, n } };
      };
      b.buy = measured('building', b.buy, desc);
      if (typeof b.sell === 'function') b.sell = measured('building', b.sell, desc);
    });
    const U = Game.Upgrade && Game.Upgrade.prototype;
    if (U && typeof U.buy === 'function' && !U.buy.__cmWatched) {
      U.buy = measured('upgrade', U.buy, (u) => ({ title: `Bought ${u.dname || u.name}`, data: { upgrade: u.name } }));
      U.buy.__cmWatched = true;
    }
  }

  function init() {
    CA.Settings.defineOption({
      key: 'logEmptyWrinklers',
      group: 'events',
      icon: 'wrinkler',
      name: 'Log empty wrinklers',
      desc: 'Also log wrinklers popped before they had eaten anything.',
      default: false,
    });
    CA.EventLog.defineType('wrinkler', { name: 'Wrinkler', icon: 'wrinkler', color: '#d97a9a', income: true });
    CA.EventLog.defineType('lump', { name: 'Sugar lump', icon: 'lump', color: '#f2b84b', income: true });
    CA.EventLog.defineType('achievement', { name: 'Achievement', icon: 'trophy', color: '#9be15d' });
    CA.EventLog.defineType('effect', { name: 'Effect', icon: 'sparkle', color: '#42a5f5' });
    CA.EventLog.defineType('building', { name: 'Building', icon: 'building', color: '#ff7a59' });
    CA.EventLog.defineType('upgrade', { name: 'Upgrade', icon: 'upgrade', color: '#c77dff' });
    watchLumps();
    watchAchievements();
    watchPurchases();
    setInterval(watchPurchases, 5000); // buildings added later (new building types, mods)
    setInterval(pollWrinklers, POLL_MS);
  }

  return { init, popBonus };
})();

// ---- src/ui/components.js --------------------------------------------
// HTML snippets for the CookieMgr panel. Everything is plain strings; interactivity
// is handled by one delegated click listener in menu.js via data-ca="…" attributes.

CA.UI = CA.UI || {};

CA.UI.C = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);

  /** Picture for a clicker/action: a standalone image, or a sprite from img/icons.png. */
  function icon({ img, icon }) {
    if (img) return `<span class="ca-icon"><span class="ca-img" style="background-image:url(${CA.Util.res(img)})"></span></span>`;
    const [x, y] = icon || CA.ICON;
    return `<span class="ca-icon"><span class="ca-sprite" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-x * 48}px ${-y * 48}px"></span></span>`;
  }

  /** On/off switch. `attrs` is extra attribute text (data-ca etc.). */
  function toggle(on, attrs, label) {
    return (
      `<button type="button" class="ca-switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(label || '')}" ${attrs}>` +
      '<span class="ca-switch-track"><span class="ca-switch-knob"></span></span>' +
      '</button>'
    );
  }

  /** Hotkey chip: click to rebind, small × to clear. */
  function hotkey(actionId) {
    return (
      `<span class="ca-hotkey" data-hotkey="${esc(actionId)}">` +
      `<button type="button" class="ca-key" data-ca="bind" data-action="${esc(actionId)}" title="Click, then press a key to rebind"></button>` +
      `<button type="button" class="ca-key-clear" data-ca="unbind" data-action="${esc(actionId)}" title="Remove hotkey">&times;</button>` +
      '</span>'
    );
  }

  function button(label, attrs, extraClass = '') {
    return `<button type="button" class="ca-btn ${extraClass}" ${attrs}>${label}</button>`;
  }

  /** Card header: optional leading icon (from ui/icons.js), title, optional right-hand `meta` HTML. */
  function cardHead(title, iconName, meta = '') {
    const ico = iconName ? CA.UI.Icons.html(iconName, 15, 'ca-card-ico') : '';
    return `<div class="ca-card-head"><div class="ca-card-title">${ico}${title}</div>${meta}</div>`;
  }

  return { icon, toggle, hotkey, button, cardHead, esc };
})();

// ---- src/ui/icons.js -------------------------------------------------
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
    calendar: '<path d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3zM5 9v10h14V9zm2 2h3v3H7z"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/>' + stroke('M12 7v5l3 3'),
    filter: '<path d="M3 4h18l-7 8.5V20l-4-2v-5.5z"/>',
    sparkle: '<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/>',
    trophy: '<path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.4A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.4 12H8a4 4 0 0 1-4-4V5h3zm0 4H6v1a2 2 0 0 0 1 1.7zm10 0v2.7A2 2 0 0 0 18 8V7z"/>',
    wrinkler: '<path d="M12 3c-4 0-7 3-7 7 0 3 1.6 5.4 4 6.6V21h2v-3.6h2V21h2v-4.4c2.4-1.2 4-3.6 4-6.6 0-4-3-7-7-7zm-3 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill-rule="evenodd"/>',
    lump: '<path d="M12 2l7 4.5v9L12 22l-7-6.5v-9z" opacity=".9"/><path d="M12 2v20M5 6.5l14 9M19 6.5l-14 9" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/>' + stroke('M15 15l5.5 5.5'),
    building: '<path d="M3 21V10l6-4v4l6-4v4l6-4v15zm4-3h2v-3H7zm4 0h2v-3h-2zm4 0h2v-3h-2z" fill-rule="evenodd"/>',
    pantheon: '<path d="M12 2 2 7v2h20V7zM4 10h3v8H4zm6.5 0h3v8h-3zM17 10h3v8h-3zM2 19h20v3H2z"/>',
    leaf: '<path d="M20 3c-9 0-15 4-15 11 0 1.6.4 3 1 4.2L3 21l1.4 1.4 3-3C8.6 20.4 10.3 21 12 21c6 0 9-6 8-18zM8 17c2-4 5-7 9-9-3 2.5-6 5.5-9 9z"/>',
    upgrade: '<path d="M4 4h16v16H4zm8 3-5 5h3v5h4v-5h3z" fill-rule="evenodd"/>',
    timeline: stroke('M3 12h4M10 12h4M17 12h4') + '<circle cx="8.5" cy="12" r="1.5"/><circle cx="15.5" cy="12" r="1.5"/>',
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

// ---- src/ui/pages.js -------------------------------------------------
// Registry of CookieMgr pages (one sidebar entry each). A page is
//   { id, label, icon, order, html(), mount(root), unmount(), tick() }
// html() returns the page markup; mount/unmount/tick are optional lifecycle hooks for pages
// with live parts (charts, logs). The panel (ui/menu.js) and the sidebar (ui/tab.js) both read
// this list, so adding a page is just one register() call from the page's own module.

CA.UI = CA.UI || {};

CA.UI.Pages = (() => {
  const pages = [];
  const noop = () => {};

  function register(page) {
    if (pages.some((p) => p.id === page.id)) throw new Error(`Page "${page.id}" already registered`);
    pages.push({ order: 100, icon: '', mount: noop, unmount: noop, tick: noop, ...page });
    pages.sort((a, b) => a.order - b.order);
  }

  const list = () => pages.slice();
  const get = (id) => pages.find((p) => p.id === id) || null;

  return { register, list, get };
})();

// ---- src/ui/chart.js -------------------------------------------------
// Shared pieces for every canvas time-series chart (CA.UI.Graph, CA.UI.StockGraph):
// DPI-aware canvas sizing, a left margin sized to whatever the
// axis labels actually render as, absolute-grid time bucketing, and a scrollable "view" that
// tracks whether a chart is following the live edge or has been dragged/paused into the past.
//
// Bucketing note: bucket boundaries are aligned to absolute multiples of `bucketMs` since the
// epoch, not to the current window's start. If they were window-relative, every tick of live
// tracking (or every pixel of panning) shifts the window start, which reshuffles which raw
// samples fall into which bucket — bars visibly snap to new heights even though nothing
// happened. Anchoring to an absolute grid means a bucket's membership never changes; panning or
// time passing only changes which already-settled buckets are in view.

CA.UI = CA.UI || {};

CA.UI.Chart = (() => {
  function fitCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  /** Left-margin width that fits `tickLabels` as rendered in `font`, clamped to a sane minimum. */
  function dynamicPadLeft(ctx, font, tickLabels, minPad, margin) {
    const w = CA.Util.maxTextWidth(ctx, font, tickLabels);
    return Math.max(minPad, Math.round(w) + margin);
  }

  /** Rounds `raw` up to a "nice" step: 1, 2, or 5 × a power of ten. */
  function niceStep(raw) {
    if (!(raw > 0) || !isFinite(raw)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }

  /**
   * A linear y-scale with "nice" round ticks (1/2/5×10^n steps, e.g. 0, 50, 100, 150) instead of
   * raw evenly-spaced fractions of the data range (e.g. 3.2, 54.7, 106.2, 157.7) — clean-looking
   * axis numbers rather than ones that happen to fall wherever the data's min/max do. Pads the
   * range a little first so points aren't flush against the plot edges, and handles negative
   * values (unlike a chart that always floors at zero).
   */
  function niceLinearScale(minV, maxV, targetTicks) {
    targetTicks = targetTicks || 4;
    if (!isFinite(minV) || !isFinite(maxV)) {
      minV = 0;
      maxV = 10;
    }
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const pad = (maxV - minV) * 0.08;
    const step = niceStep((maxV - minV + pad * 2) / targetTicks);
    const yMin = Math.floor((minV - pad) / step) * step;
    const yMax = Math.ceil((maxV + pad) / step) * step;
    const ticks = [];
    for (let v = yMin; v <= yMax + step * 0.0001; v += step) ticks.push(v);
    return { yMin, yMax, ticks };
  }

  /**
   * Buckets `list` (indexed 0..list.length-1) into fixed-width, absolute-grid time slices.
   * `valueFns` is `{ seriesKey: (i) => number, ... }` — one or more parallel series computed
   * per sample index. Only buckets overlapping [t0, t1] are returned, sorted oldest-first; a
   * bucket with zero samples simply doesn't appear (a gap), rather than being interpolated.
   */
  function alignedBuckets(list, valueFns, t0, t1, bucketMs) {
    const buckets = new Map();
    const keys = Object.keys(valueFns);
    list.forEach((s, i) => {
      const idx = Math.floor(s.t / bucketMs);
      let b = buckets.get(idx);
      if (!b) {
        b = { idx, n: 0, sums: {} };
        keys.forEach((k) => (b.sums[k] = 0));
        buckets.set(idx, b);
      }
      keys.forEach((k) => (b.sums[k] += valueFns[k](i)));
      b.n++;
    });
    return [...buckets.values()]
      .filter((b) => (b.idx + 1) * bucketMs > t0 && b.idx * bucketMs < t1)
      .sort((a, b) => a.idx - b.idx)
      .map((b) => {
        const row = { t0: b.idx * bucketMs, t1: (b.idx + 1) * bucketMs, n: b.n };
        keys.forEach((k) => (row[k] = b.sums[k] / b.n));
        return row;
      });
  }

  /**
   * Tracks a chart's right edge: `null` means "follow the live edge" (advances with real time);
   * a number means frozen at that absolute time, whether from an explicit pause or from
   * dragging/scrolling away from the live edge. One of these per chart module, created once (not
   * per mount) so the view survives a tab switch.
   */
  function createView() {
    let end = null;

    const isLive = () => end === null;
    const getEnd = (liveNow) => (end === null ? liveNow : end);
    const freeze = (t) => {
      end = t;
    };
    const resume = () => {
      end = null;
    };

    /** Shifts the view by `dxPx` screen pixels (positive = drag right = look further back in
     *  time), clamped so you can't scroll past "now" or before `minT + windowMs`. Snaps back to
     *  live once you drag/scroll back up to the live edge. */
    function panByPixels(dxPx, windowMs, plotWidthPx, liveNow, minT) {
      const dtMs = (dxPx / Math.max(1, plotWidthPx)) * windowMs;
      const base = getEnd(liveNow) - dtMs;
      const floor = minT == null ? -Infinity : minT + windowMs;
      const next = Math.max(floor, Math.min(liveNow, base));
      end = next >= liveNow ? null : next;
    }

    /**
     * Wires drag-to-pan (mouse) and wheel-to-pan (horizontal wheel/trackpad, or shift+wheel;
     * plain vertical wheel is left alone so the page still scrolls normally) on `canvas`.
     * `getPanCtx()` supplies `{ windowMs, plotWidthPx, liveNow, minT }` fresh on every event,
     * since those change as the window/data do. `onChange()` runs after every pan step (redraw).
     * Returns `{ detach, isDragging }`.
     */
    function attachPan(canvas, getPanCtx, onChange) {
      let dragging = false;
      let lastX = 0;
      const onDown = (e) => {
        dragging = true;
        lastX = e.clientX;
        canvas.style.cursor = 'grabbing';
      };
      const onMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        if (Math.abs(dx) < 0.5) return;
        const { windowMs, plotWidthPx, liveNow, minT } = getPanCtx();
        panByPixels(dx, windowMs, plotWidthPx, liveNow, minT);
        onChange();
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        canvas.style.cursor = 'grab';
      };
      const onWheel = (e) => {
        const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        if (!horiz && !e.shiftKey) return; // plain vertical wheel: let the page scroll as normal
        e.preventDefault();
        const { windowMs, plotWidthPx, liveNow, minT } = getPanCtx();
        panByPixels(-(horiz ? e.deltaX : e.deltaY), windowMs, plotWidthPx, liveNow, minT);
        onChange();
      };
      canvas.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.style.cursor = 'grab';
      const detach = () => {
        canvas.removeEventListener('mousedown', onDown);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        canvas.removeEventListener('wheel', onWheel);
      };
      return { detach, isDragging: () => dragging };
    }

    return { isLive, getEnd, freeze, resume, panByPixels, attachPan };
  }

  return { fitCanvas, dynamicPadLeft, niceStep, niceLinearScale, alignedBuckets, createView };
})();

// ---- src/ui/tab.js ---------------------------------------------------
// The sidebar: a column of small icon tabs sticking out of the left beam (between the cookie
// panel and the middle panel), one per registered page (CA.UI.Pages). Hovering a tab slides its
// name out to the left. Clicking jumps straight to that page, opening the panel if it's closed;
// clicking the page that's already showing closes the panel.

CA.UI = CA.UI || {};

CA.UI.Tab = (() => {
  const BANNER_GAP = 14; // px below the game's cookie-count banner
  const PLACE_MS = 2000;
  let wrap = null;

  /** Pins the sidebar just under the game's darkened cookie-count banner (#cookies). The banner
   *  sits at 10% of the screen height and grows with its text, so a fixed offset overlaps it on
   *  taller windows; measured instead, on resize and every couple of seconds. */
  function place() {
    if (!wrap) return;
    const banner = document.getElementById('cookies');
    const host = wrap.offsetParent || wrap.parentNode;
    if (!banner || !host || !host.getBoundingClientRect) return;
    const b = banner.getBoundingClientRect();
    if (!b.height) return; // hidden (ascending) or not laid out
    const top = `${Math.round(b.bottom - host.getBoundingClientRect().top + BANNER_GAP)}px`;
    if (wrap.style.top !== top) wrap.style.top = top;
  }

  function go(id) {
    if (CA.UI.Menu.isOpen() && CA.Settings.get('tab') === id) CA.UI.Menu.close();
    else CA.UI.Menu.openPage(id);
  }

  function itemHtml(p) {
    return (
      `<div class="ca-tab-item" data-tab-item="${p.id}" role="button" tabindex="0" aria-label="${CA.Util.escapeHtml(p.label)}">` +
      `<span class="ca-tab-label">${CA.Util.escapeHtml(p.label)}</span>` +
      `<span class="ca-tab-icon">${CA.UI.Icons.html(p.icon, 18)}<span class="ca-tab-badge"></span></span>` +
      '</div>'
    );
  }

  function create() {
    wrap = document.createElement('div');
    wrap.id = 'CookieMgrTab';
    wrap.innerHTML = CA.UI.Pages.list().map(itemHtml).join('');
    wrap.addEventListener('click', (e) => {
      const item = e.target.closest('[data-tab-item]');
      if (item) go(item.dataset.tabItem);
    });
    wrap.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('[data-tab-item]');
      if (!item) return;
      e.preventDefault();
      go(item.dataset.tabItem);
    });
    (document.getElementById('game') || document.body).appendChild(wrap);
    update();
  }

  /** Small count bubble on a page's icon (e.g. running macros); 0 hides it. */
  const badges = {
    clickers: () => CA.Macros.activeCount(),
  };

  function update() {
    if (!wrap) return;
    const open = CA.UI.Menu.isOpen();
    const current = CA.Settings.get('tab');
    wrap.querySelectorAll('[data-tab-item]').forEach((item) => {
      const id = item.dataset.tabItem;
      item.classList.toggle('selected', open && current === id);
      const n = badges[id] ? badges[id]() : 0;
      const badge = item.querySelector('.ca-tab-badge');
      badge.textContent = n ? String(n) : '';
      item.classList.toggle('active', n > 0);
    });
  }

  function init() {
    create();
    place();
    addEventListener('resize', place);
    setInterval(place, PLACE_MS);
    CA.Events.on('macros', update);
    CA.Events.on('settings', update);
  }

  return { init, update, place };
})();

// ---- src/ui/plot.js --------------------------------------------------
// The plotting engine every CookieMgr chart is built on: a plot is a *technique* applied to
// recorded *states* (core/states.js, core/recorder.js). A plot spec says which states it reads
// and how to turn the recorder's frames into bars / lines / overlays; this module does the rest:
// the card + toolbar chips (persisted per plot), bucketing, scales, axes, effect bands, event
// markers, the hover tooltip, drag-to-scroll and the live/paused view.
//
//   const p = CA.UI.Plot.create({ id, title, icon, windows, build(v) { return { series, bars, lines } } });
//   page html: p.html()   mount: p.mount(pageRoot)   tick: p.tick()   unmount: p.unmount()
//
// The x axis is either wall-clock time (frame.t) or **active play time** (frame.a, see
// core/recorder.js) — the global "Active time" toggle (setting graphActiveTime). In active-time
// mode stretches where the game wasn't running simply don't exist on the axis; a thin dashed
// line marks where one was cut out, and axis labels still show the wall-clock time there.

CA.UI = CA.UI || {};

CA.UI.Plot = (() => {
  const FONT = '10px Tahoma, Arial, sans-serif';
  const PAD = { r: 8, t: 10, b: 22 };
  const MIN_PAD_L = 30;
  const PAD_L_MARGIN = 10;
  const BAR_PX = 5; // target on-screen width (bar + gap) of one bar
  const MAX_AUTO_BARS = 240;
  const BAR_GAP_FRAC = 0.18;
  const LANE_H = 12;
  const LANE_GAP = 2;
  const MAX_LANES = 6;
  const GAP_MS = 5000; // matches the recorder's MAX_GAP_MS
  const SEC = 1000;
  const SESSION_START = Date.now();
  const NICE_MS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800].map((s) => s * SEC);
  const WINDOW_LABELS = { 60: '1m', 300: '5m', 900: '15m', 3600: '1h', 10800: '3h', 43200: '12h', 86400: '1d', 604800: '7d', 0: 'All' };
  const SMOOTH = [0, 5, 15, 60, 300, 900, 3600];
  const SMOOTH_LABELS = { 0: 'Off', 5: '5s', 15: '15s', 60: '1m', 300: '5m', 900: '15m', 3600: '1h' };

  const S = () => CA.Settings;
  const esc = (s) => CA.Util.escapeHtml(s);

  // ---- formatting ------------------------------------------------------------------------

  const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  function short(v) {
    if (!isFinite(v)) return '0';
    const sign = v < 0 ? '-' : '';
    v = Math.abs(v);
    if (v < 1000) return sign + (v < 10 ? v.toFixed(v < 1 && v > 0 ? 2 : 1).replace(/\.0+$/, '') : Math.round(v));
    let i = 0;
    while (v >= 1000 && i < SUFFIX.length - 1) {
      v /= 1000;
      i++;
    }
    return sign + (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v)).toString().replace(/\.0+$/, '') + SUFFIX[i];
  }
  /** The game's own number formatter when available (full illion names, the player's Numbers preference). */
  function beautify(v, floats) {
    if (!isFinite(v)) return '0';
    if (typeof Beautify !== 'function') return short(v);
    return (v < 0 ? '-' : '') + Beautify(Math.abs(v), floats == null ? 1 : floats);
  }
  const signed = (v) => (v < 0 ? '−' : '+') + beautify(Math.abs(v));
  const two = (n) => (n < 10 ? '0' + n : '' + n);
  function clock(t, withSeconds) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}` + (withSeconds ? `:${two(d.getSeconds())}` : '');
  }
  function dayClock(t) {
    const d = new Date(t);
    return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${clock(t)}`;
  }
  function span(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${two(sec % 60)}s`;
    if (sec < 172800) return `${Math.floor(sec / 3600)}h ${two(Math.floor((sec % 3600) / 60))}m`;
    return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
  }
  const windowLabel = (s) => WINDOW_LABELS[s] || span(s);
  const swatch = (c, dash) => `<i class="ca-sw${dash ? ' ca-sw-dash' : ''}" style="${dash ? `border-color:${c}` : `background:${c}`}"></i>`;
  function row(color, name, value, strong, dash) {
    return `<div class="ca-tip-row${strong ? ' strong' : ''}">${swatch(color, dash)}<b>${esc(name)}</b><span>${esc(value)}</span></div>`;
  }
  const tile = (label, value, sub, title) =>
    `<div class="ca-stat"${title ? ` title="${esc(title)}"` : ''}><div class="ca-stat-label">${label}</div><div class="ca-stat-value">${value}</div><div class="ca-stat-sub">${sub || '&nbsp;'}</div></div>`;

  // ---- the x axis -------------------------------------------------------------------------

  const activeMode = () => !!S().get('graphActiveTime');

  /** Which clock the x axis runs on, with conversions both ways. */
  function axis() {
    const frames = CA.Recorder.frames();
    if (activeMode()) {
      return {
        key: 'a',
        now: CA.Recorder.activeNow(),
        min: frames.length ? frames[0].a - (frames[0].dt || 1) * SEC : undefined,
        tAt: CA.Recorder.timeAt,
        xAt: CA.Recorder.activeAt,
      };
    }
    return {
      key: 't',
      now: Date.now(),
      min: frames.length ? frames[0].t - (frames[0].dt || 1) * SEC : undefined,
      tAt: (x) => x,
      xAt: (t) => t,
    };
  }

  const niceUp = (ms) => NICE_MS.find((n) => n >= ms) || NICE_MS[NICE_MS.length - 1];

  // ---- bucketing --------------------------------------------------------------------------

  /**
   * Aggregates frames into bars on an absolute grid of `bucket` ms along axis `key` (so bars
   * never reshuffle as the view scrolls). Each field is combined by its state's kind: flows
   * summed, gauges dt-weighted mean, counters last value (and `first` kept, for deltas). Older
   * history is coarser than a small bucket — such a frame becomes its own, wider bar rather
   * than leaving stripes of empty buckets.
   * Bars: { x0, x1, secs (active seconds covered), t0, t1 (wall), v: { field: value }, first: {} }.
   */
  function bucketize(frames, key, x0, x1, bucket, fields) {
    const aggs = fields.map((f) => {
      const d = CA.States.get(f);
      return d ? d.agg : 'mean';
    });
    const bars = [];
    let cur = null;
    const open = (bx0, bx1, idx) => ({ idx, x0: bx0, x1: bx1, secs: 0, n: 0, t0: Infinity, t1: -Infinity, acc: fields.map(() => ({ s: 0, w: 0, c: 0, last: undefined, first: undefined })) });
    const add = (bar, f) => {
      const dt = f.dt || 0;
      bar.secs += dt;
      bar.n++;
      bar.t0 = Math.min(bar.t0, f.t - (dt || 1) * SEC);
      bar.t1 = Math.max(bar.t1, f.t);
      fields.forEach((k, i) => {
        const v = f[k];
        if (!Number.isFinite(v)) return;
        const a = bar.acc[i];
        a.s += v;
        a.w += v * dt;
        a.c += dt;
        if (a.first === undefined) a.first = v;
        a.last = v;
      });
    };
    const flush = () => {
      if (!cur) return;
      const prev = bars[bars.length - 1];
      if (prev && cur.x0 < prev.x1) cur.x0 = prev.x1;
      cur.v = {};
      cur.first = {};
      cur.cover = {}; // seconds each field was actually measured for (unknown frames don't count)
      fields.forEach((k, i) => {
        const a = cur.acc[i];
        if (a.last === undefined) return;
        cur.first[k] = a.first;
        cur.cover[k] = a.c;
        if (aggs[i] === 'sum') cur.v[k] = a.s;
        else if (aggs[i] === 'last') cur.v[k] = a.last;
        else cur.v[k] = a.c > 0 ? a.w / a.c : a.last;
      });
      delete cur.acc;
      if (cur.x1 > cur.x0) bars.push(cur);
      cur = null;
    };
    frames.forEach((f) => {
      const x = f[key];
      const w = (f.dt || 1) * SEC;
      if (!(x > x0) || x - w >= x1) return;
      if (w >= bucket * 0.99) {
        flush();
        cur = open(x - w, x, null);
        add(cur, f);
        flush();
        return;
      }
      const idx = Math.floor((x - w / 2) / bucket);
      if (!cur || cur.idx !== idx) {
        flush();
        cur = open(idx * bucket, (idx + 1) * bucket, idx);
      }
      add(cur, f);
    });
    flush();
    return bars;
  }

  /** Points for a line through bar values (at each bar's centre); `fn(bar)` → number|undefined. */
  function linePoints(bars, fn) {
    const pts = [];
    bars.forEach((b) => {
      const v = fn(b);
      if (Number.isFinite(v)) pts.push({ x: (b.x0 + b.x1) / 2, v, x0: b.x0, x1: b.x1, bar: b });
    });
    return pts;
  }

  /** Rolling mean over the previous k points (k <= 1 leaves them alone). */
  function smooth(pts, k) {
    if (k <= 1) return pts;
    let sum = 0;
    return pts.map((p, i) => {
      sum += p.v;
      if (i >= k) sum -= pts[i - k].v;
      return { ...p, v: sum / Math.min(i + 1, k) };
    });
  }

  /**
   * Centered moving average: each value becomes the weighted mean of every value whose centre
   * lies within ±half of its own centre. Weights are the active seconds each bar covers, so a
   * smoothed rate is exactly (cookies over the window) ÷ (seconds over the window). Values that
   * aren't numbers are left alone and don't count.
   */
  function movingAverage(centers, weights, values, half) {
    const n = centers.length;
    const out = new Array(n);
    let lo = 0;
    let hi = 0;
    let sw = 0;
    let swv = 0;
    for (let i = 0; i < n; i++) {
      while (hi < n && centers[hi] <= centers[i] + half) {
        if (Number.isFinite(values[hi])) {
          sw += weights[hi];
          swv += weights[hi] * values[hi];
        }
        hi++;
      }
      while (centers[lo] < centers[i] - half) {
        if (Number.isFinite(values[lo])) {
          sw -= weights[lo];
          swv -= weights[lo] * values[lo];
        }
        lo++;
      }
      out[i] = Number.isFinite(values[i]) && sw > 1e-12 ? swv / sw : values[i];
    }
    return out;
  }

  const weightOf = (b) => {
    const secs = b.raw && Number.isFinite(b.raw.secs) ? b.raw.secs : b.bar && Number.isFinite(b.bar.secs) ? b.bar.secs : b.secs;
    return secs > 0 ? secs : Math.max(1e-3, ((b.x1 || 0) - (b.x0 || 0)) / SEC) || 1;
  };

  /** Applies a centered moving average of `ms` to every bar series and line in `data`. */
  function smoothData(data, ms) {
    const half = ms / 2;
    const series = data.series || [];
    const bars = data.bars || [];
    if (bars.length) {
      const centers = bars.map((b) => (b.x0 + b.x1) / 2);
      const weights = bars.map(weightOf);
      series
        .filter((s) => s.type === 'bar' && s.smooth !== false)
        .forEach((s) => {
          const out = movingAverage(centers, weights, bars.map((b) => b.parts[s.key]), half);
          bars.forEach((b, i) => {
            if (Number.isFinite(out[i])) b.parts[s.key] = out[i];
          });
        });
    }
    const lines = data.lines || {};
    series
      .filter((s) => (s.type === 'line' || s.type === 'area') && s.smooth !== false && lines[s.key])
      .forEach((s) => {
        const pts = lines[s.key];
        const out = movingAverage(
          pts.map((p) => p.x),
          pts.map(weightOf),
          pts.map((p) => p.v),
          half
        );
        lines[s.key] = pts.map((p, i) => ({ ...p, v: out[i] }));
      });
  }

  /** Round tick values inside [lo, hi] for a log axis: whole powers of ten when the range is
   *  wide, 1-2-5 or finer steps as it narrows, evenly spaced round numbers when very narrow. */
  function logTicks(lo, hi) {
    const SETS = [[1], [1, 3], [1, 2, 5], [1, 1.5, 2, 3, 5, 7], [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9]];
    for (const set of SETS) {
      let t = [];
      for (let d = Math.floor(Math.log10(lo)); d <= Math.ceil(Math.log10(hi)); d++) {
        set.forEach((m) => {
          const v = m * Math.pow(10, d);
          if (v >= lo && v <= hi) t.push(v);
        });
      }
      if (t.length >= 3) {
        while (t.length > 7) t = t.filter((_, i) => i % 2 === 0);
        return t;
      }
    }
    return CA.UI.Chart.niceLinearScale(lo, hi, 4).ticks.filter((v) => v >= lo && v <= hi);
  }

  /** The game's icon sheet, loaded once for drawing effect icons (null until it has loaded). */
  let sheet = null;
  function iconSheet() {
    if (!sheet && typeof Image !== 'undefined') {
      sheet = new Image();
      sheet.src = CA.Util.res('img/icons.png');
    }
    return sheet && sheet.complete && sheet.naturalWidth ? sheet : null;
  }

  /** The share of a bar's width the game was actually running for (1 when unknown). */
  function activeShare(b) {
    const raw = b.raw || b.bar || b;
    const width = ((b.x1 || 0) - (b.x0 || 0)) / SEC;
    return Number.isFinite(raw.secs) && width > 0 ? Math.min(1, raw.secs / width) : 1;
  }

  /** "% of total": each bar's parts become shares of the bar's total size (losses count by their
   *  size too, and stay below the line); lines and averages don't mean anything then, so they go. */
  function toProportions(data) {
    (data.bars || []).forEach((b) => {
      const total = Object.values(b.parts).reduce((n, v) => n + (Number.isFinite(v) ? Math.abs(v) : 0), 0);
      Object.keys(b.parts).forEach((k) => (b.parts[k] = total > 0 && Number.isFinite(b.parts[k]) ? b.parts[k] / total : 0));
    });
    data.series = (data.series || []).filter((x) => x.type === 'bar');
    data.hlines = [];
    data.zero = true;
  }

  /** Spots in [x0, x1] where active-time mode cut out a stretch of inactive time. */
  function gapsIn(frames, key, x0, x1) {
    const out = [];
    for (let i = 1; i < frames.length; i++) {
      const f = frames[i];
      const p = frames[i - 1];
      const wall = f.t - p.t;
      const act = f.a - p.a;
      if (wall - act > GAP_MS && f[key] > x0 && p[key] < x1) out.push({ x: p[key], away: wall - act, from: p.t, to: f.t });
    }
    return out;
  }

  // ---- one plot -----------------------------------------------------------------------------

  const all = new Map(); // id -> instance

  /**
   * spec: {
   *   id, title, icon, height (px, default 220), note (HTML under the title),
   *   windows: [seconds…] (0 = all history), window: default seconds,
   *   smooth: default centered moving average in seconds (0 = off) — every plot gets a Smooth
   *           chooser; false for plots where averaging makes no sense (running totals, …).
   *           A series with smooth: false is left alone.
   *   toggles: [{ key, label, title, default }]          boolean chips, read with v.opt(key)
   *   choices: [{ key, label, options: [{ v, label }], default }]   one-of chips, v.opt(key)
   *   log: true|false to offer a log-scale chip (and its default); omit for linear only
   *   build(v) → { series: [{ key, name, color, type: 'bar'|'line'|'area', dash, width }],
   *                bars: [{ x0, x1, parts: { key: value }, … }], lines: { key: [{ x, v }] },
   *                hlines: [{ v, label, color }], intervals: [{ x0, x1, color, label, tip() }],
   *                markers: [{ x, color, line, tip() }], empty: 'text', zero: true }
   *   stats(v, data) → HTML (tiles above the chart), footer(v, data) → HTML (below the legend)
   *   tip(bar, v, data) → extra tooltip HTML for a hovered bar
   *   fmt(value) → string for axis/tooltip values (default: beautify), unit: suffix for the tooltip
   * }
   */
  function create(spec) {
    const id = spec.id;
    // settingsOf: use another chart's window / smoothing / log choices (charts that belong together)
    const key = (k) => `plot.${spec.settingsOf || id}.${k}`;
    const height = spec.height || 220;
    const baseFmt = spec.fmt || ((v) => beautify(v, 0));
    const baseTipFmt = spec.tipFmt || ((v) => beautify(v) + (spec.unit || ''));
    const pct = (v) => `${Math.round(v * 1000) / 10}%`;
    // switched to percentages while "% of total" is on (set at the start of each draw)
    let fmt = baseFmt;
    let tipFmt = baseTipFmt;

    // persisted per-plot choices (kept out of the generic Settings list)
    const def = (k, d) => S().optionsIn('plot').some((o) => o.key === key(k)) || S().defineOption({ key: key(k), group: 'plot', name: k, desc: '', default: d });
    def('win', spec.window != null ? spec.window : (spec.windows || [300])[0]);
    if (spec.smooth !== false) def('smooth', spec.smooth || 0);
    if (spec.stacked) def('prop', false);
    if (spec.log != null) def('log', !!spec.log);
    // a toggle with `setting` binds an existing global option instead of a per-plot one
    (spec.toggles || []).forEach((t) => !t.setting && def(t.key, !!t.default));
    (spec.choices || []).forEach((c) => def(c.key, c.default));

    const view = CA.UI.Chart.createView();
    let root = null;
    let canvas = null;
    let ctx = null;
    let tipEl = null;
    let observer = null;
    let panCtl = null;
    let hover = null;
    let padL = 54;
    let layout = null;
    let lastData = null;

    const opt = (k) => S().get(key(k));
    function windowMs(ax) {
      const s = opt('win');
      if (s > 0) return s * SEC;
      const min = ax.min;
      return min == null ? 60 * SEC : Math.max(60 * SEC, ax.now - min);
    }

    // ---- html ----

    function chip(label, attrs, title) {
      return `<button type="button" class="ca-chip" ${attrs}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
    }
    const setChip = (k, val, label, title) =>
      chip(label, `data-plot-set="${key(k)}" data-val="${esc(String(val))}" data-pressed-key="${key(k)}" data-pressed-val="${esc(String(val))}"`, title);
    const boolChip = (fullKey, label, title) => chip(label, `data-plot-toggle="${fullKey}" data-pressed-key="${fullKey}"`, title);

    function html() {
      const wins = spec.windows || [300];
      let h =
        `<div class="ca-card ca-graph-card" data-plot="${id}">` +
        CA.UI.C.cardHead(spec.title, spec.icon, '<div class="ca-card-meta"><span class="ca-live" data-plot-live></span></div>') +
        (spec.note ? `<div class="ca-card-note">${spec.note}</div>` : '') +
        (spec.stats ? '<div class="ca-stats" data-plot-stats></div>' : '') +
        '<div class="ca-toolbar">' +
        `<div class="ca-chipgroup" title="How much history to show">${wins.map((s) => setChip('win', s, windowLabel(s))).join('')}</div>` +
        (spec.toggleGroups || [])
          .map(
            (g) =>
              `<div class="ca-chipgroup ca-togglegroup">${g.label ? `<span class="ca-chip-label">${esc(g.label)}</span>` : ''}` +
              g.toggles
                .map((t) =>
                  chip(
                    (t.color ? `<i class="ca-sw" style="background:${t.color}"></i>` : '') + t.label,
                    `data-plot-toggle="${t.setting}" data-pressed-key="${t.setting}"`,
                    t.title
                  )
                )
                .join('') +
              '</div>'
          )
          .join('') +
        (spec.choices || [])
          .map(
            (c) =>
              `<div class="ca-chipgroup">${c.label ? `<span class="ca-chip-label">${esc(c.label)}</span>` : ''}` +
              c.options.map((o) => setChip(c.key, o.v, o.label, o.title)).join('') +
              '</div>'
          )
          .join('') +
        '</div>' +
        `<div class="ca-graph-wrap"><canvas class="ca-graph" style="height:${height}px" data-plot-canvas></canvas><div class="ca-tip" data-plot-tip></div></div>` +
        '<div class="ca-toolbar ca-toolbar-bottom">';
      if (spec.smooth !== false) {
        h +=
          '<div class="ca-chipgroup" title="Centered moving average: each point becomes the average of the stretch of time around it">' +
          '<span class="ca-chip-label">Smooth</span>' +
          SMOOTH.map((s) => setChip('smooth', s, SMOOTH_LABELS[s])).join('') +
          '</div>';
      }
      h += '<div class="ca-chipgroup">';
      if (spec.log != null) h += boolChip(key('log'), 'Log scale', 'Logarithmic vertical axis — handy when values grow by orders of magnitude');
      if (spec.stacked) h += boolChip(key('prop'), '% of total', 'Show each bar as shares of its total instead of amounts');
      (spec.toggles || []).forEach((t) => (h += boolChip(t.setting || key(t.key), t.label, t.title)));
      h += boolChip('graphActiveTime', `${CA.UI.Icons.html('clock', 12)} Active time`, 'Leave out time the game wasn’t running (closed, asleep, background tab) — the window then covers that much actual play');
      h += '</div>';
      h += `<div class="ca-chipgroup">${chip('', 'data-plot-pause', 'Drag the chart (or scroll it sideways) to look further back')}</div>`;
      h += '</div>';
      h += '<div class="ca-legend" data-plot-legend></div>';
      if (spec.footer) h += '<div data-plot-footer></div>';
      h += '</div>';
      return h;
    }

    // ---- data ----

    function viewFor(plotW) {
      const ax = axis();
      const W = windowMs(ax);
      const x1 = view.getEnd(ax.now);
      const x0 = x1 - W;
      // bars only as wide as the screen needs; coarseness comes from smoothing, not wider bars
      const bucket = niceUp(W / Math.max(12, Math.min(MAX_AUTO_BARS, Math.round(plotW / BAR_PX))));
      const frames = CA.Recorder.frames();
      const lo = Math.max(0, CA.Recorder.lowerBound(x0, ax.key) - 1);
      const hi = Math.min(frames.length, CA.Recorder.lowerBound(x1, ax.key) + 1);
      const v = {
        key: ax.key,
        active: ax.key === 'a',
        x0,
        x1,
        W,
        now: ax.now,
        live: view.isLive(),
        bucket,
        smoothMs: spec.smooth !== false ? (opt('smooth') || 0) * SEC : 0,
        frames: frames.slice(lo, hi),
        tAt: ax.tAt,
        xAt: ax.xAt,
        opt,
        bucketize: (fields, b) => bucketize(v.frames, ax.key, x0, x1, b || bucket, fields),
        /** Same, but starting at `from` (< x0) — for plots that look back before the window. */
        bucketizeFrom: (fields, from) => {
          const lo2 = Math.max(0, CA.Recorder.lowerBound(from, ax.key) - 1);
          return bucketize(frames.slice(lo2, hi), ax.key, from, x1, bucket, fields);
        },
      };
      return v;
    }

    // ---- drawing ----

    function draw() {
      if (!canvas || !canvas.isConnected) return;
      const { w, h } = CA.UI.Chart.fitCanvas(canvas, ctx);
      if (w < 50 || h < 50) return;
      ctx.clearRect(0, 0, w, h);

      const v = viewFor(Math.max(50, w - padL - PAD.r));
      const data = spec.build(v) || {};
      if (v.smoothMs > 0) smoothData(data, v.smoothMs);
      const prop = !!(spec.stacked && opt('prop'));
      fmt = prop ? pct : baseFmt;
      tipFmt = prop ? pct : baseTipFmt;
      if (prop) toProportions(data);
      lastData = { v, data };
      const series = data.series || [];
      const byKey = {};
      series.forEach((s) => (byKey[s.key] = s));
      const bars = data.bars || [];
      const lines = data.lines || {};
      const barSeries = series.filter((s) => s.type === 'bar');
      const log = spec.log != null && opt('log') && !prop;

      // effect lanes (bottom of the plot)
      const ivs = (data.intervals || []).filter((iv) => iv.x1 > v.x0 && iv.x0 < v.x1);
      const lanes = assignLanes(ivs);
      const laneCount = Math.min(MAX_LANES, lanes.count);
      const lanesH = laneCount ? laneCount * (LANE_H + LANE_GAP) + 2 : 0;

      // y range
      let maxV = -Infinity;
      let minV = Infinity;
      let minPos = Infinity; // smallest positive bar *total* / line value — what a log axis fits
      const see = (val, fit = true) => {
        if (!Number.isFinite(val)) return;
        if (val > maxV) maxV = val;
        if (val < minV) minV = val;
        if (fit && val > 0 && val < minPos) minPos = val;
      };
      bars.forEach((b) => {
        let pos = 0;
        let neg = 0;
        barSeries.forEach((s) => {
          const val = b.parts[s.key];
          if (!Number.isFinite(val)) return;
          if (val >= 0) pos += val;
          else neg += val;
          if (val > 0) see(val, false); // a thin slice on top mustn't drag a log axis down
        });
        // a bar that mostly covers time the game wasn't running mustn't set a log axis's floor —
        // it just gets trimmed at the bottom
        see(pos, activeShare(b) >= 0.5);
        see(neg);
      });
      // only lines actually drawn count — a hidden one (e.g. Net with Losses off) mustn't hold the axis
      series
        .filter((s) => (s.type === 'line' || s.type === 'area') && !s.noScale && lines[s.key])
        .forEach((s) => lines[s.key].forEach((p) => see(p.v, !p.bar || activeShare(p) >= 0.5)));
      (data.hlines || []).forEach((l) => see(l.v));
      if (data.zero !== false) see(0);

      let yMin;
      let yMax;
      let ticks = [];
      // Signed log ("symlog") when a log chart has negative values: sign(v)·log10(1 + |v| / C),
      // linear-ish near zero and logarithmic beyond C, so gains and losses both read on one axis.
      let symC = 0;
      if (log && minV < 0) {
        symC = isFinite(minPos) ? minPos / 10 : 1;
        const sym = (v) => Math.sign(v) * Math.log10(1 + Math.abs(v) / symC);
        const lo = Math.min(minV, 0) * 1.08;
        const hi = Math.max(maxV, 0) * 1.08;
        yMin = lo;
        yMax = hi;
        const side = (max) => (max > symC * 2 ? logTicks(symC * 2, max) : []);
        ticks = side(-lo)
          .map((t) => -t)
          .reverse()
          .concat([0], side(hi));
        while (ticks.length > 9) ticks = ticks.filter((t, i) => t === 0 || i % 2 === 0);
        lastData.sym = sym;
      } else if (log) {
        // Fit the axis to the data instead of whole powers of ten, so the variation fills the
        // chart: just under the smallest bar total / line value, just over the largest.
        if (!isFinite(minPos)) minPos = 1;
        if (!(maxV > 0)) maxV = minPos * 10;
        yMin = minPos / 1.25;
        yMax = maxV * 1.08;
        if (yMax / yMin < 1.5) {
          const mid = Math.sqrt(yMin * yMax);
          yMin = mid / 1.25;
          yMax = mid * 1.25;
        }
        ticks = logTicks(yMin, yMax);
      } else if (!isFinite(maxV)) {
        yMin = 0;
        yMax = 10;
        ticks = [0, 5, 10];
      } else if (minV >= 0 && data.zero !== false) {
        const top = maxV > 0 ? maxV * 1.08 : 10;
        const step = CA.UI.Chart.niceStep(top / 4);
        yMin = 0;
        yMax = Math.ceil(top / step) * step;
        for (let t = 0; t <= yMax * 1.0001; t += step) ticks.push(t);
      } else {
        ({ yMin, yMax, ticks } = CA.UI.Chart.niceLinearScale(minV, maxV));
      }

      lastData.scale = { yMin, yMax, log, symlog: symC > 0, ticks }; // the axis this draw chose (debugging, tests)
      const sym = symC > 0 ? (val) => Math.sign(val) * Math.log10(1 + Math.abs(val) / symC) : null;
      padL = CA.UI.Chart.dynamicPadLeft(ctx, FONT, ticks.map(fmt), MIN_PAD_L, PAD_L_MARGIN);
      const plot = { x: padL, y: PAD.t, w: w - padL - PAD.r, h: h - PAD.t - PAD.b };
      const chartH = plot.h - lanesH - (laneCount ? 4 : 0);
      const lanesTop = plot.y + plot.h - lanesH;
      const xOf = (x) => plot.x + ((x - v.x0) / v.W) * plot.w;
      const yOf = (val) => {
        let f;
        if (sym) f = (sym(val) - sym(yMin)) / (sym(yMax) - sym(yMin) || 1);
        else if (log) f = (Math.log10(Math.max(val, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin));
        else f = (val - yMin) / (yMax - yMin || 1);
        return plot.y + chartH - Math.max(0, Math.min(1, f)) * chartH;
      };

      // background
      const bg = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
      bg.addColorStop(0, 'rgba(255,255,255,0.045)');
      bg.addColorStop(1, 'rgba(255,255,255,0.01)');
      ctx.fillStyle = bg;
      ctx.fillRect(plot.x, plot.y, plot.w, plot.h);

      // effect shading
      const hoverIv = layout && layout.hoverIv;
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y, plot.w, plot.h);
      ctx.clip();
      ivs.forEach((iv) => {
        const a = Math.max(plot.x, xOf(iv.x0));
        const b = Math.min(plot.x + plot.w, xOf(iv.x1));
        if (b <= a) return;
        ctx.globalAlpha = iv === hoverIv ? 0.3 : 0.13;
        ctx.fillStyle = iv.color;
        ctx.fillRect(a, plot.y, b - a, plot.h);
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // y grid + labels
      ctx.font = FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.lineWidth = 1;
      ticks.forEach((t) => {
        const y = Math.round(yOf(t)) + 0.5;
        ctx.strokeStyle = t === 0 && yMin < 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.09)';
        ctx.beginPath();
        ctx.moveTo(plot.x, y);
        ctx.lineTo(plot.x + plot.w, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(230,220,200,0.75)';
        ctx.fillText(fmt(t), plot.x - 6, y);
      });

      drawXAxis(plot, v, xOf);

      // bars
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y - 4, plot.w, chartH + 8);
      ctx.clip();
      const y0 = yOf(log && !sym ? yMin : Math.max(yMin, Math.min(yMax, 0)));
      const hoverBar = layout && layout.hoverBar;
      bars.forEach((b) => {
        const xL = xOf(b.x0);
        const xR = xOf(b.x1);
        const full = xR - xL;
        const gap = full > 3 ? full * BAR_GAP_FRAC : 0;
        const bx = xL + gap / 2;
        const bw = Math.max(1, full - gap);
        let pos = 0;
        let neg = 0;
        barSeries.forEach((s) => {
          const val = b.parts[s.key];
          if (!Number.isFinite(val) || val === 0) return;
          let ya;
          let yb;
          if (val > 0) {
            ya = pos === 0 ? y0 : yOf(pos);
            pos += val;
            yb = yOf(pos);
          } else {
            ya = neg === 0 ? y0 : yOf(neg);
            neg += val;
            yb = yOf(neg);
          }
          ctx.fillStyle = s.color;
          ctx.globalAlpha = hoverBar && hoverBar !== b ? 0.8 : 1;
          ctx.fillRect(bx, Math.min(ya, yb), bw, Math.abs(yb - ya));
        });
      });
      ctx.globalAlpha = 1;

      // lines / areas
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      series
        .filter((s) => s.type === 'line' || s.type === 'area')
        .forEach((s) => {
          const pts = lines[s.key] || [];
          segments(pts, v.bucket).forEach((seg) => {
            if (!seg.length) return;
            ctx.beginPath();
            seg.forEach((p, i) => (i ? ctx.lineTo(xOf(p.x), yOf(p.v)) : ctx.moveTo(xOf(p.x), yOf(p.v))));
            if (seg.length === 1) ctx.lineTo(xOf(seg[0].x) + 0.01, yOf(seg[0].v));
            if (s.type === 'area') {
              ctx.save();
              ctx.lineTo(xOf(seg[seg.length - 1].x), y0);
              ctx.lineTo(xOf(seg[0].x), y0);
              ctx.closePath();
              ctx.globalAlpha = 0.18;
              ctx.fillStyle = s.color;
              ctx.fill();
              ctx.restore();
              ctx.beginPath();
              seg.forEach((p, i) => (i ? ctx.lineTo(xOf(p.x), yOf(p.v)) : ctx.moveTo(xOf(p.x), yOf(p.v))));
            }
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width || 1.6;
            ctx.setLineDash(s.dash ? [4, 3] : []);
            ctx.stroke();
            ctx.setLineDash([]);
          });
        });
      ctx.restore();

      // horizontal reference lines (averages)
      (data.hlines || []).forEach((l) => {
        if (!Number.isFinite(l.v)) return;
        const y = Math.round(yOf(l.v)) + 0.5;
        ctx.save();
        ctx.strokeStyle = l.color || 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(plot.x, y);
        ctx.lineTo(plot.x + plot.w, y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (l.label) {
          ctx.font = 'bold 9px Tahoma, Arial, sans-serif';
          ctx.textAlign = 'left';
          const above = y - plot.y >= 12;
          ctx.textBaseline = above ? 'bottom' : 'top';
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillText(l.label, plot.x + 4, y + (above ? -2 : 2));
        }
        ctx.restore();
      });

      // effect lanes
      const laneRects = [];
      ivs.forEach((iv) => {
        const lane = lanes.lanes.get(iv);
        if (lane >= MAX_LANES) return;
        const a = Math.max(plot.x, xOf(iv.x0));
        const b = Math.min(plot.x + plot.w, xOf(iv.x1));
        if (b <= a) return;
        const y = lanesTop + 2 + lane * (LANE_H + LANE_GAP);
        ctx.fillStyle = iv.color;
        ctx.globalAlpha = iv === hoverIv ? 1 : 0.85;
        roundRect(a, y, Math.max(2, b - a), LANE_H, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        // the effect's own icon (from the game's icon sheet) at the start of its lane
        let textX = a + 4;
        const img = iconSheet();
        if (iv.icon && img && b - a >= LANE_H) {
          ctx.drawImage(img, iv.icon[0] * 48, iv.icon[1] * 48, 48, 48, a + 1, y, LANE_H, LANE_H);
          textX = a + LANE_H + 3;
        }
        if (b - a > 46 && iv.label) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(a, y, b - a, LANE_H);
          ctx.clip();
          ctx.font = 'bold 9px Tahoma, Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillText(iv.label, textX, y + LANE_H / 2 + 0.5);
          ctx.restore();
        }
        laneRects.push({ iv, x0: a, x1: b, y, y1: y + LANE_H });
      });

      // cut-out inactive stretches (active-time mode)
      const gapRects = [];
      if (v.active) {
        gapsIn(v.frames, 'a', v.x0, v.x1).forEach((g) => {
          const x = Math.round(xOf(g.x)) + 0.5;
          if (x < plot.x || x > plot.x + plot.w) return;
          ctx.strokeStyle = 'rgba(255,255,255,0.28)';
          ctx.setLineDash([1, 3]);
          ctx.beginPath();
          ctx.moveTo(x, plot.y);
          ctx.lineTo(x, plot.y + chartH);
          ctx.stroke();
          ctx.setLineDash([]);
          gapRects.push({ x, g });
        });
      }

      // event markers
      const evRects = [];
      (data.markers || []).forEach((m) => {
        if (m.x < v.x0 || m.x > v.x1) return;
        const x = xOf(m.x);
        if (m.line) {
          ctx.strokeStyle = m.color;
          ctx.globalAlpha = 0.7;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(Math.round(x) + 0.5, plot.y);
          ctx.lineTo(Math.round(x) + 0.5, plot.y + plot.h);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        const y = plot.y + 7;
        ctx.fillStyle = m.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x + 4.5, y);
        ctx.lineTo(x, y + 5);
        ctx.lineTo(x - 4.5, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        evRects.push({ m, x, y });
      });

      layout = { plot, xOf, yOf, v, data, bars, laneRects, evRects, gapRects, hoverIv: null, hoverBar: null, chartH, byKey };

      const dragging = panCtl && panCtl.isDragging();
      if (!dragging && hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) drawHover(w, h);
      else if (tipEl) tipEl.style.display = 'none';

      if (!bars.length && !Object.keys(lines).some((k) => lines[k].length)) {
        ctx.fillStyle = 'rgba(230,220,200,0.6)';
        ctx.font = '12px Tahoma, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const msg = !S().get('trackHistory') ? 'History recording is off (Settings)' : data.empty || 'Collecting data…';
        ctx.fillText(msg, plot.x + plot.w / 2, plot.y + plot.h / 2);
      }
    }

    function drawXAxis(plot, v, xOf) {
      const steps = NICE_MS.filter((s) => s >= 5 * SEC);
      const stepMs = steps.find((s) => v.W / s <= Math.max(3, Math.floor(plot.w / 78))) || steps[steps.length - 1];
      const long = stepMs >= 6 * 3600 * SEC;
      ctx.font = FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      // wall-clock axis: align ticks to the local clock; active axis: evenly spaced, labelled
      // with the wall-clock time at that point
      const tz = v.active ? 0 : new Date(v.x0).getTimezoneOffset() * 60000;
      for (let x = Math.ceil((v.x0 - tz) / stepMs) * stepMs + tz; x <= v.x1; x += stepMs) {
        const px = Math.round(xOf(x)) + 0.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(px, plot.y);
        ctx.lineTo(px, plot.y + plot.h);
        ctx.stroke();
        if (px > plot.x + 16 && px < plot.x + plot.w - 16) {
          const t = v.tAt(x);
          ctx.fillStyle = 'rgba(230,220,200,0.7)';
          ctx.fillText(long ? dayClock(t) : clock(t, stepMs < 60 * SEC), px, plot.y + plot.h + 7);
        }
      }
    }

    function segments(pts, bucket) {
      const out = [];
      let cur = [];
      const maxGap = Math.max(GAP_MS, bucket * 1.6);
      pts.forEach((p, i) => {
        if (i && (p.x0 != null && pts[i - 1].x1 != null ? p.x0 - pts[i - 1].x1 > maxGap : p.x - pts[i - 1].x > maxGap * 2)) {
          out.push(cur);
          cur = [];
        }
        cur.push(p);
      });
      if (cur.length) out.push(cur);
      return out;
    }

    function assignLanes(ivs) {
      const sorted = ivs.slice().sort((a, b) => a.x0 - b.x0);
      const ends = [];
      const lanes = new Map();
      sorted.forEach((iv) => {
        let lane = ends.findIndex((e) => e <= iv.x0);
        if (lane === -1) lane = ends.length;
        ends[lane] = iv.x1;
        lanes.set(iv, lane);
      });
      return { lanes, count: ends.length };
    }

    function roundRect(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // ---- hover ----

    function nearest(pts, x) {
      let lo = 0;
      let hi = pts.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (pts[mid].x < x) lo = mid + 1;
        else hi = mid;
      }
      if (lo > 0 && (lo >= pts.length || x - pts[lo - 1].x < pts[lo].x - x)) lo--;
      return pts[lo];
    }

    function drawHover(w, h) {
      const L = layout;
      const { plot, v, data } = L;
      const x = v.x0 + ((hover.x - plot.x) / plot.w) * v.W;
      const hitEv = L.evRects.find((r) => Math.abs(r.x - hover.x) < 7 && Math.abs(r.y - hover.y) < 9);
      const hitLane = L.laneRects.find((r) => hover.x >= r.x0 && hover.x <= r.x1 && hover.y >= r.y - 1 && hover.y <= r.y1 + 1);
      const hitGap = L.gapRects.find((r) => Math.abs(r.x - hover.x) < 3);
      const bar = L.bars.find((b) => x >= b.x0 && x < b.x1) || null;
      L.hoverIv = hitLane ? hitLane.iv : null;
      L.hoverBar = !hitEv && !hitLane ? bar : null;

      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(hover.x) + 0.5, plot.y);
      ctx.lineTo(Math.round(hover.x) + 0.5, plot.y + plot.h);
      ctx.stroke();

      let html;
      if (hitEv) html = hitEv.m.tip ? hitEv.m.tip() : '';
      else if (hitLane) html = hitLane.iv.tip ? hitLane.iv.tip() : esc(hitLane.iv.label || '');
      else if (hitGap) {
        const g = hitGap.g;
        html =
          `<div class="ca-tip-head">Not running<span>${clock(g.from)} – ${clock(g.to)}</span></div>` +
          `<div class="ca-tip-note">${span(g.away / SEC)} without the game running, left out of this axis.</div>`;
      } else html = barTip(x, bar);

      // hover dots on lines
      (data.series || [])
        .filter((s) => s.type === 'line' || s.type === 'area')
        .forEach((s) => {
          const pts = (data.lines || {})[s.key] || [];
          const p = pts.length ? nearest(pts, x) : null;
          if (!p || Math.abs(L.xOf(p.x) - hover.x) > 24) return;
          ctx.fillStyle = s.color;
          ctx.strokeStyle = '#000';
          ctx.beginPath();
          ctx.arc(L.xOf(p.x), L.yOf(p.v), 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

      tipEl.innerHTML = html;
      tipEl.style.display = html ? 'block' : 'none';
      if (!html) return;
      const tw = tipEl.offsetWidth;
      const th = tipEl.offsetHeight;
      let left = hover.x + 16;
      if (left + tw > w - 4) left = hover.x - tw - 16;
      let top = hover.y + 12;
      if (top + th > h) top = Math.max(2, h - th - 2);
      tipEl.style.left = Math.max(2, left) + 'px';
      tipEl.style.top = top + 'px';
    }

    function barTip(x, bar) {
      const { v, data } = layout;
      const t = bar ? v.tAt(bar.x1) : v.tAt(x);
      const width = bar ? (bar.x1 - bar.x0) / SEC : 0;
      const when = bar && width >= 2 ? `${clock(v.tAt(bar.x0), width < 120)} – ${clock(t, width < 120)}` : clock(t, true);
      const ago = (Date.now() - t) / SEC;
      let h = `<div class="ca-tip-head">${when}<span>${ago > 1.5 ? span(ago) + ' ago' : 'now'}</span></div>`;
      let any = false;
      const barSeries = (data.series || []).filter((s) => s.type === 'bar');
      let total = 0;
      let parts = 0;
      if (bar) {
        barSeries.forEach((s) => {
          const val = bar.parts[s.key];
          if (!Number.isFinite(val) || (val === 0 && s.hideZero !== false)) return;
          h += row(s.color, s.name, tipFmt(val));
          total += val;
          parts++;
          any = true;
        });
        if (parts > 1 && spec.total !== false) h += row('transparent', spec.totalLabel || 'Total', tipFmt(total), true);
      }
      (data.series || [])
        .filter((s) => s.type === 'line' || s.type === 'area')
        .forEach((s) => {
          const pts = (data.lines || {})[s.key] || [];
          const p = pts.length ? nearest(pts, x) : null;
          if (!p || Math.abs(p.x - x) > Math.max(v.bucket * 1.5, 3 * SEC)) return;
          h += row(s.color, s.name, (s.fmt || tipFmt)(p.v), false, s.dash);
          any = true;
        });
      if (spec.tip) {
        const extra = spec.tip(bar, v, data, x);
        if (extra) {
          h += extra;
          any = true;
        }
      }
      if (!any) h += '<div class="ca-tip-note">No data here.</div>';
      else if (v.smoothMs > 0) h += `<div class="ca-tip-note">Averaged over the ${windowLabel(v.smoothMs / SEC)} around this point</div>`;
      return h;
    }

    // ---- info ----

    function refreshInfo() {
      if (!root) return;
      const live = root.querySelector('[data-plot-live]');
      if (live) {
        live.textContent = view.isLive() ? 'Live' : 'Paused';
        live.classList.toggle('paused', !view.isLive());
      }
      const pause = root.querySelector('[data-plot-pause]');
      if (pause) pause.textContent = view.isLive() ? 'Pause' : 'Jump to live';
      if (!lastData) return;
      const { v, data } = lastData;
      const stats = root.querySelector('[data-plot-stats]');
      if (stats && spec.stats) stats.innerHTML = spec.stats(v, data);
      const footer = root.querySelector('[data-plot-footer]');
      if (footer && spec.footer) footer.innerHTML = spec.footer(v, data);
      const legend = root.querySelector('[data-plot-legend]');
      if (legend) {
        const items = (data.legend || data.series || []).filter((s) => !s.noLegend);
        legend.innerHTML =
          items.map((s) => `<span class="ca-legend-item">${swatch(s.color, s.dash)}${esc(s.name)}</span>`).join('') +
          (data.legendExtra || '');
      }
    }

    function tick() {
      if (!root) return;
      if (!root.isConnected) {
        unmount();
        return;
      }
      draw();
      refreshInfo();
    }

    function onClick(e) {
      const set = e.target.closest('[data-plot-set]');
      const tog = e.target.closest('[data-plot-toggle]');
      const pause = e.target.closest('[data-plot-pause]');
      if (!set && !tog && !pause) return;
      e.stopPropagation();
      if (e.target.blur) e.target.blur();
      CA.Util.sound('snd/tick.mp3');
      if (set) {
        const k = set.dataset.plotSet;
        const cur = S().get(k);
        const raw = set.dataset.val;
        S().set(k, typeof cur === 'number' ? Number(raw) : raw);
        if (k === key('win')) view.resume();
      } else if (tog) {
        S().set(tog.dataset.plotToggle, !S().get(tog.dataset.plotToggle));
      } else {
        setPaused(view.isLive());
      }
      tick();
    }

    function mount(pageRoot) {
      unmount();
      root = pageRoot.querySelector(`[data-plot="${id}"]`);
      if (!root) return;
      canvas = root.querySelector('[data-plot-canvas]');
      tipEl = root.querySelector('[data-plot-tip]');
      ctx = canvas.getContext('2d');
      root.addEventListener('click', onClick);
      canvas.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        hover = { x: e.clientX - r.left, y: e.clientY - r.top };
        const before = layout && (layout.hoverIv || layout.hoverBar);
        draw();
        if (layout && (layout.hoverIv || layout.hoverBar) !== before) draw();
      });
      canvas.addEventListener('mouseleave', () => {
        hover = null;
        if (layout) layout.hoverIv = layout.hoverBar = null;
        draw();
      });
      if (window.ResizeObserver) {
        observer = new ResizeObserver(() => draw());
        observer.observe(canvas);
      }
      panCtl = view.attachPan(
        canvas,
        () => {
          const ax = axis();
          return { windowMs: windowMs(ax), plotWidthPx: (layout && layout.plot.w) || canvas.clientWidth, liveNow: ax.now, minT: ax.min };
        },
        draw
      );
      tick();
    }

    function unmount() {
      if (observer) observer.disconnect();
      observer = null;
      if (panCtl) panCtl.detach();
      panCtl = null;
      if (root) root.removeEventListener('click', onClick);
      root = canvas = ctx = tipEl = null;
      hover = null;
      layout = null;
    }

    function setPaused(p) {
      if (p === !view.isLive()) return;
      if (p) view.freeze(axis().now);
      else view.resume();
    }

    const inst = {
      id,
      spec,
      html,
      mount,
      unmount,
      tick,
      draw,
      setPaused,
      isPaused: () => !view.isLive(),
      isMounted: () => !!root,
      resume: () => view.resume(),
      last: () => lastData,
    };
    all.set(id, inst);
    return inst;
  }

  // Switching between wall-clock and active time invalidates every frozen view position.
  function init() {
    S().defineOption({
      key: 'graphActiveTime',
      group: 'graph',
      icon: 'clock',
      name: 'Active time only',
      desc: 'Graphs leave out time the game wasn’t running (closed, asleep, background tab) — a 1h window then covers an hour of actual play.',
      default: false,
    });
    CA.Events.on('settings', (k) => {
      if (k === 'graphActiveTime' || k === null) all.forEach((p) => p.resume());
      all.forEach((p) => p.isMounted() && p.tick());
    });
  }

  return {
    init,
    create,
    get: (id) => all.get(id),
    bucketize,
    movingAverage,
    logTicks,
    linePoints,
    smooth,
    axis,
    fmt: { beautify, signed, short, clock, span, tile, row, swatch, windowLabel },
    SEC,
    SESSION_START, // "this session" = since CookieMgr was loaded in this tab
  };
})();

// ---- src/ui/graphs.js ------------------------------------------------
// The Graphs page: sub-tabs of plots (ui/plot.js) over the recorded states.
//
//   Cookies   CpS (production + clicking, unbuffed line, effects, events) with an averages table,
//             Actual CpS (what really got baked per second, by source), Cookies baked (cumulative)
//   Bank      cookies in the bank, what moved it per second (in by source / out), and cumulative
//   Prestige  prestige level if you ascended now, and levels gained per hour
//
// Sources are coloured the same everywhere: production, clicking, golden cookies & reindeer, other.

CA.UI = CA.UI || {};

CA.UI.Graphs = (() => {
  const P = () => CA.UI.Plot;
  const F = () => CA.UI.Plot.fmt;
  const S = () => CA.Settings;
  const esc = (s) => CA.Util.escapeHtml(s);
  const SEC = 1000;
  const SESSION_START = CA.UI.Plot.SESSION_START;

  const WINDOWS = [60, 300, 900, 3600, 10800, 43200, 86400, 604800, 0];
  const LONG_WINDOWS = [900, 3600, 10800, 43200, 86400, 604800, 0];

  const SOURCES = [
    { key: 'earnProduction', name: 'Production', color: '#f5c451' },
    { key: 'earnClick', name: 'Clicking', color: '#7fe08b' },
    { key: 'earnGolden', name: 'Golden cookies & reindeer', color: '#ff9f43' },
    { key: 'earnOther', name: 'Other', color: '#b39ddb' },
  ];

  // The ledger categories (features/gameStates.js): every change to the bank, in and out. Building
  // CpS and clicking also have a "boost" part — the extra from CpS effects (Frenzy, Click frenzy…).
  const CATS = [
    { id: 'build', name: 'Building CpS', icon: 'building', color: '#f5c451', boostColor: '#fff0b0', in: 'lBuild', boost: 'lBuildBoost' },
    { id: 'click', name: 'Clicking', icon: 'cookie', color: '#7fe08b', boostColor: '#d2ffd8', in: 'lClick', boost: 'lClickBoost' },
    { id: 'drops', name: 'Drops', icon: 'sparkle', color: '#ff9f43', boostColor: '#ffd9ae', outColor: '#b8651b', in: 'lDropsIn', boost: 'lDropsBoost', out: 'lDropsOut', words: ['lost'] },
    { id: 'stocks', name: 'Stock trades', icon: 'stocks', color: '#4fd6e0', outColor: '#2a8a93', in: 'lStocksIn', out: 'lStocksOut', words: ['bought', 'sold'] },
    { id: 'buildings', name: 'Buildings', icon: 'building', color: '#ff7a59', outColor: '#b8442a', in: 'lBldIn', out: 'lBldOut', words: ['bought', 'sold'] },
    { id: 'upgrades', name: 'Upgrades', icon: 'upgrade', color: '#c77dff', outColor: '#8a46c4', out: 'lUpgOut', words: ['bought'] },
    { id: 'other', name: 'Other', icon: 'puzzle', color: '#9db4cc', outColor: '#5f7590', in: 'lOtherIn', out: 'lOtherOut', words: ['out', 'in'] },
    // outside the bank — what your stocks would sell for now; off by default so the Cookie bank
    // chart stays the bank (turn it on and it becomes bank + stocks)
    { id: 'equity', name: 'Stock equity', icon: 'stocks', color: '#a6e35a', outColor: '#5e8a2a', in: 'lEquityUp', out: 'lEquityDown', words: ['down', 'up'], offByDefault: true },
  ];
  const LEDGER_FIELDS = [].concat(...CATS.map((c) => [c.in, c.boost, c.out].filter(Boolean)));
  const C_CPS = '#f5c451';
  const C_CLICK = '#7fe08b';
  const C_BASE = '#9db4cc';
  const C_SHOWN = '#ffffff';

  const TABS = [
    { id: 'cookies', label: 'Cookies', icon: 'cookie', plots: ['cps', 'actual', 'ledgerCum'] },
    { id: 'prestige', label: 'Prestige', icon: 'ascend', plots: ['prestige', 'prestigeRate'], top: () => targetCardHtml() },
  ];

  // ---- shared overlays --------------------------------------------------------------------

  function intervalTip(iv) {
    const { span, clock, row, swatch } = F();
    const end = iv.end || Date.now();
    let h = `<div class="ca-tip-head">${swatch(CA.History.colorFor(iv.name))}${esc(iv.label)}<span>${iv.end ? '' : 'active'}</span></div>`;
    if (iv.desc) h += `<div class="ca-tip-note">${esc(iv.desc)}</div>`;
    h += row('transparent', 'Effect', mults(iv));
    h += row('transparent', 'Lasted', span((end - iv.start) / SEC) + (iv.end ? '' : ' so far'));
    h += row('transparent', 'Started', clock(iv.start, true));
    if (iv.end) h += row('transparent', 'Ended', clock(iv.end, true));
    return h;
  }
  const trim = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 100) / 100);
  function mults(iv) {
    const bits = [];
    if (Math.abs(iv.multCps - 1) > 0.001) bits.push(`×${trim(iv.multCps)} CpS`);
    if (Math.abs(iv.multClick - 1) > 0.001) bits.push(`×${trim(iv.multClick)} clicks`);
    return bits.length ? bits.join(', ') : 'no CpS change';
  }

  /** Golden cookie effects active in the view, as plot intervals (shading + lanes). */
  function effects(v) {
    if (!S().get('graphEffects')) return [];
    const now = Date.now();
    return CA.History.intervalsIn(v.tAt(v.x0), v.tAt(v.x1)).map((iv) => ({
      x0: v.xAt(iv.start),
      x1: v.xAt(iv.end || now),
      color: CA.History.colorFor(iv.name),
      label: iv.label,
      icon: iv.icon,
      tip: () => intervalTip(iv),
      iv,
    }));
  }

  function eventTip(ev) {
    const { swatch, clock, row, beautify } = F();
    const type = CA.EventLog.types()[ev.type] || {};
    let h = `<div class="ca-tip-head">${swatch(type.color || '#fff')}${esc(ev.title)}<span>${clock(ev.t, true)}</span></div>`;
    if (ev.text) h += `<div class="ca-tip-note">${esc(ev.text)}</div>`;
    if (ev.type !== 'ascend' && Math.abs(ev.cookies) >= 1)
      h += row('transparent', ev.cookies >= 0 ? 'Cookies gained' : 'Cookies spent', (ev.cookies >= 0 ? '+' : '−') + beautify(Math.abs(ev.cookies)));
    return h;
  }

  /** Event markers for `types`; golden/wrath pops already visible as an effect band are skipped. */
  function markers(v, types, ivs) {
    if (!S().get('graphEvents')) return [];
    const TOL = 3 * SEC;
    return CA.EventLog.list(types)
      .filter((e) => {
        const x = v.active ? e.a : e.t;
        if (x < v.x0 || x > v.x1) return false;
        return !((e.type === 'golden' || e.type === 'wrath') && (ivs || []).some((iv) => Math.abs(iv.iv.start - e.t) < TOL));
      })
      .map((e) => ({
        x: v.active ? e.a : e.t,
        color: (CA.EventLog.types()[e.type] || {}).color || '#fff',
        line: e.type === 'ascend',
        tip: () => eventTip(e),
      }));
  }

  /** A flow as a per-second rate over the seconds it was actually measured. */
  const coverOf = (b, k) => (b.cover && b.cover[k] > 0 ? b.cover[k] : b.secs);
  const rate = (b, k) => (Number.isFinite(b.v[k]) && coverOf(b, k) > 0 ? b.v[k] / coverOf(b, k) : 0);

  function cumulativeStart(v) {
    return v.opt('from') === 'session' ? Math.max(v.x0, v.xAt(SESSION_START)) : v.x0;
  }
  const FROM = {
    key: 'from',
    label: 'From',
    default: 'session',
    options: [
      { v: 'session', label: 'This session', title: 'Since CookieMgr was loaded in this tab' },
      { v: 'window', label: 'Window start', title: 'From the left edge of the chart' },
    ],
  };

  /** dt-weighted averages of the newest `seconds` of active play (live, independent of the view). */
  function recent(seconds) {
    const frames = CA.Recorder.frames();
    const from = CA.Recorder.activeNow() - seconds * SEC;
    // each value averaged over the seconds it was actually measured (the first frame after a
    // gap has no clicking / baked figures — it mustn't count as a second of zero)
    const sum = { cps: 0, click: 0, clickRaw: 0, base: 0, clickRate: 0 };
    const secs = { cps: 0, click: 0, clickRaw: 0, base: 0, clickRate: 0 };
    let earned = 0;
    let earnedSecs = 0;
    let total = 0;
    for (let i = frames.length - 1; i >= 0 && frames[i].a > from; i--) {
      const f = frames[i];
      const dt = f.dt || 0;
      total += dt;
      Object.keys(sum).forEach((k) => {
        // frames from before v2.4 have no clickRaw: use clicking as it was
        const v = k === 'clickRaw' && !Number.isFinite(f.clickRaw) ? f.click : f[k];
        if (!Number.isFinite(v)) return;
        sum[k] += v * dt;
        secs[k] += dt;
      });
      if (Number.isFinite(f.earned)) {
        earned += f.earned;
        earnedSecs += dt;
      }
    }
    if (!total) return null;
    const per = (k) => (secs[k] ? sum[k] / secs[k] : 0);
    return { cps: per('cps'), click: per('click'), clickRaw: per('clickRaw'), base: per('base'), clickRate: secs.clickRate ? per('clickRate') : NaN, actual: earnedSecs ? earned / earnedSecs : 0, secs: total };
  }

  // ---- Cookies tab --------------------------------------------------------------------------

  const cpsPlot = () =>
    P().create({
      id: 'cps',
      title: 'Cookies per second',
      icon: 'graphs',
      windows: WINDOWS,
      window: 300,
      stacked: true,
      unit: '/s',
      smooth: 5,
      build(v) {
        const bars = v.bucketize(['cps', 'click', 'base']);
        const ivs = effects(v);
        let w = 0;
        let sum = 0;
        bars.forEach((b) => {
          if (Number.isFinite(b.v.cps)) {
            sum += b.v.cps * b.secs;
            w += b.secs;
          }
        });
        const avg = w ? sum / w : NaN;
        return {
          series: [
            { key: 'cps', name: 'Production', color: C_CPS, type: 'bar' },
            { key: 'click', name: 'Clicking', color: C_CLICK, type: 'bar' },
            { key: 'base', name: 'Unbuffed CpS', color: C_BASE, type: 'line', dash: true, width: 1.4 },
          ],
          bars: bars.map((b) => ({ x0: b.x0, x1: b.x1, parts: { cps: b.v.cps || 0, click: b.v.click || 0 }, raw: b })),
          lines: { base: P().linePoints(bars, (b) => b.v.base) },
          hlines: Number.isFinite(avg) ? [{ v: avg, label: `avg ${F().beautify(avg)}/s` }] : [],
          intervals: ivs,
          markers: markers(v, ['golden', 'wrath', 'reindeer', 'ascend'], ivs),
          legendExtra: effectLegend(ivs),
          avg,
        };
      },
      stats(v, data) {
        const { tile, beautify, clock } = F();
        const frames = v.frames.filter((f) => f[v.key] > v.x0 && f[v.key] <= v.x1);
        let peak = 0;
        let peakT = 0;
        let w = 0;
        let click = 0;
        frames.forEach((f) => {
          if ((f.cps || 0) >= peak) {
            peak = f.cps || 0;
            peakT = f.t;
          }
          click += (f.click || 0) * (f.dt || 0);
          w += f.dt || 0;
        });
        const last = CA.Recorder.frames()[CA.Recorder.frames().length - 1];
        const avg = data.avg || 0;
        const avgClick = w ? click / w : 0;
        return (
          tile('Now', beautify(last ? last.cps : 0) + '/s', last && last.click > 0.01 ? '+' + beautify(last.click) + ' from clicks' : '') +
          tile('Average', beautify(avg) + '/s', 'this window') +
          tile('Peak', beautify(peak) + '/s', peakT ? clock(peakT, true) : '') +
          tile('Clicking', beautify(avgClick) + '/s', avg + avgClick > 0 ? Math.round((avgClick / (avg + avgClick)) * 100) + '% of income' : '')
        );
      },
      footer: () => averagesTable(),
    });

  function effectLegend(ivs) {
    const counts = new Map();
    ivs.forEach(({ iv }) => counts.set(iv.name, { iv, n: (counts.get(iv.name) || { n: 0 }).n + 1 }));
    if (!counts.size) return '<span class="ca-legend-empty">Golden cookie effects will show up here.</span>';
    return [...counts.values()]
      .map(({ iv, n }) => `<span class="ca-legend-item">${F().swatch(CA.History.colorFor(iv.name))}${esc(iv.label)}${n > 1 ? ` <em>×${n}</em>` : ''}</span>`)
      .join('');
  }

  const TABLE_COLS = [
    { s: 0, label: 'Now' },
    { s: 60, label: '1 min' },
    { s: 300, label: '5 min' },
    { s: 900, label: '15 min' },
    { s: 3600, label: '1 h' },
    { s: 10800, label: '3 h' },
  ];

  /** A table of measures × time spans; rows: { n?, x?, label, desc, color, fn(r), strong, mult, sign }. */
  function spansTable(rows, vals) {
    let h = '<div class="ca-table-wrap"><table class="ca-table ca-stages"><thead><tr><th>Average over the last…</th>';
    TABLE_COLS.forEach((c) => (h += `<th>${c.label}</th>`));
    h += '</tr></thead><tbody>';
    rows.forEach((r) => {
      const cls = [r.strong ? 'strong' : '', r.mult ? 'mult' : '', r.sep ? 'sep' : '', r.desc ? '' : 'thin'].filter(Boolean).join(' ');
      const badge = r.n
        ? `<span class="ca-stage-n" style="background:${r.color}">${r.n}</span>`
        : r.mult
          ? '<span class="ca-stage-n ca-stage-x">×</span>'
          : r.sign
            ? `<span class="ca-stage-n ca-stage-x">${r.sign}</span>`
            : `<span class="ca-stage-n" style="background:${r.color || 'transparent'}"></span>`;
      h += `<tr${cls ? ` class="${cls}"` : ''}><td>${badge}${esc(r.label)}${r.desc ? `<span class="ca-row-sub">${esc(r.desc)}</span>` : ''}</td>`;
      vals.forEach((val) => (h += `<td>${val ? esc(r.fn(val)) : '—'}</td>`));
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="ca-card-note">Averages always cover the newest stretch of active play, whatever the chart is showing.</div>';
    return h;
  }

  /**
   * The CpS table, as three stages that build on each other:
   *   1 raw production         unbuffed CpS — no golden-cookie effects
   *   2 + raw clicking         plus your clicks per second × what a click is worth with no effects
   *                            (so neither Click frenzy nor a Frenzy's boost to clicks counts)
   *   3 actual                 everything that really got baked: buffed production, buffed
   *                            clicking, golden cookie payouts, wrinklers…
   * and the multipliers between them: what clicking adds, what effects & golden cookies add, total.
   */
  function averagesTable() {
    const { beautify } = F();
    // "Now" = the last 3 seconds: one frame alone is too jumpy (and may be a just-resumed one)
    const vals = TABLE_COLS.map((c) => recent(c.s || 3));
    const stage1 = (r) => r.base;
    const stage2 = (r) => r.base + r.clickRaw;
    const stage3 = (r) => r.actual;
    const times = (a, b) => (b > 0 && Number.isFinite(a) ? `×${(a / b).toFixed(a / b >= 10 ? 1 : 2)}` : '—');
    return spansTable(
      [
        { n: 1, label: 'Raw production', desc: 'CpS with every temporary effect removed', fn: (r) => beautify(stage1(r)) + '/s', color: C_BASE },
        { n: 2, label: '+ raw clicking', desc: 'your clicks per second × a click’s worth with no effects', fn: (r) => beautify(stage2(r)) + '/s', color: C_CLICK },
        { n: 3, label: 'Actual', desc: 'everything really baked: effects, golden cookies, wrinklers…', fn: (r) => beautify(stage3(r)) + '/s', color: SOURCES[2].color, strong: true },
        { label: 'Clicking adds (2 ÷ 1)', fn: (r) => times(stage2(r), stage1(r)), mult: true, sep: true },
        { label: 'Effects & golden add (3 ÷ 2)', fn: (r) => times(stage3(r), stage2(r)), mult: true },
        { label: 'Total (3 ÷ 1)', fn: (r) => times(stage3(r), stage1(r)), mult: true, strong: true },
        { label: 'Clicks per second', fn: (r) => (Number.isFinite(r.clickRate) ? r.clickRate.toFixed(r.clickRate < 10 ? 1 : 0) : '—'), sep: true, color: C_CLICK },
      ],
      vals
    );
  }

  /** Per-second averages of flows over the newest `seconds` of active play, over the seconds
   *  they were actually measured (frames where `gate` is known). */
  function recentFlows(seconds, keys, gate) {
    const frames = CA.Recorder.frames();
    const from = CA.Recorder.activeNow() - seconds * SEC;
    const sum = {};
    keys.forEach((k) => (sum[k] = 0));
    let secs = 0;
    for (let i = frames.length - 1; i >= 0 && frames[i].a > from; i--) {
      const f = frames[i];
      if (!Number.isFinite(f[gate])) continue; // first frame after a gap, or recorded before this existed
      secs += f.dt || 0;
      keys.forEach((k) => (sum[k] += f[k] || 0));
    }
    if (!secs) return null;
    const out = {};
    keys.forEach((k) => (out[k] = sum[k] / secs));
    return out;
  }

  // ---- the ledger: Actual CpS and the cookie bank ------------------------------------------
  // One chart of everything that moves the bank, by category — pick which categories, gains
  // and/or losses, and whether the CpS-boosted extra is shown on top of building CpS and
  // clicking — and below it the same, accumulated: the bank. Both share every setting.

  function ledgerView() {
    return {
      cats: CATS.filter((c) => S().get(`cat.${c.id}`) !== false),
      gains: S().get('actualGains') !== false,
      losses: !!S().get('actualLosses'),
      boosted: S().get('cpsBoosted') !== false,
    };
  }

  /** The bar series for what's selected: { key, field, sign, name, color } (key = part key). */
  function ledgerParts() {
    const { cats, gains, losses, boosted } = ledgerView();
    const out = [];
    cats.forEach((c) => {
      if (gains && c.in) out.push({ key: c.id, field: c.in, sign: 1, name: c.boost ? `${c.name}${boosted ? ' (unboosted)' : ''}` : c.name, color: c.color });
      if (gains && boosted && c.boost) out.push({ key: `${c.id}Boost`, field: c.boost, sign: 1, name: `${c.name}: CpS boost`, color: c.boostColor, boost: true });
      if (losses && c.out) out.push({ key: `${c.id}Out`, field: c.out, sign: -1, name: `${c.name} (out)`, color: c.outColor || c.color });
    });
    return out;
  }

  const LEDGER_TOGGLES = () => [
    {
      label: 'Include',
      toggles: CATS.map((c) => ({ setting: `cat.${c.id}`, label: c.name, color: c.color, title: `Include ${c.name.toLowerCase()}` })),
    },
    {
      label: '',
      toggles: [
        { setting: 'actualGains', label: '▲ Gains', title: 'Cookies coming into the bank' },
        { setting: 'actualLosses', label: '▼ Losses', title: 'Cookies leaving the bank' },
        { setting: 'cpsBoosted', label: '✦ CpS-boosted', title: 'Show the extra that CpS effects (Frenzy, Click frenzy…) add to building CpS and clicking, on top of the unboosted part' },
      ],
    },
  ];
  const ledgerEmpty = () => (ledgerParts().length ? 'Collecting data…' : 'Pick some categories, and Gains and/or Losses.');

  /**
   * One row per category, its figures side by side: "(raw/boosted)" for categories a CpS effect
   * can boost — unboosted, then with the boost — "(−bought / +sold)"-style for ones that go both
   * ways, and just "(raw)" otherwise. Then thin In / Out / Net rows.
   */
  function ledgerTable() {
    const { beautify, signed } = F();
    const { cats, gains, losses, boosted } = ledgerView();
    const vals = TABLE_COLS.map((c) => recentFlows(c.s || 3, LEDGER_FIELDS, 'lBuild'));
    const rows = [];
    cats.forEach((c) => {
      const labels = [];
      const cells = [];
      const words = c.words || [];
      if (losses && c.out) {
        labels.push(`−${words[0] || 'out'}`);
        cells.push((r) => '−' + beautify(r[c.out]));
      }
      if (gains && c.in) {
        if (c.boost) {
          labels.push('raw');
          cells.push((r) => beautify(r[c.in]));
          if (boosted) {
            labels.push('boosted');
            cells.push((r) => beautify(r[c.in] + r[c.boost]));
          }
        } else {
          labels.push(words[1] ? `+${words[1]}` : 'raw');
          cells.push((r) => (c.out && losses ? '+' : '') + beautify(r[c.in]));
        }
      }
      if (!cells.length) return;
      rows.push({
        label: `${c.name} (${labels.join(' / ')})`,
        fn: (r) => cells.map((f) => f(r)).join(' / ') + '/s',
        color: c.color,
      });
    });
    if (!rows.length) return '<div class="ca-card-note">Pick some categories, and Gains and/or Losses.</div>';
    const shown = ledgerParts();
    const total = (r, sign) => shown.filter((x) => x.sign === sign).reduce((n, x) => n + (r[x.field] || 0), 0);
    if (gains) rows.push({ label: 'In', fn: (r) => beautify(total(r, 1)) + '/s', strong: true, sign: '=', sep: true });
    if (losses) rows.push({ label: 'Out', fn: (r) => '−' + beautify(total(r, -1)) + '/s', strong: true, sign: '=', sep: !gains });
    if (gains && losses) rows.push({ label: 'Net', fn: (r) => signed(total(r, 1) - total(r, -1)) + '/s', strong: true, sign: '=' });
    return spansTable(rows, vals);
  }

  const actualPlot = () =>
    P().create({
      id: 'actual',
      title: 'Actual CpS',
      icon: 'bolt',
      note: 'Everything that moved the bank each second, by category. Building CpS and clicking can show the extra that CpS effects add (✦ CpS-boosted) on top of their unboosted part. Losses show below the line.',
      windows: WINDOWS,
      window: 900,
      smooth: 15,
      stacked: true,
      unit: '/s',
      totalLabel: 'Net',
      tipFmt: (val) => (val < 0 ? '−' : '') + F().beautify(Math.abs(val)) + '/s',
      toggleGroups: LEDGER_TOGGLES(),
      build(v) {
        const parts = ledgerParts();
        const { gains, losses, cats } = ledgerView();
        const raw = v.bucketize(LEDGER_FIELDS.concat(['cps', 'click']));
        const ivs = effects(v);
        const bars = raw.map((b) => {
          const o = {};
          parts.forEach((x) => (o[x.key] = x.sign * rate(b, x.field)));
          return { x0: b.x0, x1: b.x1, parts: o, raw: b };
        });
        let sum = 0;
        let secs = 0;
        raw.forEach((b) => {
          if (!Number.isFinite(b.v.lBuild)) return;
          parts.forEach((x) => (sum += x.sign * (b.v[x.field] || 0)));
          secs += coverOf(b, 'lBuild');
        });
        const avg = secs ? sum / secs : NaN;
        const showShown = gains && cats.some((c) => c.id === 'build' || c.id === 'click');
        return {
          series: parts
            .map((x) => ({ key: x.key, name: x.name, color: x.color, type: 'bar' }))
            .concat(showShown ? [{ key: 'shown', name: 'CpS the game shows (+ clicking)', color: C_SHOWN, type: 'line', dash: true, width: 1.2 }] : [])
            .concat(gains && losses ? [{ key: 'net', name: 'Net', color: '#ffd98a', type: 'line', width: 1.4 }] : []),
          bars,
          lines: {
            shown: P().linePoints(raw, (b) => (Number.isFinite(b.v.cps) ? b.v.cps + (b.v.click || 0) : undefined)),
            net: bars.map((b) => ({ x: (b.x0 + b.x1) / 2, x0: b.x0, x1: b.x1, bar: b.raw, v: Object.values(b.parts).reduce((n, y) => n + (y || 0), 0) })),
          },
          hlines: Number.isFinite(avg) && parts.length ? [{ v: avg, label: `avg ${F().signed(avg)}/s`, color: 'rgba(255,200,120,0.7)' }] : [],
          intervals: ivs,
          markers: markers(v, ['golden', 'wrath', 'reindeer', 'ascend'], ivs),
          empty: ledgerEmpty(),
          raw,
          parts,
        };
      },
      stats(v, data) {
        const { tile, beautify, signed } = F();
        let inn = 0;
        let out = 0;
        let boost = 0;
        let secs = 0;
        data.raw.forEach((b) => {
          if (!Number.isFinite(b.v.lBuild)) return;
          secs += coverOf(b, 'lBuild');
          data.parts.forEach((x) => {
            const val = b.v[x.field] || 0;
            if (x.sign > 0) inn += val;
            else out += val;
            if (x.boost) boost += val;
          });
        });
        const per = (n) => (secs ? n / secs : 0);
        return (
          tile('In', beautify(per(inn)) + '/s', 'average, this window') +
          tile('Out', beautify(per(out)) + '/s', 'average, this window') +
          tile('Net', signed(per(inn - out)) + '/s') +
          tile('CpS boost', inn > 0 ? Math.round((boost / inn) * 100) + '%' : '—', 'of what came in')
        );
      },
      footer: () => ledgerTable(),
    });

  const ledgerCumPlot = () =>
    P().create({
      id: 'ledgerCum',
      settingsOf: 'actual', // same window, log scale and choices as Actual CpS
      title: 'Cookie bank',
      icon: 'dollar',
      note: 'The same categories, added up from the start: how the bank got to where it is. With everything included it traces the real bank (dashed).',
      windows: WINDOWS,
      window: 900,
      smooth: false,
      stacked: true,
      choices: [FROM],
      totalLabel: 'Net',
      tipFmt: (val) => F().signed(val),
      toggleGroups: LEDGER_TOGGLES(),
      build(v) {
        const parts = ledgerParts();
        const { gains, losses } = ledgerView();
        const start = cumulativeStart(v);
        const raw = v.bucketize(LEDGER_FIELDS.concat(['cookies']));
        const run = {};
        parts.forEach((x) => (run[x.key] = 0));
        // the bank where the chart starts: the last frame at or before the start (else the first one)
        const before = v.frames.filter((f) => f[v.key] <= start && Number.isFinite(f.cookies)).pop();
        let bank0 = before ? before.cookies : null;
        const bars = [];
        const actual = [];
        raw.forEach((b) => {
          if (b.x1 <= start) return;
          const o = {};
          parts.forEach((x) => {
            run[x.key] += x.sign * (b.v[x.field] || 0);
            o[x.key] = run[x.key];
          });
          bars.push({ x0: b.x0, x1: b.x1, parts: o, raw: b });
          if (bank0 === null && Number.isFinite(b.first.cookies)) bank0 = b.first.cookies;
          if (bank0 !== null && Number.isFinite(b.v.cookies)) actual.push({ x: b.x1, x0: b.x0, x1: b.x1, bar: b, v: b.v.cookies - bank0 });
        });
        return {
          series: parts
            .map((x) => ({ key: x.key, name: x.name, color: x.color, type: 'bar' }))
            .concat(gains && losses ? [{ key: 'net', name: 'Net (selected)', color: '#ffd98a', type: 'line', width: 1.4 }] : [])
            .concat([{ key: 'bank', name: 'Bank, actual change', color: C_SHOWN, type: 'line', dash: true, width: 1.2 }]),
          bars,
          lines: {
            net: bars.map((b) => ({ x: b.x1, x0: b.x0, x1: b.x1, v: Object.values(b.parts).reduce((n, y) => n + (y || 0), 0) })),
            bank: actual,
          },
          markers: markers(v, ['ascend'], []),
          empty: ledgerEmpty(),
          bank0,
          bars0: bars,
        };
      },
      stats(v, data) {
        const { tile, beautify, signed } = F();
        const last = data.bars0[data.bars0.length - 1];
        const sel = last ? Object.values(last.parts).reduce((n, y) => n + (y || 0), 0) : 0;
        return (
          tile('Bank at start', data.bank0 === null ? '—' : beautify(data.bank0)) +
          tile('Bank now', beautify(Game.cookies || 0)) +
          tile('Change', data.bank0 === null ? '—' : signed((Game.cookies || 0) - data.bank0), 'actual') +
          tile('Selected categories', signed(sel), 'added up')
        );
      },
    });

  // ---- Prestige tab ---------------------------------------------------------------------------

  const prestigePlot = () =>
    P().create({
      id: 'prestige',
      title: 'Prestige',
      icon: 'ascend',
      windows: LONG_WINDOWS,
      window: 10800,
      log: false,
      fmt: (val) => F().beautify(val, 0),
      tipFmt: (val) => F().beautify(Math.floor(val), 0),
      build(v) {
        const bars = v.bucketize(['prestigeTotal', 'prestige']);
        const totals = P().linePoints(bars, (b) => b.v.prestigeTotal);
        // the target as a line, when it's close enough not to squash the chart
        const target = prestigeTarget();
        const top = totals.reduce((m, p) => Math.max(m, p.v), 0);
        const showTarget = target > 0 && top > 0 && target <= top * 1.5;
        return {
          series: [
            { key: 'prestigeTotal', name: 'Level if you ascended now', color: '#c9bcff', type: 'area', width: 1.8 },
            { key: 'prestige', name: 'Current level', color: C_BASE, type: 'line', dash: true },
          ],
          lines: {
            prestigeTotal: totals,
            prestige: P().linePoints(bars, (b) => b.v.prestige),
          },
          hlines: showTarget ? [{ v: target, label: `target ${F().beautify(target, 0)}`, color: 'rgba(201,188,255,0.85)' }] : [],
          markers: markers(v, ['ascend'], []),
          zero: false,
        };
      },
      stats() {
        const { tile, beautify, span } = F();
        const cur = Game.prestige || 0;
        const total = Math.floor(Game.HowMuchPrestige((Game.cookiesReset || 0) + (Game.cookiesEarned || 0)));
        const next = total + 1;
        const need = typeof Game.HowManyCookiesReset === 'function' ? Game.HowManyCookiesReset(next) - ((Game.cookiesReset || 0) + (Game.cookiesEarned || 0)) : NaN;
        const r = etaRate();
        const eta = r && r.actual > 0 && need > 0 ? need / r.actual : NaN;
        return (
          tile('Level', beautify(cur, 0)) +
          tile('If you ascended now', beautify(total, 0), `+${beautify(total - cur, 0)} this run`) +
          tile('Next level', Number.isFinite(need) ? beautify(Math.max(0, need)) : '—', 'cookies to go') +
          tile('Next level in', Number.isFinite(eta) ? span(eta) : '—', r ? r.label : '')
        );
      },
    });

  const prestigeRatePlot = () =>
    P().create({
      id: 'prestigeRate',
      title: 'Prestige gained per hour',
      icon: 'sparkle',
      windows: LONG_WINDOWS,
      window: 10800,
      smooth: 900,
      unit: '/h',
      tipFmt: (val) => F().beautify(val, 1) + ' levels/h',
      build(v) {
        const bars = v.bucketize(['prestigeTotal']);
        let prev = null;
        let gained = 0;
        let secs = 0;
        const out = bars.map((b) => {
          const from = prev && b.x0 - prev.x1 <= Math.max(5 * SEC, v.bucket) ? prev.v.prestigeTotal : b.first.prestigeTotal;
          const d = Number.isFinite(b.v.prestigeTotal) && Number.isFinite(from) ? Math.max(0, b.v.prestigeTotal - from) : 0;
          prev = b;
          gained += d;
          secs += b.secs;
          return { x0: b.x0, x1: b.x1, parts: { gain: b.secs > 0 ? (d / b.secs) * 3600 : 0 }, raw: b };
        });
        return {
          series: [{ key: 'gain', name: 'Levels per hour', color: '#c9bcff', type: 'bar' }],
          bars: out,
          markers: markers(v, ['ascend'], []),
          gained,
          secs,
        };
      },
      stats(v, data) {
        const { tile, beautify, span } = F();
        return (
          tile('Gained', beautify(data.gained, 0), data.secs ? `in ${span(data.secs)} of play` : '') +
          tile('Per hour', data.secs ? beautify((data.gained / data.secs) * 3600, 1) : '—', 'average, this window')
        );
      },
    });

  /** The CpS prestige ETAs use: your actual CpS over the Prestige chart's window (its chips),
   *  in active play — the whole recorded history when the window is All. */
  function etaRate() {
    const w = Number(S().get('plot.prestige.win')) || 0;
    const r = recent(w > 0 ? w : 1e10);
    if (!r) return null;
    return { actual: r.actual, label: w > 0 ? `at the actual CpS of the last ${F().windowLabel(w)}` : 'at the actual CpS of all recorded play' };
  }

  // ---- prestige target --------------------------------------------------------------------
  // A target prestige level, entered as a number from 1–999 and a magnitude (thousand, million…),
  // with how far there is to go and when you'll get there at your recent actual CpS.

  const UNITS = [
    { e: 0, label: 'levels' },
    { e: 3, label: 'thousand' },
    { e: 6, label: 'million' },
    { e: 9, label: 'billion' },
    { e: 12, label: 'trillion' },
    { e: 15, label: 'quadrillion' },
    { e: 18, label: 'quintillion' },
  ];

  /** The target level, or 0 when none is set. */
  function prestigeTarget() {
    const n = Number(S().get('prestigeTargetNum')) || 0;
    return n > 0 ? n * Math.pow(10, Number(S().get('prestigeTargetUnit')) || 0) : 0;
  }

  function targetCardHtml() {
    const n = Number(S().get('prestigeTargetNum')) || 0;
    const u = Number(S().get('prestigeTargetUnit')) || 0;
    return (
      '<div class="ca-card" data-ptarget>' +
      CA.UI.C.cardHead('Prestige target', 'marker') +
      '<div class="ca-target">' +
      '<span class="ca-field-label">Reach level</span>' +
      `<input type="number" min="1" max="999" step="1" placeholder="e.g. 250" value="${n > 0 ? n : ''}" data-ptarget-num>` +
      `<select data-ptarget-unit>${UNITS.map((x) => `<option value="${x.e}"${x.e === u ? ' selected' : ''}>${x.label}</option>`).join('')}</select>` +
      '</div>' +
      '<div data-ptarget-out></div>' +
      '</div>'
    );
  }

  function targetOutHtml() {
    const { tile, beautify, span } = F();
    const target = prestigeTarget();
    if (!target) return '<div class="ca-card-note">Pick a level to aim for — how far it is and when you’ll get there show up here.</div>';
    const baked = (Game.cookiesReset || 0) + (Game.cookiesEarned || 0);
    const now = Math.floor(Game.HowMuchPrestige(baked));
    const start = Game.prestige || 0;
    if (target <= start) return `<div class="ca-card-note">You’re already at prestige ${beautify(start, 0)} — past this target.</div>`;
    const need = typeof Game.HowManyCookiesReset === 'function' ? Math.max(0, Game.HowManyCookiesReset(target) - baked) : NaN;
    const r = etaRate();
    const eta = need > 0 && r && r.actual > 0 ? need / r.actual : need === 0 ? 0 : NaN;
    const pct = Math.max(0, Math.min(100, ((now - start) / (target - start)) * 100));
    const reached = now >= target;
    return (
      `<div class="ca-progress"><div class="ca-progress-fill" style="width:${pct}%"></div><div class="ca-progress-text">${reached ? 'Reached — ascend any time' : `${pct.toFixed(pct < 10 ? 2 : 1)}% of the way this run`}</div></div>` +
      '<div class="ca-stats">' +
      tile('Target', beautify(target, 0), `+${beautify(target - start, 0)} on this ascension`) +
      tile('Levels to go', reached ? '0' : beautify(target - now, 0), `at ${beautify(now, 0)} if you ascended now`) +
      tile('Cookies to go', Number.isFinite(need) ? beautify(need) : '—', 'baked, all time') +
      tile('Reached in', reached ? 'now' : Number.isFinite(eta) ? span(eta) : '—', r ? r.label : '') +
      '</div>'
    );
  }

  function onTargetInput(e) {
    const el = e.target;
    if (!el.matches || !el.matches('[data-ptarget-num],[data-ptarget-unit]')) return;
    if (el.matches('[data-ptarget-num]')) {
      const n = Math.round(Number(el.value));
      S().set('prestigeTargetNum', Number.isFinite(n) && n > 0 ? Math.min(999, n) : 0);
    } else S().set('prestigeTargetUnit', Number(el.value) || 0);
    refreshTarget();
    if (plots.prestige) plots.prestige.tick();
  }

  function refreshTarget() {
    const out = mountedRoot && mountedRoot.querySelector('[data-ptarget-out]');
    if (out) out.innerHTML = targetOutHtml();
  }

  // ---- the page ---------------------------------------------------------------------------

  const plots = {};
  let mountedRoot = null;

  const currentTab = () => {
    const t = S().get('graphTab');
    return TABS.find((x) => x.id === t) || TABS[0];
  };

  function html() {
    const cur = currentTab();
    return (
      '<div class="ca-subtabs" role="tablist">' +
      TABS.map(
        (t) =>
          `<button type="button" class="ca-subtab${t === cur ? ' on' : ''}" role="tab" aria-selected="${t === cur}" data-graph-tab="${t.id}">` +
          `${CA.UI.Icons.html(t.icon, 14)}<span>${t.label}</span></button>`
      ).join('') +
      '</div>' +
      (cur.top ? cur.top() : '') +
      cur.plots.map((id) => plots[id].html()).join('')
    );
  }

  function onClick(e) {
    const tab = e.target.closest('[data-graph-tab]');
    if (!tab) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    S().set('graphTab', tab.dataset.graphTab);
    CA.UI.Menu.render();
  }

  function mount(root) {
    unmount();
    mountedRoot = root;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onTargetInput);
    root.addEventListener('change', onTargetInput);
    currentTab().plots.forEach((id) => plots[id].mount(root));
    refreshTarget();
  }

  function unmount() {
    TABS.forEach((t) => t.plots.forEach((id) => plots[id] && plots[id].unmount()));
    if (mountedRoot) {
      mountedRoot.removeEventListener('click', onClick);
      mountedRoot.removeEventListener('input', onTargetInput);
      mountedRoot.removeEventListener('change', onTargetInput);
    }
    mountedRoot = null;
  }

  function tick() {
    currentTab().plots.forEach((id) => plots[id].tick());
    refreshTarget();
  }

  function init() {
    S().defineOption({ key: 'graphTab', group: 'ui', name: 'Graphs tab', desc: '', default: 'cookies' });
    S().defineOption({ key: 'prestigeTargetNum', group: 'ui', name: 'Prestige target (number)', desc: '', default: 0 });
    S().defineOption({ key: 'prestigeTargetUnit', group: 'ui', name: 'Prestige target (magnitude)', desc: '', default: 0 });
    S().defineOption({ key: 'actualGains', group: 'plot', name: 'Actual CpS: gains', desc: '', default: true });
    S().defineOption({ key: 'actualLosses', group: 'plot', name: 'Actual CpS: losses', desc: '', default: false });
    S().defineOption({ key: 'cpsBoosted', group: 'plot', name: 'Actual CpS: CpS-boosted', desc: '', default: true });
    CATS.forEach((c) => S().defineOption({ key: `cat.${c.id}`, group: 'plot', name: `Actual CpS: ${c.name}`, desc: '', default: !c.offByDefault }));
    S().defineOption({
      key: 'graphEffects',
      group: 'graph',
      icon: 'shade',
      name: 'Effect shading',
      desc: 'Shade the periods when golden cookie effects are active.',
      default: true,
    });
    S().defineOption({
      key: 'graphEvents',
      group: 'graph',
      icon: 'marker',
      name: 'Event markers',
      desc: 'Mark golden cookie pops, reindeer, stock trades and ascensions.',
      default: true,
    });
    P().init();
    plots.cps = cpsPlot();
    plots.actual = actualPlot();
    plots.ledgerCum = ledgerCumPlot();
    plots.prestige = prestigePlot();
    plots.prestigeRate = prestigeRatePlot();
    CA.Events.on('history', (why) => {
      if (mountedRoot && why === 'sample') tick();
    });
  }

  return { init, html, mount, unmount, tick, recent, TABS, SOURCES, CATS, plots };
})();

// ---- src/ui/eventsPage.js --------------------------------------------
// The Events page: everything in the central event log (core/eventLog.js), plus a live table of
// income that isn't CpS or clicking.
//
//   Income outside CpS   per source for the chosen span: golden & wrath cookies, reindeer, wrinklers,
//                        sugar lumps, stock trades (net), golden-effect boosts (Frenzy & co.) and
//                        anything else — counts, cookies, average, share of everything baked, last seen
//   Event log            newest first, filter chips per event type (with counts), "income only",
//                        a search box, and a CSV download of whatever the filters show

CA.UI = CA.UI || {};

CA.UI.EventsPage = (() => {
  const S = () => CA.Settings;
  const F = () => CA.UI.Plot.fmt;
  const esc = (s) => CA.Util.escapeHtml(s);
  const PAGE_ROWS = 100;
  const RENDER_MS = 400;

  const SPANS = [
    { v: 'session', label: 'This session' },
    { v: '900', label: '15m' },
    { v: '3600', label: '1h' },
    { v: '86400', label: '1d' },
    { v: 'all', label: 'All' },
  ];

  let root = null;
  let shown = PAGE_ROWS;
  let query = '';
  let pending = null;

  const hidden = () => new Set(String(S().get('eventHidden') || '').split(',').filter(Boolean));
  const typeInfo = (type) => CA.EventLog.types()[type] || { name: type, icon: 'events', color: '#ccc' };

  function spanStart() {
    const v = S().get('eventSpan');
    if (v === 'all') return -Infinity;
    if (v === 'session') return CA.UI.Plot.SESSION_START;
    return Date.now() - Number(v) * 1000;
  }

  // ---- income table ----------------------------------------------------------------------

  function incomeRows() {
    const from = spanStart();
    const by = {};
    const add = (key, e, cookies) => {
      const r = by[key] || (by[key] = { count: 0, cookies: 0, last: 0, in: 0, out: 0 });
      r.count++;
      r.cookies += cookies;
      if (cookies >= 0) r.in += cookies;
      else r.out -= cookies;
      r.last = Math.max(r.last, e.t);
    };
    let instant = 0;
    let wrinkLump = 0;
    CA.EventLog.list().forEach((e) => {
      if (e.t < from) return;
      if (e.type === 'golden' || e.type === 'wrath' || e.type === 'reindeer') {
        add(e.type, e, e.cookies || 0);
        if (e.cookies > 0) instant += e.cookies;
      } else if (e.type === 'wrinkler' || e.type === 'lump') {
        add(e.type, e, e.cookies || 0);
        wrinkLump += Math.max(0, e.cookies || 0);
      } else if (e.type === 'trade') add('trade', e, e.cookies || 0);
    });
    let baked = 0;
    let golden = 0;
    let other = 0;
    CA.Recorder.frames().forEach((f) => {
      if (f.t < from) return;
      baked += f.earned || 0;
      golden += f.earnGolden || 0;
      other += f.earnOther || 0;
    });
    const t = CA.EventLog.types();
    const rows = ['golden', 'wrath', 'reindeer', 'wrinkler', 'lump', 'trade'].map((k) => ({
      key: k,
      label: k === 'trade' ? 'Stock trades (−bought / +sold)' : (t[k] || {}).name || k,
      split: k === 'trade', // one row, both directions
      icon: (t[k] || {}).icon,
      color: (t[k] || {}).color,
      ...(by[k] || { count: 0, cookies: 0, last: 0, in: 0, out: 0 }),
    }));
    rows.push({ key: 'boost', label: 'Golden effect boosts', icon: 'sparkle', color: '#ff9f43', count: null, cookies: Math.max(0, golden - instant), last: 0, title: 'Extra production from Frenzy, Dragon Harvest and other CpS effects, on top of unbuffed CpS' });
    rows.push({ key: 'other', label: 'Everything else', icon: 'puzzle', color: '#b39ddb', count: null, cookies: Math.max(0, other - wrinkLump), last: 0, title: 'Baked cookies not explained by production, clicking or the sources above' });
    return { rows, baked };
  }

  function incomeHtml() {
    const { beautify, signed, clock } = F();
    const { rows, baked } = incomeRows();
    const total = rows.reduce((n, r) => n + r.cookies, 0);
    let h = '<div class="ca-table-wrap"><table class="ca-table"><thead><tr><th>Source</th><th>Count</th><th>Cookies</th><th>Average</th><th>Of baked</th><th>Last</th></tr></thead><tbody>';
    rows.forEach((r) => {
      const muted = !r.count && !r.cookies;
      h +=
        `<tr${muted ? ' class="muted"' : ''}><td${r.title ? ` title="${esc(r.title)}"` : ''}>` +
        `<span class="ca-ev-dot" style="color:${r.color}">${CA.UI.Icons.html(r.icon, 13)}</span>${esc(r.label)}</td>` +
        `<td>${r.count == null ? '' : r.count.toLocaleString()}</td>` +
        (r.split
          ? `<td>${r.count ? `<span class="neg">−${beautify(r.out)}</span> / <span class="pos">+${beautify(r.in)}</span>` : '—'}</td>`
          : `<td class="${r.cookies < 0 ? 'neg' : r.cookies > 0 ? 'pos' : ''}">${r.cookies ? signed(r.cookies) : '—'}</td>`) +
        `<td>${r.count ? beautify(r.cookies / r.count) : ''}</td>` +
        `<td>${baked > 0 && r.cookies ? ((r.cookies / baked) * 100).toFixed(r.cookies / baked < 0.1 ? 2 : 1) + '%' : ''}</td>` +
        `<td>${r.last ? clock(r.last, true) : ''}</td></tr>`;
    });
    h +=
      `<tr class="strong"><td>Total outside CpS & clicking</td><td></td><td>${signed(total)}</td><td></td>` +
      `<td>${baked > 0 ? ((total / baked) * 100).toFixed(1) + '%' : ''}</td><td></td></tr>`;
    h += '</tbody></table></div>';
    return h;
  }

  // ---- event log -------------------------------------------------------------------------

  function filtered() {
    const hide = hidden();
    const incomeOnly = S().get('eventIncomeOnly');
    const q = query.trim().toLowerCase();
    const types = CA.EventLog.types();
    return CA.EventLog.list().filter((e) => {
      if (hide.has(e.type)) return false;
      if (incomeOnly && !((types[e.type] || {}).income || e.type === 'trade')) return false;
      if (q && !`${e.title} ${e.text}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function chipsHtml() {
    const counts = {};
    CA.EventLog.list().forEach((e) => (counts[e.type] = (counts[e.type] || 0) + 1));
    const hide = hidden();
    return Object.keys(CA.EventLog.types())
      .map((type) => {
        const t = typeInfo(type);
        const on = !hide.has(type);
        return (
          `<button type="button" class="ca-chip ca-ev-chip${on ? ' on' : ''}" data-ev-type="${esc(type)}" style="--c:${t.color}" title="Show or hide ${esc(t.name)} events">` +
          `${CA.UI.Icons.html(t.icon, 12)}${esc(t.name)} <em>${(counts[type] || 0).toLocaleString()}</em></button>`
        );
      })
      .join('');
  }

  /** What an event did, for its right-hand column: cookies gained/lost, or — for a golden cookie
   *  that granted an effect instead of a drop (Frenzy, Clot…) — the CpS it added or took away. */
  function effectOf(e) {
    const { signed, beautify } = F();
    const c = e.cookies || 0;
    if (Math.abs(c) >= 1) return { cls: c < 0 ? 'neg' : 'pos', text: signed(c) };
    const g = e.data && e.data.cpsGain;
    if (Number.isFinite(g) && Math.abs(g) >= 1) return { cls: g < 0 ? 'neg' : 'pos', text: `${g < 0 ? '−' : '+'}${beautify(Math.abs(g))}/s CpS` };
    return { cls: '', text: '' };
  }

  function rowHtml(e) {
    const t = typeInfo(e.type);
    const { clock } = F();
    const eff = effectOf(e);
    return (
      `<div class="ca-ev-row" style="--c:${t.color}">` +
      `<span class="ca-ev-ico">${CA.UI.Icons.html(t.icon, 14)}</span>` +
      `<span class="ca-ev-time">${clock(e.t, true)}</span>` +
      `<span class="ca-ev-text"><b>${esc(e.title)}</b>${e.text ? ` <span>${esc(e.text)}</span>` : ''}</span>` +
      `<span class="ca-ev-cookies ${eff.cls}">${eff.text}</span>` +
      '</div>'
    );
  }

  function listHtml() {
    const list = filtered();
    const rows = list.slice(-shown).reverse();
    let h = rows.length ? rows.map(rowHtml).join('') : '<div class="ca-legend-empty ca-ev-empty">No events match.</div>';
    if (list.length > shown) h += `<button type="button" class="ca-btn ca-btn-small ca-ev-more" data-ev-more>Show ${Math.min(PAGE_ROWS, list.length - shown)} more (${(list.length - shown).toLocaleString()} older)</button>`;
    return h;
  }

  // ---- page -----------------------------------------------------------------------------

  function html() {
    const C = CA.UI.C;
    const span = S().get('eventSpan');
    return (
      '<div class="ca-card">' +
      C.cardHead('Income outside CpS', 'dollar') +
      '<div class="ca-card-note">Cookies that didn’t come from production or clicking — measured as they happened.</div>' +
      '<div class="ca-toolbar"><div class="ca-chipgroup">' +
      SPANS.map((s) => `<button type="button" class="ca-chip${s.v === span ? ' on' : ''}" data-ev-span="${s.v}">${s.label}</button>`).join('') +
      '</div></div>' +
      '<div data-ev-income></div>' +
      '</div>' +
      '<div class="ca-card">' +
      C.cardHead('Event log', 'events', '<div class="ca-card-meta"><span class="ca-pill" data-ev-count></span></div>') +
      '<div class="ca-toolbar ca-ev-filters">' +
      '<div class="ca-chipgroup" data-ev-chips></div>' +
      '</div>' +
      '<div class="ca-toolbar">' +
      `<label class="ca-search">${CA.UI.Icons.html('search', 13)}<input type="search" placeholder="Search events…" data-ev-search value="${esc(query)}"></label>` +
      '<div class="ca-chipgroup">' +
      `<button type="button" class="ca-chip${S().get('eventIncomeOnly') ? ' on' : ''}" data-ev-income-only title="Only events that brought in (or cost) cookies">${CA.UI.Icons.html('dollar', 12)} Income only</button>` +
      `<button type="button" class="ca-chip" data-ev-csv title="Download the events shown as a CSV file">${CA.UI.Icons.html('download', 12)} CSV</button>` +
      '</div></div>' +
      '<div class="ca-ev-list" data-ev-list></div>' +
      '</div>'
    );
  }

  function render(full) {
    if (!root || !root.isConnected) return;
    const income = root.querySelector('[data-ev-income]');
    if (income) income.innerHTML = incomeHtml();
    if (full === false) return;
    const chips = root.querySelector('[data-ev-chips]');
    if (chips) chips.innerHTML = chipsHtml();
    const list = root.querySelector('[data-ev-list]');
    if (list) list.innerHTML = listHtml();
    const count = root.querySelector('[data-ev-count]');
    if (count) {
      const n = filtered().length;
      const all = CA.EventLog.list().length;
      count.textContent = n === all ? `${all.toLocaleString()} events` : `${n.toLocaleString()} of ${all.toLocaleString()}`;
    }
  }

  function schedule() {
    if (pending || !root) return;
    pending = setTimeout(() => {
      pending = null;
      render();
    }, RENDER_MS);
  }

  function csv() {
    const cell = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [['time', 'type', 'title', 'text', 'cookies'].join(',')];
    filtered().forEach((e) => lines.push([new Date(e.t).toISOString(), e.type, e.title, e.text, e.cookies || 0].map(cell).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookiemgr-events-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function onClick(e) {
    const t = e.target.closest('[data-ev-type],[data-ev-span],[data-ev-income-only],[data-ev-csv],[data-ev-more]');
    if (!t) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    if ('evType' in t.dataset) {
      const hide = hidden();
      if (hide.has(t.dataset.evType)) hide.delete(t.dataset.evType);
      else hide.add(t.dataset.evType);
      S().set('eventHidden', [...hide].join(','));
      shown = PAGE_ROWS;
    } else if ('evSpan' in t.dataset) {
      S().set('eventSpan', t.dataset.evSpan);
      root.querySelectorAll('[data-ev-span]').forEach((b) => b.classList.toggle('on', b.dataset.evSpan === t.dataset.evSpan));
    } else if ('evIncomeOnly' in t.dataset) {
      S().set('eventIncomeOnly', !S().get('eventIncomeOnly'));
      t.classList.toggle('on', S().get('eventIncomeOnly'));
      shown = PAGE_ROWS;
    } else if ('evCsv' in t.dataset) {
      csv();
      return;
    } else if ('evMore' in t.dataset) {
      shown += PAGE_ROWS;
    }
    render();
  }

  function onInput(e) {
    if (!e.target.matches('[data-ev-search]')) return;
    query = e.target.value;
    shown = PAGE_ROWS;
    const list = root.querySelector('[data-ev-list]');
    if (list) list.innerHTML = listHtml();
  }

  function mount(el) {
    unmount();
    root = el;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    shown = PAGE_ROWS;
    render();
  }

  function unmount() {
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
    }
    clearTimeout(pending);
    pending = null;
    root = null;
  }

  function init() {
    S().defineOption({ key: 'eventHidden', group: 'ui', name: 'Hidden event types', desc: '', default: '' });
    S().defineOption({ key: 'eventIncomeOnly', group: 'ui', name: 'Income events only', desc: '', default: false });
    S().defineOption({ key: 'eventSpan', group: 'ui', name: 'Income table span', desc: '', default: 'session' });
    CA.UI.Pages.register({
      id: 'events',
      label: 'Events',
      icon: 'events',
      order: 5, // top of the sidebar
      html,
      mount,
      unmount,
      tick: () => render(false),
    });
    CA.Events.on('eventLogged', schedule);
    CA.Events.on('history', (why) => {
      if (why === 'sample' && root) render(false);
    });
  }

  return { init, incomeRows, filtered, rowHtml };
})();

// ---- src/ui/stockGraph.js --------------------------------------------
// The Stock market page's charts, both built on the shared plot engine (ui/plot.js):
//
//   Stock market   portfolio value vs. cost basis (the gap is unrealized gain), or each stock's
//                  price ("Per stock"); prices come from the price:<id> states (features/stocks.js)
//   Performance    the portfolio's return as a percentage of the cookies invested, over a rolling
//                  window — above the line it's beating what you put in, below it's losing.
//                  Standardized by the capital at stake, so a small and a huge portfolio compare.

CA.UI = CA.UI || {};

CA.UI.StockGraph = (() => {
  const COLORS = ['#f5c451', '#7fe08b', '#9db4cc', '#ff8a65', '#c77dff', '#4fd6e0', '#e5484d', '#a6e35a'];
  const WINDOWS = [300, 900, 3600, 10800, 43200, 86400, 604800, 0];
  const F = () => CA.UI.Plot.fmt;
  const S = () => CA.Settings;

  function visibleStocks() {
    const all = CA.Stocks.list();
    return S().get('stockGraphSync') ? all.filter((g) => g.owned) : all;
  }

  let plot = null;

  function create() {
    plot = CA.UI.Plot.create({
      id: 'stocks',
      title: 'Stock market',
      icon: 'stocks',
      height: 180,
      log: false,
      windows: WINDOWS,
      window: 900,
      choices: [
        {
          key: 'mode',
          label: '',
          default: 'portfolio',
          options: [
            { v: 'portfolio', label: 'Portfolio value' },
            { v: 'perStock', label: 'Per stock' },
          ],
        },
      ],
      toggles: [{ setting: 'stockGraphSync', label: 'Sync to owned stocks', title: 'Per stock: only plot stocks you currently hold' }],
      zero: false,
      build(v) {
        if (v.opt('mode') === 'perStock') {
          const stocks = visibleStocks();
          const bars = v.bucketize(stocks.map((g) => `price:${g.id}`));
          const series = stocks.map((g, i) => ({ key: `price:${g.id}`, name: g.name, color: COLORS[i % COLORS.length], type: 'line', width: 1.8 }));
          const lines = {};
          series.forEach((s) => (lines[s.key] = CA.UI.Plot.linePoints(bars, (b) => b.v[s.key])));
          return {
            series,
            lines,
            zero: false,
            empty: S().get('stockGraphSync') ? "You don't own any stocks right now." : 'Open the Bank minigame to start tracking prices.',
          };
        }
        const bars = v.bucketize(['portfolioValue', 'portfolioCost', 'portfolioRealized']);
        return {
          series: [
            { key: 'value', name: 'Value', color: '#f5c451', type: 'area', width: 1.8 },
            { key: 'cost', name: 'Cost basis (the gap above it = unrealized gain)', color: '#9db4cc', type: 'line', dash: true },
          ],
          lines: {
            value: CA.UI.Plot.linePoints(bars, (b) => b.v.portfolioValue),
            cost: CA.UI.Plot.linePoints(bars, (b) => b.v.portfolioCost),
          },
          bars0: bars,
          empty: 'Open the Bank minigame to start tracking your portfolio.',
        };
      },
      tip(bar, v, data, x) {
        if (!data.bars0) return '';
        const b = data.bars0.find((r) => x >= r.x0 && x < r.x1);
        if (!b || !Number.isFinite(b.v.portfolioValue)) return '';
        const { row, signed } = F();
        const unreal = b.v.portfolioValue - (b.v.portfolioCost || 0);
        const real = b.v.portfolioRealized || 0;
        return row('transparent', 'Unrealized', signed(unreal), true) + row('transparent', 'Realized', signed(real)) + row('transparent', 'Total gain', signed(unreal + real), true);
      },
      stats(v) {
        if (v.opt('mode') === 'perStock') return '';
        const p = CA.Stocks.portfolioNow();
        const { tile, beautify, signed } = F();
        if (!p) return tile('Value', '—', 'open the Bank minigame');
        return (
          tile('Value', beautify(p.value), 'in $ (stock prices)') +
          tile('Equity', beautify(CA.StockTrader.previewSellAllCookies()), 'cookies if you sold everything now') +
          tile('Unrealized', signed(p.unrealized), 'if you sold everything now') +
          tile('Realized', signed(p.realized), 'from past sales') +
          tile('Total gain', signed(p.gain), 'realized + unrealized')
        );
      },
    });
  }

  function init() {
    create();
  }

  const html = () => plot.html();
  const mount = (root) => plot.mount(root);
  const unmount = () => plot && plot.unmount();
  const tick = () => plot && plot.tick();

  return { init, html, mount, unmount, tick, setPaused: (p) => plot.setPaused(p), isPaused: () => plot.isPaused() };
})();

CA.UI.StockPerf = (() => {
  const F = () => CA.UI.Plot.fmt;
  const SEC = 1000;
  const UP = '#4fd67a';
  const DOWN = '#e5484d';
  let plot = null;

  /** Total gain = what the portfolio is worth over what it cost, plus profit already realized.
   *  Buying or selling leaves it unchanged; only price moves change it. */
  const gainOf = (b) => (Number.isFinite(b.v.portfolioValue) ? b.v.portfolioValue - (b.v.portfolioCost || 0) + (b.v.portfolioRealized || 0) : undefined);

  function create() {
    plot = CA.UI.Plot.create({
      id: 'stockperf',
      title: 'Portfolio performance',
      icon: 'graphs',
      height: 150,
      note: 'Return on the cookies you have invested, over a rolling window: above zero your holdings are gaining, below they are losing. A percentage of the money at stake, so it reads the same at any portfolio size.',
      windows: [900, 3600, 10800, 43200, 86400, 604800, 0],
      window: 3600,
      smooth: false, // already a rolling average
      zero: true,
      fmt: (val) => `${Math.round(val * 10) / 10}%`,
      tipFmt: (val) => `${val >= 0 ? '+' : '−'}${Math.abs(val).toFixed(2)}%`,
      choices: [
        {
          key: 'roll',
          label: 'Rolling',
          default: 300,
          options: [
            { v: 60, label: '1m' },
            { v: 300, label: '5m' },
            { v: 900, label: '15m' },
            { v: 3600, label: '1h' },
          ],
        },
      ],
      total: false,
      build(v) {
        const R = v.opt('roll') * SEC;
        const all = v.bucketizeFrom(['portfolioValue', 'portfolioCost', 'portfolioRealized'], v.x0 - R);
        const bars = [];
        let j = 0;
        let sumCost = 0;
        let nCost = 0;
        let up = 0;
        let down = 0;
        all.forEach((b, i) => {
          sumCost += b.v.portfolioCost || 0;
          nCost++;
          // slide the start of the rolling window
          while (j < i && all[j].x1 <= b.x1 - R) {
            sumCost -= all[j].v.portfolioCost || 0;
            nCost--;
            j++;
          }
          if (b.x1 <= v.x0) return;
          const base = all[Math.max(0, j - 1)];
          const g1 = gainOf(b);
          const g0 = base === b ? undefined : gainOf(base);
          const cost = nCost ? sumCost / nCost : 0;
          if (!Number.isFinite(g1) || !Number.isFinite(g0) || !(cost > 0)) return;
          const pct = ((g1 - g0) / cost) * 100;
          if (pct >= 0) up += b.secs;
          else down += b.secs;
          bars.push({ x0: b.x0, x1: b.x1, parts: pct >= 0 ? { up: pct } : { down: pct }, pct, cost });
        });
        return {
          series: [
            { key: 'up', name: 'Gaining', color: UP, type: 'bar' },
            { key: 'down', name: 'Losing', color: DOWN, type: 'bar' },
          ],
          bars,
          up,
          down,
          empty: 'No stocks held in this window.',
        };
      },
      tip(bar) {
        if (!bar) return '';
        return F().row('transparent', 'Invested (avg)', F().beautify(bar.cost));
      },
      stats(v, data) {
        const { tile } = F();
        const last = data.bars[data.bars.length - 1];
        let best = -Infinity;
        let worst = Infinity;
        data.bars.forEach((b) => {
          best = Math.max(best, b.pct);
          worst = Math.min(worst, b.pct);
        });
        const pct = (x) => (Number.isFinite(x) ? `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(2)}%` : '—');
        const t = data.up + data.down;
        return (
          tile('Now', pct(last && last.pct), `over the last ${F().windowLabel(v.opt('roll'))}`) +
          tile('Best', pct(best)) +
          tile('Worst', pct(worst)) +
          tile('Time gaining', t ? Math.round((data.up / t) * 100) + '%' : '—', 'of this window')
        );
      },
    });
  }

  return {
    init: create,
    html: () => plot.html(),
    mount: (root) => plot.mount(root),
    unmount: () => plot && plot.unmount(),
    tick: () => plot && plot.tick(),
  };
})();

// ---- src/ui/stockLog.js ----------------------------------------------
// Views onto CA.StockLog's trade records, all on the Stock market tab:
//   - summary stat tiles (bought/sold/spent/earned/net) for the whole session
//   - "tick bars": a compact bought/sold bar per each of the last 5 one-second ticks with trades
//   - a scrollable transaction history table (time, action, stock, shares, price, total)
//   - a scrolling ticker — a running "here's what just got bought/sold" feed, at the bottom
// All four read the same underlying log, so a manual trade and an autoclicker trade show up
// identically everywhere.

CA.UI = CA.UI || {};

CA.UI.StockLog = (() => {
  const TICK_MS = 1000;
  const MAX_LOG_ROWS = 100; // the underlying log keeps more (CA.StockLog's own cap); this is just what's rendered
  const MAX_TICKER_ITEMS = 30;
  const PX_PER_SEC = 55; // ticker scroll speed
  const TICK_BUCKET_MS = 1000; // matches the stock-trader autoclicker's own cadence
  const MAX_TICK_BARS = 5;

  let root = null;
  let timer = null;
  let lastCount = -1;

  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : Math.round(v).toString());
  // Trades are priced in the Bank minigame's own "$" units (good.val, same as its own "for $X
  // each" tooltip) — not raw cookies, which would scale with CpS and quickly overflow a tile.
  const dollars = (v, floats) => '$' + beautify(v, floats);
  const signedDollars = (v) => (v < 0 ? '-$' : '+$') + beautify(Math.abs(v));
  /** The $ value of one trade — shares × price, not the actual cookies spent/earned (which
   *  scale with your CpS via the game's own buy/sell overhead formula and aren't comparable
   *  trade-to-trade the way a nominal $ value is). */
  const tradeValue = (r) => r.shares * r.price;
  const esc = (s) => CA.Util.escapeHtml(s);

  function two(n) {
    return n < 10 ? '0' + n : '' + n;
  }
  function clock(t) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
  }
  function clockShort(t) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}`;
  }

  function statTile(label, value, sub) {
    return `<div class="ca-stat"><div class="ca-stat-label">${label}</div><div class="ca-stat-value">${value}</div><div class="ca-stat-sub">${sub || '&nbsp;'}</div></div>`;
  }

  // ---- summary (whole session) ------------------------------------------------------

  function summary() {
    let bought = 0,
      sold = 0,
      spent = 0,
      earned = 0,
      buys = 0,
      sells = 0;
    CA.StockLog.list().forEach((r) => {
      if (r.kind === 'buy') {
        bought += r.shares;
        spent += tradeValue(r);
        buys++;
      } else {
        sold += r.shares;
        earned += tradeValue(r);
        sells++;
      }
    });
    return { bought, sold, spent, earned, net: earned - spent, buys, sells };
  }

  function summaryHtml() {
    const s = summary();
    return (
      statTile('Bought', beautify(s.bought), s.buys + (s.buys === 1 ? ' buy' : ' buys')) +
      statTile('Sold', beautify(s.sold), s.sells + (s.sells === 1 ? ' sell' : ' sells')) +
      statTile('Spent', dollars(s.spent)) +
      statTile('Earned', dollars(s.earned)) +
      statTile('Net', signedDollars(s.net), 'earned − spent')
    );
  }

  // ---- tick bars (last 5 one-second ticks that had a trade) -------------------------

  function tickBuckets() {
    const map = new Map();
    CA.StockLog.list().forEach((r) => {
      const idx = Math.floor(r.t / TICK_BUCKET_MS);
      let b = map.get(idx);
      if (!b) {
        b = { idx, bought: 0, sold: 0, spent: 0, earned: 0 };
        map.set(idx, b);
      }
      if (r.kind === 'buy') {
        b.bought += r.shares;
        b.spent += tradeValue(r);
      } else {
        b.sold += r.shares;
        b.earned += tradeValue(r);
      }
    });
    return [...map.values()]
      .sort((a, b) => a.idx - b.idx)
      .slice(-MAX_TICK_BARS);
  }

  function tickBarHtml(b, maxShares) {
    const t = b.idx * TICK_BUCKET_MS;
    const buyPct = Math.round((b.bought / maxShares) * 100);
    const sellPct = Math.round((b.sold / maxShares) * 100);
    const net = b.earned - b.spent;
    return (
      `<div class="cm-tickbar" title="${esc(clock(t))} — bought ${beautify(b.bought)}, sold ${beautify(b.sold)}">` +
      `<div class="cm-tickbar-time">${clockShort(t)}</div>` +
      `<div class="cm-tickbar-row"><span class="cm-tickbar-fill cm-tickbar-buy" style="width:${buyPct}%"></span></div>` +
      `<div class="cm-tickbar-row"><span class="cm-tickbar-fill cm-tickbar-sell" style="width:${sellPct}%"></span></div>` +
      `<div class="cm-tickbar-net ${net >= 0 ? 'cm-tx-buy' : 'cm-tx-sell'}">${signedDollars(net)}</div>` +
      '</div>'
    );
  }

  function tickBarsHtml() {
    const buckets = tickBuckets();
    if (!buckets.length) return '<div class="cm-ticks-empty">No recent ticks with trades.</div>';
    const maxShares = Math.max(1, ...buckets.map((b) => Math.max(b.bought, b.sold)));
    return buckets.map((b) => tickBarHtml(b, maxShares)).join('');
  }

  // ---- ticker + transaction table -----------------------------------------------------

  function tickerItemHtml(e) {
    const arrow = e.kind === 'buy' ? '▲' : '▼';
    const verb = e.kind === 'buy' ? 'Bought' : 'Sold';
    return `<span class="cm-tick-item cm-tick-${e.kind}">${arrow} ${verb} ${beautify(e.shares)} ${esc(e.name)} @ ${dollars(e.price, 2)}</span>`;
  }

  function logRowHtml(e) {
    return (
      '<tr class="cm-tx-row">' +
      `<td>${clock(e.t)}</td>` +
      `<td class="cm-tx-${e.kind}">${e.kind === 'buy' ? 'Buy' : 'Sell'}</td>` +
      `<td>${esc(e.name)}</td>` +
      `<td>${beautify(e.shares)}</td>` +
      `<td>${dollars(e.price, 2)}</td>` +
      `<td>${dollars(tradeValue(e))}</td>` +
      '</tr>'
    );
  }

  function html() {
    return (
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Transaction history</div></div>' +
      '<div class="ca-stats" data-cm-tx-stats></div>' +
      '<div class="cm-tx-wrap">' +
      '<table class="cm-tx-table">' +
      '<thead><tr><th>Time</th><th>Action</th><th>Stock</th><th>Shares</th><th>Price</th><th>Total</th></tr></thead>' +
      '<tbody data-cm-tx-body></tbody>' +
      '</table>' +
      '<div class="cm-tx-empty" data-cm-tx-empty>No trades yet this session.</div>' +
      '</div>' +
      '</div>' +
      '<div class="cm-tickbars" data-cm-tickbars title="Bought/sold per second, last 5 ticks with activity"></div>' +
      '<div class="cm-ticker" data-cm-ticker title="Every buy/sell, from the autoclicker or from clicking the Bank\'s own buttons">' +
      '<div class="cm-ticker-track" data-cm-ticker-track></div>' +
      '</div>'
    );
  }

  function renderStats() {
    const box = root.querySelector('[data-cm-tx-stats]');
    if (box) box.innerHTML = summaryHtml();
  }

  function renderTickBars() {
    const box = root.querySelector('[data-cm-tickbars]');
    if (box) box.innerHTML = tickBarsHtml();
  }

  function renderLog() {
    const body = root.querySelector('[data-cm-tx-body]');
    const empty = root.querySelector('[data-cm-tx-empty]');
    if (!body) return;
    const rows = CA.StockLog.list().slice(-MAX_LOG_ROWS).reverse();
    body.innerHTML = rows.map(logRowHtml).join('');
    if (empty) empty.style.display = rows.length ? 'none' : '';
  }

  function renderTicker() {
    const track = root.querySelector('[data-cm-ticker-track]');
    if (!track) return;
    const items = CA.StockLog.list().slice(-MAX_TICKER_ITEMS);
    if (!items.length) {
      track.style.animation = 'none';
      track.innerHTML = '<span class="cm-tick-item cm-tick-empty">No trades yet — waiting for the market…</span>';
      return;
    }
    const sep = '<span class="cm-tick-sep">&bull;</span>';
    const strip = items.map(tickerItemHtml).join(sep);
    // Doubled back-to-back so the loop point (translateX -50%) is seamless.
    track.style.animation = 'none';
    track.innerHTML = strip + sep + strip + sep;
    void track.offsetWidth; // force layout so scrollWidth reflects the new content before restarting
    const duration = Math.max(8, track.scrollWidth / 2 / PX_PER_SEC);
    track.style.animation = `cmTickerScroll ${duration}s linear infinite`;
  }

  function tick() {
    if (!root) return;
    const count = CA.StockLog.list().length;
    if (count === lastCount) return;
    lastCount = count;
    renderStats();
    renderTickBars();
    renderLog();
    renderTicker();
  }

  function mount(el) {
    unmount();
    root = el;
    lastCount = -1;
    timer = setInterval(tick, TICK_MS);
    tick();
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    root = null;
  }

  function init() {
    CA.Events.on('stockTrade', tick);
  }

  return { init, html, mount, unmount, tick };
})();

// ---- src/ui/bankToolbar.js -------------------------------------------
// A small toolbar inside the Bank minigame itself, right under its own header: Sell all, the
// stock autobuyer switch, and a shortcut to the CookieMgr Stock market page. It reuses the
// game's own .bankButton styling so it reads as part of the minigame, not an overlay.
//
// NOTE: this reaches into the Bank minigame's DOM (there's no mod API for adding to it), by
// inserting itself right after #bankHeader. If a future game update changes that markup, it
// quietly stops appearing rather than breaking anything else.

CA.UI = CA.UI || {};

CA.UI.BankToolbar = (() => {
  const ID = 'cm-bank-toolbar';
  const I = (name) => CA.UI.Icons.html(name, 12);

  function header() {
    return CA.Stocks.minigame() ? document.getElementById('bankHeader') : null;
  }

  function onClick(e) {
    const b = e.target.closest('[data-cm-bt]');
    if (!b) return;
    switch (b.dataset.cmBt) {
      case 'sell':
        CA.Util.sound('snd/clickOff2.mp3');
        CA.StockTrader.sellAll();
        b.title = CA.StockTrader.sellAllTitle();
        break;
      case 'auto':
        CA.Util.sound(CA.StockTrader.isOn() ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
        CA.StockTrader.toggle();
        break;
      case 'open':
        CA.UI.Menu.openPage('stocks');
        break;
      default:
    }
    sync();
  }

  function ensure() {
    const head = header();
    let bar = document.getElementById(ID);
    if (!head || !CA.Settings.get('bankToolbar')) {
      if (bar) bar.remove();
      return null;
    }
    if (bar && bar.previousElementSibling !== head) {
      bar.remove();
      bar = null;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = ID;
      bar.innerHTML =
        `<div class="bankButton bankButtonSell" data-cm-bt="sell">${I('dollar')}Sell all stocks</div>` +
        '<div class="bankButton bankButtonBuy" data-cm-bt="auto"></div>' +
        `<div class="bankButton cm-bt-open" data-cm-bt="open" title="Open the CookieMgr Stock market page">${I('open')}CookieMgr</div>`;
      bar.addEventListener('click', onClick);
      const sell = bar.querySelector('[data-cm-bt="sell"]');
      sell.addEventListener('mouseenter', () => {
        sell.title = CA.StockTrader.sellAllTitle();
      });
      head.insertAdjacentElement('afterend', bar);
    }
    return bar;
  }

  function sync() {
    const bar = ensure();
    if (!bar) return;
    const on = CA.StockTrader.isOn();
    const auto = bar.querySelector('[data-cm-bt="auto"]');
    auto.innerHTML = `${I('bolt')}Autobuyer: ${on ? 'on' : 'off'}`;
    auto.classList.toggle('bankButtonOff', !on);
    auto.title = 'Buys fast/slow-rising stocks and sells the rest, every second (same switch as on the CookieMgr page)';
  }

  function init() {
    CA.Settings.defineOption({
      key: 'bankToolbar',
      icon: 'toolbar',
      group: 'stocks',
      name: 'Toolbar in the Bank minigame',
      desc: 'Sell all, the autobuyer switch and a CookieMgr shortcut, right under the stock market header.',
      default: true,
    });
    CA.Events.on('macros', sync);
    CA.Events.on('settings', sync);
    setInterval(sync, 1000); // the minigame redraws/opens on its own schedule
    sync();
  }

  return { init };
})();

// ---- src/ui/macrosPage.js --------------------------------------------
// The Macros page (formerly Autoclickers): every macro (features/macros.js) as a row with its
// trigger, steps, hotkey, favourite star and switch; a live "Running now" status of every active
// macro's actions; and an editor for building your own macros out of actions.
//
// The status block (status()) and macro rows (row()) are also used elsewhere: rows on the
// Stock market page, the status block as a widget (ui/widgets.js).

CA.UI = CA.UI || {};

CA.UI.MacrosPage = (() => {
  const C = () => CA.UI.C;
  const I = (name, size) => CA.UI.Icons.html(name, size);
  const esc = (s) => CA.Util.escapeHtml(s);
  const M = () => CA.Macros;
  const STATUS_MS = 500;

  const SECTIONS = [
    { id: 'autoclickers', title: 'Autoclickers', icon: 'cookie' },
    { id: 'stocks', title: 'Stock market', icon: 'stocks' },
    { id: 'grimoire', title: 'Wizard tower', icon: 'wizard' },
    { id: 'garden', title: 'Garden', icon: 'leaf' },
    { id: 'upkeep', title: 'Seasons & sugar lumps', icon: 'calendar' },
  ];
  const ICONS = ['bolt', 'cookie', 'star', 'sparkle', 'play', 'clock', 'stocks', 'dollar', 'wizard', 'wrinkler', 'lump', 'trophy', 'graphs', 'tag', 'marker', 'ascend'];
  const MODES = [
    { v: 'repeat', label: 'Repeat', icon: 'refresh', hint: 'While it’s on, runs its steps every so often.' },
    { v: 'when', label: 'When…', icon: 'filter', hint: 'While it’s on, watches for a condition and runs its steps when it happens.' },
    { v: 'once', label: 'Once', icon: 'play', hint: 'No on/off: its button or hotkey runs the steps one time.' },
    { v: 'group', label: 'Group', icon: 'widget', hint: 'A switch for several macros at once: on turns them all on, off turns them all off.' },
  ];

  let root = null;
  let draft = null; // macro being edited (a copy), or null
  let draftError = '';
  let timer = null;

  // ---- pieces shared with other pages ----------------------------------------------------

  /** The picture for a macro: a game sprite/image, or one of our icons. */
  function icon(m, small) {
    const ic = m.icon || {};
    if (ic.ico) return `<span class="ca-icon ca-icon-ico${small ? ' small' : ''}">${I(ic.ico, small ? 16 : 24)}</span>`;
    return C().icon({ img: ic.img, icon: ic.sprite });
  }

  function ago(t) {
    if (!t) return 'never';
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 2) return 'just now';
    return `${CA.UI.Plot.fmt.span(s)} ago`;
  }

  function stepChip(step) {
    const a = CA.Actions.get(step.action);
    return `<span class="ca-step">${I(a ? a.icon : 'close', 12)}${esc(CA.Actions.describe(step))}</span>`;
  }

  function memberChips(m) {
    const members = M().membersOf(m);
    if (!members.length) return '<span class="ca-step">no members</span>';
    return members.map((x) => `<span class="ca-step ca-step-member">${icon(x, true)}${esc(x.name)}</span>`).join('');
  }

  /** A built-in's choices (its `options`): a dropdown per step param you can pick, right on its row. */
  function optionsHtml(m) {
    if (!m.options || !m.options.length) return '';
    const steps = M().stepsOf(m);
    return (
      '<div class="ca-macro-options">' +
      m.options
        .map((o) => {
          const a = CA.Actions.get(steps[o.step].action);
          const p = a && a.params.find((x) => x.key === o.key);
          if (!p) return '';
          const cur = CA.Actions.paramsFor(steps[o.step].action, steps[o.step].params)[o.key];
          return (
            `<label class="ca-field"><span>${esc(p.label)}</span>` +
            `<select data-macro-param="${esc(m.id)}" data-step="${o.step}" data-key="${esc(o.key)}">` +
            p.options().map((x) => `<option value="${esc(x.v)}"${String(x.v) === String(cur) ? ' selected' : ''}>${esc(x.label)}</option>`).join('') +
            '</select></label>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  /** One macro as a row: picture, name + trigger, steps, status, and its controls. */
  function row(m) {
    const once = m.mode === 'once';
    const fav = M().isFav(m.id);
    let h =
      `<div class="ca-row ca-macro" data-macro-row="${esc(m.id)}">` +
      icon(m) +
      '<div class="ca-row-text">' +
      `<div class="ca-row-name">${esc(m.name)} <span class="ca-badge ca-badge-${m.mode}">${esc(M().triggerText(m))}</span></div>` +
      (m.desc ? `<div class="ca-row-desc">${esc(m.desc)}</div>` : '') +
      `<div class="ca-steps">${m.mode === 'group' ? memberChips(m) : M().stepsOf(m).map(stepChip).join('<span class="ca-step-arrow">›</span>')}</div>` +
      optionsHtml(m) +
      '<div class="ca-macro-status" data-macro-status></div>' +
      '</div>' +
      '<div class="ca-controls">' +
      `<button type="button" class="ca-iconbtn ca-fav${fav ? ' on' : ''}" data-ca="macro-fav" data-id="${esc(m.id)}" title="${fav ? 'Un-favourite (removes its button from the left panel)' : 'Favourite: gives it its own button on the left panel'}">${I(fav ? 'star' : 'starOutline', 15)}</button>`;
    if (m.builtin) h += `<button type="button" class="ca-iconbtn" data-ca="macro-dup" data-id="${esc(m.id)}" title="Duplicate into your own editable macro">${I('plus', 14)}</button>`;
    else {
      h += `<button type="button" class="ca-iconbtn" data-ca="macro-edit" data-id="${esc(m.id)}" title="Edit">${I('edit', 14)}</button>`;
      h += `<button type="button" class="ca-iconbtn" data-ca="macro-dup" data-id="${esc(m.id)}" title="Duplicate">${I('plus', 14)}</button>`;
    }
    h += C().hotkey(`macro.${m.id}`);
    h += once
      ? C().button(`${I('play', 12)} Run`, `data-ca="macro-run" data-id="${esc(m.id)}"`, 'ca-btn-small ca-btn-run')
      : C().toggle(false, `data-ca="macro-toggle" data-id="${esc(m.id)}"`, m.name);
    h += '</div></div>';
    return h;
  }

  /** Live status of every running macro and its actions — the "Running now" block / widget. */
  function status() {
    const ids = M().runningIds();
    if (!ids.length) return '<div class="ca-status-empty">Nothing running. Switch a macro on below, or press its hotkey.</div>';
    const { span, beautify } = CA.UI.Plot.fmt;
    return ids
      .map((id) => {
        const m = M().get(id);
        if (!m) return '';
        const st = M().status(id);
        const up = span((Date.now() - M().since(id)) / 1000);
        let h =
          `<div class="ca-status-macro" data-status-macro="${esc(id)}">` +
          `<div class="ca-status-head">${icon(m, true)}<b>${esc(m.name)}</b><span>${esc(M().triggerText(m))} · on for ${up}</span>` +
          `<button type="button" class="ca-iconbtn" data-ca="macro-toggle" data-id="${esc(id)}" title="Switch off">${I('close', 12)}</button></div>`;
        M().stepsOf(m).forEach((step, i) => {
          const s = st.steps[i] || {};
          const a = CA.Actions.get(step.action) || {};
          const avail = a.available ? a.available() : true;
          h +=
            `<div class="ca-status-step${s.error ? ' err' : !avail ? ' idle' : s.lastAt && Date.now() - s.lastAt < 3000 ? ' hot' : ''}">` +
            `${I(a.icon || 'close', 12)}<span class="ca-status-name">${esc(CA.Actions.describe(step))}</span>` +
            `<span class="ca-status-val">${s.error ? esc(s.error) : !avail ? 'not available' : `${beautify(s.total || 0, 0)}${a.unit ? ' ' + esc(a.unit) : ''} · ${ago(s.lastAt)}`}</span></div>`;
        });
        return h + '</div>';
      })
      .join('');
  }

  // ---- the editor ----------------------------------------------------------------------------

  function blankDraft() {
    return { id: null, name: '', desc: '', icon: { ico: 'bolt' }, mode: 'repeat', every: 1000, steps: [{ action: 'pop.golden', params: {} }], members: [], inAll: false, when: blankWhen() };
  }
  const blankCond = () => ({ cond: 'buff', params: {}, not: false });
  const blankWhen = () => ({ all: [blankCond()], edge: 'rise' });

  function field(p, value, path) {
    const opts = typeof p.options === 'function' ? p.options() : p.options || [];
    const v = value === undefined ? p.default : value;
    let input;
    if (p.type === 'select') {
      const has = opts.some((o) => String(o.v) === String(v));
      input =
        `<select data-edit="${path}" data-type="${typeof p.default === 'number' ? 'number' : 'string'}">` +
        (has || v === '' || v == null ? '' : `<option value="${esc(v)}" selected>${esc(v)}</option>`) +
        (v === '' ? '<option value="" selected disabled>Choose…</option>' : '') +
        opts.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(v) ? ' selected' : ''}>${esc(o.label)}</option>`).join('') +
        '</select>';
    } else if (p.type === 'bool') {
      input = `<input type="checkbox" data-edit="${path}" data-type="bool"${v ? ' checked' : ''}>`;
    } else {
      input = `<input type="number" step="any" data-edit="${path}" data-type="number" value="${esc(v)}"${p.min != null ? ` min="${p.min}"` : ''}>`;
    }
    return `<label class="ca-field"><span>${esc(p.label)}</span>${input}</label>`;
  }

  function actionSelect(step, i) {
    const groups = {};
    CA.Actions.all().forEach((a) => (groups[a.group] = groups[a.group] || []).push(a));
    return (
      `<select data-edit="steps.${i}.action" data-structural>` +
      Object.keys(groups)
        .map((g) => `<optgroup label="${esc(g)}">${groups[g].map((a) => `<option value="${a.id}"${a.id === step.action ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`)
        .join('') +
      '</select>'
    );
  }

  function editorHtml() {
    const d = draft;
    const mode = MODES.find((x) => x.v === d.mode);
    let h =
      '<div class="ca-card ca-editor" data-macro-editor>' +
      C().cardHead(d.id ? 'Edit macro' : 'New macro', 'edit') +
      '<div class="ca-editor-body">' +
      '<div class="ca-editor-row">' +
      `<label class="ca-field ca-grow"><span>Name</span><input type="text" maxlength="60" data-edit="name" value="${esc(d.name)}" placeholder="e.g. Pop everything"></label>` +
      `<label class="ca-field ca-grow"><span>Description</span><input type="text" maxlength="300" data-edit="desc" value="${esc(d.desc)}" placeholder="optional"></label>` +
      '</div>' +
      `<div class="ca-editor-row"><span class="ca-field-label">Icon</span><div class="ca-iconpick">${ICONS.map(
        (n) => `<button type="button" class="ca-iconbtn${(d.icon || {}).ico === n ? ' on' : ''}" data-edit-act="icon" data-val="${n}" title="${n}">${I(n, 16)}</button>`
      ).join('')}</div></div>` +
      `<div class="ca-editor-row"><span class="ca-field-label">Trigger</span><div class="ca-chipgroup">${MODES.map(
        (x) => `<button type="button" class="ca-chip${x.v === d.mode ? ' on' : ''}" data-edit-act="mode" data-val="${x.v}" title="${esc(x.hint)}">${I(x.icon, 12)} ${x.label}</button>`
      ).join('')}</div><span class="ca-hint">${esc(mode.hint)}</span></div>`;
    if (d.mode !== 'once' && d.mode !== 'group') {
      h +=
        '<div class="ca-editor-row">' +
        `<label class="ca-field"><span>${d.mode === 'when' ? 'Check every' : 'Every'}</span><input type="number" step="any" min="${M().MIN_EVERY / 1000}" data-edit="everySec" data-type="number" value="${d.every / 1000}"><em>seconds</em></label>` +
        `<label class="ca-field ca-check"><input type="checkbox" data-edit="inAll" data-type="bool"${d.inAll ? ' checked' : ''}><span>Part of “All autoclickers”</span></label>` +
        '</div>';
    }
    if (d.mode === 'when') {
      const w = d.when;
      h += '<div class="ca-editor-block">';
      w.all.forEach((one, j) => {
        const cond = CA.Conditions.get(one.cond) || CA.Conditions.all()[0];
        h +=
          `<div class="ca-editor-row ca-cond"><span class="ca-field-label">${j ? 'and' : `${I('filter', 13)} When`}</span>` +
          `<select data-edit="when.all.${j}.cond" data-structural>${CA.Conditions.all()
            .map((c) => `<option value="${c.id}"${c.id === one.cond ? ' selected' : ''}>${esc(c.name)}</option>`)
            .join('')}</select>` +
          cond.params.map((p) => field(p, one.params[p.key], `when.all.${j}.params.${p.key}`)).join('') +
          `<label class="ca-field ca-check"><input type="checkbox" data-edit="when.all.${j}.not" data-type="bool"${one.not ? ' checked' : ''}><span>not</span></label>` +
          (w.all.length > 1 ? `<button type="button" class="ca-iconbtn" data-edit-act="cond-del" data-val="${j}" title="Remove this condition">${I('close', 12)}</button>` : '') +
          '</div>';
      });
      h +=
        '<div class="ca-editor-row">' +
        `<button type="button" class="ca-btn ca-btn-small" data-edit-act="cond-add">${I('plus', 12)} And…</button>` +
        `<label class="ca-field"><span>Run</span><select data-edit="when.edge"><option value="rise"${w.edge !== 'while' ? ' selected' : ''}>once each time it happens</option><option value="while"${w.edge === 'while' ? ' selected' : ''}>on every check while it holds</option></select></label>` +
        '</div></div>';
    }
    if (d.mode === 'group') {
      const choices = M()
        .list()
        .filter((m) => m.mode !== 'once' && m.mode !== 'group' && m.id !== d.id);
      h +=
        `<div class="ca-editor-row"><span class="ca-field-label">${I('widget', 13)} Members</span><span class="ca-hint">Switching the group switches all of these together.</span></div>` +
        '<div class="ca-members">' +
        choices
          .map(
            (m) =>
              `<label class="ca-member${d.members.includes(m.id) ? ' on' : ''}"><input type="checkbox" data-member="${esc(m.id)}"${d.members.includes(m.id) ? ' checked' : ''}>` +
              `${icon(m, true)}<span>${esc(m.name)}</span></label>`
          )
          .join('') +
        '</div>';
    } else {
      h += `<div class="ca-editor-row"><span class="ca-field-label">${I('bolt', 13)} Steps</span><span class="ca-hint">Run in order, every time the macro fires.</span></div><div class="ca-editor-steps">`;
    d.steps.forEach((s, i) => {
      const a = CA.Actions.get(s.action);
      h +=
        `<div class="ca-editor-step"><span class="ca-step-n">${i + 1}</span>` +
        actionSelect(s, i) +
        (a ? a.params.map((p) => field(p, s.params[p.key], `steps.${i}.params.${p.key}`)).join('') : '') +
        '<span class="ca-step-tools">' +
        `<button type="button" class="ca-iconbtn" data-edit-act="up" data-val="${i}" title="Move up"${i === 0 ? ' disabled' : ''}>▲</button>` +
        `<button type="button" class="ca-iconbtn" data-edit-act="down" data-val="${i}" title="Move down"${i === d.steps.length - 1 ? ' disabled' : ''}>▼</button>` +
        `<button type="button" class="ca-iconbtn" data-edit-act="del" data-val="${i}" title="Remove step">${I('close', 12)}</button>` +
        '</span></div>';
    });
      h += `<button type="button" class="ca-btn ca-btn-small" data-edit-act="add">${I('plus', 12)} Add step</button></div>`;
    }
    h +=
      (draftError ? `<div class="ca-editor-error">${esc(draftError)}</div>` : '') +
      '<div class="ca-editor-actions">' +
      C().button(`${I('save', 13)} Save`, 'data-edit-act="save"', 'ca-btn-on') +
      C().button('Cancel', 'data-edit-act="cancel"') +
      (d.id ? C().button(`${I('trash', 13)} Delete`, 'data-edit-act="delete" data-arm-label="Delete this macro?"', 'ca-btn-off') : '') +
      '</div></div></div>';
    return h;
  }

  function setPath(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
      o = o[k] = o[k] || {};
    }
    o[parts[parts.length - 1]] = value;
  }

  function onEditInput(e) {
    const el = e.target;
    if (el.dataset && el.dataset.macroParam) {
      if (e.type !== 'change') return;
      CA.Util.sound('snd/tick.mp3');
      M().setParam(el.dataset.macroParam, Number(el.dataset.step), el.dataset.key, el.value);
      // the row's step chip says what it does now
      const row = el.closest('[data-macro-row]');
      const m = M().get(el.dataset.macroParam);
      const chips = row && row.querySelector('.ca-steps');
      if (chips && m) chips.innerHTML = M().stepsOf(m).map(stepChip).join('<span class="ca-step-arrow">›</span>');
      return;
    }
    if (el.dataset && el.dataset.member && draft) {
      const id = el.dataset.member;
      draft.members = (draft.members || []).filter((x) => x !== id);
      if (el.checked) draft.members.push(id);
      el.closest('.ca-member').classList.toggle('on', el.checked);
      return;
    }
    if (!el.dataset || !el.dataset.edit || !draft) return;
    const type = el.dataset.type;
    let v = type === 'bool' ? el.checked : type === 'number' ? Number(el.value) : el.value;
    if (type === 'number' && !Number.isFinite(v)) return;
    if (el.dataset.edit === 'everySec') {
      draft.every = Math.round(v * 1000);
      return;
    }
    setPath(draft, el.dataset.edit, v);
    if ('structural' in el.dataset) {
      // a different action/condition: start from its own defaults
      const m = el.dataset.edit.match(/^steps\.(\d+)\.action$/);
      if (m) draft.steps[Number(m[1])].params = {};
      const c = el.dataset.edit.match(/^when\.all\.(\d+)\.cond$/);
      if (c) draft.when.all[Number(c[1])].params = {};
      renderEditor();
    }
  }

  function validate(d) {
    if (!d.name.trim()) return 'Give it a name.';
    if (d.mode === 'group') return d.members && d.members.length ? '' : 'Tick at least one macro for the group.';
    if (!d.steps.length) return 'Add at least one step.';
    if (d.mode !== 'once' && !(d.every >= M().MIN_EVERY)) return `Run it at most every ${M().MIN_EVERY / 1000}s.`;
    const self = d.steps.find((s) => (s.action === 'macro.run' || s.action === 'macro.set') && d.id && s.params.macro === d.id);
    if (self) return 'A macro can’t switch or run itself.';
    const missing = d.steps.find((s) => (s.action === 'macro.run' || s.action === 'macro.set') && !s.params.macro);
    if (missing) return 'Pick which macro the step should switch or run.';
    return '';
  }

  function onEditAct(t) {
    const act = t.dataset.editAct;
    const i = Number(t.dataset.val);
    const d = draft;
    if (act === 'icon') d.icon = { ico: t.dataset.val };
    else if (act === 'mode') {
      d.mode = t.dataset.val;
      if (d.mode === 'when' && !(d.when && d.when.all && d.when.all.length)) d.when = blankWhen();
      if (d.mode === 'when' && d.every >= 1000) d.every = 250;
    } else if (act === 'cond-add') d.when.all.push(blankCond());
    else if (act === 'cond-del') d.when.all.splice(i, 1);
    else if (act === 'add') d.steps.push({ action: 'pop.golden', params: {} });
    else if (act === 'del') d.steps.splice(i, 1);
    else if (act === 'up' && i > 0) [d.steps[i - 1], d.steps[i]] = [d.steps[i], d.steps[i - 1]];
    else if (act === 'down' && i < d.steps.length - 1) [d.steps[i + 1], d.steps[i]] = [d.steps[i], d.steps[i + 1]];
    else if (act === 'cancel') {
      draft = null;
      draftError = '';
      return rerender();
    } else if (act === 'delete') {
      if (!CA.UI.Menu.armed(t)) return;
      M().remove(d.id);
      draft = null;
      return rerender();
    } else if (act === 'save') {
      // fill in each param's default so the saved macro is explicit
      d.steps.forEach((s) => (s.params = CA.Actions.paramsFor(s.action, s.params)));
      if (d.mode === 'when') d.when.all.forEach((c) => (c.params = CA.Conditions.paramsFor(c.cond, c.params)));
      draftError = validate(d);
      if (draftError) return renderEditor();
      try {
        const saved = M().save(d);
        CA.Util.notify('Macro saved', esc(saved.name), CA.ICON, 2);
        draft = null;
        return rerender();
      } catch (e) {
        draftError = e.message;
      }
    }
    renderEditor();
  }

  function renderEditor() {
    const el = root && root.querySelector('[data-macro-editor]');
    if (el) el.outerHTML = editorHtml();
  }

  /** Opens the editor on macro `id`, or a new macro (optionally starting from `preset` fields). */
  function edit(id, preset) {
    const m = id ? M().get(id) : null;
    draft = m ? JSON.parse(JSON.stringify(m)) : { ...blankDraft(), ...(preset || {}) };
    if (!draft.when || !Array.isArray(draft.when.all)) draft.when = blankWhen();
    if (!Array.isArray(draft.members)) draft.members = [];
    if (!draft.steps.length) draft.steps = [{ action: 'pop.golden', params: {} }]; // a group switched to another mode
    if (CA.Settings.get('tab') !== 'clickers' && CA.UI.Menu.isOpen()) CA.Settings.set('tab', 'clickers');
    draftError = '';
    rerender();
    const el = root && root.querySelector('[data-macro-editor]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  // ---- page ------------------------------------------------------------------------------

  function sectionCard(sec, macros, extraHead, extraTop) {
    return (
      '<div class="ca-card">' +
      C().cardHead(sec.title, sec.icon, extraHead || '') +
      (extraTop || '') +
      `<div class="ca-list">${macros.map(row).join('')}</div>` +
      '</div>'
    );
  }

  function html() {
    const all = M().list();
    let h =
      '<div class="ca-card ca-card-status">' +
      C().cardHead(
        'Running now',
        'play',
        '<div class="ca-card-meta"><span class="ca-pill" data-ca-count></span>' +
          `<button type="button" class="ca-iconbtn" data-ca="widget-add" data-type="status" title="Pop this out as a status bar on the left panel">${I('widget', 13)}</button></div>`
      ) +
      `<div class="ca-status" data-macro-statusblock>${status()}</div>` +
      '</div>';
    if (draft) h += editorHtml();
    SECTIONS.forEach((sec) => {
      const list = all.filter((m) => m.builtin && m.section === sec.id);
      if (!list.length) return;
      const master =
        sec.id === 'autoclickers'
          ? '<div class="ca-row ca-row-master">' +
            C().icon({ icon: CA.ICON }) +
            '<div class="ca-row-text"><div class="ca-row-name">All autoclickers</div>' +
            '<div class="ca-row-desc">The hotkey turns everything on &mdash; or off, if everything is already running.</div></div>' +
            '<div class="ca-controls">' +
            C().button('All on', 'data-ca="all-on"', 'ca-btn-on') +
            C().button('All off', 'data-ca="all-off"', 'ca-btn-off') +
            C().hotkey('clickers.toggleAll') +
            '</div></div>'
          : '';
      h += sectionCard(sec, list, '', master);
    });
    const mine = all.filter((m) => !m.builtin);
    h +=
      '<div class="ca-card">' +
      C().cardHead('Your macros', 'edit', `<div class="ca-card-meta">${C().button(`${I('plus', 12)} New macro`, 'data-ca="macro-new"', 'ca-btn-small')}</div>`) +
      (mine.length
        ? `<div class="ca-list">${mine.map(row).join('')}</div>`
        : '<div class="ca-card-note">Chain actions into your own macros: pop everything at once, sell stocks when a value crosses a line, switch other macros on when an effect starts… Built-in macros can be duplicated as a starting point.</div>') +
      '</div>';
    h += `<div class="ca-card">${C().cardHead('Options', 'settings')}<div class="ca-list">${CA.Settings.optionsIn('macros').map(CA.UI.Menu.optionRow).join('')}</div></div>`;
    return h;
  }

  /** Brings every macro row and status block inside `el` up to date. */
  function sync(el) {
    if (!el) return;
    el.querySelectorAll('[data-macro-row]').forEach((r) => {
      const id = r.dataset.macroRow;
      const m = M().get(id);
      if (!m) return;
      const on = M().isOn(id);
      r.classList.toggle('on', on);
      const sw = r.querySelector('.ca-switch');
      if (sw) {
        sw.classList.toggle('on', on);
        sw.setAttribute('aria-checked', String(on));
      }
      const st = r.querySelector('[data-macro-status]');
      if (st) {
        const s = M().status(id);
        const n = s ? s.steps.reduce((x, y) => x + (y.total || 0), 0) : 0;
        st.textContent = on ? `Running · ${CA.UI.Plot.fmt.span((Date.now() - M().since(id)) / 1000)}${n ? ` · ${n.toLocaleString()} done` : ''}` : s && s.lastRun ? `Last ran ${ago(s.lastRun)}` : '';
      }
    });
    const block = el.querySelector('[data-macro-statusblock]');
    if (block) block.innerHTML = status();
    const count = el.querySelector('[data-ca-count]');
    if (count) {
      const n = M().activeCount();
      count.textContent = n ? `${n} running` : 'all off';
      count.classList.toggle('on', n > 0);
    }
    const allOn = el.querySelector('[data-ca="all-on"]');
    if (allOn) allOn.disabled = M().allOn();
    const allOff = el.querySelector('[data-ca="all-off"]');
    if (allOff) allOff.disabled = !M().inAll().some((m) => M().isOn(m.id));
  }

  /**
   * Runs a once-macro from a button — with feedback when it couldn't do anything because a spell
   * it casts needs more magic than there is: the button shakes, the game's spell-fail sound plays,
   * and a notice says how much it costs and when it'll be ready.
   */
  function run(id, el) {
    const m = M().get(id);
    if (!m) return 0;
    const spells = m.steps.filter((x) => x.action === 'spell.cast').map((x) => x.params && x.params.spell);
    const n = M().runOnce(id);
    if (n > 0 || !spells.length) {
      CA.Util.sound('snd/clickOn2.mp3');
      return n;
    }
    CA.Util.sound('snd/spellFail.mp3');
    if (el && el.classList) {
      el.classList.remove('ca-shake');
      void el.offsetWidth; // restart the animation
      el.classList.add('ca-shake');
      setTimeout(() => el.classList.remove('ca-shake'), 500);
    }
    const mg = CA.Grimoire.magicNow();
    if (!mg) {
      CA.Util.notify(m.name, 'The Grimoire isn’t open yet (Wizard tower level 1).', [22, 11], 3);
      return 0;
    }
    const s = CA.Grimoire.spells().find((x) => spells.includes(x.key) && !x.affordable);
    if (s) {
      const { span } = CA.UI.Plot.fmt;
      const when = Number.isFinite(s.wait) ? `ready in ${span(s.wait)}` : `more than your maximum of ${Math.floor(mg.max)}`;
      CA.Util.notify('Not enough magic', `${esc(s.name)} needs <b>${s.cost}</b> magic — you have ${Math.floor(mg.magic)} (${when}).`, s.icon, 3);
    }
    return 0;
  }

  function rerender() {
    if (CA.UI.Menu.isOpen()) CA.UI.Menu.render();
  }

  /** Clicks on macro controls anywhere in the panel (menu.js forwards data-ca="macro-…"). */
  function handle(kind, t) {
    const id = t.dataset.id;
    switch (kind) {
      case 'macro-toggle':
        CA.Util.sound(M().isOn(id) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
        M().toggle(id);
        return true;
      case 'macro-run':
        run(id, t);
        return true;
      case 'macro-fav': {
        CA.Util.sound('snd/tick.mp3');
        const fav = !M().isFav(id);
        M().setFav(id, fav); // → its own button widget appears / goes (ui/widgets.js)
        if (fav) {
          if (!CA.Settings.get('widgetsShown')) CA.Settings.set('widgetsShown', true);
          CA.Util.notify(M().get(id).name, 'Added as a button on the left panel — drag it wherever you like.', CA.ICON, 2);
        }
        rerender();
        return true;
      }
      case 'macro-dup': {
        CA.Util.sound('snd/tick.mp3');
        const copy = M().duplicate(id);
        if (CA.Settings.get('tab') !== 'clickers') CA.UI.Menu.openPage('clickers');
        if (copy) edit(copy.id);
        return true;
      }
      case 'macro-edit':
        CA.Util.sound('snd/tick.mp3');
        edit(id);
        return true;
      case 'macro-new':
        CA.Util.sound('snd/tick.mp3');
        edit(null);
        return true;
      case 'widget-add': {
        CA.Util.sound('snd/tick.mp3');
        const type = t.dataset.type;
        const had = CA.UI.Widgets.has(type);
        CA.UI.Widgets.add(type);
        if (!CA.Settings.get('widgetsShown')) CA.Settings.set('widgetsShown', true);
        const name = (CA.UI.Widgets.types().find((x) => x.id === type) || {}).name || 'Widget';
        CA.Util.notify(name, had ? 'Already on the left panel.' : 'Added to the left panel — drag it wherever you like.', CA.ICON, 2);
        return true;
      }
      case 'all-on':
        CA.Util.sound('snd/clickOn2.mp3');
        M().setAll(true);
        return true;
      case 'all-off':
        CA.Util.sound('snd/clickOff2.mp3');
        M().setAll(false);
        return true;
      default:
        return false;
    }
  }

  function onRootClick(e) {
    const t = e.target.closest('[data-edit-act]');
    if (!t || !draft) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    onEditAct(t);
  }

  function mount(el) {
    unmount();
    root = el;
    root.addEventListener('click', onRootClick);
    root.addEventListener('change', onEditInput);
    root.addEventListener('input', onEditInput);
    sync(root);
    timer = setInterval(() => root && root.isConnected && sync(root), STATUS_MS);
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (root) {
      root.removeEventListener('click', onRootClick);
      root.removeEventListener('change', onEditInput);
      root.removeEventListener('input', onEditInput);
    }
    root = null;
  }

  function init() {
    CA.UI.Pages.register({ id: 'clickers', label: 'Macros', icon: 'bolt', order: 70, html, mount, unmount, tick: () => sync(root) });
  }

  return { init, row, status, sync, handle, icon, edit, run, draft: () => draft };
})();

// ---- src/ui/widgets.js -----------------------------------------------
// **Widgets**: small things on the game's left panel (around the big cookie) that you drag around.
// This is the engine — placing, dragging, sizing, settings, saving. What each widget shows lives in
// ui/widgetTypes.js.
//
// Two looks: framed boxes (dragged by their title bar) and bare widgets — buttons, the status bar
// and the round minigame widgets — with no frame, dragged from anywhere (a press that doesn't move
// is a click). Every widget resizes from its bottom-right corner: bare ones scale (keeping their
// shape), framed boxes take any width and height.
//
// Settings: every widget's ⚙ opens its own settings on the Widgets page (also reachable from the
// list of placed widgets there): text size for all, size for bare ones, a title for framed ones,
// and whatever its type adds (which Quick stats, how many events…).
//
// Positions are fractions of the panel, applied with CSS percentages (left: x·100% plus a
// translate of −x·100% of the widget's own size), so a widget follows the panel's layout by
// itself — nothing is measured or re-placed in JavaScript, so nothing jumps when the game (or
// Cookie Monster) resizes the panel while loading. The list is saved with your settings.
// The layer sits above the game's big-cookie click target but below its popups and golden cookies.
//
// Content refreshes twice a second by patching the existing DOM (morph()), never replacing it, so
// whatever is under the mouse — and its popup — stays put.
//
//   CA.UI.Widgets.defineType({ id, name, icon, desc, bare, width, single, hidden, resize, settings, html(inst) })

CA.UI = CA.UI || {};

CA.UI.Widgets = (() => {
  const TICK_MS = 500;
  const DRAG_PX = 4; // a press that moves less than this is a click, not a drag
  const BUTTON_PX = 44; // macro button size incl. spacing, for laying out new ones
  const SCALE_MIN = 0.6;
  const SCALE_MAX = 3;
  const FONT_MIN = 60;
  const FONT_MAX = 200;
  const MIN_W = 140;
  const MIN_H = 60;
  const SAVED = ['count', 'types', 'stats', 'font', 'title']; // per-widget settings that are saved
  const TRANSIENT = ['ca-shake']; // classes a refresh leaves alone
  const S = () => CA.Settings;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);

  const types = [];
  const typeById = {};
  let widgets = []; // { id, type, x, y, collapsed, macro?, scale?, w?, h?, count?, types?, stats?, font?, title? }
  let layer = null;
  let press = null; // { w, el, sx, sy, dx, dy, moved }
  let swallowClick = false;
  let anchor = null; // where a v2.1 Shortcuts widget was, for laying out its buttons
  let editing = null; // id of the widget whose settings the Widgets page shows

  function defineType(t) {
    const d = { width: 220, single: false, bare: false, hidden: false, icon: 'widget', settings: [], ...t };
    types.push(d);
    typeById[d.id] = d;
    return d;
  }

  // ---- instances ------------------------------------------------------------------------------

  const newId = () => `w${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

  function add(type, pos, extra) {
    const t = typeById[type];
    if (!t) return null;
    if (t.single) {
      const existing = widgets.find((w) => w.type === type);
      if (existing) return existing;
    }
    let p = pos;
    if (!p && t.bare) p = nextButtonPos(); // round widgets line up with the buttons
    if (!p) {
      const n = widgets.filter((w) => !typeById[w.type].bare).length;
      p = { x: 0.04, y: Math.min(0.85, 0.52 + n * 0.06) };
    }
    const w = { id: newId(), type, x: p.x, y: p.y, collapsed: false, ...(extra || {}) };
    widgets.push(w);
    changed();
    return w;
  }

  /** Where columns of buttons stop going up: just below the CookieMgr sidebar on the right edge
   *  of the panel (or a third of the way down if it can't be measured). */
  function columnTop(host, H) {
    const tab = document.getElementById('CookieMgrTab');
    if (tab && tab.getBoundingClientRect && host.getBoundingClientRect) {
      const r = tab.getBoundingClientRect();
      if (r.height) return Math.max(0, r.bottom - host.getBoundingClientRect().top + 8);
    }
    return H * 0.35;
  }

  /** The next free spot for a small widget: from the bottom-right corner upwards (clear of the
   *  bottom-left, where the dragon and Santa live), then the next column to the left, again from
   *  the bottom. A v2.1 Shortcuts widget's buttons start where it was instead. */
  function nextButtonPos() {
    const host = layer && layer.parentNode;
    const W = (host && host.clientWidth) || 400;
    const H = (host && host.clientHeight) || 800;
    const fx = (px) => (W > BUTTON_PX ? px / (W - BUTTON_PX) : 0);
    const fy = (py) => (H > BUTTON_PX ? py / (H - BUTTON_PX) : 0);
    const taken = widgets.filter((w) => typeById[w.type] && typeById[w.type].bare && w.type !== 'status').map((w) => ({ x: w.x * (W - BUTTON_PX), y: w.y * (H - BUTTON_PX) }));
    const free = (x, y) => !taken.some((t) => Math.abs(t.x - x) < BUTTON_PX / 2 && Math.abs(t.y - y) < BUTTON_PX / 2);
    if (anchor) return { x: Math.min(1, fx(anchor.x * (W - BUTTON_PX) + taken.length * BUTTON_PX)), y: anchor.y };
    const bottom = H - BUTTON_PX - 12;
    const rows = Math.max(1, Math.floor((bottom - columnTop(host, H)) / BUTTON_PX) + 1);
    const cols = Math.max(1, Math.floor((W - 8) / BUTTON_PX));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = W - BUTTON_PX - 8 - c * BUTTON_PX;
        const y = bottom - r * BUTTON_PX;
        if (free(x, y)) return { x: fx(x), y: fy(y) };
      }
    }
    return { x: fx(W - BUTTON_PX - 8), y: fy(bottom) };
  }

  /** Keeps macro buttons in step with ★ favourites: one button per favourite, none for the rest. */
  function reconcile() {
    let dirty = false;
    widgets = widgets.filter((w) => {
      if (w.type !== 'macro') return true;
      const keep = CA.Macros.get(w.macro) && CA.Macros.isFav(w.macro);
      if (!keep) dirty = true;
      return keep;
    });
    CA.Macros.list().forEach((m) => {
      if (!CA.Macros.isFav(m.id) || widgets.some((w) => w.type === 'macro' && w.macro === m.id)) return;
      widgets.push({ id: newId(), type: 'macro', macro: m.id, ...nextButtonPos(), collapsed: false });
      dirty = true;
    });
    anchor = null;
    if (dirty) changed();
  }

  function remove(id) {
    const w = widgets.find((x) => x.id === id);
    if (!w) return;
    if (editing === id) editing = null;
    if (w.type === 'macro') {
      CA.Macros.setFav(w.macro, false); // → reconcile() takes the button away
      return;
    }
    widgets.splice(widgets.indexOf(w), 1);
    changed();
  }

  function changed() {
    render();
    CA.Events.emit('widgets');
  }

  const list = () => widgets.slice();
  const has = (type) => widgets.some((w) => w.type === type);
  const get = (id) => widgets.find((w) => w.id === id) || null;
  /** The name a widget shows (its title, or its type's name — a macro button: the macro's). */
  function nameOf(w) {
    if (w.title) return w.title;
    if (w.type === 'macro') {
      const m = CA.Macros.get(w.macro);
      return m ? m.name : 'Macro button';
    }
    return (typeById[w.type] || {}).name || w.type;
  }

  // ---- rendering ------------------------------------------------------------------------------

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    const host = document.getElementById('sectionLeft');
    if (!host) return null;
    layer = document.createElement('div');
    layer.id = 'CookieMgrWidgets';
    layer.addEventListener('mousedown', onMouseDown);
    layer.addEventListener('click', onClick);
    host.appendChild(layer);
    return layer;
  }

  const RESIZE = '<span class="ca-w-resize" data-w-resize aria-label="Resize"></span>';
  const fontOf = (w) => Math.max(FONT_MIN, Math.min(FONT_MAX, w.font || 100)) / 100;

  function frameHtml(w) {
    const t = typeById[w.type];
    const fs = `--wfs:${fontOf(w)}`;
    if (t.bare) {
      return (
        `<div class="ca-w ca-w-bare ca-w-${w.type}" data-widget="${w.id}" data-w-drag style="${fs}">` +
        `<div class="ca-w-body" data-w-body>${safeHtml(t, w)}</div>` +
        `<button type="button" class="ca-w-x" data-w-remove aria-label="${w.type === 'macro' ? 'Remove (un-favourites the macro)' : 'Remove widget'}">${I('close', 8)}</button>` +
        `<button type="button" class="ca-w-x ca-w-gear" data-w-settings aria-label="Settings">${I('settings', 8)}</button>` +
        RESIZE +
        '</div>'
      );
    }
    return (
      `<div class="ca-w${w.collapsed ? ' collapsed' : ''}${w.h ? ' sized' : ''}" data-widget="${w.id}" style="${fs};width:${w.w || t.width}px${w.h && !w.collapsed ? `;height:${w.h}px` : ''}">` +
      '<div class="ca-w-head" data-w-drag>' +
      `${I(t.icon, 12)}<span class="ca-w-title">${esc(nameOf(w))}</span>` +
      `<button type="button" class="ca-w-btn" data-w-settings aria-label="Settings">${I('settings', 10)}</button>` +
      `<button type="button" class="ca-w-btn" data-w-collapse aria-label="${w.collapsed ? 'Expand' : 'Collapse'}">${w.collapsed ? '▸' : '▾'}</button>` +
      `<button type="button" class="ca-w-btn" data-w-remove aria-label="Remove widget">${I('close', 10)}</button>` +
      '</div>' +
      `<div class="ca-w-body ca-wt" data-w-body>${w.collapsed ? '' : safeHtml(t, w)}</div>` +
      (w.collapsed ? '' : RESIZE) +
      '</div>'
    );
  }

  function safeHtml(t, w) {
    try {
      return t.html(w);
    } catch (e) {
      return `<div class="ca-w-empty">Couldn’t draw this widget (${esc(e.message)}).</div>`;
    }
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const scaleOf = (w) => (typeById[w.type] && typeById[w.type].resize === 'scale' ? w.scale || 1 : 1);

  /** Positions a widget purely with CSS (see the top of this file): it follows the panel by itself. */
  function place(el, w) {
    const sc = scaleOf(w);
    const x = clamp01(w.x);
    const y = clamp01(w.y);
    el.style.left = `${x * 100}%`;
    el.style.top = `${y * 100}%`;
    el.style.transform = `translate(${-x * sc * 100}%, ${-y * sc * 100}%)${sc !== 1 ? ` scale(${sc})` : ''}`;
    el.classList.toggle('pop-below', y < 0.25);
    el.classList.toggle('pop-left', x > 0.5);
  }

  /** Where a widget actually is right now, in px (for dragging and resizing). */
  function geom(w, el) {
    const host = layer.parentNode;
    const W = host.clientWidth || 0;
    const H = host.clientHeight || 0;
    const sc = scaleOf(w);
    const vw = (el.offsetWidth || 0) * sc;
    const vh = (el.offsetHeight || 0) * sc;
    return { W, H, sc, vw, vh, left: clamp01(w.x) * Math.max(0, W - vw), top: clamp01(w.y) * Math.max(0, H - vh) };
  }

  /** Sets the fractions so the widget's top-left lands at (left, top) px. */
  function moveTo(w, el, left, top) {
    const g = geom(w, el);
    w.x = g.W > g.vw ? clamp01(left / (g.W - g.vw)) : 0;
    w.y = g.H > g.vh ? clamp01(top / (g.H - g.vh)) : 0;
    place(el, w);
  }

  function render() {
    if (!ensureLayer()) return;
    layer.classList.toggle('ca-hidden', !S().get('widgetsShown'));
    layer.classList.toggle('locked', !!S().get('widgetsLocked'));
    layer.innerHTML = widgets.filter((w) => typeById[w.type]).map(frameHtml).join('');
    widgets.forEach((w) => {
      const el = layer.querySelector(`[data-widget="${w.id}"]`);
      if (el) place(el, w);
    });
  }

  /**
   * Makes `target`'s children match `html` while keeping every node that's still the same kind of
   * node — only text and attributes change — so hover states and open popups survive an update.
   */
  function morph(target, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    morphChildren(target, tpl.content);
  }
  function morphChildren(target, source) {
    const a = target.childNodes;
    const b = source.childNodes;
    for (let i = 0; i < b.length; i++) {
      const want = b[i];
      const have = a[i];
      if (!have) {
        target.appendChild(want.cloneNode(true));
        continue;
      }
      if (have.nodeType !== want.nodeType || have.nodeName !== want.nodeName) {
        target.replaceChild(want.cloneNode(true), have);
        continue;
      }
      if (want.nodeType === 3) {
        if (have.nodeValue !== want.nodeValue) have.nodeValue = want.nodeValue;
        continue;
      }
      if (want.nodeType !== 1) continue;
      for (const attr of [...have.attributes]) if (!want.hasAttribute(attr.name)) have.removeAttribute(attr.name);
      for (const attr of [...want.attributes]) {
        let v = attr.value;
        // keep feedback a click added (a shake) until its own timer takes it away
        if (attr.name === 'class') TRANSIENT.forEach((c) => have.classList.contains(c) && !want.classList.contains(c) && (v += ` ${c}`));
        if (have.getAttribute(attr.name) !== v) have.setAttribute(attr.name, v);
      }
      morphChildren(have, want);
    }
    while (a.length > b.length) target.removeChild(target.lastChild);
  }

  /** Refreshes each widget's content in place (positions untouched). */
  function tick() {
    if (!layer || !layer.isConnected) return render();
    if (!S().get('widgetsShown') || (press && press.moved)) return;
    widgets.forEach((w) => {
      if (w.collapsed) return;
      const body = layer.querySelector(`[data-widget="${w.id}"] [data-w-body]`);
      const t = typeById[w.type];
      if (body && t) morph(body, safeHtml(t, w));
    });
  }

  // ---- interaction ----------------------------------------------------------------------------

  function onMouseDown(e) {
    // keep presses on widgets from reaching the big cookie / the game's panel handlers
    e.stopPropagation();
    if (S().get('widgetsLocked') || e.button !== 0) return;
    const grip = e.target.closest('[data-w-resize]');
    const handle = grip || e.target.closest('[data-w-drag]');
    if (!handle || e.target.closest('[data-w-remove],[data-w-collapse],[data-w-settings]')) return;
    const el = handle.closest('[data-widget]');
    const w = widgets.find((x) => x.id === el.dataset.widget);
    if (!w) return;
    // framed widgets: buttons in the title bar aren't drag handles; bare ones drag from anywhere
    if (!grip && !typeById[w.type].bare && e.target.closest('button')) return;
    e.preventDefault();
    const g = geom(w, el);
    press = {
      mode: grip ? 'resize' : 'move',
      w,
      el,
      sx: e.clientX,
      sy: e.clientY,
      left: g.left,
      top: g.top,
      sc: g.sc,
      baseW: el.offsetWidth || 1,
      baseH: el.offsetHeight || 1,
      moved: false,
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!press) return;
    const dx = e.clientX - press.sx;
    const dy = e.clientY - press.sy;
    if (!press.moved) {
      if (Math.abs(dx) < DRAG_PX && Math.abs(dy) < DRAG_PX) return;
      press.moved = true;
      press.el.classList.add(press.mode === 'resize' ? 'resizing' : 'dragging');
    }
    const { w, el } = press;
    if (press.mode === 'move') {
      moveTo(w, el, press.left + dx, press.top + dy);
      return;
    }
    // resize from the bottom-right corner, keeping the top-left where it is
    if (typeById[w.type].resize === 'scale') {
      const grow = Math.max(dx / press.baseW, dy / press.baseH); // keeps the shape
      w.scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, press.sc + grow));
    } else {
      const g = geom(w, el);
      w.w = Math.round(Math.max(MIN_W, Math.min(g.W - press.left, press.baseW + dx)));
      w.h = Math.round(Math.max(MIN_H, Math.min(g.H - press.top, press.baseH + dy)));
      el.style.width = `${w.w}px`;
      el.style.height = `${w.h}px`;
      el.classList.add('sized');
    }
    moveTo(w, el, press.left, press.top);
  }

  function onMouseUp() {
    if (!press) return;
    const moved = press.moved;
    press.el.classList.remove('dragging', 'resizing');
    press = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (moved) {
      swallowClick = true; // the click that follows a drag isn't a click
      setTimeout(() => (swallowClick = false), 0);
      CA.Events.emit('widgets');
    }
  }

  function onClick(e) {
    e.stopPropagation();
    if (swallowClick) {
      swallowClick = false;
      return;
    }
    const el = e.target.closest('[data-widget]');
    const w = el && widgets.find((x) => x.id === el.dataset.widget);
    if (!w) return;
    if (e.target.closest('[data-w-remove]')) {
      CA.Util.sound('snd/tick.mp3');
      remove(w.id);
      return;
    }
    if (e.target.closest('[data-w-settings]')) {
      CA.Util.sound('snd/tick.mp3');
      openSettings(w.id);
      return;
    }
    if (e.target.closest('[data-w-collapse]')) {
      CA.Util.sound('snd/tick.mp3');
      w.collapsed = !w.collapsed;
      changed();
      return;
    }
    const trig = e.target.closest('[data-w-trigger]');
    if (trig) {
      const m = CA.Macros.get(trig.dataset.wTrigger);
      if (!m) return;
      if (m.mode !== 'once') CA.Util.sound(CA.Macros.isOn(m.id) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3'); // once macros: run() picks the sound
      if (m.mode === 'once') CA.UI.MacrosPage.run(m.id, trig);
      else CA.Macros.trigger(m.id);
      tick();
      return;
    }
    const mg = e.target.closest('[data-w-open-mg]');
    if (mg) {
      CA.Util.sound('snd/tick.mp3');
      CA.UI.WidgetTypes.openMinigame(mg.dataset.wOpenMg);
      return;
    }
    const open = e.target.closest('[data-w-open]');
    if (open) {
      CA.Util.sound('snd/tick.mp3');
      CA.UI.Menu.openPage(open.dataset.wOpen);
      return;
    }
    const ca = e.target.closest('[data-ca]');
    if (ca && CA.UI.MacrosPage.handle(ca.dataset.ca, ca)) tick();
  }

  // ---- settings ------------------------------------------------------------------------------

  /** Opens the Widgets page on widget `id`'s settings. */
  function openSettings(id) {
    editing = id;
    if (CA.UI.Menu.isOpen() && CA.Settings.get('tab') === 'widgets') CA.UI.Menu.render();
    else CA.UI.Menu.openPage('widgets');
  }

  /** Applies one setting change from the editor and redraws the widget. */
  function setOption(w, key, value) {
    w[key] = value;
    changed();
  }

  function editorHtml(w) {
    const t = typeById[w.type];
    const C = CA.UI.C;
    const field = (label, input, hint) => `<div class="ca-weditor-row"><span class="ca-field-label">${label}</span>${input}${hint ? `<span class="ca-hint">${hint}</span>` : ''}</div>`;
    let h =
      `<div class="ca-card ca-weditor" data-w-editor="${esc(w.id)}">` +
      C.cardHead(`${esc(nameOf(w))} — settings`, t.icon, `<div class="ca-card-meta">${C.button('Done', 'data-w-edit-done', 'ca-btn-small ca-btn-on')}</div>`) +
      '<div class="ca-weditor-body">';
    h += field('Text size', `<input type="range" min="${FONT_MIN}" max="${FONT_MAX}" step="5" value="${Math.round(fontOf(w) * 100)}" data-w-opt="font" data-type="number"><span class="ca-range-val">${Math.round(fontOf(w) * 100)}%</span>`);
    if (t.resize === 'scale') {
      h += field('Size', `<input type="range" min="${SCALE_MIN * 100}" max="${SCALE_MAX * 100}" step="5" value="${Math.round(scaleOf(w) * 100)}" data-w-opt="scale" data-type="percent"><span class="ca-range-val">${Math.round(scaleOf(w) * 100)}%</span>`, 'or drag its corner');
    } else {
      h += field('Title', `<input type="text" maxlength="40" value="${esc(w.title || '')}" placeholder="${esc(t.name)}" data-w-opt="title" data-type="text">`);
    }
    (t.settings || []).forEach((s) => {
      const cur = w[s.key] !== undefined ? w[s.key] : s.default;
      if (s.type === 'number') {
        h += field(esc(s.label), `<input type="number" min="${s.min}" max="${s.max}" value="${esc(cur)}" data-w-opt="${s.key}" data-type="number" data-min="${s.min}" data-max="${s.max}">${s.unit ? `<em>${esc(s.unit)}</em>` : ''}`);
      } else if (s.type === 'multi') {
        const chosen = new Set(cur || []);
        h +=
          `<div class="ca-weditor-row"><span class="ca-field-label">${esc(s.label)}</span></div><div class="ca-members">` +
          s
            .options()
            .map(
              (o) =>
                `<label class="ca-member${chosen.has(o.v) ? ' on' : ''}"><input type="checkbox" data-w-multi="${s.key}" value="${esc(o.v)}"${chosen.has(o.v) ? ' checked' : ''}>` +
                `${o.icon ? `<span style="color:${o.color || 'inherit'}">${I(o.icon, 13)}</span>` : ''}<span>${esc(o.label)}</span></label>`
            )
            .join('') +
          '</div>';
      }
    });
    h += '</div></div>';
    return h;
  }

  function onEditorInput(e) {
    const el = e.target;
    const box = el.closest && el.closest('[data-w-editor]');
    const w = box && get(box.dataset.wEditor);
    if (!w) return;
    if (el.dataset.wMulti) {
      const key = el.dataset.wMulti;
      const t = typeById[w.type];
      const def = (t.settings.find((s) => s.key === key) || {}).default || [];
      const set = new Set(w[key] !== undefined ? w[key] : def);
      if (el.checked) set.add(el.value);
      else set.delete(el.value);
      el.closest('.ca-member').classList.toggle('on', el.checked);
      setOption(w, key, [...set]);
      return;
    }
    const key = el.dataset.wOpt;
    if (!key) return;
    let v = el.value;
    if (el.dataset.type === 'number' || el.dataset.type === 'percent') {
      v = Number(v);
      if (!Number.isFinite(v)) return;
      if (el.dataset.min) v = Math.max(Number(el.dataset.min), Math.min(Number(el.dataset.max), Math.round(v)));
      if (el.dataset.type === 'percent') v /= 100;
    } else v = String(v).trim().slice(0, 40);
    const label = el.parentNode.querySelector('.ca-range-val');
    if (label) label.textContent = `${Math.round(el.dataset.type === 'percent' ? v * 100 : v)}%`;
    setOption(w, key, v);
  }

  // ---- save / load ------------------------------------------------------------------------

  const round = (v) => Math.round(v * 1000) / 1000;

  function serialize() {
    return widgets.map((wd) => {
      const out = { id: wd.id, type: wd.type, x: round(wd.x), y: round(wd.y), collapsed: wd.collapsed };
      if (wd.macro) out.macro = wd.macro;
      if (wd.scale && wd.scale !== 1) out.scale = round(wd.scale);
      if (wd.w) out.w = wd.w;
      if (wd.h) out.h = wd.h;
      SAVED.forEach((k) => {
        if (wd[k] === undefined || wd[k] === '' || (Array.isArray(wd[k]) && !wd[k].length && k === 'types')) return;
        out[k] = Array.isArray(wd[k]) ? wd[k].slice() : wd[k];
      });
      return out;
    });
  }

  function load(data) {
    if (!Array.isArray(data)) return;
    const ok = (w) => w && Number.isFinite(w.x) && Number.isFinite(w.y);
    // v2.1 had one Shortcuts widget for all favourites; its buttons now start where it was
    const old = data.find((w) => ok(w) && w.type === 'shortcuts');
    anchor = old ? { x: old.x, y: old.y } : null;
    widgets = data
      .filter((w) => ok(w) && typeById[w.type])
      .map((w) => {
        const out = { id: String(w.id || newId()), type: w.type, x: w.x, y: w.y, collapsed: !!w.collapsed };
        if (w.macro) out.macro = String(w.macro);
        if (Number.isFinite(w.scale)) out.scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, w.scale));
        if (Number.isFinite(w.w)) out.w = Math.max(MIN_W, w.w);
        if (Number.isFinite(w.h)) out.h = Math.max(MIN_H, w.h);
        if (Number.isFinite(w.count)) out.count = w.count;
        if (Number.isFinite(w.font)) out.font = Math.max(FONT_MIN, Math.min(FONT_MAX, w.font));
        if (typeof w.title === 'string') out.title = w.title.slice(0, 40);
        if (Array.isArray(w.types)) out.types = w.types.map(String);
        if (Array.isArray(w.stats)) out.stats = w.stats.map(String);
        return out;
      });
    render();
    reconcile();
  }

  // ---- the Widgets page ------------------------------------------------------------------

  function pageHtml() {
    const C = CA.UI.C;
    const favs = CA.Macros.list().filter((m) => CA.Macros.isFav(m.id));
    let h = '';
    const ed = editing && get(editing);
    if (ed) h += editorHtml(ed);
    else editing = null;

    // what's placed, each with its settings
    if (widgets.length) {
      h += `<div class="ca-card">${C.cardHead('Your widgets', 'widget')}<div class="ca-list">`;
      widgets.forEach((w) => {
        const t = typeById[w.type];
        if (!t) return;
        h +=
          `<div class="ca-row${w.id === editing ? ' on' : ''}">` +
          `<span class="ca-row-ico">${I(t.icon, 16)}</span>` +
          `<div class="ca-row-text"><div class="ca-row-name">${esc(nameOf(w))}</div><div class="ca-row-desc">${esc(w.type === 'macro' ? 'Macro button' : t.name)}</div></div>` +
          '<div class="ca-controls">' +
          C.button(`${I('settings', 12)} Settings`, `data-w-page-edit="${esc(w.id)}"`, 'ca-btn-small') +
          `<button type="button" class="ca-iconbtn" data-w-page-del="${esc(w.id)}" title="Remove">${I('close', 12)}</button>` +
          '</div></div>';
      });
      h += '</div></div>';
    }

    h +=
      '<div class="ca-card">' +
      C.cardHead('Add a widget', 'plus') +
      '<div class="ca-card-note">Widgets sit on the left panel, around the big cookie. Drag them anywhere — framed ones by their title bar, the rest from anywhere — and resize them from their corner. Hover for × and ⚙.</div>' +
      '<div class="ca-list">' +
      '<div class="ca-row">' +
      `<span class="ca-row-ico">${I('star', 16)}</span>` +
      `<div class="ca-row-text"><div class="ca-row-name">Macro buttons${favs.length ? ` <span class="ca-badge">${favs.length} placed</span>` : ''}</div>` +
      '<div class="ca-row-desc">★ a macro (or a spell on the Wizard tower page) and it gets its own button here: click to switch it on/off or run it, hover for its name. Un-star it to take it away.</div></div>' +
      `<div class="ca-controls">${C.button(`${I('open', 12)} Macros`, 'data-ca="open-macros"', 'ca-btn-small')}</div>` +
      '</div>';
    types
      .filter((t) => !t.hidden)
      .forEach((t) => {
        const placed = widgets.filter((w) => w.type === t.id).length;
        h +=
          '<div class="ca-row">' +
          `<span class="ca-row-ico">${I(t.icon, 16)}</span>` +
          `<div class="ca-row-text"><div class="ca-row-name">${esc(t.name)}${placed ? ` <span class="ca-badge">${placed} placed</span>` : ''}</div><div class="ca-row-desc">${esc(t.desc)}</div></div>` +
          '<div class="ca-controls">' +
          (t.single && placed
            ? C.button('Remove', `data-w-page-remove="${t.id}"`, 'ca-btn-small ca-btn-off')
            : C.button(`${I('plus', 12)} Add`, `data-w-page-add="${t.id}"`, 'ca-btn-small ca-btn-on')) +
          '</div></div>';
      });
    h += '</div></div>';
    h +=
      `<div class="ca-card">${C.cardHead('Options', 'settings')}<div class="ca-list">${S().optionsIn('widgets').map(CA.UI.Menu.optionRow).join('')}` +
      '<div class="ca-row ca-row-option">' +
      `<span class="ca-row-ico">${I('trash', 16)}</span>` +
      '<div class="ca-row-text"><div class="ca-row-name">Remove all widgets</div><div class="ca-row-desc">Clears the left panel (and un-stars your macros).</div></div>' +
      C.button('Remove all', 'data-w-page-clear data-arm-label="Remove them all?"', 'ca-btn-small ca-btn-off') +
      '</div></div></div>';
    return h;
  }

  let pageRoot = null;
  function onPageClick(e) {
    const t = e.target.closest('[data-w-page-add],[data-w-page-remove],[data-w-page-clear],[data-w-page-edit],[data-w-page-del],[data-w-edit-done]');
    if (!t) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    const d = t.dataset;
    if ('wPageAdd' in d) {
      add(d.wPageAdd);
      if (!S().get('widgetsShown')) S().set('widgetsShown', true);
    } else if ('wPageRemove' in d) widgets.filter((w) => w.type === d.wPageRemove).forEach((w) => remove(w.id));
    else if ('wPageEdit' in d) editing = d.wPageEdit;
    else if ('wPageDel' in d) remove(d.wPageDel);
    else if ('wEditDone' in d) editing = null;
    else if ('wPageClear' in d) {
      if (!CA.UI.Menu.armed(t)) return;
      widgets = widgets.filter((w) => w.type === 'macro');
      widgets.forEach((w) => CA.Macros.setFav(w.macro, false));
      editing = null;
      changed();
    }
    CA.UI.Menu.render();
  }

  function init() {
    CA.UI.WidgetTypes.register();
    S().defineOption({ key: 'widgetsShown', group: 'widgets', icon: 'widget', name: 'Show widgets', desc: 'Show your widgets on the left panel (they stay saved while hidden).', default: true });
    S().defineOption({ key: 'widgetsLocked', group: 'widgets', icon: 'grip', name: 'Lock widgets', desc: 'Stop widgets from being dragged around by accident (buttons still work).', default: false });
    CA.UI.Pages.register({
      id: 'widgets',
      label: 'Widgets',
      icon: 'widget',
      order: 80,
      html: pageHtml,
      mount: (root) => {
        pageRoot = root;
        root.addEventListener('click', onPageClick);
        root.addEventListener('input', onEditorInput);
        root.addEventListener('change', onEditorInput);
      },
      unmount: () => {
        if (pageRoot) {
          pageRoot.removeEventListener('click', onPageClick);
          pageRoot.removeEventListener('input', onEditorInput);
          pageRoot.removeEventListener('change', onEditorInput);
        }
        pageRoot = null;
      },
    });
    CA.Events.on('settings', (k) => {
      if (k === 'widgetsShown' || k === 'widgetsLocked' || k === null) render();
    });
    CA.Events.on('macros', () => {
      reconcile();
      tick();
    });
    setInterval(tick, TICK_MS);
    render();
  }

  return { init, defineType, types: () => types.slice(), add, remove, list, get, has, serialize, load, render, tick, reconcile, openSettings, editing: () => editing, morph };
})();

// ---- src/ui/widgetTypes.js -------------------------------------------
// The built-in widget types (ui/widgets.js is the engine that places, drags, sizes and saves them).
//
//   macro      one per ★ favourite macro: a round icon button (on/off or run); name on hover
//   status     "Running now" as a status bar: an icon per running macro, details on hover
//   stats      Quick stats — you pick which (see STATS below)
//   events     the latest events — how many and which types; as many of these as you like
//   grimoire / garden / market / pantheon
//              one compact round widget per minigame: a ring for its timer (magic, next tick,
//              next worship swap), a short label under it, details on hover; click to open it
//
// A type can declare `settings` — fields the widget settings editor (Widgets page) shows for it:
//   { key, label, type: 'number' | 'multi', min, max, default, options: () => [{ v, label, icon, color }] }

CA.UI = CA.UI || {};

CA.UI.WidgetTypes = (() => {
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.UI.Plot.fmt;
  const HOT_MS = 1500;

  // ---- macro buttons ------------------------------------------------------------------------

  function macroHtml(inst) {
    const m = CA.Macros.get(inst.macro);
    if (!m) return '';
    const on = CA.Macros.isOn(m.id);
    const key = CA.Settings.getHotkey(`macro.${m.id}`);
    const state = m.mode === 'once' ? 'click to run' : on ? 'on' : 'off';
    return (
      `<button type="button" class="ca-wb${on ? ' on' : ''}${m.mode === 'once' ? ' once' : ''}" data-w-trigger="${esc(m.id)}" aria-label="${esc(m.name)}">` +
      `${CA.UI.MacrosPage.icon(m, true)}</button>` +
      `<span class="ca-wb-label ca-wt"><b>${esc(m.name)}</b><em class="${on ? 'on' : ''}">${state}${key ? ` · ${esc(CA.Hotkeys.format(key))}` : ''}</em></span>`
    );
  }

  // ---- running now ---------------------------------------------------------------------------

  function statusPop(m) {
    const st = CA.Macros.status(m.id);
    const { beautify, span } = F();
    let h =
      '<span class="ca-wpop ca-wt">' +
      `<span class="ca-wpop-head">${CA.UI.MacrosPage.icon(m, true)}<b>${esc(m.name)}</b></span>` +
      `<span class="ca-wpop-sub">${esc(CA.Macros.triggerText(m))} · on for ${span((Date.now() - CA.Macros.since(m.id)) / 1000)}</span>`;
    CA.Macros.stepsOf(m).forEach((step, i) => {
      const s = (st && st.steps[i]) || {};
      const a = CA.Actions.get(step.action) || {};
      const hot = s.lastAt && Date.now() - s.lastAt < HOT_MS;
      const val = s.error ? esc(s.error) : `${beautify(s.total || 0, 0)}${a.unit ? ' ' + esc(a.unit) : ''} · ${s.lastAt ? `${span((Date.now() - s.lastAt) / 1000)} ago` : 'nothing yet'}`;
      h += `<span class="ca-wpop-row${hot ? ' hot' : ''}${s.error ? ' err' : ''}">${I(a.icon || 'close', 11)}<span class="ca-wpop-name">${esc(CA.Actions.describe(step))}</span><span class="ca-wpop-val">${val}</span></span>`;
    });
    return h + '<span class="ca-wpop-foot">click to open the Macros page</span></span>';
  }

  function statusHtml() {
    const ids = CA.Macros.runningIds();
    let h = `<span class="ca-wbar-lead">${I('play', 11)}</span>`;
    if (!ids.length) return `${h}<span class="ca-wbar-idle ca-wt">idle</span>`;
    ids.forEach((id) => {
      const m = CA.Macros.get(id);
      if (!m) return;
      const st = CA.Macros.status(id);
      const hot = st && st.steps.some((s) => s.lastAt && Date.now() - s.lastAt < HOT_MS);
      const err = st && st.steps.some((s) => s.error);
      h += `<span class="ca-wbar-item${hot ? ' hot' : ''}${err ? ' err' : ''}" data-w-open="clickers" aria-label="${esc(m.name)}">${CA.UI.MacrosPage.icon(m, true)}${statusPop(m)}</span>`;
    });
    return h;
  }

  // ---- quick stats ------------------------------------------------------------------------------

  // totals counted with the game's own rules (the same ones behind UpgradesOwned / AchievementsOwned);
  // UpgradesById / AchievementsById are plain objects keyed by id, not arrays
  let upTotal = 0;
  let achTotal = 0;
  function upgradesTotal() {
    if (!upTotal && Game.UpgradesById && Game.CountsAsUpgradeOwned) upTotal = Object.values(Game.UpgradesById).filter((u) => u && Game.CountsAsUpgradeOwned(u.pool)).length;
    return upTotal;
  }
  function achievementsTotal() {
    if (!achTotal && Game.AchievementsById && Game.CountsAsAchievementOwned) achTotal = Object.values(Game.AchievementsById).filter((a) => a && Game.CountsAsAchievementOwned(a.pool)).length;
    return achTotal;
  }

  const lastFrame = () => {
    const fr = CA.Recorder.frames();
    return fr[fr.length - 1];
  };
  const allTime = () => (Game.cookiesReset || 0) + (Game.cookiesEarned || 0);
  const count = (owned, total) => (Number.isFinite(owned) ? `${F().beautify(owned, 0)}${total ? ` <em>/ ${F().beautify(total, 0)}</em>` : ''}` : '—');
  const perS = (v) => (Number.isFinite(v) ? `${F().beautify(v)}/s` : '—');

  /** Every stat Quick stats can show, in display order. */
  const STATS = [
    { id: 'cpsClick', label: 'CpS + clicking', value: () => { const f = lastFrame(); return f ? perS((f.cps || 0) + (f.click || 0)) : '—'; } },
    { id: 'cps', label: 'CpS', value: () => perS(Game.cookiesPs) },
    { id: 'actual', label: 'Actual CpS', value: () => { const r = CA.UI.Graphs.recent(60); return r ? `${perS(r.actual)} <em>last min</em>` : '—'; } },
    { id: 'clickRate', label: 'Clicks / second', value: () => { const r = CA.UI.Graphs.recent(10); return r && Number.isFinite(r.clickRate) ? r.clickRate.toFixed(1) : '—'; } },
    { id: 'bank', label: 'Bank', value: () => F().beautify(Game.cookies || 0) },
    { id: 'runStarted', label: 'Run started', value: () => (Game.startDate ? `${F().span((Date.now() - Game.startDate) / 1000)} <em>ago</em>` : '—') },
    { id: 'upgrades', label: 'Upgrades', value: () => count(Game.UpgradesOwned, upgradesTotal()) },
    { id: 'buildings', label: 'Buildings', value: () => count(Game.BuildingsOwned) },
    { id: 'prestige', label: 'Prestige level', value: () => `${F().beautify(Game.prestige || 0, 0)} <em>(max ${F().beautify(Math.floor(Game.HowMuchPrestige(allTime())), 0)})</em>` },
    { id: 'prestigeGain', label: 'Prestige this run', value: () => `+${F().beautify(Math.floor(Game.HowMuchPrestige(allTime())) - (Game.prestige || 0), 0)}` },
    {
      id: 'nextLevel',
      label: 'Next level in',
      value: () => {
        const lvl = Math.floor(Game.HowMuchPrestige(allTime()));
        const need = typeof Game.HowManyCookiesReset === 'function' ? Game.HowManyCookiesReset(lvl + 1) - allTime() : NaN;
        const r = CA.UI.Graphs.recent(60);
        return r && r.actual > 0 && need > 0 ? F().span(need / r.actual) : '—';
      },
    },
    { id: 'chips', label: 'Heavenly chips', value: () => F().beautify(Game.heavenlyChips || 0, 0) },
    { id: 'achievements', label: 'Achievements', value: () => count(Game.AchievementsOwned, achievementsTotal()) },
    { id: 'lumps', label: 'Sugar lumps', value: () => count(Game.lumps) },
    { id: 'goldenClicks', label: 'Golden cookies clicked', value: () => count(Game.goldenClicks) },
    { id: 'wrinklers', label: 'Wrinklers', value: () => count((Game.wrinklers || []).filter((w) => w.phase > 0).length) },
    { id: 'allTime', label: 'All time baked', value: () => F().beautify(allTime()) },
  ];
  const DEFAULT_STATS = ['cpsClick', 'actual', 'runStarted', 'upgrades', 'prestige', 'achievements', 'allTime'];

  function statsHtml(inst) {
    const chosen = new Set(Array.isArray(inst.stats) && inst.stats.length ? inst.stats : DEFAULT_STATS);
    return STATS.filter((s) => chosen.has(s.id))
      .map((s) => {
        let v;
        try {
          v = s.value();
        } catch (e) {
          v = '—';
        }
        return `<div class="ca-w-stat"><span>${s.label}</span><b>${v}</b></div>`;
      })
      .join('');
  }

  // ---- latest events ------------------------------------------------------------------------

  const DEFAULT_EVENTS = 8;
  const eventCount = (inst) => Math.max(1, Math.min(200, Math.round(inst.count || DEFAULT_EVENTS)));

  function eventsHtml(inst) {
    const kinds = Array.isArray(inst.types) && inst.types.length ? inst.types : null;
    const list = CA.EventLog.list(kinds).slice(-eventCount(inst)).reverse();
    if (!list.length) return `<div class="ca-w-empty">${kinds ? 'No events of the chosen types yet.' : 'Nothing has happened yet.'}</div>`;
    return `<div class="ca-w-events">${list.map((e) => CA.UI.EventsPage.rowHtml(e)).join('')}</div>`;
  }

  // ---- minigames: compact round widgets ---------------------------------------------------------

  /** Opens a building's minigame in the game and scrolls to it. */
  function openMinigame(building) {
    const b = Game.Objects && Game.Objects[building];
    if (!b || !b.minigame || typeof b.switchMinigame !== 'function') {
      CA.Util.notify(building, 'This minigame isn’t unlocked yet (the building needs level 1 — a sugar lump).', CA.ICON, 3);
      return;
    }
    if (!b.onMinigame) b.switchMinigame(1);
    const row = document.getElementById(`row${b.id}`);
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  const RING_R = 19;
  const RING_C = 2 * Math.PI * RING_R;

  /**
   * One round widget: a ring filled to `frac`, an icon in the middle, a short label under it, and
   * a styled popup (rows of [label, value]) on hover. Clicking opens `building`'s minigame.
   */
  function orb({ theme, building, icon, frac, label, extra, pop }) {
    const f = Math.max(0, Math.min(1, Number.isFinite(frac) ? frac : 0));
    return (
      `<div class="ca-orb ca-orb-${theme}" data-w-open-mg="${esc(building)}">` +
      '<svg class="ca-orb-ring" viewBox="0 0 44 44" aria-hidden="true">' +
      `<circle class="ca-orb-track" cx="22" cy="22" r="${RING_R}"/>` +
      `<circle class="ca-orb-fill" cx="22" cy="22" r="${RING_R}" stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="${(RING_C * (1 - f)).toFixed(2)}"/>` +
      '</svg>' +
      `<span class="ca-orb-ico">${icon}</span>` +
      (extra || '') +
      `<span class="ca-orb-label ca-wt">${label}</span>` +
      `<span class="ca-wpop ca-orb-pop ca-wt">${pop.map(([k, v]) => (k === null ? `<span class="ca-wpop-head">${v}</span>` : `<span class="ca-wpop-row"><span class="ca-wpop-name">${k}</span><span class="ca-wpop-val">${v}</span></span>`)).join('')}<span class="ca-wpop-foot">click to open it</span></span>` +
      '</div>'
    );
  }

  const lockedOrb = (theme, building, icon, name) =>
    orb({ theme, building, icon: I(icon, 18), frac: 0, label: 'locked', pop: [[null, `<b>${name}</b>`], ['', 'not unlocked yet']] });

  function grimoireHtml() {
    const { span } = F();
    const mg = CA.Grimoire.magicNow();
    if (!mg) return lockedOrb('grimoire', 'Wizard tower', 'wizard', 'Grimoire');
    const full = mg.fullIn === 0;
    return orb({
      theme: 'grimoire',
      building: 'Wizard tower',
      icon: I('wizard', 18),
      frac: mg.magic / mg.max,
      label: full ? 'full' : Number.isFinite(mg.fullIn) ? span(mg.fullIn) : '—',
      pop: [
        [null, '<b>Grimoire</b>'],
        ['Magic', `${Math.floor(mg.magic)} / ${Math.floor(mg.max)}`],
        ['Refill', mg.perSec ? `+${mg.perSec.toFixed(2)}/s` : 'full'],
        ['Full in', full ? 'now' : Number.isFinite(mg.fullIn) ? span(mg.fullIn) : '—'],
      ],
    });
  }

  const STAGES = ['bud', 'sprout', 'bloom', 'mature'];

  /** Plants per growth stage — the game's own thresholds: ⅓, ⅔ and all of a plant's maturity. */
  function gardenInfo() {
    const farm = Game.Objects && Game.Objects.Farm;
    const M = farm && farm.minigame;
    if (!M || !M.plot || !M.plantsById) return null;
    const counts = [0, 0, 0, 0];
    M.plot.forEach((rowTiles) =>
      (rowTiles || []).forEach((tile) => {
        if (!tile || !tile[0]) return;
        const me = M.plantsById[tile[0] - 1];
        if (!me) return;
        const age = tile[1];
        counts[age >= me.mature ? 3 : age >= me.mature * 0.666 ? 2 : age >= me.mature * 0.333 ? 1 : 0]++;
      })
    );
    const next = M.nextStep ? Math.max(0, (M.nextStep - Date.now()) / 1000) : null;
    return { counts, next, step: M.stepT || 0 };
  }

  function gardenHtml() {
    const { span } = F();
    const g = gardenInfo();
    if (!g) return lockedOrb('garden', 'Farm', 'leaf', 'Garden');
    // four small dots under the ring, one per growth stage, each with its count
    const dots = `<span class="ca-orb-dots ca-wt">${STAGES.map((st, i) => `<span class="s${i}"><i></i>${g.counts[i]}</span>`).join('')}</span>`;
    return orb({
      theme: 'garden',
      building: 'Farm',
      icon: I('leaf', 18),
      frac: g.next != null && g.step ? 1 - g.next / g.step : 0,
      label: g.next == null ? '—' : span(g.next),
      extra: dots,
      pop: [[null, '<b>Garden</b>']].concat(STAGES.map((st, i) => [st[0].toUpperCase() + st.slice(1), String(g.counts[i])]), [['Next tick', g.next == null ? '—' : span(g.next)]]),
    });
  }

  function marketHtml() {
    const { span, beautify } = F();
    const m = CA.Stocks.minigame();
    if (!m) return lockedOrb('market', 'Bank', 'stocks', 'Stock market');
    const owned = m.goodsById.filter((g) => g.stock > 0).length;
    const last = CA.Stocks.lastTick();
    const next = CA.Stocks.nextTickIn();
    const moved = last && last.held;
    const signed = (v, unit, d) => `${v < 0 ? '−' : '+'}${unit}${beautify(Math.abs(v), d)}`;
    return orb({
      theme: 'market',
      building: 'Bank',
      icon: I('stocks', 18),
      frac: next != null && m.secondsPerTick ? 1 - next / m.secondsPerTick : 0,
      label: moved ? `<span class="${last.dollars < 0 ? 'neg' : 'pos'}">${signed(last.dollars, '$', Math.abs(last.dollars) < 10 ? 2 : 0)}</span>` : `${owned} held`,
      pop: [
        [null, '<b>Stock market</b>'],
        ['Holding', `${owned} of ${m.goodsById.length} stocks`],
        ['Last tick', moved ? `${signed(last.dollars, '$', 2)} (${signed(last.cookies, '', 1)} cookies)` : 'no stocks held into it'],
        ['Next tick', next == null ? '—' : span(next)],
      ],
    });
  }

  /** The Pantheon (Temple minigame): the three slotted spirits and the next worship swap. */
  function pantheonInfo() {
    const temple = Game.Objects && Game.Objects.Temple;
    const M = temple && temple.minigame;
    if (!M || !Array.isArray(M.slot) || !M.godsById) return null;
    const gods = M.slot.map((id) => (id >= 0 ? M.godsById[id] : null));
    // main.js: a swap refills 1 h after the last one with 2 left, 4 h with 1, 16 h with 0
    const wait = M.swaps === 0 ? 16 * 3600 : M.swaps === 1 ? 4 * 3600 : 3600;
    const next = M.swaps < 3 ? Math.max(0, (M.swapT + wait * 1000 - Date.now()) / 1000) : null;
    return { gods, swaps: M.swaps, next, wait };
  }

  const SLOTS = ['Diamond', 'Ruby', 'Jade'];

  function pantheonHtml() {
    const { span } = F();
    const p = pantheonInfo();
    if (!p) return lockedOrb('pantheon', 'Temple', 'pantheon', 'Pantheon');
    const sprite = (g) =>
      g && g.icon
        ? `<i class="ca-orb-god" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-g.icon[0] * 48}px ${-g.icon[1] * 48}px"></i>`
        : '<i class="ca-orb-god empty"></i>';
    return orb({
      theme: 'pantheon',
      building: 'Temple',
      icon: I('pantheon', 18),
      frac: p.next == null ? 1 : 1 - p.next / p.wait,
      label: p.next == null ? `${p.swaps} swaps` : span(p.next),
      extra: `<span class="ca-orb-gods">${p.gods.map(sprite).join('')}</span>`,
      pop: [[null, '<b>Pantheon</b>']].concat(
        p.gods.map((g, i) => [SLOTS[i], g ? esc(g.name) : '<em>empty</em>']),
        [
          ['Swaps', `${p.swaps} / 3`],
          ['Next swap in', p.next == null ? 'all 3 ready' : span(p.next)],
        ]
      ),
    });
  }

  function register() {
    const D = CA.UI.Widgets.defineType;
    D({ id: 'macro', name: 'Macro button', icon: 'star', bare: true, hidden: true, resize: 'scale', html: macroHtml });
    D({ id: 'status', name: 'Running now', icon: 'play', desc: 'A status bar: an icon for each running macro, pulsing while it works. Hover an icon for what its actions have done.', bare: true, single: true, resize: 'scale', html: statusHtml });
    D({
      id: 'stats',
      name: 'Quick stats',
      icon: 'graphs',
      desc: 'The numbers you care about at a glance — pick which in its settings.',
      width: 190,
      single: true,
      resize: 'free',
      html: statsHtml,
      settings: [{ key: 'stats', label: 'Show', type: 'multi', default: DEFAULT_STATS, options: () => STATS.map((s) => ({ v: s.id, label: s.label })) }],
    });
    D({
      id: 'events',
      name: 'Latest events',
      icon: 'events',
      desc: 'The newest entries in the event log, scrollable. Choose how many and which types in its settings; add as many as you like (one for golden cookies, one for trades…).',
      width: 260,
      resize: 'free',
      html: eventsHtml,
      settings: [
        { key: 'count', label: 'Keep the last', type: 'number', min: 1, max: 200, default: DEFAULT_EVENTS, unit: 'events' },
        {
          key: 'types',
          label: 'Show (none ticked = all)',
          type: 'multi',
          default: [],
          options: () => {
            const t = CA.EventLog.types();
            return Object.keys(t).map((k) => ({ v: k, label: t[k].name, icon: t[k].icon, color: t[k].color }));
          },
        },
      ],
    });
    D({ id: 'grimoire', name: 'Grimoire', icon: 'wizard', desc: 'A small round meter: the ring is your magic, the label the time until it’s full. Click it to open the Grimoire.', bare: true, single: true, resize: 'scale', html: grimoireHtml });
    D({ id: 'garden', name: 'Garden', icon: 'leaf', desc: 'The ring counts down to the next garden tick; the dots under it are your plants by stage (bud, sprout, bloom, mature). Click it to open the Garden.', bare: true, single: true, resize: 'scale', html: gardenHtml });
    D({ id: 'market', name: 'Stock market', icon: 'stocks', desc: 'The ring counts down to the next market tick; the label is what the last tick did to the stocks you held. Click it to open the Stock market.', bare: true, single: true, resize: 'scale', html: marketHtml });
    D({ id: 'pantheon', name: 'Pantheon', icon: 'pantheon', desc: 'Your three slotted spirits, and a ring counting down to the next worship swap. Click it to open the Pantheon.', bare: true, single: true, resize: 'scale', html: pantheonHtml });
  }

  return { register, openMinigame, STATS, DEFAULT_STATS };
})();

// ---- src/ui/wizardPage.js --------------------------------------------
// The Wizard tower page, plus a small toolbar inside the game's own Grimoire.
//
//   Grimoire       magic meter (now / max, refill per second, time to full), spells cast
//   Spells         every spell: cost, backfire chance, Cast button (or how long until it's
//                  affordable), ★ for its own button on the left panel — each is a built-in macro
//   Auto-cast      the hardcoded "Force the Hand of Fate on Click frenzy" macro, and any of your
//                  own repeat/when macros that cast spells
//   Spell combos   your "once" macros that cast spells — New combo starts one in the editor
//   Magic          magic over time, with every cast marked
//
// The Grimoire toolbar sits under the Grimoire's own info line: the auto-cast switch and a button
// that opens this page. Like the Bank toolbar it reaches into the minigame's DOM (#grimoireInfo)
// and quietly disappears if that markup ever changes.

CA.UI = CA.UI || {};

CA.UI.WizardPage = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const G = () => CA.Grimoire;
  const TOOLBAR_ID = 'cm-grimoire-toolbar';
  const SYNC_MS = 500;

  let root = null;
  let timer = null;
  let plot = null;

  const usesSpells = (m) => m.steps.some((s) => s.action === 'spell.cast');

  function sprite(icon) {
    return `<span class="ca-spell-ico" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-icon[0] * 48}px ${-icon[1] * 48}px"></span>`;
  }

  // ---- page --------------------------------------------------------------------------------

  function grimoireCard() {
    return (
      '<div class="ca-card">' +
      C().cardHead('Grimoire', 'wizard', '<div class="ca-card-meta"><span class="ca-pill" data-wiz-cast></span></div>') +
      '<div class="ca-magic"><div class="ca-magic-fill" data-wiz-fill></div><div class="ca-magic-text" data-wiz-text></div></div>' +
      '<div class="ca-stats" data-wiz-stats></div>' +
      '</div>'
    );
  }

  function spellsCard() {
    return (
      '<div class="ca-card">' +
      C().cardHead('Spells', 'sparkle', '<div class="ca-card-meta"><span class="ca-hint">★ gives a spell its own button on the left panel · hotkeys on the Macros page</span></div>') +
      '<div class="ca-spells">' +
      G()
        .SPELLS.map(
          (s) =>
            `<div class="ca-spell" data-wiz-spell="${esc(s.key)}">` +
            sprite(s.icon) +
            `<div class="ca-spell-name">${esc(s.name)}</div>` +
            '<div class="ca-spell-meta" data-wiz-meta></div>' +
            '<div class="ca-spell-actions">' +
            C().button(`${I('wizard', 12)} Cast`, `data-ca="macro-run" data-id="${s.id}" data-wiz-cast-btn`, 'ca-btn-small ca-btn-run') +
            `<button type="button" class="ca-iconbtn ca-fav" data-ca="macro-fav" data-id="${s.id}" data-wiz-fav title="Favourite: its own button on the left panel">${I('starOutline', 14)}</button>` +
            '</div></div>'
        )
        .join('') +
      '</div></div>'
    );
  }

  function html() {
    const M = CA.Macros;
    const mine = M.list().filter((m) => !m.builtin && usesSpells(m));
    const auto = [M.get(G().AUTO_ID)].concat(mine.filter((m) => m.mode !== 'once'));
    const combos = mine.filter((m) => m.mode === 'once');
    let h = '';
    if (!G().minigame()) {
      h +=
        '<div class="ca-card ca-card-note-only">' +
        C().cardHead('Wizard tower', 'wizard') +
        '<div class="ca-card-note">The Grimoire minigame opens once you have a level-1 Wizard tower (spend a sugar lump on it). Your spell macros are ready for when it does.</div>' +
        '</div>';
    } else h += grimoireCard() + spellsCard();
    h +=
      '<div class="ca-card">' +
      C().cardHead('Auto-cast', 'bolt', '<div class="ca-card-meta"><button type="button" class="ca-btn ca-btn-small" data-ca="open-macros">All macros</button></div>') +
      `<div class="ca-list">${auto.map(CA.UI.MacrosPage.row).join('')}</div>` +
      '</div>' +
      '<div class="ca-card">' +
      C().cardHead('Spell combos', 'sparkle', `<div class="ca-card-meta">${C().button(`${I('plus', 12)} New combo`, 'data-wiz-newcombo', 'ca-btn-small')}</div>`) +
      (combos.length
        ? `<div class="ca-list">${combos.map(CA.UI.MacrosPage.row).join('')}</div>`
        : '<div class="ca-card-note">A combo casts several spells in one go — one button, one hotkey, or its own button on the left panel. It casts each spell in order, skipping any you can’t afford yet.</div>') +
      '</div>';
    h += plot.html();
    h += `<div class="ca-card">${C().cardHead('Options', 'settings')}<div class="ca-list">${CA.Settings.optionsIn('grimoire').map(CA.UI.Menu.optionRow).join('')}</div></div>`;
    return h;
  }

  function sync() {
    if (!root || !root.isConnected) return;
    const { span, beautify, tile } = CA.UI.Plot.fmt;
    const mg = G().magicNow();
    if (mg) {
      const fill = root.querySelector('[data-wiz-fill]');
      if (fill) fill.style.width = `${Math.max(0, Math.min(100, (mg.magic / mg.max) * 100))}%`;
      const text = root.querySelector('[data-wiz-text]');
      if (text) text.textContent = `${Math.floor(mg.magic)} / ${Math.floor(mg.max)} magic${mg.perSec ? `  (+${mg.perSec.toFixed(2)}/s)` : ''}`;
      const stats = root.querySelector('[data-wiz-stats]');
      if (stats) {
        stats.innerHTML =
          tile('Magic', `${Math.floor(mg.magic)} / ${Math.floor(mg.max)}`) +
          tile('Refill', mg.perSec ? `+${mg.perSec.toFixed(2)}/s` : 'full') +
          tile('Full in', mg.fullIn === 0 ? 'now' : Number.isFinite(mg.fullIn) ? span(mg.fullIn) : '—') +
          tile('Spells cast', beautify(mg.cast, 0), `${beautify(mg.castTotal, 0)} in total`);
      }
      const pill = root.querySelector('[data-wiz-cast]');
      if (pill) pill.textContent = `${Math.floor((mg.magic / mg.max) * 100)}% magic`;
    }
    const live = {};
    G()
      .spells()
      .forEach((s) => (live[s.key] = s));
    root.querySelectorAll('[data-wiz-spell]').forEach((el) => {
      const s = live[el.dataset.wizSpell];
      if (!s) return;
      el.classList.toggle('ready', s.affordable);
      const meta = el.querySelector('[data-wiz-meta]');
      if (meta) {
        const fail = s.fail == null ? '' : ` · ${Math.round(s.fail * 100)}% backfire`;
        meta.textContent = `${Number.isFinite(s.cost) ? s.cost : '—'} magic${fail}${!s.affordable && Number.isFinite(s.wait) && s.wait > 0 ? ` · ready in ${span(s.wait)}` : ''}`;
      }
      const btn = el.querySelector('[data-wiz-cast-btn]');
      if (btn) btn.classList.toggle('ca-unaffordable', !s.affordable);
      const fav = el.querySelector('[data-wiz-fav]');
      if (fav) {
        const on = CA.Macros.isFav(s.id);
        fav.classList.toggle('on', on);
        fav.innerHTML = I(on ? 'star' : 'starOutline', 14);
      }
    });
    CA.UI.MacrosPage.sync(root);
  }

  function onClick(e) {
    if (!e.target.closest('[data-wiz-newcombo]')) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    CA.UI.MacrosPage.edit(null, {
      name: 'Spell combo',
      icon: { ico: 'wizard' },
      mode: 'once',
      steps: [
        { action: 'spell.cast', params: { spell: 'hand of fate' } },
        { action: 'spell.cast', params: { spell: 'stretch time' } },
      ],
    });
  }

  function mount(el) {
    unmount();
    root = el;
    root.addEventListener('click', onClick);
    plot.mount(el);
    sync();
    timer = setInterval(sync, SYNC_MS);
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (plot) plot.unmount();
    if (root) root.removeEventListener('click', onClick);
    root = null;
  }

  function createPlot() {
    plot = CA.UI.Plot.create({
      id: 'magic',
      title: 'Magic',
      icon: 'wizard',
      height: 160,
      log: false,
      windows: [300, 900, 3600, 10800, 43200, 86400, 0],
      window: 900,
      fmt: (v) => CA.UI.Plot.fmt.beautify(v, 0),
      tipFmt: (v) => `${Math.floor(v)} magic`,
      build(v) {
        const bars = v.bucketize(['magic', 'magicMax']);
        return {
          series: [
            { key: 'magic', name: 'Magic', color: '#b388ff', type: 'area', width: 1.8 },
            { key: 'magicMax', name: 'Maximum', color: '#9db4cc', type: 'line', dash: true },
          ],
          lines: {
            magic: CA.UI.Plot.linePoints(bars, (b) => b.v.magic),
            magicMax: CA.UI.Plot.linePoints(bars, (b) => b.v.magicMax),
          },
          markers: CA.EventLog.list(['spell'])
            .filter((ev) => {
              const x = v.active ? ev.a : ev.t;
              return x >= v.x0 && x <= v.x1;
            })
            .map((ev) => ({
              x: v.active ? ev.a : ev.t,
              color: ev.data && ev.data.backfired ? '#e5484d' : '#b388ff',
              tip: () => `<div class="ca-tip-head">${esc(ev.title)}<span>${CA.UI.Plot.fmt.clock(ev.t, true)}</span></div>`,
            })),
          empty: 'Open the Grimoire (Wizard tower minigame) to start recording magic.',
        };
      },
    });
  }

  // ---- toolbar inside the Grimoire -------------------------------------------------------------

  function toolbarSync() {
    const info = G().minigame() ? document.getElementById('grimoireInfo') : null;
    let bar = document.getElementById(TOOLBAR_ID);
    if (!info || !CA.Settings.get('grimoireToolbar')) {
      if (bar) bar.remove();
      return;
    }
    if (bar && bar.previousElementSibling !== info) {
      bar.remove();
      bar = null;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = TOOLBAR_ID;
      bar.innerHTML =
        '<div class="cm-gt-btn" data-cm-gt="auto"></div>' +
        `<div class="cm-gt-btn cm-gt-open" data-cm-gt="open" title="Open the CookieMgr Wizard tower page">${I('open', 12)}CookieMgr</div>`;
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cm-gt]');
        if (!b) return;
        if (b.dataset.cmGt === 'auto') {
          CA.Util.sound(CA.Macros.isOn(G().AUTO_ID) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
          CA.Macros.toggle(G().AUTO_ID);
        } else CA.UI.Menu.openPage('wizard');
        toolbarSync();
      });
      info.insertAdjacentElement('afterend', bar);
    }
    const on = CA.Macros.isOn(G().AUTO_ID);
    const auto = bar.querySelector('[data-cm-gt="auto"]');
    auto.innerHTML = `${I('bolt', 12)}Auto FtHoF on Click frenzy: ${on ? 'on' : 'off'}`;
    auto.classList.toggle('on', on);
    auto.title = 'Casts Force the Hand of Fate as soon as a Click frenzy is running and there’s enough magic (same switch as on the CookieMgr page)';
  }

  function init() {
    CA.Settings.defineOption({
      key: 'grimoireToolbar',
      group: 'grimoire',
      icon: 'toolbar',
      name: 'Toolbar in the Grimoire',
      desc: 'Adds the auto-cast switch and a CookieMgr button under the Grimoire’s own info line.',
      default: true,
    });
    createPlot();
    CA.UI.Pages.register({ id: 'wizard', label: 'Wizard tower', icon: 'wizard', order: 45, html, mount, unmount, tick: sync });
    CA.Events.on('macros', toolbarSync);
    CA.Events.on('settings', (k) => (k === 'grimoireToolbar' || k === null) && toolbarSync());
    setInterval(toolbarSync, 1000);
  }

  return { init, sync };
})();

// ---- src/ui/gardenPage.js --------------------------------------------
// The Garden page: the auto-gardener and its profiles (features/garden.js).
//
//   Garden          your plot as it is now, against the active profile: each tile's plant and growth
//                   stage, the profile's seed faded in on empty tiles, a red ring on tiles that don't
//                   match, and the chance a mature plant dies on the coming tick; hover a tile for details
//   Auto-gardener   its on/off switch (★ for its button on the left panel), the profile it keeps, the
//                   death-chance threshold, how many seconds before the tick it works, what it last did
//   Profiles        save the current garden (seeds + soil) as a profile; use, rename or delete them

CA.UI = CA.UI || {};

CA.UI.GardenPage = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const G = () => CA.Garden;
  const SYNC_MS = 500;

  let root = null;
  let timer = null;

  const stageOf = (me, age) => (age >= me.mature ? 4 : age >= me.mature * 0.666 ? 3 : age >= me.mature * 0.333 ? 2 : 1);
  const STAGE_NAMES = ['seed', 'bud', 'sprout', 'bloom', 'mature'];
  const pct = (v) => `${v >= 0.995 ? 100 : v < 0.005 && v > 0 ? '<1' : Math.round(v * 100)}%`;

  /** A garden sprite (img/gardenPlants.png): column = growth stage (0 = seed), row = the plant's icon. */
  const sprite = (me, stage, cls = '') =>
    `<i class="ca-gs ${cls}" style="background-image:url(${CA.Util.res('img/gardenPlants.png')});background-position:${-stage * 48}px ${-me.icon * 48}px"></i>`;

  // ---- the plot -----------------------------------------------------------------------------

  function tileHtml(t, profile) {
    if (!t.open) return '<div class="ca-gtile locked"></div>';
    const me = t.plant;
    let inner = '';
    let pop = '';
    if (me) {
      const st = stageOf(me, t.age);
      inner += sprite(me, st);
      if (st === 4 && !me.immortal && t.decay > 0) inner += `<b class="ca-gdecay${t.decay >= 0.5 ? ' hi' : ''}">${pct(t.decay)}</b>`;
      if (!me.unlocked) inner += `<b class="ca-gnew">${I('sparkle', 9)}</b>`;
      pop +=
        `<span class="ca-wpop-head"><b>${esc(me.name)}</b></span>` +
        `<span class="ca-wpop-row"><span class="ca-wpop-name">Growth</span><span class="ca-wpop-val">${STAGE_NAMES[st]} · ${t.age} / ${me.mature}</span></span>` +
        (me.immortal
          ? '<span class="ca-wpop-row"><span class="ca-wpop-name">Lifespan</span><span class="ca-wpop-val">immortal</span></span>'
          : `<span class="ca-wpop-row"><span class="ca-wpop-name">Dies next tick</span><span class="ca-wpop-val">${pct(t.decay)}</span></span>`) +
        (!me.unlocked ? '<span class="ca-wpop-row"><span class="ca-wpop-name">New seed</span><span class="ca-wpop-val">harvest when mature to unlock</span></span>' : '');
    } else {
      if (t.want) inner += sprite(t.want, 0, 'ghost');
      pop += '<span class="ca-wpop-head"><b>Empty</b></span>';
    }
    if (profile) pop += `<span class="ca-wpop-row"><span class="ca-wpop-name">Profile</span><span class="ca-wpop-val">${t.want ? esc(t.want.name) : 'empty'}</span></span>`;
    return `<div class="ca-gtile${t.match ? '' : ' off'}">${inner}<span class="ca-wpop ca-gpop">${pop}</span></div>`;
  }

  function plotHtml(v) {
    return v.tiles.map((t) => tileHtml(t, v.profile)).join('');
  }

  function statsHtml(v) {
    const { span, tile } = CA.UI.Plot.fmt;
    const off = v.profile ? v.tiles.filter((t) => t.open && !t.match).length : 0;
    const mature = v.tiles.filter((t) => t.plant && t.age >= t.plant.mature).length;
    return (
      tile('Next tick', Number.isFinite(v.next) ? span(v.next) : '—', v.step ? `every ${span(v.step)}` : '') +
      tile('Soil', v.soil ? esc(v.soil.name) : '—', v.profile && v.soil && v.soil.key !== v.profile.soil ? `profile: ${esc(soilName(v.profile.soil))}` : '') +
      tile('Mature', String(mature), `of ${v.tiles.filter((t) => t.plant).length} plants`) +
      (v.profile ? tile('Off-profile', String(off), off ? 'tiles to fix' : 'all as planned') : '')
    );
  }

  const soilName = (key) => {
    const M = G().minigame();
    return (M && M.soils && M.soils[key] && M.soils[key].name) || key;
  };

  function gardenCard() {
    return (
      '<div class="ca-card">' +
      C().cardHead('Garden', 'leaf', '<div class="ca-card-meta"><span class="ca-pill" data-gp-profile></span></div>') +
      '<div class="ca-garden-wrap"><div class="ca-gplot" data-gp-plot></div><div class="ca-stats ca-gstats" data-gp-stats></div></div>' +
      '</div>'
    );
  }

  // ---- auto-gardener -----------------------------------------------------------------------------

  function gardenerCard() {
    const S = CA.Settings;
    const profs = G().profiles();
    const act = G().active();
    const num = (key, min, max, unit) =>
      `<input type="number" min="${min}" max="${max}" value="${esc(S.get(key))}" data-gp-num="${key}" data-min="${min}" data-max="${max}"><em>${unit}</em>`;
    return (
      '<div class="ca-card">' +
      C().cardHead('Auto-gardener', 'bolt') +
      `<div class="ca-list">${CA.UI.MacrosPage.row(CA.Macros.get(G().GARDENER))}</div>` +
      '<div class="ca-gsettings">' +
      '<label class="ca-field"><span>Keep the garden like</span>' +
      (profs.length
        ? `<select data-gp-active>${profs.map((p) => `<option value="${esc(p.id)}"${act && act.id === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`
        : '<em>no profile yet — save one below</em>') +
      '</label>' +
      `<label class="ca-field"><span>Harvest a mature plant if its chance to die next tick is over</span>${num('gardenThreshold', 0, 100, '% (100 = let it die)')}</label>` +
      `<label class="ca-field"><span>Work in the last</span>${num('gardenLead', 1, 900, 'seconds before each garden tick')}</label>` +
      '</div>' +
      `<div class="ca-list">${CA.Settings.optionsIn('garden').map(CA.UI.Menu.optionRow).join('')}</div>` +
      '<div class="ca-card-note" data-gp-last></div>' +
      '</div>'
    );
  }

  function lastText() {
    const l = G().last();
    if (!l.at) return 'It harvests and replants in the last seconds before each garden tick, so new plants start growing right away and plants about to die are picked first.';
    const parts = [];
    if (l.planted) parts.push(`planted ${l.planted}`);
    if (l.harvested) parts.push(`pulled out ${l.harvested} off-profile`);
    if (l.saved) parts.push(`harvested ${l.saved} about to die`);
    if (l.unlocked) parts.push(`harvested ${l.unlocked} new seed${l.unlocked === 1 ? '' : 's'}`);
    if (l.soil) parts.push('changed the soil');
    return `Last: ${parts.join(', ')} — ${CA.UI.Plot.fmt.span((Date.now() - l.at) / 1000)} ago.`;
  }

  // ---- profiles ------------------------------------------------------------------------------

  function miniPlot(p) {
    const M = G().minigame();
    let h = '<div class="ca-gmini">';
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        const key = p.plot[y][x];
        const me = M && key && M.plants[key];
        h += `<span>${me ? sprite(me, 4) : ''}</span>`;
      }
    }
    return h + '</div>';
  }

  function profilesCard() {
    const profs = G().profiles();
    const act = G().active();
    let h =
      '<div class="ca-card">' +
      C().cardHead('Profiles', 'save') +
      '<div class="ca-gsave">' +
      `<input type="text" maxlength="40" placeholder="Garden ${profs.length + 1}" data-gp-name>` +
      C().button(`${I('plus', 12)} Save current garden`, 'data-gp-save', 'ca-btn-small ca-btn-on') +
      '</div>';
    if (!profs.length) h += '<div class="ca-card-note">A profile remembers the seed on every tile and the soil. Plant your garden the way you want it, then save it here.</div>';
    else {
      h += '<div class="ca-gprofiles">';
      profs.forEach((p) => {
        const on = act && act.id === p.id;
        const n = p.plot.flat().filter(Boolean).length;
        h +=
          `<div class="ca-gprofile${on ? ' on' : ''}">` +
          miniPlot(p) +
          '<div class="ca-gprofile-text">' +
          `<input type="text" maxlength="40" value="${esc(p.name)}" data-gp-rename="${esc(p.id)}">` +
          `<div class="ca-row-desc">${n} plant${n === 1 ? '' : 's'} · ${esc(soilName(p.soil))}${on ? ' · <b>active</b>' : ''}</div>` +
          '<div class="ca-controls">' +
          (on ? '' : C().button('Use', `data-gp-use="${esc(p.id)}"`, 'ca-btn-small')) +
          C().button('Delete', `data-gp-del="${esc(p.id)}" data-arm-label="Delete it?"`, 'ca-btn-small ca-btn-off') +
          '</div></div></div>';
      });
      h += '</div>';
    }
    return h + '</div>';
  }

  // ---- page ------------------------------------------------------------------------------

  function html() {
    if (!G().minigame())
      return (
        '<div class="ca-card ca-card-note-only">' +
        C().cardHead('Garden', 'leaf') +
        '<div class="ca-card-note">The Garden opens once you have a level-1 Farm (spend a sugar lump on it). The auto-gardener and its profiles will be here.</div>' +
        '</div>'
      );
    return gardenCard() + gardenerCard() + profilesCard();
  }

  function sync() {
    if (!root || !root.isConnected) return;
    const v = G().view();
    if (!v) return;
    const plot = root.querySelector('[data-gp-plot]');
    if (plot) CA.UI.Widgets.morph(plot, plotHtml(v));
    const stats = root.querySelector('[data-gp-stats]');
    if (stats) CA.UI.Widgets.morph(stats, statsHtml(v));
    const pill = root.querySelector('[data-gp-profile]');
    if (pill) pill.textContent = v.profile ? `profile: ${v.profile.name}` : 'no profile';
    const last = root.querySelector('[data-gp-last]');
    if (last) last.textContent = lastText();
    CA.UI.MacrosPage.sync(root);
  }

  function onClick(e) {
    const t = e.target.closest('[data-gp-save],[data-gp-use],[data-gp-del]');
    if (!t) return;
    e.stopPropagation();
    const d = t.dataset;
    if ('gpDel' in d) {
      if (!CA.UI.Menu.armed(t)) return;
      G().removeProfile(d.gpDel);
    } else if ('gpUse' in d) G().use(d.gpUse);
    else if ('gpSave' in d) {
      const name = root.querySelector('[data-gp-name]');
      const p = G().snapshot(name && name.value.trim());
      if (p) CA.Util.notify('Garden profile saved', `“${esc(p.name)}” — ${p.plot.flat().filter(Boolean).length} plants on ${esc(soilName(p.soil))}.`, CA.ICON, 3);
    }
    CA.Util.sound('snd/tick.mp3');
    CA.UI.Menu.render();
  }

  function onChange(e) {
    const el = e.target;
    const d = el.dataset || {};
    if ('gpActive' in d) {
      if (e.type !== 'change') return;
      G().use(el.value);
    }
    else if (d.gpNum) {
      const v = Number(el.value);
      if (!Number.isFinite(v)) return;
      const clamped = Math.max(Number(d.min), Math.min(Number(d.max), Math.round(v)));
      CA.Settings.set(d.gpNum, clamped);
      if (e.type === 'change') el.value = clamped;
      return;
    } else if (d.gpRename) {
      if (e.type !== 'change') return;
      G().rename(d.gpRename, el.value);
      return;
    } else return;
    CA.UI.Menu.render();
  }

  function mount(el) {
    unmount();
    root = el;
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onChange);
    sync();
    timer = setInterval(sync, SYNC_MS);
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      root.removeEventListener('input', onChange);
    }
    root = null;
  }

  function init() {
    CA.UI.Pages.register({ id: 'garden', label: 'Garden', icon: 'leaf', order: 47, html, mount, unmount, tick: sync });
  }

  return { init, sync };
})();

// ---- src/ui/menu.js --------------------------------------------------
// The CookieMgr panel. It lives in the game's own menu slot (the same place as
// Options / Stats / Info), so it inherits the game's look and closes like any other menu.

CA.UI = CA.UI || {};

CA.UI.Menu = (() => {
  const C = CA.UI.C;
  const isOpen = () => typeof Game !== 'undefined' && Game.onMenu === CA.MENU_ID;

  function toggle() {
    Game.ShowMenu(CA.MENU_ID); // ShowMenu closes the menu if it is already the open one
  }
  function open() {
    if (!isOpen()) Game.ShowMenu(CA.MENU_ID);
  }
  function close() {
    if (isOpen()) Game.ShowMenu(CA.MENU_ID);
  }

  // ---- rendering ---------------------------------------------------------------

  /** Its own card, apart from the autoclicker row, so it isn't lost among other controls —
   *  selling everything is a bigger deal than flipping a toggle. The button's title (what the
   *  hover shows) is filled in with a live cookie estimate on mouseenter; see wireSellAll(). */
  function sellAllCard() {
    return (
      '<div class="ca-card ca-card-danger">' +
      '<div class="ca-row ca-row-sellall">' +
      '<div class="ca-row-text"><div class="ca-row-name">Sell everything</div>' +
      '<div class="ca-row-desc">Sells every stock you hold right now and turns the autobuyer off first, ' +
      'so it doesn\'t just buy it all straight back. Also a macro, so it can have a hotkey.</div></div>' +
      C.button('Sell all', 'data-ca="sell-all-stocks" data-ca-sellall', 'ca-btn-danger ca-btn-lg') +
      '</div>' +
      '</div>'
    );
  }

  /** The small round icon at the start of every settings row. */
  const rowIcon = (name) => `<span class="ca-row-ico">${CA.UI.Icons.html(name || 'settings', 16)}</span>`;

  function optionRow(def) {
    return (
      `<div class="ca-row ca-row-option" data-option="${def.key}">` +
      rowIcon(def.icon) +
      `<div class="ca-row-text"><div class="ca-row-name">${C.esc(def.name)}</div><div class="ca-row-desc">${C.esc(def.desc)}</div></div>` +
      C.toggle(false, `data-ca="option" data-key="${def.key}"`, def.name) +
      '</div>'
    );
  }

  // ---- pages ---------------------------------------------------------------------
  // The current page id is kept in the 'tab' setting (the name predates the page registry;
  // keeping it means existing saves still reopen on the page you last had open).

  const currentTab = () => {
    const t = CA.Settings.get('tab');
    if (CA.UI.Pages.get(t)) return t;
    const first = CA.UI.Pages.list()[0];
    return first ? first.id : 'clickers';
  };

  function stocksPage() {
    return (
      sellAllCard() +
      '<div class="ca-card">' +
      C.cardHead('Autobuyer', 'bolt', '<div class="ca-card-meta"><button type="button" class="ca-btn ca-btn-small" data-ca="open-macros">All macros</button></div>') +
      `<div class="ca-list">${CA.UI.MacrosPage.row(CA.Macros.get('stockTrader'))}</div>` +
      '</div>' +
      optionsCard('Options', 'settings', 'stocks') +
      CA.UI.StockGraph.html() +
      CA.UI.StockPerf.html() +
      CA.UI.StockLog.html()
    );
  }

  const cardHead = C.cardHead;

  function optionsCard(title, icon, group) {
    return `<div class="ca-card">${cardHead(title, icon)}<div class="ca-list">${CA.Settings.optionsIn(group).map(optionRow).join('')}</div></div>`;
  }

  function settingsPage() {
    return (
      '<div class="ca-card">' +
      cardHead('General', 'settings') +
      '<div class="ca-list">' +
      CA.Settings.optionsIn('general').map(optionRow).join('') +
      '<div class="ca-row ca-row-option">' +
      rowIcon('panel') +
      '<div class="ca-row-text"><div class="ca-row-name">Open / close this panel</div>' +
      '<div class="ca-row-desc">Optional hotkey for the CookieMgr panel.</div></div>' +
      C.hotkey('panel.toggle') +
      '</div>' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('keyboard') +
      '<div class="ca-row-text"><div class="ca-row-name">Hotkeys</div>' +
      '<div class="ca-row-desc">Click a key chip, then press the new key. <kbd>Esc</kbd> cancels, <kbd>Backspace</kbd> removes it; modifiers work too.</div></div>' +
      C.button('Reset to defaults', 'data-ca="reset-hotkeys"', 'ca-btn-small') +
      '</div>' +
      '</div>' +
      '</div>' +
      historyCard() +
      optionsCard('Macros', 'bolt', 'macros') +
      optionsCard('Graphs', 'graphs', 'graph') +
      optionsCard('Events', 'events', 'events') +
      optionsCard('Stock market', 'stocks', 'stocks') +
      optionsCard('Wizard tower', 'wizard', 'grimoire') +
      integrationsCard() +
      '<div class="ca-footer">' +
      `<div>CookieMgr v${CA.VERSION} &middot; <a href="https://github.com/nunorgcarvalho/CookieMgr" target="_blank" rel="noopener">GitHub</a></div>` +
      '<div>Settings are stored inside your Cookie Clicker save; recorded history stays in this browser.</div>' +
      '</div>'
    );
  }

  // ---- history data ---------------------------------------------------------------
  // Recorded history lives in this browser's IndexedDB, never in the game save (see
  // core/store.js), so this card is the way to move it between browsers or back it up.

  function historyCard() {
    return (
      '<div class="ca-card">' +
      cardHead('History data', 'timeline') +
      '<div class="ca-list">' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('clock') +
      '<div class="ca-row-text"><div class="ca-row-name">Recorded for this save</div>' +
      '<div class="ca-row-desc" data-ca-history-info></div></div>' +
      '</div>' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('save') +
      '<div class="ca-row-text"><div class="ca-row-name">Back up or move</div>' +
      '<div class="ca-row-desc">Export saves everything recorded for this save to a file. Importing a file <b>replaces</b> what this save has recorded.</div></div>' +
      '<div class="ca-controls">' +
      C.button(`${CA.UI.Icons.html('download', 14)} Export`, 'data-ca="hexport"', 'ca-btn-small') +
      C.button(`${CA.UI.Icons.html('upload', 14)} Import`, 'data-ca="himport" data-arm-label="Replace history?"', 'ca-btn-small') +
      C.button(`${CA.UI.Icons.html('trash', 14)} Clear`, 'data-ca="gclear" data-arm-label="Erase everything?"', 'ca-btn-small ca-btn-off') +
      '<input type="file" accept=".json,application/json" data-ca-history-file hidden>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function duration(ms) {
    const m = Math.floor(ms / 60000);
    if (m < 1) return `${Math.floor(ms / 1000)} s`;
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h} h ${m % 60} min`;
    return `${Math.floor(h / 24)} d ${h % 24} h`;
  }

  function historyInfo() {
    const r = CA.Recorder.summary();
    if (!r.ready) return 'Loading…';
    if (!r.frames) return 'Nothing recorded yet.';
    const tiers = r.perTier
      .filter((t) => t.frames)
      .map((t) => `${t.frames.toLocaleString()} × ${t.label}`)
      .join(', ');
    const ev = CA.EventLog.list().length;
    const fx = CA.History.intervals.length;
    return (
      `${duration(r.active)} of active play since ${new Date(r.first.t).toLocaleString()} — ` +
      `${tiers} frames, ${ev.toLocaleString()} event${ev === 1 ? '' : 's'}, ${fx.toLocaleString()} buff${fx === 1 ? '' : 's'}.`
    );
  }

  /** Destructive buttons take two clicks: the first arms them (and relabels them) for a few seconds. */
  function armed(btn) {
    if (btn.dataset.armed) {
      clearTimeout(Number(btn.dataset.armed));
      delete btn.dataset.armed;
      btn.innerHTML = btn.dataset.idleHtml;
      btn.classList.remove('ca-armed');
      return true;
    }
    btn.dataset.idleHtml = btn.innerHTML;
    btn.textContent = btn.dataset.armLabel;
    btn.classList.add('ca-armed');
    btn.dataset.armed = String(
      setTimeout(() => {
        if (!btn.dataset.armed) return;
        delete btn.dataset.armed;
        btn.innerHTML = btn.dataset.idleHtml;
        btn.classList.remove('ca-armed');
      }, 4000)
    );
    return false;
  }

  function onHistoryFile(e) {
    const input = e.target;
    if (!input.matches || !input.matches('[data-ca-history-file]') || !input.files || !input.files[0]) return;
    const file = input.files[0];
    input.value = '';
    CA.Recorder.importFile(file)
      .then((n) => {
        CA.Util.notify('History imported', `${n.chunks} chunks and ${n.events} events from ${C.esc(file.name)}.`, CA.ICON, 3);
        sync();
      })
      .catch((err) => CA.Util.notify('Import failed', C.esc(err.message || String(err)), CA.ICON, 4));
  }

  function integrationsCard() {
    const loaded = CA.CookieMonster.isLoaded();
    return (
      '<div class="ca-card">' +
      cardHead('Integrations', 'plug') +
      '<div class="ca-list">' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('puzzle') +
      '<div class="ca-row-text"><div class="ca-row-name">Cookie Monster</div>' +
      `<div class="ca-row-desc" data-ca-cm-status>${loaded ? 'Running.' : 'Not loaded.'} Loads the latest release straight from Cookie Monster's own site.</div></div>` +
      C.button(loaded ? 'Loaded' : 'Load now', 'data-ca="cm-load" data-ca-cm-load' + (loaded ? ' disabled' : ''), 'ca-btn-small') +
      '</div>' +
      CA.Settings.optionsIn('integrations').map(optionRow).join('') +
      '</div>' +
      '</div>'
    );
  }

  // Built-in pages. Other modules register their own pages the same way (CA.UI.Pages).
  CA.UI.Pages.register({
    id: 'graphs',
    label: 'Graphs',
    icon: 'graphs',
    order: 20,
    html: () => CA.UI.Graphs.html(),
    mount: (root) => CA.UI.Graphs.mount(root),
    unmount: () => CA.UI.Graphs.unmount(),
    tick: () => CA.UI.Graphs.tick(),
  });
  CA.UI.Pages.register({
    id: 'stocks',
    label: 'Stock market',
    icon: 'stocks',
    order: 40,
    html: () => stocksPage(),
    mount: (root) => {
      CA.UI.StockGraph.mount(root);
      CA.UI.StockPerf.mount(root);
      CA.UI.StockLog.mount(root);
      wireSellAll(root);
    },
    unmount: () => {
      CA.UI.StockGraph.unmount();
      CA.UI.StockPerf.unmount();
      CA.UI.StockLog.unmount();
    },
    tick: () => {
      CA.UI.StockGraph.tick();
      CA.UI.StockPerf.tick();
      CA.UI.StockLog.tick();
    },
  });
  CA.UI.Pages.register({ id: 'settings', label: 'Settings', icon: 'settings', order: 90, html: () => settingsPage() });

  let mounted = null; // the page whose mount() ran for the current render

  function unmountPage() {
    if (mounted) mounted.unmount();
    mounted = null;
  }

  function html() {
    const page = CA.UI.Pages.get(currentTab());
    return (
      '<div class="close menuClose" data-ca="close">x</div>' +
      '<div id="CookieMgrMenu">' +
      `<div class="ca-page" data-page="${page.id}">${page.html()}</div>` +
      '</div>'
    );
  }

  function render() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    unmountPage();
    menu.innerHTML = html();
    const page = CA.UI.Pages.get(currentTab());
    page.mount(menu.querySelector('.ca-page'));
    mounted = page;
    sync();
  }

  /** Opens the panel on page `id` (or switches to it if the panel is already open). */
  function openPage(id) {
    if (!CA.UI.Pages.get(id)) return;
    const wasOpen = isOpen();
    CA.Settings.set('tab', id);
    if (wasOpen) render();
    else open(); // Game.ShowMenu -> Game.UpdateMenu -> render()
  }

  /** Fills in the Sell All button's hover title with a live cookie estimate right as the
   *  pointer enters it, rather than trying to keep a `title` attribute fresh ahead of time. */
  function wireSellAll(root) {
    const btn = root.querySelector('[data-ca-sellall]');
    if (!btn) return;
    btn.addEventListener('mouseenter', () => {
      btn.title = CA.StockTrader.sellAllTitle();
    });
  }

  /** Updates the dynamic bits of an already rendered panel (no re-render, keeps scroll). */
  function sync() {
    const root = document.getElementById('CookieMgrMenu');
    if (!root) return;

    // macro rows, wherever they are (Macros page, Stock market page, …)
    CA.UI.MacrosPage.sync(root);

    // chips / pills bound to a setting
    root.querySelectorAll('[data-pressed-key]').forEach((el) => {
      const v = CA.Settings.get(el.dataset.pressedKey);
      const on = 'pressedVal' in el.dataset ? String(v) === el.dataset.pressedVal : !!v;
      el.classList.toggle('on', on);
      el.setAttribute('aria-pressed', String(on));
    });

    const info = root.querySelector('[data-ca-history-info]');
    if (info) info.textContent = historyInfo();

    root.querySelectorAll('[data-option]').forEach((row) => {
      setSwitch(row.querySelector('.ca-switch'), !!CA.Settings.get(row.dataset.option));
    });

    const capturing = CA.Hotkeys.capturing();
    root.querySelectorAll('[data-hotkey]').forEach((wrap) => {
      const id = wrap.dataset.hotkey;
      const combo = CA.Settings.getHotkey(id);
      const key = wrap.querySelector('.ca-key');
      const isCapturing = capturing === id;
      wrap.classList.toggle('capturing', isCapturing);
      wrap.classList.toggle('unset', !combo && !isCapturing);
      key.textContent = isCapturing ? 'Press a key…' : combo ? CA.Hotkeys.format(combo) : 'Set key';
    });
  }

  function setSwitch(btn, on) {
    if (!btn) return;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-checked', String(on));
  }

  // ---- interaction ---------------------------------------------------------------

  function onClick(e) {
    if (!isOpen()) return;
    const t = e.target.closest('[data-ca]');
    if (!t) {
      CA.Hotkeys.cancelCapture();
      return;
    }
    const kind = t.getAttribute('data-ca');
    if (kind !== 'bind') CA.Hotkeys.cancelCapture();
    // Don't leave buttons focused: a later Space/Enter would "click" them again.
    if (t.blur) t.blur();

    switch (kind) {
      case 'close':
        Game.ShowMenu();
        break;
      case 'sell-all-stocks':
        CA.Util.sound('snd/clickOff2.mp3');
        CA.StockTrader.sellAll();
        break;
      case 'open-macros':
        CA.Util.sound('snd/tick.mp3');
        openPage('clickers');
        break;
      case 'option': {
        const key = t.dataset.key;
        const next = !CA.Settings.get(key);
        CA.Util.sound(next ? 'snd/clickOn2.mp3' : 'snd/clickOff2.mp3');
        CA.Settings.set(key, next);
        break;
      }
      case 'gclear':
        CA.Util.sound('snd/tick.mp3');
        if (armed(t)) CA.History.clear().then(sync);
        break;
      case 'hexport':
        CA.Util.sound('snd/tick.mp3');
        CA.Recorder.exportFile().catch((err) => CA.Util.notify('Export failed', C.esc(err.message || String(err)), CA.ICON, 4));
        break;
      case 'himport': {
        CA.Util.sound('snd/tick.mp3');
        const input = t.parentNode.querySelector('[data-ca-history-file]');
        if (armed(t) && input) input.click();
        break;
      }
      case 'bind': {
        const id = t.dataset.action;
        CA.Util.sound('snd/tick.mp3');
        if (CA.Hotkeys.capturing() === id) CA.Hotkeys.cancelCapture();
        else CA.Hotkeys.startCapture(id, onBound);
        break;
      }
      case 'unbind':
        CA.Util.sound('snd/tick.mp3');
        CA.Settings.setHotkey(t.dataset.action, '');
        break;
      case 'reset-hotkeys':
        CA.Util.sound('snd/tick.mp3');
        CA.Settings.resetHotkeys();
        CA.Util.notify('CookieMgr', 'Hotkeys reset to defaults.', CA.ICON, 2);
        break;
      case 'cm-load':
        CA.Util.sound('snd/tick.mp3');
        CA.CookieMonster.load();
        break;
      default:
        CA.UI.MacrosPage.handle(kind, t); // macro-toggle, macro-run, macro-fav, all-on, …
    }
  }

  function onBound(combo, shared) {
    CA.Util.sound('snd/tick.mp3');
    if (combo && shared.length) {
      const names = shared.map((id) => (CA.Hotkeys.get(id) || { name: id }).name).join(', ');
      CA.Util.notify('Shared hotkey', `<b>${CA.Hotkeys.format(combo)}</b> also triggers: ${C.esc(names)}`, CA.ICON, 3);
    }
  }

  // ---- wiring ----------------------------------------------------------------------

  function init() {
    CA.Hotkeys.register({ id: 'panel.toggle', name: 'Open / close panel', group: 'general', defaultKey: '', run: toggle });
    CA.Settings.defineOption({ key: 'tab', group: 'ui', name: 'Panel tab', desc: '', default: 'clickers' });

    // Game.resPath points at wherever the game serves its images from (CDN on the web, local on Steam).
    CA.Util.injectCss('CookieMgrStyles', CA.CSS.replace(/url\(img\//g, `url(${CA.Util.res('img/')}`));

    // Draw our panel when the game asks the menu to redraw while it's ours.
    CA.Util.wrap(Game, 'UpdateMenu', (original, args, self) => {
      if (isOpen()) {
        render();
        return undefined;
      }
      return original.apply(self, args);
    });

    // Keep the tab highlight in sync, and stop listening for keys when leaving.
    CA.Util.wrap(Game, 'ShowMenu', (original, args, self) => {
      const result = original.apply(self, args);
      if (!isOpen()) {
        CA.Hotkeys.cancelCapture();
        unmountPage();
      }
      CA.UI.Tab.update();
      return result;
    });

    const menu = document.getElementById('menu');
    if (menu) {
      menu.addEventListener('click', onClick);
      menu.addEventListener('change', onHistoryFile);
    }

    const refresh = () => {
      if (!isOpen()) return;
      sync();
      if (mounted) mounted.tick();
    };
    CA.Events.on('macros', refresh);
    CA.Events.on('settings', refresh);
    CA.Events.on('hotkeys', refresh);
    CA.Events.on('history', () => {
      const info = isOpen() && currentTab() === 'settings' && document.querySelector('#CookieMgrMenu [data-ca-history-info]');
      if (info) info.textContent = historyInfo();
    });
    CA.Events.on('integrations', () => {
      if (isOpen() && currentTab() === 'settings') render();
    });
  }

  return { init, open, close, toggle, isOpen, openPage, render, sync, optionRow, armed, currentTab };
})();

// ---- src/main.js -----------------------------------------------------
// Entry point: waits for the game, then registers CookieMgr through the official mod API
// (Game.registerMod), which gives us init/save/load hooks tied to the game's save file.

function removeLegacyBookmarklet() {
  // v0.1 was a bookmarklet that stored itself on window.cookieHelper — stop it if it's running.
  const h = window.cookieHelper;
  if (!h) return false;
  try {
    Object.values(h.timers || {}).forEach(clearInterval);
    if (h.key) removeEventListener('keydown', h.key);
  } catch (e) {
    /* ignore */
  }
  delete window.cookieHelper;
  return true;
}

// Settings saved before the rename live under the old mod id — carry them over once.
function migrateOldSaveData() {
  const OLD_ID = 'CookieAgent';
  const old = Game.modSaveData && Game.modSaveData[OLD_ID];
  if (!old) return;
  if (!Game.modSaveData[CA.ID]) mod.load(old);
  delete Game.modSaveData[OLD_ID];
}

let loaded = false;

const mod = {
  init() {
    const hadLegacy = removeLegacyBookmarklet();

    // data backbone first: the event log and states must exist before the recorder's first tick
    CA.EventLog.init();
    CA.GameActions.init(); // actions + conditions, then the macros built from them
    CA.Macros.init();
    CA.Grimoire.init();
    CA.Garden.init();
    CA.Stocks.init();
    CA.StockLog.init();
    CA.History.init();
    CA.GameStates.init();
    CA.Recorder.init();
    CA.GameEvents.init();
    CA.UI.Graphs.init();
    CA.UI.EventsPage.init();
    CA.UI.MacrosPage.init();
    CA.UI.Widgets.init();
    CA.UI.WizardPage.init();
    CA.UI.GardenPage.init();
    CA.UI.StockGraph.init();
    CA.UI.StockPerf.init();
    CA.UI.StockLog.init();
    CA.UI.BankToolbar.init();
    CA.Hotkeys.init();
    CA.Ascension.init();
    CA.UI.Menu.init();
    CA.UI.Tab.init();
    CA.Update.init();
    CA.CookieMonster.init();
    migrateOldSaveData();
    CA.Settings.startAutoPersist();

    CA.Util.notify(
      `CookieMgr v${CA.VERSION} loaded`,
      hadLegacy
        ? 'Replaced the old v0.1 bookmarklet. Open the tab on the left beam for settings.'
        : 'Open the tab on the left beam for settings.',
      CA.ICON,
      4
    );
  },

  save() {
    return CA.Settings.serialize();
  },

  load(str) {
    loaded = true;
    // Prefer our own localStorage mirror when we have one — it's updated the moment anything
    // changes, while the game's save can be up to 60s stale or skipped by a quick reload.
    // Read it first: deserializing re-mirrors the current, not-yet-restored state over it.
    const local = CA.Settings.localPayload();
    const data = (local && CA.Settings.deserialize(local)) || CA.Settings.deserialize(str);
    if (!data) return;
    CA.Macros.load(data.macros);
    CA.UI.Widgets.load(data.widgets);
    CA.Garden.load(data.garden);
    if (!CA.Settings.get('rememberStates')) return;
    if (Array.isArray(data.running)) CA.Macros.restore(data.running);
    else {
      // saved by v1.x: { clickers: { bigCookie: true, … }, stockTrader: true }
      const ids = Object.keys(data.clickers || {}).filter((id) => data.clickers[id] === true);
      if (data.stockTrader === true) ids.push('stockTrader');
      CA.Macros.restore(ids);
    }
  },
};

function register() {
  Game.registerMod(CA.ID, mod);
  // The game only calls load() when its save already holds data for this mod (main.js:
  // `if (mod.load && Game.modSaveData[id]) mod.load(...)`), and it only autosaves once a minute.
  // Without this, a refresh before that first save skipped our local mirror entirely and started
  // from defaults — and the next change then overwrote the mirror with them.
  if (!loaded) mod.load('');
}

if (window.CookieMgr) {
  if (typeof Game !== 'undefined' && Game.Notify)
    Game.Notify('CookieMgr', 'Already loaded — reload the page to load a new version.', CA.ICON, 3, 1);
} else {
  window.CookieMgr = CA; // handy for debugging from the console
  const start = () => {
    if (typeof Steam !== 'undefined')
      setTimeout(register, 2000); // same delay Cookie Monster uses on Steam
    else register();
  };
  if (typeof Game !== 'undefined' && Game.ready) start();
  else {
    const wait = setInterval(() => {
      if (typeof Game !== 'undefined' && Game.ready) {
        clearInterval(wait);
        start();
      }
    }, 250);
  }
}
})();
