import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineBookOpen } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim() || !password) {
      toast.error('Email and password are required');
      return;
    }
    if (isRegister && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, name.trim());
        toast.success('Welcome to MyLeetPlan!');
      } else {
        await login(email.trim(), password);
        toast.success('Welcome back!');
      }
    } catch (err) {
      const message = err?.response?.data?.error || 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-dark-bg-tertiary rounded-xl p-3 shadow-lg border border-dark-border mb-3">
            <HiOutlineBookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            MyLeetPlan
          </h1>
          <p className="text-sm text-dark-text-secondary mt-1">Your Daily Practice Companion</p>
        </div>

        {/* Card */}
        <div className="bg-dark-bg-secondary rounded-2xl shadow-xl border border-dark-border p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-dark-text mb-1">
            {isRegister ? 'Create your account' : 'Sign in'}
          </h2>
          <p className="text-sm text-dark-text-secondary mb-6">
            {isRegister
              ? 'Start tracking your LeetCode practice.'
              : 'Welcome back — pick up where you left off.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                  Name <span className="text-dark-text-secondary/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full px-3 py-2.5 bg-dark-bg-tertiary border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ada Lovelace"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-3 py-2.5 bg-dark-bg-tertiary border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                className="w-full px-3 py-2.5 bg-dark-bg-tertiary border border-dark-border rounded-lg text-dark-text placeholder-dark-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Please wait…'
                : isRegister
                ? 'Create account'
                : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-dark-text-secondary text-center mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
