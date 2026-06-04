import { useEffect, useState, type RefObject } from 'react';

interface UseResizablePanelOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  minWidth?: number;
  maxWidthRatio?: number;
  initialWidth?: number;
}

interface UseResizablePanelReturn {
  panelWidth: number;
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent) => void;
}

export function useResizablePanel({
  containerRef,
  minWidth = 280,
  maxWidthRatio = 0.6,
  initialWidth = 380,
}: UseResizablePanelOptions): UseResizablePanelReturn {
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const maxWidth = containerRect.width * maxWidthRatio;
      setPanelWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, containerRef, minWidth, maxWidthRatio]);

  return { panelWidth, isDragging, handleDragStart };
}
