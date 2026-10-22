import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Maximize2, 
  Trash2, 
  Plus, 
  Cloud, 
  Check, 
  FileUp, 
  Sparkles, 
  Paperclip,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Search,
  Replace,
  X,
  Eye,
  Eraser
} from 'lucide-react';
import { FileAttachment } from '../types';

export interface DocumentBlock {
  type: 'text' | 'attachment';
  id?: string;
  content?: string;
  attachment?: FileAttachment;
  originalTag?: string;
}

interface WordDocumentCanvasProps {
  content: string;
  attachments: FileAttachment[];
  onContentChange: (newContent: string) => void;
  onOpenViewer: (attachment: FileAttachment) => void;
  onDeleteAttachment: (attachment: FileAttachment) => void;
  onInsertMedia: (file: File, insertAfterIndex?: number) => Promise<void>;
  date: string;
}

/**
 * Parses markdown/document text into sequential paragraphs and inline attachment blocks.
 * Matches {{attachment:<id>}}, {{file:<id>}}, and markdown image syntax ![caption](attachment:<id>)
 */
export function parseDocumentContent(content: string, attachments: FileAttachment[]): DocumentBlock[] {
  if (!content) return [];

  const regex = /\{\{(?:attachment|file):([a-zA-Z0-9_\-.:]+)\}\}|!\[([^\]]*)\]\(attachment:([a-zA-Z0-9_\-.:]+)\)/g;
  const blocks: DocumentBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.length > 0) {
      blocks.push({ type: 'text', content: textBefore });
    }

    const attachmentId = match[1] || match[3];
    const foundAttachment = attachments.find(
      (a) => a.id === attachmentId || a.hash === attachmentId || a.id.includes(attachmentId)
    );

    blocks.push({
      type: 'attachment',
      id: attachmentId,
      attachment: foundAttachment,
      originalTag: match[0],
    });

    lastIndex = regex.lastIndex;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText.length > 0) {
    blocks.push({ type: 'text', content: remainingText });
  }

  return blocks;
}

