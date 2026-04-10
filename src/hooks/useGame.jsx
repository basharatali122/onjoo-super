import { createContext, useContext, useState, useCallback } from 'react';
import { GAMES, DEFAULT_GAME_ID, getGame } from '../gameConfig';

/**
 * GameContext — stores the currently-selected game server.
 *
 * The selection is kept in localStorage so it persists across page reloads.
 * Any component that needs the active game config (URLs, label, color) reads
 * from this context instead of importing gameConfig directly.
 */

const GameContext = createContext(null);

const STORAGE_KEY = '_mw_selected_game';

export function GameProvider({ children }) {
  const [gameId, setGameIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_GAME_ID
  );

  const setGame = useCallback((id) => {
    const valid = GAMES.find(g => g.id === id);
    if (!valid) return;
    localStorage.setItem(STORAGE_KEY, id);
    setGameIdState(id);
  }, []);

  const game = getGame(gameId);

  return (
    <GameContext.Provider value={{ game, gameId, setGame, games: GAMES }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
