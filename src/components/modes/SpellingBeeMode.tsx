import React, { useState, useEffect, useCallback } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { recordActivityCompletion } from '../../utils/gamification';
import confetti from 'canvas-confetti';
import { Volume2, Award, HelpCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Space } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const SpellingBeeMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [typedLetters, setTypedLetters] = useState('');
  const [showDefinition, setShowDefinition] = useState(false);
  const [showSentence, setShowSentence] = useState(false);
  const [showPhonetic, setShowPhonetic] = useState(false);
  const [status, setStatus] = useState<'typing' | 'correct' | 'wrong'>('typing');
  const [score, setScore] = useState(0);

  const currentWord = words[index];

  useEffect(() => {
    setTypedLetters('');
    setShowDefinition(false);
    setShowSentence(false);
    setShowPhonetic(false);
    setStatus('typing');
    if (currentWord) {
      setTimeout(() => speakWord(currentWord.term, accent), 200);
    }
  }, [index, currentWord, accent]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (status === 'correct') {
      handleNext();
      return;
    }

    const cleanInput = typedLetters.trim().toLowerCase();
    const cleanTarget = currentWord.term.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      playSound('correct');
      setStatus('correct');
      setScore(s => s + 10);
      confetti({ particleCount: 35, spread: 60 });
      recordActivityCompletion('spellingbee', 25);
    } else {
      playSound('wrong');
      setStatus('wrong');
    }
  }, [status, typedLetters, currentWord]);

  const handleNext = useCallback(() => {
    if (index + 1 < words.length) {
      setIndex(i => i + 1);
    } else {
      setIndex(0);
    }
  }, [index, words.length]);

  const handleLetterKey = useCallback((char: string) => {
    if (status === 'correct') return;
    playSound('click');
    setTypedLetters(prev => prev + char);
  }, [status]);

  const handleBackspace = useCallback(() => {
    playSound('click');
    setTypedLetters(prev => prev.slice(0, -1));
  }, []);

  const handleSpacebar = useCallback(() => {
    if (status === 'correct') {
      handleNext();
      return;
    }
    playSound('click');
    setTypedLetters(prev => prev + ' ');
  }, [status, handleNext]);

  // Physical Keyboard Listener (including Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing into an input field elsewhere
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleSpacebar();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key.length === 1 && /[a-zA-Z\-' ]/.test(e.key)) {
        e.preventDefault();
        handleLetterKey(e.key.toLowerCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpacebar, handleBackspace, handleSubmit, handleLetterKey]);

  if (!currentWord) {
    return <div className="p-8 text-center text-slate-500">No words available.</div>;
  }

  const QWERTY_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐝</span>
          <div>
            <h2 className="text-base font-bold text-slate-800">Spelling Bee (Game 1)</h2>
            <p className="text-xs text-slate-500">Word {index + 1} of {words.length}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Score</span>
          <span className="text-lg font-black text-amber-500">{score} pts</span>
        </div>
      </div>

      {/* Center Stage Audio & Clues */}
      <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-6 sm:p-8 text-center mb-6">
        <div className="w-20 h-20 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-inner">
          <Volume2 className="w-10 h-10 cursor-pointer hover:scale-110 active:scale-95 transition" onClick={() => speakWord(currentWord.term, accent)} />
        </div>

        <button
          onClick={() => speakWord(currentWord.term, accent)}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md transition active:scale-95 inline-flex items-center gap-2 mb-6"
        >
          <Volume2 className="w-4 h-4" />
          Pronounce Word
        </button>

        {/* Spelling Bee Inquiry Buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-medium mb-6">
          <button
            onClick={() => setShowDefinition(!showDefinition)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              showDefinition
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            &ldquo;Definition, please?&rdquo;
          </button>

          {currentWord.exampleSentence && (
            <button
              onClick={() => {
                setShowSentence(!showSentence);
                if (!showSentence) {
                  speakWord(currentWord.exampleSentence.replace(new RegExp(currentWord.term, 'gi'), 'blank'), accent);
                }
              }}
              className={`px-3 py-1.5 rounded-lg border transition ${
                showSentence
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              &ldquo;Use it in a sentence?&rdquo;
            </button>
          )}

          {currentWord.phonetic && (
            <button
              onClick={() => setShowPhonetic(!showPhonetic)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                showPhonetic
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              &ldquo;Language & phonetic clue?&rdquo;
            </button>
          )}
        </div>

        {/* Revealed Clue Cards */}
        {showDefinition && (
          <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 font-medium mb-3">
            <span className="font-bold">Definition:</span> {currentWord.definition}
          </div>
        )}
        {showSentence && currentWord.exampleSentence && (
          <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 italic mb-3">
            &ldquo;{currentWord.exampleSentence.replace(new RegExp(currentWord.term, 'gi'), '_______')}&rdquo;
          </div>
        )}
        {showPhonetic && currentWord.phonetic && (
          <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 font-mono mb-3">
            Phonetic IPA: {currentWord.phonetic} {currentWord.partOfSpeech ? `(${currentWord.partOfSpeech})` : ''}
          </div>
        )}

        {/* Typed Spelled Letters Display */}
        <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-4 min-h-[64px] flex items-center justify-center tracking-widest font-black text-2xl sm:text-3xl text-slate-900 uppercase">
          {typedLetters || <span className="text-slate-400 font-normal text-base tracking-normal">Type letters to spell...</span>}
        </div>
      </div>

      {/* Onscreen Keyboard */}
      <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 shadow-inner mb-4">
        {QWERTY_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5 mb-1.5">
            {row.map(char => (
              <button
                key={char}
                onClick={() => handleLetterKey(char.toLowerCase())}
                className="w-7 h-10 sm:w-10 sm:h-12 bg-white rounded-lg shadow-sm border border-slate-300 font-bold text-sm sm:text-base text-slate-800 hover:bg-slate-50 active:scale-95 transition"
              >
                {char}
              </button>
            ))}
          </div>
        ))}
        {/* Dedicated Spacebar Row */}
        <div className="flex justify-center my-1.5">
          <button
            onClick={handleSpacebar}
            className="w-48 sm:w-72 h-10 sm:h-11 bg-white rounded-xl shadow-xs border-2 border-slate-300 font-bold text-xs sm:text-sm text-slate-700 hover:bg-amber-50 hover:border-amber-400 active:scale-95 transition flex items-center justify-center gap-2 border-b-4 border-b-slate-400 active:border-b-2"
            title="Press Spacebar or click here"
          >
            <Space className="w-4 h-4 text-amber-500" />
            <span>Spacebar</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">(Space)</span>
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={handleBackspace}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition"
          >
            Backspace
          </button>
          <button
            onClick={() => setTypedLetters('')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition"
          >
            Clear
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={!typedLetters.trim()}
            className="px-6 py-2.5 bg-[#58cc02] hover:bg-[#61e002] text-white font-black rounded-xl text-xs border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 shadow-sm transition disabled:opacity-50"
          >
            Submit Spelling
          </button>
        </div>
      </div>

      {/* Result feedback */}
      {status === 'correct' && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">Spot on! &ldquo;{currentWord.term}&rdquo; is correctly spelled!</span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1"
          >
            Next Word <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {status === 'wrong' && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-rose-950">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>
              Incorrect spelling. Correct is: <strong className="font-mono">{currentWord.term}</strong>
            </span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};
