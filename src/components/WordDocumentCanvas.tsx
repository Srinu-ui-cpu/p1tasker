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
  onInsertMedia: (file: File) => Promise<void>;
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
      await onInsertMedia(file);
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
            <div className="py-12 text-center space-y-3 border-2 border-dashed border-slate-800 rounded-2xl p-6">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-300">Your journal document is empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Type your first paragraph, insert photos or files from Google Drive, and build a rich multi-paragraph document!
                </p>
              </div>
              <button
                type="button"
                onClick={() => inlineFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Attachment</span>
              </button>
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
                  className="my-3 rounded-2xl border border-slate-700/80 bg-slate-950/70 shadow-lg overflow-hidden group hover:border-indigo-600/70 transition"
                >
                  {att ? (
                    isImage && att.dataUrl ? (
                      /* Inline Image Presentation */
                      <div className="relative">
                        <div 
                          onClick={() => onOpenViewer(att)}
                          className="w-full max-h-96 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer group-hover:brightness-105 transition"
                          title="Click to view in popup with Google Drive sync"
                        >
                          <img 
                            src={att.dataUrl} 
                            alt={att.name} 
                            className="max-h-96 w-auto max-w-full object-contain rounded-t-xl"
                          />
                        </div>

                        {/* Image Footer Info & Drive Action Bar */}
                        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                          <div 
                            onClick={() => onOpenViewer(att)}
                            className="flex items-center gap-2 cursor-pointer min-w-0"
                          >
                            <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="text-xs font-semibold text-white truncate max-w-xs" title={att.name}>
                              {att.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(att.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenViewer(att)}
                              className="px-3 py-1 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                              title="Open image preview and View in Google Drive"
                            >
                              <Cloud className="w-3.5 h-3.5" />
                              <span>View in Drive</span>
                              <Maximize2 className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveAttachmentFromText(block.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              title="Unlink from this spot in the document"
                            >
                              <span className="text-[10px] font-mono px-1">Unlink</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteAttachment(att)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                              title="Permanently delete file from diary & Drive vault"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Inline File / Document Presentation */
                      <div className="p-4 bg-slate-900 flex items-center justify-between flex-wrap gap-3">
                        <div 
                          onClick={() => onOpenViewer(att)}
                          className="flex items-center gap-3 cursor-pointer min-w-0"
                          title="Click to view file details and open in Google Drive"
                        >
                          <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-white truncate block" title={att.name}>
                              {att.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>{(att.size / 1024).toFixed(0)} KB</span>
                              <span>&bull;</span>
                              <span className="uppercase">{att.type.split('/')[1] || 'FILE'}</span>
                              <span>&bull;</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Cloud className="w-3 h-3" /> Drive Synced
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenViewer(att)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                            title="Open file preview and view in Google Drive"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                            <span>View in Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachmentFromText(block.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Unlink from this spot in the document"
                          >
                            <span className="text-[10px] font-mono px-1">Unlink</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteAttachment(att)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                            title="Permanently delete file from diary & Drive vault"
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
