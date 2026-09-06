import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Check, Sparkles } from 'lucide-react';

interface Props {
  words: VocabWord[];
  definitionCluesOnly?: boolean; // If true, this is WordSearch 2
}

interface CellPos {
  r: number;
  c: number;
}

const GRID_SIZE = 10;

export const WordSearchMode: React.FC<Props> = ({ words, definitionCluesOnly = false }) => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<Array<{ term: string; definition: string; cells: CellPos[] }>>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellPos[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // Filter words to single-word terms with 3-9 letters for clean fit in 10x10
  const candidateWords = useMemo(() => {
    return words
      .filter(w => /^[a-zA-Z]{3,9}$/.test(w.term.trim()))
      .slice(0, 6);
  }, [words]);

  const generateBoard = () => {
    // 10x10 empty board
    const newGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    const placed: Array<{ term: string; definition: string; cells: CellPos[] }> = [];

    // Directions: horizontal, vertical, diagonal-down
    const dirs = [
      { dr: 0, dc: 1 },  // right
      { dr: 1, dc: 0 },  // down
      { dr: 1, dc: 1 },  // diag down-right
    ];

    for (const wordObj of candidateWords) {
      const termUpper = wordObj.term.trim().toUpperCase();
      let placedSuccess = false;
      let attempts = 0;

      while (!placedSuccess && attempts < 100) {
        attempts++;
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const maxR = GRID_SIZE - (dir.dr * termUpper.length);
        const maxC = GRID_SIZE - (dir.dc * termUpper.length);

        if (maxR <= 0 || maxC <= 0) continue;

        const startR = Math.floor(Math.random() * maxR);
        const startC = Math.floor(Math.random() * maxC);

        let canFit = true;
        const cells: CellPos[] = [];

        for (let i = 0; i < termUpper.length; i++) {
          const r = startR + dir.dr * i;
          const c = startC + dir.dc * i;
          if (newGrid[r][c] !== '' && newGrid[r][c] !== termUpper[i]) {
            canFit = false;
            break;
          }
          cells.push({ r, c });
        }

        if (canFit) {
          for (let i = 0; i < termUpper.length; i++) {
            newGrid[cells[i].r][cells[i].c] = termUpper[i];
          }
          placed.push({
            term: termUpper,
            definition: wordObj.definition,
            cells,
          });
          placedSuccess = true;
        }
      }
    }

    // Fill remaining with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!newGrid[r][c]) {
          newGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setGrid(newGrid);
    setPlacedWords(placed);
    setFoundWords([]);
    setSelectedCells([]);
    setIsWon(false);
  };

  useEffect(() => {
    generateBoard();
  }, [candidateWords]);

  const handleCellClick = (r: number, c: number) => {
    playSound('click');
    const existingIndex = selectedCells.findIndex(cell => cell.r === r && cell.c === c);

    let newSelection: CellPos[];
    if (existingIndex >= 0) {
      newSelection = selectedCells.filter((_, idx) => idx !== existingIndex);
    } else {
      newSelection = [...selectedCells, { r, c }];
    }

    setSelectedCells(newSelection);

    // Check if new selection matches any placed word
    const selectedString = newSelection.map(p => grid[p.r]?.[p.c]).join('');
    const reversedString = selectedString.split('').reverse().join('');

    const matched = placedWords.find(
      p => !foundWords.includes(p.term) && (p.term === selectedString || p.term === reversedString)
    );

    if (matched) {
      playSound('correct');
      const updatedFound = [...foundWords, matched.term];
      setFoundWords(updatedFound);
      setSelectedCells([]);
      confetti({ particleCount: 30, spread: 50 });

      if (updatedFound.length === placedWords.length) {
        setIsWon(true);
        playSound('win');
        confetti({ particleCount: 100, spread: 80 });
      }
    }
  };

  const isCellInFoundWord = (r: number, c: number) => {
    return placedWords.some(
      pw => foundWords.includes(pw.term) && pw.cells.some(cell => cell.r === r && cell.c === c)
    );
  };

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(cell => cell.r === r && cell.c === c);
  };

  if (candidateWords.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Word Search requires words without spaces (3-9 characters). Please add or edit words in this set!
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {definitionCluesOnly ? 'WordSearch 2 (Definition Clues)' : 'WordSearch (Classic)'}
          </h2>
          <p className="text-xs text-slate-500">
            {definitionCluesOnly
              ? 'Read the definition clues, deduce the term, and tap the letters in the grid!'
              : 'Tap the letter cells in sequence to find and circle the hidden vocabulary terms.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Found: {foundWords.length} / {placedWords.length}
          </span>
          <button
            onClick={generateBoard}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
            title="Regenerate grid"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isWon && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-600" />
            <span className="font-bold">Fantastic job! All hidden vocabulary words discovered!</span>
          </div>
          <button
            onClick={generateBoard}
            className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Letter Grid */}
        <div className="md:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5 select-none">
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const isFound = isCellInFoundWord(r, c);
                const isSel = isCellSelected(r, c);

                let cellClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50';
                if (isFound) {
                  cellClass = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-extrabold';
                } else if (isSel) {
                  cellClass = 'bg-indigo-600 border-indigo-700 text-white font-black scale-105 shadow';
                }

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center font-bold text-xs sm:text-base transition-all ${cellClass}`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setSelectedCells([])}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Clear current selection
            </button>
          </div>
        </div>

        {/* Word / Clues List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
            {definitionCluesOnly ? 'Definition Clues' : 'Target Vocabulary'}
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {placedWords.map((item, idx) => {
              const isDiscovered = foundWords.includes(item.term);

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition ${
                    isDiscovered
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 line-through opacity-70'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {definitionCluesOnly ? (
                    <div>
                      <p className="font-medium text-slate-700 mb-1">{item.definition}</p>
                      {isDiscovered && (
                        <p className="font-bold text-emerald-700 not-italic no-underline">
                          Answer: {item.term}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{item.term}</span>
                      {isDiscovered && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
