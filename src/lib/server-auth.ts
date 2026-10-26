// API routes (fare search, flight tracking) cost real quota, so only signed-in
// users may call them. The browser sends its Firebase ID token, and we ask
// Google's Identity Toolkit whether it is valid (no service account needed).
export async function verifyUser(req: Request): Promise<{ uid: string } | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !key) return null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { users?: { localId?: string }[] };
    const uid = json.users?.[0]?.localId;
    return uid ? { uid } : null;
  } catch {
    return null;
  }
}
