import type { Router as TRouter, Request, Response } from 'express';
import { Router } from 'express';
import crypto from 'node:crypto';
import inspector from 'node:inspector';

type ProfileRecord = {
  id: string;
  session: inspector.Session;
  timer?: NodeJS.Timeout;
  stopped: boolean;
  profileJson?: string;
};

const active = new Map<string, ProfileRecord>();

function startProfile(seconds: number) {
  const id = crypto.randomUUID();
  const session = new inspector.Session();
  session.connect();
  // Enable and start profiler
  session.post('Profiler.enable');
  session.post('Profiler.start');

  const rec: ProfileRecord = { id, session, stopped: false };
  if (seconds > 0) {
    rec.timer = setTimeout(() => void stopProfile(id), seconds * 1000);
  }
  active.set(id, rec);
  return id;
}

function stopProfile(id: string): Promise<string> {
  const rec = active.get(id);
  if (!rec) return Promise.reject(new Error('Unknown profile id'));
  if (rec.stopped && rec.profileJson) return Promise.resolve(rec.profileJson);

  return new Promise((resolve, reject) => {
    try {
      rec.session.post('Profiler.stop', (err, params: any) => {
        rec.stopped = true;
        if (rec.timer) clearTimeout(rec.timer);
        if (err) {
          try { rec.session.disconnect(); } catch {}
          return reject(err);
        }
        const json = JSON.stringify(params.profile ?? params);
        rec.profileJson = json;
        try { rec.session.disconnect(); } catch {}
        resolve(json);
      });
    } catch (e) {
      try { rec.session.disconnect(); } catch {}
      reject(e);
    }
  });
}

export const profilerRouter: TRouter = Router();

// Guard: only non-production and when enabled
profilerRouter.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' || process.env.PROFILER_ENABLED !== 'true') {
    return res.status(404).end();
  }
  next();
});

// GET /__prof/start?seconds=30
profilerRouter.get('/__prof/start', (req: Request, res: Response) => {
  const seconds = Math.max(1, Math.min(600, parseInt(String(req.query.seconds ?? '30'), 10) || 30));
  const id = startProfile(seconds);
  res.json({ id, seconds });
});

// GET /__prof/stop?id=<id>
profilerRouter.get('/__prof/stop', async (req: Request, res: Response) => {
  try {
    const id = String(req.query.id || '');
    if (!id || !active.has(id)) return res.status(400).json({ error: 'Invalid id' });
    const json = await stopProfile(id);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=profile-${id}.cpuprofile`);
    res.send(json);
  } catch (err: any) {
    res.status(500).json({ error: 'PROFILE_ERROR', message: err?.message || String(err) });
  }
});

