
import { BoardState, CellValue, Player, WinResult, CatPose, Difficulty } from '../types';
import { BOARD_SIZE } from '../constants';

export const createEmptyBoard = (): BoardState => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

export const checkWinner = (board: BoardState, lastRow: number, lastCol: number, player: Player): WinResult | null => {
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1]   // Diagonal /
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    const line: [number, number][] = [[lastRow, lastCol]];

    // Check forward
    let r = lastRow + dr;
    let c = lastCol + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      line.push([r, c]);
      r += dr;
      c += dc;
    }

    // Check backward
    r = lastRow - dr;
    c = lastCol - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      line.push([r, c]);
      r -= dr;
      c -= dc;
    }

    if (count >= 5) {
      return { winner: player, line };
    }
  }

  return null;
};

export const isBoardFull = (board: BoardState): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

// --- AI LOGIC MAIN ENTRY ---
export const findBestAiMove = (board: BoardState, aiPlayer: Player, difficulty: Difficulty): { row: number, col: number } => {
  switch (difficulty) {
    case Difficulty.EASY:
      return getEasyMove(board, aiPlayer);
    case Difficulty.MEDIUM:
      return getMediumMove(board, aiPlayer);
    case Difficulty.HARD:
      return getHardMove(board, aiPlayer);
    default:
      return getEasyMove(board, aiPlayer);
  }
};

// --- LEVEL 1: EASY (Sleepy Kitten) ---
// Random neighbor moves, low chance to block wins
const getEasyMove = (board: BoardState, aiPlayer: Player): { row: number, col: number } => {
  const opponent = aiPlayer === Player.BLACK ? Player.WHITE : Player.BLACK;

  // 1. 20% Chance to block an immediate win (if exists)
  if (Math.random() < 0.2) {
    const blockingMove = findWinningMove(board, opponent);
    if (blockingMove) return blockingMove;
  }

  // 2. Find all valid neighbors (empty spots next to any piece)
  const candidates: { r: number, c: number }[] = [];
  const center = Math.floor(BOARD_SIZE / 2);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c]) {
        // If board is empty, center is a candidate
        if (isEmptyBoard(board) && r === center && c === center) {
          candidates.push({ r, c });
        } else if (countNeighbors(board, r, c) > 0) {
          candidates.push({ r, c });
        }
      }
    }
  }

  // 3. Pick random candidate
  if (candidates.length > 0) {
    const randomIdx = Math.floor(Math.random() * candidates.length);
    return { row: candidates[randomIdx].r, col: candidates[randomIdx].c };
  }

  // Fallback if no neighbors (shouldn't happen unless board empty)
  return { row: center, col: center };
};

// --- LEVEL 2: MEDIUM (Greedy Tabby) ---
// Aggressive: Wins > Blocks > Max Chain Length
const getMediumMove = (board: BoardState, aiPlayer: Player): { row: number, col: number } => {
  const opponent = aiPlayer === Player.BLACK ? Player.WHITE : Player.BLACK;

  // 1. Win Immediately
  const winningMove = findWinningMove(board, aiPlayer);
  if (winningMove) return winningMove;

  // 2. Block Immediately
  const blockingMove = findWinningMove(board, opponent);
  if (blockingMove) return blockingMove;

  // 3. Greedy: Find move that creates the longest chain for AI
  let bestScore = -1;
  let bestMoves: { row: number, col: number }[] = [];
  const center = Math.floor(BOARD_SIZE / 2);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c]) {
        // Evaluate chain length if we place here
        board[r][c] = aiPlayer; // Temp place
        const score = getMaxChainLength(board, r, c, aiPlayer);
        board[r][c] = null; // Revert

        // Add some centrality bias to break ties
        const distScore = (BOARD_SIZE - Math.abs(r - center) - Math.abs(c - center));
        const finalScore = (score * 100) + distScore;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMoves = [{ row: r, col: c }];
        } else if (finalScore === bestScore) {
          bestMoves.push({ row: r, col: c });
        }
      }
    }
  }

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return { row: center, col: center };
};

// --- LEVEL 3: HARD (Grandmaster Bombay) ---
// Heuristic Scoring: Attack + Defense Weights
const getHardMove = (board: BoardState, aiPlayer: Player): { row: number, col: number } => {
  const opponent = aiPlayer === Player.BLACK ? Player.WHITE : Player.BLACK;
  let bestScore = -Infinity;
  let bestMoves: { row: number, col: number }[] = [];
  const center = Math.floor(BOARD_SIZE / 2);

  // Optimization: Only check cells within 2 distance of existing pieces
  // unless board is empty
  const isFirstMove = isEmptyBoard(board);
  if (isFirstMove) return { row: center, col: center };

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c]) {
        // Optimization: Skip if isolated (unless purely defensive play required, 
        // but for Gomoku, interesting moves are always near pieces)
        if (countNeighbors(board, r, c, 2) === 0) continue;

        // Calculate Scores
        const attackScore = evaluateCell(board, r, c, aiPlayer);
        const defenseScore = evaluateCell(board, r, c, opponent);

        // Weighted Total
        // Defense is slightly prioritized to prevent losing, but High Attack (Win) is max priority
        // Multipliers adjusted to match prompt requirements
        const totalScore = attackScore + (defenseScore * 0.8); 

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMoves = [{ row: r, col: c }];
        } else if (Math.abs(totalScore - bestScore) < 1) {
          bestMoves.push({ row: r, col: c });
        }
      }
    }
  }

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return { row: center, col: center };
};

