import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedProfile = localStorage.getItem('staffProfile');
    const token = localStorage.getItem('staffToken');

    if (token && storedProfile) {
      setEmployee(JSON.parse(storedProfile));
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('staffToken', data.token);
    localStorage.setItem('staffProfile', JSON.stringify(data.employee));
    setEmployee(data.employee);
    return data.employee;
  }

  function logout() {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffProfile');
    setEmployee(null);
  }

  return (
    <AuthContext.Provider value={{ employee, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}