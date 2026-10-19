// Poziomy Przygody 4. Mapa: '.' owoc, '#' brak pola, 'w' chwast pod owocem, 'c'/'C' skrzynka (1/2 uderzenia),
// 'x' pajęczyna na owocu, 'X' pajęczyna + chwast, 'j' słoik konfitury, 'b' Sroka (blok 2×2).
// Cele: col (zbierz owoce koloru), weed, crate, web, jar, boss. n: 'auto' = policz z mapy.
// moves i stars ustawia symulator (tools/sim.js).
(function (root) {
  'use strict';
  const LEVELS = [
    {
      name: 'Pierwsze truskawki', reward: 'Grządka truskawek', colors: 4, moves: 11, stars: [8400, 12300],
      tip: 'Przesuń owoc, żeby ułożyć trzy takie same w rzędzie.',
      goals: [{ type: 'col', col: 0, n: 45 }],
      map: ['.......', '.......', '.......', '.......', '.......', '.......', '.......']
    },
    {
      name: 'Jabłka i śliwki', reward: 'Płotek', colors: 4, moves: 10, stars: [10100, 15800],
      tip: 'Cztery w rzędzie dają marchew-rakietę!',
      goals: [{ type: 'col', col: 1, n: 40 }, { type: 'col', col: 2, n: 40 }],
      map: ['.......', '.......', '.......', '.......', '.......', '.......', '.......', '.......']
    },
    {
      name: 'Chwasty!', reward: 'Jabłoń', colors: 5, moves: 16, stars: [4500, 6400],
      tip: 'Zbij owoce stojące na chwastach. Kwadrat 2×2 wypuszcza motylka.',
      goals: [{ type: 'weed', n: 'auto' }],
      map: ['........', '........', '..wwww..', '.wwwwww.', '.wwwwww.', '..wwww..', '........', '........']
    },
    {
      name: 'Skrzynki babci', reward: 'Ławka', colors: 5, moves: 14, stars: [3600, 4700],
      tip: 'Skrzynka pęka, gdy ułożysz owoce tuż obok niej.',
      goals: [{ type: 'crate', n: 'auto' }],
      map: ['........', '........', 'c......c', 'cc.cc.cc', '........', '..cccc..', '........', '........']
    },
    {
      name: 'Owocowa rakieta', reward: 'Budka dla Persiego', colors: 5, moves: 20, stars: [7100, 9300],
      tip: 'Ułóż L albo T – powstanie dynia-bomba. Pięć w rzędzie to kłębek Persiego!',
      goals: [{ type: 'col', col: 3, n: 45 }, { type: 'col', col: 4, n: 45 }],
      map: ['........', '........', '........', '........', '........', '........', '........', '........']
    },
    {
      name: 'Konfitury', reward: 'Kwiaty babci', colors: 5, moves: 30, stars: [6100, 8500],
      tip: 'Sprowadź słoiki z konfiturą na sam dół planszy.',
      goals: [{ type: 'jar', n: 2 }],
      map: ['..j..j..', '........', '........', '........', '........', '........', '........']
    },
    {
      name: 'Serce ogrodu', reward: 'Ścieżka', colors: 5, moves: 13, stars: [3600, 4500],
      goals: [{ type: 'weed', n: 'auto' }],
      map: ['.##..##.', '........', '..wwww..', '.wwwwww.', '.wwwwww.', '..wwww..', '#..ww..#', '##....##']
    },
    {
      name: 'Pajęczyny', reward: 'Studnia', colors: 5, moves: 17, stars: [4200, 5800],
      tip: 'Owoc w pajęczynie się nie rusza. Ułóż go w rzędzie, żeby go uwolnić.',
      goals: [{ type: 'web', n: 'auto' }],
      map: ['........', '........', '.x....x.', '..x..x..', '...xx...', '..x..x..', '.x....x.', '........']
    },
    {
      name: 'Grządki', reward: 'Huśtawka', colors: 5, moves: 16, stars: [5100, 7000],
      goals: [{ type: 'weed', n: 'auto' }, { type: 'crate', n: 'auto' }],
      map: ['........', '........', 'c..cc..c', 'w..ww..w', 'ww.ww.ww', 'wwwwwwww', '........', '........']
    },
    {
      name: 'Spiżarnia', reward: 'Ul z pszczołami', colors: 5, moves: 41, stars: [8000, 10500],
      goals: [{ type: 'jar', n: 2 }, { type: 'web', n: 'auto' }],
      map: ['.j....j.', '........', 'x.x..x.x', '........', '.x.xx.x.', '........', '........']
    },
    {
      name: 'Murek', reward: 'Krzaki borówek', colors: 5, moves: 17, stars: [5300, 7500],
      tip: 'Ciemne skrzynki trzeba trafić dwa razy.',
      goals: [{ type: 'crate', n: 'auto' }, { type: 'weed', n: 'auto' }],
      map: ['........', '........', '........', 'CCC..CCC', 'www..www', 'www..www', '........', '........']
    },
    {
      name: 'Owocobranie', reward: 'Śliwa', colors: 6, moves: 26, stars: [5700, 7600],
      goals: [{ type: 'col', col: 0, n: 35 }, { type: 'col', col: 3, n: 35 }, { type: 'col', col: 5, n: 35 }],
      map: ['.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........']
    },
    {
      name: 'Zarośnięty sad', reward: 'Stół babci Ludwiki', colors: 5, moves: 16, stars: [6900, 9200],
      goals: [{ type: 'weed', n: 'auto' }, { type: 'web', n: 'auto' }],
      map: ['#.......#', '.........', '.wwwwwww.', '.wXwwwXw.', '.wwwXwww.', '.wXwwwXw.', '.wwwwwww.', '.........', '#.......#']
    },
    {
      name: 'Słoiki w skrzynkach', reward: 'Altanka', colors: 5, moves: 35, stars: [7400, 10000],
      goals: [{ type: 'jar', n: 3 }, { type: 'crate', n: 'auto' }],
      map: ['..j..j..', 'c......c', '.c....c.', '........', '..cccc..', '........', '........']
    },
    {
      name: 'Wielkie porządki', reward: 'Staw z liliami', colors: 6, moves: 28, stars: [5500, 7000],
      goals: [{ type: 'weed', n: 'auto' }, { type: 'crate', n: 'auto' }, { type: 'web', n: 'auto' }],
      map: ['.........', '.........', 'c.c...c.c', 'wwwwwwwww', 'wXw.w.wXw', 'wwwwwwwww', '..C...C..', '.........', '.........']
    },
    {
      name: 'Sroka Szarlotka', reward: 'Girlandy na święto ogrodu', colors: 5, moves: 30, stars: [11600, 14400], boss: { hp: 40, every: 3, n: 2 },
      tip: 'Sroka zakrywa owoce błyskotkami. Rani ją każdy owoc zbity tuż obok niej i każda rakieta, która w nią trafi!',
      goals: [{ type: 'boss', n: 40 }],
      map: ['...bb...', '...bb...', '........', '........', '........', '........', '........', '........', '........']
    }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = LEVELS;
  else root.LEVELS = LEVELS;
})(typeof window !== 'undefined' ? window : globalThis);
