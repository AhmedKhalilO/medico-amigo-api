import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, medications } from '@/db';
import { requireUser } from '@/lib/auth';
import { toMedicationDto } from '@/lib/dto';
import { ApiError, ok, parseBody, route } from '@/lib/http';
import { medicationFields } from '@/lib/validation';

async function findOwned(userId: string, id: string) {
  const med = await db.query.medications.findFirst({
    where: and(eq(medications.id, id), eq(medications.userId, userId)),
  });
  if (!med) throw new ApiError(404, 'NOT_FOUND', 'Medicamento não encontrado.');
  return med;
}

export const GET = route(async (req, ctx: RouteContext<'/api/medications/[id]'>) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  return ok({ medication: toMedicationDto(await findOwned(user.id, id)) });
});

const patchSchema = z.object(medicationFields).partial();

export const PATCH = route(async (req, ctx: RouteContext<'/api/medications/[id]'>) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const current = await findOwned(user.id, id);
  const body = await parseBody(req, patchSchema);

  const { times, ...rest } = body;
  if (Object.keys(body).length === 0) return ok({ medication: toMedicationDto(current) });

  const remaining = rest.remaining ?? current.remaining;
  const total = Math.max(rest.total ?? current.total, remaining);

  const [med] = await db
    .update(medications)
    .set({ ...rest, total, ...(times ? { times: times.join(',') } : {}) })
    .where(eq(medications.id, id))
    .returning();
  return ok({ medication: toMedicationDto(med) });
});

export const DELETE = route(async (req, ctx: RouteContext<'/api/medications/[id]'>) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  await findOwned(user.id, id);
  await db.delete(medications).where(eq(medications.id, id));
  return new Response(null, { status: 204 });
});