import { and, desc, eq, like, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db, medications } from '@/db';
import { requireUser } from '@/lib/auth';
import { toMedicationDto } from '@/lib/dto';
import { ok, parseBody, route } from '@/lib/http';
import { medicationFields } from '@/lib/validation';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  const params = new URL(req.url).searchParams;
  const q = params.get('q')?.trim();
  const kind = params.get('kind'); // "tablet" | "syrup" (optionnel)

  const conditions = [eq(medications.userId, user.id)];
  if (q) conditions.push(like(medications.name, `%${q}%`));
  if (kind === 'syrup') conditions.push(eq(medications.kind, 'syrup'));
  if (kind === 'tablet') conditions.push(ne(medications.kind, 'syrup'));

  const rows = await db
    .select()
    .from(medications)
    .where(and(...conditions))
    .orderBy(desc(medications.createdAt));

  return ok({ medications: rows.map(toMedicationDto) });
});

const createSchema = z.object({
  name: medicationFields.name,
  kind: medicationFields.kind,
  remaining: medicationFields.remaining,
  subtitle: medicationFields.subtitle.optional(),
  total: medicationFields.total.optional(),
  unit: medicationFields.unit.optional(),
  dosePerTake: medicationFields.dosePerTake.optional(),
  times: medicationFields.times.optional(),
  expiry: medicationFields.expiry.optional(),
});

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const body = await parseBody(req, createSchema);

  const [med] = await db
    .insert(medications)
    .values({
      userId: user.id,
      name: body.name,
      subtitle: body.subtitle ?? '',
      kind: body.kind,
      remaining: body.remaining,
      total: Math.max(body.total ?? body.remaining, body.remaining, 1),
      unit: body.unit ?? 'restantes',
      dosePerTake: body.dosePerTake ?? 1,
      times: (body.times ?? []).join(','),
      expiry: body.expiry ?? null,
    })
    .returning();

  return ok({ medication: toMedicationDto(med) }, 201);
});