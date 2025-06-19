import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { validateEmail, validatePassword, generateUsername } from '../../lib/utils';

interface RegisterFormData {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const register = useAuthStore(state => state.register);
  
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<RegisterFormData>();

  const watchEmail = watch('email');
  const watchPassword = watch('password');

  // Auto-generate username from email
  React.useEffect(() => {
    if (watchEmail && validateEmail(watchEmail)) {
      const username = generateUsername(watchEmail);
      setValue('username', username);
    }
  }, [watchEmail, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const success = await register({
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        password: data.password
      });
      
      if (success) {
        onSuccess?.();
      } else {
        setError('An account with this email or username already exists');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join the discussion community</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...registerField('email', {
                required: 'Email is required',
                validate: (value) => validateEmail(value) || 'Please enter a valid email address'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...registerField('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Username can only contain letters, numbers, and underscores'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Choose a username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              {...registerField('displayName', {
                required: 'Display name is required',
                minLength: { value: 2, message: 'Display name must be at least 2 characters' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Your full name"
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...registerField('password', {
                  required: 'Password is required',
                  validate: (value) => {
                    const validation = validatePassword(value);
                    return validation.isValid || validation.errors[0];
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...registerField('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watchPassword || 'Passwords do not match'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-green-600 hover:text-green-500"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
