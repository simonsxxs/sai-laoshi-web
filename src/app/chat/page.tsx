'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Menu } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '@/components/chat/sidebar';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { EmptyState } from '@/components/chat/empty-state';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  const getMessageText = (message: { parts: Array<{ type: string; text?: string }> }) =>
    message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage({ text });
    },
    [sendMessage]
  );

  const handleTopicSelect = (topic: string) => {
    sendMessage({ text: topic });
  };

  return (
    <div className="flex h-full bg-stone-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-stone-200 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-md hover:bg-stone-100 text-stone-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-stone-900">赛老师</h1>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <EmptyState onSelectTopic={handleTopicSelect} />
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role as 'user' | 'assistant'}
                    content={getMessageText(message)}
                  />
                ))}
                {isStreaming && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="text-xs font-medium text-amber-700 mb-1.5">
                        赛老师
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          onSubmit={handleSend}
          isLoading={isStreaming}
        />
      </div>
    </div>
  );
}
