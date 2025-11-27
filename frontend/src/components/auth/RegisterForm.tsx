import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: 'NG' | 'KE';
}

interface Props {
  onSuccess: (email: string) => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterData>();
  
  const password = watch('password');

  const onSubmit = async (data: RegisterData) => {
    setLoading(true);
    try {
      await authAPI.register(data);
      toast.success('Registration successful! Check your email for verification code.');
      onSuccess(data.email);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Create BPay Account</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              {...register('firstName', { required: 'First name required' })}
              placeholder="First Name"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
          </div>
          <div>
            <input
              {...register('lastName', { required: 'Last name required' })}
              placeholder="Last Name"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <input
            {...register('email', { required: 'Email required', pattern: /^\S+@\S+$/i })}
            type="email"
            placeholder="Email Address"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        <div>
          <input
            {...register('phoneNumber', { required: 'Phone number required' })}
            placeholder="Phone Number"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <div className="relative">
            <select
              {...register('country', { required: 'Country required' })}
              className="w-full p-3 pl-12 border rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
            >
              <option value="">Select Country</option>
              <option value="NG">Nigeria</option>
              <option value="KE">Kenya</option>
            </select>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <img 
                src="https://flagcdn.com/w20/ng.png" 
                alt="Nigeria" 
                className="w-5 h-auto"
                style={{ display: 'none' }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50" 
                 onClick={() => document.querySelector('select[name="country"]').value = 'NG'}>
              <img src="https://flagcdn.com/w20/ng.png" alt="Nigeria" className="w-5 h-auto" />
              <span className="text-sm">Nigeria</span>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                 onClick={() => document.querySelector('select[name="country"]').value = 'KE'}>
              <img src="https://flagcdn.com/w20/ke.png" alt="Kenya" className="w-5 h-auto" />
              <span className="text-sm">Kenya</span>
            </div>
          </div>
          
          {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
        </div>

        <div className="relative">
          <input
            {...register('password', { required: 'Password required', minLength: 8 })}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min 8 characters)"
            className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>

        <div className="relative">
          <input
            {...register('confirmPassword', { 
              required: 'Please confirm password',
              validate: value => value === password || 'Passwords do not match'
            })}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}