import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, X, Circle, Bot, User } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

type BoardCell = 'X' | 'O' | null;

export const TicTacToeMode: React.FC<Props> = ({ words, accent }) => {
  const [board, setBoard] = useState<BoardCell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [score, setScore] = useState({ player: 0, bot: 0 });

  // 9 words assigned to 9 cells
  const cellWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5).slice(0, 9);
  }, [words]);

  const checkWinningCondition = (b: BoardCell[]): 'X' | 'O' | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const [a, bIndex, c] of lines) {
      if (b[a] && b[a] === b[bIndex] && b[a] === b[c]) {
        return b[a];
      }
    }

    if (b.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;
    playSound('click');
    setActiveCellIndex(index);
  };

  const handleAnswerQuestion = (isCorrect: boolean) => {
    if (activeCellIndex === null) return;

    if (isCorrect) {
      playSound('correct');
      const nextBoard = [...board];
      nextBoard[activeCellIndex] = 'X';
      setBoard(nextBoard);
      setActiveCellIndex(null);

      const winResult = checkWinningCondition(nextBoard);
      if (winResult) {
        finishGame(winResult);
      } else {
        // AI Bot's turn
        setIsPlayerTurn(false);
        triggerBotMove(nextBoard);
      }
    } else {
      playSound('wrong');
      setActiveCellIndex(null);
      // Missed turn! Bot moves
      setIsPlayerTurn(false);
      triggerBotMove(board);
    }
  };

  const triggerBotMove = (currentBoard: BoardCell[]) => {
    setTimeout(() => {
      const emptyIndices: number[] = [];
      currentBoard.forEach((cell, idx) => {
        if (!cell) emptyIndices.push(idx);
      });

      if (emptyIndices.length > 0) {
        // Smart or random pick
        const botPick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const nextBoard = [...currentBoard];
        nextBoard[botPick] = 'O';
        setBoard(nextBoard);
        playSound('click');

        const winResult = checkWinningCondition(nextBoard);
        if (winResult) {
          finishGame(winResult);
        } else {
          setIsPlayerTurn(true);
        }
      }
    }, 900);
  };

  const finishGame = (res: 'X' | 'O' | 'draw') => {
    setWinner(res);
    if (res === 'X') {
      playSound('win');
      confetti({ particleCount: 70, spread: 60 });
      setScore(s => ({ ...s, player: s.player + 1 }));
    } else if (res === 'O') {
      playSound('wrong');
      setScore(s => ({ ...s, bot: s.bot + 1 }));
    }
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setActiveCellIndex(null);
    setWinner(null);
  };

  // Active question choices for chosen cell
  const activeWord = activeCellIndex !== null ? cellWords[activeCellIndex % cellWords.length] : null;
  const questionChoices = useMemo(() => {
    if (!activeWord) return [];
    const others = words
      .filter(w => w.id !== activeWord.id)
      .map(w => w.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    return [
      { text: activeWord.definition, correct: true },
      ...others.map(text => ({ text, correct: false })),
    ].sort(() => Math.random() - 0.5);
  }, [activeWord, words]);

  return (
    <div className="max-w-xl mx-auto">
      {/* Header with Scores */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Word Tic-Tac-Toe</h2>
          <p className="text-xs text-slate-500">Answer vocabulary questions correctly to claim squares!</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold">
          <div className="flex items-center gap-1 text-indigo-600">
            <User className="w-4 h-4" /> You (X): {score.player}
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-rose-500">
            <Bot className="w-4 h-4" /> AI Bot (O): {score.bot}
          </div>
        </div>
      </div>

      {/* Turn indicator */}
      <div className="text-center mb-4">
        {winner ? (
          <span className="text-base font-black text-indigo-600">
            {winner === 'X' ? '🎉 You Won the Match!' : winner === 'O' ? '🤖 AI Bot Won!' : '🤝 Cat’s Game (Draw)!'}
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-500">
            {isPlayerTurn ? '👉 Your Turn (Click an empty square to answer)' : '🤖 AI Bot is thinking...'}
          </span>
        )}
      </div>

      {/* 3x3 Board */}
      <div className="grid grid-cols-3 gap-3 bg-slate-200 p-3 rounded-2xl shadow-inner max-w-sm mx-auto mb-6">
        {board.map((cell, idx) => {
          const word = cellWords[idx % cellWords.length];

          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={!!cell || !!winner || !isPlayerTurn}
              className={`h-24 sm:h-28 rounded-xl bg-white border-2 border-slate-300 hover:border-indigo-400 font-black text-3xl shadow-sm flex flex-col items-center justify-center p-2 transition cursor-pointer disabled:cursor-not-allowed ${
                cell === 'X'
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
                  : cell === 'O'
                  ? 'bg-rose-50 border-rose-400 text-rose-500'
                  : 'hover:bg-slate-50'
              }`}
            >
              {cell === 'X' && <X className="w-10 h-10 stroke-[3]" />}
              {cell === 'O' && <Circle className="w-9 h-9 stroke-[3]" />}
              {!cell && word && (
                <span className="text-[11px] text-slate-500 font-semibold text-center leading-tight line-clamp-2">
                  {word.term}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Question Modal/Drawer when cell clicked */}
      {activeCellIndex !== null && activeWord && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-xl animate-fade-in mb-6">
          <div className="text-center mb-4">
            <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Claim this square
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-2">{activeWord.term}</h3>
            <p className="text-xs text-slate-500 mt-1">Select the correct definition to place your X:</p>
          </div>

          <div className="space-y-2.5">
            {questionChoices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleAnswerQuestion(choice.correct)}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-left text-xs sm:text-sm font-medium transition"
              >
                {choice.text}
              </button>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setActiveCellIndex(null)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Cancel square selection
            </button>
          </div>
        </div>
      )}

      {/* Play Again Button */}
      {winner && (
        <div className="text-center">
          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
          >
            <RotateCcw className="w-4 h-4" />
            Play Next Round
          </button>
        </div>
      )}
    </div>
  );
};
