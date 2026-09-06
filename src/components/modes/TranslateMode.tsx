import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Languages, Volume2, CheckCircle2, RotateCcw, ArrowRight, Globe } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const TranslateMode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [typedInput, setTypedInput] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [modeDirection, setModeDirection] = useState<'to-en' | 'to-trans'>('to-en');

  // Filter words with translations
  const wordsWithTrans = words.filter(w => w.translation && w.translation.trim().length > 0);
  const currentWord = wordsWithTrans[index] || words[0];

  useEffect(() => {
    setTypedInput('');
    setIsRevealed(false);
  }, [index, currentWord, modeDirection]);

  if (!currentWord || wordsWithTrans.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No translation data found for this set. You can add translations to words in the Set Editor!
      </div>
    );
  }

  const handleReveal = () => {
    playSound('correct');
    setIsRevealed(true);
    speakWord(currentWord.term, accent);
  };

  const handleNext = () => {
    if (index + 1 < wordsWithTrans.length) {
      setIndex(i => i + 1);
    } else {
      setIndex(0);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Languages className="w-5 h-5 text-indigo-600" />
            Translation Practice
          </h2>
          <p className="text-xs text-slate-500">Practice bilingual recall and translation pairs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModeDirection(m => (m === 'to-en' ? 'to-trans' : 'to-en'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-200 hover:bg-indigo-100 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            {modeDirection === 'to-en' ? 'Translation ➔ English' : 'English ➔ Translation'}
          </button>
        </div>
      </div>

      {/* Main Flash Translation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
          {modeDirection === 'to-en' ? 'Multilingual Prompt' : 'English Term'}
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {modeDirection === 'to-en' ? currentWord.translation : currentWord.term}
        </h3>

        {modeDirection === 'to-trans' && currentWord.phonetic && (
          <p className="text-xs font-mono text-slate-400 mb-4">{currentWord.phonetic}</p>
        )}

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-md mx-auto mb-6 text-xs text-slate-600 font-medium leading-relaxed">
          Meaning: {currentWord.definition}
        </div>

        {/* Input area */}
        <div className="max-w-md mx-auto mb-6">
          <input
            type="text"
            value={typedInput}
            onChange={e => setTypedInput(e.target.value)}
            placeholder={modeDirection === 'to-en' ? 'Type the English term...' : 'Type the translation...'}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-center font-bold text-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        {isRevealed ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 mb-4 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-base">
                {modeDirection === 'to-en' ? currentWord.term : currentWord.translation}
              </span>
              <button
                onClick={() => speakWord(currentWord.term, accent)}
                className="p-1 text-indigo-600 hover:bg-emerald-100 rounded"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {currentWord.exampleSentence && (
              <p className="text-xs text-emerald-800 italic">&ldquo;{currentWord.exampleSentence}&rdquo;</p>
            )}
          </div>
        ) : (
          <button
            onClick={handleReveal}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
          >
            Check Translation Answer
          </button>
        )}

        {isRevealed && (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-md transition inline-flex items-center gap-2 mt-2"
          >
            Next Term <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
