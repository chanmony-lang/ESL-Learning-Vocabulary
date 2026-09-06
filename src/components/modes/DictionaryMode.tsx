import React, { useState, useMemo } from 'react';
import { VocabWord, VocabSet } from '../../types';
import { speakWord, playSound } from '../../utils/audio';
import { BookOpen, Search, Volume2, Copy, Check, Star, Filter, Mic } from 'lucide-react';

interface Props {
  words: VocabWord[];
  currentSet: VocabSet;
  accent: string;
  onToggleStar?: (wordId: string) => void;
  onPracticePronunciation?: (word: VocabWord) => void;
}

export const DictionaryMode: React.FC<Props> = ({
  words,
  currentSet,
  accent,
  onToggleStar,
  onPracticePronunciation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const matchesSearch =
        word.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (word.translation && word.translation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPos = selectedPos === 'all' || word.partOfSpeech === selectedPos;
      return matchesSearch && matchesPos;
    });
  }, [words, searchQuery, selectedPos]);

  const handleCopy = (word: VocabWord) => {
    const text = `${word.term} ${word.phonetic || ''} - ${word.definition}\nExample: ${word.exampleSentence || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(word.id);
    playSound('click');
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            ESL Dictionary Reference
          </h2>
          <p className="text-xs text-slate-500">
            Searchable lexicon for <strong className="text-slate-700">{currentSet.title}</strong> ({words.length} terms)
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search words, definitions, translations..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'noun', 'verb', 'adjective', 'adverb', 'idiom'].map(pos => (
            <button
              key={pos}
              onClick={() => setSelectedPos(pos)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                selectedPos === pos
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Words List Cards */}
      {filteredWords.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No vocabulary matching &ldquo;{searchQuery}&rdquo; found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWords.map(word => (
            <div
              key={word.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{word.term}</h3>
                    {word.partOfSpeech && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {word.partOfSpeech}
                      </span>
                    )}
                  </div>
                  {word.phonetic && (
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{word.phonetic}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => speakWord(word.term, accent)}
                    className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                    title="Hear native pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  {onPracticePronunciation && (
                    <button
                      onClick={() => onPracticePronunciation(word)}
                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                      title="Record & Compare Pronunciation"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(word)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Copy definition"
                  >
                    {copiedId === word.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {onToggleStar && (
                    <button
                      onClick={() => onToggleStar(word.id)}
                      className="p-2 rounded-lg text-slate-300 hover:text-amber-500 transition"
                    >
                      <Star className={`w-4 h-4 ${word.starred ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {word.imageUrl && (
                <div className="h-28 w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img
                    src={word.imageUrl}
                    alt={word.term}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {word.definition}
              </p>

              {word.exampleSentence && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                  &ldquo;{word.exampleSentence}&rdquo;
                </div>
              )}

              {word.synonyms && word.synonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-slate-400 font-medium">Synonyms:</span>
                  {word.synonyms.map(syn => (
                    <span key={syn} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {syn}
                    </span>
                  ))}
                </div>
              )}

              {word.translation && (
                <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-600">Translations: </span>
                  {word.translation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
