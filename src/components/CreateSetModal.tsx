import React, { useState } from 'react';
import { VocabSet, VocabWord, Folder } from '../types';
import { parseImportedText } from '../utils/storage';
import { ImagePickerModal } from './ImagePickerModal';
import { X, Plus, Trash2, Upload, FileText, Check, AlertCircle, Image as ImageIcon, Clipboard } from 'lucide-react';

interface Props {
  folders: Folder[];
  initialSet?: VocabSet | null;
  onSave: (set: VocabSet) => void;
  onClose: () => void;
}

export const CreateSetModal: React.FC<Props> = ({ folders, initialSet, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [title, setTitle] = useState(initialSet?.title || '');
  const [description, setDescription] = useState(initialSet?.description || '');
  const [folderId, setFolderId] = useState<string>(initialSet?.folderId || '');
  const [level, setLevel] = useState<'A1-A2' | 'B1-B2' | 'C1-C2'>(initialSet?.level as any || 'B1-B2');

  // Active word index and initial tab for image picking
  const [pickingImageForIdx, setPickingImageForIdx] = useState<number | null>(null);
  const [pickingImageTab, setPickingImageTab] = useState<'search' | 'paste' | 'upload' | 'url'>('search');

  // Manual word entries
  const [words, setWords] = useState<Array<Partial<VocabWord>>>(
    initialSet?.words || [
      { id: '1', term: '', definition: '', translation: '', exampleSentence: '', partOfSpeech: 'noun' },
      { id: '2', term: '', definition: '', translation: '', exampleSentence: '', partOfSpeech: 'verb' },
      { id: '3', term: '', definition: '', translation: '', exampleSentence: '', partOfSpeech: 'adjective' },
    ]
  );

  // Bulk import raw text
  const [importText, setImportText] = useState('');
  const [importDelimiter, setImportDelimiter] = useState<'\t' | ',' | '-'>('\t');
  const [importError, setImportError] = useState('');

  const handleAddWordRow = () => {
    setWords(prev => [
      ...prev,
      {
        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        term: '',
        definition: '',
        translation: '',
        exampleSentence: '',
        partOfSpeech: 'noun',
      },
    ]);
  };

  const handleRemoveWordRow = (idx: number) => {
    if (words.length <= 1) return;
    setWords(prev => prev.filter((_, i) => i !== idx));
  };

  const handleWordFieldChange = (idx: number, field: keyof VocabWord, value: string) => {
    setWords(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleParseImport = () => {
    setImportError('');
    if (!importText.trim()) {
      setImportError('Please paste your vocabulary text first.');
      return;
    }

    const parsed = parseImportedText(importText, importDelimiter);
    if (parsed.length === 0) {
      setImportError('No valid word-definition pairs could be parsed. Check your delimiter format.');
      return;
    }

    // Merge into words
    const newWords: Array<Partial<VocabWord>> = parsed.map((p, i) => ({
      id: `w_imp_${Date.now()}_${i}`,
      term: p.term,
      definition: p.definition,
      translation: p.translation || '',
      exampleSentence: '',
      partOfSpeech: 'noun',
    }));

    setWords(newWords);
    setActiveTab('manual');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a set title');
      return;
    }

    // Filter valid words
    const validWords: VocabWord[] = words
      .filter(w => w.term && w.term.trim().length > 0 && w.definition && w.definition.trim().length > 0)
      .map((w, index) => ({
        id: w.id || `w_${Date.now()}_${index}`,
        term: w.term!.trim(),
        definition: w.definition!.trim(),
        translation: w.translation?.trim(),
        exampleSentence: w.exampleSentence?.trim(),
        partOfSpeech: w.partOfSpeech || 'noun',
        phonetic: w.phonetic?.trim(),
        imageUrl: w.imageUrl,
      }));

    if (validWords.length < 2) {
      alert('Please provide at least 2 complete vocabulary words with terms and definitions.');
      return;
    }

    const newOrUpdatedSet: VocabSet = {
      id: initialSet?.id || `set_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      folderId: folderId || undefined,
      createdAt: initialSet?.createdAt || Date.now(),
      updatedAt: Date.now(),
      level,
      words: validWords,
      tags: initialSet?.tags || ['Custom'],
    };

    onSave(newOrUpdatedSet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {initialSet ? 'Edit Vocabulary Set' : 'Create New Study Set'}
            </h2>
            <p className="text-xs text-slate-500">
              Organize terms with definitions, translations, and audio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Manual Input vs Bulk Import */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Manual Card Input ({words.filter(w => w.term && w.definition).length} ready)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import (Quizlet, CSV, TSV)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Metadata inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Set Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. TOEFL Essential Adjectives"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Assign to Folder
              </label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="">No Folder (Root)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short description or learning goal..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                CEFR Level
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="A1-A2">A1-A2 (Beginner / Elementary)</option>
                <option value="B1-B2">B1-B2 (Intermediate)</option>
                <option value="C1-C2">C1-C2 (Advanced / Mastery)</option>
              </select>
            </div>
          </div>

          {/* TAB 1: MANUAL WORD ROWS */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Vocabulary Word Cards</h3>
                <button
                  type="button"
                  onClick={handleAddWordRow}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Card
                </button>
              </div>

              <div className="space-y-3">
                {words.map((word, idx) => (
                    <div
                      key={word.id || idx}
                      onPaste={e => {
                        const items = e.clipboardData?.items;
                        if (items) {
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf('image') !== -1) {
                              const file = items[i].getAsFile();
                              if (file) {
                                e.preventDefault();
                                const reader = new FileReader();
                                reader.onload = ev => {
                                  const res = ev.target?.result as string;
                                  if (res) handleWordFieldChange(idx, 'imageUrl', res);
                                };
                                reader.readAsDataURL(file);
                                return;
                              }
                            }
                          }
                        }
                      }}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs relative group hover:border-indigo-200 transition"
                    >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                      <span>Card #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWordRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Remove Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                      <div>
                        <input
                          type="text"
                          value={word.term || ''}
                          onChange={e => handleWordFieldChange(idx, 'term', e.target.value)}
                          placeholder="Term (e.g., Collaborate)"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={word.definition || ''}
                          onChange={e => handleWordFieldChange(idx, 'definition', e.target.value)}
                          placeholder="English Definition (e.g., To work jointly with others)"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={word.translation || ''}
                          onChange={e => handleWordFieldChange(idx, 'translation', e.target.value)}
                          placeholder="Translation (e.g., Colaborar)"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={word.exampleSentence || ''}
                          onChange={e => handleWordFieldChange(idx, 'exampleSentence', e.target.value)}
                          placeholder="Example sentence..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <select
                          value={word.partOfSpeech || 'noun'}
                          onChange={e => handleWordFieldChange(idx, 'partOfSpeech', e.target.value as any)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="noun">Noun</option>
                          <option value="verb">Verb</option>
                          <option value="adjective">Adjective</option>
                          <option value="adverb">Adverb</option>
                          <option value="phrase">Phrase</option>
                          <option value="idiom">Idiom</option>
                        </select>
                      </div>
                    </div>

                    {/* Visual Image Attachment (Web Search & Upload) */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {word.imageUrl ? (
                          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                            <img
                              src={word.imageUrl}
                              alt="Word visual"
                              className="w-8 h-8 rounded-lg object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setPickingImageForIdx(idx)}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              Change Image
                            </button>
                            <button
                              type="button"
                              onClick={() => handleWordFieldChange(idx, 'imageUrl', '')}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setPickingImageForIdx(idx);
                                setPickingImageTab('search');
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Search Web</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPickingImageForIdx(idx);
                                setPickingImageTab('paste');
                              }}
                              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-semibold text-purple-700 flex items-center gap-1.5 transition"
                              title="Paste image directly from clipboard"
                            >
                              <Clipboard className="w-3.5 h-3.5 text-purple-600" />
                              <span>Paste Image (Ctrl+V)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddWordRow}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Add Another Word Card
              </button>
            </div>
          )}

          {/* TAB 2: BULK IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  Quizlet & Spreadsheet One-Click Import
                </p>
                <p>
                  Paste your vocabulary exported from Quizlet, Anki, Excel, or Google Sheets.
                  Each line should contain: <code>Term [separator] Definition [optional separator Translation]</code>.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                <span>Between term & definition:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="delim"
                    checked={importDelimiter === '\t'}
                    onChange={() => setImportDelimiter('\t')}
                  />
                  Tab (Quizlet / Excel standard)
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="delim"
                    checked={importDelimiter === ','}
                    onChange={() => setImportDelimiter(',')}
                  />
                  Comma (CSV)
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="delim"
                    checked={importDelimiter === '-'}
                    onChange={() => setImportDelimiter('-')}
                  />
                  Hyphen (-)
                </label>
              </div>

              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`abundant\texisting in large quantities; plentiful\tabundante\nresilient\table to withstand or recover quickly\tresiliente\nmeticulous\tshowing great attention to detail\tmeticuloso`}
                rows={10}
                className="w-full p-4 font-mono text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white"
              />

              {importError && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {importError}
                </div>
              )}

              <button
                type="button"
                onClick={handleParseImport}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Parse & Load into Word Cards
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {words.filter(w => w.term && w.definition).length} complete vocabulary words
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              Save Vocabulary Set
            </button>
          </div>
        </div>
      </div>

      {/* Image Search & Upload Modal */}
      {pickingImageForIdx !== null && (
        <ImagePickerModal
          term={words[pickingImageForIdx]?.term || 'Vocabulary'}
          currentImageUrl={words[pickingImageForIdx]?.imageUrl}
          initialTab={pickingImageTab}
          onSelectImage={url => {
            handleWordFieldChange(pickingImageForIdx, 'imageUrl', url);
            setPickingImageForIdx(null);
          }}
          onClose={() => setPickingImageForIdx(null)}
        />
      )}
    </div>
  );
};
