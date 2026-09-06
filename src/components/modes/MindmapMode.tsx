import React, { useState } from 'react';
import { VocabWord, VocabSet } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { Network, Volume2, X, Sparkles, BookOpen } from 'lucide-react';

interface Props {
  words: VocabWord[];
  currentSet: VocabSet;
  accent: string;
}

export const MindmapMode: React.FC<Props> = ({ words, currentSet, accent }) => {
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(words[0] || null);

  // Layout calculations for radial mindmap
  const center = { x: 300, y: 240 };
  const radius = 170;

  // Render up to 10 nodes for clean circular diagram
  const displayWords = words.slice(0, 10);
  const angleStep = (2 * Math.PI) / (displayWords.length || 1);

  const handleSelect = (word: VocabWord) => {
    playSound('click');
    setSelectedWord(word);
    speakWord(word.term, accent);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            Vocabulary Concept Mindmap
          </h2>
          <p className="text-xs text-slate-500">
            Interactive associative semantic web for <strong className="text-slate-700">{currentSet.title}</strong>
          </p>
        </div>
      </div>

      {/* Mindmap Interactive Canvas & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* SVG Mindmap Graph */}
        <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-4 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 600 480" className="w-full h-auto max-h-[460px] select-none">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Connecting lines from center to nodes */}
            {displayWords.map((word, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const nodeX = center.x + radius * Math.cos(angle);
              const nodeY = center.y + radius * Math.sin(angle);
              const isSelected = selectedWord?.id === word.id;

              return (
                <line
                  key={`line_${word.id}`}
                  x1={center.x}
                  y1={center.y}
                  x2={nodeX}
                  y2={nodeY}
                  stroke={isSelected ? '#6366f1' : '#cbd5e1'}
                  strokeWidth={isSelected ? '3' : '1.5'}
                  strokeDasharray={isSelected ? 'none' : '4 4'}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Center Core Node: Vocabulary Set Topic */}
            <circle
              cx={center.x}
              cy={center.y}
              r="48"
              fill="#4f46e5"
              className="filter drop-shadow-md"
            />
            <text
              x={center.x}
              y={center.y - 6}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="bold"
            >
              {currentSet.title.slice(0, 14)}
            </text>
            <text
              x={center.x}
              y={center.y + 12}
              textAnchor="middle"
              fill="#c7d2fe"
              fontSize="10"
            >
              {words.length} terms
            </text>

            {/* Outer Vocabulary Branch Nodes */}
            {displayWords.map((word, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const nodeX = center.x + radius * Math.cos(angle);
              const nodeY = center.y + radius * Math.sin(angle);
              const isSelected = selectedWord?.id === word.id;

              return (
                <g
                  key={word.id}
                  onClick={() => handleSelect(word)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <circle
                    cx={nodeX}
                    cy={nodeY}
                    r={isSelected ? '32' : '26'}
                    fill={isSelected ? '#4338ca' : '#f8fafc'}
                    stroke={isSelected ? '#818cf8' : '#cbd5e1'}
                    strokeWidth={isSelected ? '3' : '1.5'}
                    className="filter drop-shadow-xs transition-all duration-200"
                  />
                  <text
                    x={nodeX}
                    y={nodeY + 4}
                    textAnchor="middle"
                    fill={isSelected ? '#ffffff' : '#1e293b'}
                    fontSize={isSelected ? '11' : '10'}
                    fontWeight="bold"
                  >
                    {word.term.slice(0, 8)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Word Detail Sidebar */}
        <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-sm p-6">
          {selectedWord ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {selectedWord.partOfSpeech || 'Word Node'}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{selectedWord.term}</h3>
                  {selectedWord.phonetic && (
                    <p className="text-xs font-mono text-slate-400">{selectedWord.phonetic}</p>
                  )}
                </div>
                <button
                  onClick={() => speakWord(selectedWord.term, accent)}
                  className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition"
                  title="Pronounce"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Meaning</p>
                <p className="text-sm font-medium text-slate-800 mt-1 leading-relaxed">
                  {selectedWord.definition}
                </p>
              </div>

              {selectedWord.exampleSentence && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Usage in Sentence</p>
                  <p className="text-xs text-slate-600 italic mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    &ldquo;{selectedWord.exampleSentence}&rdquo;
                  </p>
                </div>
              )}

              {selectedWord.synonyms && selectedWord.synonyms.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1.5">Connected Synonyms</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedWord.synonyms.map(syn => (
                      <span key={syn} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-medium">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedWord.translation && (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Translation: </span>
                  {selectedWord.translation}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Click any vocabulary node on the mindmap web to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
