import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Volume2, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

export const Unscramble2Mode: React.FC<Props> = ({ words, accent }) => {
  const [index, setIndex] = useState(0);
  const [tokens, setTokens] = useState<Array<{ text: string; id: number }>>([]);
  const [selectedTokens, setSelectedTokens] = useState<Array<{ text: string; id: number }>>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  // Filter words with example sentences
  const wordsWithSentences = words.filter(w => w.exampleSentence && w.exampleSentence.trim().length > 10);
  const currentWord = wordsWithSentences[index] || words[0];

  useEffect(() => {
    if (!currentWord || !currentWord.exampleSentence) return;
    const rawTokens = currentWord.exampleSentence.trim().split(/\s+/);
    const mapped = rawTokens.map((text, id) => ({ text, id }));
    // Shuffle
    setTokens([...mapped].sort(() => Math.random() - 0.5));
    setSelectedTokens([]);
    setIsCorrect(false);
  }, [index, currentWord]);

  const handlePickToken = (token: { text: string; id: number }, fromPool: boolean) => {
    playSound('click');
    if (fromPool) {
      const nextSelected = [...selectedTokens, token];
      setSelectedTokens(nextSelected);
      setTokens(tokens.filter(t => t.id !== token.id));

      if (currentWord.exampleSentence && nextSelected.length === currentWord.exampleSentence.split(/\s+/).length) {
        const formed = nextSelected.map(t => t.text).join(' ');
        if (formed.trim().toLowerCase() === currentWord.exampleSentence.trim().toLowerCase()) {
          playSound('correct');
          setIsCorrect(true);
          confetti({ particleCount: 35, spread: 60 });
          speakWord(currentWord.exampleSentence, accent);
        } else {
          playSound('wrong');
        }
      }
    } else {
      setSelectedTokens(selectedTokens.filter(t => t.id !== token.id));
      setTokens([...tokens, token]);
      setIsCorrect(false);
    }
  };

  const handleReset = () => {
    if (!currentWord || !currentWord.exampleSentence) return;
    const rawTokens = currentWord.exampleSentence.trim().split(/\s+/);
    const mapped = rawTokens.map((text, id) => ({ text, id }));
    setTokens([...mapped].sort(() => Math.random() - 0.5));
    setSelectedTokens([]);
    setIsCorrect(false);
  };

  const handleNext = () => {
    if (index + 1 < wordsWithSentences.length) {
      setIndex(i => i + 1);
    } else {
      setIndex(0);
    }
  };

  if (!currentWord || !currentWord.exampleSentence) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Please add example sentences to the words in this set to play Sentence Unscramble!
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">Unscramble 2</span>
          <p className="text-base font-bold text-slate-800">Sentence Syntax Builder</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {index + 1} / {wordsWithSentences.length}
          </span>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Reset sentence"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Word Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            Target Vocabulary Word
          </span>
          <button
            onClick={() => speakWord(currentWord.term, accent)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 transition"
            title="Hear word"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-1">{currentWord.term}</h3>
        <p className="text-sm text-slate-600 font-medium">{currentWord.definition}</p>
      </div>

      {/* Assembled Sentence Box */}
      <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-300 min-h-[90px] flex items-center justify-start gap-2 flex-wrap mb-6">
        {selectedTokens.length === 0 ? (
          <span className="text-xs text-slate-400 mx-auto">
            Click words below to assemble the natural English sentence
          </span>
        ) : (
          selectedTokens.map(token => {
            const isTargetWord = token.text.toLowerCase().includes(currentWord.term.toLowerCase());
            return (
              <button
                key={token.id}
                onClick={() => handlePickToken(token, false)}
                className={`px-3 py-1.5 rounded-xl font-semibold text-sm shadow-sm transition active:scale-95 ${
                  isTargetWord
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-500 font-bold'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {token.text}
              </button>
            );
          })
        )}
      </div>

      {/* Unselected Word Tokens */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
        {tokens.map(token => {
          const isTargetWord = token.text.toLowerCase().includes(currentWord.term.toLowerCase());
          return (
            <button
              key={token.id}
              onClick={() => handlePickToken(token, true)}
              className={`px-3.5 py-2 rounded-xl border-2 font-medium text-sm transition shadow-xs hover:scale-105 active:scale-95 ${
                isTargetWord
                  ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                  : 'bg-white border-slate-300 hover:border-indigo-400 text-slate-800'
              }`}
            >
              {token.text}
            </button>
          );
        })}
      </div>

      {/* Success Notification */}
      {isCorrect && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold">Sentence grammatically perfect!</span>
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1"
          >
            Next Sentence <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
