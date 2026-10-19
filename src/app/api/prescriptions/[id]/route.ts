import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, medications, prescriptionRequests } from '@/db';
import { requireAdmin } from '@/lib/auth';
import { REQUEST_STATUSES, toRequestDto } from '@/lib/dto';
import { ApiError, ok, parseBody, route } from '@/lib/http';

const schema = z.object({ status: z.enum(REQUEST_STATUSES) });

/**
 * Administration (pharmacie / médecin) : fait avancer une demande.
 *   curl -X PATCH .../api/prescriptions/<id> -H "x-admin-key: …" -d '{"status":"READY"}'
 * Quand le statut passe à COLLECTED, le stock du médicament est remis au maximum.
 */
export const PATCH = route(async (req, ctx: RouteContext<'/api/prescriptions/[id]'>) => {
  requireAdmin(req);
  const { id } = await ctx.params;
  const { status } = await parseBody(req, schema);

  const current = await db.query.prescriptionRequests.findFirst({
    where: eq(prescriptionRequests.id, id),
  });
  if (!current) throw new ApiError(404, 'NOT_FOUND', 'Pedido não encontrado.');

  const updated = await db.transaction(async (tx) => {
    const [r] = await tx
      .update(prescriptionRequests)
      .set({ status })
      .where(eq(prescriptionRequests.id, id))
      .returning();
    if (status === 'COLLECTED' && current.status !== 'COLLECTED' && current.medicationId) {
      await tx
        .update(medications)
        .set({ remaining: sql`${medications.total}` })
        .where(eq(medications.id, current.medicationId));
    }
    return r;
  });

  return ok({ request: toRequestDto(updated) });
});