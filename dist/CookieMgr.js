/*! CookieMgr v1.4.0 */
(function () {
'use strict';
const CA = {};
CA.VERSION = "1.4.0";
CA.CSS = "/* ==========================================================================\r\n   CookieMgr — styles\r\n   Colours and borders borrow from the game's own \"framed\" look so the panel\r\n   feels native. Everything is scoped under #CookieMgrTab / #CookieMgrMenu.\r\n   ========================================================================== */\r\n\r\n/* ---------- Sidebar (icon tabs sticking out of the left beam, one per page) ---------- */\r\n\r\n#CookieMgrTab {\r\n  position: absolute;\r\n  left: 30%;\r\n  top: 128px;\r\n  margin-left: 3px; /* tuck slightly under the beam */\r\n  transform: translateX(-100%);\r\n  z-index: 110;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: flex-end; /* items grow leftwards, away from the beam */\r\n  gap: 4px;\r\n}\r\n#CookieMgrTab .ca-tab-item {\r\n  box-sizing: border-box;\r\n  height: 32px;\r\n  display: flex;\r\n  align-items: center;\r\n  cursor: pointer;\r\n  user-select: none;\r\n  background: linear-gradient(to right, #3d2716, #221409);\r\n  border: 1px solid;\r\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\r\n  border-right: none;\r\n  border-radius: 8px 0 0 8px;\r\n  box-shadow:\r\n    -3px 3px 10px rgba(0, 0, 0, 0.65),\r\n    inset 1px 1px 0 rgba(255, 255, 255, 0.18);\r\n  transition:\r\n    background 0.2s,\r\n    box-shadow 0.2s;\r\n  outline: none;\r\n}\r\n#CookieMgrTab .ca-tab-item:hover,\r\n#CookieMgrTab .ca-tab-item:focus-visible {\r\n  box-shadow:\r\n    -3px 3px 12px rgba(0, 0, 0, 0.75),\r\n    0 0 12px rgba(255, 215, 110, 0.35),\r\n    inset 1px 1px 0 rgba(255, 255, 255, 0.25);\r\n}\r\n#CookieMgrTab .ca-tab-item.selected {\r\n  background: linear-gradient(to right, #7a4f22, #43290f);\r\n  box-shadow:\r\n    -3px 3px 12px rgba(0, 0, 0, 0.75),\r\n    0 0 14px rgba(255, 215, 110, 0.55),\r\n    inset 1px 1px 0 rgba(255, 255, 255, 0.3);\r\n}\r\n#CookieMgrTab .ca-tab-label {\r\n  max-width: 0;\r\n  overflow: hidden;\r\n  opacity: 0;\r\n  padding: 0;\r\n  font-family: 'Merriweather', Georgia, serif;\r\n  font-variant: small-caps;\r\n  font-weight: bold;\r\n  font-size: 13px;\r\n  letter-spacing: 0.5px;\r\n  color: #f4e6c3;\r\n  text-shadow:\r\n    0 1px 2px #000,\r\n    0 0 6px rgba(255, 200, 120, 0.25);\r\n  white-space: nowrap;\r\n  transition:\r\n    max-width 0.22s ease-out,\r\n    opacity 0.15s,\r\n    padding 0.22s ease-out;\r\n}\r\n#CookieMgrTab .ca-tab-item:hover .ca-tab-label,\r\n#CookieMgrTab .ca-tab-item:focus-visible .ca-tab-label {\r\n  max-width: 180px;\r\n  opacity: 1;\r\n  padding: 0 2px 0 12px;\r\n}\r\n#CookieMgrTab .ca-tab-icon {\r\n  position: relative;\r\n  flex: none;\r\n  width: 30px;\r\n  height: 30px;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  color: #f4e6c3;\r\n  filter: drop-shadow(0 1px 1px #000);\r\n}\r\n#CookieMgrTab .ca-tab-item.selected .ca-tab-icon,\r\n#CookieMgrTab .ca-tab-item:hover .ca-tab-icon {\r\n  color: #ffeab0;\r\n}\r\n#CookieMgrTab .ca-tab-badge {\r\n  display: none;\r\n  position: absolute;\r\n  top: -5px;\r\n  left: -5px;\r\n  min-width: 15px;\r\n  height: 15px;\r\n  padding: 0 3px;\r\n  box-sizing: border-box;\r\n  border-radius: 8px;\r\n  font:\r\n    bold 9px/15px Tahoma,\r\n    Arial,\r\n    sans-serif;\r\n  text-align: center;\r\n  color: #fff;\r\n  background: linear-gradient(#63c64a, #2f7d24);\r\n  box-shadow:\r\n    0 0 6px rgba(120, 240, 100, 0.8),\r\n    0 1px 1px #000;\r\n  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.6);\r\n}\r\n#CookieMgrTab .ca-tab-item.active .ca-tab-badge {\r\n  display: block;\r\n  animation: caBadgeGlow 2s infinite ease-in-out;\r\n}\r\n@keyframes caBadgeGlow {\r\n  0%,\r\n  100% {\r\n    box-shadow:\r\n      0 0 4px rgba(120, 240, 100, 0.6),\r\n      0 1px 1px #000;\r\n  }\r\n  50% {\r\n    box-shadow:\r\n      0 0 10px rgba(120, 240, 100, 1),\r\n      0 1px 1px #000;\r\n  }\r\n}\r\n#game.ascending #CookieMgrTab,\r\n#game.ascendIntro #CookieMgrTab,\r\n#game.reincarnating #CookieMgrTab {\r\n  display: none;\r\n}\r\n\r\n/* ---------- Icons (used everywhere, not just inside the panel) ---------- */\r\n\r\n.ca-ico {\r\n  display: inline-block;\r\n  flex: none;\r\n  vertical-align: middle;\r\n}\r\n.ca-ico-cookie {\r\n  background: url(img/perfectCookie.png) center / contain no-repeat;\r\n}\r\n\r\n/* ---------- Stock market toolbar inside the Bank minigame ---------- */\r\n\r\n#cm-bank-toolbar {\r\n  position: relative;\r\n  z-index: 10;\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: 6px;\r\n  padding: 4px 4px 6px;\r\n}\r\n#cm-bank-toolbar .bankButton {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 5px;\r\n  font-size: 11px;\r\n  padding: 3px 9px;\r\n}\r\n#cm-bank-toolbar .cm-bt-open {\r\n  color: #f4e6c3;\r\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\r\n}\r\n\r\n/* ---------- Panel ---------- */\r\n\r\n#CookieMgrMenu {\r\n  max-width: 780px;\r\n  margin: 0 auto;\r\n  padding: 0 12px 120px;\r\n  color: #ddd;\r\n}\r\n#CookieMgrMenu .ca-tagline {\r\n  text-align: center;\r\n  margin: -6px 0 14px;\r\n  font-size: 12px;\r\n  font-style: italic;\r\n  color: #b9ab93;\r\n  text-shadow: 0 1px 1px #000;\r\n}\r\n\r\n/* Cards */\r\n#CookieMgrMenu .ca-card {\r\n  margin: 14px 4px;\r\n  border-radius: 6px;\r\n  border: 1px solid rgba(255, 255, 255, 0.1);\r\n  background: rgba(0, 0, 0, 0.38);\r\n  box-shadow:\r\n    0 0 1px #000,\r\n    inset 0 0 1px #000,\r\n    0 6px 16px rgba(0, 0, 0, 0.35);\r\n  overflow: hidden;\r\n}\r\n#CookieMgrMenu .ca-card-head {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: 10px;\r\n  padding: 9px 14px;\r\n  background: linear-gradient(to right, rgba(255, 235, 190, 0.09), rgba(255, 235, 190, 0));\r\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\r\n}\r\n#CookieMgrMenu .ca-card-title {\r\n  flex: 1;\r\n  font-family: 'Merriweather', Georgia, serif;\r\n  font-variant: small-caps;\r\n  font-size: 20px;\r\n  color: #fff;\r\n  text-shadow:\r\n    0 -1px 5px rgba(255, 255, 200, 0.35),\r\n    0 1px 3px #000;\r\n}\r\n#CookieMgrMenu .ca-pill {\r\n  font-size: 11px;\r\n  white-space: nowrap;\r\n  padding: 3px 10px;\r\n  border-radius: 10px;\r\n  color: #bbb;\r\n  background: rgba(255, 255, 255, 0.07);\r\n  border: 1px solid rgba(255, 255, 255, 0.15);\r\n  transition: all 0.2s;\r\n}\r\n#CookieMgrMenu .ca-pill.on {\r\n  color: #cfc;\r\n  background: rgba(80, 200, 90, 0.16);\r\n  border-color: rgba(130, 235, 120, 0.5);\r\n}\r\n\r\n/* Rows */\r\n#CookieMgrMenu .ca-row {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: 8px 12px;\r\n  padding: 8px 14px;\r\n  border-top: 1px solid rgba(255, 255, 255, 0.05);\r\n  transition: background 0.2s;\r\n}\r\n#CookieMgrMenu .ca-list .ca-row:first-child {\r\n  border-top: none;\r\n}\r\n#CookieMgrMenu .ca-row:hover {\r\n  background: rgba(255, 255, 255, 0.035);\r\n}\r\n#CookieMgrMenu .ca-row.on {\r\n  background: linear-gradient(to right, rgba(255, 210, 90, 0.12), rgba(255, 210, 90, 0) 65%);\r\n}\r\n#CookieMgrMenu .ca-row-master {\r\n  background: rgba(0, 0, 0, 0.22);\r\n  border-top: none;\r\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\r\n}\r\n#CookieMgrMenu .ca-row-option {\r\n  padding-top: 10px;\r\n  padding-bottom: 10px;\r\n}\r\n#CookieMgrMenu .ca-row-text {\r\n  flex: 1 1 160px;\r\n  min-width: 0;\r\n}\r\n#CookieMgrMenu .ca-row-option {\r\n  flex-wrap: nowrap;\r\n}\r\n#CookieMgrMenu .ca-row-option .ca-row-text {\r\n  flex-basis: 0;\r\n}\r\n#CookieMgrMenu .ca-controls {\r\n  flex: 0 1 auto;\r\n  max-width: 100%;\r\n  margin-left: auto;\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  justify-content: flex-end;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n#CookieMgrMenu .ca-row-name {\r\n  font-family: 'Merriweather', Georgia, serif;\r\n  font-weight: bold;\r\n  font-size: 14px;\r\n  color: #f2ead2;\r\n  text-shadow: 0 1px 2px #000;\r\n}\r\n#CookieMgrMenu .ca-row-desc {\r\n  margin-top: 2px;\r\n  font-size: 11px;\r\n  color: #b3a590;\r\n  text-shadow: 0 1px 1px #000;\r\n}\r\n\r\n/* Icons */\r\n#CookieMgrMenu .ca-icon {\r\n  flex: 0 0 36px;\r\n  width: 36px;\r\n  height: 36px;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  transition:\r\n    filter 0.25s,\r\n    transform 0.25s;\r\n  filter: grayscale(0.55) brightness(0.8);\r\n}\r\n#CookieMgrMenu .ca-row.on .ca-icon,\r\n#CookieMgrMenu .ca-row-master .ca-icon {\r\n  filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.75));\r\n}\r\n#CookieMgrMenu .ca-row.on .ca-icon {\r\n  transform: scale(1.06);\r\n}\r\n#CookieMgrMenu .ca-img {\r\n  width: 36px;\r\n  height: 36px;\r\n  background-size: contain;\r\n  background-repeat: no-repeat;\r\n  background-position: center;\r\n}\r\n#CookieMgrMenu .ca-sprite {\r\n  flex: none;\r\n  width: 48px;\r\n  height: 48px;\r\n  background-image: url(img/icons.png);\r\n  transform: scale(0.75);\r\n}\r\n\r\n/* Toggle switch */\r\n#CookieMgrMenu .ca-switch {\r\n  flex: none;\r\n  padding: 2px;\r\n  background: none;\r\n  border: none;\r\n  cursor: pointer;\r\n}\r\n#CookieMgrMenu .ca-switch:focus {\r\n  outline: none;\r\n}\r\n#CookieMgrMenu .ca-switch-track {\r\n  display: block;\r\n  position: relative;\r\n  width: 42px;\r\n  height: 22px;\r\n  box-sizing: border-box;\r\n  border-radius: 11px;\r\n  background: #2a211c;\r\n  border: 1px solid rgba(255, 255, 255, 0.22);\r\n  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.75);\r\n  transition:\r\n    background 0.2s,\r\n    border-color 0.2s,\r\n    box-shadow 0.2s;\r\n}\r\n#CookieMgrMenu .ca-switch-knob {\r\n  position: absolute;\r\n  top: 2px;\r\n  left: 2px;\r\n  width: 16px;\r\n  height: 16px;\r\n  border-radius: 50%;\r\n  background: radial-gradient(circle at 35% 30%, #fff, #c9c1b5 55%, #8a8178);\r\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);\r\n  transition: left 0.18s ease-out;\r\n}\r\n#CookieMgrMenu .ca-switch:hover .ca-switch-track {\r\n  border-color: rgba(255, 225, 150, 0.6);\r\n}\r\n#CookieMgrMenu .ca-switch.on .ca-switch-track {\r\n  background: linear-gradient(#66c84b, #2f7d24);\r\n  border-color: #a5ea93;\r\n  box-shadow:\r\n    inset 0 1px 3px rgba(0, 0, 0, 0.35),\r\n    0 0 9px rgba(110, 230, 90, 0.45);\r\n}\r\n#CookieMgrMenu .ca-switch.on .ca-switch-knob {\r\n  left: 22px;\r\n}\r\n#CookieMgrMenu .ca-switch:focus-visible .ca-switch-track {\r\n  outline: 2px solid #ffd76a;\r\n  outline-offset: 2px;\r\n}\r\n\r\n/* Hotkey chips */\r\n#CookieMgrMenu .ca-hotkey {\r\n  flex: none;\r\n  display: inline-flex;\r\n  align-items: center;\r\n}\r\n#CookieMgrMenu .ca-key {\r\n  min-width: 46px;\r\n  height: 26px;\r\n  padding: 0 10px;\r\n  font:\r\n    bold 12px Tahoma,\r\n    Arial,\r\n    sans-serif;\r\n  color: #f4e6c3;\r\n  text-shadow: 0 1px 1px #000;\r\n  background: linear-gradient(#4d3c2d, #2a2018);\r\n  border: 1px solid;\r\n  border-color: #9a7d5b #3b2c1f #2a1f15 #74604a;\r\n  border-radius: 5px;\r\n  box-shadow:\r\n    0 2px 0 #140d08,\r\n    inset 0 1px 0 rgba(255, 255, 255, 0.16);\r\n  cursor: pointer;\r\n  transition:\r\n    color 0.15s,\r\n    border-color 0.15s,\r\n    box-shadow 0.15s;\r\n}\r\n#CookieMgrMenu .ca-key:hover {\r\n  color: #fff;\r\n  border-color: #e0c08a #5a4430 #3d2e20 #b39468;\r\n}\r\n#CookieMgrMenu .ca-key:active {\r\n  transform: translateY(1px);\r\n  box-shadow:\r\n    0 1px 0 #140d08,\r\n    inset 0 1px 0 rgba(255, 255, 255, 0.16);\r\n}\r\n#CookieMgrMenu .ca-key:focus {\r\n  outline: none;\r\n}\r\n#CookieMgrMenu .ca-hotkey.unset .ca-key {\r\n  color: #8f877a;\r\n  font-weight: normal;\r\n  font-style: italic;\r\n  background: rgba(0, 0, 0, 0.3);\r\n  border: 1px dashed rgba(255, 255, 255, 0.22);\r\n  box-shadow: none;\r\n}\r\n#CookieMgrMenu .ca-hotkey.capturing .ca-key {\r\n  color: #ffe9a6;\r\n  border-color: #ffd76a;\r\n  animation: caCapture 1.1s infinite ease-in-out;\r\n}\r\n@keyframes caCapture {\r\n  0%,\r\n  100% {\r\n    box-shadow:\r\n      0 2px 0 #140d08,\r\n      0 0 0 0 rgba(255, 215, 106, 0.5);\r\n  }\r\n  50% {\r\n    box-shadow:\r\n      0 2px 0 #140d08,\r\n      0 0 12px 2px rgba(255, 215, 106, 0.55);\r\n  }\r\n}\r\n#CookieMgrMenu .ca-key-clear {\r\n  width: 18px;\r\n  height: 18px;\r\n  margin-left: 3px;\r\n  padding: 0;\r\n  border: none;\r\n  border-radius: 50%;\r\n  background: transparent;\r\n  color: #b09a8a;\r\n  font-size: 14px;\r\n  line-height: 18px;\r\n  cursor: pointer;\r\n  opacity: 0;\r\n  transition:\r\n    opacity 0.15s,\r\n    background 0.15s;\r\n}\r\n#CookieMgrMenu .ca-row:hover .ca-key-clear {\r\n  opacity: 0.8;\r\n}\r\n#CookieMgrMenu .ca-key-clear:hover {\r\n  color: #fff;\r\n  background: rgba(255, 80, 80, 0.35);\r\n}\r\n#CookieMgrMenu .ca-hotkey.unset .ca-key-clear,\r\n#CookieMgrMenu .ca-hotkey.capturing .ca-key-clear {\r\n  visibility: hidden;\r\n}\r\n\r\n/* Buttons */\r\n#CookieMgrMenu .ca-btn {\r\n  padding: 4px 12px;\r\n  font-family: 'Merriweather', Georgia, serif;\r\n  font-variant: small-caps;\r\n  font-weight: bold;\r\n  font-size: 12px;\r\n  color: #ddd;\r\n  text-shadow: 0 1px 1px #000;\r\n  background: linear-gradient(#3e2f23, #1d140f);\r\n  border: 1px solid;\r\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\r\n  border-radius: 4px;\r\n  box-shadow:\r\n    0 1px 3px rgba(0, 0, 0, 0.6),\r\n    inset 0 1px 0 rgba(255, 255, 255, 0.12);\r\n  cursor: pointer;\r\n  transition:\r\n    color 0.15s,\r\n    box-shadow 0.15s,\r\n    opacity 0.15s;\r\n}\r\n#CookieMgrMenu .ca-btn:focus {\r\n  outline: none;\r\n}\r\n#CookieMgrMenu .ca-btn:not(:disabled):hover {\r\n  color: #fff;\r\n  box-shadow:\r\n    0 1px 3px rgba(0, 0, 0, 0.6),\r\n    0 0 9px rgba(255, 220, 120, 0.35),\r\n    inset 0 1px 0 rgba(255, 255, 255, 0.18);\r\n}\r\n#CookieMgrMenu .ca-btn:not(:disabled):active {\r\n  transform: translateY(1px);\r\n}\r\n#CookieMgrMenu .ca-btn-on:not(:disabled):hover {\r\n  color: #d6ffcc;\r\n}\r\n#CookieMgrMenu .ca-btn-off:not(:disabled):hover {\r\n  color: #ffd2cc;\r\n}\r\n#CookieMgrMenu .ca-btn:disabled {\r\n  opacity: 0.38;\r\n  cursor: default;\r\n  box-shadow: none;\r\n}\r\n#CookieMgrMenu .ca-btn-small {\r\n  font-size: 11px;\r\n  padding: 3px 10px;\r\n}\r\n#CookieMgrMenu .ca-btn .ca-ico {\r\n  vertical-align: -2px;\r\n}\r\n#CookieMgrMenu .ca-btn.ca-armed {\r\n  color: #fff;\r\n  background: #8a2a22;\r\n  box-shadow: 0 0 0 1px #e5484d, 0 0 8px rgba(229, 72, 77, 0.6);\r\n}\r\n#CookieMgrMenu .ca-btn-lg {\r\n  padding: 10px 20px;\r\n  font-size: 15px;\r\n  border-radius: 6px;\r\n}\r\n#CookieMgrMenu .ca-btn-danger {\r\n  color: #ffdcd2;\r\n  background: linear-gradient(#6b2420, #3a1210);\r\n  border-color: #ffb199 #7a2a1e #5c1b12 #d98a6e;\r\n  box-shadow:\r\n    0 1px 3px rgba(0, 0, 0, 0.6),\r\n    0 0 10px rgba(255, 90, 60, 0.25),\r\n    inset 0 1px 0 rgba(255, 255, 255, 0.15);\r\n}\r\n#CookieMgrMenu .ca-btn-danger:not(:disabled):hover {\r\n  color: #fff;\r\n  box-shadow:\r\n    0 1px 3px rgba(0, 0, 0, 0.6),\r\n    0 0 16px rgba(255, 90, 60, 0.5),\r\n    inset 0 1px 0 rgba(255, 255, 255, 0.2);\r\n}\r\n#CookieMgrMenu .ca-card-danger {\r\n  border-color: rgba(255, 110, 80, 0.3);\r\n  box-shadow:\r\n    0 0 1px #000,\r\n    inset 0 0 1px #000,\r\n    0 0 14px rgba(255, 70, 40, 0.12),\r\n    0 6px 16px rgba(0, 0, 0, 0.35);\r\n}\r\n#CookieMgrMenu .ca-row-sellall {\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 12px;\r\n}\r\n\r\n/* Footer */\r\n#CookieMgrMenu .ca-footer {\r\n  margin: 18px 8px 0;\r\n  font-size: 11px;\r\n  line-height: 1.7;\r\n  text-align: center;\r\n  color: #9b907f;\r\n  text-shadow: 0 1px 1px #000;\r\n}\r\n#CookieMgrMenu .ca-footer b {\r\n  color: #c9bba3;\r\n}\r\n#CookieMgrMenu kbd {\r\n  display: inline-block;\r\n  padding: 0 5px;\r\n  font:\r\n    bold 10px/16px Tahoma,\r\n    Arial,\r\n    sans-serif;\r\n  color: #e8dcc2;\r\n  background: #2a2018;\r\n  border: 1px solid #5a4632;\r\n  border-radius: 3px;\r\n  box-shadow: 0 1px 0 #140d08;\r\n}\r\n#CookieMgrMenu .ca-footer-actions {\r\n  margin-top: 8px;\r\n}\r\n\r\n#CookieMgrMenu .ca-page {\r\n  animation: caFade 0.18s ease-out;\r\n}\r\n@keyframes caFade {\r\n  from {\r\n    opacity: 0;\r\n    transform: translateY(3px);\r\n  }\r\n  to {\r\n    opacity: 1;\r\n    transform: none;\r\n  }\r\n}\r\n#CookieMgrMenu a {\r\n  color: #ffd98a;\r\n}\r\n\r\n/* ---------- Graph ---------- */\r\n\r\n#CookieMgrMenu .ca-live {\r\n  font-size: 11px;\r\n  padding: 3px 10px 3px 20px;\r\n  position: relative;\r\n  border-radius: 10px;\r\n  color: #cfc;\r\n  background: rgba(80, 200, 90, 0.16);\r\n  border: 1px solid rgba(130, 235, 120, 0.5);\r\n}\r\n#CookieMgrMenu .ca-live:before {\r\n  content: '';\r\n  position: absolute;\r\n  left: 8px;\r\n  top: 50%;\r\n  width: 6px;\r\n  height: 6px;\r\n  margin-top: -3px;\r\n  border-radius: 50%;\r\n  background: #7be07b;\r\n  box-shadow: 0 0 6px #7be07b;\r\n  animation: caBadgeGlow 1.6s infinite ease-in-out;\r\n}\r\n#CookieMgrMenu .ca-live.paused {\r\n  color: #ffd9a0;\r\n  background: rgba(255, 170, 60, 0.14);\r\n  border-color: rgba(255, 190, 100, 0.5);\r\n}\r\n#CookieMgrMenu .ca-live.paused:before {\r\n  background: #ffb45c;\r\n  box-shadow: none;\r\n  animation: none;\r\n}\r\n\r\n#CookieMgrMenu .ca-stats {\r\n  display: grid;\r\n  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));\r\n  gap: 1px;\r\n  background: rgba(255, 255, 255, 0.06);\r\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\r\n}\r\n#CookieMgrMenu .ca-stat {\r\n  min-width: 0; /* lets the grid cell shrink below its content so overflow/ellipsis below can work */\r\n  padding: 8px 12px;\r\n  background: rgba(0, 0, 0, 0.32);\r\n}\r\n#CookieMgrMenu .ca-stat-label {\r\n  font-size: 10px;\r\n  text-transform: uppercase;\r\n  letter-spacing: 0.08em;\r\n  color: #a89a83;\r\n}\r\n#CookieMgrMenu .ca-stat-value {\r\n  margin-top: 2px;\r\n  font-family: 'Merriweather', Georgia, serif;\r\n  font-weight: bold;\r\n  font-size: 17px;\r\n  color: #ffeab0;\r\n  text-shadow: 0 1px 3px #000;\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n}\r\n#CookieMgrMenu .ca-stat-sub {\r\n  margin-top: 1px;\r\n  font-size: 10px;\r\n  color: #93866f;\r\n  white-space: nowrap;\r\n}\r\n\r\n#CookieMgrMenu .ca-toolbar {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 6px 12px;\r\n  padding: 8px 12px;\r\n}\r\n#CookieMgrMenu .ca-toolbar-bottom {\r\n  padding-top: 6px;\r\n}\r\n#CookieMgrMenu .ca-chipgroup {\r\n  display: inline-flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: 4px;\r\n}\r\n#CookieMgrMenu .ca-chip-label {\r\n  margin-right: 2px;\r\n  font-size: 10px;\r\n  text-transform: uppercase;\r\n  letter-spacing: 0.08em;\r\n  color: #93866f;\r\n}\r\n#CookieMgrMenu .ca-chip {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 5px;\r\n  padding: 3px 9px;\r\n  font:\r\n    bold 11px Tahoma,\r\n    Arial,\r\n    sans-serif;\r\n  color: #b9ab93;\r\n  text-shadow: 0 1px 1px #000;\r\n  background: rgba(255, 255, 255, 0.05);\r\n  border: 1px solid rgba(255, 255, 255, 0.14);\r\n  border-radius: 11px;\r\n  cursor: pointer;\r\n  transition:\r\n    color 0.15s,\r\n    background 0.15s,\r\n    border-color 0.15s;\r\n}\r\n#CookieMgrMenu .ca-chip:focus {\r\n  outline: none;\r\n}\r\n#CookieMgrMenu .ca-chip:hover {\r\n  color: #fff;\r\n  border-color: rgba(255, 225, 150, 0.5);\r\n}\r\n#CookieMgrMenu .ca-chip.on {\r\n  color: #fff3cf;\r\n  background: rgba(255, 200, 100, 0.18);\r\n  border-color: rgba(255, 210, 120, 0.6);\r\n}\r\n#CookieMgrMenu .ca-sw {\r\n  display: inline-block;\r\n  width: 9px;\r\n  height: 9px;\r\n  margin-right: 1px;\r\n  border-radius: 50%;\r\n  vertical-align: -1px;\r\n  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55);\r\n}\r\n\r\n#CookieMgrMenu .ca-graph-wrap {\r\n  position: relative;\r\n  margin: 0 8px;\r\n}\r\n#CookieMgrMenu canvas.ca-graph {\r\n  display: block;\r\n  width: 100%;\r\n  height: 300px;\r\n  cursor: crosshair;\r\n}\r\n#CookieMgrMenu canvas.ca-graph.ca-graph-small {\r\n  height: 160px;\r\n}\r\n#CookieMgrMenu .ca-tip {\r\n  display: none;\r\n  position: absolute;\r\n  z-index: 5;\r\n  max-width: 270px;\r\n  min-width: 150px;\r\n  padding: 7px 10px;\r\n  pointer-events: none;\r\n  font-size: 11px;\r\n  line-height: 1.35;\r\n  color: #e6dcc6;\r\n  background: rgba(14, 10, 6, 0.95);\r\n  border: 1px solid;\r\n  border-color: #b98a4e #6a4626 #55301c #a0764a;\r\n  border-radius: 5px;\r\n  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);\r\n}\r\n#CookieMgrMenu .ca-tip-head {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  margin-bottom: 4px;\r\n  font-family: 'Merriweather', Georgia, serif;\r\n  font-weight: bold;\r\n  font-size: 12px;\r\n  color: #ffeab0;\r\n}\r\n#CookieMgrMenu .ca-tip-head span {\r\n  margin-left: auto;\r\n  padding-left: 10px;\r\n  font:\r\n    normal 10px Tahoma,\r\n    Arial,\r\n    sans-serif;\r\n  color: #a89a83;\r\n}\r\n#CookieMgrMenu .ca-tip-row {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 5px;\r\n  padding: 1px 0;\r\n}\r\n#CookieMgrMenu .ca-tip-row b {\r\n  font-weight: normal;\r\n  color: #b9ab93;\r\n}\r\n#CookieMgrMenu .ca-tip-row span {\r\n  margin-left: auto;\r\n  padding-left: 12px;\r\n  text-align: right;\r\n  color: #f2ead2;\r\n}\r\n#CookieMgrMenu .ca-tip-row.strong b,\r\n#CookieMgrMenu .ca-tip-row.strong span {\r\n  color: #fff3cf;\r\n  font-weight: bold;\r\n}\r\n#CookieMgrMenu .ca-tip-sep {\r\n  height: 1px;\r\n  margin: 5px 0;\r\n  background: rgba(255, 255, 255, 0.14);\r\n}\r\n#CookieMgrMenu .ca-tip-note {\r\n  margin: 2px 0 4px;\r\n  font-style: italic;\r\n  color: #a89a83;\r\n}\r\n\r\n#CookieMgrMenu .ca-legend {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 4px 12px;\r\n  min-height: 16px;\r\n  padding: 2px 14px 12px;\r\n  font-size: 11px;\r\n  color: #b9ab93;\r\n}\r\n#CookieMgrMenu .ca-legend-item em {\r\n  font-style: normal;\r\n  color: #93866f;\r\n}\r\n#CookieMgrMenu .ca-legend-empty {\r\n  font-style: italic;\r\n  color: #7f735f;\r\n}\r\n\r\n#CookieMgrMenu .ca-hidden {\r\n  display: none;\r\n}\r\n\r\n/* ---------- Stock transaction log + ticker ---------- */\r\n\r\n#CookieMgrMenu .cm-tx-wrap {\r\n  max-height: 220px;\r\n  overflow-y: auto;\r\n  margin: 0 4px 6px;\r\n}\r\n#CookieMgrMenu .cm-tx-table {\r\n  width: 100%;\r\n  border-collapse: collapse;\r\n  font-size: 11px;\r\n}\r\n#CookieMgrMenu .cm-tx-table th {\r\n  position: sticky;\r\n  top: 0;\r\n  text-align: left;\r\n  padding: 4px 8px;\r\n  font-size: 10px;\r\n  text-transform: uppercase;\r\n  letter-spacing: 0.06em;\r\n  color: #93866f;\r\n  background: #1c150d;\r\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\r\n}\r\n#CookieMgrMenu .cm-tx-table td {\r\n  padding: 3px 8px;\r\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\r\n  white-space: nowrap;\r\n  color: #d8cbb0;\r\n}\r\n#CookieMgrMenu .cm-tx-row:hover td {\r\n  background: rgba(255, 255, 255, 0.04);\r\n}\r\n#CookieMgrMenu .cm-tx-buy {\r\n  color: #8f8;\r\n  font-weight: bold;\r\n}\r\n#CookieMgrMenu .cm-tx-sell {\r\n  color: #f88;\r\n  font-weight: bold;\r\n}\r\n#CookieMgrMenu .cm-tx-empty {\r\n  padding: 14px 8px;\r\n  text-align: center;\r\n  font-style: italic;\r\n  color: #7f735f;\r\n  font-size: 12px;\r\n}\r\n\r\n#CookieMgrMenu .cm-tickbars {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 6px;\r\n  margin: 0 8px 8px;\r\n}\r\n#CookieMgrMenu .cm-tickbar {\r\n  flex: 1 1 90px;\r\n  min-width: 70px;\r\n  padding: 5px 6px;\r\n  background: rgba(0, 0, 0, 0.28);\r\n  border: 1px solid rgba(255, 255, 255, 0.1);\r\n  border-radius: 4px;\r\n  font-size: 10px;\r\n}\r\n#CookieMgrMenu .cm-tickbar-time {\r\n  color: #93866f;\r\n  text-align: center;\r\n  margin-bottom: 3px;\r\n  white-space: nowrap;\r\n}\r\n#CookieMgrMenu .cm-tickbar-row {\r\n  height: 5px;\r\n  background: rgba(255, 255, 255, 0.06);\r\n  border-radius: 3px;\r\n  margin-bottom: 2px;\r\n  overflow: hidden;\r\n}\r\n#CookieMgrMenu .cm-tickbar-fill {\r\n  display: block;\r\n  height: 100%;\r\n  border-radius: 3px;\r\n}\r\n#CookieMgrMenu .cm-tickbar-buy {\r\n  background: #8f8;\r\n}\r\n#CookieMgrMenu .cm-tickbar-sell {\r\n  background: #f88;\r\n}\r\n#CookieMgrMenu .cm-tickbar-net {\r\n  text-align: center;\r\n  font-weight: bold;\r\n  margin-top: 3px;\r\n}\r\n#CookieMgrMenu .cm-ticks-empty {\r\n  margin: 0 8px 8px;\r\n  padding: 10px;\r\n  text-align: center;\r\n  font-style: italic;\r\n  color: #7f735f;\r\n  font-size: 11px;\r\n}\r\n\r\n#CookieMgrMenu .cm-ticker {\r\n  margin: 8px 8px 10px;\r\n  padding: 6px 0;\r\n  overflow: hidden;\r\n  white-space: nowrap;\r\n  background: rgba(0, 0, 0, 0.32);\r\n  border: 1px solid rgba(255, 255, 255, 0.1);\r\n  border-radius: 4px;\r\n}\r\n#CookieMgrMenu .cm-ticker-track {\r\n  display: inline-block;\r\n  will-change: transform;\r\n}\r\n#CookieMgrMenu .cm-tick-item {\r\n  display: inline-block;\r\n  padding: 0 16px;\r\n  font:\r\n    bold 11px Tahoma,\r\n    Arial,\r\n    sans-serif;\r\n  color: #cbbfa6;\r\n}\r\n#CookieMgrMenu .cm-tick-buy {\r\n  color: #8f8;\r\n}\r\n#CookieMgrMenu .cm-tick-sell {\r\n  color: #f88;\r\n}\r\n#CookieMgrMenu .cm-tick-empty {\r\n  color: #7f735f;\r\n  font-style: italic;\r\n  font-weight: normal;\r\n}\r\n#CookieMgrMenu .cm-tick-sep {\r\n  color: #4a4232;\r\n  padding: 0 4px;\r\n}\r\n\r\n@keyframes cmTickerScroll {\r\n  from {\r\n    transform: translateX(0);\r\n  }\r\n  to {\r\n    transform: translateX(-50%);\r\n  }\r\n}\r\n";

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

  return { icon, toggle, hotkey, button, esc };
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
  let wrap = null;

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
    CA.Events.on('clickers', update);
    CA.Events.on('settings', update);
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
    click: { color: '#7fe08b', name: 'Clicking' },
  };
  const PAD = { r: 8, t: 10, b: 22 };
  const MIN_PAD_L = 30;
  const PAD_L_MARGIN = 10;
  const LANE_H = 8;
  const LANE_GAP = 2;
  const MAX_LANES = 6;
  const GAP_MS = 5000; // a longer hole between samples breaks the unbuffed line
  const BAR_PX = 5; // target on-screen width (bar + gap) of one stacked bar
  const BAR_GAP_FRAC = 0.18;
  const EVENT_SHADED_TOLERANCE_MS = 3000; // treat a golden/wrath pop as "shown by shading" if an effect starts this close to it

  let root = null;
  let canvas = null;
  let ctx = null;
  let tip = null;
  let observer = null;
  let timer = null;
  let hover = null; // { x, y } in css px
  let padL = 54; // dynamic left padding — last frame's width, refined each draw()
  let layout = null; // hit-test info from the last draw
  let panCtl = null; // from CA.UI.Chart.createView().attachPan(), set on mount

  const view = CA.UI.Chart.createView(); // module-level: survives tab switches, not just one mount
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

  // ---- data preparation ----------------------------------------------------------

  const windowMs = () => Math.max(10, S().get('graphWindow')) * 1000;
  const endTime = () => view.getEnd(Date.now());

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
      // older history is coarser (core/recorder.js): a frame covers dt seconds
      if (i && list[i].t - list[i - 1].t > Math.max(GAP_MS, 1500 * (list[i].dt || 1))) {
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

  function draw() {
    if (!canvas || !canvas.isConnected) return;
    const { w, h } = CA.UI.Chart.fitCanvas(canvas, ctx);
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

    // Unbuffed CpS is always shown as a reference line; production and clicking are stacked bars.
    const baseVals = smooth(
      list.map((s) => s.base),
      smoothK
    );
    const cpsVals = smooth(
      list.map((s) => s.cps),
      smoothK
    );
    const clickVals = smooth(
      list.map((s) => s.click),
      smoothK
    );
    const baseSeg = buildSegments(list.slice(cutoff), (i) => baseVals[i + cutoff], t0, W, plot.w);
    // Capped so a bucket is never narrower than one sample (~1s) — otherwise a short window
    // would ask for more buckets than there is data, striping every other bar empty.
    const barCount = Math.max(12, Math.min(240, Math.round(plot.w / BAR_PX), Math.floor(W / 1000)));
    const bucketMs = W / barCount;
    const bars = CA.UI.Chart.alignedBuckets(
      list.slice(cutoff),
      { cps: (i) => cpsVals[i + cutoff], click: (i) => clickVals[i + cutoff] },
      t0,
      t1,
      bucketMs
    );

    // --- y scale
    const log = S().get('graphLog');
    let maxV = 0;
    let minPos = Infinity;
    baseSeg.forEach((seg) =>
      seg.forEach((p) => {
        if (p.v > maxV) maxV = p.v;
        if (p.v > 0 && p.v < minPos) minPos = p.v;
      })
    );
    bars.forEach((b) => {
      const top = b.cps + b.click;
      if (top > maxV) maxV = top;
      if (b.cps > 0 && b.cps < minPos) minPos = b.cps;
    });
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
      const step = CA.UI.Chart.niceStep(yMax / 4);
      yMax = Math.ceil(yMax / step) * step;
      for (let v = 0; v <= yMax * 1.0001; v += step) ticks.push(v);
    }

    // Left padding fits whatever these tick labels actually render as (long-form Numbers
    // preferences, decillion+ names, ...) instead of a fixed guess that clips them.
    const tickLabels = ticks.map((v) => beautify(v, 0));
    padL = CA.UI.Chart.dynamicPadLeft(ctx, '10px Tahoma, Arial, sans-serif', tickLabels, MIN_PAD_L, PAD_L_MARGIN);
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

    // --- bars (production stacked with clicking) + unbuffed reference line
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y - 4, plot.w, chartH + 8);
    ctx.clip();

    const yBase = plot.y + chartH;
    bars.forEach((b) => {
      const xL = xOf(b.t0);
      const xR = xOf(b.t1);
      const full = xR - xL;
      const gap = full * BAR_GAP_FRAC;
      const x0 = xL + gap / 2;
      const wBar = Math.max(1, full - gap);
      const yCps = yOf(b.cps);
      ctx.fillStyle = SERIES.cps.color;
      ctx.fillRect(x0, yCps, wBar, Math.max(0, yBase - yCps));
      if (b.click > 0) {
        const yTotal = yOf(b.cps + b.click);
        ctx.fillStyle = SERIES.click.color;
        ctx.fillRect(x0, yTotal, wBar, Math.max(0, yCps - yTotal));
      }
    });

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const trace = (segs) => {
      segs.forEach((seg) => {
        if (!seg.length) return;
        ctx.beginPath();
        seg.forEach((p, i) => (i ? ctx.lineTo(xOf(p.t), yOf(p.v)) : ctx.moveTo(xOf(p.t), yOf(p.v))));
        if (seg.length === 1) ctx.lineTo(xOf(seg[0].t) + 0.01, yOf(seg[0].v));
      });
    };
    ctx.strokeStyle = SERIES.base.color;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    baseSeg.forEach((seg) => {
      trace([seg]);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // --- average line for the shown period
    const avgStats = CA.History.stats(t0, t1);
    if (avgStats.n > 0) {
      const yAvg = Math.round(yOf(avgStats.avg)) + 0.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y - 4, plot.w, chartH + 8);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(plot.x, yAvg);
      ctx.lineTo(plot.x + plot.w, yAvg);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = 'bold 9px Tahoma, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = yAvg - plot.y < 12 ? 'top' : 'bottom';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`avg ${beautify(avgStats.avg)}/s`, plot.x + 4, yAvg + (yAvg - plot.y < 12 ? 2 : -2));
      ctx.restore();
    }

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
        // A golden/wrath pop that opened a shaded effect band right at this moment is already
        // visible via the shading — skip the diamond so it isn't shown twice.
        const shownByShading =
          (ev.type === 'golden' || ev.type === 'wrath') && ivs.some((iv) => Math.abs(iv.start - ev.t) < EVENT_SHADED_TOLERANCE_MS);
        if (shownByShading) return;
        const x = xOf(ev.t);
        if (ev.type === 'ascend') {
          ctx.strokeStyle = 'rgba(200,190,255,0.7)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(Math.round(x) + 0.5, plot.y);
          ctx.lineTo(Math.round(x) + 0.5, plot.y + plot.h);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const y = plot.y + 7;
        ctx.fillStyle = eventColor(ev.type);
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

    layout = { plot, xOf, yOf, t0, t1, laneRects, evRects, hoverIv: null, chartH };

    // --- hover (suppressed mid-drag so the tooltip doesn't fight with panning)
    const dragging = panCtl && panCtl.isDragging();
    if (!dragging && hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) {
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
      // The bars are bucket averages, not point values, so only the continuous unbuffed
      // line gets a hover dot.
      ctx.fillStyle = SERIES.base.color;
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.arc(layout.xOf(near.t), layout.yOf(near.base), 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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
    let h = `<div class="ca-tip-head">${clock(t, true)}<span>${!view.isLive() || ago > 1.5 ? span(ago) + ' ago' : 'now'}</span></div>`;
    if (s) {
      const total = s.cps + s.click;
      h += row(SERIES.cps.color, SERIES.cps.name, beautify(s.cps) + '/s');
      if (s.click > 0.01) h += row(SERIES.click.color, SERIES.click.name, '+' + beautify(s.click) + '/s');
      h += row('transparent', 'Total', beautify(total) + '/s', true);
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
    let h = `<div class="ca-tip-head">${swatch(eventColor(ev.type))}${esc(ev.title)}<span>${clock(ev.t, true)}</span></div>`;
    if (ev.text) h += `<div class="ca-tip-note">${esc(ev.text)}</div>`;
    if (ev.type !== 'ascend' && Math.abs(ev.cookies) >= 1)
      h += row('transparent', ev.cookies >= 0 ? 'Cookies gained' : 'Cookies lost', (ev.cookies >= 0 ? '+' : '−') + beautify(Math.abs(ev.cookies)));
    return h;
  }

  function eventColor(kind) {
    return { golden: '#ffd54a', wrath: '#e5484d', reindeer: '#c48a5a', ascend: '#c9bcff' }[kind] || '#fff';
  }

  // ---- little canvas helpers ---------------------------------------------------------

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
  function seriesLabel(key) {
    return `<span class="ca-legend-item">${swatch(SERIES[key].color)}${SERIES[key].name}</span>`;
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
      '<div class="ca-chipgroup" title="What the bars and line show">' +
      seriesLabel('cps') +
      seriesLabel('click') +
      seriesLabel('base') +
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
      chip('', 'data-ca="gpause" data-ca-pause', 'Drag the chart (or scroll it sideways) to look further back') +
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
      live.textContent = view.isLive() ? 'Live' : 'Paused';
      live.classList.toggle('paused', !view.isLive());
    }
    const pause = root.querySelector('[data-ca-pause]');
    if (pause) pause.textContent = view.isLive() ? 'Pause' : 'Jump to live';

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
    panCtl = view.attachPan(
      canvas,
      () => ({
        windowMs: windowMs(),
        plotWidthPx: (layout && layout.plot.w) || canvas.clientWidth,
        liveNow: Date.now(),
        minT: CA.History.samples[0] && CA.History.samples[0].t,
      }),
      draw
    );
    timer = setInterval(tick, 250);
    tick();
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (observer) observer.disconnect();
    observer = null;
    if (panCtl) panCtl.detach();
    panCtl = null;
    root = canvas = ctx = tip = null;
    hover = null;
    layout = null;
  }

  function setPaused(p) {
    if (p === !view.isLive()) return;
    if (p) view.freeze(Date.now());
    else view.resume();
    tick();
  }
  const isPaused = () => !view.isLive();

  function init() {
    const S_ = CA.Settings;
    // Chip-selected (not boolean), so they're kept out of the generic Settings-tab option list;
    // the toolbar chips above are still the way to change them.
    S_.defineOption({ key: 'graphWindow', group: 'graph-select', name: 'Time window', desc: '', default: 300 });
    S_.defineOption({ key: 'graphSmooth', group: 'graph-select', name: 'Smoothing', desc: '', default: 5 });
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
// yourself; "Per stock" switches back to individual price lines. Data comes from the recorder
// (core/recorder.js): the price:<id> and portfolio* states defined by features/stocks.js and
// features/gameStates.js.

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
  let panCtl = null;

  const view = CA.UI.Chart.createView(); // module-level: survives tab switches
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

  /** One stock's recorded price as { t, v } points. */
  const priceHistory = (id) => CA.Recorder.series(`price:${id}`);

  let portfolioCache = { rev: -1, pts: [] };
  /** Recorded portfolio totals as { t, value, cost, unrealized, realized, gain } points. */
  function portfolioHistory() {
    const rev = CA.Recorder.revision();
    if (portfolioCache.rev !== rev) {
      const pts = [];
      CA.Recorder.frames().forEach((f) => {
        if (!Number.isFinite(f.portfolioValue)) return;
        const cost = f.portfolioCost || 0;
        const realized = f.portfolioRealized || 0;
        const unrealized = f.portfolioValue - cost;
        pts.push({ t: f.t, value: f.portfolioValue, cost, unrealized, realized, gain: unrealized + realized });
      });
      portfolioCache = { rev, pts };
    }
    return portfolioCache.pts;
  }

  const mode = () => (S().get('stockGraphMode') === 'perStock' ? 'perStock' : 'portfolio');
  const dragging = () => !!(panCtl && panCtl.isDragging());

  function visibleStocks() {
    const all = CA.Stocks.list();
    return S().get('stockGraphSync') ? all.filter((g) => g.owned) : all;
  }

  // ---- drawing -------------------------------------------------------------------

  /** Builds { x, w, yMin, yMax, yOf, ticks } for a set of values, sizing the left padding
   *  to whatever those tick labels actually render as (so they never clip). Ticks are "nice"
   *  round numbers (CA.UI.Chart.niceLinearScale) rather than raw evenly-spaced fractions of
   *  whatever the data's min/max happen to be. */
  function scaleFor(w, plotY, plotH, values) {
    let minV = Infinity;
    let maxV = -Infinity;
    values.forEach((v) => {
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    });
    const { yMin, yMax, ticks } = CA.UI.Chart.niceLinearScale(minV, maxV);

    padL = CA.UI.Chart.dynamicPadLeft(
      ctx,
      FONT,
      ticks.map((v) => beautify(v, 0)),
      MIN_PAD_L,
      PAD_L_MARGIN
    );
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
    const t1 = view.getEnd(Date.now());
    const t0 = t1 - W;
    const hist = portfolioHistory();
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

    if (!dragging() && hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) drawHoverPortfolio(w, h);
    else if (tip) tip.style.display = 'none';

    if (!pts.length) emptyMsg(plot, 'Open the Bank minigame to start tracking your portfolio.');
  }

  function drawPerStock(w, h) {
    const stocks = visibleStocks();
    const W = Math.max(10, S().get('graphWindow')) * 1000;
    const t1 = view.getEnd(Date.now());
    const t0 = t1 - W;

    const lines = stocks.map((g, i) => {
      const hist = priceHistory(g.id);
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

    if (!dragging() && hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) drawHoverPerStock(w, h);
    else if (tip) tip.style.display = 'none';

    if (!stocks.length) {
      emptyMsg(plot, S().get('stockGraphSync') ? "You don't own any stocks right now." : 'Open the Bank minigame to start tracking prices.');
    }
  }

  function draw() {
    if (!canvas || !canvas.isConnected) return;
    const { w, h } = CA.UI.Chart.fitCanvas(canvas, ctx);
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
      '<div class="ca-card-head"><div class="ca-card-title">Stock market</div>' +
      '<div class="ca-card-meta"><span class="ca-live" data-ca-stock-live></span></div></div>' +
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
      '<div class="ca-chipgroup">' +
      chip('', 'data-ca="sgpause" data-ca-stock-pause', 'Drag the chart (or scroll it sideways) to look further back') +
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

  function earliestDataT() {
    if (mode() === 'perStock') {
      const times = visibleStocks()
        .map((g) => priceHistory(g.id)[0])
        .filter(Boolean)
        .map((p) => p.t);
      return times.length ? Math.min(...times) : undefined;
    }
    const hist = portfolioHistory();
    return hist.length ? hist[0].t : undefined;
  }

  function refreshInfo() {
    if (!root) return;
    const perStock = mode() === 'perStock';
    const only = root.querySelector('[data-ca-perstock-only]');
    if (only) only.classList.toggle('ca-hidden', !perStock);

    const live = root.querySelector('[data-ca-stock-live]');
    if (live) {
      live.textContent = view.isLive() ? 'Live' : 'Paused';
      live.classList.toggle('paused', !view.isLive());
    }
    const pause = root.querySelector('[data-ca-stock-pause]');
    if (pause) pause.textContent = view.isLive() ? 'Pause' : 'Jump to live';

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
    panCtl = view.attachPan(
      canvas,
      () => ({
        windowMs: Math.max(10, S().get('graphWindow')) * 1000,
        plotWidthPx: (layout && layout.plot.w) || canvas.clientWidth,
        liveNow: Date.now(),
        minT: earliestDataT(),
      }),
      draw
    );
    timer = setInterval(tick, 250);
    tick();
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (observer) observer.disconnect();
    observer = null;
    if (panCtl) panCtl.detach();
    panCtl = null;
    root = canvas = ctx = tip = null;
    hover = null;
    layout = null;
  }

  function setPaused(p) {
    if (p === !view.isLive()) return;
    if (p) view.freeze(Date.now());
    else view.resume();
    tick();
  }
  const isPaused = () => !view.isLive();

  function init() {}

  return { init, html, mount, unmount, tick, setPaused, isPaused };
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

  function optionRow(def) {
    return (
      `<div class="ca-row ca-row-option" data-option="${def.key}">` +
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

  function stocksPage() {
    return (
      sellAllCard() +
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Stock market</div></div>' +
      `<div class="ca-list">${stockTraderRow()}</div>` +
      '</div>' +
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Options</div></div>' +
      `<div class="ca-list">${CA.Settings.optionsIn('stocks').map(optionRow).join('')}</div>` +
      '</div>' +
      CA.UI.StockGraph.html() +
      CA.UI.StockLog.html()
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
      '<div class="ca-row-text"><div class="ca-row-name">Hotkeys</div>' +
      '<div class="ca-row-desc">Click a key chip, then press the new key. <kbd>Esc</kbd> cancels, <kbd>Backspace</kbd> removes it; modifiers work too.</div></div>' +
      C.button('Reset to defaults', 'data-ca="reset-hotkeys"', 'ca-btn-small') +
      '</div>' +
      '</div>' +
      '</div>' +
      historyCard() +
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
      `<div class="ca-card-head"><div class="ca-card-title">History data</div></div>` +
      '<div class="ca-list">' +
      '<div class="ca-row ca-row-option">' +
      '<div class="ca-row-text"><div class="ca-row-name">Recorded for this save</div>' +
      '<div class="ca-row-desc" data-ca-history-info></div></div>' +
      '</div>' +
      '<div class="ca-row ca-row-option">' +
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
      '<div class="ca-card-head"><div class="ca-card-title">Integrations</div></div>' +
      '<div class="ca-list">' +
      '<div class="ca-row ca-row-option">' +
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
    html: () => CA.UI.Graph.html(),
    mount: (root) => CA.UI.Graph.mount(root),
    unmount: () => CA.UI.Graph.unmount(),
    tick: () => CA.UI.Graph.tick(),
  });
  CA.UI.Pages.register({
    id: 'stocks',
    label: 'Stock market',
    icon: 'stocks',
    order: 40,
    html: () => stocksPage(),
    mount: (root) => {
      CA.UI.StockGraph.mount(root);
      CA.UI.StockLog.mount(root);
      wireSellAll(root);
    },
    unmount: () => {
      CA.UI.StockGraph.unmount();
      CA.UI.StockLog.unmount();
    },
    tick: () => {
      CA.UI.StockGraph.tick();
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
      case 'sgpause':
        CA.Util.sound('snd/tick.mp3');
        CA.UI.StockGraph.setPaused(!CA.UI.StockGraph.isPaused());
        break;
      case 'gpause':
        CA.Util.sound('snd/tick.mp3');
        CA.UI.Graph.setPaused(!CA.UI.Graph.isPaused());
        break;
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
    CA.UI.Graph.init();
    CA.UI.StockGraph.init();
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
