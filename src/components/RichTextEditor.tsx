import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (editorRef.current && isFirstRender.current) {
      editorRef.current.innerHTML = value || '';
      isFirstRender.current = false;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    let contentToInsert = '';

    if (html) {
      // 1. Clean Paste on Editor: Remove unwanted attributes and styles
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const cleanNode = (node: Node): Node | null => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.cloneNode(true);
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          
          // Allowed tags: Bold, Italic, Headings, Paragraphs, Lists
          const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'span', 'div'];
          
          if (!allowedTags.includes(tag)) {
            // Extract children if tag not allowed
            const fragment = document.createDocumentFragment();
            el.childNodes.forEach(child => {
              const cleanedChild = cleanNode(child);
              if (cleanedChild) fragment.appendChild(cleanedChild);
            });
            return fragment;
          }

          const newEl = document.createElement(tag);
          
          // STRICTLY REMOVE ALL ATTRIBUTES (data-original-attrs, inline styles, classes from MS Word/Web)
          // As requested: "সব অনাকাঙ্ক্ষিত data-original-attrs, inline font-family, font-size এবং অতিরিক্ত HTML Attributes স্বয়ংক্রিয়ভাবে রিমুভ (Clean) হয়ে যায়"
          
          el.childNodes.forEach(child => {
            const cleanedChild = cleanNode(child);
            if (cleanedChild) newEl.appendChild(cleanedChild);
          });
          
          return newEl;
        }
        
        return null;
      };

      const container = document.createElement('div');
      doc.body.childNodes.forEach(node => {
        const cleaned = cleanNode(node);
        if (cleaned) container.appendChild(cleaned);
      });
      
      contentToInsert = container.innerHTML;
    } else {
      // Fallback to plain text with basic paragraph wrapping
      contentToInsert = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line.trim()}</p>`)
        .join('');
    }

    // Insert the cleaned HTML
    document.execCommand('insertHTML', false, contentToInsert);
    handleInput();
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 transition-all focus-within:border-[#046A38] focus-within:ring-1 focus-within:ring-[#046A38]/20">
      {/* Basic Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
        <ToolbarButton onClick={() => document.execCommand('bold')} label="B" title="Bold" className="font-bold" />
        <ToolbarButton onClick={() => document.execCommand('italic')} label="I" title="Italic" className="italic" />
        <ToolbarButton onClick={() => document.execCommand('underline')} label="U" title="Underline" className="underline" />
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <ToolbarButton onClick={() => document.execCommand('formatBlock', false, 'h2')} label="H2" title="Heading 2" />
        <ToolbarButton onClick={() => document.execCommand('formatBlock', false, 'h3')} label="H3" title="Heading 3" />
        <ToolbarButton onClick={() => document.execCommand('formatBlock', false, 'p')} label="P" title="Paragraph" />
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <ToolbarButton onClick={() => document.execCommand('insertUnorderedList')} label="• List" title="Bullet List" />
        <ToolbarButton onClick={() => document.execCommand('insertOrderedList')} label="1. List" title="Numbered List" />
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <ToolbarButton onClick={() => document.execCommand('removeFormat')} label="Clear" title="Clear Formatting" className="text-[10px]" />
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="w-full px-4 py-3 min-h-[300px] focus:outline-none text-slate-900 dark:text-white text-sm prose dark:prose-invert prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
        data-placeholder={placeholder}
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void; label: string; title: string; className?: string }> = ({ onClick, label, title, className }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-[#046A38] dark:hover:text-emerald-400 rounded transition-colors ${className}`}
  >
    {label}
  </button>
);
