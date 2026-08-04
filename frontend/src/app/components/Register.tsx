import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useAuth } from "../../lib/AuthContext";
import { ApiError } from "../../lib/api";

type UserType = "npo" | "individual" | "business" | "admin" | null;

// Maps our lowercase UI userType to the backend's UserType string
// (RegisterDto.UserType — must be exactly "Individual" | "NPO" | "Business" | "Admin").
const USER_TYPE_MAP: Record<Exclude<UserType, null>, string> = {
  npo: "NPO",
  individual: "Individual",
  business: "Business",
  admin: "Admin",
};

const DASHBOARD_ROUTE: Record<string, string> = {
  NPO: "/npo-dashboard",
  Individual: "/individual-dashboard",
  Business: "/business-dashboard",
  Admin: "/admin-dashboard",
};

export default function Register() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [userType, setUserType] = useState<UserType>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shared fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");

  // Individual
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [interests, setInterests] = useState("");

  // NPO
  const [orgName, setOrgName] = useState("");
  const [npoRegNum, setNpoRegNum] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [mission, setMission] = useState("");

  // Business
  const [companyName, setCompanyName] = useState(""); // NOTE: RegisterDto has no dedicated
  // company-name field — it's used as the fallback profileName only when
  // ContactPersonName is empty on the backend, so we send it as contactPersonName
  // when the person leaves the contact field blank.
  const [businessRegNum, setBusinessRegNum] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactName, setContactName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [csrGoals, setCsrGoals] = useState("");

  // Admin
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  // NOTE: "Administrator Access Key" has no backend field/validation at all —
  // RegisterDto and AuthController have no concept of an admin invite key,
  // so anyone can currently register as Admin the same way as any other
  // role. Left as a decorative frontend-only field; flagging this as a gap.
  const [adminKey, setAdminKey] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;
    setError(null);
    setIsSubmitting(true);

    const backendUserType = USER_TYPE_MAP[userType];
    const dto: Record<string, unknown> = {
      userType: backendUserType,
    };

    if (userType === "individual") {
      Object.assign(dto, {
        userEmail: email,
        password,
        userContact: null,
        location: location || null,
        firstName,
        lastName,
        causeOfCare: interests || null,
      });
    } else if (userType === "npo") {
      Object.assign(dto, {
        userEmail: email,
        password,
        userContact: phone || null,
        location: location || null,
        npoRegNum,
        organizationName: orgName,
        npoFocusArea: focusArea || null,
        npoMission: mission || null,
      });
    } else if (userType === "business") {
      Object.assign(dto, {
        userEmail: email,
        password,
        userContact: phone || null,
        location: null,
        businessRegNum,
        industry: industry || null,
        contactPersonName: contactName || companyName,
        contactPersonTitle: jobTitle || null,
        businessEmail: email,
        csrGoal: csrGoals || null,
      });
    } else if (userType === "admin") {
      Object.assign(dto, {
        userEmail: adminEmail,
        password: adminPassword,
        userContact: adminPhone || null,
        location: null,
        firstName: adminFirstName,
        lastName: adminLastName,
      });
    }

    try {
      const result = await register(dto);
      // Registration doesn't return a token, so log in right after with the
      // same credentials to get one and land on the right dashboard.
      const loginEmail = userType === "admin" ? adminEmail : email;
      const loginPassword = userType === "admin" ? adminPassword : password;
      const user = await login(loginEmail, loginPassword);
      navigate(DASHBOARD_ROUTE[user.userType] || DASHBOARD_ROUTE[result.userType] || "/dashboard");
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
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-center mb-3">Create Your Account</h1>
            <p className="text-center text-neutral-600 mb-12">
              Join the community and start making an impact
            </p>

            {/* User Type Selection */}
            {!userType && (
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h2 className="mb-6 text-center">I am a...</h2>
                <div className="grid gap-4">
                  <button
                    onClick={() => setUserType("npo")}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <span className="text-2xl">🏘️</span>
                      </div>
                      <div>
                        <h3 className="mb-1">Non-Profit Organization</h3>
                        <p className="text-neutral-600 text-sm">
                          Showcase your work, build credibility, and connect with supporters
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setUserType("individual")}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div>
                        <h3 className="mb-1">Individual</h3>
                        <p className="text-neutral-600 text-sm">
                          Discover causes, follow organizations, and donate with confidence
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setUserType("business")}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <span className="text-2xl">🏢</span>
                      </div>
                      <div>
                        <h3 className="mb-1">Business</h3>
                        <p className="text-neutral-600 text-sm">
                          Find NPO partners for B-BBEE and CSR initiatives
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setUserType("admin")}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                        <span className="text-2xl">🔐</span>
                      </div>
                      <div>
                        <h3 className="mb-1">Administrator</h3>
                        <p className="text-neutral-600 text-sm">
                          Manage platform, verify NPOs, and oversee operations
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* NPO Registration Form */}
            {userType === "npo" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2>NPO Registration</h2>
                  <button
                    onClick={() => setUserType(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input id="org-name" placeholder="Your NPO name" className="mt-2" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="registration-number">NPO Registration Number</Label>
                    <Input id="registration-number" placeholder="e.g., 123-456-NPO" className="mt-2" value={npoRegNum} onChange={(e) => setNpoRegNum(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="contact@yourorg.org" className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+27 XX XXX XXXX" className="mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="City, Province" className="mt-2" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="focus-area">Focus Area</Label>
                    <Input id="focus-area" placeholder="e.g., Education, Health, Youth Development" className="mt-2" value={focusArea} onChange={(e) => setFocusArea(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="mission">Mission Statement</Label>
                    <Textarea id="mission" placeholder="Briefly describe your organization's mission" className="mt-2" rows={4} value={mission} onChange={(e) => setMission(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Create a secure password" className="mt-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Account..." : "Create NPO Account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Individual Registration Form */}
            {userType === "individual" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2>Individual Registration</h2>
                  <button
                    onClick={() => setUserType(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" placeholder="First name" className="mt-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" placeholder="Last name" className="mt-2" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input id="location" placeholder="City, Province" className="mt-2" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="interests">Causes You Care About (Optional)</Label>
                    <Input id="interests" placeholder="e.g., Education, Environment, Health" className="mt-2" value={interests} onChange={(e) => setInterests(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Create a secure password" className="mt-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Business Registration Form */}
            {userType === "business" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2>Business Registration</h2>
                  <button
                    onClick={() => setUserType(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" placeholder="Your company name" className="mt-2" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="registration-number">Company Registration Number</Label>
                    <Input id="registration-number" placeholder="Registration number" className="mt-2" value={businessRegNum} onChange={(e) => setBusinessRegNum(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" placeholder="e.g., Technology, Finance, Retail" className="mt-2" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name">Contact Person</Label>
                      <Input id="contact-name" placeholder="Full name" className="mt-2" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="job-title">Job Title</Label>
                      <Input id="job-title" placeholder="Position" className="mt-2" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="contact@company.com" className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+27 XX XXX XXXX" className="mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="csr-goals">CSR/B-BBEE Goals (Optional)</Label>
                    <Textarea id="csr-goals" placeholder="Describe your social impact objectives" className="mt-2" rows={4} value={csrGoals} onChange={(e) => setCsrGoals(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Create a secure password" className="mt-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Account..." : "Create Business Account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Admin Registration Form */}
            {userType === "admin" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2>Administrator Registration</h2>
                  <button
                    onClick={() => setUserType(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="admin-first-name">First Name</Label>
                      <Input id="admin-first-name" placeholder="First name" className="mt-2" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="admin-last-name">Last Name</Label>
                      <Input id="admin-last-name" placeholder="Last name" className="mt-2" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="admin-email">Email Address</Label>
                    <Input id="admin-email" type="email" placeholder="admin@ubuntuconnect.org" className="mt-2" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="admin-phone">Phone Number</Label>
                    <Input id="admin-phone" type="tel" placeholder="+27 XX XXX XXXX" className="mt-2" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="admin-key">Administrator Access Key</Label>
                    <Input id="admin-key" type="password" placeholder="Enter admin access key" className="mt-2" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
                    <p className="text-sm text-neutral-500 mt-1">
                      Contact system administrator for access key. NOTE: the backend has no admin-key
                      concept yet — this field isn't sent or checked by the API. Anyone can currently
                      register as Admin the same way as any other role; add real gating server-side
                      before shipping this.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="admin-password">Password</Label>
                    <Input id="admin-password" type="password" placeholder="Create a secure password" className="mt-2" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Account..." : "Create Administrator Account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Sign In Link */}
            {userType && (
              <p className="text-center text-neutral-600 mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-600 hover:text-orange-700">
                  Sign in
                </Link>
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
