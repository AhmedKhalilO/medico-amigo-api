import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from '@/db';
import { hashPassword, publicUser, signToken } from '@/lib/auth';
import { ApiError, ok, parseBody, route } from '@/lib/http';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(8).max(100),
  doctorPhone: z.string().trim().min(3).max(20).optional(),
});

export const POST = route(async (req) => {
  const body = await parseBody(req, schema);

  const exists = await db.query.users.findFirst({ where: eq(users.email, body.email) });
  if (exists) throw new ApiError(409, 'EMAIL_TAKEN', 'Este email já está registado.');

  const [user] = await db
    .insert(users)
    .values({
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      doctorPhone: body.doctorPhone,
    })
    .returning();

  return ok({ token: await signToken(user.id), user: publicUser(user) }, 201);
});