import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LogOptions {
  platform: 'android' | 'ios';
  limit?: number;
  deviceId?: string;
  filter?: string;
}

export async function readNativeLogs(options: LogOptions): Promise<string> {
  const { platform, limit = 100, deviceId, filter } = options;

  if (platform === 'android') {
    return getAndroidLogs(limit, deviceId, filter);
  } else {
    return getIosLogs(limit, deviceId, filter);
  }
}

async function getAndroidLogs(limit: number, deviceId?: string, filter?: string): Promise<string> {
  const deviceArgs = deviceId ? `-s ${deviceId}` : '';
  const execOptions = { maxBuffer: 10 * 1024 * 1024 };

  try {
    // If there's a filter, we want to look back further than the 'limit' because many logs might be filtered out
    const searchLimit = filter ? Math.max(limit, 10000) : limit;

    const command = filter
      ? `adb ${deviceArgs} logcat -d -t ${searchLimit} "${filter}:V" "*:S"`
      : `adb ${deviceArgs} logcat -d -t ${searchLimit}`;

    let { stdout } = await execAsync(command, execOptions);

    // Fallback for message-based searching
    if (
      filter &&
      (!stdout || stdout.trim() === '--------- beginning of main' || stdout.length < 50)
    ) {
      const { stdout: allLogs } = await execAsync(
        `adb ${deviceArgs} logcat -d -t ${searchLimit}`,
        execOptions
      );
      const lines = allLogs.split('\n');
      const filteredLines = lines.filter((line) =>
        line.toLowerCase().includes(filter.toLowerCase())
      );
      return filteredLines.slice(-limit).join('\n') || 'No logs found matching your filter.';
    }

    // Apply limit to the result
    const finalLines = stdout.split('\n');
    if (finalLines.length > limit) {
      return finalLines.slice(-(limit + 1)).join('\n'); // +1 to keep the header line if it's there
    }

    return stdout;
  } catch (error: any) {
    if (error.message.includes('command not found')) {
      return 'Error: adb command not found. Please ensure Android SDK is installed and adb is in your PATH.';
    }
    return `Error fetching Android logs: ${error.message}`;
  }
}

async function getIosLogs(
  limit: number,
  deviceId: string = 'booted',
  filter?: string
): Promise<string> {
  try {
    // --last: time period (e.g., 1m, 1h)
    // --style syslog: more readable format
    // --limit: limit number of entries
    // --predicate: filter logs
    const filterArg = filter ? `--predicate '${filter}'` : '';
    const { stdout } = await execAsync(
      `xcrun simctl spawn ${deviceId} log show --last 1m --style syslog --limit ${limit} ${filterArg}`
    );
    return stdout;
  } catch (error: any) {
    if (error.message.includes('command not found')) {
      return 'Error: xcrun command not found. This tool only works on macOS with Xcode installed.';
    }
    return `Error fetching iOS logs: ${error.message}`;
  }
}
