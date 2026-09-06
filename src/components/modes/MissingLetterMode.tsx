import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Volume2, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const MissingLetterMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [missingIndices, setMissingIndices] = useState<number[]>([]);
  const [filledLetters, setFilledLetters] = useState<{ [pos: number]: string }>({});
  const [isWon, setIsWon] = useState(false);

  const currentWord = words[index];

  useEffect(() => {
    if (!currentWord) return;
    const term = currentWord.term;
    // Pick 2-3 random positions to be missing (excluding spaces or hyphens)
    const validPositions: number[] = [];
    for (let i = 0; i < term.length; i++) {
      if (/[a-zA-Z]/.test(term[i])) {
        validPositions.push(i);
      }
    }

    const numMissing = Math.min(Math.max(2, Math.floor(term.length / 3)), 4);
    const chosen = validPositions.sort(() => Math.random() - 0.5).slice(0, numMissing).sort((a, b) => a - b);

    setMissingIndices(chosen);
    setFilledLetters({});
    setIsWon(false);
  }, [index, currentWord]);

  if (!currentWord) {
    return <div className="p-8 text-center text-slate-500">No words available.</div>;
  }

  // Next unfilled missing position
  const nextTargetPos = missingIndices.find(pos => !filledLetters[pos]);

  const handleKeyPress = (letter: string) => {
    if (isWon || nextTargetPos === undefined) return;

    const expected = currentWord.term[nextTargetPos].toLowerCase();
    if (letter.toLowerCase() === expected) {
      playSound('correct');
      const updated = { ...filledLetters, [nextTargetPos]: currentWord.term[nextTargetPos] };
      setFilledLetters(updated);

      // Check if all missing letters filled
      if (missingIndices.every(pos => updated[pos])) {
        setIsWon(true);
        confetti({ particleCount: 30, spread: 50 });
        speakWord(currentWord.term, accent);
      }
    } else {
      playSound('wrong');
    }
  };

  const handleNext = () => {
    if (index + 1 < words.length) {
      setIndex(i => i + 1);
    } else {
      setIndex(0);
    }
  };

  // Letter choices (including the required missing letters + a few random distractors)
  const candidateLetters = Array.from(
    new Set([
      ...missingIndices.map(pos => currentWord.term[pos].toUpperCase()),
      'A', 'E', 'I', 'O', 'U', 'S', 'T', 'R', 'N', 'L'
    ])
  ).sort();

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">Missing Letter</span>
          <p className="text-base font-bold text-slate-800">{index + 1} / {words.length}</p>
        </div>
        <button
          onClick={() => speakWord(currentWord.term, accent)}
          className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition flex items-center gap-1 text-xs font-semibold"
        >
          <Volume2 className="w-4 h-4" /> Listen
        </button>
      </div>

      {/* Clue Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Clue</p>
        <p className="text-base font-medium text-slate-800 mb-4">{currentWord.definition}</p>

        {/* Word Display with Missing Letter Boxes */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap my-4">
          {currentWord.term.split('').map((char, pos) => {
            if (char === ' ') {
              return <div key={pos} className="w-4" />;
            }

            const isMissing = missingIndices.includes(pos);
            const isFilled = isMissing && filledLetters[pos];
            const isNextTarget = pos === nextTargetPos;

            return (
              <div
                key={pos}
                className={`w-9 h-11 sm:w-11 sm:h-13 rounded-xl border-2 flex items-center justify-center font-black text-xl sm:text-2xl shadow-xs transition-all ${
                  isMissing
                    ? isFilled
                      ? 'bg-emerald-500 border-emerald-600 text-white animate-bounce-short'
                      : isNextTarget
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-300 animate-pulse'
                      : 'bg-slate-100 border-dashed border-slate-300 text-transparent'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {isMissing ? filledLetters[pos] || '_' : char}
              </div>
            );
          })}
        </div>
      </div>

      {/* Letter Keyboard Selection */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
        <p className="text-xs font-semibold text-slate-500 text-center mb-3">
          Select the missing letter:
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {candidateLetters.map(letter => (
            <button
              key={letter}
              onClick={() => handleKeyPress(letter)}
              className="w-10 h-11 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 font-bold text-lg text-slate-800 shadow-xs hover:scale-105 active:scale-95 transition"
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Won Notification */}
      {isWon && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">Word completed: {currentWord.term}!</span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1"
          >
            Next Word <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
