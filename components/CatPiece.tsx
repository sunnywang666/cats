
import React from 'react';
import { Player, Skin, CatPose } from '../types';

interface CatPieceProps {
  player: Player;
  isRecent?: boolean;
  skin: Skin;
  pose: CatPose;
}

export const CatPiece: React.FC<CatPieceProps> = ({ player, isRecent, skin, pose }) => {
  const isBlack = player === Player.BLACK;

  // For the ceramic look, we need base colors + highlight colors
  // We'll derive a lighter "highlight" color from the fill for the glossy effect
  // or use standard white opacity for highlights.
  
  const fillColor = isBlack ? skin.blackFill : skin.whiteFill;
  const strokeColor = isBlack ? skin.blackStroke : skin.whiteStroke;

  const uniqueId = `grad-${player}-${pose}-${Math.random().toString(36).substr(2, 9)}`;

  // Render content based on pose
  const renderCatContent = () => {
    // --- SCARED POSE (Spiky Ceramic) ---
    if (pose === CatPose.SCARED) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg animate-pulse-slow">
          <defs>
             {/* Glossy Highlight Gradient */}
             <radialGradient id={`${uniqueId}-highlight`} cx="30%" cy="30%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.7" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
             </radialGradient>
          </defs>
          
          <g transform="translate(0, 5)">
            {/* Spiky Body */}
            <path 
              d="M50 85 C30 85, 20 60, 30 50 C25 40, 35 30, 45 35 C45 25, 55 25, 55 35 C65 30, 75 40, 70 50 C80 60, 70 85, 50 85 Z" 
              fill={fillColor} 
              stroke={strokeColor} 
              strokeWidth="1.5"
            />
            {/* Gloss Overlay */}
            <path 
              d="M50 85 C30 85, 20 60, 30 50 C25 40, 35 30, 45 35 C45 25, 55 25, 55 35 C65 30, 75 40, 70 50 C80 60, 70 85, 50 85 Z" 
              fill={`url(#${uniqueId}-highlight)`}
              style={{ mixBlendMode: 'soft-light' }}
            />
            
            {/* Scared Eyes */}
            <circle cx="42" cy="45" r="3" fill="white" />
            <circle cx="42" cy="45" r="1" fill={strokeColor} />
            <circle cx="58" cy="45" r="3" fill="white" />
            <circle cx="58" cy="45" r="1" fill={strokeColor} />
            
            {/* Stress Marks */}
            <path d="M50 20 L50 10" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <path d="M35 25 L30 15" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <path d="M65 25 L70 15" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      );
    }

    if (isBlack) {
      // --- BLACK CAT (User) - Upright Sitting Figurine ---
      // Modeled to look like smooth glazed ceramic
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl filter">
           <defs>
             {/* Ceramic Head Shine */}
             <radialGradient id={`${uniqueId}-head-shine`} cx="30%" cy="30%" r="60%">
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
             </radialGradient>
             {/* Ceramic Body Sheen */}
             <linearGradient id={`${uniqueId}-body-shine`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                <stop offset="50%" stopColor="white" stopOpacity="0" />
                <stop offset="100%" stopColor="black" stopOpacity="0.2" />
             </linearGradient>
           </defs>

           <g transform="translate(0, 5)">
              {/* Main Body - Smooth Pear Shape */}
              <path 
                d="M50 88 C75 88, 80 65, 70 45 C65 35, 60 32, 50 32 C40 32, 35 35, 30 45 C20 65, 25 88, 50 88 Z" 
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="0.5"
              />
              {/* Body Highlight */}
              <path 
                d="M50 88 C75 88, 80 65, 70 45 C65 35, 60 32, 50 32 C40 32, 35 35, 30 45 C20 65, 25 88, 50 88 Z" 
                fill={`url(#${uniqueId}-body-shine)`} 
              />

              {/* Head - Smooth Sphere */}
              <circle cx="50" cy="30" r="18" fill={fillColor} />
              {/* Ears - Soft Triangles */}
              <path d="M35 20 Q32 5 45 18" fill={fillColor} />
              <path d="M65 20 Q68 5 55 18" fill={fillColor} />
              
              {/* Head Highlight (The "Glossy" look) */}
              <circle cx="50" cy="30" r="17" fill={`url(#${uniqueId}-head-shine)`} />
              
              {/* Tail - Wrapped around bottom */}
              <path d="M28 80 Q50 92 72 80" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" opacity="0.4" />

              {/* Eyes - Minimalist Slits */}
              <path d="M42 32 Q45 34 48 32" fill="none" stroke={strokeColor} strokeWidth="1.5" opacity="0.6" />
              <path d="M52 32 Q55 34 58 32" fill="none" stroke={strokeColor} strokeWidth="1.5" opacity="0.6" />
              
              {/* Connected Heart */}
              {pose === CatPose.CONNECTED && (
                <g transform="translate(65, 10) rotate(15)">
                   <path d="M15 15 C15 10, 25 10, 25 18 C25 25, 15 30, 15 30 C15 30, 5 25, 5 18 C5 10, 15 10, 15 15 Z" fill="#f87171" stroke="#ef4444" strokeWidth="1" />
                </g>
              )}
           </g>
        </svg>
      );
    } else {
      // --- WHITE CAT (AI) - The "Loaf" Figurine (Reference Image Style) ---
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
           <defs>
             {/* Porcelain Gloss */}
             <radialGradient id={`${uniqueId}-white-shine`} cx="35%" cy="20%" r="45%">
                <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
             </radialGradient>
             <filter id="soft-glow">
               <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
               <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
               </feMerge>
             </filter>
           </defs>

           <g transform="translate(0, 5)">
              {/* Main Body - The "Loaf" Mound */}
              {/* Smooth curve back, flatish bottom, tucked in */}
              <path 
                d="M25 80 C20 80, 15 65, 20 50 C25 35, 45 35, 50 35 C75 35, 85 55, 85 70 C85 85, 70 85, 25 80 Z" 
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="0.5"
              />

              {/* Head - Merged into body slightly */}
              <circle cx="35" cy="45" r="16" fill={fillColor} />
              
              {/* Ears - Soft and slightly translucent looking */}
              <path d="M22 38 Q20 22 32 32" fill={fillColor} />
              <path d="M48 38 Q50 22 38 32" fill={fillColor} />

              {/* High Gloss Overlay (The Reference Look) */}
              {/* A strong white reflection on the upper left of body/head */}
              <ellipse cx="40" cy="45" rx="20" ry="15" fill={`url(#${uniqueId}-white-shine)`} />
              
              {/* Tail - Subtle relief bump on the side */}
              <path d="M75 75 Q82 65 78 55" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" opacity="0.2" />
              
              {/* Paws - Just little nubs at the front */}
              <ellipse cx="30" cy="80" rx="6" ry="3" fill={fillColor} opacity="0.8" />
              <ellipse cx="45" cy="80" rx="6" ry="3" fill={fillColor} opacity="0.8" />

              {/* Minimal Face (Sleeping) */}
              <path d="M28 46 Q32 48 36 46" fill="none" stroke={strokeColor} strokeWidth="1.5" opacity="0.4" />
              
              {/* Connected Heart */}
              {pose === CatPose.CONNECTED && (
                 <g transform="translate(65, 10) rotate(15)">
                   <path d="M15 15 C15 10, 25 10, 25 18 C25 25, 15 30, 15 30 C15 30, 5 25, 5 18 C5 10, 15 10, 15 15 Z" fill="#f87171" stroke="#ef4444" strokeWidth="1" />
                 </g>
              )}
           </g>
        </svg>
      );
    }
  };

  return (
    <div className={`w-full h-full relative animate-place-piece`}>
      {renderCatContent()}
      
      {/* Recent Move Indicator */}
      {isRecent && (
        <div className="absolute -top-1 -right-1 z-20">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-400 border border-white"></span>
            </span>
        </div>
      )}
    </div>
  );
};
