import { useState, useRef, useEffect } from 'react';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface Props {
  email: string;
  type: 'registration' | 'login';
  onSuccess: (token?: string) => void;
  onBack: () => void;
}

export default function VerificationForm({ email, type, onSuccess, onBack }: Props) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      if (type === 'registration') {
        await authAPI.verifyEmail({ email, code: verificationCode });
        toast.success('Email verified! You can now login.');
        onSuccess();
      } else {
        const response = await authAPI.verifyLogin({ email, code: verificationCode });
        localStorage.setItem('token', response.data.token);
        toast.success('Login successful!');
        onSuccess(response.data.token);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Verification failed');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendCode({ email });
      toast.success('Verification code sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-2">
        {type === 'registration' ? 'Verify Your Email' : 'Login Verification'}
      </h2>
      <p className="text-gray-600 text-center mb-6">
        Enter the 6-digit code sent to<br />
        <span className="font-medium">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:border-primary-500 focus:outline-none"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || code.some(d => !d)}
          className="w-full bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
          
          <div>
            <button
              type="button"
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}