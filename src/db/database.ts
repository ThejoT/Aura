import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    duration_sec INTEGER,
    paddles_on INTEGER NOT NULL,
    vibration_on INTEGER NOT NULL,
    rotation_on INTEGER NOT NULL,
    paddles_intensity INTEGER NOT NULL,
    vibration_intensity INTEGER NOT NULL,
    rotation_intensity INTEGER NOT NULL,
    placement TEXT NOT NULL,
    quiet_mode INTEGER NOT NULL,
    baseline_pain INTEGER,
    stop_reason TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    at_minutes INTEGER NOT NULL,
    due_at INTEGER NOT NULL,
    rating INTEGER,
    tags TEXT NOT NULL DEFAULT '[]',
    skipped INTEGER NOT NULL DEFAULT 0,
    responded_at INTEGER
  );`,
  `CREATE INDEX IF NOT EXISTS idx_follow_ups_session ON follow_ups(session_id);`,
  `CREATE TABLE IF NOT EXISTS headache_days (
    date TEXT PRIMARY KEY,
    severity INTEGER NOT NULL,
    duration_hours REAL,
    notes TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS diary_entries (
    date TEXT PRIMARY KEY,
    sleep_hours REAL,
    caffeine_servings REAL,
    screen_time_hours REAL,
    stress INTEGER,
    cycle_day INTEGER,
    skipped_meals INTEGER NOT NULL DEFAULT 0,
    pressure_hpa REAL,
    temperature_c REAL,
    weather_fetched_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS medication_events (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    name TEXT,
    logged_at INTEGER NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_medication_events_date ON medication_events(date);`,
  `CREATE TABLE IF NOT EXISTS research_responses (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    ease_of_donning INTEGER NOT NULL,
    comfort INTEGER NOT NULL,
    perceived_pressure INTEGER NOT NULL,
    perceived_soothing INTEGER NOT NULL,
    discreteness INTEGER NOT NULL,
    free_text TEXT NOT NULL DEFAULT ''
  );`,
  `CREATE TABLE IF NOT EXISTS midas_results (
    id TEXT PRIMARY KEY,
    completed_at INTEGER NOT NULL,
    q1 INTEGER NOT NULL,
    q2 INTEGER NOT NULL,
    q3 INTEGER NOT NULL,
    q4 INTEGER NOT NULL,
    q5 INTEGER NOT NULL,
    headache_days_3mo INTEGER NOT NULL,
    avg_pain_3mo REAL NOT NULL,
    total_score INTEGER NOT NULL,
    grade INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,
];

let dbPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Opens (or returns the already-open) local SQLite database and applies the
 * schema. Local-first, on-device only — nothing here ever talks to a
 * network. There is deliberately no remote sync path in this module.
 */
export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabase({ name: 'aura.db', location: 'default' }).then(
      async db => {
        await db.transaction(tx => {
          SCHEMA_STATEMENTS.forEach(stmt => tx.executeSql(stmt));
        });
        return db;
      },
    );
  }
  return dbPromise;
}

export async function runQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const [result] = await db.executeSql(sql, params);
  const rows: T[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(result.rows.item(i));
  }
  return rows;
}

export async function runExec(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.executeSql(sql, params);
}
