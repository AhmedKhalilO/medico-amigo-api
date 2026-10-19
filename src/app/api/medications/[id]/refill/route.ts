import { and, eq, ne } from 'drizzle-orm';
import { db, medications, prescriptionRequests } from '@/db';
import { requireUser } from '@/lib/auth';
import { toRequestDto } from '@/lib/dto';
import { ApiError, ok, route } from '@/lib/http';

/** « Encomendar reposição » : crée une demande de renouvellement pour ce médicament. */
export const POST = route(async (req, ctx: RouteContext<'/api/medications/[id]/refill'>) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;

  const med = await db.query.medications.findFirst({
    where: and(eq(medications.id, id), eq(medications.userId, user.id)),
  });
  if (!med) throw new ApiError(404, 'NOT_FOUND', 'Medicamento não encontrado.');

  const pending = await db.query.prescriptionRequests.findFirst({
    where: and(
      eq(prescriptionRequests.userId, user.id),
      eq(prescriptionRequests.medicationId, id),
      ne(prescriptionRequests.status, 'COLLECTED')
    ),
  });
  if (pending) {
    throw new ApiError(409, 'ALREADY_REQUESTED', 'Já existe um pedido de reposição em curso para este medicamento.');
  }

  const [request] = await db
    .insert(prescriptionRequests)
    .values({ userId: user.id, medicationId: med.id, medicationName: med.name })
    .returning();
  return ok({ request: toRequestDto(request) }, 201);
});