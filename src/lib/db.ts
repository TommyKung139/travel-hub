import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getDb } from '@/lib/firebase';
import { tr } from '@/lib/i18n';
import type { Itinerary, Member, Trip } from '@/lib/types';

/* Firestore layout (see firestore.rules):
 *   trips/{tripId}                       trip details + join_code
 *   trips/{tripId}/members/{uid}         who is on the trip (role, display_name)
 *   trips/{tripId}/flights|hotels|places/{id}
 *   trips/{tripId}/checklist/{uid}       { done: [itemId, ...] } per person
 *   joinCodes/{CODE}                     { trip_id }  lets a friend find a trip by its code
 *   users/{uid}/memberships/{tripId}     the list behind "My trips"
 */

export type SubName = 'flights' | 'hotels' | 'places';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function makeCode(): string {
  const a = new Uint32Array(6);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => ALPHABET[n % ALPHABET.length]).join('');
}

export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

export function errCode(e: unknown): string {
  return typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
}

export function errMsg(e: unknown): string {
  const code = errCode(e);
  if (code === 'permission-denied') return tr('err.permission');
  if (code === 'unavailable') return tr('err.unavailable');
  return e instanceof Error ? e.message : tr('err.generic');
}

// ───────────── trips ─────────────

export type TripInput = {
  name: string;
  origin: string | null;
  destination: string;
  destination_code: string | null;
  start_date: string | null;
  end_date: string | null;
};

export async function createTrip(user: User, displayName: string, input: TripInput): Promise<string> {
  const db = getDb();
  let lastErr: unknown;
  // A code collision makes the batch fail (join codes are create-only), so just try a new one.
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeCode();
    const tripRef = doc(collection(db, 'trips'));
    const batch = writeBatch(db);
    batch.set(tripRef, {
      ...input,
      join_code: code,
      created_by: user.uid,
      created_at: serverTimestamp(),
    });
    batch.set(doc(db, 'trips', tripRef.id, 'members', user.uid), {
      role: 'owner',
      display_name: displayName,
      joined_at: serverTimestamp(),
    });
    batch.set(doc(db, 'joinCodes', code), { trip_id: tripRef.id, created_by: user.uid });
    try {
      await batch.commit();
      await setDoc(doc(db, 'users', user.uid, 'memberships', tripRef.id), {
        trip_id: tripRef.id,
        joined_at: serverTimestamp(),
      });
      return tripRef.id;
    } catch (e) {
      lastErr = e;
      if (errCode(e) !== 'permission-denied') throw e;
    }
  }
  throw lastErr;
}

export async function getTrip(id: string): Promise<Trip | null> {
  try {
    const snap = await getDoc(doc(getDb(), 'trips', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Trip) : null;
  } catch (e) {
    if (errCode(e) === 'permission-denied') return null; // not a member (or no longer)
    throw e;
  }
}

export async function listMyTrips(uid: string): Promise<Trip[]> {
  const links = await getDocs(collection(getDb(), 'users', uid, 'memberships'));
  const trips = await Promise.all(links.docs.map((d) => getTrip(d.id)));
  return trips
    .filter((t): t is Trip => t !== null)
    .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''));
}

export async function updateTrip(id: string, fields: Partial<TripInput>): Promise<void> {
  await updateDoc(doc(getDb(), 'trips', id), fields);
}

export async function joinTripByCode(user: User, displayName: string, raw: string): Promise<string> {
  const db = getDb();
  const code = cleanCode(raw);
  if (code.length < 4) throw new Error(tr('err.codeShort'));

  const codeSnap = await getDoc(doc(db, 'joinCodes', code));
  if (!codeSnap.exists()) throw new Error(tr('err.codeNotFound'));
  const tripId = codeSnap.data().trip_id as string;

  const memberRef = doc(db, 'trips', tripId, 'members', user.uid);
  const existing = await getDoc(memberRef);
  if (!existing.exists()) {
    await setDoc(memberRef, {
      role: 'member',
      display_name: displayName,
      code, // proves you know the code; checked by firestore.rules
      joined_at: serverTimestamp(),
    });
  }
  await setDoc(doc(db, 'users', user.uid, 'memberships', tripId), {
    trip_id: tripId,
    joined_at: serverTimestamp(),
  });
  return tripId;
}

