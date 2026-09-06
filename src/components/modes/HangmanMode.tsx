import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Volume2, RotateCcw, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

const MAX_LIVES = 6;

export const HangmanMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);

  const currentWord = words[index];
  const targetWordUpper = (currentWord?.term || '').toUpperCase();

  // Reset per word
  useEffect(() => {
    setGuessedLetters([]);
    setIsWon(false);
    setIsLost(false);
  }, [index, currentWord]);

  if (!currentWord) {
    return <div className="p-8 text-center text-slate-500">No words available.</div>;
  }

  // Count wrong guesses
  const wrongGuesses = guessedLetters.filter(l => !targetWordUpper.includes(l));
  const livesLeft = MAX_LIVES - wrongGuesses.length;

  const handleGuessLetter = (letter: string) => {
    if (guessedLetters.includes(letter) || isWon || isLost) return;

    playSound('click');
    const updated = [...guessedLetters, letter];
    setGuessedLetters(updated);

    if (targetWordUpper.includes(letter)) {
      playSound('correct');
      // Check if all letters guessed
      const lettersInWord = targetWordUpper.split('').filter(char => /[A-Z]/.test(char));
      const allFound = lettersInWord.every(char => updated.includes(char));

      if (allFound) {
        setIsWon(true);
        playSound('win');
        confetti({ particleCount: 50, spread: 60 });
        speakWord(currentWord.term, accent);
      }
    } else {
      playSound('wrong');
      if (wrongGuesses.length + 1 >= MAX_LIVES) {
        setIsLost(true);
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
          <span className="text-xs font-semibold uppercase text-slate-400">Classic Hangman</span>
          <p className="text-base font-bold text-slate-800">Word {index + 1} of {words.length}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Remaining Lives</span>
          <span className={`text-base font-black ${livesLeft <= 2 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
            {'❤️'.repeat(Math.max(0, livesLeft))}
          </span>
        </div>
      </div>

      {/* Hangman Gallows Graphic */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex flex-col items-center">
        <svg viewBox="0 0 160 160" className="w-36 h-36 stroke-slate-800 stroke-2 fill-none mb-4">
          {/* Gallows base */}
          <line x1="20" y1="150" x2="140" y2="150" />
          <line x1="40" y1="150" x2="40" y2="20" />
          <line x1="40" y1="20" x2="100" y2="20" />
          <line x1="100" y1="20" x2="100" y2="40" />

          {/* Stick Figure according to wrong guesses */}
          {wrongGuesses.length >= 1 && <circle cx="100" cy="52" r="12" />} {/* Head */}
          {wrongGuesses.length >= 2 && <line x1="100" y1="64" x2="100" y2="105" />} {/* Body */}
          {wrongGuesses.length >= 3 && <line x1="100" y1="75" x2="80" y2="92" />} {/* Left arm */}
          {wrongGuesses.length >= 4 && <line x1="100" y1="75" x2="120" y2="92" />} {/* Right arm */}
          {wrongGuesses.length >= 5 && <line x1="100" y1="105" x2="82" y2="135" />} {/* Left leg */}
          {wrongGuesses.length >= 6 && <line x1="100" y1="105" x2="118" y2="135" />} {/* Right leg */}
        </svg>

        {/* Clue Info */}
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Clue</p>
          <p className="text-sm font-medium text-slate-700 max-w-md">{currentWord.definition}</p>
        </div>

        {/* Target word letter blanks */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
          {targetWordUpper.split('').map((char, i) => {
            if (char === ' ') {
              return <div key={i} className="w-4" />;
            }
            const isRevealed = guessedLetters.includes(char) || isLost;
            return (
              <span
                key={i}
                className={`w-9 h-11 border-b-4 flex items-center justify-center font-black text-xl ${
                  isRevealed ? 'text-slate-900 border-slate-800' : 'border-slate-300 text-transparent'
                } ${isLost && !guessedLetters.includes(char) ? 'text-rose-600' : ''}`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Alphabet keyboard */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
        {alphabet.map(letter => {
          const isGuessed = guessedLetters.includes(letter);
          const isCorrect = isGuessed && targetWordUpper.includes(letter);
          const isWrong = isGuessed && !targetWordUpper.includes(letter);

          let style = 'bg-white border-slate-300 hover:border-indigo-400 text-slate-800';
          if (isCorrect) {
            style = 'bg-emerald-500 border-emerald-600 text-white font-bold opacity-60';
          } else if (isWrong) {
            style = 'bg-slate-200 border-slate-300 text-slate-400 opacity-40';
          }

          return (
            <button
              key={letter}
              onClick={() => handleGuessLetter(letter)}
              disabled={isGuessed || isWon || isLost}
              className={`w-9 h-10 rounded-lg border font-bold text-sm shadow-xs transition ${style}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Outcome Notifications */}
      {isWon && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">You saved the prisoner! Word: {currentWord.term}</span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1"
          >
            Next Word <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLost && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-rose-950">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>Word was: <strong className="font-bold">{currentWord.term}</strong></span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
          >
            Next Word
          </button>
        </div>
      )}
    </div>
  );
};
