import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Volume2, Anchor } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

interface Fish {
  id: string;
  word: VocabWord;
  x: number; // 0 to 100%
  y: number; // depth
  speed: number;
  dir: 1 | -1;
  color: string;
}

const FISH_COLORS = ['#38bdf8', '#fb7185', '#34d399', '#fbbf24', '#a78bfa'];

export const WordFishMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [score, setScore] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const currentWord = words[index];

  // Spawn swimming fishes (target word + 3-4 distractors)
  useEffect(() => {
    if (!currentWord || isWon) return;

    const distractors = words
      .filter(w => w.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const pool = [currentWord, ...distractors].sort(() => Math.random() - 0.5);

    const spawned: Fish[] = pool.map((w, idx) => ({
      id: `fish_${w.id}_${Date.now()}`,
      word: w,
      x: (idx * 24) % 80,
      y: 18 + idx * 18,
      speed: 0.6 + Math.random() * 0.5,
      dir: Math.random() > 0.5 ? 1 : -1,
      color: FISH_COLORS[idx % FISH_COLORS.length],
    }));

    setFishes(spawned);
  }, [index, currentWord, isWon]);

  // Swim animation loop
  useEffect(() => {
    if (isWon) return;

    const interval = setInterval(() => {
      setFishes(prevFishes =>
        prevFishes.map(fish => {
          let nextX = fish.x + fish.speed * fish.dir;
          let nextDir = fish.dir;
          if (nextX > 90) {
            nextX = 90;
            nextDir = -1;
          } else if (nextX < 2) {
            nextX = 2;
            nextDir = 1;
          }
          return { ...fish, x: nextX, dir: nextDir };
        })
      );
    }, 80);

    return () => clearInterval(interval);
  }, [isWon]);

  const handleCatchFish = (fish: Fish) => {
    if (fish.word.id === currentWord.id) {
      playSound('catch');
      playSound('correct');
      confetti({ particleCount: 35, spread: 50 });
      setScore(s => s + 25);
      speakWord(currentWord.term, accent);

      setTimeout(() => {
        if (index + 1 < words.length) {
          setIndex(i => i + 1);
        } else {
          setIsWon(true);
          playSound('win');
          confetti({ particleCount: 80, spread: 70 });
        }
      }, 1000);
    } else {
      playSound('wrong');
    }
  };

  if (!currentWord || isWon) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🐟
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Great Catch!</h2>
        <p className="text-slate-500 mb-6">You reeled in all vocabulary fish! Final score: <strong className="text-cyan-600">{score} pts</strong></p>
        <button
          onClick={() => {
            setIndex(0);
            setScore(0);
            setIsWon(false);
          }}
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Go Fishing Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto select-none">
      {/* HUD Header */}
      <div className="flex items-center justify-between bg-sky-950 text-white p-4 rounded-2xl mb-4 shadow">
        <div className="flex items-center gap-2.5">
          <Anchor className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-xs text-cyan-300 font-bold block">WORD FISH AQUARIUM</span>
            <span className="text-xs text-slate-400">Target {index + 1} of {words.length}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-cyan-300 block">SCORE</span>
          <span className="text-lg font-black text-cyan-400">{score} pts</span>
        </div>
      </div>

      {/* Target prompt */}
      <div className="bg-white rounded-2xl border-2 border-cyan-200 p-5 mb-4 text-center shadow-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 mb-1">
          Hook the fish that matches this definition:
        </p>
        <p className="text-lg font-semibold text-slate-800">&ldquo;{currentWord.definition}&rdquo;</p>
      </div>

      {/* Aquarium Lake Canvas */}
      <div className="relative bg-gradient-to-b from-sky-400 via-cyan-500 to-blue-800 rounded-3xl border-4 border-cyan-600 shadow-xl overflow-hidden h-96">
        {/* Water surface glint */}
        <div className="absolute top-0 inset-x-0 h-4 bg-white/20 backdrop-blur-xs" />

        {/* Swimming Fishes */}
        {fishes.map(fish => (
          <button
            key={fish.id}
            onClick={() => handleCatchFish(fish)}
            style={{
              left: `${fish.x}%`,
              top: `${fish.y}%`,
              transform: `scaleX(${fish.dir})`,
            }}
            className="absolute transition-all duration-75 cursor-pointer group hover:scale-110 active:scale-95"
          >
            {/* Fish Graphic & Label */}
            <div
              className="px-3.5 py-1.5 rounded-full shadow-lg border-2 border-white text-white font-black text-xs sm:text-sm flex items-center gap-1.5"
              style={{
                backgroundColor: fish.color,
              }}
            >
              {/* Fish icon flips with direction */}
              <span className="text-base select-none">🐟</span>
              <span
                style={{
                  transform: `scaleX(${fish.dir})`, // keep text un-reversed
                }}
              >
                {fish.word.term}
              </span>
            </div>
          </button>
        ))}

        {/* Aquarium sand floor */}
        <div className="absolute inset-x-0 bottom-0 h-6 bg-amber-200/40 border-t border-amber-300/50" />
      </div>

      <p className="text-center text-xs text-slate-400 mt-3">
        Click or tap the swimming fish that matches the definition prompt!
      </p>
    </div>
  );
};
