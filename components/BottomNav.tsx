'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  Radar, 
  Sparkles, 
  MessageSquare, 
  Kanban 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'CV', href: '/cv', icon: FileText },
  { name: 'Radar', href: '/radar', icon: Radar },
  { name: 'Tailor', href: '/tailor', icon: Sparkles },
  { name: 'Prep', href: '/interview', icon: MessageSquare },
  { name: 'Tracker', href: '/tracker', icon: Kanban },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-sand-200 px-2 py-1.5 flex items-center justify-around md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 min-h-[44px] touch-manipulation select-none cursor-pointer",
              isActive 
                ? "text-terracotta-600 font-bold" 
                : "text-ink-500 hover:text-ink-900 font-medium"
            )}
          >
            <div className={cn(
              "p-1 rounded-lg transition-colors flex items-center justify-center relative",
              isActive && "bg-terracotta-50 text-terracotta-600"
            )}>
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              {isActive && (
                <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-terracotta-600" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
