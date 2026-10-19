import type { Medication, PrescriptionRequest } from '@/db';

export const toMedicationDto = (m: Medication) => ({
  id: m.id,
  name: m.name,
  subtitle: m.subtitle,
  kind: m.kind,
  remaining: m.remaining,
  total: m.total,
  unit: m.unit,
  dosePerTake: m.dosePerTake,
  times: m.times ? m.times.split(',') : [],
  expiry: m.expiry,
  createdAt: m.createdAt.toISOString(),
});

export const toRequestDto = (r: PrescriptionRequest) => ({
  id: r.id,
  medicationId: r.medicationId,
  medicationName: r.medicationName,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

export const REQUEST_STATUSES = ['IN_REVIEW', 'APPROVED', 'READY', 'COLLECTED'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];