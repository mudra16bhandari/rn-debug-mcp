export interface DebugConfig {
  enabled: boolean;
  wsUrl: string;
  bufferSize: number;
  logToConsole: boolean;
  projectId: string;
}

let config: DebugConfig = {
  enabled: typeof __DEV__ !== 'undefined' && __DEV__,
  wsUrl: 'ws://localhost:4567',
  bufferSize: 200,
  logToConsole: false,
  projectId: 'default-project',
};

let currentScreenName = 'unknown';

export function configure(overrides: Partial<DebugConfig>): void {
  config = { ...config, ...overrides };
}

export function getConfig(): DebugConfig {
  return config;
}

export function setCurrentScreen(name: string): void {
  currentScreenName = name;
}

export function getCurrentScreen(): string {
  return currentScreenName;
}
