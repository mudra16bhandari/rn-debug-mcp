export type RenderEvent = {
  type: 'render';
  component: string;
  screen?: string;
  timestamp: number;
  renderCount?: number;
};

export type RenderCheckEvent = {
  type: 'render_check';
  component: string;
  propsChanged: boolean;
  timestamp: number;
};

export type RenderTimeEvent = {
  type: 'render_time';
  component: string;
  duration: number; // milliseconds
  timestamp: number;
};

export type JSBlockEvent = {
  type: 'js_block';
  delay: number; // ms over expected interval
  timestamp: number;
};

export type NetworkEvent = {
  type: 'network';
  url: string;
  method: string;
  duration: number;
  status?: number;
  timestamp: number;
};

export type NavigationEvent = {
  type: 'navigation';
  screen: string;
  action: 'focus' | 'blur';
  timestamp: number;
};

export type RuntimeEvent =
  | RenderEvent
  | RenderCheckEvent
  | RenderTimeEvent
  | JSBlockEvent
  | NetworkEvent
  | NavigationEvent;

// ── Analysis Result Types ──────────────────────────────────
export type Severity = 'info' | 'warning' | 'critical';

export interface Finding {
  severity: Severity;
  component?: string;
  screen?: string;
  title: string;
  description: string;
  suggestion: string;
  data?: Record<string, unknown>;
}

export interface ScreenReport {
  screen: string;
  analysisWindowMs: number;
  findings: Finding[];
  summary: string;
}
