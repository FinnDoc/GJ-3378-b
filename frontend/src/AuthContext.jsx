import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, loginRequest } from './api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'news-portal-token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    if (!token) {
      setUser(null);
      setIsReady(true);
      return () => {
        active = false;
      };
    }

    setIsReady(false);
    apiRequest('/auth/me')
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        if (active) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const signIn = useCallback(async (username, password) => {
    const result = await loginRequest(username, password);
    localStorage.setItem(TOKEN_KEY, result.access_token);
    setIsReady(false);
    setToken(result.access_token);
    const profile = await apiRequest('/auth/me');
    setUser(profile);
    setIsReady(true);
    return profile;
  }, []);

  const register = useCallback(async (username, password) => {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return signIn(username, password);
  }, [signIn]);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIsReady(true);
  }, []);

  const value = useMemo(
    () => ({ user, token, isReady, signIn, signOut, register }),
    [user, token, isReady, signIn, signOut, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен вызываться внутри AuthProvider');
  return context;
}
