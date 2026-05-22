import { clsx } from 'clsx';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

function renderMarkdown(content: string): React.ReactNode {
  // Split by paragraphs
  const paragraphs = content.split('\n\n');

  return paragraphs.map((paragraph, pIndex) => {
    // Check if it's a list (starts with - or *)
    if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
      const items = paragraph
        .split('\n')
        .filter((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))
        .map((line) => line.trim().slice(2));

      return (
        <ul key={pIndex} className="list-disc list-inside space-y-1 my-3">
          {items.map((item, iIndex) => (
            <li key={iIndex}>{renderBold(item)}</li>
          ))}
        </ul>
      );
    }

    // Regular paragraph
    return (
      <p key={pIndex} className="mb-3 last:mb-0">
        {renderBold(paragraph)}
      </p>
    );
  });
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={clsx(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={clsx(
        'max-w-[85%] lg:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm',
        isUser
          ? 'bg-amber-100 text-amber-900 rounded-br-md'
          : 'bg-white border border-stone-200 text-stone-800 rounded-bl-md'
      )}>
        {!isUser && (
          <div className="text-xs font-medium text-amber-700 mb-1.5">
            赛老师
          </div>
        )}
        <div className="text-sm leading-relaxed">
          {renderMarkdown(content)}
        </div>
      </div>
    </div>
  );
}
