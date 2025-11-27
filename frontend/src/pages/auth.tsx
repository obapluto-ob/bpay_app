import { useState } from 'react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import RegisterForm from '../components/auth/RegisterForm';
import LoginForm from '../components/auth/LoginForm';
import VerificationForm from '../components/auth/VerificationForm';
import BPayLogo from '../components/BPayLogo';
import { useDeviceTheme } from '../components/DeviceTheme';

type AuthStep = 'login' | 'register' | 'verify-email' | 'verify-login';

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { classes, isMobile } = useDeviceTheme();

  const handleRegistrationSuccess = (userEmail: string) => {
    setEmail(userEmail);
    setStep('verify-email');
  };

  const handleLoginSuccess = (userEmail: string) => {
    setEmail(userEmail);
    setStep('verify-login');
  };

  const handleEmailVerified = () => {
    setStep('login');
  };

  const handleLoginVerified = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
      <Toaster position={isMobile ? 'top-center' : 'top-right'} />
      
      <motion.div 
        className={`w-full max-w-md ${classes.container}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <BPayLogo size={isMobile ? 'md' : 'lg'} />
        </div>
        
        {step === 'login' && (
          <>
            <LoginForm onSuccess={handleLoginSuccess} />
            <p className="text-center mt-4 text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setStep('register')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </>
        )}

        {step === 'register' && (
          <>
            <RegisterForm onSuccess={handleRegistrationSuccess} />
            <p className="text-center mt-4 text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setStep('login')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Login
              </button>
            </p>
          </>
        )}

        {step === 'verify-email' && (
          <VerificationForm
            email={email}
            type="registration"
            onSuccess={handleEmailVerified}
            onBack={() => setStep('register')}
          />
        )}

        {step === 'verify-login' && (
          <VerificationForm
            email={email}
            type="login"
            onSuccess={handleLoginVerified}
            onBack={() => setStep('login')}
          />
        )}
      </motion.div>
    </div>
  );
}