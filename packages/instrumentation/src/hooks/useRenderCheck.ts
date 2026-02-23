import { useRef } from 'react';
import { sendEvent } from '../transport/EventBuffer';

function shallowDiff(
  prev: Record<string, unknown>,
  next: Record<string, unknown>
): boolean {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return true;
  return prevKeys.some((k) => prev[k] !== next[k]);
}

export function useRenderCheck(
  componentName: string,
  props: Record<string, unknown>
): void {
  const prevProps = useRef<Record<string, unknown> | null>(null);

  if (prevProps.current !== null) {
    const changed = shallowDiff(prevProps.current, props);
    sendEvent({
      type: 'render_check',
      component: componentName,
      propsChanged: changed,
    });
  }

  prevProps.current = props;
}
