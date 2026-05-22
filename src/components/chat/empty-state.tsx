interface EmptyStateProps {
  onSelectTopic: (topic: string) => void;
}

const suggestedTopics = [
  '最近有点烦',
  '想不通一个决定',
  '想聊聊自己',
  '不知道怎么办',
];

export function EmptyState({ onSelectTopic }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-2xl">🌸</span>
      </div>

      <h2 className="text-xl font-semibold text-stone-900 mb-2">
        今天想聊什么？
      </h2>

      <p className="text-stone-500 mb-8">
        随便聊聊，什么都可以。我会认真听你说。
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {suggestedTopics.map((topic) => (
          <button
            key={topic}
            onClick={() => onSelectTopic(topic)}
            className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition-colors"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
