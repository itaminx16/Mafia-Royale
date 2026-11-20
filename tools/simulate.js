// Headless-симуляція бот-проти-бота для перевірки балансу та пошуку багів.
// Запуск: node tools/simulate.js [кількість_боїв]
import { Game } from '../js/game.js';
import { Bot, makeBotDeck } from '../js/ai.js';
import { TOWERS, ARENAS, CARDS } from '../js/data.js';

const N = +(process.argv[2] || 10);
const stats = { P: 0, E: 0, draw: 0, plays: {}, crowns: 0, time: 0 };
const towerWins = {};

for (let i = 0; i < N; i++) {
  const tP = TOWERS[i % 4].id, tE = TOWERS[(i + 1 + Math.floor(i / 4)) % 4].id;
  const lv = {}; for (const c of CARDS) lv[c.id] = 1;
  const g = new Game({
    P: { deck: makeBotDeck(), tower: tP, levels: lv },
    E: { deck: makeBotDeck(), tower: tE, levels: lv },
    arena: ARENAS[0],
  });
  const bP = new Bot(g, 'P', 2), bE = new Bot(g, 'E', 2);
  const dt = 1 / 60;
  let steps = 0;
  while (!g.over && steps < 60 * 200) {
    bP.update(dt); bE.update(dt);
    g.update(dt);
    for (const ev of g.events) if (ev.type === 'play') stats.plays[ev.cardId] = (stats.plays[ev.cardId] || 0) + 1;
    g.events.length = 0;
    steps++;
  }
  const w = g.result.winner;
  if (w) { stats[w]++; const t = w === 'P' ? tP : tE; towerWins[t] = (towerWins[t] || 0) + 1; } else stats.draw++;
  stats.crowns += g.result.crownsP + g.result.crownsE;
  stats.time += g.result.time;
  console.log(`#${i + 1} ${w || 'draw'}  ${g.result.crownsP}:${g.result.crownsE}  t=${g.result.time.toFixed(1)}s  entities=${g.entities.length}`);
}
console.log('\nWins P/E/draw:', stats.P, stats.E, stats.draw, ' avg crowns:', (stats.crowns / N).toFixed(2), ' avg time:', (stats.time / N).toFixed(1));
console.log('Tower wins:', towerWins);
console.log('Card plays:', Object.entries(stats.plays).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '));
