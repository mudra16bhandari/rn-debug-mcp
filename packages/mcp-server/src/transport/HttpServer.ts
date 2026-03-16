import express from 'express';
import { EventCollector } from '../collector/EventCollector';

export function createHttpServer(port: number, collector: EventCollector): express.Application {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/events', (req, res) => {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    const results = events.map((e) => collector.receive(e));
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      return res.status(400).json({ errors: failed });
    }
    res.json({ ok: true, received: events.length });
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.get('/status', (_req, res) => {
    res.json({
      bufferedEvents: collector.getBuffer().size(),
    });
  });

  app.get('/events/export', (_req, res) => {
    res.json(collector.getBuffer().getAll());
  });

  app.listen(port, () => console.error(`[HTTP] Listening on http://localhost:${port}`));

  return app;
}
