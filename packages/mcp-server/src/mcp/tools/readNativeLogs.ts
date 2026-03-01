import { z } from 'zod';
import { readNativeLogs as fetchLogs } from '../../utils/nativeLogs';

export const readNativeLogsSchema = z.object({
    platform: z.enum(['android', 'ios']).describe('The platform to fetch logs from'),
    limit: z.number().optional().default(100).describe('Number of log lines to return'),
    deviceId: z.string().optional().describe('Optional device ID or "booted" for iOS'),
    filter: z.string().optional().describe('Optional filter string (e.g., a tag for Android or predicate for iOS)'),
});

export async function readNativeLogs(
    input: z.infer<typeof readNativeLogsSchema>
): Promise<string> {
    const result = await fetchLogs(input);
    return result || 'No logs found.';
}
