import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm
            onSuccess={onAuthSuccess}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm
            onSuccess={onAuthSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
      
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10"></div>
        <div className="absolute top-40 -left-32 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-10"></div>
        <div className="absolute -bottom-40 right-20 w-80 h-80 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-10"></div>
      </div>
    </div>
  );
}
