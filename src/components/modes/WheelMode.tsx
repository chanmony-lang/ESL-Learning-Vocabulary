import React, { useState, useRef } from 'react';
import { VocabWord } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Disc, Volume2, Sparkles, CheckCircle2, RotateCw } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

const COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
  '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'
];

export const WheelMode: React.FC<Props> = ({ words, accent }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [activeTab, setActiveTab] = useState<'define' | 'sentence' | 'synonym'>('define');
  const [userSentence, setUserSentence] = useState('');
  const [sentenceSubmitted, setSentenceSubmitted] = useState(false);

  // Take up to 8 words for clean wheel slices
  const wheelWords = words.slice(0, 8);
  const sliceAngle = 360 / wheelWords.length;

  const handleSpin = () => {
    if (isSpinning || wheelWords.length === 0) return;
    setIsSpinning(true);
    setSelectedWord(null);
    setSentenceSubmitted(false);
    setUserSentence('');
    playSound('spin');

    // Random extra spins (between 4 and 8 full rotations) + random stop slice
    const randomExtraSpins = 360 * 5 + Math.floor(Math.random() * 360);
    const targetRotation = rotation + randomExtraSpins;
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      // Determine which word is at top (pointer at 270 deg / 12 o'clock)
      const normalizedAngle = (360 - (targetRotation % 360)) % 360;
      const index = Math.floor(normalizedAngle / sliceAngle) % wheelWords.length;
      const landed = wheelWords[index];
      setSelectedWord(landed);
      playSound('correct');
      confetti({ particleCount: 35, spread: 50 });
      speakWord(landed.term, accent);
    }, 3500);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Disc className="w-6 h-6 text-indigo-600 animate-spin-slow" />
          Vocabulary Fortune Wheel
        </h2>
        <p className="text-xs text-slate-500">
          Spin the wheel! Whichever vocabulary word it lands on, complete the challenge!
        </p>
      </div>

      {/* Wheel Container */}
      <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center mb-8">
        {/* Pointer Arrow at Top */}
        <div className="absolute top-0 z-20 -mt-2">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-600 drop-shadow-md" />
        </div>

        {/* SVG Wheel */}
        <div
          className="w-full h-full rounded-full shadow-2xl overflow-hidden transition-transform ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '3500ms' : '0ms',
            transitionTimingFunction: 'cubic-bezier(0.15, 0.9, 0.2, 1)',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {wheelWords.map((word, i) => {
              const startAngle = (i * sliceAngle * Math.PI) / 180;
              const endAngle = (((i + 1) * sliceAngle) * Math.PI) / 180;
              const x1 = 50 + 50 * Math.cos(startAngle);
              const y1 = 50 + 50 * Math.sin(startAngle);
              const x2 = 50 + 50 * Math.cos(endAngle);
              const y2 = 50 + 50 * Math.sin(endAngle);
              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
              const midAngle = ((i + 0.5) * sliceAngle);

              return (
                <g key={word.id}>
                  <path d={pathData} fill={COLORS[i % COLORS.length]} />
                  <text
                    x="72"
                    y="50"
                    transform={`rotate(${midAngle}, 50, 50)`}
                    fill="#ffffff"
                    fontSize="4.2"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {word.term.length > 11 ? word.term.slice(0, 10) + '..' : word.term}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Center Hub Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="absolute z-10 w-20 h-20 rounded-full bg-white border-4 border-slate-800 text-slate-900 font-extrabold text-sm shadow-xl flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition disabled:opacity-75 cursor-pointer"
        >
          <RotateCw className={`w-5 h-5 mb-0.5 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? '...' : 'SPIN'}</span>
        </button>
      </div>

      {/* Challenge Card after spinning */}
      {selectedWord && (
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 animate-fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Wheel Selection
              </span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{selectedWord.term}</h3>
              {selectedWord.phonetic && (
                <p className="text-xs font-mono text-slate-400">{selectedWord.phonetic}</p>
              )}
            </div>
            <button
              onClick={() => speakWord(selectedWord.term, accent)}
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition"
              title="Pronounce"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Challenge Tabs */}
          <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('define')}
              className={`pb-2 px-3 border-b-2 transition ${
                activeTab === 'define'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Meaning & Context
            </button>
            <button
              onClick={() => setActiveTab('sentence')}
              className={`pb-2 px-3 border-b-2 transition ${
                activeTab === 'sentence'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Make a Sentence
            </button>
            <button
              onClick={() => setActiveTab('synonym')}
              className={`pb-2 px-3 border-b-2 transition ${
                activeTab === 'synonym'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Synonyms
            </button>
          </div>

          {activeTab === 'define' && (
            <div className="space-y-3">
              <p className="text-base text-slate-800 font-medium">{selectedWord.definition}</p>
              {selectedWord.exampleSentence && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                  &ldquo;{selectedWord.exampleSentence}&rdquo;
                </p>
              )}
            </div>
          )}

          {activeTab === 'sentence' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Write an original English sentence using the word <strong className="text-indigo-600">{selectedWord.term}</strong>:
              </p>
              <textarea
                value={userSentence}
                onChange={e => setUserSentence(e.target.value)}
                placeholder={`Example: In order to ${selectedWord.term}...`}
                className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                rows={2}
              />
              <button
                onClick={() => {
                  if (userSentence.trim()) {
                    setSentenceSubmitted(true);
                    playSound('correct');
                    confetti({ particleCount: 20 });
                  }
                }}
                disabled={!userSentence.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
              >
                Submit Sentence Challenge
              </button>
              {sentenceSubmitted && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Great sentence composition! Compare with the sample: &ldquo;{selectedWord.exampleSentence}&rdquo;
                </div>
              )}
            </div>
          )}

          {activeTab === 'synonym' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Known synonyms & alternatives:</p>
              {selectedWord.synonyms && selectedWord.synonyms.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedWord.synonyms.map(syn => (
                    <span
                      key={syn}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No synonyms recorded for this term yet.</p>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSpin}
              className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Spin Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