// --- HELPERS ---

const isEmptyBoard = (board: BoardState): boolean => {
  return board.every(row => row.every(cell => cell === null));
};

const countNeighbors = (board: BoardState, r: number, c: number, radius: number = 1): number => {
  let count = 0;
  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      if (i === 0 && j === 0) continue;
      const nr = r + i;
      const nc = c + j;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        if (board[nr][nc] !== null) count++;
      }
    }
  }
  return count;
};

// Helper for Medium AI
const getMaxChainLength = (board: BoardState, r: number, c: number, player: Player): number => {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  let maxLen = 0;

  for (const [dr, dc] of directions) {
    let count = 1;
    // Forward
    let i = 1;
    while (true) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
        count++;
        i++;
      } else break;
    }
    // Backward
    i = 1;
    while (true) {
      const nr = r - dr * i;
      const nc = c - dc * i;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
        count++;
        i++;
      } else break;
    }
    maxLen = Math.max(maxLen, count);
  }
  return maxLen;
};

// Helper for Easy/Medium AI to find critical moves
const findWinningMove = (board: BoardState, player: Player): { row: number, col: number } | null => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c]) {
        // Quick check if this placement creates 5
        board[r][c] = player;
        const result = checkWinner(board, r, c, player);
        board[r][c] = null;
        if (result) return { row: r, col: c };
      }
    }
  }
  return null;
};

// --- HARD AI SCORING ENGINE ---
const evaluateCell = (board: BoardState, r: number, c: number, player: Player): number => {
  let score = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    const info = getLineInfo(board, r, c, dr, dc, player);
    score += getScoreFromPattern(info.consecutive, info.openEnds, info.gap);
  }
  return score;
};

const getLineInfo = (board: BoardState, r: number, c: number, dr: number, dc: number, player: Player) => {
  let consecutive = 1;
  let openEnds = 0;
  let gap = false; // Does a gap exist that allows extension?

  // Check Forward
  let i = 1;
  while (true) {
    const nr = r + dr * i;
    const nc = c + dc * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break; // Wall
    
    if (board[nr][nc] === player) {
      consecutive++;
    } else if (board[nr][nc] === null) {
      openEnds++;
      break; // End of chain
    } else {
      break; // Blocked by opponent
    }
    i++;
  }

  // Check Backward
  i = 1;
  while (true) {
    const nr = r - dr * i;
    const nc = c - dc * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break; // Wall

    if (board[nr][nc] === player) {
      consecutive++;
    } else if (board[nr][nc] === null) {
      openEnds++;
      break; // End of chain
    } else {
      break; // Blocked by opponent
    }
    i++;
  }

  return { consecutive, openEnds, gap };
};

const getScoreFromPattern = (consecutive: number, openEnds: number, gap: boolean): number => {
  // Weights based on prompt requirements
  if (consecutive >= 5) return 1000000; // WIN
  
  if (consecutive === 4) {
    if (openEnds === 2) return 500000; // Live 4 (Unstoppable)
    if (openEnds === 1) return 10000;  // Dead 4 (Must block/complete)
  }
  
  if (consecutive === 3) {
    if (openEnds === 2) return 5000;   // Live 3
    if (openEnds === 1) return 100;    // Dead 3
  }

  if (consecutive === 2) {
    if (openEnds === 2) return 100;    // Live 2
  }

  return 1;
};

// --- POSE ENGINE ---
export const determineCatPose = (board: BoardState, row: number, col: number, player: Player): CatPose => {
  if (!player) return CatPose.LONELY;

  let enemyCount = 0;
  let friendlyCount = 0; // Orthogonal only for connected check
  let friendlyCountAll = 0; // All neighbors for scared check

  const opponent = player === Player.BLACK ? Player.WHITE : Player.BLACK;

  // Check 8 neighbors
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const r = row + i;
      const c = col + j;

      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const neighbor = board[r][c];
        if (neighbor === opponent) {
          enemyCount++;
        } else if (neighbor === player) {
          friendlyCountAll++;
          // Orthogonal check for Connected/Cuddling state (Up, Down, Left, Right)
          if (Math.abs(i) + Math.abs(j) === 1) {
            friendlyCount++;
          }
        }
      }
    }
  }

  // State A: Scared (High Priority)
  // >= 3 enemies and 0 friends to support
  if (enemyCount >= 3 && friendlyCountAll === 0) {
    return CatPose.SCARED;
  }

  // State B: Connected (Medium Priority)
  // >= 1 friendly neighbor orthogonally
  if (friendlyCount >= 1) {
    return CatPose.CONNECTED;
  }

  // State C: Lonely (Default)
  return CatPose.LONELY;
};