export const WordDocumentCanvas: React.FC<WordDocumentCanvasProps> = ({
  content,
  attachments,
  onContentChange,
  onOpenViewer,
  onDeleteAttachment,
  onInsertMedia,
  date,
}) => {
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Find & Replace State (Word Document Feature from TraceYourself)
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [replaceCountMessage, setReplaceCountMessage] = useState<string | null>(null);

  // View Mode: 'editor' (Fluid Word Document Writing) or 'preview' (WYSIWYG Formatted Print View)
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  const blocks = parseDocumentContent(content, attachments);

  // Format Selection Helper (Applies formatting around selection or at cursor)
  const applyFormatting = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultPlaceholder}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onContentChange(newContent);

    // Re-focus and set cursor inside formatted region
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selected ? end + prefix.length + suffix.length : start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos + (selected ? 0 : defaultPlaceholder.length));
    }, 50);
  };

  // Find & Replace Action
  const handleReplaceAll = () => {
    if (!findText) return;
    const occurrences = content.split(findText).length - 1;
    if (occurrences === 0) {
      setReplaceCountMessage('No matches found.');
      setTimeout(() => setReplaceCountMessage(null), 3000);
      return;
    }
    const newContent = content.split(findText).join(replaceText);
    onContentChange(newContent);
    setReplaceCountMessage(`Replaced ${occurrences} match${occurrences === 1 ? '' : 'es'}.`);
    setTimeout(() => setReplaceCountMessage(null), 3000);
  };

  // Inline media selected
  const handleInlineFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await onInsertMedia(file);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveAttachmentFromText = (attachmentId?: string) => {
    if (!attachmentId) return;
    const tag1 = `{{attachment:${attachmentId}}}`;
    const tag2 = `{{file:${attachmentId}}}`;
    const cleaned = content
      .split(tag1).join('')
      .split(tag2).join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    onContentChange(cleaned);
  };

  return (
    <div className="space-y-4">
      <input
        ref={inlineFileInputRef}
        type="file"
        className="hidden"
        onChange={handleInlineFileSelected}
      />

      {/* =========================================================================
          WORD DOCUMENT PAPER CANVAS (.editor-paper inspired by TraceYourself)
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden max-w-4xl mx-auto transition-all">
        
        {/* Document Canvas Ribbon Toolbar */}
        <div className="p-3 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          
          {/* Text Styling Tools */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => applyFormatting('**', '**', 'bold text')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition font-bold"
              title="Bold Text (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('*', '*', 'italic text')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition italic"
              title="Italicize Text (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('<u>', '</u>', 'underlined text')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition underline"
              title="Underline Text (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            
            <div className="w-[1px] h-4 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => applyFormatting('\n- ', '', 'List item')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Bulleted List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('\n1. ', '', 'Numbered item')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => setShowFindReplace(!showFindReplace)}
              className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                showFindReplace 
                  ? 'bg-indigo-600 text-white font-bold' 
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Find and Replace in Document"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Replace</span>
            </button>

            <button
              type="button"
              onClick={() => inlineFileInputRef.current?.click()}
              className="p-1.5 px-2.5 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-800/80 transition flex items-center gap-1 font-semibold"
              title="Insert Image / Media inline into Document"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span className="text-[11px]">+ Insert Media</span>
            </button>
          </div>

          {/* View Mode Toggle: Document Editor vs WYSIWYG Print Preview */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                viewMode === 'editor'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Document Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                viewMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Find & Replace Bar (Expandable, from TraceYourself) */}
        {showFindReplace && (
          <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Find text..."
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleReplaceAll}
                disabled={!findText}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-40 transition shrink-0"
              >
                Replace All
              </button>
            </div>

            <div className="flex items-center gap-2">
              {replaceCountMessage && (
                <span className="text-xs text-indigo-300 font-medium">{replaceCountMessage}</span>
              )}
              <button
                type="button"
                onClick={() => setShowFindReplace(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MAIN DOCUMENT CANVAS (WORD DOCUMENT SHEET)
           ========================================================================= */}
        <div className="p-6 sm:p-10 min-h-[420px] relative">
          {viewMode === 'editor' ? (
            /* Fluid Continuous Word Document Editor */
            <div className="space-y-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Write your thoughts here... Type naturally like a Word document. Use + Attach File above or + Insert Media to embed photos, videos, and documents anywhere."
                rows={16}
                className="w-full bg-transparent text-slate-100 text-sm sm:text-base leading-relaxed focus:outline-none resize-y font-sans placeholder-slate-500 selection:bg-indigo-500 selection:text-white"
                autoFocus
              />

              {/* Inline Media Tray: Display compact chips of attachments referenced in document */}
              {attachments.length > 0 && (
                <div className="pt-6 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Embedded Media & Attachments ({attachments.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Click any item to view in popup lightbox
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {attachments.map((att) => {
                      const isImage = att.type.startsWith('image/');
                      const isVideo = att.type.startsWith('video/');

                      return (
                        <div
                          key={att.id}
                          className="p-2.5 bg-slate-950/70 border border-slate-800 hover:border-indigo-600/80 rounded-2xl flex items-center justify-between gap-2 transition group"
                        >
                          <div
                            onClick={() => onOpenViewer(att)}
                            className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                            title={`Click to view ${att.name}`}
                          >
                            {isImage && att.dataUrl ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-800"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/80 flex items-center justify-center shrink-0">
                                {isImage ? <ImageIcon className="w-4 h-4" /> : isVideo ? <Maximize2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                            )}

                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-slate-200 truncate block max-w-[140px]">
                                {att.name}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <span>{(att.size / 1024).toFixed(0)} KB</span>
                                <span>&bull;</span>
                                <span className="text-emerald-400 font-semibold">Drive</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenViewer(att)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition shadow-sm"
                              title="Click to view/read in popup modal"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteAttachment(att)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="Delete from diary and Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* WYSIWYG Formatted Print/Reading View */
            <div className="space-y-4">
              {blocks.length === 0 ? (
                <p className="text-slate-500 italic text-sm">Document is empty.</p>
              ) : (
                blocks.map((block, index) => {
                  if (block.type === 'text') {
                    return (
                      <p key={`block-${index}`} className="text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                        {block.content}
                      </p>
                    );
                  }

                  const att = block.attachment;
                  const isImage = att?.type.startsWith('image/');

                  return (
                    <div key={`block-${index}`} className="my-4 max-w-sm rounded-2xl border border-slate-700/80 bg-slate-950/80 overflow-hidden shadow-md">
                      {att ? (
                        isImage && att.dataUrl ? (
                          <div>
                            <div 
                              onClick={() => onOpenViewer(att)}
                              className="w-full h-40 sm:h-48 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer group relative"
                            >
                              <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-1.5 text-xs text-white font-semibold">
                                <Maximize2 className="w-4 h-4 text-indigo-400" />
                                <span>Click to View in Popup</span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-200 truncate max-w-[200px]">{att.name}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenViewer(att)}
                                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteAttachment(att)}
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-900 flex items-center justify-between gap-3">
                            <div onClick={() => onOpenViewer(att)} className="flex items-center gap-2 cursor-pointer min-w-0">
                              <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-white truncate block max-w-[180px]">{att.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{(att.size / 1024).toFixed(0)} KB &bull; Google Drive</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenViewer(att)}
                                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                              >
                                Read
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteAttachment(att)}
                                className="p-1 text-slate-400 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="p-2.5 bg-slate-950 text-xs text-slate-500 flex items-center justify-between">
                          <span>Attachment [#{block.id}]</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachmentFromText(block.id)}
                            className="text-rose-400 hover:underline text-[11px]"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
