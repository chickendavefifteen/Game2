export interface LeaderboardEntry {
  name: string;
  score: number;
  wave: number;
  difficulty: string;
  efficiency: number;  // 0-100 accuracy percentage
  date: string;        // ISO date string
}

const STORAGE_KEY = 'hormuz_leaderboard';
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveScore(entry: LeaderboardEntry): number {
  const board = getLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full — ignore
  }
  return trimmed.findIndex(e => e === entry || (e.score === entry.score && e.date === entry.date));
}

export function isHighScore(score: number): boolean {
  const board = getLeaderboard();
  if (board.length < MAX_ENTRIES) return true;
  return score > (board[MAX_ENTRIES - 1]?.score ?? 0);
}

export function clearLeaderboard(): void {
  localStorage.removeItem(STORAGE_KEY);
}
