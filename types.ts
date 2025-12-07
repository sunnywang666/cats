
export enum AppScreen {
  HOME = 'HOME',
  MATCHING = 'MATCHING',
  GAME = 'GAME',
}

export enum Player {
  BLACK = 'BLACK',
  WHITE = 'WHITE',
}

export enum CatPose {
  LONELY = 'LONELY',
  CONNECTED = 'CONNECTED',
  SCARED = 'SCARED'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export type CellValue = Player | null;

export type BoardState = CellValue[][];

export interface WinResult {
  winner: Player;
  line: [number, number][]; // Array of [row, col] coordinates
}

export interface Skin {
  id: string;
  name: string;
  description: string;
  price: number;
  // Visual Properties
  blackFill: string;    // Color for Player (User) body
  blackStroke: string;  // Color for Player details
  whiteFill: string;    // Color for AI (Opponent) body
  whiteStroke: string;  // Color for AI outline/details
}

export interface UserStats {
  rankTitle: string;
  rankLevel: number;
  rankProgress: number; // 0 to 100
  coins: number;
  dailyProgress: number; // 0 to 3 wins
}

export interface MoveRecord {
  row: number;
  col: number;
  player: Player;
}

export interface GameRecord {
  id: string;
  date: string;
  winner: Player | 'DRAW';
  moves: MoveRecord[];
  skinId: string;
  difficulty: Difficulty;
  turnCount: number;
}

export interface GamePersistedState {
  coins: number;
  unlockedSkinIds: string[];
  currentSkinId: string;
  stats: UserStats;
  history: GameRecord[];
}