export async function listMembers(tripId: string): Promise<Member[]> {
  const snap = await getDocs(collection(getDb(), 'trips', tripId, 'members'));
  return snap.docs
    .map((d) => ({ uid: d.id, role: d.data().role as string, display_name: (d.data().display_name as string) ?? 'Traveler' }))
    .sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : a.display_name.localeCompare(b.display_name)));
}

export async function leaveTrip(tripId: string, uid: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'trips', tripId, 'checklist', uid)).catch(() => {});
  await deleteDoc(doc(db, 'trips', tripId, 'members', uid));
  await deleteDoc(doc(db, 'users', uid, 'memberships', tripId));
}

// Firestore doesn't delete sub-collections with the parent, so clear them first.
// Order matters: the owner has to stay a member until the content is gone.
export async function deleteTrip(trip: Trip, uid: string): Promise<void> {
  const db = getDb();
  for (const name of ['flights', 'hotels', 'places', 'checklist', 'itinerary'] as const) {
    const snap = await getDocs(collection(db, 'trips', trip.id, name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
  const members = await getDocs(collection(db, 'trips', trip.id, 'members'));
  await Promise.all(members.docs.filter((d) => d.id !== uid).map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'joinCodes', trip.join_code));
  await deleteDoc(doc(db, 'trips', trip.id, 'members', uid));
  await deleteDoc(doc(db, 'trips', trip.id));
  await deleteDoc(doc(db, 'users', uid, 'memberships', trip.id));
  // Other members keep a dead link in their list; listMyTrips skips it.
}

// ───────────── flights / hotels / places ─────────────

export async function listSub<T extends { id: string }>(tripId: string, name: SubName): Promise<T[]> {
  const snap = await getDocs(collection(getDb(), 'trips', tripId, name));
  return snap.docs.map((d) => ({ id: d.id, trip_id: tripId, ...d.data() }) as unknown as T);
}

export async function addSub(
  tripId: string,
  name: SubName,
  user: User,
  displayName: string,
  data: Record<string, string | number | null>
): Promise<void> {
  await addDoc(collection(getDb(), 'trips', tripId, name), {
    ...data,
    added_by: user.uid,
    added_by_name: displayName,
    created_at: serverTimestamp(),
  });
}

export async function removeSub(tripId: string, name: SubName, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'trips', tripId, name, id));
}

// ───────────── checklist (per person) ─────────────

export async function loadChecklist(tripId: string, uid: string): Promise<string[]> {
  const snap = await getDoc(doc(getDb(), 'trips', tripId, 'checklist', uid));
  return snap.exists() ? ((snap.data().done as string[] | undefined) ?? []) : [];
}

export async function setChecklistItem(tripId: string, uid: string, itemId: string, checked: boolean): Promise<void> {
  await setDoc(
    doc(getDb(), 'trips', tripId, 'checklist', uid),
    { done: checked ? arrayUnion(itemId) : arrayRemove(itemId) },
    { merge: true }
  );
}

// ───────────── itinerary (one shared plan per trip) ─────────────
// Saved as a JSON string so nested lists can't trip over Firestore's array rules.

export async function loadItinerary(tripId: string): Promise<Itinerary | null> {
  const snap = await getDoc(doc(getDb(), 'trips', tripId, 'itinerary', 'main'));
  if (!snap.exists()) return null;
  try {
    return JSON.parse(snap.data().json as string) as Itinerary;
  } catch {
    return null;
  }
}

export async function saveItinerary(tripId: string, uid: string, plan: Itinerary): Promise<void> {
  await setDoc(doc(getDb(), 'trips', tripId, 'itinerary', 'main'), {
    json: JSON.stringify(plan),
    updated_by: uid,
    updated_at: serverTimestamp(),
  });
}
