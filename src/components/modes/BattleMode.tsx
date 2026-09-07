import React, { useState, useMemo } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { getWordImageUrl } from '../../utils/wordVisuals';
import confetti from 'canvas-confetti';
import { Swords, Shield, Heart, Zap, Flame, RotateCcw, Trophy, Image as ImageIcon, BookOpen } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
  showPictures?: boolean;
  onTogglePictures?: () => void;
}

interface BattleChoice {
  id: string;
  definition: string;
  imageUrl?: string;
  word: VocabWord;
}

export const BattleMode: React.FC<Props> = ({ words, accent, showPictures: initialPictures = false, onTogglePictures }) => {
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

  const [playerHp, setPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(100);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedSpell, setSelectedSpell] = useState<'strike' | 'fireball' | 'heal'>('strike');
  const [battleLog, setBattleLog] = useState<string[]>(['A wild Vocab Dragon appears! Answer correctly to cast spells!']);
  const [isFinished, setIsFinished] = useState<'won' | 'lost' | null>(null);

  const questionWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5);
  }, [words]);

  const currentWord = questionWords[questionIndex % questionWords.length];

  // 3 choices (1 correct, 2 distractors)
  const choices = useMemo<BattleChoice[]>(() => {
    if (!currentWord) return [];
    const others = words
      .filter(w => w.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    const pool = [currentWord, ...others].sort(() => Math.random() - 0.5);
    return pool.map(w => ({
      id: w.id,
      definition: w.definition,
      imageUrl: getWordImageUrl(w),
      word: w,
    }));
  }, [currentWord, words]);

  const handleAnswer = (choice: BattleChoice) => {
    if (isFinished || !currentWord) return;

    const isCorrect = choice.id === currentWord.id;

    if (isCorrect) {
      playSound('correct');
      if (selectedSpell === 'strike') {
        const dmg = 35;
        const nextBossHp = Math.max(0, bossHp - dmg);
        setBossHp(nextBossHp);
        setBattleLog(prev => [`⚡ Critical Lightning Strike! You dealt ${dmg} DMG to Vocab Dragon!`, ...prev.slice(0, 4)]);
        if (nextBossHp === 0) {
          endBattle(true);
          return;
        }
      } else if (selectedSpell === 'fireball') {
        const dmg = 25;
        const nextBossHp = Math.max(0, bossHp - dmg);
        setBossHp(nextBossHp);
        setBattleLog(prev => [`🔥 Fireball explosion dealt ${dmg} DMG to the Dragon!`, ...prev.slice(0, 4)]);
        if (nextBossHp === 0) {
          endBattle(true);
          return;
        }
      } else if (selectedSpell === 'heal') {
        const heal = 30;
        setPlayerHp(prev => Math.min(100, prev + heal));
        setBattleLog(prev => [`💚 Healing light restored +${heal} HP!`, ...prev.slice(0, 4)]);
      }
    } else {
      playSound('wrong');
      const bossDmg = 25;
      const nextPlayerHp = Math.max(0, playerHp - bossDmg);
      setPlayerHp(nextPlayerHp);
      setBattleLog(prev => [
        `❌ Spell miscast! The Vocab Dragon retaliated with Dragon Breath for ${bossDmg} DMG! Target was "${currentWord.term}".`,
        ...prev.slice(0, 4),
      ]);
      if (nextPlayerHp === 0) {
        endBattle(false);
        return;
      }
    }

    setQuestionIndex(i => i + 1);
  };

  const endBattle = (won: boolean) => {
    if (won) {
      setIsFinished('won');
      playSound('win');
      confetti({ particleCount: 80, spread: 70 });
    } else {
      setIsFinished('lost');
      playSound('wrong');
    }
  };

  const handleRestart = () => {
    setPlayerHp(100);
    setBossHp(100);
    setQuestionIndex(0);
    setIsFinished(null);
    setBattleLog(['A wild Vocab Dragon appears! Answer correctly to cast spells!']);
  };

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${
            isFinished === 'won' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}
        >
          {isFinished === 'won' ? '🏆' : '💀'}
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">
          {isFinished === 'won' ? 'Victory! Boss Defeated!' : 'Defeated in Battle!'}
        </h2>
        <p className="text-slate-500 mb-6">
          {isFinished === 'won'
            ? 'Your ESL vocabulary powers triumphed over the mythical beast!'
            : 'Study the terms and return to challenge the Vocab Dragon once more!'}
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          Battle Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Battle Arena Header with HP Bars */}
      <div className="grid grid-cols-2 gap-4 bg-slate-900 text-white p-5 rounded-2xl mb-6 shadow-md">
        {/* Player Stats */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <Shield className="w-3.5 h-3.5" /> Vocab Hero
            </span>
            <span>{playerHp} / 100 HP</span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${playerHp}%` }}
            />
          </div>
        </div>

        {/* Boss Stats */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1 text-rose-400">
              <Swords className="w-3.5 h-3.5" /> Vocab Dragon 🐉
            </span>
            <span>{bossHp} / 100 HP</span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${bossHp}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clue Mode and Spell Action Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        {/* Clue Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <span className="text-slate-400 text-[10px] uppercase font-bold px-2 select-none">
            Clues:
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

        {/* Spell Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedSpell('strike')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              selectedSpell === 'strike'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            Strike (35)
          </button>
          <button
            onClick={() => setSelectedSpell('fireball')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              selectedSpell === 'fireball'
                ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            Fireball (25)
          </button>
          <button
            onClick={() => setSelectedSpell('heal')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              selectedSpell === 'heal'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-emerald-500" />
            Heal (+30)
          </button>
        </div>
      </div>

      {/* Current Word Target Card */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 mb-6 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          {isPicturesMode
            ? 'Cast your spell by identifying the matching picture for:'
            : 'Cast your spell by identifying the meaning of:'}
        </p>
        <h3 className="text-3xl font-black text-slate-900 mb-4">{currentWord.term}</h3>

        {/* Choices to cast spell */}
        {isPicturesMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {choices.map((choice, i) => (
              <button
                key={choice.id}
                onClick={() => handleAnswer(choice)}
                className="p-3 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition flex flex-col items-center justify-between text-center group cursor-pointer"
              >
                <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-200 flex items-center justify-center">
                  {choice.imageUrl ? (
                    <img
                      src={choice.imageUrl}
                      alt="Battle visual clue"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Visual</span>
                  )}
                </div>
                <span className="text-xs font-bold text-indigo-600 uppercase">Cast Spell ⚔️</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-left">
            {choices.map((choice, i) => (
              <button
                key={choice.id}
                onClick={() => handleAnswer(choice)}
                className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-800 text-sm font-medium transition flex items-center justify-between cursor-pointer"
              >
                <span>{choice.definition}</span>
                <span className="text-xs font-bold text-indigo-600 uppercase ml-2 shrink-0">Cast Spell →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Battle Combat Log */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-xs space-y-1 font-mono text-slate-700">
        <p className="font-bold text-slate-500 mb-1 font-sans">COMBAT LOG</p>
        {battleLog.map((log, i) => (
          <p key={i} className={i === 0 ? 'font-bold text-slate-900' : 'opacity-70'}>
            {log}
          </p>
        ))}
      </div>
    </div>
  );
};
