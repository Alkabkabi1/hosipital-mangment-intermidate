import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';

export type SignatureTable = 'Clearance_Signatures' | 'Delegation_Signatures' | 'Onboarding_Signatures';

interface SignatureInsertInput {
  table: SignatureTable;
  formId: number;
  departmentId: number;
  signerName: string;
  signerTitle: string;
  signedBy: number;
  signatureDate: string;
  comment?: string | null;
}

const tableConfig: Record<SignatureTable, { column: string; mapId: (id: number) => [number | null, number | null, number | null] }> = {
  Clearance_Signatures: {
    column: 'clearance_id',
    mapId: (id) => [id, null, null],
  },
  Delegation_Signatures: {
    column: 'delegation_id',
    mapId: (id) => [null, id, null],
  },
  Onboarding_Signatures: {
    column: 'onboarding_id',
    mapId: (id) => [null, null, id],
  },
};

function buildInsertStatement(table: SignatureTable): string {
  return `INSERT INTO ${table} (
    clearance_id,
    delegation_id,
    onboarding_id,
    department_id,
    signer_name,
    signer_title,
    signed_by,
    signed_at,
    signature_date,
    comment
  ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`;
}

export async function ensureDepartmentHasNotSigned(table: SignatureTable, formId: number, departmentId: number): Promise<void> {
  const { column } = tableConfig[table];
  const query = `SELECT 1 FROM ${table} WHERE ${column} = ? AND department_id = ? LIMIT 1`;

  await withConnection(async (conn) => {
    const [rows] = await conn.execute(query, [formId, departmentId]);
    if (Array.isArray(rows) && rows.length > 0) {
      throw new AppError({ statusCode: 409, message: 'Department already signed', code: 'CONFLICT' });
    }
  });
}

export async function insertSignature(input: SignatureInsertInput): Promise<void> {
  const { table, formId, departmentId, signerName, signerTitle, signedBy, signatureDate, comment } = input;
  const insertSql = buildInsertStatement(table);
  const [clearanceId, delegationId, onboardingId] = tableConfig[table].mapId(formId);

  await withConnection(async (conn) => {
    await conn.execute(insertSql, [
      clearanceId,
      delegationId,
      onboardingId,
      departmentId,
      signerName,
      signerTitle,
      signedBy,
      signatureDate,
      comment ?? null,
    ]);
  });
}
