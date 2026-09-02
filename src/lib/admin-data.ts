import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, firebaseReady } from "./firebase";

export type WithId<T> = T & { id: string };

export function useCollectionData<T extends object>(name: string) {
  const [items, setItems] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      setError("Firebase API key missing");
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, name), orderBy("createdAt", "desc")),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [name]);

  const add = useCallback(
    async (data: T) => {
      await addDoc(collection(db, name), { ...data, createdAt: Date.now() });
    },
    [name],
  );

  const update = useCallback(
    async (id: string, data: Partial<T>) => {
      await updateDoc(doc(db, name, id), data as Record<string, unknown>);
    },
    [name],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteDoc(doc(db, name, id));
    },
    [name],
  );

  return { items, loading, error, add, update, remove };
}

export function useDocData<T extends object>(path: string, id: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      setError("Firebase API key missing");
      return;
    }
    const unsub = onSnapshot(
      doc(db, path, id),
      (snap) => {
        if (snap.exists()) setData({ ...fallback, ...(snap.data() as T) });
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, id]);

  const save = useCallback(
    async (value: Partial<T>) => {
      await setDoc(doc(db, path, id), { ...value, updatedAt: Date.now() }, { merge: true });
    },
    [path, id],
  );

  return { data, loading, error, save, setLocal: setData };
}

export type UploadedFile = {
  name: string;
  url: string;
  path: string;
  type: string;
};

export async function uploadFile(folder: string, file: File): Promise<UploadedFile> {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { name: file.name, url, path, type: file.type };
}

export async function removeFile(path: string) {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    /* file may already be gone */
  }
}
