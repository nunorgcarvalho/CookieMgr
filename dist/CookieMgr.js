/*! CookieMgr v0.3.0 */
(function () {
'use strict';
const CA = {};
CA.VERSION = "0.3.0";
CA.CSS = "/* ==========================================================================\n   CookieMgr — styles\n   Colours and borders borrow from the game's own \"framed\" look so the panel\n   feels native. Everything is scoped under #CookieMgrTab / #CookieMgrMenu.\n   ========================================================================== */\n\n/* ---------- Side tab (sticks out of the left beam) ---------- */\n\n#CookieMgrTab {\n  position: absolute;\n  left: 30%;\n  top: 128px;\n  margin-left: 3px; /* tuck slightly under the beam */\n  transform: translateX(-100%);\n  z-index: 110;\n  box-sizing: border-box;\n  width: 30px;\n  padding: 10px 0 12px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  cursor: pointer;\n  user-select: none;\n  background: linear-gradient(to right, #3d2716, #221409);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-right: none;\n  border-radius: 10px 0 0 10px;\n  box-shadow:\n    -3px 3px 10px rgba(0, 0, 0, 0.65),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.18);\n  transition:\n    width 0.15s ease-out,\n    background 0.2s,\n    box-shadow 0.2s;\n  outline: none;\n}\n#CookieMgrTab:hover,\n#CookieMgrTab:focus-visible {\n  width: 34px;\n  box-shadow:\n    -3px 3px 12px rgba(0, 0, 0, 0.75),\n    0 0 12px rgba(255, 215, 110, 0.35),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.25);\n}\n#CookieMgrTab.selected {\n  background: linear-gradient(to right, #7a4f22, #43290f);\n  box-shadow:\n    -3px 3px 12px rgba(0, 0, 0, 0.75),\n    0 0 14px rgba(255, 215, 110, 0.55),\n    inset 1px 1px 0 rgba(255, 255, 255, 0.3);\n}\n#CookieMgrTab .ca-tab-cookie {\n  width: 20px;\n  height: 20px;\n  background: url(img/perfectCookie.png) center / contain no-repeat;\n  filter: drop-shadow(0 1px 1px #000);\n  transition: transform 0.35s ease-out;\n}\n#CookieMgrTab:hover .ca-tab-cookie,\n#CookieMgrTab.selected .ca-tab-cookie {\n  transform: rotate(-30deg) scale(1.12);\n}\n#CookieMgrTab .ca-tab-label {\n  writing-mode: vertical-rl;\n  transform: rotate(180deg);\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 13px;\n  letter-spacing: 1px;\n  color: #f4e6c3;\n  text-shadow:\n    0 1px 2px #000,\n    0 0 6px rgba(255, 200, 120, 0.25);\n  white-space: nowrap;\n}\n#CookieMgrTab .ca-tab-badge {\n  display: none;\n  min-width: 16px;\n  height: 16px;\n  padding: 0 3px;\n  box-sizing: border-box;\n  border-radius: 8px;\n  font:\n    bold 10px/16px Tahoma,\n    Arial,\n    sans-serif;\n  text-align: center;\n  color: #fff;\n  background: linear-gradient(#63c64a, #2f7d24);\n  box-shadow:\n    0 0 6px rgba(120, 240, 100, 0.8),\n    0 1px 1px #000;\n  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.6);\n}\n#CookieMgrTab.active .ca-tab-badge {\n  display: block;\n  animation: caBadgeGlow 2s infinite ease-in-out;\n}\n@keyframes caBadgeGlow {\n  0%,\n  100% {\n    box-shadow:\n      0 0 4px rgba(120, 240, 100, 0.6),\n      0 1px 1px #000;\n  }\n  50% {\n    box-shadow:\n      0 0 10px rgba(120, 240, 100, 1),\n      0 1px 1px #000;\n  }\n}\n#game.ascending #CookieMgrTab,\n#game.ascendIntro #CookieMgrTab,\n#game.reincarnating #CookieMgrTab {\n  display: none;\n}\n\n/* ---------- Panel ---------- */\n\n#CookieMgrMenu {\n  max-width: 780px;\n  margin: 0 auto;\n  padding: 0 12px 120px;\n  color: #ddd;\n}\n#CookieMgrMenu .ca-tagline {\n  text-align: center;\n  margin: -6px 0 14px;\n  font-size: 12px;\n  font-style: italic;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n}\n\n/* Cards */\n#CookieMgrMenu .ca-card {\n  margin: 14px 4px;\n  border-radius: 6px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  background: rgba(0, 0, 0, 0.38);\n  box-shadow:\n    0 0 1px #000,\n    inset 0 0 1px #000,\n    0 6px 16px rgba(0, 0, 0, 0.35);\n  overflow: hidden;\n}\n#CookieMgrMenu .ca-card-head {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 10px;\n  padding: 9px 14px;\n  background: linear-gradient(to right, rgba(255, 235, 190, 0.09), rgba(255, 235, 190, 0));\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-card-title {\n  flex: 1;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-size: 20px;\n  color: #fff;\n  text-shadow:\n    0 -1px 5px rgba(255, 255, 200, 0.35),\n    0 1px 3px #000;\n}\n#CookieMgrMenu .ca-pill {\n  font-size: 11px;\n  white-space: nowrap;\n  padding: 3px 10px;\n  border-radius: 10px;\n  color: #bbb;\n  background: rgba(255, 255, 255, 0.07);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  transition: all 0.2s;\n}\n#CookieMgrMenu .ca-pill.on {\n  color: #cfc;\n  background: rgba(80, 200, 90, 0.16);\n  border-color: rgba(130, 235, 120, 0.5);\n}\n\n/* Rows */\n#CookieMgrMenu .ca-row {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px 12px;\n  padding: 8px 14px;\n  border-top: 1px solid rgba(255, 255, 255, 0.05);\n  transition: background 0.2s;\n}\n#CookieMgrMenu .ca-list .ca-row:first-child {\n  border-top: none;\n}\n#CookieMgrMenu .ca-row:hover {\n  background: rgba(255, 255, 255, 0.035);\n}\n#CookieMgrMenu .ca-row.on {\n  background: linear-gradient(to right, rgba(255, 210, 90, 0.12), rgba(255, 210, 90, 0) 65%);\n}\n#CookieMgrMenu .ca-row-master {\n  background: rgba(0, 0, 0, 0.22);\n  border-top: none;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-row-option {\n  padding-top: 10px;\n  padding-bottom: 10px;\n}\n#CookieMgrMenu .ca-row-text {\n  flex: 1 1 160px;\n  min-width: 0;\n}\n#CookieMgrMenu .ca-row-option {\n  flex-wrap: nowrap;\n}\n#CookieMgrMenu .ca-row-option .ca-row-text {\n  flex-basis: 0;\n}\n#CookieMgrMenu .ca-controls {\n  flex: 0 1 auto;\n  max-width: 100%;\n  margin-left: auto;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n}\n#CookieMgrMenu .ca-row-name {\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 14px;\n  color: #f2ead2;\n  text-shadow: 0 1px 2px #000;\n}\n#CookieMgrMenu .ca-row-desc {\n  margin-top: 2px;\n  font-size: 11px;\n  color: #b3a590;\n  text-shadow: 0 1px 1px #000;\n}\n\n/* Icons */\n#CookieMgrMenu .ca-icon {\n  flex: 0 0 36px;\n  width: 36px;\n  height: 36px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition:\n    filter 0.25s,\n    transform 0.25s;\n  filter: grayscale(0.55) brightness(0.8);\n}\n#CookieMgrMenu .ca-row.on .ca-icon,\n#CookieMgrMenu .ca-row-master .ca-icon {\n  filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.75));\n}\n#CookieMgrMenu .ca-row.on .ca-icon {\n  transform: scale(1.06);\n}\n#CookieMgrMenu .ca-img {\n  width: 36px;\n  height: 36px;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}\n#CookieMgrMenu .ca-sprite {\n  flex: none;\n  width: 48px;\n  height: 48px;\n  background-image: url(img/icons.png);\n  transform: scale(0.75);\n}\n\n/* Toggle switch */\n#CookieMgrMenu .ca-switch {\n  flex: none;\n  padding: 2px;\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n#CookieMgrMenu .ca-switch:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-switch-track {\n  display: block;\n  position: relative;\n  width: 42px;\n  height: 22px;\n  box-sizing: border-box;\n  border-radius: 11px;\n  background: #2a211c;\n  border: 1px solid rgba(255, 255, 255, 0.22);\n  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.75);\n  transition:\n    background 0.2s,\n    border-color 0.2s,\n    box-shadow 0.2s;\n}\n#CookieMgrMenu .ca-switch-knob {\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 35% 30%, #fff, #c9c1b5 55%, #8a8178);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);\n  transition: left 0.18s ease-out;\n}\n#CookieMgrMenu .ca-switch:hover .ca-switch-track {\n  border-color: rgba(255, 225, 150, 0.6);\n}\n#CookieMgrMenu .ca-switch.on .ca-switch-track {\n  background: linear-gradient(#66c84b, #2f7d24);\n  border-color: #a5ea93;\n  box-shadow:\n    inset 0 1px 3px rgba(0, 0, 0, 0.35),\n    0 0 9px rgba(110, 230, 90, 0.45);\n}\n#CookieMgrMenu .ca-switch.on .ca-switch-knob {\n  left: 22px;\n}\n#CookieMgrMenu .ca-switch:focus-visible .ca-switch-track {\n  outline: 2px solid #ffd76a;\n  outline-offset: 2px;\n}\n\n/* Hotkey chips */\n#CookieMgrMenu .ca-hotkey {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n}\n#CookieMgrMenu .ca-key {\n  min-width: 46px;\n  height: 26px;\n  padding: 0 10px;\n  font:\n    bold 12px Tahoma,\n    Arial,\n    sans-serif;\n  color: #f4e6c3;\n  text-shadow: 0 1px 1px #000;\n  background: linear-gradient(#4d3c2d, #2a2018);\n  border: 1px solid;\n  border-color: #9a7d5b #3b2c1f #2a1f15 #74604a;\n  border-radius: 5px;\n  box-shadow:\n    0 2px 0 #140d08,\n    inset 0 1px 0 rgba(255, 255, 255, 0.16);\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    border-color 0.15s,\n    box-shadow 0.15s;\n}\n#CookieMgrMenu .ca-key:hover {\n  color: #fff;\n  border-color: #e0c08a #5a4430 #3d2e20 #b39468;\n}\n#CookieMgrMenu .ca-key:active {\n  transform: translateY(1px);\n  box-shadow:\n    0 1px 0 #140d08,\n    inset 0 1px 0 rgba(255, 255, 255, 0.16);\n}\n#CookieMgrMenu .ca-key:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-hotkey.unset .ca-key {\n  color: #8f877a;\n  font-weight: normal;\n  font-style: italic;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px dashed rgba(255, 255, 255, 0.22);\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-hotkey.capturing .ca-key {\n  color: #ffe9a6;\n  border-color: #ffd76a;\n  animation: caCapture 1.1s infinite ease-in-out;\n}\n@keyframes caCapture {\n  0%,\n  100% {\n    box-shadow:\n      0 2px 0 #140d08,\n      0 0 0 0 rgba(255, 215, 106, 0.5);\n  }\n  50% {\n    box-shadow:\n      0 2px 0 #140d08,\n      0 0 12px 2px rgba(255, 215, 106, 0.55);\n  }\n}\n#CookieMgrMenu .ca-key-clear {\n  width: 18px;\n  height: 18px;\n  margin-left: 3px;\n  padding: 0;\n  border: none;\n  border-radius: 50%;\n  background: transparent;\n  color: #b09a8a;\n  font-size: 14px;\n  line-height: 18px;\n  cursor: pointer;\n  opacity: 0;\n  transition:\n    opacity 0.15s,\n    background 0.15s;\n}\n#CookieMgrMenu .ca-row:hover .ca-key-clear {\n  opacity: 0.8;\n}\n#CookieMgrMenu .ca-key-clear:hover {\n  color: #fff;\n  background: rgba(255, 80, 80, 0.35);\n}\n#CookieMgrMenu .ca-hotkey.unset .ca-key-clear,\n#CookieMgrMenu .ca-hotkey.capturing .ca-key-clear {\n  visibility: hidden;\n}\n\n/* Buttons */\n#CookieMgrMenu .ca-btn {\n  padding: 4px 12px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 12px;\n  color: #ddd;\n  text-shadow: 0 1px 1px #000;\n  background: linear-gradient(#3e2f23, #1d140f);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 4px;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    inset 0 1px 0 rgba(255, 255, 255, 0.12);\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    box-shadow 0.15s,\n    opacity 0.15s;\n}\n#CookieMgrMenu .ca-btn:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-btn:not(:disabled):hover {\n  color: #fff;\n  box-shadow:\n    0 1px 3px rgba(0, 0, 0, 0.6),\n    0 0 9px rgba(255, 220, 120, 0.35),\n    inset 0 1px 0 rgba(255, 255, 255, 0.18);\n}\n#CookieMgrMenu .ca-btn:not(:disabled):active {\n  transform: translateY(1px);\n}\n#CookieMgrMenu .ca-btn-on:not(:disabled):hover {\n  color: #d6ffcc;\n}\n#CookieMgrMenu .ca-btn-off:not(:disabled):hover {\n  color: #ffd2cc;\n}\n#CookieMgrMenu .ca-btn:disabled {\n  opacity: 0.38;\n  cursor: default;\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-btn-small {\n  font-size: 11px;\n  padding: 3px 10px;\n}\n\n/* Footer */\n#CookieMgrMenu .ca-footer {\n  margin: 18px 8px 0;\n  font-size: 11px;\n  line-height: 1.7;\n  text-align: center;\n  color: #9b907f;\n  text-shadow: 0 1px 1px #000;\n}\n#CookieMgrMenu .ca-footer b {\n  color: #c9bba3;\n}\n#CookieMgrMenu kbd {\n  display: inline-block;\n  padding: 0 5px;\n  font:\n    bold 10px/16px Tahoma,\n    Arial,\n    sans-serif;\n  color: #e8dcc2;\n  background: #2a2018;\n  border: 1px solid #5a4632;\n  border-radius: 3px;\n  box-shadow: 0 1px 0 #140d08;\n}\n#CookieMgrMenu .ca-footer-actions {\n  margin-top: 8px;\n}\n\n/* ---------- Tab row ---------- */\n\n#CookieMgrMenu .ca-tabs {\n  display: flex;\n  gap: 4px;\n  margin: 4px 4px 0;\n  padding: 0 6px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.14);\n}\n#CookieMgrMenu .ca-tabbtn {\n  position: relative;\n  margin-bottom: -1px;\n  padding: 7px 16px 8px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 14px;\n  color: #b9ab93;\n  text-shadow: 0 1px 2px #000;\n  background: linear-gradient(rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.25));\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.14);\n  border-radius: 6px 6px 0 0;\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    background 0.15s;\n}\n#CookieMgrMenu .ca-tabbtn:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-tabbtn:hover {\n  color: #fff;\n  background: linear-gradient(rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.2));\n}\n#CookieMgrMenu .ca-tabbtn.on {\n  color: #ffeab0;\n  background: linear-gradient(#5a3d1e, #2b1c0d);\n  border-color: #b98a4e #7a5630 rgba(0, 0, 0, 0) #b98a4e;\n  border-bottom-color: #2b1c0d;\n  box-shadow: 0 -2px 10px rgba(255, 200, 110, 0.18);\n}\n#CookieMgrMenu .ca-page {\n  animation: caFade 0.18s ease-out;\n}\n@keyframes caFade {\n  from {\n    opacity: 0;\n    transform: translateY(3px);\n  }\n  to {\n    opacity: 1;\n    transform: none;\n  }\n}\n#CookieMgrMenu a {\n  color: #ffd98a;\n}\n\n/* ---------- Graph ---------- */\n\n#CookieMgrMenu .ca-live {\n  font-size: 11px;\n  padding: 3px 10px 3px 20px;\n  position: relative;\n  border-radius: 10px;\n  color: #cfc;\n  background: rgba(80, 200, 90, 0.16);\n  border: 1px solid rgba(130, 235, 120, 0.5);\n}\n#CookieMgrMenu .ca-live:before {\n  content: '';\n  position: absolute;\n  left: 8px;\n  top: 50%;\n  width: 6px;\n  height: 6px;\n  margin-top: -3px;\n  border-radius: 50%;\n  background: #7be07b;\n  box-shadow: 0 0 6px #7be07b;\n  animation: caBadgeGlow 1.6s infinite ease-in-out;\n}\n#CookieMgrMenu .ca-live.paused {\n  color: #ffd9a0;\n  background: rgba(255, 170, 60, 0.14);\n  border-color: rgba(255, 190, 100, 0.5);\n}\n#CookieMgrMenu .ca-live.paused:before {\n  background: #ffb45c;\n  box-shadow: none;\n  animation: none;\n}\n\n#CookieMgrMenu .ca-stats {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));\n  gap: 1px;\n  background: rgba(255, 255, 255, 0.06);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-stat {\n  padding: 8px 12px;\n  background: rgba(0, 0, 0, 0.32);\n}\n#CookieMgrMenu .ca-stat-label {\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #a89a83;\n}\n#CookieMgrMenu .ca-stat-value {\n  margin-top: 2px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 17px;\n  color: #ffeab0;\n  text-shadow: 0 1px 3px #000;\n  white-space: nowrap;\n}\n#CookieMgrMenu .ca-stat-sub {\n  margin-top: 1px;\n  font-size: 10px;\n  color: #93866f;\n  white-space: nowrap;\n}\n\n#CookieMgrMenu .ca-toolbar {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px 12px;\n  padding: 8px 12px;\n}\n#CookieMgrMenu .ca-toolbar-bottom {\n  padding-top: 6px;\n}\n#CookieMgrMenu .ca-chipgroup {\n  display: inline-flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 4px;\n}\n#CookieMgrMenu .ca-chip-label {\n  margin-right: 2px;\n  font-size: 10px;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #93866f;\n}\n#CookieMgrMenu .ca-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  padding: 3px 9px;\n  font:\n    bold 11px Tahoma,\n    Arial,\n    sans-serif;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.14);\n  border-radius: 11px;\n  cursor: pointer;\n  transition:\n    color 0.15s,\n    background 0.15s,\n    border-color 0.15s;\n}\n#CookieMgrMenu .ca-chip:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-chip:hover {\n  color: #fff;\n  border-color: rgba(255, 225, 150, 0.5);\n}\n#CookieMgrMenu .ca-chip.on {\n  color: #fff3cf;\n  background: rgba(255, 200, 100, 0.18);\n  border-color: rgba(255, 210, 120, 0.6);\n}\n#CookieMgrMenu .ca-chip-series:not(.on) .ca-sw {\n  opacity: 0.3;\n}\n#CookieMgrMenu .ca-sw {\n  display: inline-block;\n  width: 9px;\n  height: 9px;\n  margin-right: 1px;\n  border-radius: 50%;\n  vertical-align: -1px;\n  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55);\n}\n\n#CookieMgrMenu .ca-graph-wrap {\n  position: relative;\n  margin: 0 8px;\n}\n#CookieMgrMenu canvas.ca-graph {\n  display: block;\n  width: 100%;\n  height: 300px;\n  cursor: crosshair;\n}\n#CookieMgrMenu canvas.ca-graph.ca-graph-small {\n  height: 160px;\n}\n#CookieMgrMenu .ca-tip {\n  display: none;\n  position: absolute;\n  z-index: 5;\n  max-width: 270px;\n  min-width: 150px;\n  padding: 7px 10px;\n  pointer-events: none;\n  font-size: 11px;\n  line-height: 1.35;\n  color: #e6dcc6;\n  background: rgba(14, 10, 6, 0.95);\n  border: 1px solid;\n  border-color: #b98a4e #6a4626 #55301c #a0764a;\n  border-radius: 5px;\n  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);\n}\n#CookieMgrMenu .ca-tip-head {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-bottom: 4px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 12px;\n  color: #ffeab0;\n}\n#CookieMgrMenu .ca-tip-head span {\n  margin-left: auto;\n  padding-left: 10px;\n  font:\n    normal 10px Tahoma,\n    Arial,\n    sans-serif;\n  color: #a89a83;\n}\n#CookieMgrMenu .ca-tip-row {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 1px 0;\n}\n#CookieMgrMenu .ca-tip-row b {\n  font-weight: normal;\n  color: #b9ab93;\n}\n#CookieMgrMenu .ca-tip-row span {\n  margin-left: auto;\n  padding-left: 12px;\n  text-align: right;\n  color: #f2ead2;\n}\n#CookieMgrMenu .ca-tip-row.strong b,\n#CookieMgrMenu .ca-tip-row.strong span {\n  color: #fff3cf;\n  font-weight: bold;\n}\n#CookieMgrMenu .ca-tip-sep {\n  height: 1px;\n  margin: 5px 0;\n  background: rgba(255, 255, 255, 0.14);\n}\n#CookieMgrMenu .ca-tip-note {\n  margin: 2px 0 4px;\n  font-style: italic;\n  color: #a89a83;\n}\n\n#CookieMgrMenu .ca-legend {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px 12px;\n  min-height: 16px;\n  padding: 2px 14px 12px;\n  font-size: 11px;\n  color: #b9ab93;\n}\n#CookieMgrMenu .ca-legend-item em {\n  font-style: normal;\n  color: #93866f;\n}\n#CookieMgrMenu .ca-legend-empty {\n  font-style: italic;\n  color: #7f735f;\n}\n\n#CookieMgrMenu .ca-hidden {\n  display: none;\n}\n";

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
    if (options.rememberStates && CA.Autoclickers) data.clickers = CA.Autoclickers.snapshot();
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

  return { defineOption, optionsIn, get, set, getHotkey, setHotkey, actionForCombo, resetHotkeys, serialize, deserialize };
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
      group: 'autoclickers',
      name: 'Turn off when ascending',
      desc: 'Switches every autoclicker off as soon as you ascend.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'rememberStates',
      group: 'autoclickers',
      name: 'Remember on/off states',
      desc: 'Restores which autoclickers were running when you reload the game.',
      default: false,
    });
    CA.Settings.defineOption({
      key: 'notifications',
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

  let timer = null;
  let sampleTimer = null;

  const minigame = () => {
    const bank = typeof Game !== 'undefined' && Game.Objects && Game.Objects.Bank;
    const m = bank && bank.minigame;
    return m && m.goodsById ? m : null;
  };

  // ---- price history --------------------------------------------------------------
  // Session-only, one sample per second per stock, same rolling window as CA.History
  // so the price graph can cover the same time range as the CpS graph.

  const SAMPLE_MS = 1000;
  const MAX_SAMPLES = 4 * 3600; // 4 hours
  const priceHistory = {}; // good.id -> [{ t, v }]

  const priceOf = (good) => (typeof good.val === 'number' ? good.val : 0);

  // ---- portfolio (cost basis + realized/unrealized gain) ---------------------------
  // The game only shows you the current price and share count, not what you paid for
  // them, so we watch `good.stock` ourselves: any increase is a buy at the current price
  // (rolled into a running average cost), any decrease is a sell that realizes the gap
  // between that average cost and the current price. Session-only, same as price history —
  // there is no way to know what happened before the mod was loaded.
  const holdings = {}; // good.id -> { shares, avgCost, realized }
  const portfolioHistory = []; // [{ t, value, cost, unrealized, realized, gain }]

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
    h.shares = shares;
    return h;
  }

  function sample() {
    const m = minigame();
    if (!m) return;
    const now = Date.now();
    let value = 0;
    let cost = 0;
    let realized = 0;
    m.goodsById.forEach((good) => {
      const arr = priceHistory[good.id] || (priceHistory[good.id] = []);
      const price = priceOf(good);
      arr.push({ t: now, v: price });
      if (arr.length > MAX_SAMPLES + 200) arr.splice(0, arr.length - MAX_SAMPLES);

      const h = updateHolding(good);
      value += h.shares * price;
      cost += h.shares * h.avgCost;
      realized += h.realized;
    });
    const unrealized = value - cost;
    portfolioHistory.push({ t: now, value, cost, unrealized, realized, gain: unrealized + realized });
    if (portfolioHistory.length > MAX_SAMPLES + 200) portfolioHistory.splice(0, portfolioHistory.length - MAX_SAMPLES);
  }

  /** Current totals plus a per-stock breakdown, for stat tiles / tooltips. */
  function portfolioNow() {
    const m = minigame();
    const rows = (m ? m.goodsById : []).map((good) => {
      const h = holdingOf(good.id);
      const price = priceOf(good);
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
    const last = portfolioHistory[portfolioHistory.length - 1];
    return {
      value: last ? last.value : 0,
      cost: last ? last.cost : 0,
      unrealized: last ? last.unrealized : 0,
      realized: last ? last.realized : 0,
      gain: last ? last.gain : 0,
      rows,
    };
  }

  /** Every stock, with its display name and whether you currently hold any. */
  function list() {
    const m = minigame();
    if (!m) return [];
    return m.goodsById.map((good) => ({ id: good.id, name: good.name, owned: good.stock > 0 }));
  }

  /** Recorded price samples for one stock (empty if never seen). */
  function history(id) {
    return priceHistory[id] || [];
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
      group: 'stocks',
      name: 'Stock market trend indicators',
      desc: 'Shows each stock’s trend (stable, rising, falling, chaotic) on its box in the Bank minigame.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'stockTint',
      group: 'stocks',
      name: 'Tint stock boxes',
      desc: 'Colours each stock box by its trend; boxes glow brighter while you hold that stock.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'stockGraphSync',
      group: 'stocks',
      name: 'Sync graph to owned stocks',
      desc: 'The per-stock price view only plots stocks you currently hold; turn off to show all of them.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'stockGraphMode',
      group: 'graph-select',
      name: 'Stock graph view',
      desc: '',
      default: 'portfolio', // 'portfolio' | 'perStock'
    });
    CA.Settings.defineOption({
      key: 'bankGraphEnabled',
      group: 'stocks',
      name: 'Graph in the Bank minigame',
      desc: 'Shows a small graph underneath the stock market itself, not just on the Graphs tab.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'bankGraphMode',
      group: 'graph-select',
      name: 'Bank graph view',
      desc: '',
      default: 'portfolio', // 'portfolio' | 'cps'
    });
    CA.Util.injectCss('CookieMgrStocksStyles', CSS);
    CA.Events.on('settings', refresh);
    timer = setInterval(refresh, TICK_MS);
    sampleTimer = setInterval(sample, SAMPLE_MS);
    refresh();
    sample();
  }

  return { init, refresh, MODES, list, history, portfolioNow, portfolioHistory: () => portfolioHistory, minigame };
})();

