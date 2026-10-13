import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] ?? "",
  authDomain: "c-motau-profile.firebaseapp.com",
  projectId: "c-motau-profile",
  storageBucket: "c-motau-profile.firebasestorage.app",
  messagingSenderId: "532102197453",
  appId: "1:532102197453:web:fe36fbb65b47de4d3b3984",
};

export const firebaseReady = Boolean(firebaseConfig.apiKey);

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app, "myprofilewebapp");
export const storage = getStorage(app);
storage.maxUploadRetryTime = 60_000;
storage.maxOperationRetryTime = 30_000;
