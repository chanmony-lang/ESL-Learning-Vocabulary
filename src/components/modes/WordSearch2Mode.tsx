import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { playSound, speakWord } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

const GRID_SIZE = 10;

export const WordSearch2Mode: React.FC<Props> = ({ words, accent }) => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<Array<{ r: number; c: number }>>([]);
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Take up to 6 clean words (3-8 letters)
  const candidateWords = useMemo(() => {
    return words
      .filter(w => /^[a-zA-Z]{3,8}$/.test(w.term.trim()))
      .slice(0, 6)
      .map(w => w.term.toUpperCase());
  }, [words]);

  const generateGrid = () => {
    const newGrid: string[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(''));

    const successfullyPlaced: string[] = [];

    // Directions: Horizontal (right & left), Vertical (down & up), Diagonal (down-right)
    const directions = [
      { dr: 0, dc: 1 },  // right
      { dr: 0, dc: -1 }, // left
      { dr: 1, dc: 0 },  // down
      { dr: -1, dc: 0 }, // up
      { dr: 1, dc: 1 },  // diagonal down-right
    ];

    candidateWords.forEach(word => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 120) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * GRID_SIZE);
        const startC = Math.floor(Math.random() * GRID_SIZE);

        const endR = startR + dir.dr * (word.length - 1);
        const endC = startC + dir.dc * (word.length - 1);

        if (endR >= 0 && endR < GRID_SIZE && endC >= 0 && endC < GRID_SIZE) {
          // Check collision
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            const currR = startR + dir.dr * i;
            const currC = startC + dir.dc * i;
            const existing = newGrid[currR][currC];
            if (existing !== '' && existing !== word[i]) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            for (let i = 0; i < word.length; i++) {
              newGrid[startR + dir.dr * i][startC + dir.dc * i] = word[i];
            }
            successfullyPlaced.push(word);
            placed = true;
          }
        }
      }
    });

    // Fill remaining blanks with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!newGrid[r][c]) {
          newGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setGrid(newGrid);
    setPlacedWords(successfullyPlaced);
    setFoundWords([]);
    setSelectedCells([]);
    setIsWon(false);
    setSeconds(0);
  };

  useEffect(() => {
    generateGrid();
  }, [candidateWords]);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isWon]);

  const handleCellClick = (r: number, c: number) => {
    playSound('click');
    const isAlreadySelected = selectedCells.some(cell => cell.r === r && cell.c === c);

    let nextSelection: Array<{ r: number; c: number }>;
    if (isAlreadySelected) {
      nextSelection = selectedCells.filter(cell => !(cell.r === r && cell.c === c));
    } else {
      nextSelection = [...selectedCells, { r, c }];
    }
    setSelectedCells(nextSelection);

    // Check if current letters form any placed word
    const formed = nextSelection.map(cell => grid[cell.r][cell.c]).join('');
    const formedReverse = formed.split('').reverse().join('');

    const matched = placedWords.find(w => !foundWords.includes(w) && (w === formed || w === formedReverse));
    if (matched) {
      playSound('correct');
      const updatedFound = [...foundWords, matched];
      setFoundWords(updatedFound);
      setSelectedCells([]);
      speakWord(matched, accent);

      if (updatedFound.length === placedWords.length) {
        setIsWon(true);
        playSound('win');
        confetti({ particleCount: 80, spread: 70 });
      }
    }
  };

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(cell => cell.r === r && cell.c === c);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">WordSearch 2 (Advanced)</span>
          <p className="text-base font-bold text-slate-800">
            Multi-Directional & Diagonal Search
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-xl text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
          </div>
          <button
            onClick={generateGrid}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="New Grid"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Word Search Grid */}
        <div className="md:col-span-2 bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-4 flex flex-col items-center">
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5 select-none">
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const selected = isCellSelected(r, c);

                return (
                  <button
                    key={`${r}_${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg font-black text-xs sm:text-base flex items-center justify-center transition-all cursor-pointer ${
                      selected
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : 'bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Word Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Words to Find ({foundWords.length}/{placedWords.length})
            </h3>
          </div>

          <div className="space-y-2">
            {placedWords.map(word => {
              const isFound = foundWords.includes(word);
              return (
                <div
                  key={word}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                    isFound
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 line-through opacity-70'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span>{word}</span>
                  {isFound && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
              );
            })}
          </div>

          {selectedCells.length > 0 && (
            <button
              onClick={() => setSelectedCells([])}
              className="w-full mt-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl transition"
            >
              Clear Current Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
