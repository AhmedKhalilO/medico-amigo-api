import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// SQLite pour le développement. Pour la production, passez à PostgreSQL / Turso
// (même logique, seuls l'import `drizzle-orm/...` et le client changent).

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  doctorPhone: text('doctor_phone'),
  createdAt: createdAt(),
});

export const medications = sqliteTable(
  'medications',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // ex. "Metformina 850 mg"
    subtitle: text('subtitle').notNull().default(''), // ex. "Comprimidos · 2 por dia"
    kind: text('kind').notNull(), // tablet-blue | tablet-green | syrup
    remaining: integer('remaining').notNull(),
    total: integer('total').notNull(),
    unit: text('unit').notNull().default('restantes'), // restantes | ml
    dosePerTake: integer('dose_per_take').notNull().default(1),
    times: text('times').notNull().default(''), // horaires CSV : "08:00,23:00"
    expiry: text('expiry'),
    createdAt: createdAt(),
  },
  (t) => [index('medications_user_idx').on(t.userId)]
);

// status : IN_REVIEW -> APPROVED -> READY -> COLLECTED
export const prescriptionRequests = sqliteTable(
  'prescription_requests',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    medicationId: text('medication_id').references(() => medications.id, { onDelete: 'set null' }),
    medicationName: text('medication_name').notNull(),
    status: text('status').notNull().default('IN_REVIEW'),
    createdAt: createdAt(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (t) => [index('requests_user_status_idx').on(t.userId, t.status)]
);

export const doseLogs = sqliteTable(
  'dose_logs',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    medicationId: text('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    takenAt: integer('taken_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('doses_user_taken_idx').on(t.userId, t.takenAt)]
);

export type User = typeof users.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type PrescriptionRequest = typeof prescriptionRequests.$inferSelect;