import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../../lib/AuthContext";
import {
  individualApi,
  volunteerOpportunityApi,
  feedApi,
  walletApi,
  ApiError,
} from "../../lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
  Briefcase,
  Clock,
  UserCheck,
  MessageSquare,
  Edit,
  Trash2
} from "lucide-react";

export default function IndividualDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");
  const [followedNPOs, setFollowedNPOs] = useState<number[]>([]);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedNPO, setSelectedNPO] = useState<number | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<number | null>(null);
  // Derived from real data: an opportunity counts as "applied" if there's a
  // my-volunteering record matching its NPO + role. (The backend's
  // my-volunteering endpoint doesn't return an opportunityId to match on
  // directly, only npoName/roleTitle, so this is a best-effort join.)
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState("All");
  const [actionError, setActionError] = useState<string | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProvince, setSelectedProvince] = useState("All");
  const [selectedVerification, setSelectedVerification] = useState("All");
  const [sortBy, setSortBy] = useState("random");

  // Real profile, loaded from GET /api/individual/me
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    causeOfCare: string | null;
    email: string;
    contact: string | null;
    location: string | null;
  } | null>(null);

  // userProfile is used below for the discover/recommendation filters.
  // "province" isn't a backend field (Users.Location is a single free-text
  // string), so we treat the whole location string as the province match too.
  const userProfile = {
    location: profile?.location || "",
    province: profile?.location || "",
    interests: (profile?.causeOfCare || "").split(",").map((s) => s.trim()).filter(Boolean),
  };

  useEffect(() => {
    if (!user) return;
    individualApi
      .getMyProfile()
      .then((p: any) => setProfile(p))
      .catch(() => {
        /* profile may 404 briefly right after registration — ignore */
      });
  }, [user]);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    interests: "",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phone: profile.contact || "",
      location: profile.location || "",
      interests: profile.causeOfCare || "",
    });
  }, [profile]);

  // NPOs — real data from GET /api/individual/discover-NPOs.
  // Backend fields available: npoId, organizationName, focusArea, mission,
  // location, isVerified. Everything else below (followers, image,
  // hasActiveCampaign/campaignGoal/campaignRaised/campaignDeadline,
  // createdDate) has NO backend model to back it — there is no NPO
  // fundraising-campaign entity in this schema, only Business-initiated
  // partnership campaigns (CampaignController), which is a different
  // concept. Those fields are defaulted below and the "active campaign"
  // sections of this dashboard will always render empty until that's
  // built server-side.
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
            followers: 0, // not tracked by the backend
            impact: "",
            image:
              "https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
            hasActiveCampaign: false, // no NPO campaign model exists yet
            createdDate: new Date().toISOString(),
          }))
        )
      )
      .catch(() => setAllNPOs([]));
  }, []);

  // Volunteer opportunities — real data from GET /api/VolunteerOpportunity.
  // "location", "schedule" and "applicants" (count) aren't backend fields
  // and are defaulted below.
  const [volunteerOpportunities, setVolunteerOpportunities] = useState<any[]>([]);

  useEffect(() => {
    volunteerOpportunityApi
      .getAll()
      .then((opps) =>
        setVolunteerOpportunities(
          opps.map((o) => ({
            id: o.opportunityId,
            npo: allNPOs.find((n) => n.id === o.npoId)?.name || `NPO #${o.npoId}`,
            npoId: o.npoId,
            role: o.roleTitle,
            location: "",
            category: o.category || "General",
            timeCommitment: o.timeCommitment || "",
            duration: o.duration || "",
            schedule: "",
            skillsRequired: o.skillsRequired || "",
            description: o.description || "",
            positions: o.numOfPositions,
            applicants: 0,
          }))
        )
      )
      .catch(() => setVolunteerOpportunities([]));
  }, [allNPOs]);

  // My donations — GET /api/individual/my-donations. Backend returns
  // amount/status/timestamp/receiverUserId, not an NPO name or project —
  // those are approximated below.
  const [myDonations, setMyDonations] = useState<any[]>([]);
  // My volunteering — GET /api/individual/my-volunteering
  const [myVolunteerHours, setMyVolunteerHours] = useState<any[]>([]);
  // My impact summary — GET /api/individual/my-impact
  const [impact, setImpact] = useState({
    totalDonated: 0,
    totalHoursVolunteered: 0,
    npoFollowing: 0,
    volunteerRolesCompleted: 0,
  });

  // Wallet balance — GET /api/wallet/user/{userId}/balance. Wallets start
  // at 0 on registration (no payment gateway integration exists), so a
  // "top up" via POST /api/wallet/deposit is required before any donation
  // can succeed — otherwise IndividualController.Donate always 400s with
  // "Insufficient wallet balance."
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

  const loadPersonalData = () => {
    if (!user) return;
    individualApi
      .getMyDonations()
      .then((res) =>
        setMyDonations(
          (res.donations as any[]).map((d) => ({
            id: d.transactionId,
            npo: `NPO (user #${d.receiverUserId})`,
            amount: d.amount,
            date: d.timestamp,
            project: d.status,
          }))
        )
      )
      .catch(() => setMyDonations([]));

    individualApi
      .getMyVolunteering()
      .then((apps) =>
        setMyVolunteerHours(
          (apps as any[]).map((a) => ({
            id: a.applicationId,
            npo: a.npoName,
            role: a.roleTitle,
            hours: a.totalHoursLogged,
            date: a.applicationDate,
            status: a.status,
          }))
        )
      )
      .catch(() => setMyVolunteerHours([]));

    individualApi
      .getMyImpact()
      .then((res) => setImpact(res))
      .catch(() => {});
  };

  useEffect(() => {
    loadPersonalData();
  }, [user]);

  // Community posts — GET /api/individual/community-updates (all NPO/Business
  // posts, platform-wide) and GET /api/feed/community-updates (posts from
  // NPOs the current user follows, server-filtered). Backend posts don't
  // carry a "category" or comment count, so those are defaulted.
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

  const appliedOpportunities = volunteerOpportunities
    .filter((opp) => myVolunteerHours.some((v) => v.npo === opp.npo && v.role === opp.role))
    .map((opp) => opp.id);

  const handleFollow = async (id: number) => {
    setActionError(null);
    const isFollowing = followedNPOs.includes(id);
    // optimistic update
    setFollowedNPOs(isFollowing ? followedNPOs.filter((npoId) => npoId !== id) : [...followedNPOs, id]);
    try {
      if (isFollowing) {
        await individualApi.unfollow(id);
      } else {
        await individualApi.follow(id);
      }
    } catch (err) {
      // revert on failure
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
      loadPersonalData();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Donation failed. Please try again.");
    } finally {
      setIsDonating(false);
    }
  };

  // Top up wallet — POST /api/wallet/deposit. In production this would go
  // through a real payment gateway; this simulates that step so donations
  // have funds to move (see WalletController.Deposit for the backend note).
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

  const handleApplyVolunteer = (opportunityId: number) => {
    setSelectedOpportunity(opportunityId);
    setShowVolunteerModal(true);
  };

  const [volForm, setVolForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNum: "",
    skills: "",
    availability: "",
    whyVolunteer: "",
  });
  const [isApplyingVolunteer, setIsApplyingVolunteer] = useState(false);

  const handleSubmitVolunteerApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;
    setActionError(null);
    setIsApplyingVolunteer(true);
    try {
      await individualApi.applyVolunteer(selectedOpportunity, volForm);
      loadPersonalData();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't submit application.");
    } finally {
      setIsApplyingVolunteer(false);
      setShowVolunteerModal(false);
      setSelectedOpportunity(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Sourced from GET /api/individual/my-impact — authoritative totals.
  const totalDonated = impact.totalDonated;
  const nposSupported = impact.npoFollowing; // closest backend equivalent (NPOs followed, not distinct NPOs donated to)
  const totalVolunteerHours = impact.totalHoursVolunteered;

  // Get NPOs with active campaigns
  const activeCampaignNPOs = allNPOs.filter(npo => npo.hasActiveCampaign).sort((a, b) => {
    const daysA = Math.ceil((new Date(a.campaignDeadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const daysB = Math.ceil((new Date(b.campaignDeadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysA - daysB; // Urgent campaigns first
  });

  // Get recommended NPOs (based on user's interests and location)
  const recommendedNPOs = allNPOs.filter(npo =>
    (userProfile.interests.includes(npo.category) || npo.province === userProfile.province) &&
    !followedNPOs.includes(npo.id)
  ).slice(0, 4);

  // Shuffle array randomly (Fisher-Yates algorithm)
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
    // Search filter
    const matchesSearch = searchQuery === "" ||
      npo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === "All" || npo.category === selectedCategory;

    // Province filter
    const matchesProvince = selectedProvince === "All" || npo.province === selectedProvince;

    // Verification filter
    const matchesVerification =
      selectedVerification === "All" ||
      (selectedVerification === "Verified" && npo.verified) ||
      (selectedVerification === "Pending" && !npo.verified);

    return matchesSearch && matchesCategory && matchesProvince && matchesVerification;
  }).sort((a, b) => {
    if (sortBy === "random") {
      // Random order - no sorting (shuffle happens after)
      return 0;
    } else if (sortBy === "newest") {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    } else if (sortBy === "nearest") {
      // Prioritize same province
      if (a.province === userProfile.province && b.province !== userProfile.province) return -1;
      if (b.province === userProfile.province && a.province !== userProfile.province) return 1;
      return 0;
    } else if (sortBy === "active") {
      // Prioritize NPOs with active campaigns
      if (a.hasActiveCampaign && !b.hasActiveCampaign) return -1;
      if (b.hasActiveCampaign && !a.hasActiveCampaign) return 1;
      return 0;
    }
    return 0;
  });

  // Apply random shuffle if sort is random
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
            <span className="text-neutral-600">
              {profile ? `${profile.firstName} ${profile.lastName}` : user?.email}
            </span>
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
              onClick={() => setActiveTab("volunteer")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "volunteer"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Volunteer Opportunities
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
              onClick={() => setActiveTab("myvolunteering")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "myvolunteering"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <UserCheck className="w-5 h-5" />
              My Volunteering
            </button>
            <button
              onClick={() => setActiveTab("impact")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "impact"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              My Impact
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
              Profile Settings
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
                  <p className="text-neutral-600">Find NPOs making a difference in South Africa</p>
                </div>

                {/* Active Campaigns Section */}
                {activeCampaignNPOs.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="mb-1">Active Campaigns</h2>
                        <p className="text-neutral-600 text-sm">Support urgent fundraising initiatives</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {activeCampaignNPOs.slice(0, 4).map((npo) => {
                        const percentRaised = Math.round((npo.campaignRaised! / npo.campaignGoal!) * 100);

                        return (
                          <Card key={npo.id} className="overflow-hidden hover:shadow-lg transition-shadow border-2 border-orange-200">
                            <div className="relative h-48">
                              <ImageWithFallback
                                src={npo.image}
                                alt={npo.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-6">
                              <div className="flex items-center gap-2 mb-2">
                                <h3>{npo.name}</h3>
                                {npo.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                              </div>
                              <p className="text-sm text-neutral-600 mb-1">{npo.location}</p>
                              <p className="text-neutral-900 mb-4">{npo.campaignName}</p>

                              <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-neutral-600">R {npo.campaignRaised!.toLocaleString()} raised</span>
                                  <span>{percentRaised}%</span>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-2">
                                  <div
                                    className="bg-orange-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(percentRaised, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-neutral-600 mt-1">
                                  Goal: R {npo.campaignGoal!.toLocaleString()}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleFollow(npo.id)}
                                >
                                  <Heart className={`w-4 h-4 mr-2 ${followedNPOs.includes(npo.id) ? "fill-red-500 text-red-500" : ""}`} />
                                  {followedNPOs.includes(npo.id) ? "Following" : "Follow"}
                                </Button>
                                <Button
                                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                                  onClick={() => handleDonate(npo.id)}
                                >
                                  Donate Now
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommended for You Section */}
                {recommendedNPOs.length > 0 && (
                  <div className="mb-12">
                    <div className="mb-6">
                      <h2 className="mb-1">Recommended for You</h2>
                      <p className="text-neutral-600 text-sm">Based on your interests and location</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {recommendedNPOs.map((npo) => (
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
                                <Heart className={`w-4 h-4 mr-2 ${followedNPOs.includes(npo.id) ? "fill-red-500 text-red-500" : ""}`} />
                                {followedNPOs.includes(npo.id) ? "Following" : "Follow"}
                              </Button>
                              <Button
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleDonate(npo.id)}
                              >
                                Donate
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search and Filter */}
                <div className="mb-8">
                  <h2 className="mb-6">All Organizations</h2>

                  {/* Search Bar */}
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

                  {/* Filters */}
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
                        <option value="Food Security">Food Security</option>
                        <option value="Women's Rights">Women's Rights</option>
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
                        <option value="Eastern Cape">Eastern Cape</option>
                        <option value="Limpopo">Limpopo</option>
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
                        <option value="newest">Newest First</option>
                        <option value="nearest">Nearest to Me</option>
                        <option value="active">Recently Active</option>
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

                {/* All Organizations Grid */}
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
                            Donate
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {displayNPOs.length === 0 && (
                  <Card className="p-12 text-center">
                    <Search className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No organizations found</h3>
                    <p className="text-neutral-600 mb-4">Try adjusting your search or filters</p>
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                        setSelectedProvince("All");
                        setSelectedVerification("All");
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === "following" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Organizations You Follow</h1>
                  <p className="text-neutral-600">Stay updated with your favorite NPOs</p>
                </div>

                {followedNPOs.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No organizations followed yet</h3>
                    <p className="text-neutral-600 mb-4">Start following NPOs to see their updates here</p>
                    <Button onClick={() => setActiveTab("discover")}>Discover NPOs</Button>
                  </Card>
                ) : (
                  <>
                    {/* Recent Posts from Followed NPOs */}
                    {npoPosts.length > 0 && (
                      <div className="mb-12">
                        <h2 className="mb-6">Recent Updates</h2>
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
                      <h2 className="mb-6">Your Followed Organizations</h2>
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
                                <p className="text-sm text-neutral-600">Latest update: New initiative launched</p>
                                <Button size="sm" onClick={() => handleDonate(npo.id)}>
                                  Donate Now
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

            {/* Volunteer Opportunities Tab */}
            {activeTab === "volunteer" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Volunteer Opportunities</h1>
                  <p className="text-neutral-600">Find volunteering roles that match your skills and schedule</p>
                </div>

                {/* Filters */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  <div>
                    <Label>Category</Label>
                    <select className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                      <option>All Categories</option>
                      <option>Education</option>
                      <option>Healthcare</option>
                      <option>Environment</option>
                    </select>
                  </div>
                  <div>
                    <Label>Schedule</Label>
                    <select className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                      <option>All Schedules</option>
                      <option>Weekdays</option>
                      <option>Weekends</option>
                      <option>Flexible</option>
                    </select>
                  </div>
                  <div>
                    <Label>Time Commitment</Label>
                    <select className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                      <option>Any</option>
                      <option>1-3 hours/week</option>
                      <option>4-6 hours/week</option>
                      <option>7+ hours/week</option>
                    </select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input placeholder="City or province" className="mt-2" />
                  </div>
                </div>

                {/* Opportunities Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {volunteerOpportunities.map((opp) => (
                    <Card key={opp.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="mb-1">{opp.role}</h3>
                          <p className="text-sm text-neutral-600">{opp.npo}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">{opp.category}</Badge>
                      </div>

                      <p className="text-neutral-600 text-sm mb-4">{opp.description}</p>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-neutral-400" />
                          <span>{opp.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span>{opp.timeCommitment} • {opp.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span>Duration: {opp.duration}</span>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                        <p className="text-xs text-neutral-600 mb-1">Skills Required:</p>
                        <p className="text-sm">{opp.skillsRequired}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                        <span>{opp.positions} positions available</span>
                        <span>{opp.applicants} applicants</span>
                      </div>

                      <Button
                        className={`w-full ${
                          appliedOpportunities.includes(opp.id)
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-orange-600 hover:bg-orange-700"
                        }`}
                        onClick={() => handleApplyVolunteer(opp.id)}
                        disabled={appliedOpportunities.includes(opp.id)}
                      >
                        {appliedOpportunities.includes(opp.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Applied
                          </>
                        ) : (
                          "Apply Now"
                        )}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* My Volunteering Tab */}
            {activeTab === "myvolunteering" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">My Volunteering</h1>
                  <p className="text-neutral-600">Track your volunteer activities and hours</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Hours</div>
                    <div className="text-3xl mb-1">{totalVolunteerHours}h</div>
                    <div className="text-sm text-green-600">All time</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Active Roles</div>
                    <div className="text-3xl mb-1">{myVolunteerHours.length}</div>
                    <div className="text-sm text-neutral-600">Organizations</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Applications</div>
                    <div className="text-3xl mb-1">{appliedOpportunities.length}</div>
                    <div className="text-sm text-neutral-600">Pending</div>
                  </Card>
                </div>

                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="active">Active Volunteering</TabsTrigger>
                    <TabsTrigger value="applications">My Applications</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    <div className="space-y-4">
                      {myVolunteerHours.map((vol) => (
                        <Card key={vol.id} className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3>{vol.role}</h3>
                                <Badge className="bg-green-100 text-green-700">{vol.status}</Badge>
                              </div>
                              <p className="text-neutral-600 mb-4">{vol.npo}</p>
                              <div className="flex items-center gap-6 text-sm">
                                <span className="text-neutral-600">Started: {new Date(vol.date).toLocaleDateString("en-ZA", { year: "numeric", month: "long" })}</span>
                                <span className="text-green-600 font-medium">{vol.hours} hours logged</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Calendar className="w-4 h-4 mr-2" />
                                Log Hours
                              </Button>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="applications">
                    <div className="space-y-4">
                      {myVolunteerHours.filter(vol => vol.status === "Pending").map((vol) => (
                        <Card key={vol.id} className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3>{vol.role}</h3>
                                <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>
                              </div>
                              <p className="text-neutral-600 mb-2">{vol.npo}</p>
                              <div className="text-sm text-neutral-600">
                                <p>Applied: {new Date(vol.date).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                  if (confirm("Are you sure you want to withdraw this application?")) {
                                    try {
                                      await individualApi.cancelVolunteerApplication(vol.id);
                                      loadPersonalData();
                                    } catch (err) {
                                      setActionError(err instanceof ApiError ? err.message : "Couldn't withdraw application.");
                                    }
                                  }
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Withdraw
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {myVolunteerHours.filter(vol => vol.status === "Pending").length === 0 && (
                        <Card className="p-12 text-center">
                          <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                          <h3 className="mb-2">No pending applications</h3>
                          <p className="text-neutral-600">You haven't applied to any volunteer opportunities yet</p>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* My Donations Tab */}
            {activeTab === "donations" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">My Donations</h1>
                  <p className="text-neutral-600">Your contribution history</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Donated</div>
                    <div className="text-3xl mb-1">R {totalDonated.toLocaleString()}</div>
                    <div className="text-sm text-green-600">All time</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">NPOs Supported</div>
                    <div className="text-3xl mb-1">{nposSupported}</div>
                    <div className="text-sm text-neutral-600">Organizations</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">This Year</div>
                    <div className="text-3xl mb-1">R {totalDonated.toLocaleString()}</div>
                    <div className="text-sm text-green-600">2026</div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="mb-4">Donation History</h3>
                  <div className="space-y-4">
                    {myDonations.map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                        <div>
                          <p className="mb-1">{donation.npo}</p>
                          <p className="text-sm text-neutral-600">{donation.project}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg text-green-600">R {donation.amount.toLocaleString()}</p>
                          <p className="text-sm text-neutral-600">{new Date(donation.date).toLocaleDateString("en-ZA")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
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

            {/* My Impact Tab */}
            {activeTab === "impact" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">My Impact</h1>
                  <p className="text-neutral-600">See the difference you're making through donations and volunteering</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <div>
                      <p className="text-white/80 mb-2">Donations Impact</p>
                      <h2 className="text-white mb-2">R {totalDonated.toLocaleString()}</h2>
                      <p className="text-white/90">Supporting {nposSupported} organizations</p>
                    </div>
                  </Card>

                  <Card className="p-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div>
                      <p className="text-white/80 mb-2">Volunteer Impact</p>
                      <h2 className="text-white mb-2">{totalVolunteerHours} hours</h2>
                      <p className="text-white/90">{myVolunteerHours.length} active roles</p>
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="mb-4">Combined Impact</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="mb-1">15 students mentored through volunteering</p>
                        <p className="text-sm text-neutral-600">Hope Foundation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="mb-1">Funded healthcare for 45 patients</p>
                        <p className="text-sm text-neutral-600">Ubuntu Health Clinic</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Profile Settings Tab */}
            {activeTab === "profile" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Profile Settings</h1>
                  <p className="text-neutral-600">Manage your account information</p>
                </div>

                <Card className="p-8 mb-6">
                  <h3 className="mb-6">Personal Information</h3>
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
                        await individualApi.updateMyProfile({
                          firstName: profileForm.firstName,
                          lastName: profileForm.lastName,
                          causeOfCare: profileForm.interests,
                          userContact: profileForm.phone,
                          location: profileForm.location,
                        });
                        setProfileMessage("Profile updated successfully!");
                        individualApi.getMyProfile().then((p: any) => setProfile(p)).catch(() => {});
                      } catch (err) {
                        setActionError(err instanceof ApiError ? err.message : "Couldn't update profile.");
                      }
                    }}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="mt-2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="mt-2"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={profile?.email || ""} className="mt-2" disabled />
                      <p className="text-xs text-neutral-500 mt-1">
                        Email can't be changed here — the backend's profile update endpoint doesn't accept it.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="mt-2"
                      />
                      {/* NOTE: the standalone "Province" dropdown from the original mock UI
                          has been removed — Users.Location is a single free-text field on
                          the backend, there's no separate province column to bind it to. */}
                    </div>

                    <div>
                      <Label htmlFor="interests">Interests/Causes</Label>
                      <Input
                        id="interests"
                        value={profileForm.interests}
                        onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                        className="mt-2"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Comma-separated (e.g., Education, Environment)</p>
                    </div>

                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      Update Profile
                    </Button>
                  </form>
                </Card>

                <Card className="p-8 mb-6">
                  <h3 className="mb-4">Change Password</h3>
                  {passwordMessage && (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">
                      {passwordMessage}
                    </div>
                  )}
                  <form
                    className="space-y-6"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setPasswordMessage(null);
                      setActionError(null);
                      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                        setActionError("New passwords don't match.");
                        return;
                      }
                      try {
                        await individualApi.changePassword({
                          currentPassword: passwordForm.currentPassword,
                          newPassword: passwordForm.newPassword,
                        });
                        setPasswordMessage("Password changed successfully!");
                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      } catch (err) {
                        setActionError(err instanceof ApiError ? err.message : "Couldn't change password.");
                      }
                    }}
                  >
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="mt-2"
                        required
                      />
                    </div>

                    <Button type="submit" variant="outline">
                      Change Password
                    </Button>
                  </form>
                </Card>

                <Card className="p-8 border-red-200 bg-red-50">
                  <h3 className="mb-4 text-red-900">Deactivate Account</h3>
                  <p className="text-red-800 text-sm mb-6">
                    The backend doesn't hard-delete accounts (deleting would cascade into
                    donations/volunteer history) — this deactivates your account instead,
                    the same pattern used everywhere else in the API.
                  </p>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-100"
                    onClick={async () => {
                      const pwd = prompt("Enter your password to confirm deactivation:");
                      if (!pwd) return;
                      try {
                        await individualApi.deactivate(pwd);
                        alert("Your account has been deactivated.");
                        handleLogout();
                      } catch (err) {
                        alert(err instanceof ApiError ? err.message : "Couldn't deactivate account.");
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deactivate My Account
                  </Button>
                </Card>
              </div>
            )}

            {/* Following tab shows organizations the user follows */}
          </motion.div>
        </main>
      </div>

      {/* Volunteer Application Modal */}
      {showVolunteerModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Apply for Volunteer Role</h3>
              <button onClick={() => setShowVolunteerModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {actionError}
              </div>
            )}
            <form onSubmit={handleSubmitVolunteerApplication} className="space-y-6">
              <div>
                <Label htmlFor="vol-name">Full Name</Label>
                <Input
                  id="vol-name"
                  value={`${volForm.firstName} ${volForm.lastName}`.trim()}
                  onChange={(e) => {
                    const [first, ...rest] = e.target.value.split(" ");
                    setVolForm({ ...volForm, firstName: first || "", lastName: rest.join(" ") });
                  }}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="vol-email">Email</Label>
                <Input
                  id="vol-email"
                  type="email"
                  value={volForm.email}
                  onChange={(e) => setVolForm({ ...volForm, email: e.target.value })}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="vol-phone">Phone Number</Label>
                <Input
                  id="vol-phone"
                  type="tel"
                  placeholder="+27 XX XXX XXXX"
                  value={volForm.phoneNum}
                  onChange={(e) => setVolForm({ ...volForm, phoneNum: e.target.value })}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="vol-skills">Your Skills</Label>
                <Input
                  id="vol-skills"
                  placeholder="e.g., Teaching, First Aid"
                  value={volForm.skills}
                  onChange={(e) => setVolForm({ ...volForm, skills: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="vol-availability">Your Availability</Label>
                <Textarea
                  id="vol-availability"
                  placeholder="When are you available? e.g., Weekends, Evenings"
                  value={volForm.availability}
                  onChange={(e) => setVolForm({ ...volForm, availability: e.target.value })}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="vol-motivation">Why do you want to volunteer?</Label>
                <Textarea
                  id="vol-motivation"
                  placeholder="Tell us about your motivation..."
                  value={volForm.whyVolunteer}
                  onChange={(e) => setVolForm({ ...volForm, whyVolunteer: e.target.value })}
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={isApplyingVolunteer}>
                  {isApplyingVolunteer ? "Submitting..." : "Submit Application"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowVolunteerModal(false)}>
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
              <h3>Make a Donation</h3>
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
              {/* Simulated top-up: there's no real payment gateway wired up, so
                  this deposits straight into the wallet (see WalletController.Deposit).
                  Without topping up first, donations always fail with
                  "Insufficient wallet balance" since every wallet starts at R0. */}
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
                <Label htmlFor="amount">Donation Amount (R)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="500"
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>Quick amounts</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDonateAmount("100")}>R 100</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDonateAmount("250")}>R 250</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDonateAmount("500")}>R 500</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDonateAmount("1000")}>R 1000</Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={isDonating}>
                  {isDonating ? "Processing..." : "Donate Now"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDonateModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
