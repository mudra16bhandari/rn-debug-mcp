import { execSync } from 'child_process';
import { logger } from './logger';

import http from 'http';

/**
 * Checks if a server is responding with {ok: true} on /health
 */
export async function isServerHealthy(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/health`, { timeout: 1000 }, (res) => {
            if (res.statusCode !== 200) {
                resolve(false);
                return;
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.ok === true);
                } catch {
                    resolve(false);
                }
            });
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}

export async function freePorts(ports: number[]): Promise<void> {
    if (process.platform === 'win32') {
        // Windows implementation could use netstat and taskkill
        // For now, we'll just skip to avoid errors
        logger.info('Port clearing is currently only supported on macOS and Linux');
        return;
    }

    const portList = ports.join(',');
    logger.info(`Checking ports: ${portList}`);

    try {
        // lsof -ti :4567,4568 returns just the PIDs
        const stdout = execSync(`lsof -ti :${portList}`, { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();

        if (stdout) {
            const pids = stdout.split('\n').filter(Boolean);
            logger.warn(`Found existing processes on ports ${portList}. PIDs: ${pids.join(', ')}. Killing them...`);

            // Kill each PID
            for (const pid of pids) {
                // Don't kill ourselves
                if (parseInt(pid) === process.pid) continue;

                try {
                    // Send SIGTERM first, then SIGKILL if stubborn
                    // For simplicity in this context, we'll use -9 as requested by common practice for stale servers
                    execSync(`kill -9 ${pid}`);
                    logger.info(`Killed process ${pid}`);
                } catch (err) {
                    logger.error(`Failed to kill process ${pid}:`, err);
                }
            }
        } else {
            logger.info(`No processes found on ports ${portList}`);
        }
    } catch (err) {
        // execSync throws if no processes are found (lsof returns non-zero exit code)
        // We can safely ignore this as it means the ports are likely free
    }
}