// ---- src/features/history.js -----------------------------------------
// Records what the bakery is doing over time so the graph has something to draw.
//
//   samples    once per second: displayed CPS, "unbuffed" CPS and measured click income
//   intervals  every buff/effect that was active, with start and end (they can overlap = stacking)
//   events     one-off things: golden cookie / reindeer pops (with their outcome) and ascensions
//
// Data lives in memory for the current session only.

CA.History = (() => {
  const SAMPLE_MS = 1000;
  const MAX_SAMPLES = 4 * 3600; // keep 4 hours
  const MAX_EVENTS = 500;
  const MAX_INTERVALS = 1500;
  const FPS = 30; // buff timers are counted in logic frames

  const samples = []; // { t, cps, base, click }
  const intervals = []; // { name, label, desc, icon, start, end|null, multCps, multClick, ... }
  const events = []; // { t, kind, title, text, gain }
  const open = {}; // buff name -> currently open interval
  let lastT = 0;
  let lastHandmade = null;
  let timer = null;

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

  function capArray(arr, max) {
    if (arr.length > max + 200) arr.splice(0, arr.length - max);
  }

  const inAscension = () => Game.OnAscend || Game.AscendTimer > 0;

  function closeInterval(iv, now) {
    iv.end = Math.min(now, iv.projEnd || now);
    delete open[iv.name];
  }

  function openInterval(b, now) {
    const elapsed = Math.max(0, ((b.maxTime || 0) - (b.time || 0)) / FPS) * 1000;
    const iv = {
      name: b.name,
      label: b.dname || b.name,
      desc: stripHtml(b.desc),
      icon: b.icon || [0, 0],
      start: now - Math.min(elapsed, SAMPLE_MS),
      end: null,
      projEnd: now + ((b.time || 0) / FPS) * 1000,
      duration: (b.maxTime || 0) / FPS,
      multCps: typeof b.multCpS === 'number' ? b.multCpS : 1,
      multClick: typeof b.multClick === 'number' ? b.multClick : 1,
      ref: b,
    };
    open[b.name] = iv;
    intervals.push(iv);
    capArray(intervals, MAX_INTERVALS);
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

  function addEvent(ev) {
    events.push({ t: Date.now(), ...ev });
    capArray(events, MAX_EVENTS);
    CA.Events.emit('history', 'event');
  }

  // ---- sampling -------------------------------------------------------------------

  function sample() {
    if (typeof Game === 'undefined' || !Game.ready) return;
    if (!CA.Settings.get('trackHistory')) return;
    const now = Date.now();

    if (inAscension()) {
      // nothing to measure while the ascension screen is up; start clean afterwards
      closeAll(now);
      lastHandmade = null;
      lastT = 0;
      return;
    }

    const dt = lastT ? (now - lastT) / 1000 : 0;
    const handmade = Game.handmadeCookies;
    let click = 0;
    if (lastHandmade !== null && dt > 0 && handmade >= lastHandmade) click = (handmade - lastHandmade) / dt;
    lastHandmade = handmade;
    lastT = now;

    const shown = 1 - (Game.cpsSucked || 0);
    samples.push({
      t: now,
      cps: Game.cookiesPs * shown,
      base: (Game.unbuffedCps || Game.cookiesPs) * shown,
      click,
    });
    capArray(samples, MAX_SAMPLES);
    trackBuffs(now);
    CA.Events.emit('history', 'sample');
  }

  // ---- one-off events -------------------------------------------------------------

  /** Wraps a shimmer type's popFunc so we can log what each pop actually did. */
  function watchShimmers() {
    if (!Game.shimmerTypes) return;
    const kinds = { golden: 'golden', reindeer: 'reindeer' };
    Object.keys(kinds).forEach((type) => {
      const st = Game.shimmerTypes[type];
      if (!st || typeof st.popFunc !== 'function') return;
      const original = st.popFunc;
      st.popFunc = function (me) {
        if (!CA.Settings.get('trackHistory')) return original.apply(this, arguments);
        const before = Game.cookies;
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
          const wrath = type === 'golden' && me && me.wrath;
          addEvent({
            kind: wrath ? 'wrath' : type,
            title: type === 'reindeer' ? 'Reindeer' : wrath ? 'Wrath cookie' : 'Golden cookie',
            text: texts.filter(Boolean).slice(0, 2).join(' — '),
            gain: Game.cookies - before,
          });
        } catch (e) {
          /* never break the game over a log entry */
        }
        return result;
      };
    });
  }

  // ---- queries ---------------------------------------------------------------------

  /** Index of the first sample with t >= time (binary search). */
  function lowerBound(time) {
    let lo = 0;
    let hi = samples.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].t < time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** Summary numbers for [t0, t1]. */
  function stats(t0, t1) {
    const from = lowerBound(t0);
    let n = 0;
    let sumCps = 0;
    let sumClick = 0;
    let peak = 0;
    let peakT = 0;
    for (let i = from; i < samples.length && samples[i].t <= t1; i++) {
      const s = samples[i];
      n++;
      sumCps += s.cps;
      sumClick += s.click;
      if (s.cps >= peak) {
        peak = s.cps;
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

  function clear() {
    samples.length = 0;
    intervals.length = 0;
    events.length = 0;
    Object.keys(open).forEach((k) => delete open[k]);
    lastT = 0;
    lastHandmade = null;
    CA.Events.emit('history', 'clear');
  }

  function init() {
    CA.Settings.defineOption({
      key: 'trackHistory',
      group: 'general',
      name: 'Record history',
      desc: 'Keeps a rolling 4-hour record of your CpS and active effects for the graphs.',
      default: true,
    });
    watchShimmers();
    CA.Events.on('ascend', () => {
      const now = Date.now();
      closeAll(now);
      addEvent({ kind: 'ascend', title: 'Ascended', text: 'A new run begins.', gain: 0 });
    });
    timer = setInterval(sample, SAMPLE_MS);
    sample();
  }

  return { init, samples, intervals, events, colorFor, lowerBound, stats, intervalsIn, clear, addEvent, sampleNow: sample };
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

  return { icon, toggle, hotkey, button, esc };
})();

// ---- src/ui/tab.js ---------------------------------------------------
// The little tab that sticks out of the left beam (between the cookie panel and the
// middle panel). Clicking it opens/closes the CookieMgr panel.

CA.UI = CA.UI || {};

CA.UI.Tab = (() => {
  let el = null;

  function create() {
    el = document.createElement('div');
    el.id = 'CookieMgrTab';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.title = 'CookieMgr';
    el.innerHTML =
      '<span class="ca-tab-cookie"></span>' +
      '<span class="ca-tab-label">CookieMgr</span>' +
      '<span class="ca-tab-badge" aria-label="active autoclickers"></span>';
    el.addEventListener('click', () => CA.UI.Menu.toggle());
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        CA.UI.Menu.toggle();
      }
    });
    (document.getElementById('game') || document.body).appendChild(el);
    update();
  }

  function update() {
    if (!el) return;
    el.classList.toggle('selected', CA.UI.Menu.isOpen());
    const n = CA.Autoclickers.activeCount();
    const badge = el.querySelector('.ca-tab-badge');
    badge.textContent = n ? String(n) : '';
    el.classList.toggle('active', n > 0);
    el.title = n ? `CookieMgr — ${n} autoclicker${n === 1 ? '' : 's'} running` : 'CookieMgr';
  }

  function init() {
    create();
    CA.Events.on('clickers', update);
  }

  return { init, update };
})();

