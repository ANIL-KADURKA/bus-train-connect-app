import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBKkPxmyBUbTBrFiQA2JusLFOBXGQKVzKg",
  authDomain: "hi-bus-connect.firebaseapp.com",
  projectId: "hi-bus-connect",
  storage_bucket: "hi-bus-connect.firebasestorage.app",
  messagingSenderId: "1023987061561",
  appId: "1:1023987061561:android:cb90f60f269901088f0ee8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getApps().length
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });

export default app;
