import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 to-amber-50">
      <main className="flex flex-col items-center gap-8 px-6 py-12 text-center max-w-md">
        <div className="flex items-center gap-2 text-amber-700">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">赛老师</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-semibold text-stone-900 tracking-tight">
            赛老师
          </h1>
          <p className="text-lg text-stone-600 leading-relaxed">
            会成长的思维陪伴顾问
          </p>
          <p className="text-stone-500 text-sm">
            一个能记住你、懂你、持续跟进你的陪伴型思维伙伴。不比较，只陪你看清自己。
          </p>
        </div>

        <Link
          href="/chat"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-700 px-8 py-3 text-white font-medium transition-colors hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          开始对话
        </Link>
      </main>
    </div>
  );
}
