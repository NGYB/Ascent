'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Kanban, 
  Compass,
  ChevronsUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'CV Workspace', href: '/cv', icon: FileText },
  { name: 'Tailoring & ATS', href: '/tailor', icon: Sparkles },
  { name: 'Interview Prep', href: '/interview', icon: MessageSquare },
  { name: 'Job Tracker', href: '/tracker', icon: Kanban },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      <Link href="/" className="h-16 flex items-center px-6 border-b border-slate-800 gap-2 hover:bg-slate-800/40 transition-colors w-full cursor-pointer">
        <ChevronsUp className="h-6 w-6 text-indigo-400" />
        <span className="font-semibold text-xl tracking-wider bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
          ASCENT
        </span>
      </Link>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors gap-3",
                isActive 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Compass className="h-4 w-4 text-indigo-400 animate-spin-slow" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">Trial / Guest Mode</p>
            <p className="text-[10px] text-slate-500">Progress saved locally</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
