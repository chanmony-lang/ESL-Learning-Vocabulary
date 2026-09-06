import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkle, RotateCcw, Volume2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

const MAX_GUESSES = 6;

export const MysteryMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);

  // Clean words that are 4-7 letters long for optimal mystery wordle
  const validWords = words.filter(w => /^[a-zA-Z]{4,8}$/.test(w.term.trim()));
  const targetWord = validWords[index] || words[0];
  const targetTermUpper = (targetWord?.term || '').toUpperCase();
  const wordLength = targetTermUpper.length;

  useEffect(() => {
    setGuesses([]);
    setCurrentGuess('');
    setIsWon(false);
    setIsLost(false);
  }, [index, targetWord]);

  if (!targetWord) {
    return <div className="p-8 text-center text-slate-500">No words available.</div>;
  }

  const handleKeyPress = (char: string) => {
    if (isWon || isLost) return;
    if (currentGuess.length < wordLength) {
      playSound('click');
      setCurrentGuess(prev => prev + char);
    }
  };

  const handleBackspace = () => {
    playSound('click');
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const handleSubmitGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentGuess.length !== wordLength || isWon || isLost) return;

    const guessUpper = currentGuess.toUpperCase();
    const nextGuesses = [...guesses, guessUpper];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (guessUpper === targetTermUpper) {
      playSound('correct');
      playSound('win');
      setIsWon(true);
      confetti({ particleCount: 70, spread: 70 });
      speakWord(targetWord.term, accent);
    } else {
      playSound('wrong');
      if (nextGuesses.length >= MAX_GUESSES) {
        setIsLost(true);
      }
    }
  };

  const handleNext = () => {
    if (index + 1 < validWords.length) {
      setIndex(i => i + 1);
    } else {
      setIndex(0);
    }
  };

  const getLetterFeedback = (guess: string, charIndex: number) => {
    const char = guess[charIndex];
    if (char === targetTermUpper[charIndex]) {
      return 'bg-emerald-500 text-white border-emerald-600'; // Correct position
    }
    if (targetTermUpper.includes(char)) {
      return 'bg-amber-500 text-white border-amber-600'; // In word, wrong position
    }
    return 'bg-slate-500 text-white border-slate-600'; // Not in word
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">Mystery Wordle</span>
          <p className="text-base font-bold text-slate-800">Word {index + 1} of {validWords.length}</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Guesses: {guesses.length} / {MAX_GUESSES}
        </div>
      </div>

      {/* Definition Clue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Mystery Clue</p>
        <p className="text-sm font-medium text-slate-800">{targetWord.definition}</p>
      </div>

      {/* Wordle Grid */}
      <div className="space-y-2 mb-6 flex flex-col items-center">
        {Array(MAX_GUESSES).fill(null).map((_, rowIdx) => {
          const guess = guesses[rowIdx];
          const isCurrentRow = rowIdx === guesses.length;

          return (
            <div key={rowIdx} className="flex gap-1.5 sm:gap-2">
              {Array(wordLength).fill(null).map((__, colIdx) => {
                let letter = '';
                let cellClass = 'bg-white border-slate-300 text-slate-800';

                if (guess) {
                  letter = guess[colIdx] || '';
                  cellClass = getLetterFeedback(guess, colIdx);
                } else if (isCurrentRow) {
                  letter = currentGuess[colIdx] || '';
                  if (letter) cellClass = 'bg-slate-50 border-slate-700 text-slate-900 ring-1 ring-slate-400 font-bold';
                }

                return (
                  <div
                    key={colIdx}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 font-black text-lg sm:text-xl flex items-center justify-center shadow-xs transition-all ${cellClass}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Onscreen Keyboard */}
      <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200 mb-4 select-none">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5 mb-1.5">
            {row.map(char => (
              <button
                key={char}
                onClick={() => handleKeyPress(char)}
                className="w-7 h-9 sm:w-9 sm:h-11 bg-white rounded-lg shadow-xs border border-slate-300 font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 active:scale-95 transition"
              >
                {char}
              </button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={handleBackspace}
            className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold rounded-lg text-xs transition"
          >
            Backspace
          </button>
          <button
            onClick={() => handleSubmitGuess()}
            disabled={currentGuess.length !== wordLength}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow transition disabled:opacity-50"
          >
            Enter Guess
          </button>
        </div>
      </div>

      {/* Result feedback */}
      {isWon && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">Mystery Solved! Word was {targetWord.term}!</span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            Next Word
          </button>
        </div>
      )}

      {isLost && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-rose-950">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>Mystery word was: <strong className="font-bold">{targetWord.term}</strong></span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};
