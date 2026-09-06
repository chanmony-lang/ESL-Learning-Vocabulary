import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { VocabWord } from '../../types';
import { playSound, speakWord } from '../../utils/audio';
import { recordActivityCompletion } from '../../utils/gamification';
import confetti from 'canvas-confetti';
import {
  Clock,
  RotateCcw,
  Eye,
  Check,
  Award,
  Volume2,
  Shuffle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export interface CrosswordClue {
  id: string;
  num: number;
  direction: 'across' | 'down';
  word: string;
  originalTerm: string;
  clue: string;
  row: number;
  col: number;
  length: number;
}

interface PuzzleData {
  numRows: number;
  numCols: number;
  solution: (string | null)[][];
  cellNumbers: (number | null)[][];
  cellClues: { across?: CrosswordClue; down?: CrosswordClue }[][];
  clues: CrosswordClue[];
  wordsPlacedCount: number;
}

// Fallback high-frequency ESL words if the active study set has fewer than 6 suitable words
const FALLBACK_WORDS: { term: string; definition: string }[] = [
  { term: 'LEARN', definition: 'Acquire knowledge or skills through study, experience, or teaching' },
  { term: 'VOCABULARY', definition: 'A body of words used in a particular language or activity' },
  { term: 'STUDY', definition: 'Devote time and attention to acquiring knowledge on an academic subject' },
  { term: 'PRACTICE', definition: 'Perform an activity or exercise repeatedly to acquire proficiency' },
  { term: 'CHALLENGE', definition: 'A task or situation that tests someone’s ability and skill' },
  { term: 'DISCOVER', definition: 'Find unexpectedly or in the course of a search or journey' },
  { term: 'EXCELLENT', definition: 'Extremely good; outstanding of its kind and quality' },
  { term: 'INSIGHT', definition: 'An accurate and deep intuitive understanding of a concept' },
  { term: 'LANGUAGE', definition: 'A systematic means of communicating ideas or feelings by sounds and signs' },
  { term: 'MEMORIZE', definition: 'Commit to memory; learn by heart for future recall' },
];

/**
 * Robust, dynamic crossword generator that interlocks vocabulary words
 * and dynamically calculates the grid dimensions (rows x cols) based on word lengths.
 */
function generateCrosswordPuzzle(vocabWords: VocabWord[], seed: number): PuzzleData {
  // 1. Clean candidate words: A-Z uppercase only, 3 to 15 chars
  const candidates: { term: string; originalTerm: string; definition: string }[] = [];
  const seenTerms = new Set<string>();

  vocabWords.forEach(w => {
    const clean = w.term.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (clean.length >= 3 && clean.length <= 15 && !seenTerms.has(clean)) {
      seenTerms.add(clean);
      candidates.push({
        term: clean,
        originalTerm: w.term,
        definition: w.definition || `Definition for ${w.term}`,
      });
    }
  });

  // Ensure we have at least 8 candidate words using fallbacks
  FALLBACK_WORDS.forEach(fw => {
    if (candidates.length < 8 && !seenTerms.has(fw.term)) {
      seenTerms.add(fw.term);
      candidates.push({
        term: fw.term,
        originalTerm: fw.term,
        definition: fw.definition,
      });
    }
  });

  // Pseudo-random shuffle seeded by `seed` then sort primarily by length
  const pseudoRandom = (n: number) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  const pool = [...candidates]
    .sort((a, b) => pseudoRandom(a.term.length) - 0.5)
    .sort((a, b) => b.term.length - a.term.length)
    .slice(0, 12);

  if (pool.length === 0) {
    pool.push({ term: 'LEARN', originalTerm: 'Learn', definition: 'Acquire knowledge' });
  }

  // 2. Elastic coordinate placement system
  interface PlacedItem {
    id: string;
    term: string;
    originalTerm: string;
    definition: string;
    direction: 'across' | 'down';
    row: number;
    col: number;
    length: number;
  }

  const placed: PlacedItem[] = [];
  const letterMap = new Map<string, string>(); // 'r,c' => char
  const horizontalOccupied = new Set<string>(); // 'r,c'
  const verticalOccupied = new Set<string>(); // 'r,c'

  // Place first word horizontally at (0, 0)
  const first = pool[0];
  placed.push({
    id: `placed-0`,
    term: first.term,
    originalTerm: first.originalTerm,
    definition: first.definition,
    direction: 'across',
    row: 0,
    col: 0,
    length: first.term.length,
  });

  for (let c = 0; c < first.term.length; c++) {
    const key = `0,${c}`;
    letterMap.set(key, first.term[c]);
    horizontalOccupied.add(key);
  }

  // Helper to test if a candidate can be legally placed
  const canPlace = (
    term: string,
    row: number,
    col: number,
    direction: 'across' | 'down'
  ): { valid: boolean; intersections: number } => {
    let intersections = 0;
    const len = term.length;

    // Check boundary right before word
    const beforeKey = direction === 'across' ? `${row},${col - 1}` : `${row - 1},${col}`;
    if (letterMap.has(beforeKey)) return { valid: false, intersections: 0 };

    // Check boundary right after word
    const afterKey = direction === 'across' ? `${row},${col + len}` : `${row + len},${col}`;
    if (letterMap.has(afterKey)) return { valid: false, intersections: 0 };

    for (let i = 0; i < len; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      const key = `${r},${c}`;
      const existing = letterMap.get(key);

      if (existing !== undefined) {
        // Must match exact letter
        if (existing !== term[i]) return { valid: false, intersections: 0 };
        // Cannot overlap in same direction
        if (direction === 'across' && horizontalOccupied.has(key)) return { valid: false, intersections: 0 };
        if (direction === 'down' && verticalOccupied.has(key)) return { valid: false, intersections: 0 };
        intersections++;
      } else {
        // Parallel neighbor check: perpendicular adjacent cells cannot be occupied unless crossing
        if (direction === 'across') {
          if (letterMap.has(`${r - 1},${c}`) || letterMap.has(`${r + 1},${c}`)) {
            return { valid: false, intersections: 0 };
          }
        } else {
          if (letterMap.has(`${r},${c - 1}`) || letterMap.has(`${r},${c + 1}`)) {
            return { valid: false, intersections: 0 };
          }
        }
      }
    }

    return { valid: intersections > 0, intersections };
  };

  // Try placing subsequent words by finding matching intersecting letters
  for (let idx = 1; idx < pool.length; idx++) {
    const candidate = pool[idx];
    let bestScore = -Infinity;
    let bestPlacement: { row: number; col: number; direction: 'across' | 'down' } | null = null;

    for (const pw of placed) {
      for (let pi = 0; pi < pw.length; pi++) {
        const targetChar = pw.term[pi];
        for (let ci = 0; ci < candidate.term.length; ci++) {
          if (candidate.term[ci] === targetChar) {
            const newDir: 'across' | 'down' = pw.direction === 'across' ? 'down' : 'across';
            const newRow = pw.direction === 'across' ? pw.row - ci : pw.row + pi;
            const newCol = pw.direction === 'across' ? pw.col + pi : pw.col - ci;

            const check = canPlace(candidate.term, newRow, newCol, newDir);
            if (check.valid) {
              // Score based on intersections and compactness
              let minR = Math.min(...placed.map(p => p.row), newRow);
              let maxR = Math.max(
                ...placed.map(p => (p.direction === 'down' ? p.row + p.length - 1 : p.row)),
                newDir === 'down' ? newRow + candidate.term.length - 1 : newRow
              );
              let minC = Math.min(...placed.map(p => p.col), newCol);
              let maxC = Math.max(
                ...placed.map(p => (p.direction === 'across' ? p.col + p.length - 1 : p.col)),
                newDir === 'across' ? newCol + candidate.term.length - 1 : newCol
              );
              const height = maxR - minR + 1;
              const width = maxC - minC + 1;
              const area = height * width;
              const ratioDiff = Math.abs(height - width);

              const score = check.intersections * 35 - area * 0.3 - ratioDiff * 2.5;

              if (score > bestScore) {
                bestScore = score;
                bestPlacement = { row: newRow, col: newCol, direction: newDir };
              }
            }
          }
        }
      }
    }

    // Apply best placement if found
    if (bestPlacement) {
      const { row, col, direction } = bestPlacement;
      placed.push({
        id: `placed-${idx}`,
        term: candidate.term,
        originalTerm: candidate.originalTerm,
        definition: candidate.definition,
        direction,
        row,
        col,
        length: candidate.term.length,
      });

      for (let i = 0; i < candidate.term.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;
        const key = `${r},${c}`;
        letterMap.set(key, candidate.term[i]);
        if (direction === 'across') horizontalOccupied.add(key);
        else verticalOccupied.add(key);
      }
    }
  }

  // 3. Normalize bounding box so the grid dynamically fits the placed words exactly
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;

  placed.forEach(p => {
    minR = Math.min(minR, p.row);
    minC = Math.min(minC, p.col);
    const endR = p.direction === 'down' ? p.row + p.length - 1 : p.row;
    const endC = p.direction === 'across' ? p.col + p.length - 1 : p.col;
    maxR = Math.max(maxR, endR);
    maxC = Math.max(maxC, endC);
  });

  const numRows = maxR - minR + 1;
  const numCols = maxC - minC + 1;

  placed.forEach(p => {
    p.row -= minR;
    p.col -= minC;
  });

  // 4. Standard Crossword Clue Numbering (scan top-left to bottom-right)
  let nextNum = 1;
  const clues: CrosswordClue[] = [];

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const acrossStart = placed.find(p => p.direction === 'across' && p.row === r && p.col === c);
      const downStart = placed.find(p => p.direction === 'down' && p.row === r && p.col === c);

      if (acrossStart || downStart) {
        const assignedNum = nextNum++;
        if (acrossStart) {
          clues.push({
            id: `across-${assignedNum}`,
            num: assignedNum,
            direction: 'across',
            word: acrossStart.term,
            originalTerm: acrossStart.originalTerm,
            clue: acrossStart.definition,
            row: r,
            col: c,
            length: acrossStart.length,
          });
        }
        if (downStart) {
          clues.push({
            id: `down-${assignedNum}`,
            num: assignedNum,
            direction: 'down',
            word: downStart.term,
            originalTerm: downStart.originalTerm,
            clue: downStart.definition,
            row: r,
            col: c,
            length: downStart.length,
          });
        }
      }
    }
  }

  // 5. Build solution and clue mapping matrices
  const solution: (string | null)[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(null));

  const cellNumbers: (number | null)[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(null));

  const cellClues: { across?: CrosswordClue; down?: CrosswordClue }[][] = Array(numRows)
    .fill(null)
    .map(() => Array(numCols).fill(null).map(() => ({})));

  // Populate cell clue numbers at starting coordinates
  clues.forEach(clue => {
    cellNumbers[clue.row][clue.col] = clue.num;
  });

  // Populate solution letters and link cell coordinates to clues
  clues.forEach(clue => {
    for (let i = 0; i < clue.length; i++) {
      const r = clue.direction === 'across' ? clue.row : clue.row + i;
      const c = clue.direction === 'across' ? clue.col + i : clue.col;
      solution[r][c] = clue.word[i];
      if (clue.direction === 'across') {
        cellClues[r][c].across = clue;
      } else {
        cellClues[r][c].down = clue;
      }
    }
  });

  return {
    numRows,
    numCols,
    solution,
    cellNumbers,
    cellClues,
    clues,
    wordsPlacedCount: clues.length,
  };
}

