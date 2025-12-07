
import React, { useState } from 'react';
import { BoardState, WinResult, Skin, CatPose } from '../types';
import { BOARD_SIZE } from '../constants';
import { determineCatPose } from '../services/gameLogic';
import { CatPiece } from './CatPiece';

interface BoardProps {
  board: BoardState;
  onCellClick: (row: number, col: number) => void;
  lastMove: { row: number, col: number } | null;
  winResult: WinResult | null;
  disabled: boolean;
  activeSkin: Skin;
}

export const Board: React.FC<BoardProps> = ({ 
  board, 
  onCellClick, 
  lastMove, 
  winResult, 
  disabled,
  activeSkin
}) => {
  // Mouse hover state for preview
  const [hoverPos, setHoverPos] = useState<{r: number, c: number} | null>(null);

  // Math for 15x15 Grid on a board with 16 units of width (1 unit margin on each side)
  const GRID_SIZE = BOARD_SIZE; // 15
  const TOTAL_UNITS = GRID_SIZE + 1; // 16
  const SPACING = 100 / TOTAL_UNITS; // 6.25%

  // Gomoku Star Points (Hoshi)
  const starPoints = [
    { r: 3, c: 3 },
    { r: 3, c: 11 },
    { r: 7, c: 7 },
    { r: 11, c: 3 },
    { r: 11, c: 11 },
  ];

  return (
    <div 
      className="relative w-full h-full bg-[#f4f1ea] rounded-2xl shadow-[0_20px_30px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.1)] border-b-[8px] border-[#e2dcd0]"
      onMouseLeave={() => setHoverPos(null)}
    >
      {/* 1. SVG GRID LAYER */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl" 
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Vertical Lines */}
        {Array.from({ length: GRID_SIZE }).map((_, i) => {
          const pos = (i + 1) * SPACING;
          return (
            <line 
              key={`v-${i}`}
              x1={pos} 
              y1={SPACING} 
              x2={pos} 
              y2={100 - SPACING} 
              stroke="rgba(100, 80, 60, 0.3)" 
              strokeWidth="0.4"
              strokeLinecap="round"
            />
          );
        })}

        {/* Horizontal Lines */}
        {Array.from({ length: GRID_SIZE }).map((_, i) => {
          const pos = (i + 1) * SPACING;
          return (
            <line 
              key={`h-${i}`}
              x1={SPACING} 
              y1={pos} 
              x2={100 - SPACING} 
              y2={pos} 
              stroke="rgba(100, 80, 60, 0.3)" 
              strokeWidth="0.4"
              strokeLinecap="round"
            />
          );
        })}

        {/* Star Points */}
        {starPoints.map((p, i) => (
          <circle 
            key={`star-${i}`}
            cx={(p.c + 1) * SPACING}
            cy={(p.r + 1) * SPACING}
            r="0.8"
            fill="rgba(100, 80, 60, 0.5)"
          />
        ))}
      </svg>

      {/* 2. INTERACTIVE LAYER */}
      {board.map((row, r) => 
        row.map((cell, c) => {
          const isLastMove = lastMove?.row === r && lastMove?.col === c;
          let isWinningCell = false;
          if (winResult) {
            isWinningCell = winResult.line.some(([wr, wc]) => wr === r && wc === c);
          }

          // Position Calculation
          const leftPos = (c + 1) * SPACING;
          const topPos = (r + 1) * SPACING;
          
          // Determine Pose (if piece exists)
          const pose = cell ? determineCatPose(board, r, c, cell) : CatPose.LONELY;

          // Is Hovering?
          const isHovered = !cell && !disabled && hoverPos?.r === r && hoverPos?.c === c;

          return (
            <div
              key={`${r}-${c}`}
              onClick={() => !disabled && onCellClick(r, c)}
              onMouseEnter={() => setHoverPos({r, c})}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer z-10"
              style={{
                left: `${leftPos}%`,
                top: `${topPos}%`,
                width: `${SPACING}%`, // Hitbox size = grid spacing
                height: `${SPACING}%`,
              }}
            >
              {/* Hover Indicator (Simple Stone Circle) */}
              {isHovered && (
                <div 
                  className="w-[80%] h-[80%] rounded-full shadow-sm transition-all duration-200 scale-90" 
                  style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                />
              )}

              {/* Winning Highlight */}
              {isWinningCell && (
                <div className="absolute inset-0 w-[90%] h-[90%] bg-sage-400/30 rounded-full animate-pulse z-0" />
              )}

              {/* The Cat Piece */}
              {cell && (
                <div className="w-[100%] h-[100%] z-20">
                   <CatPiece 
                     player={cell} 
                     isRecent={isLastMove}
                     skin={activeSkin}
                     pose={pose}
                   />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
