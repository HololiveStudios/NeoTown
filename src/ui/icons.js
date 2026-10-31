export const SPR = {
  hammer: ['..XXXX..', '.XXXXXX.', '.XXXXXX.', '..XXoo..', '...oo...', '...oo...', '...oo...', '...oo...'],
  coin: ['..oooo..', '.oXXXXo.', 'oXXooXXo', 'oXXoXXXo', 'oXXXXoXo', 'oXXooXXo', '.oXXXXo.', '..oooo..'],
  pop: ['...XX...', '..XXXX..', '..XXXX..', '...XX...', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX'],
  smile: ['..XXXX..', '.XXXXXX.', 'XXoXXoXX', 'XXXXXXXX', 'XoXXXXoX', 'XXooooXX', '.XXXXXX.', '..XXXX..'],
  flat: ['..XXXX..', '.XXXXXX.', 'XXoXXoXX', 'XXXXXXXX', 'XXXXXXXX', 'XXooooXX', '.XXXXXX.', '..XXXX..'],
  sad: ['..XXXX..', '.XXXXXX.', 'XXoXXoXX', 'XXXXXXXX', 'XXooooXX', 'XoXXXXoX', '.XXXXXX.', '..XXXX..'],
  gear: ['...XX...', '.X.XX.X.', '..XXXX..', 'XXX..XXX', 'XXX..XXX', '..XXXX..', '.X.XX.X.', '...XX...'],
  mag: ['.XXXX...', 'X....X..', 'X....X..', 'X....X..', '.XXXX...', '....oo..', '.....oo.', '......oo'],
  dozer: ['........', '..XXXX..', '..XXXXo.', 'XXXXXXoo', 'XXXXXXXX', 'oXoXoXoX', '.oooooo.', '........'],
  road: ['XXXXXXXX', 'XXXooXXX', 'XXXXXXXX', 'XXXXXXXX', 'XXXooXXX', 'XXXXXXXX', 'XXXXXXXX', 'XXXooXXX'],
  zone: ['...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', '.oooooo.', '.oo..oo.', '.oo..oo.', '.oooooo.'],
  bolt: ['....XX..', '...XX...', '..XX....', '.XXXXXX.', '...XX...', '..XX....', '.XX.....', 'XX......'],
  drop: ['...XX...', '...XX...', '..XXXX..', '.XXXXXX.', 'XXXXoXXX', 'XXXXoXXX', '.XXXXXX.', '..XXXX..'],
  shield: ['XXXXXXXX', 'XXXooXXX', 'XXooooXX', 'XXXooXXX', 'XXXooXXX', '.XXooXX.', '..XXXX..', '...XX...'],
  cross: ['..XXXX..', '..XXXX..', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '..XXXX..', '..XXXX..'],
  school: ['...XX...', '.XXXXXX.', 'XXXXXXXX', '.XXXXXX.', '..oooo..', '..oooo..', '..o..o..', '........'],
  flame: ['...X....', '...XX...', '..XXX...', '.XXXXX..', '.XXoXXX.', 'XXXooXXX', 'XXoooXXX', '.XXXXXX.'],
  tree: ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '...oo...', '...oo...', '..oooo..'],
  bank: ['...XX...', '..XXXX..', 'XXXXXXXX', '.X.XX.X.', '.X.XX.X.', '.X.XX.X.', 'XXXXXXXX', 'XXXXXXXX'],
  globe: ['..XXXX..', '.XXoXXX.', 'XXoooXXX', 'XXXoXXoX', 'XXXXooXX', 'XXXoooXX', '.XXXooX.', '..XXXX..'],
  gift: ['..X..X..', '.XXXXXX.', 'XXXooXXX', 'XXXooXXX', 'XXXXXXXX', 'XXXooXXX', 'XXXooXXX', 'XXXXXXXX'],
  clock: ['..XXXX..', '.XooooX.', 'XoooXooX', 'XoooXooX', 'XoooXXoX', 'XooooooX', '.XooooX.', '..XXXX..'],
  fist: ['.XXXXX..', 'XXXXXXX.', 'XXXXXXX.', 'XXXXXXX.', '.XXXXX..', '..ooo...', '..ooo...', '..ooo...']
};

export const COL = {
  hammer: ['#cfd6e4', '#c8803a'], coin: ['#ffd23a', '#a8721a'], pop: ['#8fd4ff', '#8fd4ff'],
  smile: ['#ffd23a', '#5a3a00'], flat: ['#ffb030', '#5a3000'], sad: ['#ff6a50', '#5a0a00'],
  gear: ['#cfd6e4', '#cfd6e4'], mag: ['#cfe8ff', '#c8803a'], dozer: ['#ffc83a', '#555e70'],
  road: ['#707888', '#f0e070'], zone: ['#e05a4a', '#e8dcc0'], bolt: ['#ffe04a', '#ffe04a'],
  drop: ['#4aa8ff', '#e6f4ff'], shield: ['#4a78f0', '#e8eefc'], cross: ['#e84a4a', '#e84a4a'],
  school: ['#34343c', '#e8c860'], flame: ['#ff8a2a', '#ffe060'], tree: ['#3fb860', '#8a5a30'],
  bank: ['#e8dcc0', '#e8dcc0'], fist: ['#ffcf9a', '#d05040'], globe: ['#4aa8ff', '#3fb860'],
  gift: ['#ff6aa8', '#ffe060'], clock: ['#e8f4ff', '#2a4a6a']
};

const IC = {};

export function iconUrl(n, a, b) {
  const k = n + a + b;
  if (IC[k]) return IC[k];
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const x = c.getContext('2d');
  SPR[n].forEach((row, y) => {
    for (let i = 0; i < 8; i++) {
      const ch = row[i];
      if (ch === 'X' || ch === 'o') {
        x.fillStyle = ch === 'X' ? a : b;
        x.fillRect(i, y, 1, 1);
      }
    }
  });
  return (IC[k] = 'url(' + c.toDataURL() + ')');
}

export const ic = (n, s, a, b) => {
  const c = COL[n];
  s = s || 2;
  return '<i class="ic" style="width:' + 8 * s + 'px;height:' + 8 * s + 'px;background-image:' + iconUrl(n, a || c[0], b || c[1]) + '"></i>';
};

export const CATI = {
  info: 'mag', road: 'road', zone: 'zone', sky: 'bank',
  power: 'bolt', water: 'drop', serv: 'shield', rec: 'tree', bull: 'dozer'
};

export const ITI = {
  inspect: ['mag'], road: ['road'], power: ['bolt'], pipe: ['drop'],
  res: ['zone', '#58d878', '#d8f4d8'], com: ['zone', '#5a9af4', '#d8e6fc'], ind: ['zone', '#f0c84a', '#7a5a20'],
  sky_res: ['bank', '#7ce69a', '#266840'], sky_com: ['bank', '#6ab8ff', '#1c4678'],
  landmark: ['globe', '#ffd85a', '#4a98f0'], mega: ['bank', '#ffe26a', '#4a7cf0'],
  coal: ['flame', '#8a8a92', '#d0d0d8'], solar: ['bolt', '#6ab0ff', '#6ab0ff'],
  wtower: ['drop'], police: ['shield'], fire: ['flame'], hosp: ['cross'],
  school: ['school'], park: ['tree'], tree: ['tree', '#6fd870', '#8a5a30'], bulldoze: ['dozer']
};

export const itIc = (id, s) => {
  const a = ITI[id] || ['mag'];
  return ic(a[0], s, a[1], a[2]);
};
