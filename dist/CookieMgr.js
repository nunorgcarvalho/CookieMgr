/*! CookieMgr v1.5.0 */
(function () {
'use strict';
const CA = {};
CA.VERSION = "1.5.0";
CA.CSS = "/* ==========================================================================\n   CookieMgr — styles\n   Colours and borders borrow from the game's own \"framed\" look so the panel\n   feels native. Everything is scoped under #CookieMgrTab / #CookieMgrMenu.\n   ========================================================================== */\n\n/* ---------- Sidebar (icon tabs sticking out of the left beam, one per page) ---------- */\n\n#CookieMgrTab {\n  position: absolute;\n  left: 30%;\n  top: calc(10% + 96px); /* fallback; tab.js pins it just under the game's cookie-count banner */\n  margin-left: 3px; /* tuck slightly under the beam */\n  transform: translateX(-100%);\n  z-index: 110;\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end; /* items grow leftwards, away from the beam */\n  gap: 4px;\n}\n#CookieMgrTab .ca-tab-item {\n  box-sizing: border-box;\n  height: 32px;\n  display: flex;\n  align-items: center;\n  cursor: pointer;\n  user-select: none;\n  background: linear-gradient(to right, #3d2716, #221409);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-right: none;\n  border-radius: 8px 0 0 8px;\n  box-shadow:\n    -3px 3px 10px rgba(0, 0, 0, 0.65),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.18);\n  transition:\n    background 0.2s,\n    box-shadow 0.2s;\n  outline: none;\n}\n#CookieMgrTab .ca-tab-item:hover,\n#CookieMgrTab .ca-tab-item:focus-visible {\n  box-shadow:\n    -3px 3px 12px rgba(0, 0, 0, 0.75),\n    0 0 12px rgba(255, 215, 110, 0.35),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.25);\n}\n#CookieMgrTab .ca-tab-item.selected {\n  background: linear-gradient(to right, #7a4f22, #43290f);\n  box-shadow:\n    -3px 3px 12px rgba(0, 0, 0, 0.75),\n    0 0 14px rgba(255, 215, 110, 0.55),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.3);\n}\n#CookieMgrTab .ca-tab-label {\n  max-width: 0;\n  overflow: hidden;\n  opacity: 0;\n  padding: 0;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 13px;\n  letter-spacing: 0.5px;\n  color: #f4e6c3;\n  text-shadow:\n    0 1px 2px #000,\n    0 0 6px rgba(255, 200, 120, 0.25);\n  white-space: nowrap;\n  transition:\n    max-width 0.22s ease-out,\n    opacity 0.15s,\n    padding 0.22s ease-out;\n}\n#CookieMgrTab .ca-tab-item:hover .ca-tab-label,\n#CookieMgrTab .ca-tab-item:focus-visible .ca-tab-label {\n  max-width: 180px;\n  opacity: 1;\n  padding: 0 2px 0 12px;\n}\n#CookieMgrTab .ca-tab-icon {\n  position: relative;\n  flex: none;\n  width: 30px;\n  height: 30px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #f4e6c3;\n  filter: drop-shadow(0 1px 1px #000);\n}\n#CookieMgrTab .ca-tab-item.selected .ca-tab-icon,\n#CookieMgrTab .ca-tab-item:hover .ca-tab-icon {\n  color: #ffeab0;\n}\n#CookieMgrTab .ca-tab-badge {\n  display: none;\n  position: absolute;\n  top: -5px;\n  left: -5px;\n  min-width: 15px;\n  height: 15px;\n  padding: 0 3px;\n  box-sizing: border-box;\n  border-radius: 8px;\n  font:\n    bold 9px/15px Tahoma,\n    Arial,\n    sans-serif;\n  text-align: center;\n  color: #fff;\n  background: linear-gradient(#63c64a, #2f7d24);\n  box-shadow:\n    0 0 6px rgba(120, 240, 100, 0.8),\n    0 1px 1px #000;\n  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.6);\n}\n#CookieMgrTab .ca-tab-item.active .ca-tab-badge {\n  display: block;\n  animation: caBadgeGlow 2s infinite ease-in-out;\n}\n@keyframes caBadgeGlow {\n  0%,\n  100% {\n    box-shadow:\n      0 0 4px rgba(120, 240, 100, 0.6),\n      0 1px 1px #000;\n  }\n  50% {\n    box-shadow:\n      0 0 10px rgba(120, 240, 100, 1),\n      0 1px 1px #000;\n  }\n}\n#game.ascending #CookieMgrTab,\n#game.ascendIntro #CookieMgrTab,\n#game.reincarnating #CookieMgrTab {\n  display: none;\n}\n\n/* ---------- Icons (used everywhere, not just inside the panel) ---------- */\n\n.ca-ico {\n  display: inline-block;\n  flex: none;\n  vertical-align: middle;\n}\n.ca-ico-cookie {\n  background: url(img/perfectCookie.png) center / contain no-repeat;\n}\n\n/* ---------- Stock market toolbar inside the Bank minigame ---------- */\n\n#cm-bank-toolbar {\n  position: relative;\n  z-index: 10;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 4px 4px 6px;\n}\n#cm-bank-toolbar .bankButton {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 11px;\n  padding: 3px 9px;\n}\n#cm-bank-toolbar .cm-bt-open {\n  color: #f4e6c3;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n}\n\n/* ---------- Panel ---------- */\n\n#CookieMgrMenu {\n  max-width: 780px;\n  margin: 0 auto;\n  padding: 0 12px 120px;\n  color: #ddd;\n}\n#CookieMgrMenu .ca-tagline {\n  text-align: center;\n  margin: -6px 0 14px;\n  font-size: 12px;\n  font-style: italic;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n}\n\n/* Cards */\n#CookieMgrMenu .ca-card {\n  margin: 14px 4px;\n  border-radius: 6px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  background: rgba(0, 0, 0, 0.38);\n  box-shadow:\n    0 0 1px #000,\n    inset 0 0 1px #000,\n    0 6px 16px rgba(0, 0, 0, 0.35);\n  overflow: hidden;\n}\n#CookieMgrMenu .ca-card-head {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 10px;\n  padding: 9px 14px;\n  background: linear-gradient(to right, rgba(255, 235, 190, 0.09), rgba(255, 235, 190, 0));\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-card-title {\n  flex: 1;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-size: 20px;\n  color: #fff;\n  text-shadow:\n    0 -1px 5px rgba(255, 255, 200, 0.35),\n    0 1px 3px #000;\n}\n#CookieMgrMenu .ca-card-ico {\n  margin-right: 8px;\n  vertical-align: -1px;\n  color: #ffd98a;\n  filter: drop-shadow(0 1px 2px #000);\n}\n#CookieMgrMenu .ca-row-ico {\n  flex: 0 0 28px;\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #e8d7b0;\n  background: radial-gradient(circle at 35% 30%, rgba(255, 230, 170, 0.18), rgba(0, 0, 0, 0.25));\n  box-shadow:\n    inset 0 0 0 1px rgba(255, 220, 150, 0.25),\n    0 1px 3px rgba(0, 0, 0, 0.6);\n}\n#CookieMgrMenu .ca-row-option:has(.ca-switch.on) .ca-row-ico {\n  color: #ffeab0;\n  box-shadow:\n    inset 0 0 0 1px rgba(255, 220, 150, 0.55),\n    0 0 8px rgba(255, 210, 110, 0.35);\n}\n#CookieMgrMenu .ca-row-ico .ca-ico-cookie {\n  width: 18px !important;\n  height: 18px !important;\n}\n#CookieMgrMenu .ca-pill {\n  font-size: 11px;\n  white-space: nowrap;\n  padding: 3px 10px;\n  border-radius: 10px;\n  color: #bbb;\n  background: rgba(255, 255, 255, 0.07);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  transition: all 0.2s;\n}\n#CookieMgrMenu .ca-pill.on {\n  color: #cfc;\n  background: rgba(80, 200, 90, 0.16);\n  border-color: rgba(130, 235, 120, 0.5);\n}\n\n/* Rows */\n#CookieMgrMenu .ca-row {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px 12px;\n  padding: 8px 14px;\n  border-top: 1px solid rgba(255, 255, 255, 0.05);\n  transition: background 0.2s;\n}\n#CookieMgrMenu .ca-list .ca-row:first-child {\n  border-top: none;\n}\n#CookieMgrMenu .ca-row:hover {\n  background: rgba(255, 255, 255, 0.035);\n}\n#CookieMgrMenu .ca-row.on {\n  background: linear-gradient(to right, rgba(255, 210, 90, 0.12), rgba(255, 210, 90, 0) 65%);\n}\n#CookieMgrMenu .ca-row-master {\n  background: rgba(0, 0, 0, 0.22);\n  border-top: none;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-row-option {\n  padding-top: 10px;\n  padding-bottom: 10px;\n}\n#CookieMgrMenu .ca-row-text {\n  flex: 1 1 160px;\n  min-width: 0;\n}\n#CookieMgrMenu .ca-row-option {\n  flex-wrap: nowrap;\n}\n#CookieMgrMenu .ca-row-option .ca-row-text {\n  flex-basis: 0;\n}\n#CookieMgrMenu .ca-controls {\n  flex: 0 1 auto;\n  max-width: 100%;\n  margin-left: auto;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n}\n#CookieMgrMenu .ca-row-name {\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 14px;\n  color: #f2ead2;\n  text-shadow: 0 1px 2px #000;\n}\n#CookieMgrMenu .ca-row-desc {\n  margin-top: 2px;\n  font-size: 11px;\n  color: #b3a590;\n  text-shadow: 0 1px 1px #000;\n}\n\n/* Icons */\n#CookieMgrMenu .ca-icon {\n  flex: 0 0 36px;\n  width: 36px;\n  height: 36px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition:\n    filter 0.25s,\n    transform 0.25s;\n  filter: grayscale(0.55) brightness(0.8);\n}\n#CookieMgrMenu .ca-row.on .ca-icon,\n#CookieMgrMenu .ca-row-master .ca-icon {\n  filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.75));\n}\n#CookieMgrMenu .ca-row.on .ca-icon {\n  transform: scale(1.06);\n}\n#CookieMgrMenu .ca-img {\n  width: 36px;\n  height: 36px;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}\n#CookieMgrMenu .ca-sprite {\n  flex: none;\n  width: 48px;\n  height: 48px;\n  background-image: url(img/icons.png);\n  transform: scale(0.75);\n}\n\n/* Toggle switch */\n#CookieMgrMenu .ca-switch {\n  flex: none;\n  padding: 2px;\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n#CookieMgrMenu .ca-switch:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-switch-track {\n  display: block;\n  position: relative;\n  width: 42px;\n  height: 22px;\n  box-sizing: border-box;\n  border-radius: 11px;\n  background: #2a211c;\n  border: 1px solid rgba(255, 255, 255, 0.22);\n  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.75);\n  transition:\n    background 0.2s,\n    border-color 0.2s,\n    box-shadow 0.2s;\n}\n#CookieMgrMenu .ca-switch-knob {\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 35% 30%, #fff, #c9c1b5 55%, #8a8178);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);\n  transition: left 0.18s ease-out;\n}\n#CookieMgrMenu .ca-switch:hover .ca-switch-track {\n  border-color: rgba(255, 225, 150, 0.6);\n}\n#CookieMgrMenu .ca-switch.on .ca-switch-track {\n  background: linear-gradient(#66c84b, #2f7d24);\n  border-color: #a5ea93;\n  box-shadow:\n    inset 0 1px 3px rgba(0, 0, 0, 0.35),\n    0 0 9px rgba(110, 230, 90, 0.45);\n}\n#CookieMgrMenu .ca-switch.on .ca-switch-knob {\n  left: 22px;\n}\n#CookieMgrMenu .ca-switch:focus-visible .ca-switch-track {\n  outline: 2px solid #ffd76a;\n  outline-offset: 2px;\n}\n\n/* Hotkey chips */\n#CookieMgrMenu .ca-hotkey {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n}\n#CookieMgrMenu .ca-key {\n  min-width: 46px;\n  height: 26px;\n  padding: 0 10px;\n  font:\n    bold 12px Tahoma,\n    Arial,\n    sans-serif;\n  color: #f4e6c3;\n  text-shadow: 0 1px 1px #000;\n  background: linear-gradient(#4d3c2d, #2a2018);\n  border: 1px solid;\n  border-color: #9a7d5b #3b2c1f #2a1f15 #74604a;\n  border-radius: 5px;\n  box-shadow:\n    0 2px 0 #140d08,\n    inset 0 1px 0 rgba(255, 255, 255, 0.16);\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    border-color 0.15s,\n    box-shadow 0.15s;\n}\n#CookieMgrMenu .ca-key:hover {\n  color: #fff;\n  border-color: #e0c08a #5a4430 #3d2e20 #b39468;\n}\n#CookieMgrMenu .ca-key:active {\n  transform: translateY(1px);\n  box-shadow:\n    0 1px 0 #140d08,\n    inset 0 1px 0 rgba(255, 255, 255, 0.16);\n}\n#CookieMgrMenu .ca-key:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-hotkey.unset .ca-key {\n  color: #8f877a;\n  font-weight: normal;\n  font-style: italic;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px dashed rgba(255, 255, 255, 0.22);\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-hotkey.capturing .ca-key {\n  color: #ffe9a6;\n  border-color: #ffd76a;\n  animation: caCapture 1.1s infinite ease-in-out;\n}\n@keyframes caCapture {\n  0%,\n  100% {\n    box-shadow:\n      0 2px 0 #140d08,\n      0 0 0 0 rgba(255, 215, 106, 0.5);\n  }\n  50% {\n    box-shadow:\n      0 2px 0 #140d08,\n      0 0 12px 2px rgba(255, 215, 106, 0.55);\n  }\n}\n#CookieMgrMenu .ca-key-clear {\n  width: 18px;\n  height: 18px;\n  margin-left: 3px;\n  padding: 0;\n  border: none;\n  border-radius: 50%;\n  background: transparent;\n  color: #b09a8a;\n  font-size: 14px;\n  line-height: 18px;\n  cursor: pointer;\n  opacity: 0;\n  transition:\n    opacity 0.15s,\n    background 0.15s;\n}\n#CookieMgrMenu .ca-row:hover .ca-key-clear {\n  opacity: 0.8;\n}\n#CookieMgrMenu .ca-key-clear:hover {\n  color: #fff;\n  background: rgba(255, 80, 80, 0.35);\n}\n#CookieMgrMenu .ca-hotkey.unset .ca-key-clear,\n#CookieMgrMenu .ca-hotkey.capturing .ca-key-clear {\n  visibility: hidden;\n}\n\n/* Buttons */\n#CookieMgrMenu .ca-btn {\n  padding: 4px 12px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 12px;\n  color: #ddd;\n  text-shadow: 0 1px 1px #000;\n  background: linear-gradient(#3e2f23, #1d140f);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 4px;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    inset 0 1px 0 rgba(255, 255, 255, 0.12);\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    box-shadow 0.15s,\n    opacity 0.15s;\n}\n#CookieMgrMenu .ca-btn:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-btn:not(:disabled):hover {\n  color: #fff;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    0 0 9px rgba(255, 220, 120, 0.35),\n    inset 0 1px 0 rgba(255, 255, 255, 0.18);\n}\n#CookieMgrMenu .ca-btn:not(:disabled):active {\n  transform: translateY(1px);\n}\n#CookieMgrMenu .ca-btn-on:not(:disabled):hover {\n  color: #d6ffcc;\n}\n#CookieMgrMenu .ca-btn-off:not(:disabled):hover {\n  color: #ffd2cc;\n}\n#CookieMgrMenu .ca-btn:disabled {\n  opacity: 0.38;\n  cursor: default;\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-btn-small {\n  font-size: 11px;\n  padding: 3px 10px;\n}\n#CookieMgrMenu .ca-btn .ca-ico {\n  vertical-align: -2px;\n}\n#CookieMgrMenu .ca-btn.ca-armed {\n  color: #fff;\n  background: #8a2a22;\n  box-shadow: 0 0 0 1px #e5484d, 0 0 8px rgba(229, 72, 77, 0.6);\n}\n#CookieMgrMenu .ca-btn-lg {\n  padding: 10px 20px;\n  font-size: 15px;\n  border-radius: 6px;\n}\n#CookieMgrMenu .ca-btn-danger {\n  color: #ffdcd2;\n  background: linear-gradient(#6b2420, #3a1210);\n  border-color: #ffb199 #7a2a1e #5c1b12 #d98a6e;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    0 0 10px rgba(255, 90, 60, 0.25),\n    inset 0 1px 0 rgba(255, 255, 255, 0.15);\n}\n#CookieMgrMenu .ca-btn-danger:not(:disabled):hover {\n  color: #fff;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    0 0 16px rgba(255, 90, 60, 0.5),\n    inset 0 1px 0 rgba(255, 255, 255, 0.2);\n}\n#CookieMgrMenu .ca-card-danger {\n  border-color: rgba(255, 110, 80, 0.3);\n  box-shadow:\n    0 0 1px #000,\n    inset 0 0 1px #000,\n    0 0 14px rgba(255, 70, 40, 0.12),\n    0 6px 16px rgba(0, 0, 0, 0.35);\n}\n#CookieMgrMenu .ca-row-sellall {\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n}\n\n/* Footer */\n#CookieMgrMenu .ca-footer {\n  margin: 18px 8px 0;\n  font-size: 11px;\n  line-height: 1.7;\n  text-align: center;\n  color: #9b907f;\n  text-shadow: 0 1px 1px #000;\n}\n#CookieMgrMenu .ca-footer b {\n  color: #c9bba3;\n}\n#CookieMgrMenu kbd {\n  display: inline-block;\n  padding: 0 5px;\n  font:\n    bold 10px/16px Tahoma,\n    Arial,\n    sans-serif;\n  color: #e8dcc2;\n  background: #2a2018;\n  border: 1px solid #5a4632;\n  border-radius: 3px;\n  box-shadow: 0 1px 0 #140d08;\n}\n#CookieMgrMenu .ca-footer-actions {\n  margin-top: 8px;\n}\n\n#CookieMgrMenu .ca-page {\n  animation: caFade 0.18s ease-out;\n}\n@keyframes caFade {\n  from {\n    opacity: 0;\n    transform: translateY(3px);\n  }\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n#CookieMgrMenu a {\n  color: #ffd98a;\n}\n\n/* ---------- Graph ---------- */\n\n#CookieMgrMenu .ca-live {\n  font-size: 11px;\n  padding: 3px 10px 3px 20px;\n  position: relative;\n  border-radius: 10px;\n  color: #cfc;\n  background: rgba(80, 200, 90, 0.16);\n  border: 1px solid rgba(130, 235, 120, 0.5);\n}\n#CookieMgrMenu .ca-live:before {\n  content: '';\n  position: absolute;\n  left: 8px;\n  top: 50%;\n  width: 6px;\n  height: 6px;\n  margin-top: -3px;\n  border-radius: 50%;\n  background: #7be07b;\n  box-shadow: 0 0 6px #7be07b;\n  animation: caBadgeGlow 1.6s infinite ease-in-out;\n}\n#CookieMgrMenu .ca-live.paused {\n  color: #ffd9a0;\n  background: rgba(255, 170, 60, 0.14);\n  border-color: rgba(255, 190, 100, 0.5);\n}\n#CookieMgrMenu .ca-live.paused:before {\n  background: #ffb45c;\n  box-shadow: none;\n  animation: none;\n}\n\n#CookieMgrMenu .ca-stats {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));\n  gap: 1px;\n  background: rgba(255, 255, 255, 0.06);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-stat {\n  min-width: 0; /* lets the grid cell shrink below its content so overflow/ellipsis below can work */\n  padding: 8px 12px;\n  background: rgba(0, 0, 0, 0.32);\n}\n#CookieMgrMenu .ca-stat-label {\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #a89a83;\n}\n#CookieMgrMenu .ca-stat-value {\n  margin-top: 2px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 17px;\n  color: #ffeab0;\n  text-shadow: 0 1px 3px #000;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n#CookieMgrMenu .ca-stat-sub {\n  margin-top: 1px;\n  font-size: 10px;\n  color: #93866f;\n  white-space: nowrap;\n}\n\n#CookieMgrMenu .ca-toolbar {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px 12px;\n  padding: 8px 12px;\n}\n#CookieMgrMenu .ca-toolbar-bottom {\n  padding-top: 6px;\n}\n#CookieMgrMenu .ca-chipgroup {\n  display: inline-flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 4px;\n}\n#CookieMgrMenu .ca-chip-label {\n  margin-right: 2px;\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #93866f;\n}\n#CookieMgrMenu .ca-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 3px 9px;\n  font:\n    bold 11px Tahoma,\n    Arial,\n    sans-serif;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.14);\n  border-radius: 11px;\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    background 0.15s,\n    border-color 0.15s;\n}\n#CookieMgrMenu .ca-chip:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-chip:hover {\n  color: #fff;\n  border-color: rgba(255, 225, 150, 0.5);\n}\n#CookieMgrMenu .ca-chip.on {\n  color: #fff3cf;\n  background: rgba(255, 200, 100, 0.18);\n  border-color: rgba(255, 210, 120, 0.6);\n}\n#CookieMgrMenu .ca-sw {\n  display: inline-block;\n  width: 9px;\n  height: 9px;\n  margin-right: 1px;\n  border-radius: 50%;\n  vertical-align: -1px;\n  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55);\n}\n\n#CookieMgrMenu .ca-graph-wrap {\n  position: relative;\n  margin: 0 8px;\n}\n#CookieMgrMenu canvas.ca-graph {\n  display: block;\n  width: 100%;\n  height: 300px;\n  cursor: crosshair;\n}\n#CookieMgrMenu canvas.ca-graph.ca-graph-small {\n  height: 160px;\n}\n#CookieMgrMenu .ca-tip {\n  display: none;\n  position: absolute;\n  z-index: 5;\n  max-width: 270px;\n  min-width: 150px;\n  padding: 7px 10px;\n  pointer-events: none;\n  font-size: 11px;\n  line-height: 1.35;\n  color: #e6dcc6;\n  background: rgba(14, 10, 6, 0.95);\n  border: 1px solid;\n  border-color: #b98a4e #6a4626 #55301c #a0764a;\n  border-radius: 5px;\n  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);\n}\n#CookieMgrMenu .ca-tip-head {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-bottom: 4px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 12px;\n  color: #ffeab0;\n}\n#CookieMgrMenu .ca-tip-head span {\n  margin-left: auto;\n  padding-left: 10px;\n  font:\n    normal 10px Tahoma,\n    Arial,\n    sans-serif;\n  color: #a89a83;\n}\n#CookieMgrMenu .ca-tip-row {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 1px 0;\n}\n#CookieMgrMenu .ca-tip-row b {\n  font-weight: normal;\n  color: #b9ab93;\n}\n#CookieMgrMenu .ca-tip-row span {\n  margin-left: auto;\n  padding-left: 12px;\n  text-align: right;\n  color: #f2ead2;\n}\n#CookieMgrMenu .ca-tip-row.strong b,\n#CookieMgrMenu .ca-tip-row.strong span {\n  color: #fff3cf;\n  font-weight: bold;\n}\n#CookieMgrMenu .ca-tip-sep {\n  height: 1px;\n  margin: 5px 0;\n  background: rgba(255, 255, 255, 0.14);\n}\n#CookieMgrMenu .ca-tip-note {\n  margin: 2px 0 4px;\n  font-style: italic;\n  color: #a89a83;\n}\n\n#CookieMgrMenu .ca-legend {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px 12px;\n  min-height: 16px;\n  padding: 2px 14px 12px;\n  font-size: 11px;\n  color: #b9ab93;\n}\n#CookieMgrMenu .ca-legend-item em {\n  font-style: normal;\n  color: #93866f;\n}\n#CookieMgrMenu .ca-legend-empty {\n  font-style: italic;\n  color: #7f735f;\n}\n\n#CookieMgrMenu .ca-hidden {\n  display: none;\n}\n\n/* ---------- Stock transaction log + ticker ---------- */\n\n#CookieMgrMenu .cm-tx-wrap {\n  max-height: 220px;\n  overflow-y: auto;\n  margin: 0 4px 6px;\n}\n#CookieMgrMenu .cm-tx-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 11px;\n}\n#CookieMgrMenu .cm-tx-table th {\n  position: sticky;\n  top: 0;\n  text-align: left;\n  padding: 4px 8px;\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #93866f;\n  background: #1c150d;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n}\n#CookieMgrMenu .cm-tx-table td {\n  padding: 3px 8px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n  white-space: nowrap;\n  color: #d8cbb0;\n}\n#CookieMgrMenu .cm-tx-row:hover td {\n  background: rgba(255, 255, 255, 0.04);\n}\n#CookieMgrMenu .cm-tx-buy {\n  color: #8f8;\n  font-weight: bold;\n}\n#CookieMgrMenu .cm-tx-sell {\n  color: #f88;\n  font-weight: bold;\n}\n#CookieMgrMenu .cm-tx-empty {\n  padding: 14px 8px;\n  text-align: center;\n  font-style: italic;\n  color: #7f735f;\n  font-size: 12px;\n}\n\n#CookieMgrMenu .cm-tickbars {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  margin: 0 8px 8px;\n}\n#CookieMgrMenu .cm-tickbar {\n  flex: 1 1 90px;\n  min-width: 70px;\n  padding: 5px 6px;\n  background: rgba(0, 0, 0, 0.28);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 4px;\n  font-size: 10px;\n}\n#CookieMgrMenu .cm-tickbar-time {\n  color: #93866f;\n  text-align: center;\n  margin-bottom: 3px;\n  white-space: nowrap;\n}\n#CookieMgrMenu .cm-tickbar-row {\n  height: 5px;\n  background: rgba(255, 255, 255, 0.06);\n  border-radius: 3px;\n  margin-bottom: 2px;\n  overflow: hidden;\n}\n#CookieMgrMenu .cm-tickbar-fill {\n  display: block;\n  height: 100%;\n  border-radius: 3px;\n}\n#CookieMgrMenu .cm-tickbar-buy {\n  background: #8f8;\n}\n#CookieMgrMenu .cm-tickbar-sell {\n  background: #f88;\n}\n#CookieMgrMenu .cm-tickbar-net {\n  text-align: center;\n  font-weight: bold;\n  margin-top: 3px;\n}\n#CookieMgrMenu .cm-ticks-empty {\n  margin: 0 8px 8px;\n  padding: 10px;\n  text-align: center;\n  font-style: italic;\n  color: #7f735f;\n  font-size: 11px;\n}\n\n#CookieMgrMenu .cm-ticker {\n  margin: 8px 8px 10px;\n  padding: 6px 0;\n  overflow: hidden;\n  white-space: nowrap;\n  background: rgba(0, 0, 0, 0.32);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 4px;\n}\n#CookieMgrMenu .cm-ticker-track {\n  display: inline-block;\n  will-change: transform;\n}\n#CookieMgrMenu .cm-tick-item {\n  display: inline-block;\n  padding: 0 16px;\n  font:\n    bold 11px Tahoma,\n    Arial,\n    sans-serif;\n  color: #cbbfa6;\n}\n#CookieMgrMenu .cm-tick-buy {\n  color: #8f8;\n}\n#CookieMgrMenu .cm-tick-sell {\n  color: #f88;\n}\n#CookieMgrMenu .cm-tick-empty {\n  color: #7f735f;\n  font-style: italic;\n  font-weight: normal;\n}\n#CookieMgrMenu .cm-tick-sep {\n  color: #4a4232;\n  padding: 0 4px;\n}\n\n@keyframes cmTickerScroll {\n  from {\n    transform: translateX(0);\n  }\n  to {\n    transform: translateX(-50%);\n  }\n}\n\n/* ---------- Sub-tabs (Graphs page and others) ---------- */\n\n#CookieMgrMenu .ca-subtabs {\n  display: flex;\n  gap: 4px;\n  margin: 2px 0 10px;\n  padding: 0 4px;\n  border-bottom: 1px solid rgba(255, 220, 150, 0.25);\n}\n#CookieMgrMenu .ca-subtab {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 14px 5px;\n  margin-bottom: -1px;\n  font:\n    bold 12px Tahoma,\n    Arial,\n    sans-serif;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n  background: rgba(0, 0, 0, 0.25);\n  border: 1px solid rgba(255, 220, 150, 0.18);\n  border-bottom-color: transparent;\n  border-radius: 6px 6px 0 0;\n  cursor: pointer;\n}\n#CookieMgrMenu .ca-subtab:hover {\n  color: #f0e2c0;\n}\n#CookieMgrMenu .ca-subtab.on {\n  color: #fff3cf;\n  background: linear-gradient(to bottom, rgba(255, 200, 100, 0.2), rgba(0, 0, 0, 0.3));\n  border-color: rgba(255, 220, 150, 0.45);\n  border-bottom-color: #1c150d;\n}\n#CookieMgrMenu .ca-subtab .ca-ico-cookie {\n  width: 14px !important;\n  height: 14px !important;\n}\n\n/* ---------- Tables, notes ---------- */\n\n#CookieMgrMenu .ca-card-note {\n  padding: 0 14px 6px;\n  font-size: 11px;\n  line-height: 1.4;\n  color: #a39477;\n}\n#CookieMgrMenu .ca-table-wrap {\n  padding: 4px 10px 6px;\n  overflow-x: auto;\n}\n#CookieMgrMenu .ca-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 11px;\n}\n#CookieMgrMenu .ca-table th {\n  text-align: right;\n  padding: 4px 8px;\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #93866f;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  white-space: nowrap;\n}\n#CookieMgrMenu .ca-table th:first-child,\n#CookieMgrMenu .ca-table td:first-child {\n  text-align: left;\n}\n#CookieMgrMenu .ca-table td {\n  text-align: right;\n  padding: 3px 8px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n  white-space: nowrap;\n  color: #d8cbb0;\n  font-variant-numeric: tabular-nums;\n}\n#CookieMgrMenu .ca-table tr.strong td {\n  color: #fff3cf;\n  font-weight: bold;\n}\n#CookieMgrMenu .ca-table tbody tr:hover td {\n  background: rgba(255, 255, 255, 0.04);\n}\n#CookieMgrMenu .ca-sw.ca-sw-dash {\n  width: 10px;\n  height: 0;\n  border-radius: 0;\n  border-top: 2px dashed;\n  box-shadow: none;\n  vertical-align: 2px;\n}\n#CookieMgrMenu .ca-chip .ca-ico {\n  vertical-align: -2px;\n}\n";

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
//   'clickers'  (id)          an autoclicker was switched on/off
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
// Registry of things a hotkey can trigger.
// Each feature registers its actions; the hotkey system and the settings panel read from here.
//
//   CA.Actions.register({
//     id: 'clicker.golden',     // unique, stable (it is stored in the save)
//     name: 'Golden cookies',   // shown in the UI
//     group: 'autoclickers',
//     defaultKey: 'KeyG',       // KeyboardEvent.code combo, '' for unbound
//     run() { ... },
//   });

CA.Actions = (() => {
  const list = [];
  const byId = {};

  function register(action) {
    if (byId[action.id]) throw new Error(`Action "${action.id}" already registered`);
    const a = { group: 'general', defaultKey: '', ...action };
    list.push(a);
    byId[a.id] = a;
    return a;
  }

  function get(id) {
    return byId[id];
  }

  function all(group) {
    return group ? list.filter((a) => a.group === group) : list.slice();
  }

  function run(id) {
    const a = byId[id];
    if (a && a.run) a.run();
  }

  return { register, get, all, run };
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

  function getHotkey(actionId) {
    if (actionId in hotkeyOverrides) return hotkeyOverrides[actionId];
    const action = CA.Actions.get(actionId);
    return action ? action.defaultKey : '';
  }

  function actionForCombo(combo) {
    if (!combo) return null;
    const hit = CA.Actions.all().find((a) => getHotkey(a.id) === combo);
    return hit ? hit.id : null;
  }

  /**
   * Binds `combo` to `actionId`. Any other action already using that combo is unbound.
   * @returns {string[]} ids of actions that lost their binding
   */
  function setHotkey(actionId, combo) {
    const displaced = [];
    if (combo) {
      CA.Actions.all().forEach((a) => {
        if (a.id !== actionId && getHotkey(a.id) === combo) {
          storeOverride(a.id, '');
          displaced.push(a.id);
        }
      });
    }
    storeOverride(actionId, combo);
    CA.Events.emit('hotkeys', actionId);
    return displaced;
  }

  function storeOverride(actionId, combo) {
    const action = CA.Actions.get(actionId);
    if (action && action.defaultKey === combo) delete hotkeyOverrides[actionId];
    else hotkeyOverrides[actionId] = combo;
  }

  function resetHotkeys() {
    hotkeyOverrides = {};
    CA.Events.emit('hotkeys', null);
  }

  // ---- save / load -------------------------------------------------------------

  function serialize() {
    const data = { v: SAVE_VERSION, options: { ...options }, hotkeys: { ...hotkeyOverrides } };
    if (options.rememberStates) {
      if (CA.Autoclickers) data.clickers = CA.Autoclickers.snapshot();
      if (CA.StockTrader) data.stockTrader = CA.StockTrader.isOn();
    }
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
        if (typeof data.hotkeys[id] === 'string') hotkeyOverrides[id] = data.hotkeys[id];
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

  /** @returns {object|null} same shape as deserialize()'s return, or null if nothing local */
  function restoreFromLocal() {
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
    if (!data || typeof data.payload !== 'string') return null;
    return deserialize(data.payload);
  }

  function startAutoPersist() {
    CA.Events.on('settings', persistToLocal);
    CA.Events.on('hotkeys', persistToLocal);
    CA.Events.on('clickers', persistToLocal);
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
    actionForCombo,
    resetHotkeys,
    serialize,
    deserialize,
    restoreFromLocal,
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
    const addedMeanwhile = events.filter((e) => e.s === s);
    return CA.Store.allFor('events', s).then((stored) => {
      if (s !== saveId) return;
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
// A combo is stored as a string of optional modifiers followed by a KeyboardEvent.code,
// e.g. 'KeyG', 'Shift+KeyG', 'Ctrl+Alt+Digit1'. Using `code` (physical key) keeps
// bindings stable across keyboard layouts and Shift states.

CA.Hotkeys = (() => {
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

// ---- src/features/autoclickers.js ------------------------------------
// Autoclickers: the original v0.1 bookmarklet features, one timer each.

CA.Autoclickers = (() => {
  const popShimmers = (filter) => {
    Game.shimmers.filter(filter).forEach((s) => s.pop());
  };

  /**
   * Clicker definitions. To add a new one, append an entry here — the panel,
   * hotkeys and save data pick it up automatically.
   *   icon: [x, y] on the game's img/icons.png (used in notifications)
   *   img:  optional nicer picture for the panel
   */
  const DEFS = [
    {
      id: 'bigCookie',
      name: 'Big cookie',
      desc: 'Clicks the big cookie 20 times a second.',
      interval: 50,
      defaultKey: 'KeyC',
      icon: [11, 0],
      img: 'img/perfectCookie.png',
      tick() {
        Game.ClickCookie();
      },
    },
    {
      id: 'golden',
      name: 'Golden cookies',
      desc: 'Pops golden cookies the moment they appear.',
      interval: 100,
      defaultKey: 'KeyG',
      icon: [10, 14],
      img: 'img/goldCookie.png',
      tick() {
        popShimmers((s) => s.type === 'golden' && !s.wrath);
      },
    },
    {
      id: 'wrath',
      name: 'Wrath cookies',
      desc: 'Pops red wrath cookies too (they can be good or bad).',
      interval: 100,
      defaultKey: 'KeyW',
      icon: [15, 5],
      img: 'img/wrathCookie.png',
      tick() {
        popShimmers((s) => s.type === 'golden' && s.wrath);
      },
    },
    {
      id: 'reindeer',
      name: 'Reindeer',
      desc: 'Pops reindeer during the Christmas season.',
      interval: 100,
      defaultKey: 'KeyR',
      icon: [12, 9],
      img: 'img/frostedReindeer.png',
      tick() {
        popShimmers((s) => s.type === 'reindeer');
      },
    },
    {
      id: 'fortune',
      name: 'Fortune news',
      desc: 'Clicks fortunes as they scroll through the news ticker.',
      interval: 100,
      defaultKey: 'KeyF',
      icon: [29, 8],
      tick() {
        if (Game.TickerEffect && Game.TickerEffect.type === 'fortune' && Game.tickerL) Game.tickerL.click();
      },
    },
    {
      id: 'wrinklers',
      name: 'Wrinklers',
      desc: 'Pops wrinklers as soon as they latch onto the cookie.',
      interval: 100,
      defaultKey: 'KeyK',
      icon: [19, 8],
      tick() {
        Game.wrinklers.forEach((w) => {
          if (w.phase > 0) w.hp = 0;
        });
      },
    },
  ];

  const byId = {};
  const enabled = {};
  const timers = {};

  DEFS.forEach((d) => {
    byId[d.id] = d;
    enabled[d.id] = false;
  });

  function runTick(def) {
    if (Game.OnAscend || Game.AscendTimer > 0) return;
    try {
      def.tick();
    } catch (e) {
      console.error(`[CookieMgr] ${def.name} autoclicker error`, e);
    }
  }

  function announce(title, on, icon) {
    if (!CA.Settings.get('notifications')) return;
    CA.Util.notify(title, on ? '<b style="color:#8f8">ON</b>' : '<b style="color:#f88">OFF</b>', icon, 2);
  }

  /** Turns one autoclicker on or off. */
  function set(id, on, { silent = false } = {}) {
    const def = byId[id];
    if (!def) return;
    on = !!on;
    if (enabled[id] === on && (!on || timers[id])) return;

    clearInterval(timers[id]);
    timers[id] = null;
    enabled[id] = on;
    if (on) timers[id] = setInterval(() => runTick(def), def.interval);

    if (!silent) announce(`${def.name} autoclicker`, on, def.icon);
    CA.Events.emit('clickers', id);
  }

  function toggle(id) {
    set(id, !enabled[id]);
  }

  function setAll(on, { silent = false } = {}) {
    DEFS.forEach((d) => set(d.id, on, { silent: true }));
    if (!silent) announce('All autoclickers', on, CA.ICON);
  }

  /** Same behaviour as v0.1: if anything is off, turn everything on; otherwise turn all off. */
  function toggleAll() {
    setAll(!allOn());
  }

  const isOn = (id) => !!enabled[id];
  const allOn = () => DEFS.every((d) => enabled[d.id]);
  const activeCount = () => DEFS.filter((d) => enabled[d.id]).length;
  const list = () => DEFS.slice();
  const snapshot = () => ({ ...enabled });

  function restore(states) {
    if (!states || typeof states !== 'object') return;
    DEFS.forEach((d) => {
      if (typeof states[d.id] === 'boolean') set(d.id, states[d.id], { silent: true });
    });
  }

  function init() {
    DEFS.forEach((d) =>
      CA.Actions.register({
        id: `clicker.${d.id}`,
        name: d.name,
        group: 'autoclickers',
        defaultKey: d.defaultKey,
        run: () => toggle(d.id),
      })
    );
    CA.Actions.register({
      id: 'clickers.toggleAll',
      name: 'Toggle all autoclickers',
      group: 'general',
      defaultKey: 'KeyA',
      run: toggleAll,
    });

    CA.Settings.defineOption({
      key: 'disableOnAscend',
      icon: 'ascend',
      group: 'autoclickers',
      name: 'Turn off when ascending',
      desc: 'Switches every autoclicker off as soon as you ascend.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'rememberStates',
      icon: 'save',
      group: 'autoclickers',
      name: 'Remember on/off states',
      desc: 'Restores which autoclickers were running when you reload the game.',
      default: false,
    });
    CA.Settings.defineOption({
      key: 'notifications',
      icon: 'bell',
      group: 'autoclickers',
      name: 'Toggle notifications',
      desc: 'Shows a small ON/OFF popup whenever an autoclicker is switched.',
      default: true,
    });

    CA.Events.on('ascend', () => {
      if (!CA.Settings.get('disableOnAscend') || activeCount() === 0) return;
      setAll(false, { silent: true });
      CA.Util.notify('CookieMgr', 'All autoclickers were turned off for your ascension.', [20, 7], 4);
    });
  }

  return { init, set, toggle, setAll, toggleAll, isOn, allOn, activeCount, list, snapshot, restore, get: (id) => byId[id] };
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
    if (!m || holdingsFor !== CA.Store.saveId()) return;
    ensurePriceStates(m);
    m.goodsById.forEach(updateHolding);
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

  return { init, refresh, MODES, list, portfolioNow, minigame };
})();

// ---- src/features/gameStates.js --------------------------------------
// The built-in states (core/states.js) — what the recorder samples every second and what the
// graphs are built from. Grouped:
//
//   CpS        cps, base (unbuffed), click (cookies/s from clicking)
//   cookies    cookies (bank), baked (this ascension), bakedAllTime, handmade
//   earnings   per-frame flows splitting "baked" by source — see attribute() below
//   bank       per-frame flows for what else moves the bank: spending, wrinkler withering, other
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
  function attribute(ctx) {
    if (ctx._earn) return ctx._earn;
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

  function bankFlows(ctx) {
    if (ctx._bank) return ctx._bank;
    const earned = attribute(ctx).total;
    const withered = ctx.prev ? (Game.cookiesPs || 0) * (Game.cpsSucked || 0) * ctx.dt : 0;
    const change = delta(ctx, 'cookies');
    const expected = earned - withered;
    ctx._bank = {
      withered,
      spent: Math.max(0, expected - change), // buildings, upgrades, stock purchases, …
      otherIn: Math.max(0, change - expected), // stock sales and anything else not "baked"
    };
    return ctx._bank;
  }

  function init() {
    // cookies — defined first: states below compute deltas of these within the same frame
    S({ id: 'cookies', name: 'Cookies in bank', group: 'cookies', kind: 'gauge', get: () => Game.cookies });
    S({ id: 'baked', name: 'Cookies baked (this ascension)', group: 'cookies', kind: 'counter', get: () => Game.cookiesEarned });
    S({ id: 'bakedAllTime', name: 'Cookies baked (all time)', group: 'cookies', kind: 'counter', get: () => (Game.cookiesEarned || 0) + (Game.cookiesReset || 0) });
    S({ id: 'handmade', name: 'Cookies from clicking (total)', group: 'cookies', kind: 'counter', get: () => Game.handmadeCookies });

    // CpS — field names match what the CpS graph has always read (s.cps, s.base, s.click)
    S({ id: 'cps', name: 'CpS', unit: '/s', group: 'cps', kind: 'gauge', get: () => (Game.cookiesPs || 0) * shown() });
    S({ id: 'base', name: 'Unbuffed CpS', unit: '/s', group: 'cps', kind: 'gauge', get: () => (Game.unbuffedCps || Game.cookiesPs || 0) * shown() });
    S({ id: 'click', name: 'Clicking', unit: '/s', group: 'cps', kind: 'gauge', get: (ctx) => (ctx.dt ? Math.max(0, delta(ctx, 'handmade')) / ctx.dt : 0) });

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
  }

  return { init, attribute };
})();

// ---- src/features/stockTrader.js -------------------------------------
// Stock market autoclicker: buys the max it can afford of fast-rising stocks, then slow-rising
// ones, and sells anything it holds that isn't currently rising. That's the whole strategy —
// no price targets, no per-stock tuning.
//
// Kept separate from CA.Autoclickers (rather than another DEFS entry) on purpose: it lives on
// its own Stock market tab and must NOT be swept up by "All on/off" or the toggle-all hotkey.
//
// Uses the Bank minigame's own buy/sell API (M.buyGood/M.sellGood with the amount `10000`,
// the same sentinel value the game's own "buy max"/"sell max" buttons use — verified against
// minigameMarket.js) rather than computing an affordable amount ourselves.

CA.StockTrader = (() => {
  const TICK_MS = 1000;
  const RISING = [3, 1]; // fast rise, then slow rise — good.mode values (see features/stocks.js)

  let timer = null;
  let enabled = false;

  function trade(m) {
    const goods = m.goodsById.filter((g) => g.active);
    goods.forEach((g) => {
      if (g.stock > 0 && !RISING.includes(g.mode)) m.sellGood(g.id, 10000);
    });
    RISING.forEach((mode) => goods.forEach((g) => g.mode === mode && m.buyGood(g.id, 10000)));
  }

  function tick() {
    if (Game.OnAscend || Game.AscendTimer > 0) return;
    const m = CA.Stocks.minigame();
    if (!m) return;
    try {
      trade(m);
    } catch (e) {
      console.error('[CookieMgr] Stock market autoclicker error', e);
    }
  }

  function announce(on) {
    if (!CA.Settings.get('notifications')) return;
    CA.Util.notify('Stock market buy autoclicker', on ? '<b style="color:#8f8">ON</b>' : '<b style="color:#f88">OFF</b>', [9, 33], 2);
  }

  function set(on, { silent = false } = {}) {
    on = !!on;
    if (enabled === on && (!on || timer)) return;
    clearInterval(timer);
    timer = null;
    enabled = on;
    if (on) timer = setInterval(tick, TICK_MS);
    if (!silent) announce(on);
    CA.Events.emit('clickers', 'stockTrader');
  }

  function toggle() {
    set(!enabled);
  }
  const isOn = () => enabled;

  /** Sells every stock currently held, and turns the autoclicker off first so it doesn't just
   *  buy everything straight back. */
  function sellAll() {
    set(false);
    const m = CA.Stocks.minigame();
    if (!m) return;
    m.goodsById.forEach((g) => {
      if (g.stock > 0) m.sellGood(g.id, 10000);
    });
  }

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

  function init() {
    CA.Actions.register({
      id: 'clicker.stockTrader',
      name: 'Stock market buy',
      group: 'stocks',
      defaultKey: '',
      run: toggle,
    });
  }

  return { init, set, toggle, isOn, sellAll, previewSellAllCookies, sellAllTitle };
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
          addEvent({ type, title, text, cookies, data: { effects } });
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
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/>' + stroke('M12 7v5l3 3'),
    filter: '<path d="M3 4h18l-7 8.5V20l-4-2v-5.5z"/>',
    sparkle: '<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/>',
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

  /** Small count bubble on a page's icon (e.g. running autoclickers); 0 hides it. */
  const badges = {
    clickers: () => CA.Autoclickers.activeCount(),
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
    CA.Events.on('clickers', update);
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
  const BAR_PX = 5; // target on-screen width (bar + gap) of one bar in Auto coarseness
  const MAX_AUTO_BARS = 240;
  const MAX_BARS = 900;
  const BAR_GAP_FRAC = 0.18;
  const LANE_H = 8;
  const LANE_GAP = 2;
  const MAX_LANES = 6;
  const GAP_MS = 5000; // matches the recorder's MAX_GAP_MS
  const SEC = 1000;
  const NICE_MS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800].map((s) => s * SEC);
  const WINDOW_LABELS = { 60: '1m', 300: '5m', 900: '15m', 3600: '1h', 10800: '3h', 43200: '12h', 86400: '1d', 604800: '7d', 0: 'All' };
  const COARSE = [0, 1, 5, 15, 60, 300, 900, 3600];
  const COARSE_LABELS = { 0: 'Auto', 1: '1s', 5: '5s', 15: '15s', 60: '1m', 300: '5m', 900: '15m', 3600: '1h' };

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
      fields.forEach((k, i) => {
        const a = cur.acc[i];
        if (a.last === undefined) return;
        cur.first[k] = a.first;
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
   *   coarse: true to offer a bar-width chooser (default Auto),
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
    const key = (k) => `plot.${id}.${k}`;
    const height = spec.height || 220;
    const fmt = spec.fmt || ((v) => beautify(v, 0));
    const tipFmt = spec.tipFmt || ((v) => beautify(v) + (spec.unit || ''));

    // persisted per-plot choices (kept out of the generic Settings list)
    const def = (k, d) => S().defineOption({ key: key(k), group: 'plot', name: k, desc: '', default: d });
    def('win', spec.window != null ? spec.window : (spec.windows || [300])[0]);
    if (spec.coarse) def('coarse', 0);
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
      if (spec.coarse) {
        h +=
          '<div class="ca-chipgroup" title="Width of each bar">' +
          '<span class="ca-chip-label">Bars</span>' +
          COARSE.map((s) => setChip('coarse', s, COARSE_LABELS[s])).join('') +
          '</div>';
      }
      h += '<div class="ca-chipgroup">';
      if (spec.log != null) h += boolChip(key('log'), 'Log scale', 'Logarithmic vertical axis — handy when values grow by orders of magnitude');
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
      const auto = niceUp(W / Math.max(12, Math.min(MAX_AUTO_BARS, Math.round(plotW / BAR_PX))));
      const want = spec.coarse ? opt('coarse') * SEC : 0;
      const bucket = want ? Math.max(want, niceUp(W / MAX_BARS)) : auto;
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
      lastData = { v, data };
      const series = data.series || [];
      const byKey = {};
      series.forEach((s) => (byKey[s.key] = s));
      const bars = data.bars || [];
      const lines = data.lines || {};
      const barSeries = series.filter((s) => s.type === 'bar');
      const log = spec.log != null && opt('log');

      // effect lanes (bottom of the plot)
      const ivs = (data.intervals || []).filter((iv) => iv.x1 > v.x0 && iv.x0 < v.x1);
      const lanes = assignLanes(ivs);
      const laneCount = Math.min(MAX_LANES, lanes.count);
      const lanesH = laneCount ? laneCount * (LANE_H + LANE_GAP) + 2 : 0;

      // y range
      let maxV = -Infinity;
      let minV = Infinity;
      let minPos = Infinity;
      const see = (val) => {
        if (!Number.isFinite(val)) return;
        if (val > maxV) maxV = val;
        if (val < minV) minV = val;
        if (val > 0 && val < minPos) minPos = val;
      };
      bars.forEach((b) => {
        let pos = 0;
        let neg = 0;
        barSeries.forEach((s) => {
          const val = b.parts[s.key];
          if (!Number.isFinite(val)) return;
          if (val >= 0) pos += val;
          else neg += val;
          if (val > 0) see(val);
        });
        see(pos);
        see(neg);
      });
      Object.keys(lines).forEach((k) => (byKey[k] && byKey[k].noScale ? null : lines[k].forEach((p) => see(p.v))));
      (data.hlines || []).forEach((l) => see(l.v));
      if (data.zero !== false) see(0);

      let yMin;
      let yMax;
      let ticks = [];
      if (log) {
        if (!isFinite(minPos)) minPos = 1;
        if (!(maxV > 0)) maxV = 10;
        yMin = Math.pow(10, Math.floor(Math.log10(minPos)));
        yMax = Math.pow(10, Math.ceil(Math.log10(maxV * 1.02)));
        if (yMax / yMin < 10) yMax = yMin * 10;
        for (let t = yMin; t <= yMax * 1.0001; t *= 10) ticks.push(t);
        while (ticks.length > 7) ticks = ticks.filter((_, i) => i % 2 === 0);
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

      padL = CA.UI.Chart.dynamicPadLeft(ctx, FONT, ticks.map(fmt), MIN_PAD_L, PAD_L_MARGIN);
      const plot = { x: padL, y: PAD.t, w: w - padL - PAD.r, h: h - PAD.t - PAD.b };
      const chartH = plot.h - lanesH - (laneCount ? 4 : 0);
      const lanesTop = plot.y + plot.h - lanesH;
      const xOf = (x) => plot.x + ((x - v.x0) / v.W) * plot.w;
      const yOf = (val) => {
        let f;
        if (log) f = (Math.log10(Math.max(val, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin));
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
      const y0 = yOf(log ? yMin : Math.max(yMin, Math.min(yMax, 0)));
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
        if (b - a > 46 && iv.label) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(a, y, b - a, LANE_H);
          ctx.clip();
          ctx.font = 'bold 8px Tahoma, Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillText(iv.label, a + 4, y + LANE_H / 2 + 0.5);
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
    });
  }

  return {
    init,
    create,
    get: (id) => all.get(id),
    bucketize,
    linePoints,
    smooth,
    axis,
    fmt: { beautify, signed, short, clock, span, tile, row, swatch, windowLabel },
    SEC,
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
  const SESSION_START = Date.now(); // "this session" = since CookieMgr was loaded in this tab

  const WINDOWS = [60, 300, 900, 3600, 10800, 43200, 86400, 604800, 0];
  const LONG_WINDOWS = [900, 3600, 10800, 43200, 86400, 604800, 0];

  const SOURCES = [
    { key: 'earnProduction', name: 'Production', color: '#f5c451' },
    { key: 'earnClick', name: 'Clicking', color: '#7fe08b' },
    { key: 'earnGolden', name: 'Golden cookies & reindeer', color: '#ff9f43' },
    { key: 'earnOther', name: 'Other', color: '#b39ddb' },
  ];
  const BANK_IN = SOURCES.concat([{ key: 'bankOtherIn', name: 'Other income (stock sales, …)', color: '#4fd6e0' }]);
  const BANK_OUT = [
    { key: 'spent', name: 'Spent', color: '#e5484d' },
    { key: 'withered', name: 'Withered by wrinklers', color: '#8d6e63' },
  ];
  const C_CPS = '#f5c451';
  const C_CLICK = '#7fe08b';
  const C_BASE = '#9db4cc';
  const C_SHOWN = '#ffffff';

  const TABS = [
    { id: 'cookies', label: 'Cookies', icon: 'cookie', plots: ['cps', 'actual', 'baked'] },
    { id: 'bank', label: 'Bank', icon: 'dollar', plots: ['bank', 'bankflow', 'bankcum'] },
    { id: 'prestige', label: 'Prestige', icon: 'ascend', plots: ['prestige', 'prestigeRate'] },
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

  /** Bars with each source as a per-second rate. */
  const rate = (b, k) => (b.secs > 0 && Number.isFinite(b.v[k]) ? b.v[k] / b.secs : 0);

  /** Running totals of flows across bars, from `startX` (bars before it are dropped). */
  function cumulative(bars, keys, startX, sign = {}) {
    const run = {};
    keys.forEach((k) => (run[k] = 0));
    const out = [];
    bars.forEach((b) => {
      if (b.x1 <= startX) return;
      const parts = {};
      keys.forEach((k) => {
        run[k] += (b.v[k] || 0) * (sign[k] || 1);
        parts[k] = run[k];
      });
      out.push({ x0: b.x0, x1: b.x1, secs: b.secs, parts, raw: b });
    });
    return out;
  }

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
    const acc = { secs: 0, cps: 0, click: 0, base: 0, earned: 0 };
    for (let i = frames.length - 1; i >= 0 && frames[i].a > from; i--) {
      const f = frames[i];
      const dt = f.dt || 0;
      acc.secs += dt;
      acc.cps += (f.cps || 0) * dt;
      acc.click += (f.click || 0) * dt;
      acc.base += (f.base || 0) * dt;
      acc.earned += f.earned || 0;
    }
    if (!acc.secs) return null;
    return { cps: acc.cps / acc.secs, click: acc.click / acc.secs, base: acc.base / acc.secs, actual: acc.earned / acc.secs, secs: acc.secs };
  }

  // ---- Cookies tab --------------------------------------------------------------------------

  const cpsPlot = () =>
    P().create({
      id: 'cps',
      title: 'Cookies per second',
      icon: 'graphs',
      windows: WINDOWS,
      window: 300,
      log: true,
      unit: '/s',
      choices: [
        {
          key: 'smooth',
          label: 'Smooth',
          default: 5,
          options: [
            { v: 0, label: 'Raw' },
            { v: 5, label: '5s' },
            { v: 15, label: '15s' },
          ],
        },
      ],
      build(v) {
        const bars = v.bucketize(['cps', 'click', 'base']);
        const ivs = effects(v);
        const k = Math.max(1, Math.round((v.opt('smooth') * SEC) / v.bucket));
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
          lines: { base: P().smooth(P().linePoints(bars, (b) => b.v.base), k) },
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

  /** The averages table under the CpS plot: rows of measures, columns of time spans. */
  function averagesTable() {
    const { beautify } = F();
    const COLS = [
      { s: 0, label: 'Now' },
      { s: 60, label: '1 min' },
      { s: 300, label: '5 min' },
      { s: 900, label: '15 min' },
      { s: 3600, label: '1 h' },
      { s: 10800, label: '3 h' },
    ];
    const vals = COLS.map((c) => {
      if (c.s) return recent(c.s);
      const frames = CA.Recorder.frames();
      const f = frames[frames.length - 1];
      return f ? { cps: f.cps || 0, click: f.click || 0, base: f.base || 0, actual: f.dt ? (f.earned || 0) / f.dt : 0 } : null;
    });
    const ROWS = [
      { label: 'Production', title: 'Raw CpS — what the game shows, without clicking', fn: (r) => beautify(r.cps) + '/s', color: C_CPS },
      { label: 'Clicking', title: 'Cookies per second from clicking the big cookie', fn: (r) => beautify(r.click) + '/s', color: C_CLICK },
      { label: 'Production + clicking', title: 'Raw CpS plus clicking', fn: (r) => beautify(r.cps + r.click) + '/s', strong: true },
      { label: 'With ÷ without clicking', title: 'How much clicking multiplies your income', fn: (r) => (r.cps > 0 ? `×${((r.cps + r.click) / r.cps).toFixed(r.click / r.cps > 9 ? 1 : 2)}` : '—') },
      { label: 'Unbuffed', title: 'Production with every temporary effect removed', fn: (r) => beautify(r.base) + '/s', color: C_BASE },
      { label: 'Actually baked', title: 'What really went into cookies baked, per second — includes golden cookies and everything else', fn: (r) => beautify(r.actual) + '/s', color: SOURCES[2].color },
    ];
    let h = '<div class="ca-table-wrap"><table class="ca-table"><thead><tr><th>Average over the last…</th>';
    COLS.forEach((c) => (h += `<th>${c.label}</th>`));
    h += '</tr></thead><tbody>';
    ROWS.forEach((r) => {
      h += `<tr${r.strong ? ' class="strong"' : ''}><td title="${esc(r.title)}">${r.color ? F().swatch(r.color) : ''}${esc(r.label)}</td>`;
      vals.forEach((val) => (h += `<td>${val ? esc(r.fn(val)) : '—'}</td>`));
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="ca-card-note">Averages always cover the newest stretch of active play, whatever the chart is showing.</div>';
    return h;
  }

  const actualPlot = () =>
    P().create({
      id: 'actual',
      title: 'Actual CpS',
      icon: 'bolt',
      note: 'What really got baked each second, split by where it came from — golden cookie payouts, Frenzy and everything else included. The dashed line is what the game shows as CpS (plus clicking).',
      windows: WINDOWS,
      window: 900,
      coarse: true,
      log: false,
      unit: '/s',
      build(v) {
        const bars = v.bucketize(SOURCES.map((s) => s.key).concat(['earned', 'cps', 'click']));
        const ivs = effects(v);
        let sum = 0;
        let secs = 0;
        bars.forEach((b) => {
          sum += b.v.earned || 0;
          secs += b.secs;
        });
        const avg = secs ? sum / secs : NaN;
        return {
          series: SOURCES.map((s) => ({ key: s.key, name: s.name, color: s.color, type: 'bar' })).concat([
            { key: 'shown', name: 'Shown CpS + clicking', color: C_SHOWN, type: 'line', dash: true, width: 1.2 },
          ]),
          bars: bars.map((b) => {
            const parts = {};
            SOURCES.forEach((s) => (parts[s.key] = rate(b, s.key)));
            return { x0: b.x0, x1: b.x1, parts, raw: b };
          }),
          lines: { shown: P().linePoints(bars, (b) => (Number.isFinite(b.v.cps) ? b.v.cps + (b.v.click || 0) : undefined)) },
          hlines: Number.isFinite(avg) ? [{ v: avg, label: `avg ${F().beautify(avg)}/s`, color: 'rgba(255,200,120,0.7)' }] : [],
          intervals: ivs,
          markers: markers(v, ['golden', 'wrath', 'reindeer', 'ascend'], ivs),
          sum,
          secs,
          bars0: bars,
        };
      },
      stats(v, data) {
        const { tile, beautify } = F();
        const tot = {};
        SOURCES.forEach((s) => (tot[s.key] = 0));
        let shown = 0;
        data.bars0.forEach((b) => {
          SOURCES.forEach((s) => (tot[s.key] += b.v[s.key] || 0));
          shown += ((b.v.cps || 0) + (b.v.click || 0)) * b.secs;
        });
        const actual = data.secs ? data.sum / data.secs : 0;
        const shownAvg = data.secs ? shown / data.secs : 0;
        const share = (k) => (data.sum > 0 ? Math.round((tot[k] / data.sum) * 100) + '%' : '—');
        return (
          tile('Actual', beautify(actual) + '/s', 'average, this window') +
          tile('Shown', beautify(shownAvg) + '/s', 'CpS + clicking') +
          tile('Actual ÷ shown', shownAvg > 0 ? `×${(actual / shownAvg).toFixed(2)}` : '—', 'extra from everything else') +
          tile('Golden share', share('earnGolden'), 'of cookies baked')
        );
      },
    });

  const bakedPlot = () =>
    P().create({
      id: 'baked',
      title: 'Cookies baked',
      icon: 'cookie',
      note: 'Running total of cookies baked, split by source.',
      windows: WINDOWS,
      window: 3600,
      log: false,
      choices: [FROM],
      build(v) {
        const keys = SOURCES.map((s) => s.key);
        const start = cumulativeStart(v);
        const bars = cumulative(v.bucketize(keys), keys, start);
        return {
          series: SOURCES.map((s) => ({ key: s.key, name: s.name, color: s.color, type: 'bar' })),
          bars,
          markers: markers(v, ['ascend'], []),
          empty: v.opt('from') === 'session' && start >= v.x1 ? 'Nothing baked yet this session.' : 'Collecting data…',
          totals: bars.length ? bars[bars.length - 1].parts : null,
          start,
        };
      },
      stats(v, data) {
        const { tile, beautify, span } = F();
        const t = data.totals || {};
        const total = SOURCES.reduce((n, s) => n + (t[s.key] || 0), 0);
        const pct = (k) => (total > 0 ? Math.round(((t[k] || 0) / total) * 100) + '%' : '—');
        const secs = data.bars.reduce((n, b) => n + b.secs, 0);
        return (
          tile('Baked', beautify(total), secs ? `in ${span(secs)} of play` : '') +
          tile('Production', pct('earnProduction')) +
          tile('Clicking', pct('earnClick')) +
          tile('Golden & other', total > 0 ? Math.round((((t.earnGolden || 0) + (t.earnOther || 0)) / total) * 100) + '%' : '—')
        );
      },
    });

  // ---- Bank tab ---------------------------------------------------------------------------

  const bankPlot = () =>
    P().create({
      id: 'bank',
      title: 'Cookies in bank',
      icon: 'dollar',
      windows: WINDOWS,
      window: 3600,
      log: false,
      build(v) {
        const bars = v.bucketize(['cookies']);
        const ivs = effects(v);
        return {
          series: [{ key: 'cookies', name: 'Cookies in bank', color: C_CPS, type: 'area', width: 1.8 }],
          lines: { cookies: P().linePoints(bars, (b) => b.v.cookies) },
          intervals: ivs,
          markers: markers(v, ['golden', 'wrath', 'reindeer', 'ascend', 'trade'], ivs),
          bars0: bars,
        };
      },
      stats(v, data) {
        const { tile, beautify, signed } = F();
        const pts = data.lines.cookies;
        if (!pts.length) return tile('Now', '—');
        let lo = Infinity;
        let hi = -Infinity;
        pts.forEach((p) => {
          lo = Math.min(lo, p.v);
          hi = Math.max(hi, p.v);
        });
        return (
          tile('Now', beautify(pts[pts.length - 1].v)) +
          tile('Change', signed(pts[pts.length - 1].v - pts[0].v), 'this window') +
          tile('Lowest', beautify(lo)) +
          tile('Highest', beautify(hi))
        );
      },
    });

  const bankKeys = BANK_IN.concat(BANK_OUT).map((s) => s.key);
  const bankSeries = () =>
    BANK_IN.map((s) => ({ key: s.key, name: s.name, color: s.color, type: 'bar' })).concat(
      BANK_OUT.map((s) => ({ key: s.key, name: s.name, color: s.color, type: 'bar' })),
      [{ key: 'net', name: 'Net change', color: C_SHOWN, type: 'line', width: 1.4 }]
    );
  const OUT_SIGN = { spent: -1, withered: -1 };
  const netOf = (parts) => bankKeys.reduce((n, k) => n + (parts[k] || 0), 0);

  const bankFlowPlot = () =>
    P().create({
      id: 'bankflow',
      title: 'Bank change per second',
      icon: 'bolt',
      note: 'Everything that moved the bank: cookies coming in above the line (by source), going out below it.',
      windows: WINDOWS,
      window: 900,
      coarse: true,
      unit: '/s',
      totalLabel: 'Net',
      tipFmt: (val) => F().signed(val) + '/s',
      fmt: (val) => F().beautify(val, 0),
      build(v) {
        const raw = v.bucketize(bankKeys);
        const bars = raw.map((b) => {
          const parts = {};
          bankKeys.forEach((k) => (parts[k] = rate(b, k) * (OUT_SIGN[k] || 1)));
          return { x0: b.x0, x1: b.x1, parts, raw: b };
        });
        const totals = {};
        let secs = 0;
        raw.forEach((b) => {
          secs += b.secs;
          bankKeys.forEach((k) => (totals[k] = (totals[k] || 0) + (b.v[k] || 0) * (OUT_SIGN[k] || 1)));
        });
        return {
          series: bankSeries(),
          bars,
          lines: { net: bars.map((b) => ({ x: (b.x0 + b.x1) / 2, x0: b.x0, x1: b.x1, v: netOf(b.parts) })) },
          markers: markers(v, ['ascend', 'trade'], []),
          totals,
          secs,
        };
      },
      stats: (v, data) => bankStats(data, true),
    });

  function bankStats(data, perSecond) {
    const { tile, beautify, signed } = F();
    const t = data.totals || {};
    const d = perSecond ? data.secs || 0 : 1;
    if (!d) return tile('Net', '—');
    const income = BANK_IN.reduce((n, s) => n + (t[s.key] || 0), 0);
    const out = BANK_OUT.reduce((n, s) => n + (t[s.key] || 0), 0);
    const u = perSecond ? '/s' : '';
    return (
      tile('Net', signed((income + out) / d) + u, perSecond ? 'average, this window' : '') +
      tile('In', beautify(income / d) + u) +
      tile('Spent', beautify(-(t.spent || 0) / d) + u) +
      tile('Withered', beautify(-(t.withered || 0) / d) + u, 'by wrinklers')
    );
  }

  const bankCumPlot = () =>
    P().create({
      id: 'bankcum',
      title: 'Bank change, running total',
      icon: 'timeline',
      windows: WINDOWS,
      window: 3600,
      choices: [FROM],
      totalLabel: 'Net',
      tipFmt: (val) => F().signed(val),
      build(v) {
        const start = cumulativeStart(v);
        const bars = cumulative(v.bucketize(bankKeys), bankKeys, start, OUT_SIGN);
        return {
          series: bankSeries(),
          bars,
          lines: { net: bars.map((b) => ({ x: b.x1, x0: b.x0, x1: b.x1, v: netOf(b.parts) })) },
          markers: markers(v, ['ascend'], []),
          totals: bars.length ? bars[bars.length - 1].parts : {},
        };
      },
      stats: (v, data) => bankStats(data, false),
    });

  // ---- Prestige tab ---------------------------------------------------------------------------

  const prestigePlot = () =>
    P().create({
      id: 'prestige',
      title: 'Prestige',
      icon: 'ascend',
      windows: LONG_WINDOWS,
      window: 10800,
      fmt: (val) => F().beautify(val, 0),
      tipFmt: (val) => F().beautify(Math.floor(val), 0),
      build(v) {
        const bars = v.bucketize(['prestigeTotal', 'prestige']);
        return {
          series: [
            { key: 'prestigeTotal', name: 'Level if you ascended now', color: '#c9bcff', type: 'area', width: 1.8 },
            { key: 'prestige', name: 'Current level', color: C_BASE, type: 'line', dash: true },
          ],
          lines: {
            prestigeTotal: P().linePoints(bars, (b) => b.v.prestigeTotal),
            prestige: P().linePoints(bars, (b) => b.v.prestige),
          },
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
        const r = recent(900);
        const eta = r && r.actual > 0 && need > 0 ? need / r.actual : NaN;
        return (
          tile('Level', beautify(cur, 0)) +
          tile('If you ascended now', beautify(total, 0), `+${beautify(total - cur, 0)} this run`) +
          tile('Next level', Number.isFinite(need) ? beautify(Math.max(0, need)) : '—', 'cookies to go') +
          tile('Next level in', Number.isFinite(eta) ? span(eta) : '—', 'at the last 15 min’s actual CpS')
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
      coarse: true,
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
    currentTab().plots.forEach((id) => plots[id].mount(root));
  }

  function unmount() {
    TABS.forEach((t) => t.plots.forEach((id) => plots[id] && plots[id].unmount()));
    if (mountedRoot) mountedRoot.removeEventListener('click', onClick);
    mountedRoot = null;
  }

  function tick() {
    currentTab().plots.forEach((id) => plots[id].tick());
  }

  function init() {
    S().defineOption({ key: 'graphTab', group: 'ui', name: 'Graphs tab', desc: '', default: 'cookies' });
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
    plots.baked = bakedPlot();
    plots.bank = bankPlot();
    plots.bankflow = bankFlowPlot();
    plots.bankcum = bankCumPlot();
    plots.prestige = prestigePlot();
    plots.prestigeRate = prestigeRatePlot();
    CA.Events.on('history', (why) => {
      if (mountedRoot && why === 'sample') tick();
    });
  }

  return { init, html, mount, unmount, tick, TABS, SOURCES, plots };
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
          tile('Value', beautify(p.value)) +
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
      coarse: true,
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
    CA.Events.on('clickers', sync);
    CA.Events.on('settings', sync);
    setInterval(sync, 1000); // the minigame redraws/opens on its own schedule
    sync();
  }

  return { init };
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

  function clickerRow(def) {
    return (
      `<div class="ca-row" data-clicker="${def.id}">` +
      C.icon(def) +
      `<div class="ca-row-text"><div class="ca-row-name">${C.esc(def.name)}</div><div class="ca-row-desc">${C.esc(def.desc)}</div></div>` +
      '<div class="ca-controls">' +
      C.hotkey(`clicker.${def.id}`) +
      C.toggle(false, `data-ca="clicker" data-id="${def.id}"`, def.name) +
      '</div>' +
      '</div>'
    );
  }

  function stockTraderRow() {
    return (
      '<div class="ca-row" data-stock-trader>' +
      C.icon({ icon: [9, 33] }) +
      '<div class="ca-row-text"><div class="ca-row-name">Buy fast/slow rise, sell the rest</div>' +
      '<div class="ca-row-desc">Buys the max it can afford of fast-rising stocks, then slow-rising ones. Sells anything it holds ' +
      "that isn't currently rising. That's the whole strategy.</div></div>" +
      '<div class="ca-controls">' +
      C.hotkey('clicker.stockTrader') +
      C.toggle(false, 'data-ca="stockTrader"', 'Stock market buy') +
      '</div>' +
      '</div>'
    );
  }

  /** Its own card, apart from the autoclicker row, so it isn't lost among other controls —
   *  selling everything is a bigger deal than flipping a toggle. The button's title (what the
   *  hover shows) is filled in with a live cookie estimate on mouseenter; see wireSellAll(). */
  function sellAllCard() {
    return (
      '<div class="ca-card ca-card-danger">' +
      '<div class="ca-row ca-row-sellall">' +
      '<div class="ca-row-text"><div class="ca-row-name">Sell everything</div>' +
      '<div class="ca-row-desc">Sells every stock you hold right now and turns the autoclicker off first, ' +
      'so it doesn\'t just buy it all straight back.</div></div>' +
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

  function clickersPage() {
    return (
      '<div class="ca-card">' +
      C.cardHead('Autoclickers', 'cookie', '<div class="ca-card-meta"><span class="ca-pill" data-ca-count></span></div>') +
      '<div class="ca-row ca-row-master">' +
      C.icon({ icon: CA.ICON }) +
      '<div class="ca-row-text"><div class="ca-row-name">All autoclickers</div>' +
      '<div class="ca-row-desc">The hotkey turns everything on &mdash; or off, if everything is already running.</div></div>' +
      '<div class="ca-controls">' +
      C.button('All on', 'data-ca="all-on"', 'ca-btn-on') +
      C.button('All off', 'data-ca="all-off"', 'ca-btn-off') +
      C.hotkey('clickers.toggleAll') +
      '</div>' +
      '</div>' +
      `<div class="ca-list">${CA.Autoclickers.list().map(clickerRow).join('')}</div>` +
      '</div>' +
      optionsCard('Options', 'settings', 'autoclickers')
    );
  }

  function stocksPage() {
    return (
      sellAllCard() +
      '<div class="ca-card">' +
      C.cardHead('Autobuyer', 'bolt') +
      `<div class="ca-list">${stockTraderRow()}</div>` +
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
      optionsCard('Autoclickers', 'cookie', 'autoclickers') +
      optionsCard('Graphs', 'graphs', 'graph') +
      optionsCard('Stock market', 'stocks', 'stocks') +
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
  CA.UI.Pages.register({ id: 'clickers', label: 'Autoclickers', icon: 'cookie', order: 10, html: () => clickersPage() });
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

    CA.Autoclickers.list().forEach((def) => {
      const on = CA.Autoclickers.isOn(def.id);
      const row = root.querySelector(`[data-clicker="${def.id}"]`);
      if (!row) return;
      row.classList.toggle('on', on);
      setSwitch(row.querySelector('.ca-switch'), on);
    });

    const stRow = root.querySelector('[data-stock-trader]');
    if (stRow) {
      const on = CA.StockTrader.isOn();
      stRow.classList.toggle('on', on);
      setSwitch(stRow.querySelector('.ca-switch'), on);
    }

    const total = CA.Autoclickers.list().length;
    const active = CA.Autoclickers.activeCount();
    const pill = root.querySelector('[data-ca-count]');
    if (pill) {
      pill.textContent = `${active} / ${total} running`;
      pill.classList.toggle('on', active > 0);
      root.querySelector('[data-ca="all-on"]').disabled = active === total;
      root.querySelector('[data-ca="all-off"]').disabled = active === 0;
    }

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
      case 'clicker': {
        const id = t.dataset.id;
        CA.Util.sound(CA.Autoclickers.isOn(id) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
        CA.Autoclickers.toggle(id);
        break;
      }
      case 'stockTrader':
        CA.Util.sound(CA.StockTrader.isOn() ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
        CA.StockTrader.toggle();
        break;
      case 'sell-all-stocks':
        CA.Util.sound('snd/clickOff2.mp3');
        CA.StockTrader.sellAll();
        break;
      case 'all-on':
        CA.Util.sound('snd/clickOn2.mp3');
        CA.Autoclickers.setAll(true);
        break;
      case 'all-off':
        CA.Util.sound('snd/clickOff2.mp3');
        CA.Autoclickers.setAll(false);
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
    }
  }

  function onBound(combo, displaced) {
    CA.Util.sound('snd/tick.mp3');
    if (combo && displaced.length) {
      const names = displaced.map((id) => (CA.Actions.get(id) || { name: id }).name).join(', ');
      CA.Util.notify('Hotkey moved', `<b>${CA.Hotkeys.format(combo)}</b> was removed from: ${C.esc(names)}`, CA.ICON, 3);
    }
  }

  // ---- wiring ----------------------------------------------------------------------

  function init() {
    CA.Actions.register({ id: 'panel.toggle', name: 'Open / close panel', group: 'general', defaultKey: '', run: toggle });
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
    CA.Events.on('clickers', refresh);
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

  return { init, open, close, toggle, isOpen, openPage, render, sync };
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

const mod = {
  init() {
    const hadLegacy = removeLegacyBookmarklet();

    // data backbone first: the event log and states must exist before the recorder's first tick
    CA.EventLog.init();
    CA.Autoclickers.init();
    CA.Stocks.init();
    CA.StockTrader.init();
    CA.StockLog.init();
    CA.History.init();
    CA.GameStates.init();
    CA.Recorder.init();
    CA.UI.Graphs.init();
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
    const fromSave = CA.Settings.deserialize(str);
    // Prefer our own localStorage mirror when we have one — it's updated the moment anything
    // changes, while the game's save can be up to 60s stale or skipped by a quick reload.
    const fromLocal = CA.Settings.restoreFromLocal();
    const data = fromLocal || fromSave;
    if (data && CA.Settings.get('rememberStates')) {
      if (data.clickers) CA.Autoclickers.restore(data.clickers);
      if (typeof data.stockTrader === 'boolean') CA.StockTrader.set(data.stockTrader, { silent: true });
    }
  },
};

function register() {
  Game.registerMod(CA.ID, mod);
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
