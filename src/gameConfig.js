/**
 * gameConfig.js — Supported game servers.
 *
 * To add a new game (e.g. FireKirin), append an entry here.
 * The id must be a unique slug. LOGIN_WS_URL / SUPER_ROULETTE_WS_URL
 * are forwarded to the backend and injected into RouletteProcessor config.
 */

export const GAMES = [
  {
    id: 'milkyway',
    label: 'MilkyWay',
    shortLabel: 'MW',
    color: '#a78bfa',          // purple
    LOGIN_WS_URL:         'wss://game.milkywayapp.xyz:7878/',
    SUPER_ROULETTE_WS_URL:'wss://game.milkywayapp.xyz:2152/',
    GAME_VERSION:         '2.0.1',
  },
  {
    id: 'pandamaster',
    label: 'Panda Master',
    shortLabel: 'PM',
    color: '#fb923c',          // orange
    LOGIN_WS_URL:         'wss://pandamaster.vip:7878/',
    SUPER_ROULETTE_WS_URL:'wss://pandamaster.vip:10152/',
    GAME_VERSION:         '2.0.1',
  },
  {
    id: 'orionstars',
    label: 'OrionStars',
    shortLabel: 'OS',
    color: '#38bdf8',          // sky blue
    LOGIN_WS_URL:         'ws://34.213.5.211:8600/',
    SUPER_ROULETTE_WS_URL:'ws://34.213.5.211:2635/',
    GAME_VERSION:         '2.0.1',
  },
  // ── Add FireKirin here when links are available ──────────────────────────
  // {
  //   id: 'firekirin',
  //   label: 'FireKirin',
  //   shortLabel: 'FK',
  //   color: '#f87171',
  //   LOGIN_WS_URL:         'wss://...',
  //   SUPER_ROULETTE_WS_URL:'wss://...',
  //   GAME_VERSION:         '2.0.1',
  // },
];

export const DEFAULT_GAME_ID = 'milkyway';

export function getGame(id) {
  return GAMES.find(g => g.id === id) || GAMES[0];
}
