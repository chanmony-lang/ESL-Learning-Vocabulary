import React, { useState, useEffect, useRef } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Volume2, Sparkles } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

interface SushiPlate {
  id: string;
  letter: string;
  position: number; // 0 to 100%
  color: string;
}

const PLATE_COLORS = ['#f43f5e', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];

export const SushiSpellMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [spelledLetters, setSpelledLetters] = useState<string[]>([]);
  const [plates, setPlates] = useState<SushiPlate[]>([]);
  const [score, setScore] = useState(0);
  const [platesServed, setPlatesServed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Single word terms only for spelling arcade
  const validWords = words.filter(w => /^[a-zA-Z]{3,10}$/.test(w.term.trim()));
  const currentWord = validWords[index] || words[0];
  const targetLetters = (currentWord?.term.toUpperCase() || '').split('');

  // Spawn and move sushi plates
  useEffect(() => {
    if (!currentWord || isCompleted) return;

    // Initial pool of plates: includes all required target letters + some distractors
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const initialPlates: SushiPlate[] = [];
    const pool = [...targetLetters];
    // Add 4 distractors
    for (let i = 0; i < 4; i++) {
      pool.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }
    pool.sort(() => Math.random() - 0.5);

    pool.forEach((letter, i) => {
      initialPlates.push({
        id: `plate_${i}_${Date.now()}`,
        letter,
        position: (i * 12) % 90,
        color: PLATE_COLORS[i % PLATE_COLORS.length],
      });
    });

    setPlates(initialPlates);
    setSpelledLetters([]);
  }, [index, currentWord, isCompleted]);

  // Conveyor belt ticker animation
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setPlates(prevPlates =>
        prevPlates.map(plate => {
          let nextPos = plate.position + 1.2;
          if (nextPos > 100) {
            // Loop back to left side with a random needed letter or distractor
            nextPos = 0;
          }
          return { ...plate, position: nextPos };
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isCompleted]);

  const handlePickPlate = (plate: SushiPlate) => {
    const nextExpectedIndex = spelledLetters.length;
    const expectedLetter = targetLetters[nextExpectedIndex];

    if (plate.letter === expectedLetter) {
      playSound('catch');
      const newSpelled = [...spelledLetters, plate.letter];
      setSpelledLetters(newSpelled);
      setScore(s => s + 15);

      // Remove the consumed plate and spawn new one
      setPlates(prev => prev.filter(p => p.id !== plate.id));

      if (newSpelled.length === targetLetters.length) {
        // Complete word!
        playSound('correct');
        confetti({ particleCount: 40, spread: 60 });
        setPlatesServed(p => p + 1);
        speakWord(currentWord.term, accent);

        setTimeout(() => {
          if (index + 1 < validWords.length) {
            setIndex(i => i + 1);
          } else {
            setIsCompleted(true);
            playSound('win');
            confetti({ particleCount: 100, spread: 80 });
          }
        }, 1200);
      }
    } else {
      playSound('wrong');
    }
  };

  if (!currentWord || isCompleted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🍣
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Sushi Bar Master!</h2>
        <p className="text-slate-500 mb-6">
          You served {platesServed} vocabulary sushi platters with {score} points!
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setScore(0);
            setPlatesServed(0);
            setIsCompleted(false);
          }}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Play Sushi Spell Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto select-none">
      {/* HUD Header */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-6 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍣</span>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Sushi Spell Bar</h2>
            <p className="text-[11px] text-slate-400">Order {index + 1} of {validWords.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">SCORE</span>
            <span className="text-lg font-black text-amber-400">{score} pts</span>
          </div>
        </div>
      </div>

      {/* Customer Order / Word Clue Board */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 mb-6 text-center">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
          <span>Customer Order:</span>
          <button
            onClick={() => speakWord(currentWord.term, accent)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 transition flex items-center gap-1 font-semibold"
          >
            <Volume2 className="w-4 h-4" /> Pronounce
          </button>
        </div>
        <p className="text-lg font-semibold text-slate-800 mb-4">{currentWord.definition}</p>

        {/* Letter Slots to fill */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {targetLetters.map((letter, i) => {
            const isFilled = i < spelledLetters.length;
            return (
              <div
                key={i}
                className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm transition-all ${
                  isFilled
                    ? 'bg-emerald-500 border-emerald-600 text-white scale-105'
                    : 'bg-slate-50 border-dashed border-slate-300 text-slate-300'
                }`}
              >
                {isFilled ? spelledLetters[i] : '?'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conveyor Belt Arcade Canvas */}
      <div className="relative bg-slate-800 rounded-3xl p-6 border-4 border-amber-800/40 shadow-xl overflow-hidden min-h-[190px]">
        {/* Belt Track Texture */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-slate-950 border-y-4 border-slate-700/80 flex items-center overflow-hidden">
          <div className="w-full h-2 bg-amber-500/20" />
        </div>

        {/* Sushi Plates moving along the track */}
        <div className="relative h-28 w-full">
          {plates.map(plate => (
            <button
              key={plate.id}
              onClick={() => handlePickPlate(plate)}
              style={{
                left: `${plate.position}%`,
                transform: 'translateX(-50%)',
              }}
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 active:scale-95"
            >
              {/* Wooden / Porcelain Plate */}
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg border-2 border-white/80 flex items-center justify-center font-black text-2xl text-white select-none transition group-hover:ring-4 ring-amber-400"
                style={{ backgroundColor: plate.color }}
              >
                {plate.letter}
              </div>
              <div className="w-10 h-2 bg-black/40 rounded-full mt-1 blur-xs" />
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Tap the sushi letter plates in the correct sequence to complete the order!
      </p>
    </div>
  );
};
