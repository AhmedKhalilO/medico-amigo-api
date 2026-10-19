import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { db, users, type User } from '@/db';
import { ApiError } from './http';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET manquant ou trop court (32 caractères minimum).');
  }
  return new TextEncoder().encode(s);
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function signToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

/** Vérifie le jeton « Authorization: Bearer … » et renvoie l'utilisateur, sinon 401. */
export async function requireUser(req: Request): Promise<User> {
  const header = req.headers.get('authorization');
  const token = header?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Sessão em falta. Inicie sessão.');

  let userId: string | undefined;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    userId = payload.sub;
  } catch {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Sessão expirada. Inicie sessão novamente.');
  }

  const user = userId ? await db.query.users.findFirst({ where: eq(users.id, userId) }) : null;
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Sessão inválida.');
  return user;
}

/** Vérifie la clé admin (en-tête x-admin-key) avec une comparaison à temps constant. */
export function requireAdmin(req: Request) {
  const expected = process.env.ADMIN_KEY ?? '';
  const given = req.headers.get('x-admin-key') ?? '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError(403, 'FORBIDDEN', 'Acesso reservado à administração.');
  }
}

export const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  doctorPhone: u.doctorPhone,
});