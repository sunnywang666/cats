
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Fish, ArrowLeft, RotateCcw, Palette, Sparkles, Brain, Lock, Check, ShoppingBag, Pause, Play, Clock, Star, Zap, Crown, Book, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppScreen, Player, BoardState, WinResult, UserStats, Skin, GamePersistedState, CatPose, Difficulty, MoveRecord, GameRecord } from './types';
import { createEmptyBoard, checkWinner, isBoardFull, findBestAiMove } from './services/gameLogic';
import { Board } from './components/Board';
import { Button } from './components/Button';
import { CatPiece } from './components/CatPiece';
import { RANKS, SKINS, LOADING_MESSAGES } from './constants';

const App: React.FC = () => {
  // Global App State
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  
  // Persistence Loading State
  const [isLoaded, setIsLoaded] = useState(false);

  // User Data State
  const [stats, setStats] = useState<UserStats>({
    rankTitle: RANKS[0],
    rankLevel: 0,
    rankProgress: 0,
    coins: 100, // Starting Coins
    dailyProgress: 0 // 0/3 wins
  });
  
  // Customization State
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(['clay']);
  const [currentSkinId, setCurrentSkinId] = useState('clay');
  const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
  
  // Shop Preview State
  const [previewSkinId, setPreviewSkinId] = useState('clay');

  // Game Settings
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);

  // Game State
  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.BLACK);
  const [lastMove, setLastMove] = useState<{ row: number, col: number } | null>(null);
  const [winResult, setWinResult] = useState<WinResult | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  
  // New Features: Pause & Timer
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // --- HISTORY & DIARY STATE ---
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [moveLog, setMoveLog] = useState<MoveRecord[]>([]);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  
  // --- REPLAY STATE ---
  const [activeReplay, setActiveReplay] = useState<GameRecord | null>(null);
  const [replayStep, setReplayStep] = useState(0); // 0 = empty board, N = Nth move
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);

  // --- PERSISTENCE ---
  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem('meow-moku-save-v1');
    if (saved) {
      try {
        const parsed: GamePersistedState = JSON.parse(saved);
        // Ensure dailyProgress exists for legacy saves
        const safeStats = {
          ...parsed.stats,
          dailyProgress: parsed.stats.dailyProgress ?? 0
        };
        setStats(safeStats);
        setUnlockedSkinIds(parsed.unlockedSkinIds);
        setCurrentSkinId(parsed.currentSkinId);
        setHistory(parsed.history || []);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (!isLoaded) return;
    const saveState: GamePersistedState = {
      stats,
      unlockedSkinIds,
      currentSkinId,
      coins: stats.coins,
      history
    };
    localStorage.setItem('meow-moku-save-v1', JSON.stringify(saveState));
  }, [stats, unlockedSkinIds, currentSkinId, history, isLoaded]);

  // Derived State
  const activeSkin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];

  // --- UNIFIED GAME TIMER & TURN LOGIC ---
  useEffect(() => {
    // Only run if game is active, not paused, and no result yet
    if (screen === AppScreen.GAME && !winResult && !isDraw && !isPaused) {
      
      // If time runs out, make a move for the current player
      if (timeLeft <= 0) {
        const playerToMove = currentPlayer;
        // Use AI logic to find best move for WHOEVER's turn it is
        // (If User, it's auto-play. If AI, it's the normal move)
        const move = findBestAiMove(board, playerToMove, difficulty);
        makeMove(move.row, move.col, playerToMove);
        return;
      }

      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [screen, currentPlayer, winResult, isDraw, isPaused, timeLeft, board, difficulty]);


  // Helper: Find Match Simulation
  const startMatch = () => {
    setScreen(AppScreen.MATCHING);
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingText(LOADING_MESSAGES[msgIdx]);
    }, 800);

    setTimeout(() => {
      clearInterval(interval);
      startGame();
    }, 3000);
  };

  const startGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(Player.BLACK);
    setLastMove(null);
    setWinResult(null);
    setIsDraw(false);
    setIsPaused(false);
    setMoveLog([]); // Reset Move Log
    setTimeLeft(30); // Reset timer (User starts with 30s)
    setScreen(AppScreen.GAME);
  };

  const togglePause = () => {
    if (winResult || isDraw) return;
    setIsPaused(!isPaused);
  };

  const makeMove = (row: number, col: number, player: Player) => {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = player;
    setBoard(newBoard);
    setLastMove({ row, col });

    // RECORD MOVE
    const newMoveLog = [...moveLog, { row, col, player }];
    setMoveLog(newMoveLog);

    const result = checkWinner(newBoard, row, col, player);
    if (result) {
      setWinResult(result);
      handleGameOver(result.winner, newMoveLog);
    } else if (isBoardFull(newBoard)) {
      setIsDraw(true);
      handleGameOver(null, newMoveLog);
    } else {
      const nextPlayer = player === Player.BLACK ? Player.WHITE : Player.BLACK;
      setCurrentPlayer(nextPlayer);
      
      // Reset Timer based on whose turn it is
      if (nextPlayer === Player.BLACK) {
        setTimeLeft(30); // User gets 30 seconds
      } else {
        setTimeLeft(3); // AI gets 3 seconds countdown
      }
    }
  };

  const handleCellClick = useCallback((row: number, col: number) => {
    // Prevent click if: cell occupied, game over, wrong turn, OR PAUSED
    if (board[row][col] || winResult || currentPlayer !== Player.BLACK || isPaused) return;
    makeMove(row, col, Player.BLACK);
  }, [board, currentPlayer, winResult, isPaused, moveLog]); // added moveLog dependency

  const handleGameOver = (winner: Player | null, finalMoveLog: MoveRecord[]) => {
    const isVictory = winner === Player.BLACK;
    const reward = isVictory ? 50 : 10;
    const xpGain = isVictory ? 25 : 5;

    // SAVE HISTORY
    const newRecord: GameRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      winner: winner || 'DRAW',
      moves: finalMoveLog,
      skinId: currentSkinId,
      difficulty: difficulty,
      turnCount: finalMoveLog.length
    };
    
    // Keep last 20 games
    setHistory(prev => [newRecord, ...prev].slice(0, 20));

    // Delay stat update for effect
    setTimeout(() => {
      setStats(prev => {
        let newProgress = prev.rankProgress + xpGain;
        let newLevel = prev.rankLevel;
        let newTitle = prev.rankTitle;
        // Daily Progress Logic: Increment only on victory, cap at 3
        let newDailyProgress = prev.dailyProgress;
        if (isVictory) {
          newDailyProgress = Math.min(prev.dailyProgress + 1, 3);
        }

        if (newProgress >= 100) {
          newProgress -= 100;
          newLevel = Math.min(newLevel + 1, RANKS.length - 1);
          newTitle = RANKS[newLevel];
        }

        return {
          ...prev,
          coins: prev.coins + reward,
          rankProgress: newProgress,
          rankLevel: newLevel,
          rankTitle: newTitle,
          dailyProgress: newDailyProgress
        };
      });
    }, 500);
  };

  // --- REPLAY LOGIC ---
  const getReplayBoard = (record: GameRecord, step: number): BoardState => {
    const tempBoard = createEmptyBoard();
    const movesToApply = record.moves.slice(0, step);
    movesToApply.forEach(m => {
      tempBoard[m.row][m.col] = m.player;
    });
    return tempBoard;
  };
  
  const handleReplayControl = (action: 'start' | 'prev' | 'playpause' | 'next' | 'end') => {
    if (!activeReplay) return;
    const totalSteps = activeReplay.moves.length;

    switch (action) {
      case 'start':
        setReplayStep(0);
        setIsReplayPlaying(false);
        break;
      case 'prev':
        setReplayStep(Math.max(0, replayStep - 1));
        setIsReplayPlaying(false);
        break;
      case 'playpause':
        if (replayStep >= totalSteps) {
            setReplayStep(0); // Restart if at end
            setIsReplayPlaying(true);
        } else {
            setIsReplayPlaying(!isReplayPlaying);
        }
        break;
      case 'next':
        setReplayStep(Math.min(totalSteps, replayStep + 1));
        setIsReplayPlaying(false);
        break;
      case 'end':
        setReplayStep(totalSteps);
        setIsReplayPlaying(false);
        break;
    }
  };

  // Replay Autoplay Interval
  useEffect(() => {
    if (isReplayPlaying && activeReplay) {
      const interval = setInterval(() => {
        setReplayStep(prev => {
           if (prev >= activeReplay.moves.length) {
             setIsReplayPlaying(false);
             return prev;
           }
           return prev + 1;
        });
      }, 800); // 0.8s per move
      return () => clearInterval(interval);
    }
  }, [isReplayPlaying, activeReplay]);

  // --- SHOP LOGIC ---
  const handleBuySkin = (skinId: string, price: number) => {
    if (stats.coins >= price) {
      setStats(prev => ({ ...prev, coins: prev.coins - price }));
      setUnlockedSkinIds(prev => [...prev, skinId]);
      setCurrentSkinId(skinId); // Auto equip
    }
  };

  const handleEquipSkin = (skinId: string) => {
    setCurrentSkinId(skinId);
  };

  const openShop = () => {
    setPreviewSkinId(currentSkinId); // Reset preview to what they have equipped
    setIsSkinModalOpen(true);
  }

  // --- RENDERERS ---

  const renderHome = () => (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto p-6 justify-between animate-fade-in font-serif">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2 bg-white/60 p-2 rounded-full px-4 shadow-sm border border-stone-200">
          <Fish className="w-5 h-5 text-orange-400 fill-orange-400" />
          <span className="font-bold text-stone-700 font-sans">{stats.coins}</span>
        </div>
        
        <div className="flex gap-2">
           {/* DIARY BUTTON */}
           <button onClick={() => setIsDiaryOpen(true)} className="p-2 bg-white/60 rounded-full hover:bg-white shadow-sm transition-colors text-stone-600 border border-stone-200">
             <Book className="w-6 h-6" />
           </button>
           {/* SHOP BUTTON */}
           <button onClick={openShop} className="p-2 bg-white/60 rounded-full hover:bg-white shadow-sm transition-colors text-stone-600 border border-stone-200">
             <Palette className="w-6 h-6" />
           </button>
        </div>
      </header>

      <div className="text-center space-y-4 mt-4">
        <div className="inline-block relative">
             <h1 className="text-5xl font-bold text-stone-800 tracking-tight z-10 relative drop-shadow-sm">
            Meow-moku
            </h1>
            <div className="absolute -top-6 -right-6 text-4xl animate-bounce-slight delay-700">🐾</div>
        </div>
        <p className="text-stone-700 italic font-serif text-lg">A healing game of strategy.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        
        {/* Difficulty Selector */}
        <div className="w-full space-y-2">
          <div className="text-sm font-bold text-stone-500 uppercase tracking-widest text-center">Select Opponent</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: Difficulty.EASY, name: 'Easy', icon: <Star className="w-5 h-5" />, desc: 'Sleepy Kitten' },
              { id: Difficulty.MEDIUM, name: 'Medium', icon: <Zap className="w-5 h-5" />, desc: 'Greedy Tabby' },
              { id: Difficulty.HARD, name: 'Hard', icon: <Crown className="w-5 h-5" />, desc: 'Grandmaster' }
            ].map((level) => (
              <button
                key={level.id}
                onClick={() => setDifficulty(level.id as Difficulty)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 border-2 shadow-sm
                  ${difficulty === level.id 
                    ? 'bg-white border-stone-800 scale-105 shadow-md' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-stone-500'}
                `}
              >
                <div className={`${difficulty === level.id ? 'text-orange-500' : 'text-stone-400'} mb-1`}>
                  {level.icon}
                </div>
                <div className="font-bold text-sm text-stone-800">{level.name}</div>
                <div className="text-[10px] leading-tight text-center text-stone-500 font-sans mt-1">{level.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Rank Card */}
        <div className="bg-white/60 p-5 rounded-3xl w-full backdrop-blur-sm border border-white/50 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy className="w-24 h-24 rotate-12" />
          </div>
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white">
              🐱
            </div>
            <div className="flex-1">
              <div className="text-xs text-stone-600 uppercase tracking-wider font-sans font-bold">Current Rank</div>
              <div className="text-2xl font-bold text-stone-800 leading-tight">{stats.rankTitle}</div>
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between text-xs text-stone-600 font-sans font-medium">
              <span>Next Rank</span>
              <span>{stats.rankProgress}%</span>
            </div>
            <div className="h-3 bg-stone-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-sage-500 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${stats.rankProgress}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4 font-sans">
           <Button fullWidth onClick={startMatch} className="text-lg py-4 shadow-xl shadow-stone-900/10 transform hover:-translate-y-1">
             <Sparkles className="w-5 h-5 mr-2" />
             Start Match
           </Button>
           
           {/* Daily Challenge - Earn Today's Treats */}
           <div className="bg-white/40 p-4 rounded-2xl border border-white/40 flex flex-col items-center">
             <div className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
               Earn Today's Treats
             </div>
             <div className="flex gap-4">
               {[1, 2, 3].map((goal) => (
                 <div key={goal} className={`
                   transition-all duration-500 transform
                   ${stats.dailyProgress >= goal ? 'scale-110' : 'scale-100 opacity-40'}
                 `}>
                   <Fish 
                     className={`w-8 h-8 ${stats.dailyProgress >= goal ? 'text-orange-500 fill-orange-500 drop-shadow-md' : 'text-stone-500'}`} 
                   />
                 </div>
               ))}
             </div>
             <div className="text-xs text-stone-500 mt-2 font-medium">
               Win {3 - stats.dailyProgress} more games to fill the bowl!
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderMatching = () => (
    <div className="flex flex-col h-full w-full justify-center items-center p-8 text-center animate-fade-in font-serif">
      <div className="relative mb-12">
        <div className="w-32 h-32 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30 animate-pulse-slow">
           <span className="text-6xl">🐈</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
            <span className="text-xl">?</span>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-stone-800 mb-3 drop-shadow-sm">Opponent Found</h2>
      <p className="text-stone-700 min-h-[24px] transition-all duration-300 italic text-lg font-medium">
        {loadingText}
      </p>
      <div className="mt-4 text-stone-500 font-sans text-sm font-bold uppercase tracking-wider">
        VS {difficulty} BOT
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="flex flex-col h-full w-full p-2 sm:p-4 animate-fade-in relative font-serif">
      {/* Header */}
      <header className="flex-none flex justify-between items-center mb-2 z-20">
        <button onClick={() => setScreen(AppScreen.HOME)} className="p-3 text-stone-700 hover:bg-white/60 bg-white/40 rounded-full transition-colors backdrop-blur-sm shadow-sm border border-white/20">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        {/* Status Pill */}
        <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full shadow-lg shadow-stone-900/5 border border-white/40 backdrop-blur-md min-w-[160px] justify-center">
          {currentPlayer === Player.BLACK ? (
             <>
               <span 
                 className="w-3 h-3 rounded-full animate-pulse ring-2 ring-stone-200"
                 style={{ backgroundColor: activeSkin.blackFill }}
               ></span>
               <div className="flex flex-col items-start leading-none">
                 <span className="text-stone-800 font-bold text-sm tracking-wide">Your Turn</span>
                 <span className={`text-xs font-mono font-medium ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-stone-500'}`}>
                   {timeLeft}s remaining
                 </span>
               </div>
             </>
          ) : (
            <>
               <span 
                 className="w-3 h-3 rounded-full"
                 style={{ backgroundColor: activeSkin.whiteFill, border: `1px solid ${activeSkin.whiteStroke}` }}
               ></span>
               <span className="text-stone-600 font-medium text-sm flex items-center gap-2">
                 AI Thinking ({timeLeft}s)
                 <Brain className="w-3 h-3 animate-bounce" />
               </span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {/* Pause Button */}
          <button onClick={togglePause} className="p-3 text-stone-700 hover:bg-white/60 bg-white/40 rounded-full transition-colors backdrop-blur-sm shadow-sm border border-white/20">
            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
          </button>
          
          <button onClick={startGame} className="p-3 text-stone-700 hover:bg-white/60 bg-white/40 rounded-full transition-colors backdrop-blur-sm shadow-sm border border-white/20">
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full relative z-10">
        
        {/* Player Avatars Row */}
        <div className="flex-none flex justify-between w-full px-4 mb-4 max-w-4xl">
             <div className={`flex flex-col items-center transition-all duration-300 ${currentPlayer === Player.BLACK ? 'opacity-100 scale-105 transform translate-y-0' : 'opacity-60 translate-y-2'}`}>
                <div 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-white shadow-xl mb-2 flex items-center justify-center text-2xl bg-gradient-to-br from-stone-100 to-stone-200 relative"
                  style={{ color: activeSkin.blackFill }}
                >
                   🐈‍⬛
                   {currentPlayer === Player.BLACK && !winResult && (
                      <div className="absolute -bottom-1 -right-1 bg-stone-800 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-white font-bold">
                        {timeLeft}
                      </div>
                   )}
                </div>
                <span className="text-xs font-bold text-stone-700 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">You</span>
             </div>
             
             <div className="flex items-center justify-center">
                <div className="bg-stone-800/10 rounded-full px-4 py-1 text-stone-700 font-bold font-serif text-sm backdrop-blur-sm">
                   VS {difficulty}
                </div>
             </div>

             <div className={`flex flex-col items-center transition-all duration-300 ${currentPlayer === Player.WHITE ? 'opacity-100 scale-105 transform translate-y-0' : 'opacity-60 translate-y-2'}`}>
                <div 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-white shadow-xl mb-2 flex items-center justify-center text-2xl relative bg-gradient-to-br from-stone-100 to-stone-200"
                  style={{ color: activeSkin.blackFill }}
                >
                   🐈
                   {currentPlayer === Player.WHITE && !winResult && !isPaused && (
                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-sage-500 rounded-full animate-ping border-2 border-white" />
                   )}
                </div>
                <span className="text-xs font-bold text-stone-700 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">Bot</span>
             </div>
        </div>

        {/* Board Container */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 p-1 md:p-6 mb-2">
           <div className="aspect-square h-full max-h-full w-auto max-w-[95vw] relative flex items-center justify-center">
              <Board 
                board={board} 
                onCellClick={handleCellClick} 
                lastMove={lastMove} 
                winResult={winResult}
                disabled={!!winResult || currentPlayer !== Player.BLACK || isPaused}
                activeSkin={activeSkin}
              />
              
              {/* Paused Overlay */}
              {isPaused && !winResult && (
                <div className="absolute inset-0 z-30 bg-white/20 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-fade-in border-4 border-white/40">
                  <div className="bg-stone-800/90 text-white p-6 rounded-2xl shadow-xl transform scale-110 flex flex-col items-center gap-4">
                    <Pause className="w-12 h-12 text-sage-300" />
                    <h3 className="text-2xl font-bold font-serif">Game Paused</h3>
                    <Button onClick={togglePause} variant="secondary" className="px-8">
                      Resume
                    </Button>
                  </div>
                </div>
              )}
           </div>
        </div>
        
        <p className="flex-none text-stone-700 text-sm italic text-center opacity-80 font-medium bg-white/20 px-4 py-1 rounded-full mb-2 backdrop-blur-sm">
           {isPaused ? "Game is paused" : "Match 5 pieces in a row to win"}
        </p>
      </div>

      {/* Game Over Overlay */}
      {(winResult || isDraw) && (
        <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#fcfbf9] rounded-[2rem] p-8 w-full max-w-sm shadow-2xl transform scale-100 transition-all text-center border-4 border-white ring-1 ring-stone-200">
            <div className="mb-6 text-7xl animate-bounce-slight filter drop-shadow-lg">
              {isDraw ? '💤' : (winResult?.winner === Player.BLACK ? '🏆' : '😿')}
            </div>
            
            <h2 className="text-4xl font-bold text-stone-800 mb-2 font-serif">
              {isDraw ? 'Draw' : (winResult?.winner === Player.BLACK ? 'Victory!' : 'Defeat')}
            </h2>
            
            <p className="text-stone-500 mb-8 font-serif text-lg">
              {isDraw 
                ? 'The cats fell asleep...' 
                : (winResult?.winner === Player.BLACK 
                    ? 'You are the Master of Cats!' 
                    : 'The stray cat outsmarted you.')}
            </p>
            
            <div className="flex justify-center items-center gap-3 mb-8 bg-orange-50 p-4 rounded-2xl border border-orange-100 mx-auto w-fit shadow-inner">
              <span className="text-stone-500 text-sm font-sans font-bold uppercase tracking-wide">Reward</span>
              <div className="w-px h-4 bg-orange-200"></div>
              <Fish className="w-6 h-6 text-orange-400 fill-orange-400" />
              <span className="font-2xl font-bold text-stone-800 font-sans">
                +{winResult?.winner === Player.BLACK ? 50 : 10}
              </span>
            </div>

            <div className="space-y-3 font-sans">
              <Button fullWidth onClick={startGame} className="shadow-orange-200/50">
                Play Again
              </Button>
              <Button fullWidth variant="outline" onClick={() => setScreen(AppScreen.HOME)}>
                Return Home
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- SHOP MODAL ("Fitting Room") ---
  const renderShopModal = () => {
    const previewSkin = SKINS.find(s => s.id === previewSkinId) || SKINS[0];
    const isUnlocked = unlockedSkinIds.includes(previewSkinId);
    const isEquipped = currentSkinId === previewSkinId;
    const canAfford = stats.coins >= previewSkin.price;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in font-serif">
        <div className="bg-[#f5efe6] w-full max-w-md h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-white ring-1 ring-stone-900/10">
          
          {/* Header */}
          <div className="p-6 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-stone-200/50">
            <div>
               <h3 className="text-2xl font-bold text-stone-800">Fitting Room</h3>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-stone-200 shadow-sm">
               <Fish className="w-4 h-4 text-orange-400 fill-orange-400" />
               <span className="font-bold text-stone-700 font-sans">{stats.coins}</span>
            </div>
          </div>

          {/* Top Half: Preview Stage */}
          <div className="flex-none p-6 bg-[radial-gradient(circle_at_center,_#dcbfa5_0%,_#a68b6c_100%)] relative shadow-inner overflow-hidden flex flex-col items-center">
              {/* Table Surface */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-multiply pointer-events-none"></div>
              
              {/* The Cats */}
              <div className="relative z-10 flex gap-8 mb-6 mt-4">
                 <div className="w-32 h-32 relative">
                    <CatPiece player={Player.BLACK} skin={previewSkin} pose={CatPose.LONELY} />
                    <span className="absolute -bottom-6 w-full text-center text-xs font-bold text-stone-800 opacity-60">Player</span>
                 </div>
                 <div className="w-32 h-32 relative">
                    <CatPiece player={Player.WHITE} skin={previewSkin} pose={CatPose.CONNECTED} />
                    <span className="absolute -bottom-6 w-full text-center text-xs font-bold text-stone-800 opacity-60">Opponent</span>
                 </div>
              </div>

              {/* Skin Title */}
              <div className="relative z-10 text-center mb-4 mt-4">
                 <h2 className="text-2xl font-bold text-white drop-shadow-md">{previewSkin.name}</h2>
                 <p className="text-white/80 text-sm">{previewSkin.description}</p>
              </div>

              {/* Action Button (Context Aware) */}
              <div className="relative z-10 w-full max-w-xs">
                 {isUnlocked ? (
                    <Button 
                      fullWidth 
                      variant={isEquipped ? 'secondary' : 'primary'}
                      onClick={() => handleEquipSkin(previewSkinId)}
                      disabled={isEquipped}
                    >
                      {isEquipped ? 'Currently Equipped' : 'Equip Now'}
                    </Button>
                 ) : (
                    <Button 
                      fullWidth 
                      onClick={() => handleBuySkin(previewSkinId, previewSkin.price)}
                      disabled={!canAfford}
                      className={canAfford ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                      <span className="flex items-center gap-2">
                         {canAfford ? 'Buy for' : 'Need more coins'}
                         <span className="flex items-center font-bold">
                            {previewSkin.price} <Fish className="w-4 h-4 ml-1 fill-current" />
                         </span>
                      </span>
                    </Button>
                 )}
              </div>
          </div>

          {/* Bottom Half: Selector List */}
          <div className="flex-1 overflow-y-auto bg-stone-50 p-4">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 ml-2">Available Skins</h4>
            <div className="space-y-3">
              {SKINS.map((skin) => {
                const isSelected = previewSkinId === skin.id;
                const isOwned = unlockedSkinIds.includes(skin.id);
                
                return (
                  <button 
                    key={skin.id}
                    onClick={() => setPreviewSkinId(skin.id)}
                    className={`
                      w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden
                      ${isSelected 
                        ? 'bg-white border-stone-800 shadow-md scale-[1.02]' 
                        : 'bg-white border-stone-100 hover:border-stone-300 text-stone-500'
                      }
                    `}
                  >
                     {/* Mini Preview */}
                     <div className="w-12 h-12 rounded-lg shadow-inner relative flex-none"
                          style={{ backgroundColor: skin.blackStroke }}>
                        <div className="absolute inset-1 rounded-md" style={{ backgroundColor: skin.blackFill }}></div>
                     </div>

                     <div className="flex-1">
                        <div className="font-bold text-sm flex items-center gap-2">
                           {skin.name}
                           {currentSkinId === skin.id && <span className="text-[10px] bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Active</span>}
                        </div>
                        <div className="text-xs opacity-70">
                           {isOwned ? 'Owned' : `${skin.price} Coins`}
                        </div>
                     </div>

                     <div className="text-stone-300">
                        {isOwned ? (
                           <Check className={`w-5 h-5 ${isSelected ? 'text-sage-500' : ''}`} />
                        ) : (
                           <Lock className="w-4 h-4" />
                        )}
                     </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-stone-100">
             <Button fullWidth variant="outline" onClick={() => setIsSkinModalOpen(false)}>
               Back to Menu
             </Button>
          </div>
        </div>
      </div>
    );
  };

  // --- DIARY MODAL (HISTORY) ---
  const renderDiaryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in font-serif">
      <div className="bg-[#f5efe6] w-full max-w-md h-[80vh] rounded-[2rem] shadow-2xl flex flex-col border-4 border-white ring-1 ring-stone-900/10">
        <div className="p-6 pb-2 border-b border-stone-200/50 bg-white/50 rounded-t-[2rem]">
           <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
             <Book className="w-6 h-6 text-stone-600" />
             Cat Diary
           </h3>
           <p className="text-stone-500 text-sm">Memories of past matches.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-stone-100/50">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4 opacity-70">
               <Book className="w-16 h-16" />
               <p>No memories yet. Go play!</p>
            </div>
          ) : (
            history.map((game, i) => (
              <button 
                key={game.id}
                onClick={() => {
                  setActiveReplay(game);
                  setIsDiaryOpen(false);
                }}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-stone-200 hover:shadow-md hover:scale-[1.01] transition-all text-left flex justify-between items-center group relative overflow-hidden"
              >
                 <div className="absolute top-0 left-0 w-1 h-full bg-stone-200 group-hover:bg-orange-300 transition-colors"></div>
                 <div>
                    <div className="text-xs text-stone-400 font-sans uppercase font-bold tracking-wider mb-1">{game.date}</div>
                    <div className="font-bold text-stone-700 flex items-center gap-2">
                      {game.winner === 'BLACK' ? 'Victory' : game.winner === 'WHITE' ? 'Defeat' : 'Draw'}
                      <span className="text-xs font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">vs {game.difficulty}</span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1">{game.turnCount} Moves</div>
                 </div>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-400">
                    <Play className="fill-current w-6 h-6" />
                 </div>
                 {/* Stamp */}
                 {game.winner === 'BLACK' && (
                    <div className="absolute -right-2 -bottom-2 opacity-10 rotate-12">
                       <Crown className="w-16 h-16" />
                    </div>
                 )}
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 bg-white/50 border-t border-stone-200/50 rounded-b-[2rem]">
          <Button fullWidth variant="outline" onClick={() => setIsDiaryOpen(false)}>Close Diary</Button>
        </div>
      </div>
    </div>
  );

  // --- REPLAY MODAL ---
  const renderReplayModal = () => {
    if (!activeReplay) return null;
    const replayBoard = getReplayBoard(activeReplay, replayStep);
    const replaySkin = SKINS.find(s => s.id === activeReplay.skinId) || SKINS[0];
    const totalMoves = activeReplay.moves.length;
    
    // Determine last move for the frame
    const lastReplayMove = replayStep > 0 ? activeReplay.moves[replayStep - 1] : null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-stone-900/90 backdrop-blur-md animate-fade-in font-serif">
         <div className="w-full max-w-lg flex flex-col h-full max-h-[90vh]">
            
            {/* Replay Header */}
            <div className="flex justify-between items-center text-white mb-4 px-2">
               <div>
                  <h3 className="font-bold text-xl">Replay Match</h3>
                  <div className="text-sm opacity-70">{activeReplay.date} • {activeReplay.difficulty} Bot</div>
               </div>
               <button onClick={() => { setActiveReplay(null); setIsDiaryOpen(true); }} className="p-2 hover:bg-white/10 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
               </button>
            </div>

            {/* Board View */}
            <div className="aspect-square w-full relative mb-6">
                <Board 
                  board={replayBoard} 
                  onCellClick={() => {}} // Read only
                  lastMove={lastReplayMove ? { row: lastReplayMove.row, col: lastReplayMove.col } : null}
                  winResult={null} 
                  disabled={true} 
                  activeSkin={replaySkin} 
                />
            </div>

            {/* VCR Controls */}
            <div className="bg-stone-800 rounded-2xl p-6 text-white shadow-xl border border-stone-700">
                {/* Progress Bar Header */}
                <div className="flex justify-between text-xs font-mono mb-2 text-stone-400">
                   <span>Start</span>
                   <span>Move {replayStep} / {totalMoves}</span>
                   <span>End</span>
                </div>
                
                {/* Interactive Draggable Slider */}
                <div className="relative h-6 mb-4 flex items-center select-none group">
                   {/* Track Background */}
                   <div className="absolute w-full h-2 bg-stone-700 rounded-full overflow-hidden">
                       <div 
                          className="h-full bg-orange-500"
                          style={{ width: `${(replayStep / totalMoves) * 100}%` }}
                       />
                   </div>
                   
                   {/* Visual Thumb */}
                   <div 
                      className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-orange-500 rounded-full shadow-lg pointer-events-none transition-transform group-active:scale-110"
                      style={{ 
                          left: `${(replayStep / totalMoves) * 100}%`,
                          transform: 'translate(-50%, -50%)' 
                      }}
                   />

                   {/* Range Input (Invisible Interactor) */}
                   <input
                      type="range"
                      min={0}
                      max={totalMoves}
                      value={replayStep}
                      onChange={(e) => {
                          setReplayStep(Number(e.target.value));
                          setIsReplayPlaying(false);
                      }}
                      className="w-full h-full opacity-0 cursor-pointer z-10 absolute inset-0"
                   />
                </div>

                {/* Control Buttons */}
                <div className="flex justify-between items-center px-2">
                   <button onClick={() => handleReplayControl('start')} className="p-3 hover:bg-white/10 rounded-full transition-colors text-stone-300 hover:text-white">
                      <SkipBack className="w-6 h-6 fill-current" />
                   </button>
                   <button onClick={() => handleReplayControl('prev')} className="p-3 hover:bg-white/10 rounded-full transition-colors text-stone-300 hover:text-white">
                      <ChevronLeft className="w-8 h-8" />
                   </button>
                   
                   <button 
                     onClick={() => handleReplayControl('playpause')} 
                     className="p-5 bg-orange-500 hover:bg-orange-400 text-white rounded-full shadow-lg shadow-orange-500/30 transform hover:scale-105 transition-all"
                   >
                      {isReplayPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                   </button>

                   <button onClick={() => handleReplayControl('next')} className="p-3 hover:bg-white/10 rounded-full transition-colors text-stone-300 hover:text-white">
                      <ChevronRight className="w-8 h-8" />
                   </button>
                   <button onClick={() => handleReplayControl('end')} className="p-3 hover:bg-white/10 rounded-full transition-colors text-stone-300 hover:text-white">
                      <SkipForward className="w-6 h-6 fill-current" />
                   </button>
                </div>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[100dvh] text-stone-800 overflow-hidden selection:bg-sage-200 bg-[radial-gradient(circle_at_center,_#dcbfa5_0%,_#a68b6c_100%)]">
      <main className="h-full w-full relative overflow-hidden flex flex-col">
        {screen === AppScreen.HOME && renderHome()}
        {screen === AppScreen.MATCHING && renderMatching()}
        {screen === AppScreen.GAME && renderGame()}
        
        {isSkinModalOpen && renderShopModal()}
        {isDiaryOpen && renderDiaryModal()}
        {activeReplay && renderReplayModal()}
      </main>
    </div>
  );
};

export default App;
