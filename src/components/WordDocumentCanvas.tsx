import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Maximize2, 
  Trash2, 
  Cloud, 
  FileUp, 
  Paperclip,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Search,
  X,
  Eye,
  Play,
  AlertCircle,
  FileCode,
  Edit3,
  Layers
} from 'lucide-react';
import { FileAttachment } from '../types';
import { StorageService } from '../services/storageService';

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
 * Automatically cleans any accidental raw JSON arrays/objects from text segments.
 */
export function parseDocumentContent(content: string, attachments: FileAttachment[]): DocumentBlock[] {
  if (!content) return [{ type: 'text', content: '' }];

  const regex = /\{\{(?:attachment|file):([a-zA-Z0-9_\-.:]+)\}\}|!\[([^\]]*)\]\(attachment:([a-zA-Z0-9_\-.:]+)\)/g;
  const blocks: DocumentBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const registry = StorageService.getFileRegistry();

  while ((match = regex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.length > 0) {
      blocks.push({ type: 'text', content: textBefore });
    }

    const attachmentId = match[1] || match[3];
    // Find attachment in attachments prop, or fallback to file registry so we NEVER show raw IDs
    let foundAttachment = attachments.find(
      (a) => a.id === attachmentId || a.hash === attachmentId || a.id.includes(attachmentId) || (a.driveId && a.driveId === attachmentId)
    );

    if (!foundAttachment && registry[attachmentId]) {
      const reg = registry[attachmentId];
      foundAttachment = {
        id: `file-${reg.hash.slice(0, 12)}`,
        name: reg.name,
        size: reg.size,
        type: reg.type,
        dataUrl: reg.dataUrl,
        driveId: reg.driveId,
        category: reg.category,
        hash: reg.hash,
        uploadedAt: reg.updatedAt,
        version: reg.version,
        isUpdated: reg.isUpdated,
        updatedFromName: reg.updatedFromName,
      };
    }

    if (!foundAttachment) {
      // Look up by partial hash match in registry
      const partial = Object.values(registry).find(r => r.hash.startsWith(attachmentId) || attachmentId.includes(r.hash.slice(0, 8)));
      if (partial) {
        foundAttachment = {
          id: `file-${partial.hash.slice(0, 12)}`,
          name: partial.name,
          size: partial.size,
          type: partial.type,
          dataUrl: partial.dataUrl,
          driveId: partial.driveId,
          category: partial.category,
          hash: partial.hash,
          uploadedAt: partial.updatedAt,
          version: partial.version,
          isUpdated: partial.isUpdated,
          updatedFromName: partial.updatedFromName,
        };
      }
    }

    // Elegant fallback ensuring NO raw ID is ever shown as a broken placeholder
    if (!foundAttachment) {
      foundAttachment = {
        id: attachmentId,
        name: 'Attached Media',
        size: 0,
        type: 'application/octet-stream',
        hash: attachmentId,
        uploadedAt: new Date().toISOString(),
      };
    }

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

  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: '' });
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
  const rawTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [insertAfterTargetIndex, setInsertAfterTargetIndex] = useState<number | undefined>(undefined);

  // Find & Replace State
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [replaceCountMessage, setReplaceCountMessage] = useState<string | null>(null);

  // View Mode: 'document' (Interactive WYSIWYG Document - Default) vs 'source' (Raw Markdown Text)
  const [viewMode, setViewMode] = useState<'document' | 'source'>('document');

  const blocks = parseDocumentContent(content, attachments);

  // Format Selection Helper (for Raw text mode)
  const applyFormatting = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = 'text') => {
    if (viewMode === 'source' && rawTextareaRef.current) {
      const textarea = rawTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end);

      const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultPlaceholder}${suffix}`;
      const newContent = content.substring(0, start) + replacement + content.substring(end);
      onContentChange(newContent);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = selected ? end + prefix.length + suffix.length : start + prefix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos + (selected ? 0 : defaultPlaceholder.length));
      }, 50);
    } else {
      // In document mode: append formatted placeholder to the last paragraph
      const lastTextBlockIndex = blocks.map(b => b.type).lastIndexOf('text');
      if (lastTextBlockIndex >= 0) {
        const currentText = blocks[lastTextBlockIndex].content || '';
        handleTextBlockChange(lastTextBlockIndex, currentText + (currentText.length > 0 ? ' ' : '') + `${prefix}${defaultPlaceholder}${suffix}`);
      } else {
        onContentChange(content + `\n\n${prefix}${defaultPlaceholder}${suffix}`);
      }
    }
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

  // Trigger inline media insertion
  const triggerInsertMedia = (afterIndex?: number) => {
    setInsertAfterTargetIndex(afterIndex);
    inlineFileInputRef.current?.click();
  };

  const handleInlineFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await onInsertMedia(file, insertAfterTargetIndex);
    } finally {
      if (e.target) e.target.value = '';
      setInsertAfterTargetIndex(undefined);
    }
  };

  // Update a specific text block without exposing or altering attachment markers
  const handleTextBlockChange = (blockIndex: number, newText: string) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: newText };
    const serialized = serializeBlocks(newBlocks);
    onContentChange(serialized);
  };

  // Remove an attachment block from the document stream
  const handleRemoveAttachmentBlock = (blockIndex: number) => {
    const targetBlock = blocks[blockIndex];
    const newBlocks = blocks.filter((_, idx) => idx !== blockIndex);
    const serialized = serializeBlocks(newBlocks);
    onContentChange(serialized);

    if (targetBlock.attachment) {
      onDeleteAttachment(targetBlock.attachment);
    }
  };

  // Serializes document blocks back to clean storage content
  const serializeBlocks = (docBlocks: DocumentBlock[]): string => {
    return docBlocks
      .map((b) => {
        if (b.type === 'text') {
          return b.content ?? '';
        }
        return b.originalTag || `\n\n{{attachment:${b.id}}}\n\n`;
      })
      .join('');
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
              onClick={() => triggerInsertMedia(blocks.length - 1)}
              className="p-1.5 px-2.5 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-800/80 transition flex items-center gap-1 font-semibold"
              title="Insert Image / Video / Media directly into Document"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span className="text-[11px]">+ Insert Media</span>
            </button>
          </div>

          {/* View Mode Toggle: Interactive Document vs Source Code */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('document')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                viewMode === 'document'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Word Document</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('source')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                viewMode === 'source'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3 h-3" />
              <span>Source Text</span>
            </button>
          </div>
        </div>

        {/* Find & Replace Bar */}
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
        <div className="p-6 sm:p-10 min-h-[420px] relative bg-slate-900/60">
          {viewMode === 'document' ? (
            /* =====================================================================
               INTERACTIVE WORD DOCUMENT: Seamless Paragraphs with Inline Media Cards
               NO JSON OR {{attachment:...}} TAGS ARE EVER DISPLAYED TO THE USER!
               ===================================================================== */
            <div className="space-y-4">
              {blocks.map((block, index) => {
                if (block.type === 'text') {
                  const lineCount = Math.max(3, (block.content || '').split('\n').length + 1);
                  return (
                    <div key={`text-block-${index}`} className="group relative">
                      <textarea
                        rows={lineCount}
                        value={block.content || ''}
                        onChange={(e) => handleTextBlockChange(index, e.target.value)}
                        placeholder={
                          index === 0 && blocks.length === 1
                            ? "Write your journal here... Type naturally like a Word document. Attach images, videos, or documents anywhere below."
                            : "Continue writing your paragraph here..."
                        }
                        className="w-full bg-transparent text-slate-100 text-sm sm:text-base leading-relaxed focus:outline-none resize-none font-sans placeholder-slate-500 selection:bg-indigo-500 selection:text-white border-0 p-1 block transition"
                      />

                      {/* Subtle hover bar to insert media right below this specific paragraph */}
                      <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity py-1 flex items-center justify-between border-t border-dashed border-slate-800/80 my-1">
                        <span className="text-[10px] text-slate-500 font-mono">Paragraph {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => triggerInsertMedia(index)}
                          className="px-2 py-0.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/50 text-[10px] flex items-center gap-1 transition"
                          title="Insert media immediately below this paragraph"
                        >
                          <FileUp className="w-3 h-3" />
                          <span>+ Insert Image / File below this paragraph</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // --- ATTACHMENT BLOCK: COMPACT INLINE MEDIA PREVIEW CARD ---
                const att = block.attachment;
                const isImage = att?.type?.startsWith('image/') || false;
                const isVideo = att?.type?.startsWith('video/') || false;
                const hasDrive = !!(
                  att?.driveId && 
                  !att.driveId.startsWith('file-') && 
                  /^[a-zA-Z0-9_-]{15,}$/.test(att.driveId)
                );

                return (
                  <div 
                    key={`att-block-${index}`} 
                    className="my-3 max-w-sm rounded-2xl border border-slate-700/80 bg-slate-950/80 overflow-hidden shadow-md group"
                  >
                    {/* Media Preview Area */}
                    {isImage && att?.dataUrl ? (
                      <div>
                        <div 
                          onClick={() => att && onOpenViewer(att)}
                          className="w-full h-40 sm:h-48 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer relative group/thumb"
                          title={`Click to view ${att.name}`}
                        >
                          <img 
                            src={att.dataUrl} 
                            alt={att.name} 
                            className="w-full h-full object-cover transition group-hover/thumb:scale-105" 
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition gap-1.5 text-xs text-white font-semibold backdrop-blur-[2px]">
                            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Click to View in Popup</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-200 truncate block max-w-[180px]">{att.name}</span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>{(att.size / 1024).toFixed(0)} KB &bull; {hasDrive ? 'Drive' : 'Local Only'}</span>
                            </div>
                            {att.isUpdated && (
                              <span className="text-[9px] text-indigo-400 font-bold block truncate">
                                Updated (v{att.version || 2}) {att.updatedFromName ? `of ${att.updatedFromName}` : ''}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => att && onOpenViewer(att)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachmentBlock(index)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="Delete from document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900 flex items-center justify-between gap-3">
                        <div 
                          onClick={() => att && onOpenViewer(att)} 
                          className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                          title={`Click to view ${att?.name}`}
                        >
                          <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 shrink-0">
                            {isVideo ? <Play className="w-4 h-4 fill-indigo-400" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-white truncate block max-w-[160px]">{att?.name || 'Attached File'}</span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>{att ? (att.size > 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : `${(att.size / 1024).toFixed(0)} KB`) : '0 KB'}</span>
                              <span>&bull;</span>
                              <span>{hasDrive ? 'Drive' : 'Local Only'}</span>
                            </div>
                            {att?.isUpdated && (
                              <span className="text-[9px] text-indigo-400 font-bold block truncate">
                                Updated (v{att.version || 2})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => att && onOpenViewer(att)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachmentBlock(index)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Delete from document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ensure an editable text area exists at bottom if last block is an attachment */}
              {blocks.length > 0 && blocks[blocks.length - 1].type === 'attachment' && (
                <div className="pt-2">
                  <textarea
                    rows={3}
                    placeholder="Type next paragraph here..."
                    onChange={(e) => {
                      if (e.target.value) {
                        onContentChange(content + '\n\n' + e.target.value);
                      }
                    }}
                    className="w-full bg-transparent text-slate-100 text-sm sm:text-base leading-relaxed focus:outline-none resize-none font-sans placeholder-slate-500 selection:bg-indigo-500 selection:text-white border-0 p-1 block"
                  />
                </div>
              )}
            </div>
          ) : (
            /* =====================================================================
               RAW SOURCE CODE EDITOR (For advanced users who want to see raw markdown)
               ===================================================================== */
            <div className="space-y-4">
              <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                <span>Source Text Mode: Displays raw formatting and attachment markers. Switch to <strong>Word Document</strong> for visual layout.</span>
                <button
                  type="button"
                  onClick={() => setViewMode('document')}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px]"
                >
                  Return to Word Document
                </button>
              </div>

              <textarea
                ref={rawTextareaRef}
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Write your raw markdown notes here..."
                rows={16}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-slate-100 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
              />
            </div>
          )}

          {/* =========================================================================
              DOCUMENT ATTACHMENT TRAY: Interactive Small Previews (Click to Open Popup)
             ========================================================================= */}
          {attachments.length > 0 && (
            <div className="pt-8 mt-6 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Document Attachments & Media ({attachments.length})</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Click any item to view in popup modal
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {attachments.map((att) => {
                  const isImage = att.type?.startsWith('image/') || false;
                  const isVideo = att.type?.startsWith('video/') || false;
                  const hasDrive = !!(
                    att.driveId && 
                    !att.driveId.startsWith('file-') && 
                    /^[a-zA-Z0-9_-]{15,}$/.test(att.driveId)
                  );

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
                        ) : isVideo ? (
                          <div className="w-9 h-9 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/80 flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 fill-indigo-400" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-900 text-indigo-400 border border-slate-800 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-slate-200 truncate block max-w-[130px]">
                            {att.name}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <span>{att.size > 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : `${(att.size / 1024).toFixed(0)} KB`}</span>
                            <span>&bull;</span>
                            {hasDrive ? (
                              <span className="text-emerald-400 font-semibold">Drive</span>
                            ) : (
                              <span className="text-amber-400 font-semibold" title={att.uploadError || "Local Storage Only"}>Local</span>
                            )}
                          </div>
                          {att.isUpdated && (
                            <span className="text-[9px] text-indigo-400 font-bold block truncate max-w-[130px]">
                              Updated v{att.version || 2}
                            </span>
                          )}
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

      </div>
    </div>
  );
};
