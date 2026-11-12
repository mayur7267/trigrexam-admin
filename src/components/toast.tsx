import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";

interface T { id: number; text: string }
const Ctx = createContext<(text: string) => void>(() => {});
let n = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const toast = useCallback((text: string) => {
    const id = ++n;
    setItems((l) => [...l, { id, text }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} className="rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-bg shadow-[var(--shadow-pop)]">
            <CircleCheck size={18} className="shrink-0 text-[#5fe0a8]" />
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
