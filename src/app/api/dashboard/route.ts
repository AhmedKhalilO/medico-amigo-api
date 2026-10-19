import { and, count, eq, gte, ne, or } from 'drizzle-orm';
import { db, doseLogs, medications, prescriptionRequests } from '@/db';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Données de l'écran d'accueil.
 * Paramètre optionnel ?since=<ISO> : début de la journée LOCALE du téléphone
 * (ex. new Date(new Date().setHours(0,0,0,0)).toISOString()).
 */
export const GET = route(async (req) => {
  const user = await requireUser(req);

  const sinceParam = new URL(req.url).searchParams.get('since');
  let dayStart = sinceParam ? new Date(sinceParam) : new Date();
  if (Number.isNaN(dayStart.getTime())) dayStart = new Date();
  if (!sinceParam) dayStart.setUTCHours(0, 0, 0, 0);
  const seriesStart = new Date(dayStart.getTime() - 6 * DAY);

  const [meds, takenToday, requests] = await Promise.all([
    db.select().from(medications).where(eq(medications.userId, user.id)),
    db
      .select({ medicationId: doseLogs.medicationId, n: count() })
      .from(doseLogs)
      .where(and(eq(doseLogs.userId, user.id), gte(doseLogs.takenAt, dayStart)))
      .groupBy(doseLogs.medicationId),
    db
      .select()
      .from(prescriptionRequests)
      .where(
        and(
          eq(prescriptionRequests.userId, user.id),
          or(ne(prescriptionRequests.status, 'COLLECTED'), gte(prescriptionRequests.createdAt, seriesStart))
        )
      ),
  ]);

  // Prochaine prise : la k-ième prise du jour correspond au k-ième horaire du médicament.
  const taken = new Map(takenToday.map((t) => [t.medicationId, t.n]));
  const candidates = meds
    .filter((m) => m.times && m.remaining > 0)
    .map((m) => {
      const times = m.times.split(',').sort();
      const done = taken.get(m.id) ?? 0;
      const tomorrow = done >= times.length;
      return { medicationId: m.id, name: m.name, time: times[tomorrow ? 0 : done], tomorrow };
    })
    .sort((a, b) => Number(a.tomorrow) - Number(b.tomorrow) || a.time.localeCompare(b.time));

  const active = requests.filter((r) => r.status !== 'COLLECTED');
  const countBy = (status: string) => active.filter((r) => r.status === status).length;

  // Demandes créées par jour sur 7 jours (le dernier élément = aujourd'hui).
  const series = Array.from({ length: 7 }, (_, i) => {
    const from = seriesStart.getTime() + i * DAY;
    return requests.filter((r) => r.createdAt.getTime() >= from && r.createdAt.getTime() < from + DAY).length;
  });

  return ok({
    user: { name: user.name },
    nextDose: candidates[0] ?? null,
    requests: {
      active: active.length,
      inReview: countBy('IN_REVIEW'),
      approved: countBy('APPROVED'),
      ready: countBy('READY'),
      series,
    },
    readyMedications: active
      .filter((r) => r.status === 'READY')
      .map((r) => ({ requestId: r.id, name: r.medicationName })),
    lowStock: meds.filter((m) => m.remaining / m.total < 0.35).length,
  });
});