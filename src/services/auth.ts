import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { User } from '../types/models.js';
import type { LoginInput, RegisterInput } from '../validation/schemas.js';
import { query } from '../db/connection.js';
import { AppError } from '../errors.js';

export const AUTH_COOKIE = 'token';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const SALT_ROUNDS = 12;
const UNIQUE_VIOLATION = '23505';

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: User['role'];
  password_hash: string;
  created_at: Date;
};

const toUser = (row: Omit<UserRow, 'password_hash'>): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  createdAt: row.created_at.toISOString(),
});

// Throws AppError when the email is already registered
export const register = async (data: RegisterInput): Promise<User> => {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  try {
    const result = await query<Omit<UserRow, 'password_hash'>>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role, created_at`,
      [data.email, data.name, passwordHash],
    );
    return toUser(result.rows[0]);
  } catch (err) {
    if ((err as { code?: string }).code === UNIQUE_VIOLATION) {
      throw new AppError('EMAIL_TAKEN');
    }
    throw err;
  }
};

// Unknown email and wrong password return the same error, so the API doesn't reveal which emails have accounts
export const login = async (data: LoginInput): Promise<User> => {
  const result = await query<UserRow>(
    'SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = $1',
    [data.email],
  );
  const row = result.rows[0];

  if (!row || !(await bcrypt.compare(data.password, row.password_hash))) {
    throw new AppError('INVALID_CREDENTIALS');
  }

  return toUser(row);
};

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

// The raw token goes into the cookie; only its hash is stored, so deleting the row logs the session out
export const createSession = async (userId: string): Promise<string> => {
  const token = randomBytes(32).toString('base64url');

  await query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP + make_interval(secs => $3))`,
    [hashToken(token), userId, SESSION_TTL_SECONDS],
  );
  return token;
};

// Returns the user for a valid, unexpired session token, or null for anything else
export const findUserBySessionToken = async (token: string): Promise<User | null> => {
  const result = await query<Omit<UserRow, 'password_hash'>>(
    `SELECT u.id, u.email, u.name, u.role, u.created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
    [hashToken(token)],
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
};

export const deleteSession = async (token: string): Promise<void> => {
  await query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
};
