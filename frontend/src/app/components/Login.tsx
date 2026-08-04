import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../../lib/AuthContext";
import { ApiError } from "../../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // NOTE: the backend determines the user's type from their account at
  // login (it's embedded in the JWT) — it doesn't need the user to pick it.
  // We keep this dropdown only so the person can double check they're
  // signing in to the right kind of account; it's not sent to the API.
  const [userType, setUserType] = useState<"npo" | "individual" | "business" | "admin">("npo");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      switch (user.userType) {
        case "NPO":
          navigate("/npo-dashboard");
          break;
        case "Individual":
          navigate("/individual-dashboard");
          break;
        case "Business":
          navigate("/business-dashboard");
          break;
        case "Admin":
          navigate("/admin-dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="text-xl text-neutral-900">
            UbuntuConnect
          </Link>
          <Link to="/" className="text-neutral-600 hover:text-neutral-900">
            Back to Home
          </Link>
        </div>
      </header>

      <div className="py-12 px-6 lg:px-12">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h1 className="text-center mb-2">Welcome Back</h1>
              <p className="text-center text-neutral-600 mb-8">
                Sign in to your UbuntuConnect account
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
                <div>
                  <Label htmlFor="user-type">I am logging in as</Label>
                  <select
                    id="user-type"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as "npo" | "individual" | "business" | "admin")}
                    className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                  >
                    <option value="npo">NPO</option>
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    Remember me
                  </label>
                  <a href="#" className="text-sm text-orange-600 hover:text-orange-700">
                    Forgot password?
                  </a>
                </div>

                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <p className="text-center text-neutral-600 mt-6">
                Don't have an account?{" "}
                <Link to="/register" className="text-orange-600 hover:text-orange-700">
                  Create one
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
