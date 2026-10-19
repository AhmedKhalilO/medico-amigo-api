import { loadEnvConfig } from '@next/env';
import bcrypt from 'bcryptjs';
import { inArray } from 'drizzle-orm';

loadEnvConfig(process.cwd());

async function main() {
  // Import dynamique : DATABASE_URL doit être chargé avant la création du client.
  const { db, medications, prescriptionRequests, users } = await import('./index');

  // 1. Liste des emails à nettoyer avant d'insérer pour éviter les erreurs de doublons (UNIQUE)
  const emailsToSeed = ['marta@example.com', 'luis@example.com', 'ahmed@example.com'];
  await db.delete(users).where(inArray(users.email, emailsToSeed));

  console.log('Nettoyage des anciens utilisateurs terminé...');

  // Hachage du mot de passe commun pour les tests
  const passwordHash = await bcrypt.hash('medico1234', 10);
  const ago = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // ==========================================
  // USER 1 : MARTA
  // ==========================================
  const [marta] = await db
    .insert(users)
    .values({
      email: 'marta@example.com',
      name: 'Marta',
      passwordHash,
      doctorPhone: '+351210000000',
    })
    .returning();

  const [metformina, ambroxol, atorvastatina] = await db
    .insert(medications)
    .values([
      { userId: marta.id, name: 'Metformina 850 mg', subtitle: 'Comprimidos · 2 por dia', kind: 'tablet-blue', remaining: 12, total: 42, dosePerTake: 1, times: '08:00,23:00' },
      { userId: marta.id, name: 'Ambroxol 15 mg/5 ml', subtitle: 'Xarope · 10 ml por toma', kind: 'syrup', remaining: 120, total: 175, unit: 'ml', dosePerTake: 10, times: '09:00,21:00' },
      { userId: marta.id, name: 'Atorvastatina 20 mg', subtitle: 'Comprimidos · 1 por dia', kind: 'tablet-green', remaining: 28, total: 31, dosePerTake: 1, times: '22:00' },
    ])
    .returning();

  await db.insert(prescriptionRequests).values([
    { userId: marta.id, medicationId: metformina.id, medicationName: metformina.name, status: 'IN_REVIEW', createdAt: ago(0) },
    { userId: marta.id, medicationId: ambroxol.id, medicationName: ambroxol.name, status: 'APPROVED', createdAt: ago(2) },
    { userId: marta.id, medicationId: atorvastatina.id, medicationName: atorvastatina.name, status: 'READY', createdAt: ago(4) },
  ]);

  // ==========================================
  // USER 2 : LUIS
  // ==========================================
  const [luis] = await db
    .insert(users)
    .values({
      email: 'luis@bifront.pt',
      name: 'Luis',
      passwordHash,
      doctorPhone: '+351220000000',
    })
    .returning();

  const [paracetamol] = await db
    .insert(medications)
    .values([
      { userId: luis.id, name: 'Paracetamol 1000 mg', subtitle: 'Comprimidos · 3 por dia', kind: 'tablet-blue', remaining: 8, total: 20, dosePerTake: 1, times: '08:00,14:00,20:00' },
    ])
    .returning();

  await db.insert(prescriptionRequests).values([
    { userId: luis.id, medicationId: paracetamol.id, medicationName: paracetamol.name, status: 'IN_REVIEW', createdAt: ago(1) },
  ]);

  // ==========================================
  // USER 3 : AHMED
  // ==========================================
  const [ahmed] = await db
    .insert(users)
    .values({
      email: 'ahmed@gmail.com',
      name: 'Ahmed',
      passwordHash,
      doctorPhone: '+351230000000',
    })
    .returning();

  const [ibuprofeno] = await db
    .insert(medications)
    .values([
      { userId: ahmed.id, name: 'Ibuprofeno 600 mg', subtitle: 'Comprimidos · 1 por dia', kind: 'tablet-green', remaining: 30, total: 30, dosePerTake: 1, times: '12:00' },
    ])
    .returning();

  await db.insert(prescriptionRequests).values([
    { userId: ahmed.id, medicationId: ibuprofeno.id, medicationName: ibuprofeno.name, status: 'READY', createdAt: ago(3) },
  ]);

  console.log('\n🚀 Seed terminé avec succès !');
  console.log('-------------------------------------------');
  console.log('Compte 1 : marta@example.com / medico1234');
  console.log('Compte 2 : luis@bifront.pt / medico1234');
  console.log('Compte 3 : ahmed@gmail.com / medico1234');
}

main().catch((e) => {
  console.error('Erreur lors du Seed :', e);
  process.exit(1);
});
