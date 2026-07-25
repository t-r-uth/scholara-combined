import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, FieldPath, type Firestore } from 'firebase-admin/firestore'

function parsePrivateKey(raw: string): string {
  let key = raw.trim()
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1)
  }
  return key.replace(/\\n/g, '\n')
}

function ensureAdminApp(): App {
  if (getApps().length) return getApps()[0]!

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your deployment environment (e.g. Vercel → Settings → Environment Variables).'
    )
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: parsePrivateKey(rawKey),
    }),
  })
}

let authInstance: Auth | undefined
let dbInstance: Firestore | undefined

/** Lazy Firebase Auth admin — safe when env vars are missing at build time. */
export function getAdminAuth(): Auth {
  if (!authInstance) authInstance = getAuth(ensureAdminApp())
  return authInstance
}

/** Lazy Firestore admin — safe when env vars are missing at build time. */
export function getAdminDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(ensureAdminApp())
  return dbInstance
}

/** @deprecated Use getAdminAuth() — kept for gradual migration */
export const adminAuth = {
  verifyIdToken: (...args: Parameters<Auth['verifyIdToken']>) =>
    getAdminAuth().verifyIdToken(...args),
  createSessionCookie: (...args: Parameters<Auth['createSessionCookie']>) =>
    getAdminAuth().createSessionCookie(...args),
  verifySessionCookie: (...args: Parameters<Auth['verifySessionCookie']>) =>
    getAdminAuth().verifySessionCookie(...args),
  createCustomToken: (...args: Parameters<Auth['createCustomToken']>) =>
    getAdminAuth().createCustomToken(...args),
  createUser: (...args: Parameters<Auth['createUser']>) =>
    getAdminAuth().createUser(...args),
  updateUser: (...args: Parameters<Auth['updateUser']>) =>
    getAdminAuth().updateUser(...args),
  deleteUser: (...args: Parameters<Auth['deleteUser']>) =>
    getAdminAuth().deleteUser(...args),
}

export function batchGetByIds(
  collection: string,
  ids: string[],
): Promise<FirebaseFirestore.QuerySnapshot[]> {
  const queries: Promise<FirebaseFirestore.QuerySnapshot>[] = []
  for (let i = 0; i < ids.length; i += 30) {
    queries.push(
      getAdminDb().collection(collection).where(FieldPath.documentId(), 'in', ids.slice(i, i + 30)).get(),
    )
  }
  return Promise.all(queries)
}

/** @deprecated Use getAdminDb() — kept for gradual migration */
export const db = {
  collection: (...args: Parameters<Firestore['collection']>) =>
    getAdminDb().collection(...args),
  batch: (...args: Parameters<Firestore['batch']>) => getAdminDb().batch(...args),
  runTransaction: (...args: Parameters<Firestore['runTransaction']>) =>
    getAdminDb().runTransaction(...args),
}
