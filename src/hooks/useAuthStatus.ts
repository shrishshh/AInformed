import { useState, useEffect, useCallback } from 'react';

export function useAuthStatus() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const checkLoginStatus = useCallback(() => {
    if (typeof window !== 'undefined' && mounted) {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      checkLoginStatus();

      const handleStorageChange = () => {
        checkLoginStatus();
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [checkLoginStatus, mounted]);

  const login = useCallback(() => {
    if (mounted) {
      setIsLoggedIn(true);
    }
  }, [mounted]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined' && mounted) {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
    }
  }, [mounted]);

  return { isLoggedIn: mounted ? isLoggedIn : false, login, logout };
} 