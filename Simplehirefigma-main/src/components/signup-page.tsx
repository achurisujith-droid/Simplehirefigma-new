import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Award, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../src/store/authStore";
import { toast } from "sonner@2.0.3";

interface SignupPageProps {
  onSignup: () => void;
  onNavigateToLogin: () => void;
}

export function SignupPage({ onSignup, onNavigateToLogin }: SignupPageProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    agreeToTerms: false
  });
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; password?: string; terms?: string }>({});

  const { signup, isLoading, error: authError, clearError } = useAuthStore();

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    
    if (!formData.fullName || formData.fullName.length < 2) {
      errors.fullName = "Name must be at least 2 characters";
    }
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.agreeToTerms) {
      errors.terms = "You must agree to the terms";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await signup(formData.email, formData.password, formData.fullName);
    
    if (result.success) {
      toast.success("Account created!", {
        description: "Welcome to Simplehire",
      });
      onSignup();
    } else {
      toast.error("Signup failed", {
        description: result.error || "Please try again",
      });
    }
  };

  const handleGoogleSignup = async () => {
    toast.info("Google OAuth not yet implemented", {
      description: "Please use email/password signup",
    });
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field === 'agreeToTerms') {
      setFormData(prev => ({ ...prev, [field]: !prev.agreeToTerms }));
    } else {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    }
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    clearError();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Marketing content */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-700 p-12 items-center justify-center">
        <div className="max-w-lg text-white">
          <h2 className="text-white text-3xl mb-6">
            Join thousands of verified professionals
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Stand out to recruiters with verified credentials. Complete your profile in minutes.
          </p>

          <div className="bg-blue-500 bg-opacity-20 rounded-xl p-6 backdrop-blur-sm border border-blue-400 border-opacity-30">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="text-white">Sarah Chen</p>
                <p className="text-blue-100 text-sm">Software Engineer</p>
              </div>
            </div>
            <p className="text-blue-50 text-sm italic">
              "Simplehire helped me stand out in the job market. I got 3x more interview calls after completing my verifications."
            </p>
          </div>

          <div className="mt-8 flex items-center gap-8 text-blue-100 text-sm">
            <div>
              <div className="text-white text-2xl mb-1">50K+</div>
              <div>Verified users</div>
            </div>
            <div>
              <div className="text-white text-2xl mb-1">95%</div>
              <div>Success rate</div>
            </div>
            <div>
              <div className="text-white text-2xl mb-1">24hrs</div>
              <div>Avg. turnaround</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-slate-900 mb-2">Create your account</h1>
            <p className="text-slate-600">
              Start your verification journey today
            </p>
          </div>

          {/* Signup form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            {/* Error Message */}
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              </div>
            )}

            {/* Google signup */}
            <Button
              onClick={handleGoogleSignup}
              variant="outline"
              className="w-full mb-6"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-slate-500">
                or sign up with email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Full name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange('fullName')}
                  required
                />
                {fieldErrors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Email address
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Must be at least 6 characters
                </p>
                {fieldErrors.password && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Terms checkbox */}
              <div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={handleInputChange('agreeToTerms')}
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600 leading-tight cursor-pointer">
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {fieldErrors.terms && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.terms}</p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading || !formData.agreeToTerms}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{" "}
            <button
              onClick={onNavigateToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}