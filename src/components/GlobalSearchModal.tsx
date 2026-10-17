import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckSquare, BookOpen, FileText, Tag, Calendar, ArrowRight } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string, tab?: 'tasks' | 'diary' | 'scheduler') => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle modal
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lower = query.toLowerCase();
    const tasks = StorageService.getTasks();
    const diary = StorageService.getDiaryEntries();
    const files = StorageService.getFileRegistry();

    const results: Array<{
      id: string;
      title: string;
      snippet: string;
      type: 'task' | 'diary' | 'file';
      date: string;
      meta?: string;
    }> = [];

    // Search Tasks
    tasks.forEach(t => {
      if (
        t.title.toLowerCase().includes(lower) ||
        (t.description && t.description.toLowerCase().includes(lower)) ||
        t.tags.some(tag => tag.toLowerCase().includes(lower))
      ) {
        results.push({
          id: t.id,
          title: t.title,
          snippet: t.description || `Priority: ${t.priority.toUpperCase()} | Status: ${t.status}`,
          type: 'task',
          date: t.date,
          meta: t.startTime ? `${t.startTime} - ${t.endTime || ''}` : undefined,
        });
      }
    });

    // Search Diary
    Object.values(diary).forEach(d => {
      if (
        d.content.toLowerCase().includes(lower) ||
        (d.aiSummary && d.aiSummary.toLowerCase().includes(lower)) ||
        d.tags.some(tag => tag.toLowerCase().includes(lower))
      ) {
        const previewIdx = d.content.toLowerCase().indexOf(lower);
        const start = Math.max(0, previewIdx - 40);
        const snippet = d.content.slice(start, start + 120);

        results.push({
          id: d.id,
          title: `Diary Entry (${d.date})`,
          snippet: `"...${snippet}..."`,
          type: 'diary',
          date: d.date,
          meta: d.mood ? `Mood: ${d.mood}` : undefined,
        });
      }
    });

    // Search Deduplicated Files
    Object.values(files).forEach(f => {
      if (f.name.toLowerCase().includes(lower) || f.type.toLowerCase().includes(lower)) {
        results.push({
          id: f.hash,
          title: f.name,
          snippet: `File SHA-256: ${f.hash.slice(0, 10)}... (Used across ${f.datesUsed.length} dates)`,
          type: 'file',
          date: f.datesUsed[0] || f.firstDate,
          meta: `${(f.size / 1024).toFixed(1)} KB`,
        });
      }
    });

    return results;
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all dates, tasks, diary entries, files, tags..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white rounded">
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose} 
            className="px-2 py-1 text-xs bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700 transition"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 divide-y divide-slate-800/60">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
              <p>Type keywords like <span className="text-indigo-400 font-mono">transaction</span>, <span className="text-indigo-400 font-mono">shdip</span>, or file names.</p>
              <p className="text-xs text-slate-600 mt-1">Universal index searches across all historical dates and files instantly.</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <p>No results found matching &quot;{query}&quot;</p>
            </div>
          ) : (
            searchResults.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  onSelectDate(item.date, item.type === 'diary' ? 'diary' : 'tasks');
                  onClose();
                }}
                className="p-3 hover:bg-slate-800/80 rounded-xl cursor-pointer transition flex items-center justify-between group gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    item.type === 'task' 
                      ? 'bg-blue-950/80 text-blue-400 border border-blue-800/50' 
                      : item.type === 'diary' 
                      ? 'bg-purple-950/80 text-purple-400 border border-purple-800/50' 
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                  }`}>
                    {item.type === 'task' && <CheckSquare className="w-4 h-4" />}
                    {item.type === 'diary' && <BookOpen className="w-4 h-4" />}
                    {item.type === 'file' && <FileText className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm truncate">{item.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700/60">
                        {item.date}
                      </span>
                      {item.meta && (
                        <span className="text-[11px] text-slate-500">{item.meta}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.snippet}</p>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition text-indigo-400 flex items-center gap-1 text-xs shrink-0">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
          <span>Found {searchResults.length} matches</span>
          <span>Click any item to jump directly to that date</span>
        </div>

      </div>
    </div>
  );
};
