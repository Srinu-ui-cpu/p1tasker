import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  ExternalLink, 
  Maximize2, 
  Trash2, 
  Plus, 
  Cloud, 
  Edit3, 
  Check, 
  Download,
  FileUp,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { FileAttachment } from '../types';
import { GoogleAuthService } from '../services/googleAuthService';

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
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editBlockText, setEditBlockText] = useState('');
  const [insertTargetIndex, setInsertTargetIndex] = useState<number | null>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

  const blocks = parseDocumentContent(content, attachments);

  // Attachments not yet embedded inline into the text
  const referencedAttachmentIds = new Set(
    blocks.filter((b) => b.type === 'attachment' && b.id).map((b) => b.id)
  );
  const unplacedAttachments = attachments.filter(
    (a) => !referencedAttachmentIds.has(a.id) && !referencedAttachmentIds.has(a.hash)
  );

  const handleStartEditBlock = (index: number, currentText: string) => {
    setEditingBlockIndex(index);
    setEditBlockText(currentText);
  };

  const handleSaveBlockEdit = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], content: editBlockText };

    // Reconstruct full content
    const updatedContent = newBlocks
      .map((b) => {
        if (b.type === 'text') return b.content || '';
        return b.originalTag || `{{attachment:${b.id}}}`;
      })
      .join('');

    onContentChange(updatedContent);
    setEditingBlockIndex(null);
  };

  const handleRemoveAttachmentFromText = (attachmentId?: string) => {
    if (!attachmentId) return;
    const tag1 = `{{attachment:${attachmentId}}}`;
    const tag2 = `{{file:${attachmentId}}}`;
    const cleaned = content
      .split(tag1).join('')
      .split(tag2).join('')
      .replace(/\n{3,}/g, '\n\n');
    onContentChange(cleaned);
  };

  const handleInsertUnplacedAttachment = (attachment: FileAttachment) => {
    const marker = `\n\n{{attachment:${attachment.id}}}\n\n`;
    onContentChange(`${content.trimEnd()}${marker}`);
  };

  const handleInlineFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await onInsertMedia(file, insertTargetIndex !== null ? insertTargetIndex : undefined);
    } finally {
      if (e.target) e.target.value = '';
      setInsertTargetIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={inlineFileInputRef}
        type="file"
        className="hidden"
        onChange={handleInlineFileSelected}
      />

      {/* Word Document Canvas Page */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 max-w-4xl mx-auto relative overflow-hidden">
        
        {/* Document Header Ribbon */}
        <div className="pb-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 flex items-center justify-center font-bold text-xs shadow-sm">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Word Document Flow
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Standard Sheet
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Write a paragraph, embed an image or file, and continue writing paragraphs below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inlineFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm"
              title="Insert Image or Document file inline at end of document"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>+ Insert Media / File</span>
            </button>
          </div>
        </div>

        {/* Document Body Flow */}
        <div className="space-y-5 min-h-[220px]">
          {blocks.length === 0 ? (
            <div className="py-2">
              <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Start typing your daily reflections, meetings, or thoughts here... (Tip: Click '+ Attach File' above to insert images and documents inline)"
                rows={12}
                className="w-full bg-transparent text-slate-100 text-sm sm:text-base leading-relaxed focus:outline-none resize-y font-sans placeholder-slate-500"
                autoFocus
              />
            </div>
          ) : (
            blocks.map((block, index) => {
              if (block.type === 'text') {
                const isEditing = editingBlockIndex === index;
                return (
                  <div key={`text-${index}`} className="group relative rounded-xl transition">
                    {isEditing ? (
                      <div className="space-y-2 p-3 bg-slate-950/80 rounded-2xl border border-indigo-700 shadow-inner">
                        <textarea
                          value={editBlockText}
                          onChange={(e) => setEditBlockText(e.target.value)}
                          rows={Math.max(3, editBlockText.split('\n').length + 1)}
                          className="w-full bg-transparent text-slate-100 text-sm leading-relaxed focus:outline-none resize-y font-sans"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBlockIndex(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveBlockEdit(index)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Paragraph</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleStartEditBlock(index, block.content || '')}
                        className="cursor-text p-2 -m-2 rounded-xl hover:bg-slate-800/40 transition relative"
                        title="Click to edit this paragraph"
                      >
                        <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
                          {block.content}
                        </p>
                        <span className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-[10px] font-semibold text-indigo-400 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1 transition pointer-events-none">
                          <Edit3 className="w-3 h-3" /> Click to edit
                        </span>
                      </div>
                    )}

                    {/* Subtle divider between blocks with Quick Insert */}
                    <div className="pt-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          setInsertTargetIndex(index);
                          inlineFileInputRef.current?.click();
                        }}
                        className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 bg-slate-950/90 border border-slate-700/80 hover:border-indigo-600 px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3 h-3 text-indigo-400" />
                        <span>Insert Image / File below this paragraph</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Attachment block
              const att = block.attachment;
              const isImage = att?.type.startsWith('image/');

              return (
                <div 
                  key={`att-${block.id}-${index}`} 
                  className="my-3 max-w-sm rounded-2xl border border-slate-700/80 bg-slate-950/80 shadow-md overflow-hidden group hover:border-indigo-500/80 transition"
                >
                  {att ? (
                    isImage && att.dataUrl ? (
                      /* Compact Inline Image Presentation */
                      <div className="relative">
                        <div 
                          onClick={() => onOpenViewer(att)}
                          className="w-full h-40 sm:h-48 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer relative group/img transition"
                          title="Click to view/read in popup modal"
                        >
                          <img 
                            src={att.dataUrl} 
                            alt={att.name} 
                            className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105" 
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition gap-1.5 text-xs text-white font-semibold backdrop-blur-[2px]">
                            <Maximize2 className="w-4 h-4 text-indigo-400" />
                            <span>Click to View in Popup</span>
                          </div>
                        </div>

                        {/* Compact Image Caption & Actions */}
                        <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
                          <div 
                            onClick={() => onOpenViewer(att)}
                            className="flex items-center gap-1.5 cursor-pointer min-w-0"
                            title={att.name}
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-200 truncate max-w-[150px]">
                              {att.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(att.size / 1024).toFixed(0)}KB)
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenViewer(att)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm"
                              title="Click to open popup preview & View in Google Drive"
                            >
                              <span>View</span>
                              <Maximize2 className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteAttachment(att)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                              title="Permanently delete this file from diary and Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Inline File / Document Presentation */
                      <div className="p-3 bg-slate-900 flex items-center justify-between gap-2.5">
                        <div 
                          onClick={() => onOpenViewer(att)}
                          className="flex items-center gap-2 cursor-pointer min-w-0"
                          title="Click to view file in popup modal"
                        >
                          <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white truncate block max-w-[170px]" title={att.name}>
                              {att.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>{(att.size / 1024).toFixed(0)}KB</span>
                              <span>&bull;</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                <Cloud className="w-2.5 h-2.5" /> Drive
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenViewer(att)}
                            className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition"
                            title="Click to view/read in popup modal"
                          >
                            <span>Read</span>
                            <Maximize2 className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteAttachment(att)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                            title="Permanently delete this file from diary and Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    /* Missing / Unresolved attachment */
                    <div className="p-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-slate-500">
                        Attachment reference [#{block.id}]
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachmentFromText(block.id)}
                        className="text-rose-400 hover:underline text-[11px]"
                      >
                        Remove reference
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Direct Continuation Typing Area */}
          {blocks.length > 0 && (
            <div className="pt-4 border-t border-slate-800/60 mt-4">
              <textarea
                placeholder="Continue writing below... (Press Enter to append paragraph)"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    const target = e.target as HTMLTextAreaElement;
                    if (target.value.trim()) {
                      e.preventDefault();
                      const separator = content.trim() ? '\n\n' : '';
                      onContentChange(`${content}${separator}${target.value.trim()}`);
                      target.value = '';
                    }
                  }
                }}
                className="w-full bg-slate-950/60 hover:bg-slate-950 focus:bg-slate-950 rounded-2xl p-3 border border-slate-800 focus:border-indigo-600 text-slate-100 text-sm leading-relaxed focus:outline-none resize-y font-sans placeholder-slate-500 transition shadow-inner"
              />
              <span className="text-[10px] text-slate-500 mt-1 block px-1">
                Tip: Press Enter to append paragraph, or Shift+Enter for new line.
              </span>
            </div>
          )}
        </div>

        {/* Unplaced Attachments Tray */}
        {unplacedAttachments.length > 0 && (
          <div className="mt-8 pt-5 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                <span>Media Attached to this Date (Not yet placed inline)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Click "+ Place in Document" to embed between paragraphs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {unplacedAttachments.map((file) => (
                <div
                  key={file.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 transition"
                >
                  <div
                    onClick={() => onOpenViewer(file)}
                    className="flex items-center gap-2 cursor-pointer min-w-0"
                    title="Click to preview file and open in Drive"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs text-slate-200 font-medium truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleInsertUnplacedAttachment(file)}
                      className="px-2 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 text-[10px] font-bold transition flex items-center gap-1"
                      title="Insert this media into the document flow"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Place</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenViewer(file)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      title="View in Drive popup"
                    >
                      <Cloud className="w-3 h-3 text-indigo-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
