import React, { useState, useEffect, useCallback } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { recordActivityCompletion } from '../../utils/gamification';
import confetti from 'canvas-confetti';
import { Volume2, HelpCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Lightbulb, Trophy } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export const WordleMode: React.FC<Props> = ({ words, accent }) => {
  // Filter eligible words (letters only, length 4 to 7)
  const eligibleWords = words.filter(
    w => /^[a-zA-Z]+$/.test(w.term) && w.term.length >= 4 && w.term.length <= 7
  );
  const activePool = eligibleWords.length > 0 ? eligibleWords : words;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [revealedHint, setRevealedHint] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [stats, setStats] = useState({ played: 0, won: 0, streak: 0 });

  const currentWord = activePool[currentIndex % activePool.length];
  const targetTerm = (currentWord?.term || 'words').toUpperCase();
  const wordLength = targetTerm.length;
  const maxGuesses = 6;

  // Reset when word index changes
  useEffect(() => {
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setRevealedHint(false);
  }, [currentIndex, targetTerm]);

  // Evaluate a submitted guess
  const evaluateGuess = (guess: string) => {
    const result: LetterStatus[] = Array(wordLength).fill('absent');
    const targetArr = targetTerm.split('');
    const guessArr = guess.split('');
    const targetCounts: { [char: string]: number } = {};

    targetArr.forEach(char => {
      targetCounts[char] = (targetCounts[char] || 0) + 1;
    });

    // First pass: Correct positions (Green)
    guessArr.forEach((char, idx) => {
      if (char === targetArr[idx]) {
        result[idx] = 'correct';
        targetCounts[char]--;
      }
    });

    // Second pass: Present in word (Yellow)
    guessArr.forEach((char, idx) => {
      if (result[idx] !== 'correct' && targetCounts[char] && targetCounts[char] > 0) {
        result[idx] = 'present';
        targetCounts[char]--;
      }
    });

    return result;
  };

  // Keyboard letter color mapping
  const keyboardStatuses: { [char: string]: LetterStatus } = {};
  guesses.forEach(guess => {
    const evals = evaluateGuess(guess);
    guess.split('').forEach((char, i) => {
      const current = keyboardStatuses[char];
      const status = evals[i];
      if (status === 'correct') {
        keyboardStatuses[char] = 'correct';
      } else if (status === 'present' && current !== 'correct') {
        keyboardStatuses[char] = 'present';
      } else if (status === 'absent' && !current) {
        keyboardStatuses[char] = 'absent';
      }
    });
  });

  const handleInputLetter = useCallback(
    (char: string) => {
      if (gameStatus !== 'playing') return;
      if (currentGuess.length < wordLength) {
        playSound('click');
        setCurrentGuess(prev => prev + char.toUpperCase());
      }
    },
    [gameStatus, currentGuess, wordLength]
  );

  const handleDelete = useCallback(() => {
    if (gameStatus !== 'playing') return;
    playSound('click');
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameStatus]);

  const handleNextWord = useCallback(() => {
    playSound('click');
    setCurrentIndex(i => (i + 1) % activePool.length);
  }, [activePool.length]);

  const handleSubmit = useCallback(() => {
    if (gameStatus !== 'playing') {
      handleNextWord();
      return;
    }

    if (currentGuess.length !== wordLength) {
      playSound('wrong');
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess === targetTerm) {
      playSound('correct');
      setGameStatus('won');
      setStats(prev => ({
        played: prev.played + 1,
        won: prev.won + 1,
        streak: prev.streak + 1,
      }));
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      recordActivityCompletion('wordle', 35);
      setTimeout(() => speakWord(currentWord.term, accent), 400);
    } else if (newGuesses.length >= maxGuesses) {
      playSound('wrong');
      setGameStatus('lost');
      setStats(prev => ({
        played: prev.played + 1,
        won: prev.won,
        streak: 0,
      }));
      setTimeout(() => speakWord(currentWord.term, accent), 400);
    } else {
      playSound('click');
    }
  }, [gameStatus, currentGuess, wordLength, guesses, targetTerm, currentWord, accent, handleNextWord]);

  // Physical keyboard listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleInputLetter(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSubmit, handleDelete, handleInputLetter]);

  const QWERTY_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ];

  return (
    <div className="max-w-md mx-auto px-2">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#58cc02] border-b-4 border-[#46a302] text-white flex items-center justify-center font-black text-lg">
            W
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              NYT Wordle <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">ESL Edition</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Guess the {wordLength}-letter vocabulary word in {maxGuesses} tries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Streak</span>
            <span className="text-amber-500 font-black text-base">🔥 {stats.streak}</span>
          </div>
        </div>
      </div>

      {/* ESL Clue / Hint Button */}
      <div className="mb-4">
        {revealedHint ? (
          <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-200 text-xs text-amber-900 animate-fadeIn">
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-amber-800 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                Definition Clue:
              </span>
              {currentWord.partOfSpeech && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                  {currentWord.partOfSpeech}
                </span>
              )}
            </div>
            <p className="font-medium text-slate-700">{currentWord.definition}</p>
          </div>
        ) : (
          <button
            onClick={() => setRevealedHint(true)}
            className="w-full py-2 px-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-amber-800 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>Need an ESL Hint? Reveal Definition</span>
          </button>
        )}
      </div>

      {/* Wordle Grid */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {Array.from({ length: maxGuesses }).map((_, rowIdx) => {
          const guess = guesses[rowIdx];
          const isCurrentRow = rowIdx === guesses.length;
          const evals = guess ? evaluateGuess(guess) : null;

          return (
            <div
              key={rowIdx}
              className={`flex gap-1.5 ${isCurrentRow && shakeRow ? 'animate-bounce' : ''}`}
            >
              {Array.from({ length: wordLength }).map((_, colIdx) => {
                let letter = '';
                let status: LetterStatus = 'empty';

                if (guess) {
                  letter = guess[colIdx] || '';
                  status = evals ? evals[colIdx] : 'empty';
                } else if (isCurrentRow) {
                  letter = currentGuess[colIdx] || '';
                }

                let colorClasses =
                  'bg-white border-2 border-slate-300 text-slate-800 shadow-xs';
                if (status === 'correct') {
                  colorClasses = 'bg-[#58cc02] border-2 border-[#46a302] text-white shadow-sm';
                } else if (status === 'present') {
                  colorClasses = 'bg-[#ffc800] border-2 border-[#e5a500] text-white shadow-sm';
                } else if (status === 'absent') {
                  colorClasses = 'bg-slate-400 border-2 border-slate-500 text-white shadow-xs';
                } else if (letter && isCurrentRow) {
                  colorClasses = 'bg-white border-2 border-slate-700 text-slate-900 scale-105 transition-transform';
                }

                return (
                  <div
                    key={colIdx}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl transition-all duration-300 ${colorClasses}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Game Outcome Status Banner */}
      {gameStatus === 'won' && (
        <div className="mb-4 p-4 bg-emerald-50 rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-[#58cc02] shrink-0" />
            <div>
              <p className="font-black text-sm">Magnificent! You solved it!</p>
              <p className="text-xs text-slate-600">
                Word: <strong className="font-bold text-slate-900">{currentWord.term}</strong> {currentWord.phonetic && `(${currentWord.phonetic})`}
              </p>
            </div>
          </div>
          <button
            onClick={handleNextWord}
            className="px-4 py-2 bg-[#58cc02] hover:bg-[#61e002] text-white font-black text-xs rounded-xl border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition flex items-center gap-1 shadow-sm"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className="mb-4 p-4 bg-rose-50 rounded-2xl border-2 border-rose-300 border-b-4 border-b-rose-400 text-rose-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <p className="font-black text-sm">Nice try! The word was:</p>
              <p className="text-base font-black text-rose-700">{currentWord.term}</p>
            </div>
          </div>
          <button
            onClick={handleNextWord}
            className="px-4 py-2 bg-[#1cb0f6] hover:bg-[#24bcff] text-white font-black text-xs rounded-xl border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition flex items-center gap-1 shadow-sm"
          >
            Play Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Onscreen Virtual Keyboard */}
      <div className="bg-slate-100 p-2.5 rounded-3xl border-2 border-slate-200 mb-6">
        {QWERTY_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5 mb-1.5">
            {row.map(char => {
              const isSpecial = char === 'ENTER' || char === '⌫';
              const status = keyboardStatuses[char];

              let keyStyle = 'bg-white text-slate-800 border-b-4 border-slate-300';
              if (status === 'correct') {
                keyStyle = 'bg-[#58cc02] text-white border-b-4 border-[#46a302]';
              } else if (status === 'present') {
                keyStyle = 'bg-[#ffc800] text-white border-b-4 border-[#e5a500]';
              } else if (status === 'absent') {
                keyStyle = 'bg-slate-400 text-slate-100 border-b-4 border-slate-500 opacity-80';
              }

              return (
                <button
                  key={char}
                  onClick={() => {
                    if (char === 'ENTER') handleSubmit();
                    else if (char === '⌫') handleDelete();
                    else handleInputLetter(char);
                  }}
                  className={`${
                    isSpecial ? 'px-3 sm:px-4 text-xs font-black' : 'w-8 sm:w-10 font-bold text-sm sm:text-base'
                  } h-11 sm:h-12 rounded-xl active:border-b-0 active:translate-y-1 transition flex items-center justify-center select-none ${keyStyle}`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
