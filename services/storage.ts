import { AssetData } from '../types';

const HISTORY_KEY = 'investcalc_history_v1';

export const getSearchHistory = (): AssetData[] => {
  try {
    const item = localStorage.getItem(HISTORY_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const addToHistory = (asset: AssetData): void => {
  try {
    const history = getSearchHistory();
    // Remove if exists to add to top
    const filtered = history.filter(h => h.ticker !== asset.ticker);
    const newHistory = [asset, ...filtered].slice(0, 10); // Keep last 10
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};