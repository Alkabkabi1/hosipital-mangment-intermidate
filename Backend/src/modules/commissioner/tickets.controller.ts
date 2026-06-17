import type { RequestHandler } from 'express';
import { issueTicket, revokeTicket, getActiveTicketsForUser, getTicketById } from './tickets.service';

function flagEnabled(name: string, def = false): boolean {
  const v = process.env[name];
  if (!v) return def;
  return ['1','true','yes','on'].includes(v.toLowerCase());
}

export const createTicketController: RequestHandler = async (req, res, next) => {
  try {
    const issuerId = (req as any).auth?.sub;
    const { subjectUserId, scopes, validFrom, validTo } = req.body || {};
    if (!issuerId || !subjectUserId || !Array.isArray(scopes) || !validFrom || !validTo) {
      return res.status(400).json({ error: 'BAD_REQUEST' });
    }
    const ticket = await issueTicket({
      issuerUserId: Number(issuerId),
      subjectUserId: Number(subjectUserId),
      scopes: scopes.map(String),
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

export const revokeTicketController: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'BAD_REQUEST' });
    const ticket = await revokeTicket(id);
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

export const listMyTicketsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as any).auth?.sub;
    const tickets = await getActiveTicketsForUser(Number(userId));
    res.json({ success: true, data: tickets });
  } catch (err) {
    next(err);
  }
};

export const getTicketController: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const ticket = await getTicketById(id);
    if (!ticket) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

export const listAllTicketsController: RequestHandler = async (req, res, next) => {
  try {
    const { getAllTickets } = await import('./tickets.service');
    const tickets = await getAllTickets();
    res.json({ success: true, data: tickets });
  } catch (err) {
    next(err);
  }
};

export function requireTicket(scope: string): RequestHandler {
  return async (req, res, next) => {
    const enabled = flagEnabled('COMMISSIONER_SERVER_ENABLED', false);
    if (!enabled) return next();
    const userId = (req as any).auth?.sub;
    try {
      const { hasActiveTicketForScope } = await import('./tickets.service');
      const ok = await hasActiveTicketForScope(Number(userId), scope);
      if (!ok) return res.status(403).json({ error: 'COMMISSIONER_TICKET_REQUIRED' });
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

