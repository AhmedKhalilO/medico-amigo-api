import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from '@/db';
import { publicUser, requireUser } from '@/lib/auth';
import { ok, parseBody, route } from '@/lib/http';

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return ok({ user: publicUser(user) });
});

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    doctorPhone: z.string().trim().min(3).max(20).nullable(),
  })
  .partial();

export const PATCH = route(async (req) => {
  const user = await requireUser(req);
  const body = await parseBody(req, patchSchema);
  if (Object.keys(body).length === 0) return ok({ user: publicUser(user) });

  const [updated] = await db.update(users).set(body).where(eq(users.id, user.id)).returning();
  return ok({ user: publicUser(updated) });
});