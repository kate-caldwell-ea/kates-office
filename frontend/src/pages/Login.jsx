import { useState } from 'react';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    await login(password);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg mb-4">
            <span className="text-4xl">✦</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Kate's Office</h1>
          <p className="text-gray-400 mt-2">Enter password to continue</p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-800 backdrop-blur-sm rounded-2xl shadow-xl border border-dark-600 p-8">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
                <button 
                  type="button"
                  onClick={clearError}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}

            {/* Password Input */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!password.trim() || isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Kate's Office • Executive Assistant Portal
        </p>
      </div>
    </div>
  );
}
