import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { playSound } from '../../utils/audio';
import { recordActivityCompletion } from '../../utils/gamification';
import confetti from 'canvas-confetti';
import { CheckCircle2, Shuffle, RotateCcw, HelpCircle, Heart, Award, ArrowRight } from 'lucide-react';

interface Props {
  words: VocabWord[];
  accent: string;
}

interface CategoryGroup {
  id: string;
  category: string;
  difficulty: 'yellow' | 'green' | 'blue' | 'purple';
  words: string[];
  explanation: string;
}

const DIFFICULTY_STYLES = {
  yellow: {
    bg: 'bg-[#ffc800] border-[#e5a500] text-amber-950',
    badge: 'Straightforward',
  },
  green: {
    bg: 'bg-[#58cc02] border-[#46a302] text-white',
    badge: 'Intermediate',
  },
  blue: {
    bg: 'bg-[#1cb0f6] border-[#1899d6] text-white',
    badge: 'Advanced',
  },
  purple: {
    bg: 'bg-[#ce82ff] border-[#b05eed] text-white',
    badge: 'Tricky / Clever',
  },
};

export const ConnectionsMode: React.FC<Props> = ({ words, accent }) => {
  // Generate 4 categories of 4 words from the current vocabulary or linguistic themes
  const puzzle = useMemo(() => {
    // Collect words by part of speech or characteristics
    const nouns = words.filter(w => w.partOfSpeech === 'noun').map(w => w.term);
    const verbs = words.filter(w => w.partOfSpeech === 'verb').map(w => w.term);
    const adjs = words.filter(w => w.partOfSpeech === 'adjective').map(w => w.term);
    const other = words.filter(w => !['noun', 'verb', 'adjective'].includes(w.partOfSpeech || '')).map(w => w.term);

    // If we have enough tagged words, assemble them; otherwise generate standard linguistic groups
    const sampleWords = words.map(w => w.term);
    const pool = [...sampleWords];

    // Build 4 groups of 4
    const groups: CategoryGroup[] = [];

    if (nouns.length >= 4) {
      groups.push({
        id: 'g1',
        category: 'Things & Entities (Nouns)',
        difficulty: 'yellow',
        words: nouns.slice(0, 4),
        explanation: 'All of these words are nouns describing objects, concepts, or entities.',
      });
    }

    if (verbs.length >= 4) {
      groups.push({
        id: 'g2',
        category: 'Actions & States (Verbs)',
        difficulty: 'green',
        words: verbs.slice(0, 4),
        explanation: 'All of these words are verbs that express an action or condition.',
      });
    }

    if (adjs.length >= 4) {
      groups.push({
        id: 'g3',
        category: 'Qualities & Descriptors (Adjectives)',
        difficulty: 'blue',
        words: adjs.slice(0, 4),
        explanation: 'All of these words are adjectives modifying and describing qualities.',
      });
    }

    // Default rich fallback groups for full 16 words
    const defaultThemes: { category: string; difficulty: 'yellow' | 'green' | 'blue' | 'purple'; words: string[]; explanation: string }[] = [
      {
        category: 'Academic & Formal Terms',
        difficulty: 'yellow',
        words: ['Analyze', 'Concept', 'Context', 'Derive'],
        explanation: 'Core academic vocabulary frequently found in essays and research.',
      },
      {
        category: 'Actions in Continuous Motion',
        difficulty: 'green',
        words: ['Pursue', 'Innovate', 'Sustain', 'Navigate'],
        explanation: 'Dynamic action verbs representing ongoing momentum.',
      },
      {
        category: 'Words Describing Precision & Quality',
        difficulty: 'blue',
        words: ['Accurate', 'Coherent', 'Diligent', 'Rigorous'],
        explanation: 'High-level descriptive adjectives for excellence and correctness.',
      },
      {
        category: 'Words with Prefix or Root Nuances',
        difficulty: 'purple',
        words: ['Synthesis', 'Hypothesis', 'Perspective', 'Paradigm'],
        explanation: 'Abstract conceptual terms derived from classical Greek and Latin roots.',
      },
    ];

    // Combine available groups with defaults to guarantee exactly 4 groups of 4 words
    let assembled = [...groups];
    for (const dt of defaultThemes) {
      if (assembled.length < 4 && !assembled.some(g => g.category === dt.category)) {
        assembled.push({
          id: `theme-${assembled.length}`,
          ...dt,
        });
      }
    }

    // If set has plenty of words, substitute words from user set into the groups
    if (words.length >= 16) {
      assembled = [
        {
          id: 'set-g1',
          category: 'Vocab Group 1: Foundations',
          difficulty: 'yellow',
          words: words.slice(0, 4).map(w => w.term),
          explanation: 'Core fundamental terms from this vocabulary set.',
        },
        {
          id: 'set-g2',
          category: 'Vocab Group 2: Advanced Expressions',
          difficulty: 'green',
          words: words.slice(4, 8).map(w => w.term),
          explanation: 'Terms developing deeper nuanced expressions.',
        },
        {
          id: 'set-g3',
          category: 'Vocab Group 3: Contextual Mastery',
          difficulty: 'blue',
          words: words.slice(8, 12).map(w => w.term),
          explanation: 'Sophisticated vocabulary applied in analytical settings.',
        },
        {
          id: 'set-g4',
          category: 'Vocab Group 4: Idiomatic & Conceptual',
          difficulty: 'purple',
          words: words.slice(12, 16).map(w => w.term),
          explanation: 'Nuanced concepts and complex expressions.',
        },
      ];
    }

    return assembled;
  }, [words]);

  const [solvedGroups, setSolvedGroups] = useState<CategoryGroup[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [mistakesRemaining, setMistakesRemaining] = useState(4);
  const [message, setMessage] = useState<string | null>(null);
  const [unsolvedWords, setUnsolvedWords] = useState<string[]>([]);

  // Initialize and shuffle on load
  useEffect(() => {
    const allWords: string[] = [];
    puzzle.forEach(g => allWords.push(...g.words));
    setUnsolvedWords(allWords.sort(() => Math.random() - 0.5));
    setSolvedGroups([]);
    setSelectedWords([]);
    setMistakesRemaining(4);
    setMessage(null);
  }, [puzzle]);

  const handleTileClick = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(prev => prev.filter(w => w !== word));
      playSound('click');
    } else {
      if (selectedWords.length < 4) {
        setSelectedWords(prev => [...prev, word]);
        playSound('click');
      }
    }
  };

  const handleShuffle = () => {
    playSound('click');
    setUnsolvedWords(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleDeselectAll = () => {
    playSound('click');
    setSelectedWords([]);
  };

  const handleSubmit = () => {
    if (selectedWords.length !== 4) return;

    // Check if selectedWords match any group exactly
    const matchedGroup = puzzle.find(g => {
      const gWords = g.words.map(w => w.toLowerCase());
      return selectedWords.every(w => gWords.includes(w.toLowerCase()));
    });

    if (matchedGroup) {
      playSound('correct');
      setSolvedGroups(prev => [...prev, matchedGroup]);
      setUnsolvedWords(prev => prev.filter(w => !matchedGroup.words.map(x => x.toLowerCase()).includes(w.toLowerCase())));
      setSelectedWords([]);
      setMessage(null);

      // Check for full puzzle win
      if (solvedGroups.length + 1 === puzzle.length) {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
        recordActivityCompletion('connections', 45);
      }
    } else {
      // Check for "One away..." (3 of 4 match any remaining group)
      const isOneAway = puzzle.some(g => {
        if (solvedGroups.some(sg => sg.id === g.id)) return false;
        const gWords = g.words.map(w => w.toLowerCase());
        const matchCount = selectedWords.filter(w => gWords.includes(w.toLowerCase())).length;
        return matchCount === 3;
      });

      playSound('wrong');
      const nextMistakes = mistakesRemaining - 1;
      setMistakesRemaining(nextMistakes);

      if (isOneAway && nextMistakes > 0) {
        setMessage('One away...');
      } else if (nextMistakes <= 0) {
        setMessage('Game Over! Showing remaining answers.');
        setSolvedGroups(puzzle);
        setUnsolvedWords([]);
      } else {
        setMessage('Not quite right. Try another combination!');
      }

      setTimeout(() => {
        if (nextMistakes > 0) setMessage(null);
      }, 2500);
    }
  };

  const isGameOver = mistakesRemaining <= 0;
  const isGameWon = solvedGroups.length === puzzle.length;

  return (
    <div className="max-w-xl mx-auto px-2">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1cb0f6] border-b-4 border-[#1899d6] text-white flex items-center justify-center font-black text-lg">
            C
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              NYT Connections <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">ESL Edition</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Group 4 words that share a common linguistic or semantic thread
            </p>
          </div>
        </div>

        {/* Lives / Mistakes Remaining */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-extrabold text-slate-500 mr-1 hidden sm:inline">Lives:</span>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                idx < mistakesRemaining ? 'bg-[#ff4b4b] shadow-xs' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Message Feedback Banner */}
      {message && (
        <div className="mb-4 py-2 px-4 bg-slate-900 text-white rounded-xl text-center text-xs font-black animate-bounce shadow-md">
          {message}
        </div>
      )}

      {/* Solved Category Banners */}
      <div className="space-y-2 mb-3">
        {solvedGroups.map(group => {
          const style = DIFFICULTY_STYLES[group.difficulty];
          return (
            <div
              key={group.id}
              className={`p-4 rounded-2xl border-2 border-b-4 text-center transition-all animate-fadeIn shadow-xs ${style.bg}`}
            >
              <h4 className="font-black text-sm uppercase tracking-wider mb-1">{group.category}</h4>
              <p className="font-bold text-xs opacity-95">{group.words.join(', ')}</p>
              <p className="text-[11px] opacity-80 mt-1 italic">{group.explanation}</p>
            </div>
          );
        })}
      </div>

      {/* Unsolved Tiles Grid (4x4) */}
      {!isGameWon && unsolvedWords.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mb-6">
          {unsolvedWords.map(word => {
            const isSelected = selectedWords.includes(word);
            return (
              <button
                key={word}
                onClick={() => handleTileClick(word)}
                className={`h-16 sm:h-20 rounded-2xl p-2 text-center flex items-center justify-center font-extrabold text-xs sm:text-sm border-2 transition-all select-none ${
                  isSelected
                    ? 'bg-[#58cc02] border-[#46a302] border-b-4 text-white -translate-y-1 shadow-md'
                    : 'bg-white border-slate-200 border-b-4 border-b-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="line-clamp-2 leading-tight">{word}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleShuffle}
          disabled={isGameOver || isGameWon}
          className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 active:border-b-2 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle</span>
        </button>

        <button
          onClick={handleDeselectAll}
          disabled={selectedWords.length === 0 || isGameOver || isGameWon}
          className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 active:border-b-2 transition disabled:opacity-50"
        >
          Deselect All
        </button>

        <button
          onClick={handleSubmit}
          disabled={selectedWords.length !== 4 || isGameOver || isGameWon}
          className="px-6 py-2.5 rounded-2xl bg-[#58cc02] border-2 border-[#46a302] border-b-4 text-white font-black text-xs hover:bg-[#61e002] active:border-b-2 active:translate-y-0.5 transition shadow-sm disabled:opacity-50"
        >
          Submit
        </button>
      </div>

      {/* Win celebration banner */}
      {isGameWon && (
        <div className="mt-6 p-5 bg-emerald-50 rounded-3xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] text-center text-emerald-950">
          <Award className="w-10 h-10 text-[#58cc02] mx-auto mb-2" />
          <h3 className="text-base font-black mb-1">Brilliant Connections!</h3>
          <p className="text-xs text-slate-600 mb-4">
            You successfully organized all 4 categories and mastered the linguistic patterns.
          </p>
          <button
            onClick={() => {
              setSolvedGroups([]);
              setMistakesRemaining(4);
              const allWords: string[] = [];
              puzzle.forEach(g => allWords.push(...g.words));
              setUnsolvedWords(allWords.sort(() => Math.random() - 0.5));
            }}
            className="px-5 py-2.5 bg-[#58cc02] hover:bg-[#61e002] text-white font-black text-xs rounded-xl border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Replay Puzzle
          </button>
        </div>
      )}
    </div>
  );
};
