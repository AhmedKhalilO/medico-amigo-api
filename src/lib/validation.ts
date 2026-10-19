import { z } from 'zod';

export const MED_KINDS = ['tablet-blue', 'tablet-green', 'syrup'] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Champs d'un médicament, sans valeurs par défaut (réutilisés pour la création et le PATCH). */
export const medicationFields = {
  name: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(160),
  kind: z.enum(MED_KINDS),
  remaining: z.number().int().min(0).max(100000),
  total: z.number().int().min(1).max(100000),
  unit: z.enum(['restantes', 'ml']),
  dosePerTake: z.number().int().min(1).max(1000),
  times: z.array(z.string().regex(TIME_RE, 'Formato HH:MM')).max(12),
  expiry: z.string().trim().max(10).nullable(),
};