'use client';

import { useEffect, useState } from 'react';

export function useCheckAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const validateLogin = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8080/movie/get/page/1', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Erro ao validar token:', error);
        setIsLoggedIn(false);
        localStorage.removeItem('authToken');
      }
    };

    validateLogin();
  }, []);

  return isLoggedIn;
}
