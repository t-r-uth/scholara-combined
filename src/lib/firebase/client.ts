import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

let app: FirebaseApp | undefined
let authInstance: Auth | undefined

function getFirebaseApp(): FirebaseApp {
  if (app) return app
  app = getApps().length
    ? getApps()[0]!
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      })
  return app
}

/** Lazy Firebase Auth client — avoids initializing during static prerender/build. */
export function getClientAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getFirebaseApp())
  return authInstance
}
