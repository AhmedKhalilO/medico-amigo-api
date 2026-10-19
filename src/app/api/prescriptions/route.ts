import { desc, eq } from 'drizzle-orm';
import { db, prescriptionRequests } from '@/db';
import { requireUser } from '@/lib/auth';
import { toRequestDto } from '@/lib/dto';
import { ok, route } from '@/lib/http';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  const rows = await db
    .select()
    .from(prescriptionRequests)
    .where(eq(prescriptionRequests.userId, user.id))
    .orderBy(desc(prescriptionRequests.createdAt))
    .limit(100);
  return ok({ requests: rows.map(toRequestDto) });
});