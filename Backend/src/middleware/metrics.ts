import type { Request, Response, NextFunction } from 'express';
import express from 'express';

// Simple in-memory Prometheus-style metrics without external deps

type Labels = Record<string, string>;

function boolFromEnv(v: any, def: boolean) {
  if (v == null) return def;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(s);
}

export const METRICS_ENABLED: boolean = boolFromEnv(process.env.METRICS_ENABLED, true);

const HTTP_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5]; // seconds
const DB_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5]; // seconds

function labelsKey(obj: Labels): string {
  // stable key
  return Object.keys(obj).sort().map((k) => `${k}=${obj[k]}`).join('|');
}

class Counter {
  private store = new Map<string, number>();
  inc(labels: Labels, value: number = 1) {
    const k = labelsKey(labels);
    this.store.set(k, (this.store.get(k) || 0) + value);
  }
  entries(): Array<{ labels: Labels; value: number }> {
    const out: Array<{ labels: Labels; value: number }> = [];
    for (const [k, v] of this.store.entries()) {
      const labels: Labels = {};
      k.split('|').forEach((p) => {
        const [lk, lv] = p.split('=');
        if (lk) labels[lk] = lv ?? '';
      });
      out.push({ labels, value: v });
    }
    return out;
  }
}

class Histogram {
  private buckets: number[];
  private counts = new Map<string, number[]>();
  private sums = new Map<string, number>();
  private totals = new Map<string, number>();
  constructor(buckets: number[]) {
    this.buckets = [...buckets].sort((a, b) => a - b);
  }
  observe(labels: Labels, valueSeconds: number) {
    const k = labelsKey(labels);
    if (!this.counts.has(k)) this.counts.set(k, new Array(this.buckets.length).fill(0));
    const arr = this.counts.get(k)!;
    for (let i = 0; i < this.buckets.length; i++) {
      if (valueSeconds <= this.buckets[i]) {
        arr[i] += 1;
      }
    }
    this.sums.set(k, (this.sums.get(k) || 0) + valueSeconds);
    this.totals.set(k, (this.totals.get(k) || 0) + 1);
  }
  serialize(name: string): string {
    let out = `# TYPE ${name} histogram\n`;
    for (const [k, arr] of this.counts.entries()) {
      const labels: Labels = {};
      k.split('|').forEach((p) => {
        const [lk, lv] = p.split('=');
        if (lk) labels[lk] = lv ?? '';
      });
      let cum = 0;
      for (let i = 0; i < this.buckets.length; i++) {
        cum = arr[i];
        const l = { ...labels, le: String(this.buckets[i]) };
        out += `${name}_bucket${formatLabels(l)} ${cum}\n`;
      }
      // +Inf bucket equals total count
      const total = this.totals.get(k) || 0;
      out += `${name}_bucket${formatLabels({ ...labels, le: '+Inf' })} ${total}\n`;
      out += `${name}_sum${formatLabels(labels)} ${this.sums.get(k) || 0}\n`;
      out += `${name}_count${formatLabels(labels)} ${total}\n`;
    }
    return out;
  }
}

function esc(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/\n/g, '\n').replace(/"/g, '\"');
}
function formatLabels(labels: Labels): string {
  const keys = Object.keys(labels);
  if (keys.length === 0) return '';
  return '{' + keys.sort().map((k) => `${k}="${esc(labels[k])}"`).join(',') + '}';
}

// Metrics registry
const httpRequestsTotal = new Counter();
const httpDuration = new Histogram(HTTP_BUCKETS);
const dbDuration = new Histogram(DB_BUCKETS);

export function observeDbQuery(ms: number, extraLabels: Labels = {}) {
  if (!METRICS_ENABLED) return;
  const sec = ms / 1000;
  dbDuration.observe(extraLabels, sec);
}

function routeLabel(req: Request): string {
  const anyReq: any = req as any;
  const base = (anyReq.baseUrl || '') + (anyReq.route?.path || '');
  if (base) return base;
  return req.path || req.originalUrl || 'unknown';
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!METRICS_ENABLED) return next();
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durSec = Number(end - start) / 1e9;
    const method = (req.method || 'GET').toUpperCase();
    const route = routeLabel(req);
    const status = String(res.statusCode);
    httpRequestsTotal.inc({ method, route, status }, 1);
    httpDuration.observe({ method, route }, durSec);
  });
  next();
}

export const metricsRouter = express.Router();
metricsRouter.get('/', (_req, res) => {
  if (!METRICS_ENABLED) {
    res.status(404).send('metrics disabled');
    return;
  }
  let body = '';
  body += `# HELP http_requests_total Total HTTP requests\n`;
  body += `# TYPE http_requests_total counter\n`;
  for (const e of httpRequestsTotal.entries()) {
    body += `http_requests_total${formatLabels(e.labels)} ${e.value}\n`;
  }

  body += `# HELP http_request_duration_seconds Request duration\n`;
  body += httpDuration.serialize('http_request_duration_seconds');

  body += `# HELP db_query_duration_seconds Database query duration\n`;
  body += dbDuration.serialize('db_query_duration_seconds');

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.status(200).send(body);
});

