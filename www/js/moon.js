/* Moon phase calculations (Meeus, Astronomical Algorithms ch. 49) — fully offline. */
(function () {
  const rad = d => d * Math.PI / 180;
  const SYN = 29.530588861;
  const PHASES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

  function jdToDate(jd) { return new Date((jd - 2440587.5) * 86400000); }
  function dateToJd(d) { return d.getTime() / 86400000 + 2440587.5; }

  // q: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter
  function truePhase(kInt, q) {
    const k = kInt + q, T = k / 1236.85;
    let jde = 2451550.09766 + SYN * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = rad(2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3);
    const Mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4);
    const F = rad(160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4);
    const O = rad(124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3);
    const s = Math.sin; let c = 0;
    if (q === 0 || q === 0.5) {
      const nm = q === 0;
      c = (nm ? -0.4072 : -0.40614) * s(Mp) + (nm ? 0.17241 : 0.17302) * E * s(M) + (nm ? 0.01608 : 0.01614) * s(2 * Mp)
        + (nm ? 0.01039 : 0.01043) * s(2 * F) + (nm ? 0.00739 : 0.00734) * E * s(Mp - M) - (nm ? 0.00514 : 0.00515) * E * s(Mp + M)
        + (nm ? 0.00208 : 0.00209) * E * E * s(2 * M) - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M)
        - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F) - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O)
        - 0.00007 * s(Mp + 2 * M) + 0.00004 * s(2 * Mp - 2 * F) + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F) + 0.00003 * s(2 * Mp + 2 * F)
        - 0.00003 * s(Mp + M + 2 * F) + 0.00003 * s(Mp - M + 2 * F) - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M) + 0.00002 * s(4 * Mp);
    } else {
      c = -0.62801 * s(Mp) + 0.17172 * E * s(M) - 0.01183 * E * s(Mp + M) + 0.00862 * s(2 * Mp) + 0.00804 * s(2 * F) + 0.00454 * E * s(Mp - M)
        + 0.00204 * E * E * s(2 * M) - 0.0018 * s(Mp - 2 * F) - 0.0007 * s(Mp + 2 * F) - 0.0004 * s(3 * Mp) - 0.00034 * E * s(2 * Mp - M)
        + 0.00032 * E * s(M + 2 * F) + 0.00032 * E * s(M - 2 * F) - 0.00028 * E * E * s(Mp + 2 * M) + 0.00027 * E * s(2 * Mp + M) - 0.00017 * s(O)
        - 0.00005 * s(Mp - M - 2 * F) + 0.00004 * s(2 * Mp + 2 * F) - 0.00004 * s(Mp + M + 2 * F) + 0.00004 * s(Mp - 2 * M)
        + 0.00003 * s(Mp + M - 2 * F) + 0.00003 * s(3 * M) + 0.00002 * s(2 * Mp - 2 * F) + 0.00002 * s(Mp - M + 2 * F) - 0.00002 * s(3 * Mp + M);
      const W = 0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Mp) - 0.00002 * Math.cos(Mp - M) + 0.00002 * Math.cos(Mp + M) + 0.00002 * Math.cos(2 * F);
      c += q === 0.25 ? W : -W;
    }
    jde += c;
    return jdToDate(jde - 69.2 / 86400); // TT -> UT (approx. ΔT)
  }

  const NAMES = ['Wolf Moon', 'Snow Moon', 'Worm Moon', 'Pink Moon', 'Flower Moon', 'Strawberry Moon', 'Buck Moon', 'Sturgeon Moon', 'Corn Moon', "Hunter's Moon", 'Beaver Moon', 'Cold Moon'];
  const PHASE_INFO = {
    'New Moon': 'Plant seeds of intention, new beginnings, rest and inner work.',
    'Waxing Crescent': 'Gather energy: attraction, luck, building and drawing magic.',
    'First Quarter': 'Take action, courage and decisions; push through obstacles.',
    'Waxing Gibbous': 'Refine and nurture; patience, healing, strengthening workings.',
    'Full Moon': 'Peak power: divination, charging tools, moon water, gratitude and celebration.',
    'Waning Gibbous': 'Gratitude and sharing wisdom; begin releasing what no longer serves.',
    'Last Quarter': 'Banish, break habits, cut cords, cleanse and forgive.',
    'Waning Crescent': 'Rest, reflection, banishing and shadow work; surrender before rebirth.',
    'Dark Moon': 'The hidden face: shadow work, hex breaking, ancestor work and deep divination.',
  };

  // list principal phases between two dates
  function phasesBetween(from, to) {
    const out = [];
    const y = from.getUTCFullYear() + from.getUTCMonth() / 12;
    let k = Math.floor((y - 2000) * 12.3685) - 1;
    for (; ; k++) {
      let stop = false;
      for (const q of [0, 0.25, 0.5, 0.75]) {
        const d = truePhase(k, q);
        if (d > to) { stop = true; break; }
        if (d >= from) out.push({ date: d, phase: PHASES[q * 8], q });
      }
      if (stop) break;
    }
    // name full moons (by local month) & detect blue moons
    const seen = {};
    out.forEach(p => {
      if (p.q !== 0.5) return;
      const key = p.date.getFullYear() + '-' + p.date.getMonth();
      p.moonName = (seen[key] ? 'Blue Moon · ' : '') + NAMES[p.date.getMonth()];
      seen[key] = 1;
    });
    return out;
  }

  /* Precise Moon & Sun positions (Meeus, Astronomical Algorithms ch. 47, 25 and 48).
     The Moon uses the full main-term tables; the phase angle accounts for the Earth–Moon and Earth–Sun
     distances, so the lit fraction is good to about 0.01% (far finer than the eye can see). */
  const LR = [ // D M M' F  Σl(1e-6°)  Σr(1e-3 km)
    [0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],
    [0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],
    [0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],[0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],
    [0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],
    [2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],[2,0,2,0,3994,-10445],
    [4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],
    [1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],[0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],
    [2,0,1,-2,-1773,4130],[2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],[3,0,-1,0,-892,3258],
    [2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],[0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],
    [2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],[4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],
    [2,1,0,-2,-399,0],[0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],[4,0,-3,0,330,0],
    [2,-1,2,0,327,0],[0,2,1,0,-323,1165],[1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]];
  const BT = [ // D M M' F  Σb(1e-6°)
    [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],
    [2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
    [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],
    [4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],
    [0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],[4,0,0,-1,1021],[4,0,-1,1,833]];
  function moonPosition(jde) {
    const T = (jde - 2451545) / 36525, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
    const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;
    const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T, A3 = 313.45 + 481266.484 * T;
    const E = 1 - 0.002516 * T - 0.0000074 * T2, Ef = m => Math.abs(m) === 2 ? E * E : Math.abs(m) === 1 ? E : 1;
    let sl = 0, sr = 0, sb = 0;
    for (const [d, m, mp, f, l, r] of LR) { const a = rad(d * D + m * M + mp * Mp + f * F), e = Ef(m); sl += l * e * Math.sin(a); sr += r * e * Math.cos(a); }
    for (const [d, m, mp, f, b] of BT) sb += b * Ef(m) * Math.sin(rad(d * D + m * M + mp * Mp + f * F));
    sl += 3958 * Math.sin(rad(A1)) + 1962 * Math.sin(rad(Lp - F)) + 318 * Math.sin(rad(A2));
    sb += -2235 * Math.sin(rad(Lp)) + 382 * Math.sin(rad(A3)) + 175 * Math.sin(rad(A1 - F)) + 175 * Math.sin(rad(A1 + F)) + 127 * Math.sin(rad(Lp - Mp)) - 115 * Math.sin(rad(Lp + Mp));
    return { lon: Lp + sl / 1e6, lat: sb / 1e6, dist: 385000.56 + sr / 1000 };
  }
  function sunPosition(jde) {
    const T = (jde - 2451545) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T, M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(rad(M)) + (0.019993 - 0.000101 * T) * Math.sin(rad(2 * M)) + 0.000289 * Math.sin(rad(3 * M));
    const v = M + C, R = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(rad(v)));
    const Om = 125.04 - 1934.136 * T;
    return { lon: L0 + C - 0.00569 - 0.00478 * Math.sin(rad(Om)), dist: R * 149597870.7 };
  }
  // fraction of the Moon's disc lit by the Sun at this moment, and whether it is growing
  function illumination(date = new Date()) {
    const jde = dateToJd(date) + 69.2 / 86400; // UT -> TT
    const m = moonPosition(jde), s = sunPosition(jde);
    const dl = rad(m.lon - s.lon), cpsi = Math.cos(rad(m.lat)) * Math.cos(dl), psi = Math.acos(Math.max(-1, Math.min(1, cpsi)));
    const i = Math.atan2(s.dist * Math.sin(psi), m.dist - s.dist * cpsi); // phase angle
    return { illum: (1 + Math.cos(i)) / 2, waxing: Math.sin(dl) > 0, phaseAngle: i * 180 / Math.PI, elongation: psi * 180 / Math.PI, moon: m };
  }

  function current(now = new Date()) {
    const back = phasesBetween(new Date(now.getTime() - 32 * 864e5), now).filter(p => p.q === 0);
    const lastNew = back.length ? back[back.length - 1].date : new Date(now.getTime() - 15 * 864e5);
    const age = (now - lastNew) / 864e5;
    // true illuminated fraction, calculated for this exact moment from the Moon's and Sun's positions
    const { illum, waxing: waxingNow } = illumination(now);
    const half = Math.acos(1 - 2 * illum) / (2 * Math.PI); // 0..0.5
    const f = waxingNow ? half : 1 - half; // drawing fraction: 0 new, .5 full
    // phase name: principal phases ±~1 day around exact
    const upcoming = phasesBetween(new Date(now.getTime() - 1.1 * 864e5), new Date(now.getTime() + 1.1 * 864e5));
    let name;
    const near = upcoming.find(p => Math.abs(p.date - now) < 864e5 * (p.q === 0 ? 1.1 : 1));
    if (near) name = near.phase;
    else name = f < 0.25 ? 'Waxing Crescent' : f < 0.5 ? 'Waxing Gibbous' : f < 0.75 ? 'Waning Gibbous' : 'Waning Crescent';
    return { fraction: f, age, illum, name, dark: illum < 0.02, info: PHASE_INFO[name], waxing: f < 0.5 };
  }

  // moon SVG for phase fraction f (0 new -> .5 full -> 1)
  function svg(f, size = 100) {
    const r = 44, cx = 50, cy = 50;
    const k = Math.cos(2 * Math.PI * f); // 1 new, -1 full
    const rx = Math.abs(k) * r;
    const waxing = f < 0.5;
    // lit side: right when waxing
    const sweepOuter = waxing ? 1 : 0;
    const gibbous = k < 0;
    const sweepInner = waxing ? (gibbous ? 1 : 0) : (gibbous ? 0 : 1);
    const lit = `M${cx} ${cy - r} A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}Z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <defs><radialGradient id="mg${size}" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#fff6dc"/><stop offset=".7" stop-color="#e6d3a3"/><stop offset="1" stop-color="#b79c63"/></radialGradient></defs>
      <circle cx="50" cy="50" r="${r}" fill="#2a2238" stroke="rgba(212,173,90,.45)" stroke-width="1"/>
      <path d="${lit}" fill="url(#mg${size})"/>
      <circle cx="38" cy="40" r="5" fill="rgba(120,100,70,.18)"/><circle cx="60" cy="62" r="7" fill="rgba(120,100,70,.15)"/><circle cx="62" cy="34" r="3" fill="rgba(120,100,70,.18)"/>
    </svg>`;
  }
  // a real photograph of the full moon, masked to show only the sunlit part for phase fraction f.
  // The faint unlit side is earthshine. Southern hemisphere viewers see the moon turned upside down.
  let uid = 0;
  function photo(f, size = 100) {
    const id = 'mp' + (++uid), r = 49, cx = 50, cy = 50;
    const k = Math.cos(2 * Math.PI * f), rx = Math.abs(k) * r, waxing = f < 0.5, gibbous = k < 0;
    const sweepOuter = waxing ? 1 : 0, sweepInner = waxing ? (gibbous ? 1 : 0) : (gibbous ? 0 : 1);
    const lit = `M${cx} ${cy - r} A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}Z`;
    const full = Math.abs(f - .5) < 0.003, blur = Math.max(0.5, 1.6 * 100 / Math.max(size, 40));
    const rot = MOON.south ? ' transform="rotate(180 50 50)"' : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" class="moon-photo">
      <defs><clipPath id="${id}c"><circle cx="50" cy="50" r="${r}"/></clipPath>
        <filter id="${id}b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${blur.toFixed(2)}"/></filter>
        <filter id="${id}l" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="${(1.18 * MOON.bright).toFixed(3)}" exponent="${(.78 / Math.sqrt(MOON.bright)).toFixed(3)}" offset=".02"/><feFuncG type="gamma" amplitude="${(1.17 * MOON.bright).toFixed(3)}" exponent="${(.78 / Math.sqrt(MOON.bright)).toFixed(3)}" offset=".02"/><feFuncB type="gamma" amplitude="${(1.12 * MOON.bright).toFixed(3)}" exponent="${(.8 / Math.sqrt(MOON.bright)).toFixed(3)}" offset=".02"/></feComponentTransfer></filter>
        <mask id="${id}m"><rect width="100" height="100" fill="#000"/>${full ? `<circle cx="50" cy="50" r="${r}" fill="#fff"/>` : `<path d="${lit}" fill="#fff" filter="url(#${id}b)"/>`}</mask>
        <radialGradient id="${id}g" cx="50%" cy="50%" r="50%"><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs>
      <g${rot}><g clip-path="url(#${id}c)">
        <circle cx="50" cy="50" r="${r}" fill="#0c0b12"/>
        <image href="${MOON.IMG}" x="1" y="1" width="98" height="98" opacity=".13" preserveAspectRatio="xMidYMid slice"/>
        <g mask="url(#${id}m)"><image href="${MOON.IMG}" x="1" y="1" width="98" height="98" filter="url(#${id}l)" preserveAspectRatio="xMidYMid slice"/></g>
        <circle cx="50" cy="50" r="${r}" fill="url(#${id}g)"/></g>
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(230,220,200,.12)" stroke-width=".6"/></g>
    </svg>`;
  }
  const PRINCIPAL_F = { 'New Moon': 0, 'First Quarter': .25, 'Full Moon': .5, 'Last Quarter': .75 };

  // Wheel of the Year (northern hemisphere, approximate dates)
  function sabbats(year) {
    return [
      ['Imbolc', 1, 1], ['Ostara', 2, 20], ['Beltane', 4, 1], ['Litha', 5, 21], ['Lughnasadh', 7, 1], ['Mabon', 8, 22], ['Samhain', 9, 31], ['Yule', 11, 21],
    ].map(([n, m, d]) => ({ name: n, date: new Date(year, m, d) }));
  }

  window.MOON = { illumination, moonPosition, bright: 1, IMG: 'img/moon/full-moon.jpg', south: false, photo, phasesBetween, current, svg, PHASES, PHASE_INFO, PRINCIPAL_F, sabbats, ALL_PHASES: [...PHASES.slice(0, 8), 'Dark Moon'] };
})();
