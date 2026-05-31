import { useCallback, useRef } from 'react';
import type { SelectionInfo } from '../types';

export function useTextSelection(
  onSelect: (info: SelectionInfo) => void,
  currentPage: number,
  containerRef: React.RefObject<HTMLElement | null>
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseUp = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      const text = selection.toString().trim();
      if (!text || text.length < 3) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top;

      onSelect({ text, x, y, pageNumber: currentPage });
    }, 100);
  }, [onSelect, currentPage, containerRef]);

  return { handleMouseUp };
}
