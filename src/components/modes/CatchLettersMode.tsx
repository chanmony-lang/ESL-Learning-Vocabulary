import React, { useState, useEffect, useRef } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Volume2, Sparkles } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

interface LetterBubble {
  id: string;
  char: string;
  x: number; // 5 to 90%
  y: number; // 0 to 100%
  speed: number;
}

export const CatchLettersMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [spelled, setSpelled] = useState<string[]>([]);
  const [bubbles, setBubbles] = useState<LetterBubble[]>([]);
  const [score, setScore] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const validWords = words.filter(w => /^[a-zA-Z]{3,8}$/.test(w.term.trim()));
  const currentWord = validWords[index] || words[0];
  const targetChars = (currentWord?.term.toUpperCase() || '').split('');

  // Spawn bubbles
  useEffect(() => {
    if (!currentWord || isWon) return;

    setSpelled([]);
    const initial: LetterBubble[] = [];
    const pool = [...targetChars, 'E', 'A', 'S', 'T', 'O', 'N'];

    pool.forEach((char, i) => {
      initial.push({
        id: `b_${i}_${Date.now()}`,
        char,
        x: 10 + (i * 14) % 75,
        y: Math.random() * 40,
        speed: 0.8 + Math.random() * 0.8,
      });
    });

    setBubbles(initial);
  }, [index, currentWord, isWon]);

  // Falling animation ticker
  useEffect(() => {
    if (isWon) return;

    const interval = setInterval(() => {
      setBubbles(prev =>
        prev.map(b => {
          let nextY = b.y + b.speed;
          let nextX = b.x;
          if (nextY > 92) {
            nextY = 0;
            nextX = 10 + Math.random() * 75;
          }
          return { ...b, y: nextY, x: nextX };
        })
      );
    }, 60);

    return () => clearInterval(interval);
  }, [isWon]);

  const handleCatchBubble = (bubble: LetterBubble) => {
    const nextIdx = spelled.length;
    const expected = targetChars[nextIdx];

    if (bubble.char === expected) {
      playSound('catch');
      const nextSpelled = [...spelled, bubble.char];
      setSpelled(nextSpelled);
      setScore(s => s + 20);

      // Pop and remove bubble
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));

      if (nextSpelled.length === targetChars.length) {
        playSound('correct');
        confetti({ particleCount: 40, spread: 60 });
        speakWord(currentWord.term, accent);

        setTimeout(() => {
          if (index + 1 < validWords.length) {
            setIndex(i => i + 1);
          } else {
            setIsWon(true);
            playSound('win');
            confetti({ particleCount: 100, spread: 80 });
          }
        }, 1200);
      }
    } else {
      playSound('wrong');
    }
  };

  if (!currentWord || isWon) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Letters Caught!</h2>
        <p className="text-slate-500 mb-6">Final arcade score: <strong className="text-sky-600">{score} pts</strong></p>
        <button
          onClick={() => {
            setIndex(0);
            setScore(0);
            setIsWon(false);
          }}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Catch Letters Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto select-none">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-sky-950 text-white px-5 py-3 rounded-2xl mb-4 shadow">
        <div>
          <span className="text-xs text-sky-300 font-bold block uppercase tracking-wider">Catch Letters Arcade</span>
          <span className="text-sm font-semibold">{currentWord.definition}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-sky-300 block">SCORE</span>
          <span className="text-lg font-black text-amber-400">{score} pts</span>
        </div>
      </div>

      {/* Sky Canvas where letter bubbles drop */}
      <div className="relative bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 rounded-3xl border-4 border-sky-600/50 shadow-xl overflow-hidden h-96">
        {/* Falling Letter Bubbles */}
        {bubbles.map(bubble => (
          <button
            key={bubble.id}
            onClick={() => handleCatchBubble(bubble)}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 border-2 border-white shadow-lg backdrop-blur-xs flex items-center justify-center font-black text-xl text-sky-900 cursor-pointer hover:scale-125 active:scale-95 transition-transform"
          >
            {bubble.char}
          </button>
        ))}

        {/* Target word slots on the ground */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 px-4">
          <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-lg flex items-center gap-2">
            {targetChars.map((char, i) => {
              const filled = i < spelled.length;
              return (
                <div
                  key={i}
                  className={`w-9 h-11 sm:w-11 sm:h-12 rounded-xl border-2 flex items-center justify-center font-black text-lg sm:text-xl shadow-xs ${
                    filled
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'bg-white/90 border-dashed border-sky-400 text-slate-300'
                  }`}
                >
                  {filled ? spelled[i] : '?'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-3">
        Tap the falling bubbles to catch the letters in the correct spelling order!
      </p>
    </div>
  );
};
