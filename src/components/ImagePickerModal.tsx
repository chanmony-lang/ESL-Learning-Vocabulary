import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Upload,
  X,
  Image as ImageIcon,
  Check,
  Link2,
  Sparkles,
  Clipboard,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  term: string;
  currentImageUrl?: string;
  initialTab?: 'search' | 'paste' | 'upload' | 'url';
  onSelectImage: (imageUrl: string) => void;
  onClose: () => void;
}

interface ImageResult {
  url: string;
  title: string;
}

// Curated high quality educational fallback photos
const SAMPLE_PRESETS: { [query: string]: ImageResult[] } = {
  collaborate: [
    { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80', title: 'Team working together' },
    { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80', title: 'Brainstorming discussion' },
    { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&auto=format&fit=crop&q=80', title: 'Collaborative meeting' },
  ],
  resilient: [
    { url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80', title: 'Sprout growing strong' },
    { url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', title: 'Determined climber' },
    { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80', title: 'Rugged mountain peak' },
  ],
  meticulous: [
    { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80', title: 'Careful detail work' },
    { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80', title: 'Precise writing' },
  ],
  abundant: [
    { url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80', title: 'Abundant fresh harvest' },
    { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80', title: 'Lush green landscape' },
  ],
  innovate: [
    { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', title: 'Futuristic ideas' },
    { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80', title: 'Creative technology' },
  ],
  negotiate: [
    { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80', title: 'Business agreement' },
    { url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80', title: 'Discussion and handshake' },
  ],
  strategy: [
    { url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&auto=format&fit=crop&q=80', title: 'Chess strategy piece' },
    { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop&q=80', title: 'Strategic planning board' },
  ],
};

const DEFAULT_FALLBACKS: ImageResult[] = [
  { url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80', title: 'Open book & notes' },
  { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', title: 'Library study books' },
  { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80', title: 'Digital education' },
  { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80', title: 'Writing & learning' },
];

export const ImagePickerModal: React.FC<Props> = ({
  term,
  currentImageUrl,
  initialTab = 'search',
  onSelectImage,
  onClose,
}) => {
  const [tab, setTab] = useState<'search' | 'paste' | 'upload' | 'url'>(initialTab);
  const [searchQuery, setSearchQuery] = useState(term);
  const [customUrl, setCustomUrl] = useState(currentImageUrl || '');
  const [dragActive, setDragActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ImageResult[]>([]);

  // Pasted image state
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [pastedSourceNote, setPastedSourceNote] = useState<string | null>(null);
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  const pasteAreaRef = useRef<HTMLDivElement>(null);

  // Perform live online image search
  const performSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);

    const cleanLower = q.toLowerCase();
    const results: ImageResult[] = [];
    const seenUrls = new Set<string>();

    // 1. Check presets first
    if (SAMPLE_PRESETS[cleanLower]) {
      SAMPLE_PRESETS[cleanLower].forEach(item => {
        results.push(item);
        seenUrls.add(item.url);
      });
    }

    try {
      // 2. Query Wikimedia Commons API for authentic, royalty-free educational photos
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        q
      )}&gsrnamespace=6&gsrlimit=14&prop=imageinfo&iiprop=url|mime&iiurlwidth=600&format=json&origin=*`;

      const res = await fetch(commonsUrl);
      if (res.ok) {
        const data = await res.json();
        if (data?.query?.pages) {
          const pages = Object.values(data.query.pages) as any[];
          pages.sort((a, b) => (a.index || 999) - (b.index || 999));

          for (const page of pages) {
            const info = page.imageinfo?.[0];
            if (info && info.mime && info.mime.startsWith('image/')) {
              const imgUrl = info.thumburl || info.url;
              if (
                imgUrl &&
                !seenUrls.has(imgUrl) &&
                !imgUrl.endsWith('.tiff') &&
                !imgUrl.endsWith('.tif') &&
                !imgUrl.endsWith('.pdf')
              ) {
                seenUrls.add(imgUrl);
                const title = (page.title || '')
                  .replace(/^File:/i, '')
                  .replace(/\.[a-zA-Z0-9]+$/, '')
                  .replace(/_/g, ' ')
                  .slice(0, 40);
                results.push({ url: imgUrl, title: title || q });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Wikimedia commons search failed:', err);
    }

    // 3. If needed, query Wikipedia pageimages API as supplemental source
    if (results.length < 4) {
      try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          q
        )}&gsrlimit=8&prop=pageimages&pithumbsize=600&format=json&origin=*`;
        const res = await fetch(wikiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data?.query?.pages) {
            const pages = Object.values(data.query.pages) as any[];
            for (const page of pages) {
              const thumb = page.thumbnail?.source;
              if (thumb && !seenUrls.has(thumb)) {
                seenUrls.add(thumb);
                results.push({ url: thumb, title: page.title || q });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Wikipedia pageimages search failed:', err);
      }
    }

    // 4. Fallback if no images were found
    if (results.length === 0) {
      setSearchError(`No online images found for "${q}". Try another term, or paste an image directly!`);
      setSearchResults(DEFAULT_FALLBACKS);
    } else {
      setSearchResults(results);
    }

    setIsSearching(false);
  }, []);

  // Initial search on mount
  useEffect(() => {
    if (term) {
      performSearch(term);
    } else {
      setSearchResults(DEFAULT_FALLBACKS);
    }
  }, [term, performSearch]);

  // Search submission handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  };

  // Helper to process clipboard image blob
  const processImageBlob = (blob: Blob, sourceLabel = 'Clipboard Image') => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setPastedImage(dataUrl);
        setPastedSourceNote(sourceLabel);
        setPasteFeedback('Image successfully pasted! Click "Use This Image" to apply.');
        setTab('paste');
      }
    };
    reader.readAsDataURL(blob);
  };

  // Global window paste handler while modal is open
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept paste in the search input or direct URL input if it's plain text
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInput = targetTag === 'INPUT' || targetTag === 'TEXTAREA';

      const items = e.clipboardData?.items;
      if (items) {
        // Look for image items first
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              processImageBlob(file, 'Clipboard Image');
              return;
            }
          }
        }
      }

      // If user is inside the paste tab or paste container, and pasted an image URL string
      const text = e.clipboardData?.getData('text')?.trim();
      if (text && (tab === 'paste' || !isInput)) {
        if (
          text.startsWith('data:image/') ||
          /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(text) ||
          text.startsWith('https://images.unsplash.com') ||
          text.startsWith('https://upload.wikimedia.org')
        ) {
          e.preventDefault();
          setPastedImage(text);
          setPastedSourceNote('Image URL from Clipboard');
          setPasteFeedback('Image URL recognized from clipboard!');
          setTab('paste');
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [tab]);

  // Click-to-paste from navigator clipboard API
  const handleReadClipboard = async () => {
    setPasteFeedback(null);
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            processImageBlob(blob, 'System Clipboard');
            return;
          }
        }
      }

      // If no image blob found, try reading text to see if it's an image URL
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = (await navigator.clipboard.readText()).trim();
        if (
          text.startsWith('data:image/') ||
          /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(text) ||
          text.startsWith('http://') ||
          text.startsWith('https://')
        ) {
          setPastedImage(text);
          setPastedSourceNote('Image URL from Clipboard');
          setPasteFeedback('Pasted image link from clipboard!');
          return;
        }
      }

      setPasteFeedback('No image found in clipboard. Copy an image or screenshot first, then press Ctrl+V!');
    } catch (err: any) {
      setPasteFeedback('Browser permission prompt blocked. Please press Ctrl+V (or ⌘+V) directly to paste!');
    }
  };

  // File upload handler
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, SVG, GIF)');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (result) {
        onSelectImage(result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Visual Image for &ldquo;{term}&rdquo;
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  Memory Anchor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Search the web, paste with <kbd className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold">Ctrl+V</kbd>, or upload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('search')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === 'search'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Web Search</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('paste')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap relative ${
              tab === 'paste'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5 text-purple-600" />
            <span>Paste Image</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded font-mono font-bold">
              Ctrl+V
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('url')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === 'url'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Direct URL</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: WEB SEARCH */}
          {tab === 'search' && (
            <div className="space-y-4">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search keywords (e.g. apple, mountain, collaborate)..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </form>

              {searchError && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{searchError}</p>
                    <button
                      type="button"
                      onClick={() => setTab('paste')}
                      className="mt-1 font-bold text-indigo-700 underline text-xs"
                    >
                      Or click here to paste an image instead →
                    </button>
                  </div>
                </div>
              )}

              {/* Quick suggestion chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400">Suggestions:</span>
                {[term, 'nature', 'study', 'meeting', 'books']
                  .filter((item, i, arr) => item && arr.indexOf(item) === i)
                  .slice(0, 5)
                  .map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setSearchQuery(chip);
                        performSearch(chip);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[11px] font-medium border border-slate-200 transition"
                    >
                      {chip}
                    </button>
                  ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isSearching ? 'Finding matching images...' : `Image Results (${searchResults.length}):`}
                  </p>
                  <span className="text-[11px] text-slate-400">Click any image to select</span>
                </div>

                {isSearching ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-6">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <div
                        key={n}
                        className="aspect-video bg-slate-100 rounded-2xl border border-slate-200 animate-pulse flex items-center justify-center text-slate-300"
                      >
                        <ImageIcon className="w-6 h-6 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                    {searchResults.map((item, idx) => (
                      <button
                        key={`${item.url}-${idx}`}
                        type="button"
                        onClick={() => {
                          onSelectImage(item.url);
                          onClose();
                        }}
                        className="group relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-indigo-600 aspect-video shadow-xs transition-all hover:scale-[1.02] cursor-pointer bg-slate-100 text-left"
                      >
                        <img
                          src={item.url}
                          alt={item.title || `Result ${idx}`}
                          className="w-full h-full object-cover group-hover:brightness-95 transition"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-indigo-950/30 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition p-2 text-center">
                          <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Select
                          </span>
                          {item.title && (
                            <span className="text-[10px] text-white font-medium line-clamp-1 mt-1 drop-shadow">
                              {item.title}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PASTE IMAGE (NEW REQUESTED FEATURE) */}
          {tab === 'paste' && (
            <div className="space-y-4">
              {/* Interactive Paste Zone */}
              <div
                ref={pasteAreaRef}
                tabIndex={0}
                className="border-2 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 rounded-3xl p-6 text-center transition flex flex-col items-center justify-center min-h-[220px] focus:outline-none focus:ring-4 focus:ring-purple-200"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 shadow-xs">
                  <Clipboard className="w-7 h-7" />
                </div>

                <h3 className="text-sm font-black text-slate-900 mb-1">
                  Paste Any Image from Your Clipboard
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
                  Take a screenshot, copy an image from Google or any website, then simply press{' '}
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-purple-800 shadow-2xs">
                    Ctrl + V
                  </kbd>{' '}
                  (or{' '}
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-purple-800 shadow-2xs">
                    ⌘ + V
                  </kbd>{' '}
                  on Mac).
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleReadClipboard}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste from Clipboard</span>
                  </button>
                </div>
              </div>

              {pasteFeedback && (
                <div className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>{pasteFeedback}</span>
                </div>
              )}

              {/* Pasted Image Preview */}
              {pastedImage && (
                <div className="p-4 bg-emerald-50/70 border-2 border-emerald-300 rounded-3xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{pastedSourceNote || 'Image Ready to Use'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPastedImage(null);
                        setPasteFeedback(null);
                      }}
                      className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-emerald-200 aspect-video max-h-52 bg-white flex items-center justify-center shadow-xs">
                    <img
                      src={pastedImage}
                      alt="Pasted Preview"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectImage(pastedImage);
                      onClose();
                    }}
                    className="w-full py-3 bg-[#58cc02] hover:bg-[#61e002] border-b-4 border-[#46a302] text-white font-black rounded-2xl text-xs shadow-sm transition active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Use This Pasted Image for &ldquo;{term}&rdquo;</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FILE UPLOAD */}
          {tab === 'upload' && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition flex flex-col items-center justify-center min-h-[220px] ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50/60'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                Drag and drop your image file here
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Supports PNG, JPG, WebP, SVG, or GIF (up to 5MB)
              </p>

              <label className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow cursor-pointer transition">
                Browse Image Files
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 4: DIRECT URL */}
          {tab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Paste Direct Image URL
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              {customUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video max-h-48 bg-slate-100 flex items-center justify-center">
                  <img
                    src={customUrl}
                    alt="URL preview"
                    className="w-full h-full object-cover"
                    onError={() => alert('Image URL could not be loaded. Please verify the URL.')}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (customUrl.trim()) {
                    onSelectImage(customUrl.trim());
                    onClose();
                  }
                }}
                disabled={!customUrl.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
              >
                Apply Image URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
