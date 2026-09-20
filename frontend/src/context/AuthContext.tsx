import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserSummary } from '../types';
import { getAttemptedQuestionIds } from '../services/api';

interface AuthContextType {
  user: UserSummary | null;
  isAdmin: boolean;
  login: (user: UserSummary) => void;
  logout: () => void;
  attemptedQuestionIds: Set<number>;
  refreshAttemptedQuestions: () => Promise<void>;
  markQuestionAttempted: (questionId: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [attemptedQuestionIds, setAttemptedQuestionIds] = useState<Set<number>>(new Set());

  const refreshAttemptedQuestions = async () => {
    if (!user) {
      setAttemptedQuestionIds(new Set());
      return;
    }
    try {
      const ids = await getAttemptedQuestionIds(user.id);
      setAttemptedQuestionIds(new Set(ids));
    } catch (e) {
      console.warn('Failed to load attempted questions:', e);
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      refreshAttemptedQuestions();
    } else {
      localStorage.removeItem('user');
      setAttemptedQuestionIds(new Set());
    }
  }, [user]);

  const login = (newUser: UserSummary) => {
    if (!newUser || !newUser.id) {
      console.warn('Invalid user passed to login:', newUser);
      return;
    }
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const markQuestionAttempted = (questionId: number) => {
    setAttemptedQuestionIds((prev) => new Set([...Array.from(prev), questionId]));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
        attemptedQuestionIds,
        refreshAttemptedQuestions,
        markQuestionAttempted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
