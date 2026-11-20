import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const STORAGE_KEY = 'zesto_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const profile = JSON.parse(saved);
          setUser(profile);

          // The Java server keeps users in memory, so re-register quietly
          // (also refreshes loyalty points) in case the server was restarted.
          api
            .login(profile.name, profile.email)
            .then(async (fresh) => {
              setUser(fresh);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            })
            .catch(() => {});
        }
      } catch (e) {
        // ignore storage errors
      }
      setRestoring(false);
    })();
  }, []);

  const signIn = useCallback(async (profile) => {
    setUser(profile);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, restoring, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);