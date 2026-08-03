import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../../lib/AuthContext";
import {
  businessApi,
  campaignApi,
  campaignApplicationApi,
  individualApi,
  feedApi,
  walletApi,
  ApiError,
} from "../../lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Heart,
  Search,
  MapPin,
  TrendingUp,
  LogOut,
  Settings,
  Bell,
  DollarSign,
  Users,
  CheckCircle,
  Filter,
  X,
  Calendar,
  FileText,
  Download,
  Building2,
  Target,
  MessageSquare,
  Image as ImageIcon,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");
  const [followedNPOs, setFollowedNPOs] = useState([1, 3]);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedNPO, setSelectedNPO] = useState<number | null>(null);
  const [showViewCampaign, setShowViewCampaign] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [editingCampaign, setEditingCampaign] = useState(false);
  // Applicants (NPOs) for the campaign currently being viewed —
  // GET /api/campaignapplications/campaign/{id}, approve/reject via
  // PUT /api/campaignapplications/{id}/approve|reject.
  const [campaignApplicants, setCampaignApplicants] = useState<any[]>([]);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProvince, setSelectedProvince] = useState("All");
  const [selectedVerification, setSelectedVerification] = useState("All");
  const [sortBy, setSortBy] = useState("random");
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState("All");

  // Business profile — GET /api/business/me
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    businessApi
      .getMyProfile()
      .then((p: any) => setBusinessProfile(p))
      .catch(() => {});
  }, [user]);

  const [bizProfileForm, setBizProfileForm] = useState({
    industry: "",
    contactPersonName: "",
    contactPersonTitle: "",
    businessEmail: "",
    csrGoal: "",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!businessProfile) return;
    setBizProfileForm({
      industry: businessProfile.industry || "",
      contactPersonName: businessProfile.contactPersonName || "",
      contactPersonTitle: businessProfile.contactPersonTitle || "",
      businessEmail: businessProfile.businessEmail || "",
      csrGoal: businessProfile.csrGoal || "",
    });
  }, [businessProfile]);

  // NPOs for discovery/partnership — GET /api/individual/discover-NPOs.
  // "province", "followers", "impact", "image" have no backend fields and
  // are defaulted below (same caveat as the other dashboards).
  const [allNPOs, setAllNPOs] = useState<any[]>([]);

  useEffect(() => {
    individualApi
      .discoverNpos()
      .then((npos) =>
        setAllNPOs(
          npos.map((n) => ({
            id: n.npoId,
            name: n.organizationName,
            location: n.location || "Unknown",
            province: n.location || "Unknown",
            category: n.focusArea || "General",
            description: n.mission || "",
            verified: n.isVerified,
            followers: n.followerCount,
            impact: "",
            image:
              "https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
          }))
        )
      )
      .catch(() => setAllNPOs([]));
  }, []);

  // Partnership campaigns — real backend model (CampaignController /
  // PartnershipCampaign). Applicant counts come from a follow-up call per
  // campaign to /api/campaignapplications/campaign/{id}.
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);

  const loadCampaigns = () => {
    if (!businessProfile?.businessId) return;
    campaignApi
      .getAll()
      .then((all) => {
        const mine = (all as any[]).filter((c) => c.businessId === businessProfile?.businessId);
        return Promise.all(
          mine.map((c) =>
            campaignApplicationApi
              .getByCampaign(c.campaignId)
              .then((apps) => ({ ...c, applicants: (apps as any[]).length }))
              .catch(() => ({ ...c, applicants: 0 }))
          )
        );
      })
      .then((withCounts) =>
        setMyCampaigns(
          withCounts.map((c: any) => ({
            id: c.campaignId,
            title: c.title,
            description: c.description || "",
            category: c.category || "General",
            budget: c.budgetPerPartner || 0,
            positions: c.numOfPartners || 0,
            requirements: c.requirements || "",
            deadline: c.endDate || "",
            status: !c.endDate || new Date(c.endDate) >= new Date() ? "Active" : "Closed",
            applicants: c.applicants,
          }))
        )
      )
      .catch(() => setMyCampaigns([]));
  };

  useEffect(() => {
    loadCampaigns();
  }, [businessProfile]);

  const loadCampaignApplicants = (campaignId: number) => {
    campaignApplicationApi
      .getByCampaign(campaignId)
      .then((apps) =>
        setCampaignApplicants(
          (apps as any[]).map((a) => ({
            id: a.applicationId,
            npoId: a.npoId,
            npoName: allNPOs.find((n) => n.id === a.npoId)?.name || `NPO #${a.npoId}`,
            motivation: a.motivation || "",
            status: a.status,
            applicationDate: a.applicationDate,
          }))
        )
      )
      .catch(() => setCampaignApplicants([]));
  };

  const handleApproveApplicant = async (applicationId: number, campaignId: number) => {
    setActionError(null);
    try {
      await campaignApplicationApi.approve(applicationId);
      loadCampaignApplicants(campaignId);
      loadCampaigns();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't approve application.");
    }
  };

  const handleRejectApplicant = async (applicationId: number, campaignId: number) => {
    setActionError(null);
    try {
      await campaignApplicationApi.reject(applicationId);
      loadCampaignApplicants(campaignId);
      loadCampaigns();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't reject application.");
    }
  };

  // My donations — TransactionController doesn't expose a "my donations"
  // view for Business the way IndividualController does; approximated here
  // from the general transaction history for this user.
  const [myDonations, setMyDonations] = useState<any[]>([]);

  // Wallet balance — GET /api/wallet/user/{userId}/balance. Wallets start
  // at 0 on registration, so a top-up (POST /api/wallet/deposit) is
  // required before any contribution/donation can succeed.
  const [walletBalance, setWalletBalance] = useState(0);

  const loadWalletBalance = () => {
    if (!user) return;
    walletApi
      .getBalance(user.userId)
      .then((res) => setWalletBalance(res.balance))
      .catch(() => {});
  };

  useEffect(() => {
    loadWalletBalance();
  }, [user]);

  // Community posts — same pattern as the other dashboards.
  const [allNPOPosts, setAllNPOPosts] = useState<any[]>([]);
  const [npoPosts, setNpoPosts] = useState<any[]>([]);

  useEffect(() => {
    individualApi
      .getCommunityUpdates()
      .then((posts) =>
        setAllNPOPosts(
          (posts as any[]).map((p) => ({
            id: p.postId,
            npoId: null,
            npoName: p.authorName,
            category: "Community",
            title: p.postTitle,
            description: p.content || "",
            image:
              p.mediaUrl ||
              "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
            date: p.timestamp,
            likes: p.likeCount,
            comments: 0,
          }))
        )
      )
      .catch(() => setAllNPOPosts([]));

    if (!user) return;
    feedApi
      .communityUpdates()
      .then((posts) =>
        setNpoPosts(
          (posts as any[]).map((p) => ({
            id: p.postId,
            npoId: p.userId,
            npoName: allNPOs.find((n) => n.id === p.userId)?.name || "NPO",
            category: "Community",
            title: p.postTitle,
            description: p.content || "",
            image:
              p.mediaUrl ||
              "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
            date: p.timestamp,
            likes: p.likeCount,
            comments: 0,
          }))
        )
      )
      .catch(() => setNpoPosts([]));
  }, [user, allNPOs]);

  // Filter posts for community updates
  const filteredCommunityPosts = allNPOPosts.filter(post => {
    const matchesSearch = postSearchQuery === "" ||
      post.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.npoName.toLowerCase().includes(postSearchQuery.toLowerCase());

    const matchesCategory = postCategoryFilter === "All" || post.category === postCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const handleFollow = async (id: number) => {
    setActionError(null);
    const isFollowing = followedNPOs.includes(id);
    setFollowedNPOs(isFollowing ? followedNPOs.filter(npoId => npoId !== id) : [...followedNPOs, id]);
    try {
      if (isFollowing) {
        await individualApi.unfollow(id);
      } else {
        await individualApi.follow(id);
      }
    } catch (err) {
      setFollowedNPOs(followedNPOs);
      setActionError(err instanceof ApiError ? err.message : "Couldn't update follow status.");
    }
  };

  const handleDonate = (id: number) => {
    setSelectedNPO(id);
    setShowDonateModal(true);
    loadWalletBalance();
  };

  const [donateAmount, setDonateAmount] = useState("");
  const [isDonating, setIsDonating] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isToppingUp, setIsToppingUp] = useState(false);

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNPO) return;
    const amount = Number(donateAmount);
    if (!amount || amount <= 0) return;
    setActionError(null);
    setIsDonating(true);
    try {
      const res = await individualApi.donate(selectedNPO, amount);
      if (typeof res.newBalance === "number") setWalletBalance(res.newBalance);
      setShowDonateModal(false);
      setSelectedNPO(null);
      setDonateAmount("");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Contribution failed. Please try again.");
    } finally {
      setIsDonating(false);
    }
  };

  // Top up wallet — POST /api/wallet/deposit. Simulates a real payment
  // gateway crediting the business's wallet before it can contribute.
  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) return;
    setActionError(null);
    setIsToppingUp(true);
    try {
      const res = await walletApi.deposit(amount);
      setWalletBalance(res.newBalance);
      setTopUpAmount("");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Top-up failed. Please try again.");
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const totalDonated = myDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const nposSupported = [...new Set(myDonations.map(d => d.npo))].length;
  // NOTE: annualBudget/spentToDate have no backend field — the Business
  // entity only tracks businessRegNum, industry, contact info, and csrGoal
  // (free text). These stay at 0 until a real budget-tracking model exists.
  const annualBudget = 0;
  const spentToDate = 0;
  const remainingBudget = annualBudget - spentToDate;

  // Shuffle array randomly
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Filter and sort NPOs
  const filteredNPOs = allNPOs.filter(npo => {
    const matchesSearch = searchQuery === "" ||
      npo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || npo.category === selectedCategory;
    const matchesProvince = selectedProvince === "All" || npo.province === selectedProvince;
    const matchesVerification =
      selectedVerification === "All" ||
      (selectedVerification === "Verified" && npo.verified) ||
      (selectedVerification === "Pending" && !npo.verified);

    return matchesSearch && matchesCategory && matchesProvince && matchesVerification;
  }).sort((a, b) => {
    if (sortBy === "random") return 0;
    if (sortBy === "newest") return 0;
    if (sortBy === "nearest") {
      if (a.province === businessProfile?.location && b.province !== businessProfile?.location) return -1;
      if (b.province === businessProfile?.location && a.province !== businessProfile?.location) return 1;
      return 0;
    }
    return 0;
  });

  const displayNPOs = sortBy === "random" ? shuffleArray(filteredNPOs) : filteredNPOs;

  const calculateDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="text-xl text-neutral-900">
            UbuntuConnect
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <span className="text-neutral-600">{businessProfile?.contactPersonName || user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 min-h-[calc(100vh-73px)] p-6 sticky top-0 h-screen overflow-y-auto">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("discover")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "discover"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Search className="w-5 h-5" />
              Discover NPOs
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "following"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Heart className="w-5 h-5" />
              Following ({followedNPOs.length})
            </button>
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "campaigns"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Target className="w-5 h-5" />
              My Campaigns
            </button>
            <button
              onClick={() => setActiveTab("donations")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "donations"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <DollarSign className="w-5 h-5" />
              My Donations
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
              Reports & Compliance
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "community"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Community Updates
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "profile"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Settings className="w-5 h-5" />
              Company Profile
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
            {/* Discover NPOs Tab */}
            {activeTab === "discover" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Discover Organizations</h1>
                  <p className="text-neutral-600">Find verified NPOs for B-BBEE and CSR partnerships</p>
                </div>

                {/* Search and Filter */}
                <div className="mb-8">
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <Input
                        placeholder="Search by name, location, or keyword..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-5 gap-4 mb-6">
                    <div>
                      <Label>Category</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Environment">Environment</option>
                        <option value="Youth Development">Youth Development</option>
                      </select>
                    </div>
                    <div>
                      <Label>Province</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                      >
                        <option value="All">All Provinces</option>
                        <option value="Gauteng">Gauteng</option>
                        <option value="Western Cape">Western Cape</option>
                        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                      </select>
                    </div>
                    <div>
                      <Label>Verification</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                        value={selectedVerification}
                        onChange={(e) => setSelectedVerification(e.target.value)}
                      >
                        <option value="All">All NPOs</option>
                        <option value="Verified">Verified Only</option>
                        <option value="Pending">Pending Verification</option>
                      </select>
                    </div>
                    <div>
                      <Label>Sort By</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="random">Random (Fair)</option>
                        <option value="nearest">Nearest to Me</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("All");
                          setSelectedProvince("All");
                          setSelectedVerification("All");
                          setSortBy("random");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 mb-6">
                    Showing {displayNPOs.length} organization{displayNPOs.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* NPOs Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {displayNPOs.map((npo) => (
                    <Card key={npo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48">
                        <ImageWithFallback
                          src={npo.image}
                          alt={npo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3>{npo.name}</h3>
                              {npo.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {npo.location}
                              </span>
                              <Badge variant="outline">{npo.category}</Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-neutral-600 text-sm mb-4">{npo.description}</p>
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span className="text-neutral-600">
                            <Users className="w-4 h-4 inline mr-1" />
                            {npo.followers} followers
                          </span>
                          <span className="text-green-600">{npo.impact}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleFollow(npo.id)}
                          >
                            <Heart
                              className={`w-4 h-4 mr-2 ${
                                followedNPOs.includes(npo.id) ? "fill-red-500 text-red-500" : ""
                              }`}
                            />
                            {followedNPOs.includes(npo.id) ? "Following" : "Follow"}
                          </Button>
                          <Button
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleDonate(npo.id)}
                          >
                            Partner & Donate
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Following Tab */}
            {activeTab === "following" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Organizations You Follow</h1>
                  <p className="text-neutral-600">NPOs you're tracking for partnerships</p>
                </div>

                {followedNPOs.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No organizations followed yet</h3>
                    <p className="text-neutral-600 mb-4">Start following NPOs to track potential partners</p>
                    <Button onClick={() => setActiveTab("discover")}>Discover NPOs</Button>
                  </Card>
                ) : (
                  <>
                    {/* Recent Posts from Followed NPOs */}
                    {npoPosts.length > 0 && (
                      <div className="mb-12">
                        <h2 className="mb-6">Recent Updates from Partners</h2>
                        <div className="space-y-6">
                          {npoPosts.map((post) => (
                            <Card key={post.id} className="overflow-hidden">
                              <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-sm">{post.npoName}</h3>
                                    <p className="text-xs text-neutral-600">
                                      {new Date(post.date).toLocaleDateString("en-ZA", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <h3 className="mb-2">{post.title}</h3>
                                <p className="text-neutral-600 mb-4">{post.description}</p>

                                {post.image && (
                                  <div className="mb-4">
                                    <img
                                      src={post.image}
                                      alt={post.title}
                                      className="w-full h-64 object-cover rounded-lg"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-6 text-sm text-neutral-600">
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    {post.likes} likes
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    {post.comments} comments
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Followed NPOs List */}
                    <div>
                      <h2 className="mb-6">Partner Organizations</h2>
                      <div className="space-y-6">
                        {allNPOs.filter(npo => followedNPOs.includes(npo.id)).map((npo) => (
                      <Card key={npo.id} className="p-6">
                        <div className="flex items-start gap-6">
                          <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                            <ImageWithFallback
                              src={npo.image}
                              alt={npo.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3>{npo.name}</h3>
                                  {npo.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-600 mb-2">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {npo.location}
                                  </span>
                                  <Badge variant="outline">{npo.category}</Badge>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFollow(npo.id)}
                              >
                                Unfollow
                              </Button>
                            </div>
                            <p className="text-neutral-600 mb-4">{npo.description}</p>
                            <div className="flex items-center gap-6 mb-4">
                              <span className="text-sm text-neutral-600">
                                <Users className="w-4 h-4 inline mr-1" />
                                {npo.followers} followers
                              </span>
                              <span className="text-sm text-green-600">{npo.impact}</span>
                            </div>
                            <div className="pt-4 border-t border-neutral-200">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-neutral-600">Ready to partner</p>
                                <Button size="sm" onClick={() => handleDonate(npo.id)}>
                                  Start Partnership
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* My Campaigns Tab */}
            {activeTab === "campaigns" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">My Partnership Campaigns</h1>
                    <p className="text-neutral-600">Post opportunities for NPOs to apply</p>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCampaignModal(true)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>

                <div className="space-y-6">
                  {myCampaigns.map((campaign) => {
                    return (
                      <Card key={campaign.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3>{campaign.title}</h3>
                              <Badge className="bg-green-100 text-green-700">{campaign.status}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                R {campaign.budget.toLocaleString()} budget
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {campaign.positions} positions
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 p-4 bg-neutral-50 rounded-lg">
                          <p className="text-sm text-neutral-600 mb-1">Requirements:</p>
                          <p className="text-sm">{campaign.requirements}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600">{campaign.applicants} NPOs applied</span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCampaignId(campaign.id);
                                setEditingCampaign(false);
                                setShowViewCampaign(true);
                                loadCampaignApplicants(campaign.id);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCampaignId(campaign.id);
                                setEditingCampaign(true);
                                setShowViewCampaign(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`)) {
                                  try {
                                    await campaignApi.remove(campaign.id);
                                    loadCampaigns();
                                  } catch (err) {
                                    setActionError(err instanceof ApiError ? err.message : "Couldn't delete campaign.");
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {myCampaigns.length === 0 && (
                  <Card className="p-12 text-center">
                    <Target className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No campaigns yet</h3>
                    <p className="text-neutral-600 mb-4">Create a campaign to attract the right NPO partners</p>
                    <Button onClick={() => setShowCampaignModal(true)}>Create Your First Campaign</Button>
                  </Card>
                )}
              </div>
            )}

            {/* My Donations Tab */}
            {activeTab === "donations" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">My Donations</h1>
                  <p className="text-neutral-600">Partnership contributions and impact</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Contributed</div>
                    <div className="text-3xl mb-1">R {totalDonated.toLocaleString()}</div>
                    <div className="text-sm text-green-600">This year</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">NPO Partners</div>
                    <div className="text-3xl mb-1">{nposSupported}</div>
                    <div className="text-sm text-neutral-600">Organizations</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Budget Remaining</div>
                    <div className="text-3xl mb-1">R {remainingBudget.toLocaleString()}</div>
                    <div className="text-sm text-neutral-600">Available for partnerships</div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="mb-4">Contribution History</h3>
                  <div className="space-y-4">
                    {myDonations.map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                        <div className="flex-1">
                          <p className="mb-1">{donation.npo}</p>
                          <p className="text-sm text-neutral-600">{donation.project} • {new Date(donation.date).toLocaleDateString("en-ZA")}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg text-green-600">R {donation.amount.toLocaleString()}</p>
                            <Badge className="bg-green-100 text-green-700">Completed</Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Reports & Compliance Tab */}
            {activeTab === "reports" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Reports & Compliance</h1>
                  <p className="text-neutral-600">Download tax receipts and CSR reports for B-BBEE compliance</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="mb-4">Tax Receipts (Section 18A)</h3>
                    <p className="text-neutral-600 text-sm mb-6">Download official tax-deductible donation receipts</p>
                    <div className="space-y-3 mb-6">
                      {myDonations.filter(d => d.hasReceipt).map((donation) => (
                        <div key={donation.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <div>
                            <p className="text-sm">{donation.npo}</p>
                            <p className="text-xs text-neutral-600">{new Date(donation.date).toLocaleDateString("en-ZA")}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full">
                      Download All Receipts (PDF)
                    </Button>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">CSR Impact Reports</h3>
                    <p className="text-neutral-600 text-sm mb-6">Generate reports for stakeholders and board</p>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Annual CSR Report 2026
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Quarterly Impact Summary Q1 2026
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        B-BBEE Scorecard Contribution
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Donation History Export (CSV)
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6 md:col-span-2">
                    <h3 className="mb-4">B-BBEE Compliance Summary</h3>
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <p className="text-neutral-600 text-sm mb-2">SED Points Target</p>
                        <p className="text-2xl">15 points</p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-sm mb-2">Current Points</p>
                        <p className="text-2xl text-green-600">12 points</p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-sm mb-2">Required Spending</p>
                        <p className="text-2xl">R 145,000</p>
                      </div>
                    </div>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download B-BBEE Report
                    </Button>
                  </Card>
                </div>
              </div>
            )}

            {/* Community Updates Tab */}
            {activeTab === "community" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Community Updates</h1>
                  <p className="text-neutral-600">See what's happening across all NPOs</p>
                </div>

                {/* Search and Filter */}
                <div className="mb-8">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label>Search Posts</Label>
                      <Input
                        placeholder="Search by title, NPO name, or keyword..."
                        className="mt-2"
                        value={postSearchQuery}
                        onChange={(e) => setPostSearchQuery(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                        value={postCategoryFilter}
                        onChange={(e) => setPostCategoryFilter(e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Environment">Environment</option>
                        <option value="Youth Development">Youth Development</option>
                        <option value="Food Security">Food Security</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setPostSearchQuery("");
                          setPostCategoryFilter("All");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Posts Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredCommunityPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {post.image && (
                        <div className="relative h-48">
                          <ImageWithFallback
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-sm">{post.npoName}</h3>
                            <Badge variant="outline" className="text-xs">{post.category}</Badge>
                          </div>
                        </div>
                        <h3 className="mb-2">{post.title}</h3>
                        <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                          {post.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-neutral-600">
                              <Heart className="w-4 h-4" />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1 text-neutral-600">
                              <MessageSquare className="w-4 h-4" />
                              {post.comments}
                            </span>
                          </div>
                          <span className="text-neutral-600">
                            {new Date(post.date).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredCommunityPosts.length === 0 && (
                  <Card className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No posts found</h3>
                    <p className="text-neutral-600">Try adjusting your search or filters</p>
                  </Card>
                )}
              </div>
            )}

            {/* Profile Settings Tab */}
            {activeTab === "profile" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Company Profile</h1>
                  <p className="text-neutral-600">Manage your organization's information</p>
                </div>

                <Card className="p-8">
                  {profileMessage && (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">
                      {profileMessage}
                    </div>
                  )}
                  {actionError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                      {actionError}
                    </div>
                  )}
                  <form
                    className="space-y-6"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setActionError(null);
                      setProfileMessage(null);
                      try {
                        await businessApi.updateMyProfile({
                          Industry: bizProfileForm.industry,
                          ContactPersonName: bizProfileForm.contactPersonName,
                          ContactPersonTitle: bizProfileForm.contactPersonTitle,
                          BusinessEmail: bizProfileForm.businessEmail,
                          CsrGoal: bizProfileForm.csrGoal,
                        });
                        setProfileMessage("Profile updated successfully!");
                        businessApi.getMyProfile().then((p: any) => setBusinessProfile(p)).catch(() => {});
                      } catch (err) {
                        setActionError(err instanceof ApiError ? err.message : "Couldn't update profile.");
                      }
                    }}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="registration">Company Registration Number</Label>
                        <Input id="registration" value={businessProfile?.businessRegNum || ""} className="mt-2" disabled />
                        <p className="text-xs text-neutral-500 mt-1">Read-only — not editable via the update-profile endpoint.</p>
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={bizProfileForm.industry}
                          onChange={(e) => setBizProfileForm({ ...bizProfileForm, industry: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="contact-person">Contact Person</Label>
                        <Input
                          id="contact-person"
                          value={bizProfileForm.contactPersonName}
                          onChange={(e) => setBizProfileForm({ ...bizProfileForm, contactPersonName: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="job-title">Job Title</Label>
                        <Input
                          id="job-title"
                          value={bizProfileForm.contactPersonTitle}
                          onChange={(e) => setBizProfileForm({ ...bizProfileForm, contactPersonTitle: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Business Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={bizProfileForm.businessEmail}
                        onChange={(e) => setBizProfileForm({ ...bizProfileForm, businessEmail: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="csr-goals">CSR Goals & Objectives</Label>
                      <Textarea
                        id="csr-goals"
                        value={bizProfileForm.csrGoal}
                        onChange={(e) => setBizProfileForm({ ...bizProfileForm, csrGoal: e.target.value })}
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    {/* NOTE: company name, phone, head-office address, and CSR
                        budget/focus-areas have no backing columns on the Business
                        entity / UpdateBusinessRequest DTO — removed from this form
                        rather than kept as non-functional inputs. Add the backend
                        fields first if these need to be editable. */}

                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      Save Changes
                    </Button>
                  </form>
                </Card>

                <Card className="p-8 mt-8 bg-neutral-50">
                  <h3 className="mb-2">Change Password</h3>
                  <p className="text-sm text-neutral-600">
                    NOTE: BusinessController has no change-password endpoint — this can't
                    be wired up without a backend addition, so it's been removed rather
                    than kept as a non-functional stub.
                  </p>
                </Card>

                <Card className="p-8 mt-8 border-red-200 bg-red-50">
                  <h3 className="mb-2 text-red-700">Delete / Deactivate Account</h3>
                  <p className="text-neutral-600">
                    NOTE: BusinessController intentionally has no delete/deactivate
                    endpoint (cascading deletes into campaigns/applications were the
                    concern, per the comment in BusinessController.cs). Nothing to wire
                    this up to yet.
                  </p>
                </Card>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Create Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Create Partnership Campaign</h3>
              <button onClick={() => setShowCampaignModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {actionError}
              </div>
            )}
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!businessProfile) return;
                const formData = new FormData(e.currentTarget);
                setActionError(null);
                try {
                  await campaignApi.create({
                    Title: formData.get("title") as string,
                    Description: formData.get("description") as string,
                    Category: formData.get("category") as string,
                    Requirements: formData.get("requirements") as string,
                    BudgetPerPartner: parseFloat(formData.get("budget") as string) || 0,
                    NumOfPartners: parseInt(formData.get("positions") as string) || 1,
                    EndDate: formData.get("deadline") as string,
                  });
                  setShowCampaignModal(false);
                  loadCampaigns();
                } catch (err) {
                  setActionError(err instanceof ApiError ? err.message : "Couldn't create campaign.");
                }
              }}
            >
              <div>
                <Label htmlFor="campaign-title">Campaign Title</Label>
                <Input
                  id="campaign-title"
                  name="title"
                  placeholder="e.g., Technology Skills Partnership"
                  className="mt-2"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select id="category" name="category" className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                    <option>Education</option>
                    <option>Youth Development</option>
                    <option>Healthcare</option>
                    <option>Environment</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="budget">Budget Per Partner (R)</Label>
                  <Input id="budget" name="budget" type="number" placeholder="50000" className="mt-2" required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="positions">Number of Partners</Label>
                  <Input id="positions" name="positions" type="number" placeholder="3" className="mt-2" required />
                </div>
                <div>
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input id="deadline" name="deadline" type="date" className="mt-2" required />
                </div>
              </div>

              <div>
                <Label htmlFor="requirements">Partnership Requirements</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  placeholder="e.g., Must be verified, focus on technology/digital skills, based in Gauteng..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="description">Campaign Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what you're looking for in NPO partners and what the partnership will involve..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Create Campaign
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCampaignModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && selectedNPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Partnership Contribution</h3>
              <button onClick={() => setShowDonateModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {actionError}
              </div>
            )}

            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-neutral-600">Your wallet balance</span>
                <span className="text-lg">R {walletBalance.toLocaleString()}</span>
              </div>
              {/* Simulated top-up (no real payment gateway integration) —
                  see WalletController.Deposit. Without this, contributions
                  always fail with "Insufficient wallet balance" since every
                  wallet starts at R0. */}
              <form className="flex gap-2" onSubmit={handleTopUp}>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Add funds (R)"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="outline" disabled={isToppingUp}>
                  {isToppingUp ? "Adding..." : "Top Up"}
                </Button>
              </form>
            </div>

            <form className="space-y-6" onSubmit={handleSubmitDonation}>
              <div>
                <Label htmlFor="amount">Contribution Amount (R)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="project">Support Project (Optional)</Label>
                <select id="project" className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                  <option value="">General Partnership</option>
                  <option value="1">Specific Project</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">Not sent — the donate endpoint only accepts an amount.</p>
              </div>

              <div>
                <Label htmlFor="payment">Payment Method</Label>
                <select id="payment" className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                  <option value="eft">EFT</option>
                  <option value="card">Corporate Card</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">Also not sent — no payment-method field on the backend.</p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={isDonating}>
                  {isDonating ? "Processing..." : "Contribute Now"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDonateModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View/Edit Campaign Modal */}
      {showViewCampaign && selectedCampaignId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            {(() => {
              const campaign = myCampaigns.find(c => c.id === selectedCampaignId);
              if (!campaign) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3>{editingCampaign ? "Edit Campaign" : "Campaign Details"}</h3>
                    <button onClick={() => { setShowViewCampaign(false); setSelectedCampaignId(null); setEditingCampaign(false); }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {editingCampaign ? (
                    <form
                      className="space-y-6"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        try {
                          await campaignApi.update(campaign.id, {
                            Title: formData.get("title") as string,
                            Category: formData.get("category") as string,
                            BudgetPerPartner: parseFloat(formData.get("budget") as string),
                            NumOfPartners: parseInt(formData.get("positions") as string),
                            Requirements: formData.get("requirements") as string,
                            EndDate: formData.get("deadline") as string,
                          });
                          setShowViewCampaign(false);
                          setSelectedCampaignId(null);
                          setEditingCampaign(false);
                          loadCampaigns();
                        } catch (err) {
                          setActionError(err instanceof ApiError ? err.message : "Couldn't update campaign.");
                        }
                      }}
                    >
                      <div>
                        <Label htmlFor="title">Campaign Title</Label>
                        <Input
                          id="title"
                          name="title"
                          defaultValue={campaign.title}
                          className="mt-2"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            name="category"
                            defaultValue={campaign.category}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="budget">Budget (R)</Label>
                          <Input
                            id="budget"
                            name="budget"
                            type="number"
                            defaultValue={campaign.budget}
                            className="mt-2"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="positions">Number of Positions</Label>
                          <Input
                            id="positions"
                            name="positions"
                            type="number"
                            defaultValue={campaign.positions}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="deadline">Application Deadline</Label>
                          <Input
                            id="deadline"
                            name="deadline"
                            type="date"
                            defaultValue={campaign.deadline}
                            className="mt-2"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="requirements">Requirements</Label>
                        <Textarea
                          id="requirements"
                          name="requirements"
                          defaultValue={campaign.requirements}
                          className="mt-2"
                          rows={4}
                          required
                        />
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setShowViewCampaign(false); setSelectedCampaignId(null); setEditingCampaign(false); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 text-green-700">{campaign.status}</Badge>
                        <span className="text-sm text-neutral-600">{campaign.category}</span>
                      </div>

                      <div className="bg-neutral-50 p-6 rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Budget</div>
                            <div className="text-lg font-semibold">R {campaign.budget.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Positions Available</div>
                            <div className="text-lg font-semibold">{campaign.positions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Applications</div>
                            <div className="text-lg font-semibold">{campaign.applicants} NPOs</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Deadline</div>
                            <div className="text-lg font-semibold">{new Date(campaign.deadline).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3">Requirements</h4>
                        <p className="text-neutral-600 whitespace-pre-wrap">{campaign.requirements}</p>
                      </div>

                      <div>
                        <h4 className="mb-3">NPO Applicants ({campaignApplicants.length})</h4>
                        {campaignApplicants.length === 0 ? (
                          <p className="text-sm text-neutral-600">No NPOs have applied to this campaign yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {campaignApplicants.map((applicant) => (
                              <div key={applicant.id} className="p-4 border border-neutral-200 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="mb-1">{applicant.npoName}</p>
                                    <p className="text-xs text-neutral-600">
                                      Applied {new Date(applicant.applicationDate).toLocaleDateString("en-ZA")}
                                    </p>
                                  </div>
                                  <Badge
                                    className={
                                      applicant.status === "Approved"
                                        ? "bg-green-100 text-green-700"
                                        : applicant.status === "Rejected"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                    }
                                  >
                                    {applicant.status}
                                  </Badge>
                                </div>
                                {applicant.motivation && (
                                  <p className="text-sm text-neutral-600 mb-3">{applicant.motivation}</p>
                                )}
                                {applicant.status === "Pending" && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleApproveApplicant(applicant.id, campaign.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() => handleRejectApplicant(applicant.id, campaign.id)}
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                          onClick={() => setEditingCampaign(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Campaign
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`)) {
                              try {
                                await campaignApi.remove(campaign.id);
                                setShowViewCampaign(false);
                                setSelectedCampaignId(null);
                                loadCampaigns();
                              } catch (err) {
                                setActionError(err instanceof ApiError ? err.message : "Couldn't delete campaign.");
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setShowViewCampaign(false); setSelectedCampaignId(null); setEditingCampaign(false); }}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
}
