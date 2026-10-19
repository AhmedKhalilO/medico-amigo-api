import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, doseLogs, medications } from '@/db';
import { requireUser } from '@/lib/auth';
import { toMedicationDto } from '@/lib/dto';
import { ApiError, ok, parseBody, route } from '@/lib/http';

const schema = z.object({ medicationId: z.string().min(1) });

/** Bouton « Tomada » : enregistre une prise et décrémente le stock. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { medicationId } = await parseBody(req, schema);

  const med = await db.query.medications.findFirst({
    where: and(eq(medications.id, medicationId), eq(medications.userId, user.id)),
  });
  if (!med) throw new ApiError(404, 'NOT_FOUND', 'Medicamento não encontrado.');

  const updated = await db.transaction(async (tx) => {
    await tx.insert(doseLogs).values({ userId: user.id, medicationId: med.id });
    const [m] = await tx
      .update(medications)
      .set({ remaining: Math.max(0, med.remaining - med.dosePerTake) })
      .where(eq(medications.id, med.id))
      .returning();
    return m;
  });

  return ok({ medication: toMedicationDto(updated) }, 201);
});