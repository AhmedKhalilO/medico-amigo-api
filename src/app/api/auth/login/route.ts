import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from '@/db';
import { publicUser, signToken, verifyPassword } from '@/lib/auth';
import { ApiError, ok, parseBody, route } from '@/lib/http';

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100),
});

// Hash factice : on fait toujours une comparaison bcrypt, que l'email existe ou non.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

export const POST = route(async (req) => {
  const body = await parseBody(req, schema);

  const user = await db.query.users.findFirst({ where: eq(users.email, body.email) });
  const valid = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email ou palavra-passe incorretos.');
  }

  return ok({ token: await signToken(user.id), user: publicUser(user) });
});