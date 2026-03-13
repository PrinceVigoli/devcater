import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate user from token on page load
  useEffect(() => {
    if (authAPI.isLoggedIn()) {
      authAPI.me()
        .then(({ user }) => setUser(user))
        .catch(() => authAPI.logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authAPI.login({ email, password });
    authAPI.saveToken(token);
    setUser(user);
    return user;
  };

  const register = async (name, email, password, phone) => {
    const { token, user } = await authAPI.register({ name, email, password, phone });
    authAPI.saveToken(token);
    setUser(user);
    return user;
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
