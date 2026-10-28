// A seeded random number generator (sfc32), so a simulation with the same seed plays out the same
// way: it replaces Math.random in the simulated page — the game's and cookieMgr's.

export function makeRng(seed = 1) {
  // seed → four 32-bit words (splitmix32)
  let s = (Number(seed) >>> 0) || 0x9e3779b9;
  const mix = () => {
    s = (s + 0x9e3779b9) | 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
  let a = mix();
  let b = mix();
  let c = mix();
  let d = mix();
  const next = () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const r = (t + d) | 0;
    c = (c + r) | 0;
    return (r >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  return next;
}
