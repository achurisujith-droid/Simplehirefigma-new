import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Shield, CheckCircle, Award, Users, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useAuthStore } from "../src/store/authStore";
import { toast } from "sonner@2.0.3";

interface LoginPageProps {
  onLogin: (user: { email: string; name: string; id: string }) => void;
  onNavigateToSignup: () => void;
}

// Hardcoded test users for different scenarios
const mockUsers = [
  {
    id: "user1",
    email: "john@example.com",
    password: "password123",
    name: "John Anderson",
    purchasedProducts: ["skill"],
    interviewProgress: { documentsUploaded: false, voiceInterview: false, mcqTest: false, codingChallenge: false }
  },
  {
    id: "user2",
    email: "sarah@example.com",
    password: "password123",
    name: "Sarah Mitchell",
    purchasedProducts: ["skill", "id-visa"],
    interviewProgress: { documentsUploaded: true, voiceInterview: true, mcqTest: false, codingChallenge: false }
  },
  {
    id: "user3",
    email: "mike@example.com",
    password: "password123",
    name: "Mike Chen",
    purchasedProducts: ["skill", "id-visa", "reference"],
    interviewProgress: { documentsUploaded: true, voiceInterview: true, mcqTest: true, codingChallenge: false }
  },
  {
    id: "user4",
    email: "emma@example.com",
    password: "password123",
    name: "Emma Thompson",
    purchasedProducts: ["skill"],
    interviewProgress: { documentsUploaded: true, voiceInterview: true, mcqTest: true, codingChallenge: true }
  },
  {
    id: "user5",
    email: "alex@example.com",
    password: "password123",
    name: "Alex Rodriguez",
    purchasedProducts: [],
    interviewProgress: { documentsUploaded: false, voiceInterview: false, mcqTest: false, codingChallenge: false }
  },
  {
    id: "user6",
    email: "demo@simplehire.ai",
    password: "demo",
    name: "Demo User",
    purchasedProducts: ["skill", "id-visa", "reference"],
    interviewProgress: { documentsUploaded: false, voiceInterview: false, mcqTest: false, codingChallenge: false }
  }
];

export function LoginPage({ onLogin, onNavigateToSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login, isLoading, error: authError, clearError } = useAuthStore();

  // Clear auth error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFieldErrors(prev => ({ ...prev, email: undefined }));
    clearError();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setFieldErrors(prev => ({ ...prev, password: undefined }));
    clearError();
  };

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      toast.success("Welcome back!", {
        description: "You've successfully signed in.",
      });
      // Let App.tsx handle navigation based on auth state
    } else {
      toast.error("Login failed", {
        description: result.error || "Invalid email or password",
      });
      setShowTestAccounts(true);
    }
  };

  const handleGoogleLogin = async () => {
    toast.info("Google OAuth not yet implemented", {
      description: "Please use email/password login",
    });
  };

  const handleQuickLogin = (user: typeof mockUsers[0]) => {
    setEmail(user.email);
    setPassword(user.password);
    setFieldErrors({});
    clearError();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Top Navigation */}
      <div className="relative z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-slate-900 text-xl">Simplehire</span>
          </div>
          <div className="text-sm text-slate-600">
            Don't have an account?{" "}
            <button
              onClick={onNavigateToSignup}
              className="text-blue-600 hover:text-blue-700"
            >
              Sign up free
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-slate-900 mb-3">Welcome back to Simplehire</h1>
          <p className="text-slate-600 text-lg">
            Sign in to continue your verification journey
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 mb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{authError}</p>
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm text-slate-700">
                    Password
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-slate-700">Continue with Google</span>
              </button>
            </form>
          </div>

          {/* Test Accounts Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm text-amber-900 mb-1">Demo Test Accounts</h4>
                <p className="text-xs text-amber-700">
                  Click any account below to auto-fill credentials. All passwords: <code className="bg-amber-100 px-1.5 py-0.5 rounded">password123</code> (or <code className="bg-amber-100 px-1.5 py-0.5 rounded">demo</code> for Demo User)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {mockUsers.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickLogin(user)}
                  className="w-full text-left px-4 py-3 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-slate-900">{user.name}</span>
                        <span className="text-xs text-slate-500">({user.email})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600">
                          {user.purchasedProducts.length === 0 
                            ? "No products" 
                            : user.purchasedProducts.length === 3
                            ? "All products"
                            : `${user.purchasedProducts.length} product${user.purchasedProducts.length > 1 ? 's' : ''}`}
                        </span>
                        {user.interviewProgress.voiceInterview && (
                          <span className="text-green-600">• Interview started</span>
                        )}
                        {user.interviewProgress.voiceInterview && user.interviewProgress.mcqTest && user.interviewProgress.codingChallenge && (
                          <span className="text-blue-600">• Completed</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to login
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-slate-200/50">
              <div className="text-2xl text-slate-900 mb-1">50K+</div>
              <div className="text-xs text-slate-600">Verified Candidates</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-slate-200/50">
              <div className="text-2xl text-slate-900 mb-1">2,500+</div>
              <div className="text-xs text-slate-600">Partner Companies</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-slate-200/50">
              <div className="text-2xl text-slate-900 mb-1">98%</div>
              <div className="text-xs text-slate-600">Success Rate</div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Your data is encrypted and secure</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}