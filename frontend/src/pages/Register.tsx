import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { RegisterCredentials } from '../types';

const schema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
}).required();

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterCredentials & { confirmPassword: string }>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterCredentials & { confirmPassword: string }) => {
    setIsLoading(true);
    try {
      await registerUser(data.email, data.password, data.name);
      addNotification({
        type: 'success',
        title: 'Registration Successful',
        message: 'Account created successfully! Please sign in.',
      });
      navigate('/login');
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error.response?.data?.error || 'Failed to create account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full btn-lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
