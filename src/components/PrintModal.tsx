import React, { useState, useMemo } from 'react';
import { VocabSet, VocabWord } from '../types';
import { Printer, X, FileText, Layers, CheckSquare, Grid, Sparkles, HelpCircle } from 'lucide-react';

interface Props {
  set: VocabSet;
  onClose: () => void;
}

type PrintLayout = 'flashcards' | 'studysheet' | 'quiz' | 'wordsearch';

export const PrintModal: React.FC<Props> = ({ set, onClose }) => {
  const [layout, setLayout] = useState<PrintLayout>('flashcards');
  const [includeImages, setIncludeImages] = useState(true);
  const [includePhonetics, setIncludePhonetics] = useState(true);
  const [includeTranslations, setIncludeTranslations] = useState(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);

  const words = set.words;

  // Generate word search grid for printable word search layout
  const wordSearchData = useMemo(() => {
    if (layout !== 'wordsearch') return null;
    const size = 12;
    const grid: string[][] = Array(size)
      .fill('')
      .map(() => Array(size).fill(''));

    const cleanList = words
      .map(w => w.term.replace(/[^a-zA-Z]/g, '').toUpperCase())
      .filter(w => w.length >= 3 && w.length <= 10)
      .slice(0, 10);

    // Place words horizontally and vertically
    cleanList.forEach((word, idx) => {
      const isHorizontal = idx % 2 === 0;
      const row = (idx * 2) % size;
      const col = 0;
      for (let i = 0; i < word.length && i < size; i++) {
        if (isHorizontal) {
          grid[row][i] = word[i];
        } else {
          grid[i][(idx * 2) % size] = word[i];
        }
      }
    });

    // Fill remaining with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) {
          grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    return { grid, wordList: cleanList };
  }, [layout, words]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Header (Hidden during print) */}
        <div className="no-print p-5 border-b-2 border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#58cc02] border-b-4 border-[#46a302] text-white flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Print Vocabulary Material
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Printable study sheets, cut-out flashcards, quizzes & word searches for &ldquo;{set.title}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[#58cc02] hover:bg-[#61e002] text-white font-black text-xs rounded-xl border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layout Selector and Options Toolbar (Hidden during print) */}
        <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Layout Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLayout('flashcards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                layout === 'flashcards'
                  ? 'bg-white text-slate-900 border-2 border-slate-300 border-b-4 border-b-slate-400 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-500" />
              <span>Cut-Out Flashcards</span>
            </button>

            <button
              onClick={() => setLayout('studysheet')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                layout === 'studysheet'
                  ? 'bg-white text-slate-900 border-2 border-slate-300 border-b-4 border-b-slate-400 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Study Sheet</span>
            </button>

            <button
              onClick={() => setLayout('quiz')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                layout === 'quiz'
                  ? 'bg-white text-slate-900 border-2 border-slate-300 border-b-4 border-b-slate-400 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              <span>Exam / Quiz Sheet</span>
            </button>

            <button
              onClick={() => setLayout('wordsearch')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                layout === 'wordsearch'
                  ? 'bg-white text-slate-900 border-2 border-slate-300 border-b-4 border-b-slate-400 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Grid className="w-4 h-4 text-amber-500" />
              <span>Word Search Puzzle</span>
            </button>
          </div>

          {/* Print Toggles */}
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={e => setIncludeImages(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-0"
              />
              Images
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePhonetics}
                onChange={e => setIncludePhonetics(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-0"
              />
              Phonetics
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTranslations}
                onChange={e => setIncludeTranslations(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-0"
              />
              Translations
            </label>
            {layout === 'quiz' && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-indigo-700">
                <input
                  type="checkbox"
                  checked={includeAnswerKey}
                  onChange={e => setIncludeAnswerKey(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                Answer Key
              </label>
            )}
          </div>
        </div>

        {/* Printable Document Canvas */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 print:bg-white print:p-0">
          <div
            id="printable-area"
            className="bg-white mx-auto max-w-[210mm] min-h-[297mm] p-8 border border-slate-300 print:border-0 print:p-4 shadow-md print:shadow-none text-slate-900 font-sans"
          >
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{set.title}</h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {set.description || 'ESL Vocabulary Study Material'} &bull; {words.length} Vocabulary Terms
                </p>
              </div>
              <div className="text-right text-xs font-bold text-slate-600">
                <p>Name: _______________________</p>
                <p className="mt-1">Date: _______________________</p>
              </div>
            </div>

            {/* Layout 1: Cut-Out Flashcards */}
            {layout === 'flashcards' && (
              <div className="grid grid-cols-2 gap-4">
                {words.map((word, idx) => (
                  <div
                    key={word.id || idx}
                    className="border-2 border-dashed border-slate-400 p-4 rounded-xl min-h-[140px] flex flex-col justify-between bg-white"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-lg font-black text-slate-900">{word.term}</span>
                          {includePhonetics && word.phonetic && (
                            <span className="text-xs font-mono text-slate-500 ml-2">
                              {word.phonetic}
                            </span>
                          )}
                        </div>
                        {word.partOfSpeech && (
                          <span className="text-[10px] uppercase font-bold border border-slate-300 px-1.5 py-0.5 rounded">
                            {word.partOfSpeech}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-slate-800 leading-snug">
                        {word.definition}
                      </p>

                      {word.exampleSentence && (
                        <p className="text-[11px] text-slate-500 italic mt-1.5">
                          &ldquo;{word.exampleSentence}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 mt-2">
                      {includeTranslations && word.translation ? (
                        <span>Translation: {word.translation}</span>
                      ) : (
                        <span>Card #{idx + 1}</span>
                      )}
                      <span className="font-mono">✂ Cut line</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Layout 2: Study Sheet Checklist */}
            {layout === 'studysheet' && (
              <div className="space-y-3">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800">
                      <th className="p-2 w-8 text-center">✓</th>
                      <th className="p-2 w-32">Term</th>
                      <th className="p-2 w-16">Type</th>
                      <th className="p-2">Definition & Context</th>
                      {includeTranslations && <th className="p-2 w-28">Translation</th>}
                      <th className="p-2 w-24">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {words.map((word, idx) => (
                      <tr key={word.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center">
                          <div className="w-4 h-4 border border-slate-400 rounded inline-block" />
                        </td>
                        <td className="p-2 font-black text-slate-900">
                          {word.term}
                          {includePhonetics && word.phonetic && (
                            <span className="block text-[10px] font-mono text-slate-400 font-normal">
                              {word.phonetic}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-[11px] font-bold text-slate-600 uppercase">
                          {word.partOfSpeech || '-'}
                        </td>
                        <td className="p-2">
                          <p className="font-medium text-slate-800">{word.definition}</p>
                          {word.exampleSentence && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              &ldquo;{word.exampleSentence}&rdquo;
                            </p>
                          )}
                        </td>
                        {includeTranslations && (
                          <td className="p-2 text-slate-600 font-semibold">{word.translation || '-'}</td>
                        )}
                        <td className="p-2 border-l border-slate-100">
                          <div className="h-4 border-b border-dotted border-slate-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Layout 3: Exam / Quiz Sheet */}
            {layout === 'quiz' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-3 border-b border-slate-300 pb-1">
                    Part I: Match each term with its correct definition
                  </h3>
                  <div className="grid grid-cols-2 gap-6 text-xs">
                    {/* Terms column */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-500 block mb-1">Vocabulary Terms:</span>
                      {words.slice(0, 8).map((word, idx) => (
                        <div key={word.id || idx} className="flex items-center gap-2">
                          <span className="font-bold w-5">{idx + 1}.</span>
                          <span className="w-12 border-b border-slate-500 text-center font-bold"></span>
                          <span className="font-black text-slate-900">{word.term}</span>
                        </div>
                      ))}
                    </div>

                    {/* Definitions Column (shuffled) */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-500 block mb-1">Definitions:</span>
                      {words.slice(0, 8).map((word, idx) => {
                        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                        return (
                          <div key={word.id || idx} className="flex items-start gap-2">
                            <span className="font-bold">{letters[idx]}.</span>
                            <span className="text-slate-800">{word.definition}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-3 border-b border-slate-300 pb-1">
                    Part II: Complete the sentences using the vocabulary word bank
                  </h3>
                  <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-center font-black text-xs mb-4">
                    Word Bank: {words.slice(0, 6).map(w => w.term).join(' &bull; ')}
                  </div>

                  <div className="space-y-3 text-xs">
                    {words.slice(0, 6).map((word, idx) => (
                      <div key={word.id || idx} className="flex items-start gap-2">
                        <span className="font-bold">{idx + 1}.</span>
                        <p className="leading-relaxed">
                          {word.exampleSentence
                            ? word.exampleSentence.replace(new RegExp(word.term, 'gi'), '________________________')
                            : `The concept of ________________________ is defined as ${word.definition}.`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer Key on last page */}
                {includeAnswerKey && (
                  <div className="mt-12 pt-6 border-t-2 border-dashed border-slate-400 text-xs">
                    <h4 className="font-black uppercase text-slate-500 mb-2">Teacher Answer Key (Detachable)</h4>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-300 rounded-lg">
                      <div>
                        <span className="font-bold block mb-1">Part I Answers:</span>
                        {words.slice(0, 8).map((w, idx) => (
                          <p key={idx}>{idx + 1}. {w.term}</p>
                        ))}
                      </div>
                      <div>
                        <span className="font-bold block mb-1">Part II Answers:</span>
                        {words.slice(0, 6).map((w, idx) => (
                          <p key={idx}>{idx + 1}. {w.term}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Layout 4: Word Search Puzzle */}
            {layout === 'wordsearch' && wordSearchData && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="inline-grid grid-cols-12 gap-1.5 p-3 border-2 border-slate-800 bg-white shadow-xs font-mono font-black text-sm">
                    {wordSearchData.grid.map((row, r) =>
                      row.map((char, c) => (
                        <div
                          key={`${r}-${c}`}
                          className="w-7 h-7 flex items-center justify-center border border-slate-200 text-slate-800"
                        >
                          {char}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="border-t-2 border-slate-800 pt-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 text-center">
                    Word Bank &bull; Find and circle these vocabulary words:
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs font-black text-slate-800">
                    {wordSearchData.wordList.map(term => (
                      <div key={term} className="p-1.5 border border-slate-300 rounded">
                        [ ] {term}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
