import { connection } from 'next/server';
import { ok, route } from '@/lib/http';

/** Numéros publics utilisés par les intents d'appel de l'app (112, SNS 24). */
export const GET = route(async () => {
  await connection(); // lit l'environnement à chaque requête, pas au build
  return ok({
    emergencyNumber: process.env.EMERGENCY_NUMBER ?? '112',
    sns24Number: process.env.SNS24_NUMBER ?? '808242424',
  });
});