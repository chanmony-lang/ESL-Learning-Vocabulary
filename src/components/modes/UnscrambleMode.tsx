import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Shuffle, Volume2, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const UnscrambleMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [scrambled, setScrambled] = useState<Array<{ char: string; originalIdx: number }>>([]);
  const [assembled, setAssembled] = useState<Array<{ char: string; originalIdx: number }>>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentWord = words[index];

  useEffect(() => {
    if (!currentWord) return;
    const chars = currentWord.term
      .split('')
      .map((char, originalIdx) => ({ char, originalIdx }));

    // Shuffle until not identical to original
    let shuffled = [...chars].sort(() => Math.random() - 0.5);
    if (shuffled.map(s => s.char).join('') === currentWord.term && chars.length > 2) {
      shuffled = [...chars].reverse();
    }

    setScrambled(shuffled);
    setAssembled([]);
    setIsCorrect(false);
  }, [index, currentWord]);

  const handlePickLetter = (item: { char: string; originalIdx: number }, fromPool: boolean) => {
    playSound('click');
    if (fromPool) {
      const newAssembled = [...assembled, item];
      setAssembled(newAssembled);
      setScrambled(scrambled.filter(s => s.originalIdx !== item.originalIdx));

      // Check if finished
      if (newAssembled.length === currentWord.term.length) {
        const formed = newAssembled.map(a => a.char).join('');
        if (formed.toLowerCase() === currentWord.term.toLowerCase()) {
          playSound('correct');
          setIsCorrect(true);
          confetti({ particleCount: 30, spread: 50 });
          speakWord(currentWord.term, accent);
        } else {
          playSound('wrong');
        }
      }
    } else {
      // Put back from assembled into scrambled
      setAssembled(assembled.filter(a => a.originalIdx !== item.originalIdx));
      setScrambled([...scrambled, item]);
      setIsCorrect(false);
    }
  };

  const handleResetCurrent = () => {
    if (!currentWord) return;
    const chars = currentWord.term
      .split('')
      .map((char, originalIdx) => ({ char, originalIdx }))
      .sort(() => Math.random() - 0.5);
    setScrambled(chars);
    setAssembled([]);
    setIsCorrect(false);
  };

  const handleNext = () => {
    if (index + 1 < words.length) {
      setIndex(i => i + 1);
    } else {
      setIndex(0);
    }
  };

  if (!currentWord) {
    return <div className="p-8 text-center text-slate-500">No words available.</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">Unscramble</span>
          <p className="text-base font-bold text-slate-800">{index + 1} / {words.length}</p>
        </div>
        <button
          onClick={handleResetCurrent}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          title="Reset letters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Clue Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            Definition Clue
          </span>
          <button
            onClick={() => speakWord(currentWord.term, accent)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 transition"
            title="Hear word"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-lg font-medium text-slate-800 mb-2">{currentWord.definition}</p>
        {currentWord.exampleSentence && (
          <p className="text-xs text-slate-500 italic">
            &ldquo;{currentWord.exampleSentence.replace(new RegExp(currentWord.term, 'gi'), '_____')}&rdquo;
          </p>
        )}
      </div>

      {/* Target Assembly Area */}
      <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-300 min-h-[80px] flex items-center justify-center gap-2 flex-wrap mb-6">
        {assembled.length === 0 ? (
          <span className="text-xs text-slate-400">Click letter tiles below to unscramble</span>
        ) : (
          assembled.map(item => (
            <button
              key={item.originalIdx}
              onClick={() => handlePickLetter(item, false)}
              className="w-11 h-12 rounded-xl bg-indigo-600 text-white font-extrabold text-xl shadow flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition"
            >
              {item.char}
            </button>
          ))
        )}
      </div>

      {/* Scrambled Letter Tiles Pool */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap mb-8">
        {scrambled.map(item => (
          <button
            key={item.originalIdx}
            onClick={() => handlePickLetter(item, true)}
            className="w-12 h-14 rounded-xl bg-white border-2 border-slate-300 hover:border-indigo-400 font-black text-2xl text-slate-800 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition"
          >
            {item.char}
          </button>
        ))}
      </div>

      {/* Status / Next Button */}
      {isCorrect && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">Correct unscramble!</span>
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
