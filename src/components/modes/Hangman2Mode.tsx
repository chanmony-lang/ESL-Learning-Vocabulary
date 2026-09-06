import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Rocket, RotateCcw, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

const MAX_FUEL_LEAKS = 6;

export const Hangman2Mode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [isLaunched, setIsLaunched] = useState(false);
  const [isAborted, setIsAborted] = useState(false);

  const currentWord = words[index];
  const targetUpper = (currentWord?.term || '').toUpperCase();

  useEffect(() => {
    setGuessed([]);
    setIsLaunched(false);
    setIsAborted(false);
  }, [index, currentWord]);

  if (!currentWord) {
    return <div className="p-8 text-center text-slate-500">No words available.</div>;
  }

  const wrongGuesses = guessed.filter(l => !targetUpper.includes(l));
  const fuelPercent = Math.max(0, Math.round(((MAX_FUEL_LEAKS - wrongGuesses.length) / MAX_FUEL_LEAKS) * 100));

  const handleLetterClick = (letter: string) => {
    if (guessed.includes(letter) || isLaunched || isAborted) return;
    playSound('click');

    const updated = [...guessed, letter];
    setGuessed(updated);

    if (targetUpper.includes(letter)) {
      playSound('correct');
      const targetLettersOnly = targetUpper.split('').filter(c => /[A-Z]/.test(c));
      const allFound = targetLettersOnly.every(c => updated.includes(c));

      if (allFound) {
        setIsLaunched(true);
        playSound('win');
        confetti({ particleCount: 70, spread: 70 });
        speakWord(currentWord.term, accent);
      }
    } else {
      playSound('wrong');
      if (wrongGuesses.length + 1 >= MAX_FUEL_LEAKS) {
        setIsAborted(true);
      }
    }
  };

  const handleNext = () => {
    if (index + 1 < words.length) {
      setIndex(i => i + 1);
    } else {
      setIndex(0);
    }
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">Hangman 2</span>
          <p className="text-base font-bold text-slate-800">Rocket Launch Mission</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Booster Fuel</span>
          <span className={`text-base font-black ${fuelPercent <= 33 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {fuelPercent}%
          </span>
        </div>
      </div>

      {/* Launchpad Arena */}
      <div className="relative bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl mb-6 overflow-hidden flex flex-col items-center">
        {/* Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

        {/* Rocket Icon */}
        <div
          className={`relative z-10 w-24 h-24 mb-4 transition-all duration-1000 ${
            isLaunched ? '-translate-y-40 scale-75 opacity-0' : 'translate-y-0'
          }`}
        >
          <Rocket className="w-24 h-24 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
          {/* Thruster flame */}
          <div className="w-6 h-8 bg-gradient-to-b from-amber-400 to-rose-500 rounded-full mx-auto blur-xs animate-pulse" />
        </div>

        {/* Clue */}
        <div className="relative z-10 text-center max-w-md mb-6">
          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Launch Code Clue</p>
          <p className="text-sm font-medium text-slate-200">{currentWord.definition}</p>
        </div>

        {/* Word Blanks */}
        <div className="relative z-10 flex items-center justify-center gap-2 flex-wrap">
          {targetUpper.split('').map((char, i) => {
            if (char === ' ') return <div key={i} className="w-3" />;
            const isDiscovered = guessed.includes(char) || isAborted;
            return (
              <span
                key={i}
                className={`w-9 h-11 border-b-4 flex items-center justify-center font-black text-xl ${
                  isDiscovered ? 'text-white border-amber-400' : 'border-slate-600 text-transparent'
                } ${isAborted && !guessed.includes(char) ? 'text-rose-400' : ''}`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Keyboard */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
        {alphabet.map(letter => {
          const isGuessed = guessed.includes(letter);
          const isCorrect = isGuessed && targetUpper.includes(letter);
          const isWrong = isGuessed && !targetUpper.includes(letter);

          let style = 'bg-white border-slate-300 hover:border-indigo-400 text-slate-800';
          if (isCorrect) {
            style = 'bg-emerald-500 border-emerald-600 text-white font-bold opacity-60';
          } else if (isWrong) {
            style = 'bg-slate-200 border-slate-300 text-slate-400 opacity-40';
          }

          return (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              disabled={isGuessed || isLaunched || isAborted}
              className={`w-9 h-10 rounded-lg border font-bold text-sm shadow-xs transition ${style}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Outcome Notifications */}
      {isLaunched && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">Rocket Launched into Orbit! Word: {currentWord.term}</span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1"
          >
            Next Mission <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {isAborted && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-rose-950">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>Launch aborted! Word was: <strong className="font-bold">{currentWord.term}</strong></span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
          >
            Next Mission
          </button>
        </div>
      )}
    </div>
  );
};
