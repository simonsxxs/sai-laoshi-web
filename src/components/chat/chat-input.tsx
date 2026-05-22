'use client';

import { Send } from 'lucide-react';
import { clsx } from 'clsx';
import { useRef, useEffect, useState } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 144);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const send = () => {
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-stone-200 bg-white px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-2 bg-stone-50 rounded-xl border border-stone-200 px-3 py-2 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说你的想法..."
            className="flex-1 bg-transparent border-0 resize-none text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-0 min-h-[24px] max-h-[144px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              value.trim() && !isLoading
                ? 'bg-amber-700 text-white hover:bg-amber-800'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