// ---- src/ui/graph.js -------------------------------------------------
// The live CpS graph: a canvas line chart with shaded regions for active effects,
// event markers, and a hover tooltip. Data comes from CA.History; the view is driven by
// settings so the choices survive reloads.

CA.UI = CA.UI || {};

CA.UI.Graph = (() => {
  const WINDOWS = [
    { s: 60, label: '1m' },
    { s: 300, label: '5m' },
    { s: 900, label: '15m' },
    { s: 3600, label: '1h' },
    { s: 10800, label: '3h' },
  ];
  const SMOOTHING = [
    { s: 0, label: 'Raw' },
    { s: 5, label: '5s' },
    { s: 15, label: '15s' },
  ];
  const SERIES = {
    base: { color: '#9db4cc', name: 'Unbuffed CpS' },
    cps: { color: '#f5c451', name: 'Production' },
    total: { color: '#7fe08b', name: 'With clicking' },
  };
  const PAD = { r: 8, t: 10, b: 22 };
  const MIN_PAD_L = 30;
  const PAD_L_MARGIN = 10;
  const LANE_H = 8;
  const LANE_GAP = 2;
  const MAX_LANES = 6;
  const GAP_MS = 5000; // a longer hole between samples breaks the line

  let root = null;
  let canvas = null;
  let ctx = null;
  let tip = null;
  let observer = null;
  let timer = null;
  let hover = null; // { x, y } in css px
  let padL = 54; // dynamic left padding — last frame's width, refined each draw()
  let paused = false;
  let pausedAt = 0;
  let layout = null; // hit-test info from the last draw

  const S = () => CA.Settings;

  // ---- formatting ----------------------------------------------------------------

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
  // Defers to the game's own number formatter (handles Cookie Clicker's full illion naming —
  // octodecillion and beyond — and respects the player's own Numbers preference), so we never
  // have to maintain our own name list or cap out once CpS blows past our SUFFIX table.
  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : short(v));

  function two(n) {
    return n < 10 ? '0' + n : '' + n;
  }
  function clock(t, withSeconds) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}` + (withSeconds ? `:${two(d.getSeconds())}` : '');
  }
  function span(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${two(sec % 60)}s`;
    return `${Math.floor(sec / 3600)}h ${two(Math.floor((sec % 3600) / 60))}m`;
  }

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }

  // ---- data preparation ----------------------------------------------------------

  const windowMs = () => Math.max(10, S().get('graphWindow')) * 1000;
  const endTime = () => (paused ? pausedAt : Date.now());

  /** Rolling mean over the previous k samples (k <= 1 leaves the values alone). */
  function smooth(values, k) {
    if (k <= 1) return values;
    const out = new Array(values.length);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= k) sum -= values[i - k];
      out[i] = sum / Math.min(i + 1, k);
    }
    return out;
  }

  /** Splits into segments at gaps, then averages down to about one point per pixel. */
  function buildSegments(list, valueOf, t0, W, plotW) {
    const segs = [];
    let cur = [];
    for (let i = 0; i < list.length; i++) {
      if (i && list[i].t - list[i - 1].t > GAP_MS) {
        if (cur.length) segs.push(cur);
        cur = [];
      }
      cur.push({ t: list[i].t, v: valueOf(i) });
    }
    if (cur.length) segs.push(cur);
    if (list.length <= plotW * 1.5) return segs;
    return segs.map((seg) => {
      const buckets = new Map();
      seg.forEach((p) => {
        const key = Math.floor(((p.t - t0) / W) * plotW);
        const b = buckets.get(key) || { t: 0, v: 0, n: 0 };
        b.t += p.t;
        b.v += p.v;
        b.n++;
        buckets.set(key, b);
      });
      return [...buckets.values()].map((b) => ({ t: b.t / b.n, v: b.v / b.n }));
    });
  }

  function assignLanes(ivs, now) {
    const sorted = ivs.slice().sort((a, b) => a.start - b.start);
    const ends = [];
    const lanes = new Map();
    sorted.forEach((iv) => {
      let lane = ends.findIndex((e) => e <= iv.start);
      if (lane === -1) lane = ends.length;
      ends[lane] = iv.end || now;
      lanes.set(iv, lane);
    });
    return { lanes, count: ends.length };
  }

  // ---- drawing -------------------------------------------------------------------

  function fitCanvas() {
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

  function draw() {
    if (!canvas || !canvas.isConnected) return;
    const { w, h } = fitCanvas();
    if (w < 50 || h < 50) return;
    ctx.clearRect(0, 0, w, h);

    const W = windowMs();
    const t1 = endTime();
    const t0 = t1 - W;
    const now = Date.now();
    let plot = { x: padL, y: PAD.t, w: w - padL - PAD.r, h: h - PAD.t - PAD.b };
    let xOf = (t) => plot.x + ((t - t0) / W) * plot.w;

    const showEffects = S().get('graphEffects');
    const ivs = showEffects ? CA.History.intervalsIn(t0, t1) : [];
    const laneInfo = assignLanes(ivs, now);
    const laneCount = Math.min(MAX_LANES, laneInfo.count);
    const lanesH = laneCount ? laneCount * (LANE_H + LANE_GAP) + 2 : 0;
    const lanesTop = plot.y + plot.h - lanesH;
    const chartH = plot.h - lanesH - (laneCount ? 4 : 0); // vertical room for the lines

    // --- visible samples (one extra before/after so lines reach the edges)
    const all = CA.History.samples;
    const smoothK = Math.max(1, S().get('graphSmooth'));
    const lo = Math.max(0, CA.History.lowerBound(t0) - 1 - smoothK);
    let hi = CA.History.lowerBound(t1);
    hi = Math.min(all.length, hi + 1);
    const list = all.slice(lo, hi);
    const visStart = list.findIndex((s) => s.t >= t0 - 1000);
    const cutoff = visStart === -1 ? list.length : visStart;

    const want = {
      base: S().get('graphShowBase'),
      cps: S().get('graphShowCps'),
      total: S().get('graphShowTotal'),
    };
    const raw = {
      base: list.map((s) => s.base),
      cps: list.map((s) => s.cps),
      total: list.map((s) => s.cps + s.click),
    };
    const series = {};
    Object.keys(want).forEach((k) => {
      if (!want[k]) return;
      const vals = smooth(raw[k], smoothK);
      series[k] = buildSegments(list.slice(cutoff), (i) => vals[i + cutoff], t0, W, plot.w);
    });

    // --- y scale
    const log = S().get('graphLog');
    let maxV = 0;
    let minPos = Infinity;
    Object.values(series).forEach((segs) =>
      segs.forEach((seg) =>
        seg.forEach((p) => {
          if (p.v > maxV) maxV = p.v;
          if (p.v > 0 && p.v < minPos) minPos = p.v;
        })
      )
    );
    let yMin = 0;
    let yMax = 1;
    let ticks = [];
    if (log) {
      if (!isFinite(minPos)) minPos = 1;
      if (maxV <= 0) maxV = 10;
      yMin = Math.pow(10, Math.floor(Math.log10(minPos)));
      yMax = Math.pow(10, Math.ceil(Math.log10(maxV * 1.02)));
      if (yMax / yMin < 10) yMax = yMin * 10;
      for (let v = yMin; v <= yMax * 1.0001; v *= 10) ticks.push(v);
      while (ticks.length > 7) ticks = ticks.filter((_, i) => i % 2 === 0);
    } else {
      yMax = maxV > 0 ? maxV * 1.08 : 10;
      const step = niceStep(yMax / 4);
      yMax = Math.ceil(yMax / step) * step;
      for (let v = 0; v <= yMax * 1.0001; v += step) ticks.push(v);
    }

    // Left padding fits whatever these tick labels actually render as (long-form Numbers
    // preferences, decillion+ names, ...) instead of a fixed guess that clips them.
    const tickLabels = ticks.map((v) => beautify(v, 0));
    const labelW = CA.Util.maxTextWidth(ctx, '10px Tahoma, Arial, sans-serif', tickLabels);
    padL = Math.max(MIN_PAD_L, Math.round(labelW) + PAD_L_MARGIN);
    plot = { x: padL, y: PAD.t, w: w - padL - PAD.r, h: h - PAD.t - PAD.b };
    xOf = (t) => plot.x + ((t - t0) / W) * plot.w;

    const yOf = (v) => {
      let f;
      if (log) f = (Math.log10(Math.max(v, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin));
      else f = (v - yMin) / (yMax - yMin);
      return plot.y + chartH - Math.max(0, Math.min(1, f)) * chartH;
    };

    // --- background
    const bg = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
    bg.addColorStop(0, 'rgba(255,255,255,0.045)');
    bg.addColorStop(1, 'rgba(255,255,255,0.01)');
    ctx.fillStyle = bg;
    ctx.fillRect(plot.x, plot.y, plot.w, plot.h);

    // --- effect shading (overlaps simply add up, which is how stacking shows)
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    const hoverIv = layout && layout.hoverIv;
    ivs.forEach((iv) => {
      const x0 = Math.max(plot.x, xOf(iv.start));
      const x1 = Math.min(plot.x + plot.w, xOf(iv.end || now));
      if (x1 <= x0) return;
      ctx.globalAlpha = iv === hoverIv ? 0.3 : 0.13;
      ctx.fillStyle = CA.History.colorFor(iv.name);
      ctx.fillRect(x0, plot.y, x1 - x0, plot.h);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // --- grid + y labels
    ctx.font = '10px Tahoma, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;
    ticks.forEach((v) => {
      const y = Math.round(yOf(v)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,220,200,0.75)';
      ctx.fillText(beautify(v, 0), plot.x - 6, y);
    });

    // --- x grid + labels (aligned to wall-clock time so labels stay put while scrolling)
    const steps = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200].map((x) => x * 1000);
    const stepMs = steps.find((s) => W / s <= Math.max(3, Math.floor(plot.w / 78))) || steps[steps.length - 1];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const tz = new Date(t0).getTimezoneOffset() * 60000;
    for (let t = Math.ceil((t0 - tz) / stepMs) * stepMs + tz; t <= t1; t += stepMs) {
      const x = Math.round(xOf(t)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.h);
      ctx.stroke();
      if (x > plot.x + 16 && x < plot.x + plot.w - 16) {
        ctx.fillStyle = 'rgba(230,220,200,0.7)';
        ctx.fillText(clock(t, stepMs < 60000), x, plot.y + plot.h + 7);
      }
    }

    // --- lines
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y - 4, plot.w, chartH + 8);
    ctx.clip();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const trace = (segs, close) => {
      segs.forEach((seg) => {
        if (!seg.length) return;
        ctx.beginPath();
        seg.forEach((p, i) => (i ? ctx.lineTo(xOf(p.t), yOf(p.v)) : ctx.moveTo(xOf(p.t), yOf(p.v))));
        if (seg.length === 1) ctx.lineTo(xOf(seg[0].t) + 0.01, yOf(seg[0].v));
        if (close) {
          ctx.lineTo(xOf(seg[seg.length - 1].t), plot.y + chartH);
          ctx.lineTo(xOf(seg[0].t), plot.y + chartH);
          ctx.closePath();
        }
      });
    };
    const strokeSeries = (key, width, dash) => {
      const segs = series[key];
      if (!segs) return;
      ctx.strokeStyle = SERIES[key].color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash || []);
      segs.forEach((seg) => {
        trace([seg], false);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    };
    // fill under the main visible series
    const fillKey = series.cps ? 'cps' : series.total ? 'total' : series.base ? 'base' : null;
    if (fillKey) {
      const grad = ctx.createLinearGradient(0, plot.y, 0, plot.y + chartH);
      grad.addColorStop(0, hexToRgba(SERIES[fillKey].color, 0.3));
      grad.addColorStop(1, hexToRgba(SERIES[fillKey].color, 0.02));
      ctx.fillStyle = grad;
      series[fillKey].forEach((seg) => {
        trace([seg], true);
        ctx.fill();
      });
    }
    strokeSeries('base', 1.4, [4, 3]);
    strokeSeries('total', 1.6);
    strokeSeries('cps', 2);
    ctx.restore();

    // --- effect lanes
    const laneRects = [];
    ivs.forEach((iv) => {
      const lane = laneInfo.lanes.get(iv);
      if (lane >= MAX_LANES) return;
      const x0 = Math.max(plot.x, xOf(iv.start));
      const x1 = Math.min(plot.x + plot.w, xOf(iv.end || now));
      if (x1 <= x0) return;
      const y = lanesTop + 2 + lane * (LANE_H + LANE_GAP);
      const color = CA.History.colorFor(iv.name);
      ctx.fillStyle = color;
      ctx.globalAlpha = iv === hoverIv ? 1 : 0.85;
      roundRect(ctx, x0, y, Math.max(2, x1 - x0), LANE_H, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (x1 - x0 > 46) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, y, x1 - x0, LANE_H);
        ctx.clip();
        ctx.font = 'bold 8px Tahoma, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillText(iv.label, x0 + 4, y + LANE_H / 2 + 0.5);
        ctx.restore();
      }
      laneRects.push({ iv, x0, x1, y, y1: y + LANE_H });
    });

    // --- events (ascension lines, golden/reindeer markers)
    const evRects = [];
    if (S().get('graphEvents')) {
      CA.History.events.forEach((ev) => {
        if (ev.t < t0 || ev.t > t1) return;
        const x = xOf(ev.t);
        if (ev.kind === 'ascend') {
          ctx.strokeStyle = 'rgba(200,190,255,0.7)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(Math.round(x) + 0.5, plot.y);
          ctx.lineTo(Math.round(x) + 0.5, plot.y + plot.h);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const y = plot.y + 7;
        ctx.fillStyle = eventColor(ev.kind);
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
        evRects.push({ ev, x, y });
      });
    }

    layout = { plot, xOf, yOf, t0, t1, laneRects, evRects, hoverIv: null, series, chartH };

    // --- hover
    if (hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) {
      drawHover(w, h, plot, t0, W, laneRects, evRects, list);
    } else if (tip) {
      tip.style.display = 'none';
    }

    // --- empty state
    if (!list.length) {
      ctx.fillStyle = 'rgba(230,220,200,0.6)';
      ctx.font = '12px Tahoma, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        S().get('trackHistory') ? 'Collecting data…' : 'History recording is off (Settings tab)',
        plot.x + plot.w / 2,
        plot.y + plot.h / 2
      );
    }
  }

  function drawHover(w, h, plot, t0, W, laneRects, evRects, list) {
    const t = t0 + ((hover.x - plot.x) / plot.w) * W;
    // what is under the pointer?
    const hitEv = evRects.find((r) => Math.abs(r.x - hover.x) < 7 && Math.abs(r.y - hover.y) < 9);
    const hitLane = laneRects.find((r) => hover.x >= r.x0 && hover.x <= r.x1 && hover.y >= r.y - 1 && hover.y <= r.y1 + 1);
    layout.hoverIv = hitLane ? hitLane.iv : null;

    // crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(hover.x) + 0.5, plot.y);
    ctx.lineTo(Math.round(hover.x) + 0.5, plot.y + plot.h);
    ctx.stroke();

    // nearest sample
    const all = CA.History.samples;
    let idx = CA.History.lowerBound(t);
    if (idx > 0 && (idx >= all.length || t - all[idx - 1].t < all[idx].t - t)) idx--;
    const s = all[idx];
    const near = s && Math.abs(s.t - t) < Math.max(3000, W / 40) ? s : null;

    let html = '';
    if (hitEv) html = eventTip(hitEv.ev);
    else if (hitLane) html = intervalTip(hitLane.iv);
    else html = sampleTip(t, near);

    if (near && !hitEv && !hitLane) {
      const dots = [
        ['base', near.base],
        ['cps', near.cps],
        ['total', near.cps + near.click],
      ];
      dots.forEach(([k, v]) => {
        if (!layout.series[k]) return;
        ctx.fillStyle = SERIES[k].color;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.arc(layout.xOf(near.t), layout.yOf(v), 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }

    tip.innerHTML = html;
    tip.style.display = 'block';
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = hover.x + 16;
    if (left + tw > w - 4) left = hover.x - tw - 16;
    let top = hover.y + 12;
    if (top + th > h) top = Math.max(2, h - th - 2);
    tip.style.left = Math.max(2, left) + 'px';
    tip.style.top = top + 'px';
  }

  // ---- tooltips ------------------------------------------------------------------

  const esc = (s) => CA.Util.escapeHtml(s);
  const swatch = (c) => `<i class="ca-sw" style="background:${c}"></i>`;

  function activeAt(t) {
    const now = Date.now();
    return CA.History.intervals.filter((iv) => iv.start <= t && (iv.end || now) >= t);
  }

  function sampleTip(t, s) {
    const ago = (Date.now() - t) / 1000;
    let h = `<div class="ca-tip-head">${clock(t, true)}<span>${paused || ago > 1.5 ? span(ago) + ' ago' : 'now'}</span></div>`;
    if (s) {
      const total = s.cps + s.click;
      h += row(SERIES.cps.color, SERIES.cps.name, beautify(s.cps) + '/s');
      if (s.click > 0.01) h += row(SERIES.total.color, 'Clicking', '+' + beautify(s.click) + '/s');
      h += row(SERIES.total.color, 'Total', beautify(total) + '/s', true);
      if (Math.abs(s.base - s.cps) > 0.01) h += row(SERIES.base.color, 'Without effects', beautify(s.base) + '/s');
    } else {
      h += '<div class="ca-tip-note">No data here yet.</div>';
    }
    const act = activeAt(t);
    if (act.length) {
      h += '<div class="ca-tip-sep"></div>';
      act.forEach((iv) => {
        const left = Math.max(0, ((iv.end || Date.now()) - t) / 1000);
        h += row(CA.History.colorFor(iv.name), iv.label, mults(iv) + ' · ' + span(left) + ' left');
      });
    }
    return h;
  }

  function mults(iv) {
    const bits = [];
    if (Math.abs(iv.multCps - 1) > 0.001) bits.push(`×${trim(iv.multCps)} CpS`);
    if (Math.abs(iv.multClick - 1) > 0.001) bits.push(`×${trim(iv.multClick)} clicks`);
    return bits.length ? bits.join(', ') : 'no CpS change';
  }
  const trim = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 100) / 100);

  function row(color, name, value, strong) {
    return `<div class="ca-tip-row${strong ? ' strong' : ''}">${swatch(color)}<b>${esc(name)}</b><span>${esc(value)}</span></div>`;
  }

  function intervalTip(iv) {
    const now = Date.now();
    const end = iv.end || now;
    let h = `<div class="ca-tip-head">${swatch(CA.History.colorFor(iv.name))}${esc(iv.label)}<span>${iv.end ? '' : 'active'}</span></div>`;
    if (iv.desc) h += `<div class="ca-tip-note">${esc(iv.desc)}</div>`;
    h += row('transparent', 'Effect', mults(iv));
    h += row('transparent', 'Lasted', span((end - iv.start) / 1000) + (iv.end ? '' : ' so far'));
    h += row('transparent', 'Started', clock(iv.start, true));
    if (iv.end) h += row('transparent', 'Ended', clock(iv.end, true));
    return h;
  }

  function eventTip(ev) {
    let h = `<div class="ca-tip-head">${swatch(eventColor(ev.kind))}${esc(ev.title)}<span>${clock(ev.t, true)}</span></div>`;
    if (ev.text) h += `<div class="ca-tip-note">${esc(ev.text)}</div>`;
    if (ev.kind !== 'ascend' && Math.abs(ev.gain) >= 1)
      h += row('transparent', ev.gain >= 0 ? 'Cookies gained' : 'Cookies lost', (ev.gain >= 0 ? '+' : '−') + beautify(Math.abs(ev.gain)));
    return h;
  }

  function eventColor(kind) {
    return { golden: '#ffd54a', wrath: '#e5484d', reindeer: '#c48a5a', ascend: '#c9bcff' }[kind] || '#fff';
  }

  // ---- little canvas helpers ---------------------------------------------------------

  function hexToRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---- panel HTML + wiring ---------------------------------------------------------------

  function chip(label, attrs, title) {
    return `<button type="button" class="ca-chip" ${attrs}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
  }
  function seriesChip(key, optKey) {
    return `<button type="button" class="ca-chip ca-chip-series" data-ca="option" data-key="${optKey}" data-pressed-key="${optKey}">${swatch(SERIES[key].color)}${SERIES[key].name}</button>`;
  }

  function html() {
    return (
      '<div class="ca-card ca-graph-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Cookies per second</div>' +
      '<div class="ca-card-meta"><span class="ca-live" data-ca-live></span></div></div>' +
      '<div class="ca-stats" data-ca-stats></div>' +
      '<div class="ca-toolbar">' +
      '<div class="ca-chipgroup" title="How much history to show">' +
      WINDOWS.map((o) => chip(o.label, `data-ca="gwin" data-val="${o.s}" data-pressed-key="graphWindow" data-pressed-val="${o.s}"`)).join(
        ''
      ) +
      '</div>' +
      '<div class="ca-chipgroup" title="Show or hide each line">' +
      seriesChip('cps', 'graphShowCps') +
      seriesChip('total', 'graphShowTotal') +
      seriesChip('base', 'graphShowBase') +
      '</div>' +
      '</div>' +
      '<div class="ca-graph-wrap"><canvas class="ca-graph" data-ca-canvas></canvas><div class="ca-tip" data-ca-tip></div></div>' +
      '<div class="ca-toolbar ca-toolbar-bottom">' +
      '<div class="ca-chipgroup" title="Average over the last few seconds">' +
      '<span class="ca-chip-label">Smooth</span>' +
      SMOOTHING.map((o) =>
        chip(o.label, `data-ca="gsmooth" data-val="${o.s}" data-pressed-key="graphSmooth" data-pressed-val="${o.s}"`)
      ).join('') +
      '</div>' +
      '<div class="ca-chipgroup">' +
      chip(
        'Log scale',
        'data-ca="option" data-key="graphLog" data-pressed-key="graphLog"',
        'Logarithmic vertical axis — handy when CpS grows by orders of magnitude'
      ) +
      chip(
        'Effects',
        'data-ca="option" data-key="graphEffects" data-pressed-key="graphEffects"',
        'Shade the periods when golden cookie effects are active'
      ) +
      chip(
        'Events',
        'data-ca="option" data-key="graphEvents" data-pressed-key="graphEvents"',
        'Mark golden cookie pops, reindeer and ascensions'
      ) +
      '</div>' +
      '<div class="ca-chipgroup">' +
      chip('', 'data-ca="gpause" data-ca-pause') +
      chip('Clear', 'data-ca="gclear"', 'Erase the recorded history') +
      '</div>' +
      '</div>' +
      '<div class="ca-legend" data-ca-legend></div>' +
      '</div>'
    );
  }

  function statTile(label, value, sub) {
    return `<div class="ca-stat"><div class="ca-stat-label">${label}</div><div class="ca-stat-value">${value}</div><div class="ca-stat-sub">${sub || '&nbsp;'}</div></div>`;
  }

  /** Cheap dynamic bits (stat tiles, legend, pause button). */
  function refreshInfo() {
    if (!root) return;
    const W = windowMs();
    const t1 = endTime();
    const st = CA.History.stats(t1 - W, t1);
    const last = CA.History.samples[CA.History.samples.length - 1];
    const cur = last ? last.cps : 0;
    const box = root.querySelector('[data-ca-stats]');
    if (box) {
      box.innerHTML =
        statTile('Now', beautify(cur) + '/s', last && last.click > 0.01 ? '+' + beautify(last.click) + ' from clicks' : '') +
        statTile('Average', beautify(st.avg) + '/s', 'last ' + (W >= 3600000 ? W / 3600000 + 'h' : W / 60000 + 'm')) +
        statTile('Peak', beautify(st.peak) + '/s', st.peakT ? clock(st.peakT, true) : '') +
        statTile('Clicking', beautify(st.avgClick) + '/s', Math.round(st.clickShare * 100) + '% of income');
    }
    const live = root.querySelector('[data-ca-live]');
    if (live) {
      live.textContent = paused ? 'Paused' : 'Live';
      live.classList.toggle('paused', paused);
    }
    const pause = root.querySelector('[data-ca-pause]');
    if (pause) pause.textContent = paused ? 'Resume' : 'Pause';

    const legend = root.querySelector('[data-ca-legend]');
    if (legend) {
      const counts = new Map();
      CA.History.intervalsIn(t1 - W, t1).forEach((iv) => counts.set(iv.name, { iv, n: (counts.get(iv.name) || { n: 0 }).n + 1 }));
      legend.innerHTML = counts.size
        ? [...counts.values()]
            .map(
              ({ iv, n }) =>
                `<span class="ca-legend-item">${swatch(CA.History.colorFor(iv.name))}${esc(iv.label)}${n > 1 ? ` <em>×${n}</em>` : ''}</span>`
            )
            .join('')
        : '<span class="ca-legend-empty">Golden cookie effects will show up here.</span>';
    }
  }

  function tick() {
    if (!root) return;
    if (!root.isConnected) {
      unmount(); // the game redrew the menu underneath us
      return;
    }
    refreshInfo();
    draw();
  }

  function mount(el) {
    unmount();
    root = el;
    canvas = el.querySelector('[data-ca-canvas]');
    tip = el.querySelector('[data-ca-tip]');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      hover = { x: e.clientX - r.left, y: e.clientY - r.top };
      const prev = layout && layout.hoverIv;
      draw();
      if (layout && layout.hoverIv !== prev) draw(); // repaint once so the highlighted effect shows immediately
    });
    canvas.addEventListener('mouseleave', () => {
      hover = null;
      if (layout) layout.hoverIv = null;
      draw();
    });
    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => draw());
      observer.observe(canvas);
    }
    timer = setInterval(tick, 250);
    tick();
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (observer) observer.disconnect();
    observer = null;
    root = canvas = ctx = tip = null;
    hover = null;
    layout = null;
  }

  function setPaused(p) {
    if (p === paused) return;
    paused = p;
    pausedAt = Date.now();
    tick();
  }
  const isPaused = () => paused;

  function init() {
    const S_ = CA.Settings;
    // Chip-selected (not boolean), so they're kept out of the generic Settings-tab option list;
    // the toolbar chips above are still the way to change them.
    S_.defineOption({ key: 'graphWindow', group: 'graph-select', name: 'Time window', desc: '', default: 300 });
    S_.defineOption({ key: 'graphSmooth', group: 'graph-select', name: 'Smoothing', desc: '', default: 5 });
    S_.defineOption({
      key: 'graphShowCps',
      group: 'graph',
      name: 'Show production line',
      desc: 'The CpS line the game itself reports.',
      default: false,
    });
    S_.defineOption({
      key: 'graphShowTotal',
      group: 'graph',
      name: 'Show total (with clicking)',
      desc: 'Adds your measured click income on top of production.',
      default: true,
    });
    S_.defineOption({
      key: 'graphShowBase',
      group: 'graph',
      name: 'Show unbuffed line',
      desc: 'Dashed line for CpS with every temporary effect removed.',
      default: true,
    });
    S_.defineOption({
      key: 'graphLog',
      group: 'graph',
      name: 'Log scale',
      desc: 'Logarithmic vertical axis — multiplicative effects become equal-sized jumps.',
      default: true,
    });
    S_.defineOption({
      key: 'graphEffects',
      group: 'graph',
      name: 'Effect shading',
      desc: 'Shade the periods when golden cookie effects are active.',
      default: true,
    });
    S_.defineOption({
      key: 'graphEvents',
      group: 'graph',
      name: 'Event markers',
      desc: 'Mark golden cookie pops, reindeer pops and ascensions.',
      default: true,
    });
    CA.Events.on('history', () => {
      if (root) tick();
    });
  }

  return { init, html, mount, unmount, draw, tick, setPaused, isPaused };
})();

// ---- src/ui/stockGraph.js --------------------------------------------
// A small chart for the Bank minigame's stocks, shown under the CpS graph on the Graphs tab.
// Default view is portfolio value (what your holdings are worth right now, and how much of
// that is profit) rather than a wall of per-stock price lines you'd have to mentally total
// yourself; "Per stock" switches back to individual price lines. Data comes from CA.Stocks.

CA.UI = CA.UI || {};

CA.UI.StockGraph = (() => {
  const COLORS = ['#f5c451', '#7fe08b', '#9db4cc', '#ff8a65', '#c77dff', '#4fd6e0', '#e5484d', '#a6e35a'];
  const PAD = { r: 8, t: 10, b: 20 };
  const MIN_PAD_L = 30;
  const PAD_L_MARGIN = 10;
  const FONT = '10px Tahoma, Arial, sans-serif';

  let root = null;
  let canvas = null;
  let ctx = null;
  let tip = null;
  let observer = null;
  let timer = null;
  let hover = null;
  let padL = 54;
  let layout = null;

  const S = () => CA.Settings;
  const esc = (s) => CA.Util.escapeHtml(s);
  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : Math.round(v).toString());
  const signed = (v) => (v < 0 ? '-' : '+') + beautify(Math.abs(v));

  function two(n) {
    return n < 10 ? '0' + n : '' + n;
  }
  function clock(t, withSeconds) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}` + (withSeconds ? `:${two(d.getSeconds())}` : '');
  }

  /** Index of the first sample with t >= time (binary search). */
  function lowerBound(arr, time) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].t < time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  const mode = () => (S().get('stockGraphMode') === 'perStock' ? 'perStock' : 'portfolio');

  function visibleStocks() {
    const all = CA.Stocks.list();
    return S().get('stockGraphSync') ? all.filter((g) => g.owned) : all;
  }

  // ---- drawing -------------------------------------------------------------------

  function fitCanvas() {
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

  /** Builds { x, w, yMin, yMax, yOf, ticks } for a set of values, sizing the left padding
   *  to whatever those tick labels actually render as (so they never clip). */
  function scaleFor(w, plotY, plotH, values) {
    let minV = Infinity;
    let maxV = -Infinity;
    values.forEach((v) => {
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    });
    if (!isFinite(minV)) {
      minV = 0;
      maxV = 10;
    }
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const padV = (maxV - minV) * 0.08 || 1;
    const yMin = minV - padV;
    const yMax = maxV + padV;
    const ticks = [];
    for (let i = 0; i <= 4; i++) ticks.push(yMin + ((yMax - yMin) * i) / 4);

    const labelW = CA.Util.maxTextWidth(ctx, FONT, ticks.map((v) => beautify(v, 0)));
    padL = Math.max(MIN_PAD_L, Math.round(labelW) + PAD_L_MARGIN);
    const x = padL;
    const pw = w - padL - PAD.r;
    const yOf = (v) => plotY + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
    return { x, w: pw, yMin, yMax, yOf, ticks };
  }

  function drawAxes(plot, scale) {
    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    scale.ticks.forEach((v) => {
      const y = Math.round(scale.yOf(v)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.moveTo(scale.x, y);
      ctx.lineTo(scale.x + scale.w, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,220,200,0.75)';
      ctx.fillText(beautify(v, 0), scale.x - 6, y);
    });
  }

  function drawXLabels(plot, t0, t1) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(230,220,200,0.7)';
    ctx.fillText(clock(t0), plot.x + 28, plot.y + plot.h + 5);
    ctx.fillText(clock(t1), plot.x + plot.w - 28, plot.y + plot.h + 5);
  }

  function drawLine(plot, xOf, yOf, pts, color, dash) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y - 4, plot.w, plot.h + 8);
    ctx.clip();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = color;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(xOf(p.t), yOf(p.v)) : ctx.moveTo(xOf(p.t), yOf(p.v))));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function emptyMsg(plot, text) {
    ctx.fillStyle = 'rgba(230,220,200,0.6)';
    ctx.font = '12px Tahoma, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, plot.x + plot.w / 2, plot.y + plot.h / 2);
  }

  function drawPortfolio(w, h) {
    const W = Math.max(10, S().get('graphWindow')) * 1000;
    const t1 = Date.now();
    const t0 = t1 - W;
    const hist = CA.Stocks.portfolioHistory();
    const lo = Math.max(0, lowerBound(hist, t0) - 1);
    const pts = hist.slice(lo).filter((p) => p.t <= t1);

    const plotY = PAD.t;
    const plotH = h - PAD.t - PAD.b;
    const scale = scaleFor(w, plotY, plotH, pts.flatMap((p) => [p.value, p.cost]));
    const plot = { x: scale.x, y: plotY, w: scale.w, h: plotH };
    const xOf = (t) => plot.x + ((t - t0) / W) * plot.w;

    drawAxes(plot, scale);
    if (pts.length) drawXLabels(plot, t0, t1);
    drawLine(plot, xOf, scale.yOf, pts.map((p) => ({ t: p.t, v: p.cost })), '#9db4cc', [4, 3]);
    drawLine(plot, xOf, scale.yOf, pts.map((p) => ({ t: p.t, v: p.value })), '#f5c451');

    layout = { mode: 'portfolio', plot, xOf, yOf: scale.yOf, t0, t1, pts };

    if (hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) drawHoverPortfolio(w, h);
    else if (tip) tip.style.display = 'none';

    if (!pts.length) emptyMsg(plot, 'Buy or sell a stock to start tracking your portfolio.');
  }

  function drawPerStock(w, h) {
    const stocks = visibleStocks();
    const W = Math.max(10, S().get('graphWindow')) * 1000;
    const t1 = Date.now();
    const t0 = t1 - W;

    const lines = stocks.map((g, i) => {
      const hist = CA.Stocks.history(g.id);
      const lo = Math.max(0, lowerBound(hist, t0) - 1);
      return { g, color: COLORS[i % COLORS.length], pts: hist.slice(lo).filter((p) => p.t <= t1) };
    });

    const plotY = PAD.t;
    const plotH = h - PAD.t - PAD.b;
    const scale = scaleFor(
      w,
      plotY,
      plotH,
      lines.flatMap((l) => l.pts.map((p) => p.v))
    );
    const plot = { x: scale.x, y: plotY, w: scale.w, h: plotH };
    const xOf = (t) => plot.x + ((t - t0) / W) * plot.w;

    drawAxes(plot, scale);
    if (lines.some((l) => l.pts.length)) drawXLabels(plot, t0, t1);
    lines.forEach((l) => drawLine(plot, xOf, scale.yOf, l.pts, l.color));

    layout = { mode: 'perStock', plot, xOf, yOf: scale.yOf, t0, t1, lines };

    if (hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) drawHoverPerStock(w, h);
    else if (tip) tip.style.display = 'none';

    if (!stocks.length) {
      emptyMsg(plot, S().get('stockGraphSync') ? "You don't own any stocks right now." : 'Open the Bank minigame to start tracking prices.');
    }
  }

  function draw() {
    if (!canvas || !canvas.isConnected) return;
    const { w, h } = fitCanvas();
    if (w < 50 || h < 50) return;
    ctx.clearRect(0, 0, w, h);
    if (mode() === 'perStock') drawPerStock(w, h);
    else drawPortfolio(w, h);
  }

  function crosshair(plot) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(hover.x) + 0.5, plot.y);
    ctx.lineTo(Math.round(hover.x) + 0.5, plot.y + plot.h);
    ctx.stroke();
  }

  function placeTip(w, h) {
    tip.style.display = 'block';
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = hover.x + 16;
    if (left + tw > w - 4) left = hover.x - tw - 16;
    let top = hover.y + 12;
    if (top + th > h) top = Math.max(2, h - th - 2);
    tip.style.left = Math.max(2, left) + 'px';
    tip.style.top = top + 'px';
  }

  function drawHoverPortfolio(w, h) {
    const { plot, t0, t1, pts } = layout;
    crosshair(plot);
    const t = t0 + ((hover.x - plot.x) / plot.w) * (t1 - t0);
    let html = `<div class="ca-tip-head">${clock(t, true)}</div>`;
    const idx = Math.min(lowerBound(pts, t), pts.length - 1);
    const p = pts[idx];
    if (p) {
      html += `<div class="ca-tip-row"><i class="ca-sw" style="background:#f5c451"></i><b>Value</b><span>${beautify(p.value)}</span></div>`;
      html += `<div class="ca-tip-row"><i class="ca-sw" style="background:#9db4cc"></i><b>Cost basis</b><span>${beautify(p.cost)}</span></div>`;
      html += `<div class="ca-tip-row strong"><b>Unrealized</b><span>${signed(p.unrealized)}</span></div>`;
      html += `<div class="ca-tip-row"><b>Realized</b><span>${signed(p.realized)}</span></div>`;
      html += `<div class="ca-tip-row strong"><b>Total gain</b><span>${signed(p.gain)}</span></div>`;
    } else {
      html += '<div class="ca-tip-note">No data here yet.</div>';
    }
    tip.innerHTML = html;
    placeTip(w, h);
  }

  function drawHoverPerStock(w, h) {
    const { plot, t0, t1, lines } = layout;
    crosshair(plot);
    const t = t0 + ((hover.x - plot.x) / plot.w) * (t1 - t0);
    let html = `<div class="ca-tip-head">${clock(t, true)}</div>`;
    let any = false;
    lines.forEach((l) => {
      if (!l.pts.length) return;
      const idx = Math.min(lowerBound(l.pts, t), l.pts.length - 1);
      const p = l.pts[idx];
      if (!p) return;
      any = true;
      html += `<div class="ca-tip-row"><i class="ca-sw" style="background:${l.color}"></i><b>${esc(l.g.name)}</b><span>${beautify(p.v)}</span></div>`;
    });
    if (!any) html += '<div class="ca-tip-note">No data here yet.</div>';
    tip.innerHTML = html;
    placeTip(w, h);
  }

  // ---- panel HTML + wiring ---------------------------------------------------------

  function chip(label, attrs, title) {
    return `<button type="button" class="ca-chip" ${attrs}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
  }

  function html() {
    return (
      '<div class="ca-card ca-graph-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Stock market</div></div>' +
      '<div class="ca-stats" data-ca-stock-stats></div>' +
      '<div class="ca-toolbar">' +
      '<div class="ca-chipgroup" title="What the chart plots">' +
      chip('Portfolio value', 'data-ca="sgmode" data-val="portfolio" data-pressed-key="stockGraphMode" data-pressed-val="portfolio"') +
      chip('Per stock', 'data-ca="sgmode" data-val="perStock" data-pressed-key="stockGraphMode" data-pressed-val="perStock"') +
      '</div>' +
      '<div class="ca-chipgroup" data-ca-perstock-only>' +
      chip(
        'Sync to owned stocks',
        'data-ca="option" data-key="stockGraphSync" data-pressed-key="stockGraphSync"',
        'Only plot stocks you currently hold; turn off to show all of them.'
      ) +
      '</div>' +
      '</div>' +
      '<div class="ca-graph-wrap"><canvas class="ca-graph ca-graph-small" data-ca-stock-canvas></canvas><div class="ca-tip" data-ca-stock-tip></div></div>' +
      '<div class="ca-legend" data-ca-stock-legend></div>' +
      '</div>'
    );
  }

  function statTile(label, value, sub) {
    return `<div class="ca-stat"><div class="ca-stat-label">${label}</div><div class="ca-stat-value">${value}</div><div class="ca-stat-sub">${sub || '&nbsp;'}</div></div>`;
  }

  function refreshInfo() {
    if (!root) return;
    const perStock = mode() === 'perStock';
    const only = root.querySelector('[data-ca-perstock-only]');
    if (only) only.classList.toggle('ca-hidden', !perStock);

    const stats = root.querySelector('[data-ca-stock-stats]');
    if (stats) {
      if (perStock) {
        stats.innerHTML = '';
      } else {
        const p = CA.Stocks.portfolioNow();
        stats.innerHTML =
          statTile('Value', beautify(p.value)) +
          statTile('Unrealized', signed(p.unrealized), 'if you sold everything now') +
          statTile('Realized', signed(p.realized), 'from past sales') +
          statTile('Total gain', signed(p.gain), 'realized + unrealized');
      }
    }

    const legend = root.querySelector('[data-ca-stock-legend]');
    if (legend) {
      if (perStock) {
        const stocks = visibleStocks();
        legend.innerHTML = stocks.length
          ? stocks
              .map(
                (g, i) =>
                  `<span class="ca-legend-item"><i class="ca-sw" style="background:${COLORS[i % COLORS.length]}"></i>${esc(g.name)}</span>`
              )
              .join('')
          : '<span class="ca-legend-empty">No stocks to show.</span>';
      } else {
        legend.innerHTML =
          '<span class="ca-legend-item"><i class="ca-sw" style="background:#f5c451"></i>Value</span>' +
          '<span class="ca-legend-item"><i class="ca-sw" style="background:#9db4cc"></i>Cost basis (solid gap above it = unrealized gain)</span>';
      }
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

  function mount(el) {
    unmount();
    root = el;
    canvas = el.querySelector('[data-ca-stock-canvas]');
    tip = el.querySelector('[data-ca-stock-tip]');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      hover = { x: e.clientX - r.left, y: e.clientY - r.top };
      draw();
    });
    canvas.addEventListener('mouseleave', () => {
      hover = null;
      draw();
    });
    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => draw());
      observer.observe(canvas);
    }
    timer = setInterval(tick, 250);
    tick();
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (observer) observer.disconnect();
    observer = null;
    root = canvas = ctx = tip = null;
    hover = null;
    layout = null;
  }

  function init() {}

  return { init, html, mount, unmount, tick };
})();

// ---- src/ui/bankGraph.js ---------------------------------------------
// A small graph inserted directly under the stock list in the Bank minigame itself, so you
// don't have to open the CookieMgr panel to see how you're doing. A little toggle switches it
// between your CpS and your stock portfolio value — "Bank graph view" in Settings remembers
// which one you last picked.
//
// NOTE: this reaches into the Bank minigame's own DOM (there is no mod API for adding a panel
// there), by inserting itself right after whichever element holds the `bankGood-*` boxes. If a
// future game update changes that markup, this quietly stops appearing rather than breaking
// anything else — check that it still shows up after a game update.

CA.UI = CA.UI || {};

CA.UI.BankGraph = (() => {
  const TICK_MS = 1000;
  const WRAP_ID = 'cm-bank-graph';
  const WINDOW_MS = 5 * 60 * 1000; // fixed 5 min window — this is a glanceable mini chart, not the full Graphs tab
  const PAD = { r: 8, t: 6, b: 16 };
  const MIN_PAD_L = 28;
  const PAD_L_MARGIN = 8;
  const FONT = '10px Tahoma, Arial, sans-serif';

  const CSS = `
#${WRAP_ID} { margin: 6px 0 2px; padding: 6px 8px 4px; background: rgba(0,0,0,.28); border: 1px solid rgba(255,255,255,.12); border-radius: 4px; }
#${WRAP_ID} .cm-bg-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; font: 10px Tahoma, Arial, sans-serif; color: #cbbfa6; }
#${WRAP_ID} .cm-bg-readout { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#${WRAP_ID} .cm-bg-toggle { display: flex; gap: 3px; flex: none; }
#${WRAP_ID} .cm-bg-toggle button { font: bold 9px Tahoma, Arial, sans-serif; padding: 2px 7px; color: #b9ab93; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.14); border-radius: 9px; cursor: pointer; }
#${WRAP_ID} .cm-bg-toggle button.on { color: #fff3cf; background: rgba(255,200,100,.18); border-color: rgba(255,210,120,.6); }
#${WRAP_ID} canvas { display: block; width: 100%; height: 70px; }
`;

  let timer = null;

  const S = () => CA.Settings;
  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : Math.round(v).toString());
  const signed = (v) => (v < 0 ? '-' : '+') + beautify(Math.abs(v));

  function lowerBound(arr, time) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].t < time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // ---- finding a home in the Bank minigame's own DOM ------------------------------

  function goodsContainer() {
    const m = CA.Stocks.minigame();
    if (!m || !m.goodsById || !m.goodsById.length) return null;
    const first = document.getElementById(`bankGood-${m.goodsById[0].id}`);
    return first ? first.parentElement : null;
  }

  function ensureMounted() {
    const goods = goodsContainer();
    if (!goods || !S().get('bankGraphEnabled')) {
      remove();
      return null;
    }
    let wrap = document.getElementById(WRAP_ID);
    if (wrap && wrap.previousElementSibling !== goods) {
      wrap.remove();
      wrap = null;
    }
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = WRAP_ID;
      wrap.innerHTML =
        '<div class="cm-bg-head"><span class="cm-bg-readout" data-cm-bg-readout></span>' +
        '<span class="cm-bg-toggle">' +
        '<button type="button" data-cm-bg-mode="portfolio">Portfolio</button>' +
        '<button type="button" data-cm-bg-mode="cps">CpS</button>' +
        '</span></div>' +
        '<canvas></canvas>';
      wrap.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cm-bg-mode]');
        if (b) S().set('bankGraphMode', b.dataset.cmBgMode);
      });
      goods.insertAdjacentElement('afterend', wrap);
    }
    return wrap;
  }

  function remove() {
    const wrap = document.getElementById(WRAP_ID);
    if (wrap) wrap.remove();
  }

  // ---- drawing ---------------------------------------------------------------------

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

  function cpsSeries() {
    const t1 = Date.now();
    const t0 = t1 - WINDOW_MS;
    const lo = Math.max(0, CA.History.lowerBound(t0) - 1);
    const list = CA.History.samples.slice(lo).filter((s) => s.t <= t1);
    return { pts: list.map((s) => ({ t: s.t, v: s.cps })), color: '#f5c451' };
  }

  function portfolioSeries() {
    const t1 = Date.now();
    const t0 = t1 - WINDOW_MS;
    const hist = CA.Stocks.portfolioHistory();
    const lo = Math.max(0, lowerBound(hist, t0) - 1);
    const list = hist.slice(lo).filter((p) => p.t <= t1);
    return { pts: list.map((p) => ({ t: p.t, v: p.value })), color: '#f5c451' };
  }

  function draw(wrap) {
    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const { w, h } = fitCanvas(canvas, ctx);
    ctx.clearRect(0, 0, w, h);
    if (w < 30 || h < 20) return;

    const mode = S().get('bankGraphMode') === 'cps' ? 'cps' : 'portfolio';
    wrap.querySelectorAll('[data-cm-bg-mode]').forEach((b) => b.classList.toggle('on', b.dataset.cmBgMode === mode));

    const { pts } = mode === 'cps' ? cpsSeries() : portfolioSeries();
    const t1 = Date.now();
    const t0 = t1 - WINDOW_MS;

    let minV = Infinity;
    let maxV = -Infinity;
    pts.forEach((p) => {
      if (p.v < minV) minV = p.v;
      if (p.v > maxV) maxV = p.v;
    });
    if (!isFinite(minV)) {
      minV = 0;
      maxV = 10;
    }
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const padV = (maxV - minV) * 0.1 || 1;
    const yMin = mode === 'cps' ? Math.max(0, minV - padV) : minV - padV;
    const yMax = maxV + padV;

    const labelW = CA.Util.maxTextWidth(ctx, FONT, [beautify(yMin, 0), beautify(yMax, 0)]);
    const padL = Math.max(MIN_PAD_L, Math.round(labelW) + PAD_L_MARGIN);
    const plot = { x: padL, y: PAD.t, w: w - padL - PAD.r, h: h - PAD.t - PAD.b };
    const xOf = (t) => plot.x + ((t - t0) / WINDOW_MS) * plot.w;
    const yOf = (v) => plot.y + plot.h - ((v - yMin) / (yMax - yMin || 1)) * plot.h;

    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    [yMin, yMax].forEach((v) => {
      const y = Math.round(yOf(v)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,220,200,0.75)';
      ctx.fillText(beautify(v, 0), plot.x - 5, y);
    });

    if (pts.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y - 3, plot.w, plot.h + 6);
      ctx.clip();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#f5c451';
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(xOf(p.t), yOf(p.v)) : ctx.moveTo(xOf(p.t), yOf(p.v))));
      ctx.stroke();
      ctx.restore();
    }

    const readout = wrap.querySelector('[data-cm-bg-readout]');
    if (readout) {
      if (mode === 'cps') {
        const last = CA.History.samples[CA.History.samples.length - 1];
        readout.textContent = last ? `${beautify(last.cps)}/s` : 'Collecting data…';
      } else {
        const p = CA.Stocks.portfolioNow();
        readout.textContent = pts.length
          ? `${beautify(p.value)}  ·  unrealized ${signed(p.unrealized)}  ·  total gain ${signed(p.gain)}`
          : 'Buy a stock to start tracking.';
      }
    }
  }

  function tick() {
    const wrap = ensureMounted();
    if (wrap) draw(wrap);
  }

  function init() {
    CA.Util.injectCss('CookieMgrBankGraphStyles', CSS);
    CA.Events.on('settings', tick);
    timer = setInterval(tick, TICK_MS);
    tick();
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

  function optionRow(def) {
    return (
      `<div class="ca-row ca-row-option" data-option="${def.key}">` +
      `<div class="ca-row-text"><div class="ca-row-name">${C.esc(def.name)}</div><div class="ca-row-desc">${C.esc(def.desc)}</div></div>` +
      C.toggle(false, `data-ca="option" data-key="${def.key}"`, def.name) +
      '</div>'
    );
  }

  // ---- tabs ----------------------------------------------------------------------

  const TABS = [
    { id: 'clickers', label: 'Autoclickers' },
    { id: 'graphs', label: 'Graphs' },
    { id: 'settings', label: 'Settings' },
  ];
  const currentTab = () => {
    const t = CA.Settings.get('tab');
    return TABS.some((x) => x.id === t) ? t : 'clickers';
  };

  function tabBar() {
    return (
      '<div class="ca-tabs" role="tablist">' +
      TABS.map(
        (t) =>
          `<button type="button" role="tab" class="ca-tabbtn" data-ca="tab" data-tab="${t.id}" data-tab-btn="${t.id}">${t.label}</button>`
      ).join('') +
      '</div>'
    );
  }

  function clickersPage() {
    return (
      '<div class="ca-card">' +
      '<div class="ca-card-head">' +
      '<div class="ca-card-title">Autoclickers</div>' +
      '<div class="ca-card-meta"><span class="ca-pill" data-ca-count></span></div>' +
      '</div>' +
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
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Options</div></div>' +
      `<div class="ca-list">${CA.Settings.optionsIn('autoclickers').map(optionRow).join('')}</div>` +
      '</div>'
    );
  }

  function settingsPage() {
    return (
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">General</div></div>' +
      '<div class="ca-list">' +
      CA.Settings.optionsIn('general').map(optionRow).join('') +
      '<div class="ca-row ca-row-option">' +
      '<div class="ca-row-text"><div class="ca-row-name">Open / close this panel</div>' +
      '<div class="ca-row-desc">Optional hotkey for the CookieMgr panel.</div></div>' +
      C.hotkey('panel.toggle') +
      '</div>' +
      '<div class="ca-row ca-row-option">' +
      '<div class="ca-row-text"><div class="ca-row-name">Recorded history</div>' +
      '<div class="ca-row-desc" data-ca-history-info></div></div>' +
      C.button('Clear', 'data-ca="gclear"', 'ca-btn-small') +
      '</div>' +
      '<div class="ca-row ca-row-option">' +
      '<div class="ca-row-text"><div class="ca-row-name">Hotkeys</div>' +
      '<div class="ca-row-desc">Click a key chip, then press the new key. <kbd>Esc</kbd> cancels, <kbd>Backspace</kbd> removes it; modifiers work too.</div></div>' +
      C.button('Reset to defaults', 'data-ca="reset-hotkeys"', 'ca-btn-small') +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Autoclickers</div></div>' +
      `<div class="ca-list">${CA.Settings.optionsIn('autoclickers').map(optionRow).join('')}</div>` +
      '</div>' +
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Graphs</div></div>' +
      `<div class="ca-list">${CA.Settings.optionsIn('graph').map(optionRow).join('')}</div>` +
      '</div>' +
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Stock market</div></div>' +
      `<div class="ca-list">${CA.Settings.optionsIn('stocks').map(optionRow).join('')}</div>` +
      '</div>' +
      '<div class="ca-footer">' +
      `<div>CookieMgr v${CA.VERSION} &middot; <a href="https://github.com/nunorgcarvalho/CookieMgr" target="_blank" rel="noopener">GitHub</a></div>` +
      '<div>Settings are stored inside your Cookie Clicker save.</div>' +
      '</div>'
    );
  }

  function html() {
    const tab = currentTab();
    return (
      '<div class="close menuClose" data-ca="close">x</div>' +
      '<div id="CookieMgrMenu">' +
      '<div class="section">CookieMgr</div>' +
      tabBar() +
      `<div class="ca-page" data-page="${tab}">` +
      (tab === 'clickers' ? clickersPage() : tab === 'graphs' ? CA.UI.Graph.html() + CA.UI.StockGraph.html() : settingsPage()) +
      '</div>' +
      '</div>'
    );
  }

  function render() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    CA.UI.Graph.unmount();
    CA.UI.StockGraph.unmount();
    menu.innerHTML = html();
    if (currentTab() === 'graphs') {
      CA.UI.Graph.mount(menu.querySelector('.ca-page'));
      CA.UI.StockGraph.mount(menu.querySelector('.ca-page'));
    }
    sync();
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

    const total = CA.Autoclickers.list().length;
    const active = CA.Autoclickers.activeCount();
    const pill = root.querySelector('[data-ca-count]');
    if (pill) {
      pill.textContent = `${active} / ${total} running`;
      pill.classList.toggle('on', active > 0);
      root.querySelector('[data-ca="all-on"]').disabled = active === total;
      root.querySelector('[data-ca="all-off"]').disabled = active === 0;
    }

    const tab = currentTab();
    root.querySelectorAll('[data-tab-btn]').forEach((b) => {
      const on = b.dataset.tabBtn === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    });

    // chips / pills bound to a setting
    root.querySelectorAll('[data-pressed-key]').forEach((el) => {
      const v = CA.Settings.get(el.dataset.pressedKey);
      const on = 'pressedVal' in el.dataset ? String(v) === el.dataset.pressedVal : !!v;
      el.classList.toggle('on', on);
      el.setAttribute('aria-pressed', String(on));
    });

    const info = root.querySelector('[data-ca-history-info]');
    if (info) {
      const n = CA.History.samples.length;
      const span = n < 120 ? `${n} seconds` : n < 7200 ? `${Math.round(n / 60)} minutes` : `${(n / 3600).toFixed(1)} hours`;
      const fx = CA.History.intervals.length;
      info.textContent = n ? `${span} of CpS data and ${fx} effect${fx === 1 ? '' : 's'} recorded this session.` : 'Nothing recorded yet.';
    }

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
      case 'tab':
        CA.Util.sound('snd/tick.mp3');
        CA.Settings.set('tab', t.dataset.tab);
        render();
        break;
      case 'gwin':
        CA.Util.sound('snd/tick.mp3');
        CA.Settings.set('graphWindow', Number(t.dataset.val));
        break;
      case 'gsmooth':
        CA.Util.sound('snd/tick.mp3');
        CA.Settings.set('graphSmooth', Number(t.dataset.val));
        break;
      case 'sgmode':
        CA.Util.sound('snd/tick.mp3');
        CA.Settings.set('stockGraphMode', t.dataset.val);
        break;
      case 'gpause':
        CA.Util.sound('snd/tick.mp3');
        CA.UI.Graph.setPaused(!CA.UI.Graph.isPaused());
        break;
      case 'gclear':
        CA.Util.sound('snd/tick.mp3');
        CA.History.clear();
        sync();
        break;
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
        CA.UI.Graph.unmount();
        CA.UI.StockGraph.unmount();
      }
      CA.UI.Tab.update();
      return result;
    });

    const menu = document.getElementById('menu');
    if (menu) menu.addEventListener('click', onClick);

    const refresh = () => {
      if (!isOpen()) return;
      sync();
      if (currentTab() === 'graphs') {
        CA.UI.Graph.tick();
        CA.UI.StockGraph.tick();
      }
    };
    CA.Events.on('clickers', refresh);
    CA.Events.on('settings', refresh);
    CA.Events.on('hotkeys', refresh);
  }

  return { init, open, close, toggle, isOpen, render, sync };
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

    CA.Autoclickers.init();
    CA.Stocks.init();
    CA.History.init();
    CA.UI.Graph.init();
    CA.UI.StockGraph.init();
    CA.UI.BankGraph.init();
    CA.Hotkeys.init();
    CA.Ascension.init();
    CA.UI.Menu.init();
    CA.UI.Tab.init();
    migrateOldSaveData();

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
    const data = CA.Settings.deserialize(str);
    if (data && data.clickers && CA.Settings.get('rememberStates')) CA.Autoclickers.restore(data.clickers);
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