export const CrosswordMode: React.FC<Props> = ({ words, accent }) => {
  const [seed, setSeed] = useState(1);

  // Generate crossword puzzle dynamically based on words
  const puzzle = useMemo(() => {
    return generateCrosswordPuzzle(words, seed);
  }, [words, seed]);

  // Player state
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    Array(puzzle.numRows).fill('').map(() => Array(puzzle.numCols).fill(''))
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [seconds, setSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wrongCells, setWrongCells] = useState<{ [key: string]: boolean }>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Find first playable cell
  const findFirstPlayableCell = useCallback(() => {
    for (let r = 0; r < puzzle.numRows; r++) {
      for (let c = 0; c < puzzle.numCols; c++) {
        if (puzzle.solution[r][c] !== null) {
          return { row: r, col: c };
        }
      }
    }
    return { row: 0, col: 0 };
  }, [puzzle]);

  // Reset when puzzle changes
  useEffect(() => {
    setUserGrid(Array(puzzle.numRows).fill('').map(() => Array(puzzle.numCols).fill('')));
    const firstCell = findFirstPlayableCell();
    setSelectedCell(firstCell);

    // Pick direction supported by first cell
    const cellData = puzzle.cellClues[firstCell.row]?.[firstCell.col];
    if (cellData?.across) {
      setDirection('across');
    } else if (cellData?.down) {
      setDirection('down');
    }

    setSeconds(0);
    setIsCompleted(false);
    setWrongCells({});
    setStatusMessage(null);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [puzzle, findFirstPlayableCell]);

  // Currently active clue based on selectedCell and direction
  const activeClue = useMemo(() => {
    const cellClueInfo = puzzle.cellClues[selectedCell.row]?.[selectedCell.col];
    if (!cellClueInfo) return puzzle.clues[0];

    if (direction === 'across' && cellClueInfo.across) {
      return cellClueInfo.across;
    }
    if (direction === 'down' && cellClueInfo.down) {
      return cellClueInfo.down;
    }
    return cellClueInfo.across || cellClueInfo.down || puzzle.clues[0];
  }, [puzzle, selectedCell, direction]);

  // Check if a cell is part of the currently active clue
  const isCellInActiveWord = (r: number, c: number) => {
    if (!activeClue) return false;
    if (activeClue.direction === 'across') {
      return r === activeClue.row && c >= activeClue.col && c < activeClue.col + activeClue.length;
    } else {
      return c === activeClue.col && r >= activeClue.row && r < activeClue.row + activeClue.length;
    }
  };

  // Check if a clue is completely filled and correct
  const isClueSolved = (clue: CrosswordClue) => {
    for (let i = 0; i < clue.length; i++) {
      const r = clue.direction === 'across' ? clue.row : clue.row + i;
      const c = clue.direction === 'across' ? clue.col + i : clue.col;
      if (userGrid[r]?.[c] !== clue.word[i]) {
        return false;
      }
    }
    return true;
  };

  // Cell click handler: toggles direction if clicked twice on intersection
  const handleCellClick = (r: number, c: number) => {
    if (puzzle.solution[r][c] === null) return; // Blocked cell

    if (selectedCell.row === r && selectedCell.col === c) {
      const info = puzzle.cellClues[r][c];
      if (info.across && info.down) {
        setDirection(d => (d === 'across' ? 'down' : 'across'));
      }
    } else {
      setSelectedCell({ row: r, col: c });
      const info = puzzle.cellClues[r][c];
      if (direction === 'across' && !info.across && info.down) {
        setDirection('down');
      } else if (direction === 'down' && !info.down && info.across) {
        setDirection('across');
      }
    }
    playSound('click');
  };

  // Typing a letter
  const handleCharInput = (char: string) => {
    if (isCompleted) return;
    if (puzzle.solution[selectedCell.row][selectedCell.col] === null) return;

    const upper = char.toUpperCase();
    const newGrid = userGrid.map(row => [...row]);
    newGrid[selectedCell.row][selectedCell.col] = upper;
    setUserGrid(newGrid);
    playSound('click');

    // Clear wrong indicator if present
    const key = `${selectedCell.row}-${selectedCell.col}`;
    if (wrongCells[key]) {
      setWrongCells(prev => ({ ...prev, [key]: false }));
    }

    // Move cursor forward along the current active word
    if (activeClue) {
      if (activeClue.direction === 'across') {
        const nextCol = selectedCell.col + 1;
        if (nextCol < activeClue.col + activeClue.length) {
          setSelectedCell({ row: selectedCell.row, col: nextCol });
        }
      } else {
        const nextRow = selectedCell.row + 1;
        if (nextRow < activeClue.row + activeClue.length) {
          setSelectedCell({ row: nextRow, col: selectedCell.col });
        }
      }
    }

    checkPuzzleSolved(newGrid);
  };

  // Backspace handler
  const handleBackspace = () => {
    if (isCompleted) return;
    if (puzzle.solution[selectedCell.row][selectedCell.col] === null) return;

    const newGrid = userGrid.map(row => [...row]);
    if (newGrid[selectedCell.row][selectedCell.col]) {
      newGrid[selectedCell.row][selectedCell.col] = '';
      setUserGrid(newGrid);
    } else if (activeClue) {
      // Step back in the active word
      if (activeClue.direction === 'across') {
        if (selectedCell.col > activeClue.col) {
          setSelectedCell({ row: selectedCell.row, col: selectedCell.col - 1 });
          newGrid[selectedCell.row][selectedCell.col - 1] = '';
          setUserGrid(newGrid);
        }
      } else {
        if (selectedCell.row > activeClue.row) {
          setSelectedCell({ row: selectedCell.row - 1, col: selectedCell.col });
          newGrid[selectedCell.row - 1][selectedCell.col] = '';
          setUserGrid(newGrid);
        }
      }
    }
    playSound('click');
  };

  // Check if entire puzzle is solved
  const checkPuzzleSolved = (grid: string[][]) => {
    let allFilled = true;
    let allCorrect = true;

    for (let r = 0; r < puzzle.numRows; r++) {
      for (let c = 0; c < puzzle.numCols; c++) {
        const target = puzzle.solution[r][c];
        if (target !== null) {
          if (!grid[r][c]) {
            allFilled = false;
          } else if (grid[r][c] !== target) {
            allCorrect = false;
          }
        }
      }
    }

    if (allFilled && allCorrect) {
      clearInterval(timerRef.current);
      setIsCompleted(true);
      playSound('correct');
      confetti({ particleCount: 75, spread: 80 });
      recordActivityCompletion('crossword', 60);
      setStatusMessage('Congratulations! Entire crossword completed!');
    }
  };

  // Check answers button
  const handleCheckPuzzle = () => {
    const wrongs: { [key: string]: boolean } = {};
    let errorCount = 0;

    for (let r = 0; r < puzzle.numRows; r++) {
      for (let c = 0; c < puzzle.numCols; c++) {
        const target = puzzle.solution[r][c];
        if (target !== null && userGrid[r][c]) {
          if (userGrid[r][c] !== target) {
            wrongs[`${r}-${c}`] = true;
            errorCount++;
          }
        }
      }
    }

    setWrongCells(wrongs);
    if (errorCount === 0) {
      playSound('correct');
      setStatusMessage('Looking great! All checked letters are correct.');
    } else {
      playSound('wrong');
      setStatusMessage(`Found ${errorCount} incorrect letter${errorCount > 1 ? 's' : ''} (highlighted in red).`);
    }
  };

  // Reveal letter for selected cell
  const handleRevealLetter = () => {
    const target = puzzle.solution[selectedCell.row]?.[selectedCell.col];
    if (target) {
      handleCharInput(target);
      setStatusMessage(`Revealed letter '${target}'.`);
    }
  };

  // Reveal entire active word
  const handleRevealWord = () => {
    if (!activeClue) return;
    const newGrid = userGrid.map(row => [...row]);
    for (let i = 0; i < activeClue.length; i++) {
      const r = activeClue.direction === 'across' ? activeClue.row : activeClue.row + i;
      const c = activeClue.direction === 'across' ? activeClue.col + i : activeClue.col;
      newGrid[r][c] = activeClue.word[i];
    }
    setUserGrid(newGrid);
    playSound('correct');
    setStatusMessage(`Revealed word: ${activeClue.originalTerm}.`);
    checkPuzzleSolved(newGrid);
  };

  // Reveal entire crossword
  const handleRevealGrid = () => {
    const solvedGrid = puzzle.solution.map(row => row.map(cell => cell || ''));
    setUserGrid(solvedGrid);
    checkPuzzleSolved(solvedGrid);
  };

  // Clear user entries
  const handleClearGrid = () => {
    setUserGrid(Array(puzzle.numRows).fill('').map(() => Array(puzzle.numCols).fill('')));
    setWrongCells({});
    setStatusMessage('Crossword cleared.');
    playSound('click');
  };

  // Select clue from list
  const handleSelectClue = (clue: CrosswordClue) => {
    setDirection(clue.direction);
    // Find first empty cell or start cell
    let targetRow = clue.row;
    let targetCol = clue.col;
    for (let i = 0; i < clue.length; i++) {
      const r = clue.direction === 'across' ? clue.row : clue.row + i;
      const c = clue.direction === 'across' ? clue.col + i : clue.col;
      if (!userGrid[r]?.[c]) {
        targetRow = r;
        targetCol = c;
        break;
      }
    }
    setSelectedCell({ row: targetRow, col: targetCol });
    playSound('click');
  };

  // Physical keyboard listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleCharInput(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === ' ') {
        e.preventDefault();
        // Toggle direction
        setDirection(d => (d === 'across' ? 'down' : 'across'));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Move to next clue
        const currentIndex = puzzle.clues.findIndex(c => c.id === activeClue?.id);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + puzzle.clues.length) % puzzle.clues.length
          : (currentIndex + 1) % puzzle.clues.length;
        handleSelectClue(puzzle.clues[nextIndex]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Move right to next playable cell
        for (let c = selectedCell.col + 1; c < puzzle.numCols; c++) {
          if (puzzle.solution[selectedCell.row][c] !== null) {
            setSelectedCell({ row: selectedCell.row, col: c });
            break;
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        for (let c = selectedCell.col - 1; c >= 0; c--) {
          if (puzzle.solution[selectedCell.row][c] !== null) {
            setSelectedCell({ row: selectedCell.row, col: c });
            break;
          }
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        for (let r = selectedCell.row + 1; r < puzzle.numRows; r++) {
          if (puzzle.solution[r][selectedCell.col] !== null) {
            setSelectedCell({ row: r, col: selectedCell.col });
            break;
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        for (let r = selectedCell.row - 1; r >= 0; r--) {
          if (puzzle.solution[r][selectedCell.col] !== null) {
            setSelectedCell({ row: r, col: selectedCell.col });
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine cell sizing based on grid dimensions
  const maxDim = Math.max(puzzle.numRows, puzzle.numCols);
  const cellSizeClass =
    maxDim <= 7
      ? 'w-11 h-11 sm:w-13 sm:h-13 text-xl'
      : maxDim <= 10
      ? 'w-9 h-9 sm:w-11 sm:h-11 text-lg'
      : maxDim <= 13
      ? 'w-8 h-8 sm:w-9 sm:h-9 text-base'
      : 'w-7 h-7 sm:w-8 sm:h-8 text-sm';

  const solvedCluesCount = puzzle.clues.filter(isClueSolved).length;

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#ce82ff] border-b-4 border-[#b05eed] text-white flex items-center justify-center font-black text-xl shadow-xs">
            X
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                NYT Crossword
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black">
                Full Grid
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Dynamic {puzzle.numCols}×{puzzle.numRows} layout • {puzzle.wordsPlacedCount} vocabulary words
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs font-black bg-white px-3 py-1.5 rounded-2xl border-2 border-slate-200 shadow-2xs">
            <span className="text-purple-600 font-bold">Solved:</span>
            <span>{solvedCluesCount}/{puzzle.clues.length}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-black bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatTime(seconds)}</span>
          </div>

          <button
            onClick={() => setSeed(s => s + 1)}
            className="p-1.5 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center gap-1 text-xs font-bold"
            title="Generate a fresh crossword arrangement from set words"
          >
            <Shuffle className="w-4 h-4 text-purple-600" />
            <span className="hidden md:inline">New Layout</span>
          </button>
        </div>
      </div>

      {/* Active Clue Banner */}
      <div className="p-3.5 sm:p-4 bg-purple-50/80 border-2 border-purple-200 rounded-3xl mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {activeClue ? `${activeClue.num}` : '1'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wide text-xs text-purple-700">
                {activeClue?.num} {activeClue?.direction}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                ({activeClue?.length} letters)
              </span>
              {activeClue && (
                <button
                  onClick={() => speakWord(activeClue.originalTerm, accent)}
                  className="p-1 hover:bg-purple-200/60 rounded-full text-purple-700 transition"
                  title="Listen to pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800">
              {activeClue?.clue}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDirection(d => (d === 'across' ? 'down' : 'across'))}
          className="self-end sm:self-auto px-3 py-1.5 rounded-2xl bg-white border-2 border-purple-200 hover:bg-purple-100/50 text-purple-700 text-xs font-black transition flex items-center gap-1 shadow-2xs"
        >
          {direction === 'across' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          <span>Switch to {direction === 'across' ? 'Down' : 'Across'}</span>
        </button>
      </div>

      {/* Status or Error feedback */}
      {statusMessage && (
        <div className="mb-4 text-xs font-semibold px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 text-center animate-fadeIn">
          {statusMessage}
        </div>
      )}

      {/* Main Game Layout: Grid & Clues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
        {/* Dynamic Crossword Grid */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full overflow-x-auto pb-4 flex justify-center">
            <div
              className="inline-grid gap-1 p-2 bg-slate-950 rounded-3xl border-4 border-slate-900 shadow-lg"
              style={{
                gridTemplateColumns: `repeat(${puzzle.numCols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: puzzle.numRows }).map((_, r) =>
                Array.from({ length: puzzle.numCols }).map((_, c) => {
                  const isPlayable = puzzle.solution[r][c] !== null;

                  if (!isPlayable) {
                    // Blocked square (standard NYT crossword black tile)
                    return (
                      <div
                        key={`blocked-${r}-${c}`}
                        className={`${cellSizeClass} bg-slate-900 border border-slate-950 rounded-lg select-none`}
                      />
                    );
                  }

                  const isSelected = selectedCell.row === r && selectedCell.col === c;
                  const inActiveWord = isCellInActiveWord(r, c);
                  const isWrong = wrongCells[`${r}-${c}`];
                  const letter = userGrid[r][c];
                  const cellNum = puzzle.cellNumbers[r][c];

                  return (
                    <button
                      key={`cell-${r}-${c}`}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      className={`relative ${cellSizeClass} rounded-lg flex items-center justify-center font-black select-none cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#ffc800] text-slate-950 border-[#e5a500] ring-2 ring-amber-500 scale-105 z-20 shadow-md'
                          : inActiveWord
                          ? 'bg-amber-100/90 text-slate-900 border-amber-300'
                          : 'bg-white text-slate-900 hover:bg-slate-50 border-slate-300'
                      } ${isWrong ? 'ring-2 ring-rose-500 bg-rose-100 text-rose-700' : ''}`}
                    >
                      {cellNum && (
                        <span className="absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-bold text-slate-500 leading-none pointer-events-none">
                          {cellNum}
                        </span>
                      )}
                      <span className="leading-none">{letter}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium text-center mt-1">
            Type on keyboard or click cells • Spacebar to switch Across/Down • Tab for next clue
          </p>
        </div>

        {/* Clues List (Across & Down) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Across Clues */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-slate-100">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                Across
              </h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {puzzle.clues.filter(c => c.direction === 'across').length} clues
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {puzzle.clues
                .filter(c => c.direction === 'across')
                .map(c => {
                  const isCurrent = activeClue?.id === c.id;
                  const isDone = isClueSolved(c);

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectClue(c)}
                      className={`p-2.5 rounded-2xl text-xs cursor-pointer transition border ${
                        isCurrent
                          ? 'bg-[#58cc02] border-[#46a302] text-white font-bold shadow-xs'
                          : isDone
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className={`font-black mr-1.5 ${isCurrent ? 'text-white' : 'text-purple-700'}`}>
                            {c.num}.
                          </span>
                          <span>{c.clue}</span>
                          <span className={`ml-1 text-[10px] ${isCurrent ? 'text-emerald-100' : 'text-slate-400'}`}>
                            ({c.length})
                          </span>
                        </div>
                        {isDone && (
                          <span className={`text-[10px] font-black shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-600'}`}>
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Down Clues */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-slate-100">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
                Down
              </h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {puzzle.clues.filter(c => c.direction === 'down').length} clues
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {puzzle.clues
                .filter(c => c.direction === 'down')
                .map(c => {
                  const isCurrent = activeClue?.id === c.id;
                  const isDone = isClueSolved(c);

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectClue(c)}
                      className={`p-2.5 rounded-2xl text-xs cursor-pointer transition border ${
                        isCurrent
                          ? 'bg-[#58cc02] border-[#46a302] text-white font-bold shadow-xs'
                          : isDone
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className={`font-black mr-1.5 ${isCurrent ? 'text-white' : 'text-purple-700'}`}>
                            {c.num}.
                          </span>
                          <span>{c.clue}</span>
                          <span className={`ml-1 text-[10px] ${isCurrent ? 'text-emerald-100' : 'text-slate-400'}`}>
                            ({c.length})
                          </span>
                        </div>
                        {isDone && (
                          <span className={`text-[10px] font-black shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-600'}`}>
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons & Cheats */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
        <button
          onClick={handleCheckPuzzle}
          className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:border-b-2 active:translate-y-0.5 transition flex items-center gap-1.5"
        >
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Check Answers</span>
        </button>

        <button
          onClick={handleRevealLetter}
          className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:border-b-2 active:translate-y-0.5 transition flex items-center gap-1.5"
        >
          <Eye className="w-4 h-4 text-purple-600" />
          <span>Reveal Letter</span>
        </button>

        <button
          onClick={handleRevealWord}
          className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:border-b-2 active:translate-y-0.5 transition flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Reveal Word</span>
        </button>

        <button
          onClick={handleRevealGrid}
          className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:border-b-2 active:translate-y-0.5 transition"
        >
          Reveal Grid
        </button>

        <button
          onClick={handleClearGrid}
          className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 font-black text-xs hover:bg-rose-50 hover:text-rose-700 active:border-b-2 active:translate-y-0.5 transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Victory Banner */}
      {isCompleted && (
        <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] text-center text-emerald-950 animate-fadeIn mb-6">
          <Award className="w-12 h-12 text-[#58cc02] mx-auto mb-2" />
          <h3 className="text-lg font-black mb-1">Crossword Mastered!</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-4 max-w-md mx-auto">
            You completed the full {puzzle.numCols}×{puzzle.numRows} vocabulary crossword in{' '}
            <strong className="text-slate-900 font-bold">{formatTime(seconds)}</strong>! All {puzzle.wordsPlacedCount} words identified correctly.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSeed(s => s + 1)}
              className="px-5 py-2.5 rounded-2xl bg-[#58cc02] hover:bg-[#61e002] border-b-4 border-[#46a302] text-white font-black text-xs shadow-sm transition active:border-b-0 active:translate-y-1 flex items-center gap-1.5"
            >
              <Shuffle className="w-4 h-4" />
              <span>Play New Crossword</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
