import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ModalFrame({ children, onClose, className = '', style }) {
  const ref = useRef(null), close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const frame = ref.current;
    const items = () => [...frame.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(item => item.getClientRects().length);
    const timer = requestAnimationFrame(() => items()[0]?.focus());
    const keydown = event => {
      if ([...document.querySelectorAll('[data-modal-frame]')].at(-1) !== frame) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current?.(); }
      if (event.key !== 'Tab') return;
      const focusable = items(), first = focusable[0], last = focusable.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (!frame.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { cancelAnimationFrame(timer); document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(<div ref={ref} data-modal-frame className={`modal-overlay active app-modal-overlay ${className}`} style={style}>{children}</div>, document.body);
}
