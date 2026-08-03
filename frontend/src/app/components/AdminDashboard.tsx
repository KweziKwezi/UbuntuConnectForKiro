import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../../lib/AuthContext";
import { adminApi, npoApi, ApiError } from "../../lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Shield,
  Users,
  Building2,
  Heart,
  TrendingUp,
  LogOut,
  Settings,
  CheckCircle,
  X,
  Search,
  FileText,
  DollarSign,
  AlertCircle,
  Download,
  Eye,
  UserCheck,
  Ban
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Real data — GET /api/admin/users, /api/admin/verifications,
  // /api/admin/transactions, /api/npo
  const [allUsersRaw, setAllUsersRaw] = useState<any[]>([]);
  const [pendingVerificationsRaw, setPendingVerificationsRaw] = useState<any[]>([]);
  const [recentTransactionsRaw, setRecentTransactionsRaw] = useState<any[]>([]);
  const [allNPOsRaw, setAllNPOsRaw] = useState<any[]>([]);

  // User detail view — GET /api/admin/users/{id}. Was previously exposed
  // in api.ts (adminApi.getUser) but never called anywhere; the "View"
  // button in the All Users table did nothing.
  const [viewedUser, setViewedUser] = useState<any>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  const handleViewUser = (id: number) => {
    setActionError(null);
    adminApi
      .getUser(id)
      .then((u: any) => {
        setViewedUser(u);
        setShowUserDetail(true);
      })
      .catch((err) => setActionError(err instanceof ApiError ? err.message : "Couldn't load user details."));
  };

  const loadUsers = () => {
    adminApi.getUsers().then(setAllUsersRaw).catch(() => setAllUsersRaw([]));
  };
  const loadVerifications = () => {
    adminApi.getVerifications("Pending").then(setPendingVerificationsRaw).catch(() => setPendingVerificationsRaw([]));
  };
  const loadTransactions = () => {
    adminApi.getTransactions().then(setRecentTransactionsRaw).catch(() => setRecentTransactionsRaw([]));
  };
  const loadNPOs = () => {
    npoApi.getAll().then(setAllNPOsRaw).catch(() => setAllNPOsRaw([]));
  };

  useEffect(() => {
    if (!user) return;
    loadUsers();
    loadVerifications();
    loadTransactions();
    loadNPOs();
  }, [user]);

  // NOTE on gaps vs. the original mock UI:
  // - The Users table has no "name" column in the backend — Users only
  //   stores email/type/active/verified; the display name lives in the
  //   Individual/Npo/Business profile tables instead, which this endpoint
  //   doesn't join. Falls back to email as the display name.
  // - There's no "joined date" column on Users either.
  // - Verifications have no NPO name/registration/documents/contact-email —
  //   the Verification entity only stores npoId + status + dates. NPO name
  //   is cross-referenced from GET /api/npo below; documents/contact email
  //   have no backend model at all (no document-upload feature exists yet).
  // - Transactions only carry sender/receiver *user IDs*, not names.
  // - NPO donation totals ("R X raised") and follower counts aren't tracked
  //   anywhere in the backend.

  const platformStats = {
    totalUsers: allUsersRaw.length,
    npos: allUsersRaw.filter((u) => u.userType === "NPO").length,
    individuals: allUsersRaw.filter((u) => u.userType === "Individual").length,
    businesses: allUsersRaw.filter((u) => u.userType === "Business").length,
    // NOTE: backend transaction amounts are always stored as positive
    // decimals (direction is encoded in transactionType, not the sign of
    // amount — see TransactionController/WalletController/IndividualController),
    // so filtering on `amount > 0` here used to match every transaction
    // (donations, deposits, AND withdrawals), wildly overcounting this
    // total. Filter on the actual type instead.
    totalDonations: recentTransactionsRaw
      .filter((t) => (t.transactionType || "").toLowerCase() === "donation" && t.status === "Completed")
      .reduce((sum, t) => sum + t.amount, 0),
    activeCampaigns: 0, // no backend concept of "active" on PartnershipCampaigns beyond dates
    pendingVerifications: pendingVerificationsRaw.length,
    totalTransactions: recentTransactionsRaw.length,
  };

  const pendingVerifications = pendingVerificationsRaw.map((v: any) => {
    const npo = allNPOsRaw.find((n: any) => n.npoId === v.npoId);
    return {
      id: v.verificationId,
      npoId: v.npoId,
      npoName: npo?.organizationName || `NPO #${v.npoId}`,
      registrationNumber: npo?.nporegNum || "—",
      location: "—", // GET /api/npo doesn't return location
      category: npo?.npofocusArea || "General",
      submittedDate: v.submittedDate,
      documents: [] as string[], // no document-upload model in the backend
      contactEmail: "—", // not returned by GET /api/npo
    };
  });

  const allUsers = allUsersRaw.map((u: any) => ({
    id: u.userId,
    name: u.email,
    type: u.userType,
    email: u.email,
    joined: null as string | null,
    status: u.isActive ? "Active" : "Suspended",
    verified: u.isVerified,
  }));

  const recentTransactions = recentTransactionsRaw.map((t: any) => ({
    id: t.transactionId,
    from: t.senderUserId != null ? `User #${t.senderUserId}` : "—",
    to: t.receiverUserId != null ? `User #${t.receiverUserId}` : "—",
    // Withdrawals move money out of the platform — display as negative even
    // though the backend always stores a positive amount.
    amount: t.transactionType === "Withdrawal" ? -t.amount : t.amount,
    date: t.timestamp,
    type: t.transactionType || "Donation",
    status: t.status,
  }));

  const allNPOs = allNPOsRaw.map((n: any) => {
    const relatedUser = allUsersRaw.find((u: any) => u.userId === n.userId);
    return {
      id: n.npoId,
      name: n.organizationName,
      location: "—",
      verified: relatedUser?.isVerified || false,
      followers: 0,
      donations: 0,
      status: relatedUser?.isActive === false ? "Suspended" : "Active",
    };
  });

  const handleApproveVerification = async (id: number) => {
    setActionError(null);
    try {
      await adminApi.approveVerification(id);
      loadVerifications();
      loadUsers();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't approve verification.");
    }
  };

  const handleRejectVerification = async (id: number) => {
    setActionError(null);
    try {
      await adminApi.rejectVerification(id);
      loadVerifications();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't reject verification.");
    }
  };

  const handleSuspendUser = async (id: number) => {
    setActionError(null);
    const target = allUsersRaw.find((u: any) => u.userId === id);
    try {
      if (target?.isActive) {
        await adminApi.deactivateUser(id);
      } else {
        await adminApi.activateUser(id);
      }
      loadUsers();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update user status.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredUsers = allUsers.filter(user =>
    searchQuery === "" ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 px-6">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <div>
              <h1 className="text-xl">Admin Dashboard</h1>
              <p className="text-orange-200 text-sm">UbuntuConnect Platform Management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-white border-white hover:bg-orange-800">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 min-h-[calc(100vh-73px)] p-6 sticky top-0 h-screen overflow-y-auto">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "overview"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "verification"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              NPO Verification ({pendingVerifications.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "users"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Users className="w-5 h-5" />
              All Users
            </button>
            <button
              onClick={() => setActiveTab("npos")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "npos"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Building2 className="w-5 h-5" />
              All NPOs
            </button>
            <button
              onClick={() => setActiveTab("donations")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "donations"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Heart className="w-5 h-5" />
              Track Donations
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "transactions"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Monitor Transactions
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "reports"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FileText className="w-5 h-5" />
              Generate Reports
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "settings"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Settings className="w-5 h-5" />
              System Settings
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Platform Overview</h1>
                  <p className="text-neutral-600">Real-time platform statistics and health metrics</p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Total Users</span>
                      <Users className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">{platformStats.totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-green-600">+45 this month</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Total Donations</span>
                      <Heart className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">R {(platformStats.totalDonations / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-green-600">+12% this month</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Active NPOs</span>
                      <Building2 className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">{platformStats.npos}</div>
                    <div className="text-sm text-neutral-600">{platformStats.pendingVerifications} pending</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Active Campaigns</span>
                      <FileText className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">{platformStats.activeCampaigns}</div>
                    <div className="text-sm text-neutral-600">Across platform</div>
                  </Card>
                </div>

                {/* User Breakdown */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <h3 className="mb-4">NPOs</h3>
                    <div className="text-4xl mb-2">{platformStats.npos}</div>
                    <div className="text-sm text-neutral-600">Non-Profit Organizations</div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Individuals</h3>
                    <div className="text-4xl mb-2">{platformStats.individuals}</div>
                    <div className="text-sm text-neutral-600">Individual Donors & Volunteers</div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Businesses</h3>
                    <div className="text-4xl mb-2">{platformStats.businesses}</div>
                    <div className="text-sm text-neutral-600">Corporate Partners</div>
                  </Card>
                </div>

                {/* Pending Actions Alert */}
                {platformStats.pendingVerifications > 0 && (
                  <Card className="p-6 bg-amber-50 border-amber-200">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="mb-1 text-amber-900">Action Required</h3>
                        <p className="text-amber-800 text-sm mb-3">
                          {platformStats.pendingVerifications} NPO verification requests awaiting review
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setActiveTab("verification")}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          Review Verifications
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* NPO Verification Tab (UC601) */}
            {activeTab === "verification" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">NPO Verification Requests</h1>
                  <p className="text-neutral-600">Review and approve pending NPO verifications</p>
                </div>

                {actionError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-6">
                    {actionError}
                  </div>
                )}

                {pendingVerifications.length === 0 ? (
                  <Card className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No pending verifications</h3>
                    <p className="text-neutral-600">All NPO verification requests have been reviewed</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {pendingVerifications.map((npo) => (
                      <Card key={npo.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="mb-1">{npo.npoName}</h3>
                            <div className="flex items-center gap-4 text-sm text-neutral-600">
                              <span>Registration: {npo.registrationNumber}</span>
                              <span>•</span>
                              <span>{npo.location}</span>
                              <Badge variant="outline">{npo.category}</Badge>
                            </div>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-neutral-600 mb-2">Contact: {npo.contactEmail}</p>
                          <p className="text-sm text-neutral-600">Submitted: {new Date(npo.submittedDate).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>

                        <div className="mb-4 p-4 bg-neutral-50 rounded-lg">
                          <p className="text-sm text-neutral-600 mb-2">Uploaded Documents:</p>
                          <div className="space-y-2">
                            {npo.documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm">{doc}</span>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveVerification(npo.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Verification
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 hover:bg-red-50"
                            onClick={() => handleRejectVerification(npo.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button variant="outline">
                            Request More Documents
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Users Tab (UC602) */}
            {activeTab === "users" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">All Users</h1>
                  <p className="text-neutral-600">View and manage all platform users</p>
                </div>

                {actionError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-6">
                    {actionError}
                  </div>
                )}

                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <Input
                      placeholder="Search users by name, email, or type..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Card className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Joined</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span>{user.name}</span>
                                {user.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{user.type}</Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-neutral-600">{user.email}</td>
                            <td className="py-3 px-4 text-sm text-neutral-600">
                              {user.joined ? new Date(user.joined).toLocaleDateString("en-ZA") : "—"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={user.status === "Active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                                {user.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewUser(user.id)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleSuspendUser(user.id)}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* All NPOs Tab (UC603) */}
            {activeTab === "npos" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">All NPOs</h1>
                  <p className="text-neutral-600">View and manage all registered NPOs</p>
                </div>

                {actionError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-6">
                    {actionError}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {allNPOs.map((npo) => (
                    <Card key={npo.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3>{npo.name}</h3>
                            {npo.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                          </div>
                          <p className="text-sm text-neutral-600">{npo.location}</p>
                        </div>
                        <Badge className={npo.status === "Active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                          {npo.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-neutral-600">Followers:</span> {npo.followers}
                        </div>
                        <div>
                          <span className="text-neutral-600">Donations:</span> R {npo.donations.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {!npo.verified && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              // NOTE: there's no backend endpoint to directly mark an
                              // NPO verified — verification only happens by approving
                              // a Verification record (PUT /api/admin/verifications/{id}/approve),
                              // and nothing in the backend creates a Verification row yet
                              // (no NPO "submit for verification" endpoint exists). This
                              // button used to do nothing at all when clicked; now it at
                              // least routes to the real verification queue when a
                              // pending request exists for this NPO, and explains why
                              // there's nothing to review when there isn't one.
                              const pending = pendingVerifications.find((v) => v.npoId === npo.id);
                              if (pending) {
                                setActiveTab("verification");
                              } else {
                                setActionError(
                                  `${npo.name} has no pending verification request to review yet — the backend has no NPO document-submission flow, so verifications can't be created for this org.`
                                );
                              }
                            }}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Track Donations Tab (UC600) */}
            {activeTab === "donations" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Track Donations</h1>
                  <p className="text-neutral-600">Monitor all donation activity on the platform</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Donations (All Time)</div>
                    <div className="text-3xl mb-1">R {(platformStats.totalDonations / 1000000).toFixed(2)}M</div>
                    <div className="text-sm text-green-600">Across all NPOs</div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">This Month</div>
                    <div className="text-3xl mb-1">R 287K</div>
                    <div className="text-sm text-green-600">+12% from last month</div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Average Donation</div>
                    <div className="text-3xl mb-1">R 431</div>
                    <div className="text-sm text-neutral-600">Per transaction</div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="mb-4">Recent Donations</h3>
                  <div className="space-y-3">
                    {recentTransactions.filter(t => t.type === "Donation").map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                        <div className="flex-1">
                          <p className="mb-1">{transaction.from} → {transaction.to}</p>
                          <p className="text-sm text-neutral-600">{new Date(transaction.date).toLocaleDateString("en-ZA")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg text-green-600">R {transaction.amount.toLocaleString()}</p>
                          <Badge className="bg-green-100 text-green-700">{transaction.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Monitor Transactions Tab (UC604) */}
            {activeTab === "transactions" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Monitor Transactions</h1>
                  <p className="text-neutral-600">Track all financial transactions on the platform</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Transactions</div>
                    <div className="text-3xl mb-1">{platformStats.totalTransactions}</div>
                    <div className="text-sm text-neutral-600">All time</div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Inflow</div>
                    <div className="text-3xl mb-1">R 2.45M</div>
                    <div className="text-sm text-green-600">Donations received</div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Outflow</div>
                    <div className="text-3xl mb-1">R 385K</div>
                    <div className="text-sm text-orange-600">NPO withdrawals</div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Net Platform Flow</div>
                    <div className="text-3xl mb-1">R 2.06M</div>
                    <div className="text-sm text-green-600">Active in system</div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="mb-4">All Transactions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">From</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">To</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Type</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                            <td className="py-3 px-4 text-sm text-neutral-600">
                              {new Date(transaction.date).toLocaleDateString("en-ZA")}
                            </td>
                            <td className="py-3 px-4 text-sm">{transaction.from}</td>
                            <td className="py-3 px-4 text-sm">{transaction.to}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{transaction.type}</Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={transaction.amount > 0 ? "text-green-600" : "text-orange-600"}>
                                {transaction.amount > 0 ? "+" : ""}R {Math.abs(transaction.amount).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className="bg-green-100 text-green-700">{transaction.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Generate Reports Tab (UC605) */}
            {activeTab === "reports" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Generate Reports</h1>
                  <p className="text-neutral-600">Export platform data and analytics reports</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="mb-4">User Reports</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        All Users Export (CSV)
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        NPO Directory Report (PDF)
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        User Growth Analytics
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Financial Reports</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Monthly Donations Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Transaction History (CSV)
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Financial Summary Report
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Platform Analytics</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Monthly Platform Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Engagement Metrics
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Campaign Performance
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Compliance Reports</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Verification Audit Trail
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Tax Receipt Summary
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Regulatory Compliance Report
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* System Settings Tab */}
            {activeTab === "settings" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">System Settings</h1>
                  <p className="text-neutral-600">Configure platform settings and preferences</p>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="mb-4">Platform Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="platform-name">Platform Name</Label>
                        <Input id="platform-name" defaultValue="UbuntuConnect" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="contact-email">Support Email</Label>
                        <Input id="contact-email" defaultValue="support@ubuntuconnect.org" className="mt-2" />
                      </div>
                      <Button className="bg-orange-600 hover:bg-orange-700">Save Settings</Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Category Management</h3>
                    <p className="text-sm text-neutral-600 mb-4">Manage NPO categories available on the platform</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge>Education</Badge>
                      <Badge>Healthcare</Badge>
                      <Badge>Environment</Badge>
                      <Badge>Youth Development</Badge>
                      <Badge>Food Security</Badge>
                      <Badge>Women's Rights</Badge>
                    </div>
                    <Button variant="outline">Add New Category</Button>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Notification Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Email notifications for new verification requests</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Alert on large transactions (R10,000+)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Daily platform summary email</span>
                      </label>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* User Detail Modal */}
      {showUserDetail && viewedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>User Details</h3>
              <button onClick={() => { setShowUserDetail(false); setViewedUser(null); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">User ID</span>
                <span>#{viewedUser.userId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Email</span>
                <span>{viewedUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Contact</span>
                <span>{viewedUser.contact || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Location</span>
                <span>{viewedUser.location || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Type</span>
                <Badge variant="outline">{viewedUser.userType}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Status</span>
                <Badge className={viewedUser.isActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                  {viewedUser.isActive ? "Active" : "Suspended"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Verified</span>
                <span>{viewedUser.isVerified ? "Yes" : "No"}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  handleSuspendUser(viewedUser.userId);
                  setShowUserDetail(false);
                  setViewedUser(null);
                }}
              >
                {viewedUser.isActive ? "Suspend User" : "Reactivate User"}
              </Button>
              <Button variant="outline" onClick={() => { setShowUserDetail(false); setViewedUser(null); }}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
