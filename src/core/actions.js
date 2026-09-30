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
