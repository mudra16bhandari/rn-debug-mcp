import { EventBuffer } from './EventBuffer';
import { RuntimeEvent } from './types';
import http from 'http';

export class RemoteEventBuffer extends EventBuffer {
    constructor(private remoteUrl: string) {
        super();
    }

    private async fetchEvents(): Promise<RuntimeEvent[]> {
        return new Promise((resolve, reject) => {
            http.get(this.remoteUrl, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to fetch events: ${res.statusCode}`));
                    return;
                }

                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    }

    // Override getAll to always fetch from primary
    getAll(): RuntimeEvent[] {
        // Note: This is tricky because getAll is synchronous in the base class
        // but fetching is asynchronous. 
        // For now, we'll keep the base class as is and add a sync() method
        // that the MCP tool handlers can call.
        return super.getAll();
    }

    async sync(): Promise<void> {
        try {
            const events = await this.fetchEvents();
            this.setEvents(events);
        } catch (err) {
            console.error('[RemoteBuffer] Sync failed:', err);
        }
    }
}
