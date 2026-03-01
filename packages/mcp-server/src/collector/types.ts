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
  isMemo?: boolean;
  timestamp: number;
  screen?: string;
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
  stack?: string;
};

export type NavigationEvent = {
  type: 'navigation';
  screen: string;
  action: 'focus' | 'blur';
  timestamp: number;
};

export type ContextUpdateEvent = {
  type: 'context_update';
  provider: string;
  timestamp: number;
  trigger?: string; // e.g. 'dispatch', 'setState'
  screen?: string;
};

export type RuntimeEvent =
  | RenderEvent
  | RenderCheckEvent
  | RenderTimeEvent
  | JSBlockEvent
  | NetworkEvent
  | NavigationEvent
  | ContextUpdateEvent;

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

export interface HeatmapItem {
  component: string;
  score: number;
  renderCount: number;
  cascadeParticipation: number;
  unnecessaryRatio: number;
  avgDuration?: number;
  severity: Severity;
}

export interface HeatmapReport {
  screen: string;
  items: HeatmapItem[];
  summary: string;
}
