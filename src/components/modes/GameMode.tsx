import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { getWordImageUrl } from '../../utils/wordVisuals';
import confetti from 'canvas-confetti';
import { Flame, Clock, Trophy, RotateCcw, Check, X, Image as ImageIcon, BookOpen } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
  showPictures?: boolean;
  onTogglePictures?: () => void;
}

export const GameMode: React.FC<Props> = ({ words, accent, showPictures: initialPictures = false, onTogglePictures }) => {
  const [internalPictures, setInternalPictures] = useState<boolean>(() => {
    return localStorage.getItem('lexiquest_pictures_in_games') === 'true';
  });

  const isPicturesMode = onTogglePictures !== undefined ? initialPictures : internalPictures;

  const togglePicturesMode = (val: boolean) => {
    if (onTogglePictures) {
      if (initialPictures !== val) onTogglePictures();
    } else {
      setInternalPictures(val);
      localStorage.setItem('lexiquest_pictures_in_games', String(val));
    }
  };

  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Current challenge: Term displayed with either its real definition/picture or another word's
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [displayedDef, setDisplayedDef] = useState<string>('');
  const [displayedImage, setDisplayedImage] = useState<string>('');
  const [isMatch, setIsMatch] = useState<boolean>(true);

  const nextChallenge = () => {
    if (words.length === 0) return;
    const target = words[Math.floor(Math.random() * words.length)];
    const shouldMatch = Math.random() > 0.5;

    let def = target.definition;
    let img = getWordImageUrl(target);
    if (!shouldMatch && words.length > 1) {
      const other = words.filter(w => w.id !== target.id)[
        Math.floor(Math.random() * (words.length - 1))
      ];
      def = other.definition;
      img = getWordImageUrl(other);
    }

    setCurrentWord(target);
    setDisplayedDef(def);
    setDisplayedImage(img);
    setIsMatch(shouldMatch);
  };

  const handleStart = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(45);
    setIsGameOver(false);
    setIsStarted(true);
    nextChallenge();
  };

  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          playSound('win');
          confetti({ particleCount: 70, spread: 70 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isGameOver]);

  const handleChoice = (playerThinksMatches: boolean) => {
    if (isGameOver || !currentWord) return;

    if (playerThinksMatches === isMatch) {
      // Correct!
      playSound('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setScore(s => s + 10 + newStreak * 2);
    } else {
      // Wrong!
      playSound('wrong');
      setStreak(0);
    }

    nextChallenge();
  };

  if (!isStarted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Flame className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">4 Game (Speed Rush)</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          45 seconds rapid-fire vocabulary challenge! Read the term and definition, then quickly hit True or False to build combos!
        </p>
        <button
          onClick={handleStart}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl shadow-lg transition transform active:scale-95"
        >
          Start Speed Rush Challenge
        </button>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Time’s Up!</h2>
        <p className="text-slate-500 mb-4">You scored <strong className="text-amber-500 text-xl">{score} pts</strong>!</p>
        <div className="flex justify-center gap-6 mb-6 text-xs text-slate-600">
          <div>Best Combo Streak: <strong className="font-bold text-slate-800">{bestStreak}x</strong></div>
        </div>
        <button
          onClick={handleStart}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Top Controls & HUD */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Clue Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <span className="text-slate-400 text-[10px] uppercase font-bold px-2 select-none">
            Clue:
          </span>
          <button
            type="button"
            onClick={() => togglePicturesMode(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              !isPicturesMode
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Definition</span>
          </button>
          <button
            type="button"
            onClick={() => togglePicturesMode(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              isPicturesMode
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Picture</span>
          </button>
        </div>
      </div>

      {/* Top HUD */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-6 shadow">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-500 animate-spin' : 'text-amber-400'}`} />
          <span className="font-mono text-lg font-bold">{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
          <Flame className="w-4 h-4" /> Streak: {streak}x
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-semibold">SCORE</span>
          <span className="text-lg font-black text-amber-400">{score} pts</span>
        </div>
      </div>

      {/* Target Flash Card */}
      {currentWord && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 sm:p-8 text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full mb-3 inline-block">
            {isPicturesMode ? 'Does this picture match the word?' : 'Does this definition match?'}
          </span>

          <h3 className="text-3xl font-black text-slate-900 my-2">{currentWord.term}</h3>

          {isPicturesMode && displayedImage ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center max-h-48 overflow-hidden">
              <img
                src={displayedImage}
                alt="Clue candidate"
                className="max-h-40 w-auto object-contain rounded-xl shadow-2xs"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[80px] flex items-center justify-center text-sm font-medium text-slate-700 leading-relaxed">
              &ldquo;{displayedDef}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* True / False Rapid Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleChoice(false)}
          className="py-4 rounded-2xl bg-rose-50 border-2 border-rose-300 hover:bg-rose-500 hover:text-white text-rose-700 font-black text-lg flex items-center justify-center gap-2 transition shadow-sm active:scale-95 cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[3]" /> FALSE
        </button>
        <button
          onClick={() => handleChoice(true)}
          className="py-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 hover:bg-emerald-600 hover:text-white text-emerald-700 font-black text-lg flex items-center justify-center gap-2 transition shadow-sm active:scale-95 cursor-pointer"
        >
          <Check className="w-6 h-6 stroke-[3]" /> TRUE
        </button>
      </div>
    </div>
  );
};
