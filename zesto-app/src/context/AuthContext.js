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

          if (profile.role === 'BUSINESS_OWNER') {
            api
              .merchantLogin(profile.name, profile.email)
              .then(async (res) => {
                const fresh = { ...res.owner, role: 'BUSINESS_OWNER' };
                setUser(fresh);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
              })
              .catch(() => {});
          } else {
            api
              .login(profile.name, profile.email)
              .then(async (fresh) => {
                const normalized = { ...fresh, role: 'CUSTOMER' };
                setUser(normalized);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
              })
              .catch(() => {});
          }
        }
      } catch (e) {
        // ignore storage errors
      }
      setRestoring(false);
    })();
  }, []);

  const signIn = useCallback(async (profile) => {
    const normalized = { ...profile, role: profile.role || 'CUSTOMER' };
    setUser(normalized);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const isMerchant = user?.role === 'BUSINESS_OWNER';

  return (
    <AuthContext.Provider value={{ user, isMerchant, restoring, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
