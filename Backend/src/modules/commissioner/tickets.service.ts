import { withConnection } from '../../core/database';

export interface TicketInput {
  issuerUserId: number;
  subjectUserId: number;
  scopes: string[];
  validFrom: Date;
  validTo: Date;
}

export async function issueTicket(input: TicketInput) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO Commissioner_Tickets (issuer_user_id, subject_user_id, scopes_json, valid_from, valid_to)
       VALUES (?, ?, ?, ?, ?)`,
      [input.issuerUserId, input.subjectUserId, JSON.stringify(input.scopes), input.validFrom, input.validTo]
    );
    const id = (result as any).insertId as number;
    return getTicketById(id);
  });
}

export async function revokeTicket(id: number) {
  return withConnection(async (conn) => {
    await conn.execute(`UPDATE Commissioner_Tickets SET revoked_at = NOW() WHERE id = ?`, [id]);
    return getTicketById(id);
  });
}

export async function getTicketById(id: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(`SELECT * FROM Commissioner_Tickets WHERE id = ?`, [id]);
    return (rows as any[])[0] || null;
  });
}

export async function getActiveTicketsForUser(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM Commissioner_Tickets
       WHERE subject_user_id = ? AND revoked_at IS NULL AND valid_from <= NOW() AND valid_to >= NOW()
       ORDER BY valid_to DESC`,
      [userId]
    );
    return rows as any[];
  });
}

export async function hasActiveTicketForScope(userId: number, scope: string): Promise<boolean> {
  const tickets = await getActiveTicketsForUser(userId);
  return tickets.some((t) => {
    try {
      const scopes: string[] = JSON.parse(t.scopes_json || '[]');
      return scopes.includes(scope);
    } catch {
      return false;
    }
  });
}

export async function getAllTickets() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM Commissioner_Tickets
       ORDER BY created_at DESC`
    );
    return rows as any[];
  });
}

