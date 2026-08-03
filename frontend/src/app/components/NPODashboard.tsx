import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../../lib/AuthContext";
import {
  npoApi,
  postApi,
  individualApi,
  volunteerOpportunityApi,
  volunteerApplicationApi,
  walletApi,
  transactionApi,
  campaignApi,
  campaignApplicationApi,
  fundingRequestApi,
  projectApi,
  impactTrackApi,
  verificationApi,
  FundingRequestDto,
  ProjectDto,
  ImpactTrackDto,
  ApiError,
} from "../../lib/api";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Users,
  Heart,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  LogOut,
  BarChart3,
  Upload,
  DollarSign,
  UserPlus,
  X,
  Check,
  Clock,
  Calendar,
  Wallet,
  ArrowDownToLine,
  ArrowUpRight,
  CreditCard,
  Edit,
  Trash2,
  MessageSquare,
  Image,
  Target
} from "lucide-react";

export default function NPODashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showViewPost, setShowViewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedNPO, setSelectedNPO] = useState<number | null>(null);
  const [followedNPOs, setFollowedNPOs] = useState<number[]>([]);
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState("All");
  const [actionError, setActionError] = useState<string | null>(null);

  // "Campaigns" here (fundraising goal/target/raised/deadline, created by
  // the NPO itself) — backed by FundingRequestController /
  // FundingRequest, a real entity that already existed in the schema but
  // had no controller until now. Distinct from CampaignController, which
  // is a Business-initiated CSR partnership campaign that NPOs *apply to*
  // (see the "Partnership Campaigns" tab above).
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showViewCampaign, setShowViewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    purpose: "",
    budget: ""
  });
  const [myCampaigns, setMyCampaigns] = useState<FundingRequestDto[]>([]);

  // Own NPO profile — GET /api/npo/me
  const [npoProfile, setNpoProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    npoApi
      .getMyProfile()
      .then((p: any) => setNpoProfile(p))
      .catch(() => {});
  }, [user]);

  const loadMyCampaigns = () => {
    if (!npoProfile?.npoId) return;
    fundingRequestApi.getByNpo(npoProfile.npoId).then(setMyCampaigns).catch(() => setMyCampaigns([]));
  };

  useEffect(() => {
    loadMyCampaigns();
  }, [npoProfile]);

  // Projects & Initiatives — backed by ProjectController / Project, a real
  // entity that already existed in the schema but had no controller. The
  // "Projects & Initiatives" tab used to render four fully hardcoded cards
  // with no create/edit affordance at all.
  const [myProjects, setMyProjects] = useState<ProjectDto[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ projectName: "", projectDesc: "", projectStatus: "Planning", projectProgress: "0" });

  const loadMyProjects = () => {
    projectApi.getMine().then(setMyProjects).catch(() => setMyProjects([]));
  };

  useEffect(() => {
    if (!npoProfile) return;
    loadMyProjects();
  }, [npoProfile]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await projectApi.create({
        projectName: projectForm.projectName,
        projectDesc: projectForm.projectDesc,
        projectStatus: projectForm.projectStatus,
        projectProgress: Number(projectForm.projectProgress) || 0,
      });
      setProjectForm({ projectName: "", projectDesc: "", projectStatus: "Planning", projectProgress: "0" });
      setShowCreateProject(false);
      loadMyProjects();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't create project.");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await projectApi.remove(id);
      loadMyProjects();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't delete project.");
    }
  };

  // Impact Tracking — backed by ImpactTrackController / ImpactTrack, same
  // situation as Projects: a real entity with no controller. The "Record
  // New Impact" form used to submit nowhere at all.
  const [myImpactTracks, setMyImpactTracks] = useState<ImpactTrackDto[]>([]);
  const [impactForm, setImpactForm] = useState({ impactMetric: "", value: "", period: "", description: "" });

  const loadMyImpactTracks = () => {
    impactTrackApi.getMine().then(setMyImpactTracks).catch(() => setMyImpactTracks([]));
  };

  useEffect(() => {
    if (!npoProfile) return;
    loadMyImpactTracks();
  }, [npoProfile]);

  const handleRecordImpact = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await impactTrackApi.create({
        impactMetric: impactForm.impactMetric,
        value: Number(impactForm.value) || 0,
        period: impactForm.period,
        description: impactForm.description || null,
      });
      setImpactForm({ impactMetric: "", value: "", period: "", description: "" });
      loadMyImpactTracks();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't record impact.");
    }
  };

  const [npoProfileForm, setNpoProfileForm] = useState({ organizationName: "", focusArea: "", mission: "" });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // NPO verification submission — backed by VerificationController, which
  // fills in the missing half of an already-existing feature: the
  // Verification entity (with NPOCertificate/NPOTaxCertificate columns)
  // and the Admin approve/reject endpoints existed, but nothing ever
  // created a Verification row, so the Admin queue was structurally
  // always empty. This lets an NPO actually submit one.
  const [myVerifications, setMyVerifications] = useState<{ verificationId: number; status: string; submittedDate: string; reviewedDate: string | null }[]>([]);
  const [verificationForm, setVerificationForm] = useState({ npoCertificate: "", npoTaxCertificate: "" });
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const loadMyVerifications = () => {
    verificationApi.getMine().then(setMyVerifications).catch(() => setMyVerifications([]));
  };

  useEffect(() => {
    if (!npoProfile) return;
    loadMyVerifications();
  }, [npoProfile]);

  const latestVerification = myVerifications[0];

  // Supporters & Donors — GET /api/npo/me/supporters
  const [mySupporters, setMySupporters] = useState<{ userId: number; name: string; userType: string; followDate: string; totalContributed: number }[]>([]);

  useEffect(() => {
    if (!npoProfile) return;
    npoApi.getMySupporters().then(setMySupporters).catch(() => setMySupporters([]));
  }, [npoProfile]);

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setVerificationMessage(null);
    try {
      await verificationApi.submit({
        npoCertificate: verificationForm.npoCertificate || undefined,
        npoTaxCertificate: verificationForm.npoTaxCertificate || undefined,
      });
      setVerificationMessage("Verification request submitted for review.");
      setVerificationForm({ npoCertificate: "", npoTaxCertificate: "" });
      loadMyVerifications();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't submit verification request.");
    }
  };

  useEffect(() => {
    if (!npoProfile) return;
    setNpoProfileForm({
      organizationName: npoProfile.organizationName || "",
      focusArea: npoProfile.npofocusArea || "",
      mission: npoProfile.npomission || "",
    });
  }, [npoProfile]);

  // Wallet balance — GET /api/wallet/user/{userId}/balance
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    walletApi
      .getBalance(user.userId)
      .then((res) => setWalletBalance(res.balance))
      .catch(() => {});
  }, [user]);

  // Posts — GET/POST/PUT/DELETE /api/post
  const [posts, setPosts] = useState<any[]>([]);

  const loadPosts = () => {
    if (!user) return;
    postApi
      .getByUserId(user.userId)
      .then((res) =>
        setPosts(
          (res as any[]).map((p) => ({
            id: p.postId,
            npoId: user.userId,
            npoName: npoProfile?.organizationName || "Your Organization",
            category: "Community", // backend posts don't have a category field
            title: p.postTitle,
            description: p.content || "",
            image:
              p.mediaUrl ||
              "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
            date: p.timestamp,
            likes: p.likeCount || 0,
            comments: 0,
          }))
        )
      )
      .catch(() => setPosts([]));
  };

  useEffect(() => {
    loadPosts();
  }, [user, npoProfile]);

  // All NPOs for discovery (an NPO can also follow/donate to peer NPOs)
  const [allNPOs, setAllNPOs] = useState<any[]>([]);

  useEffect(() => {
    individualApi
      .discoverNpos()
      .then((npos) =>
        setAllNPOs(
          npos
            .filter((n) => n.npoId !== npoProfile?.npoId)
            .map((n) => ({
              id: n.npoId,
              name: n.organizationName,
              location: n.location || "Unknown",
              category: n.focusArea || "General",
              description: n.mission || "",
              verified: n.isVerified,
              followers: n.followerCount,
              impact: "",
            }))
        )
      )
      .catch(() => setAllNPOs([]));
  }, [npoProfile]);

  // Volunteer opportunities belonging to this NPO — GET /api/VolunteerOpportunity/npo/{npoId}
  const [myOpportunities, setMyOpportunities] = useState<any[]>([]);

  const loadOpportunities = () => {
    if (!npoProfile?.npoId) return;
    volunteerOpportunityApi
      .getByNpo(npoProfile.npoId)
      .then((opps) =>
        setMyOpportunities(
          (opps as any[]).map((o) => ({
            id: o.opportunityId,
            title: o.roleTitle,
            category: o.category || "",
            positions: o.numOfPositions,
            timeCommitment: o.timeCommitment || "",
            description: o.description || "",
            skillsRequired: o.skillsRequired || "",
            duration: o.duration || "",
          }))
        )
      )
      .catch(() => setMyOpportunities([]));
  };

  useEffect(() => {
    loadOpportunities();
  }, [npoProfile]);

  const [oppForm, setOppForm] = useState({
    title: "",
    category: "",
    positions: "",
    description: "",
    timeCommitment: "",
    duration: "",
    skillsRequired: "",
  });

  // Business partnership campaigns this NPO can apply to — GET /api/campaigns
  // (CampaignController). Distinct from "myCampaigns" above (which is the
  // local-only mock fundraising feature with no backend model). Applying
  // uses POST /api/campaignapplications/apply/{campaignId}.
  const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([]);
  const [myCampaignApplications, setMyCampaignApplications] = useState<Record<number, string>>({});
  const [showApplyCampaignModal, setShowApplyCampaignModal] = useState(false);
  const [selectedCampaignToApply, setSelectedCampaignToApply] = useState<number | null>(null);
  const [campaignMotivation, setCampaignMotivation] = useState("");
  const [isApplyingToCampaign, setIsApplyingToCampaign] = useState(false);

  const loadAvailableCampaigns = () => {
    campaignApi
      .getAll()
      .then((list) =>
        setAvailableCampaigns(
          (list as any[]).map((c) => ({
            id: c.campaignId,
            businessId: c.businessId,
            title: c.title,
            description: c.description || "",
            category: c.category || "General",
            budgetPerPartner: c.budgetPerPartner || 0,
          }))
        )
      )
      .catch(() => setAvailableCampaigns([]));
  };

  useEffect(() => {
    loadAvailableCampaigns();
  }, []);

  const handleApplyToCampaign = (campaignId: number) => {
    setSelectedCampaignToApply(campaignId);
    setCampaignMotivation("");
    setShowApplyCampaignModal(true);
  };

  const handleSubmitCampaignApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignToApply) return;
    setActionError(null);
    setIsApplyingToCampaign(true);
    try {
      await campaignApplicationApi.apply(selectedCampaignToApply, campaignMotivation || undefined);
      setMyCampaignApplications((prev) => ({ ...prev, [selectedCampaignToApply]: "Pending" }));
      setShowApplyCampaignModal(false);
      setSelectedCampaignToApply(null);
      setCampaignMotivation("");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't submit application.");
    } finally {
      setIsApplyingToCampaign(false);
    }
  };

  // Volunteer applications for this NPO's opportunities — one call per
  // opportunity, since the backend only exposes GET by opportunity, not by NPO.
  const [volunteerApplications, setVolunteerApplications] = useState<any[]>([]);
  const [activeVolunteers, setActiveVolunteers] = useState<any[]>([]);

  const loadApplications = () => {
    if (myOpportunities.length === 0) {
      setVolunteerApplications([]);
      setActiveVolunteers([]);
      return;
    }
    Promise.all(
      myOpportunities.map((o) =>
        volunteerApplicationApi
          .getByOpportunity(o.id)
          .then((apps) => (apps as any[]).map((a) => ({ ...a, opportunityTitle: o.title })))
          .catch(() => [])
      )
    ).then((results) => {
      const all = results.flat();
      setVolunteerApplications(
        all
          .filter((a: any) => a.status === "Pending")
          .map((a: any) => ({
            id: a.applicationId,
            name: `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.email,
            email: a.email,
            phone: a.phoneNum,
            opportunity: a.opportunityTitle,
            status: "pending",
            appliedDate: a.applicationDate,
            skills: a.skills,
            availability: a.availability,
          }))
      );
      setActiveVolunteers(
        all
          .filter((a: any) => a.status === "Accepted")
          .map((a: any) => ({
            id: a.applicationId,
            name: `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.email,
            email: a.email,
            opportunity: a.opportunityTitle,
            joinedDate: a.applicationDate,
            hoursContributed: a.totalHoursLogged || 0,
          }))
      );
    });
  };

  useEffect(() => {
    loadApplications();
  }, [myOpportunities]);

  // Transactions — GET /api/transaction/user/{userId}
  const [transactions, setTransactions] = useState<any[]>([]);

  const loadTransactions = () => {
    if (!user) return;
    transactionApi
      .getByUser(user.userId)
      .then((res) =>
        setTransactions(
          // NOTE: the backend returns `transactionType` (e.g. "Donation",
          // "Withdrawal", "Deposit"), not `type` — the field never existed,
          // so this used to always fall through to the amount-sign
          // heuristic, which is also wrong: amounts are always stored as
          // positive decimals (direction is only encoded in
          // transactionType/senderUserId/receiverUserId), so every
          // transaction was mislabeled "donation". Read transactionType
          // directly instead.
          (res as any[]).map((t: any) => {
            const isOutgoing = t.senderUserId === user.userId;
            return {
              id: t.transactionId,
              type: (t.transactionType || "donation").toLowerCase(),
              from: t.senderName || "Donor",
              to: t.receiverName || "Bank Account",
              amount: isOutgoing ? -t.amount : t.amount,
              date: t.timestamp,
              status: (t.status || "completed").toLowerCase(),
              method: "—", // no backend field for payment method
            };
          })
        )
      )
      .catch(() => setTransactions([]));
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAcceptVolunteer = async (id: number) => {
    setActionError(null);
    try {
      await volunteerApplicationApi.accept(id);
      loadApplications();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't accept application.");
    }
  };

  const handleRejectVolunteer = async (id: number) => {
    setActionError(null);
    try {
      await volunteerApplicationApi.reject(id);
      loadApplications();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't reject application.");
    }
  };

  const handleRemoveVolunteer = (id: number) => {
    // NOTE: no backend endpoint to remove/deactivate an accepted volunteer —
    // VolunteerApplicationController only supports accept/reject/pending.
    // Left as local-only UI state.
    setActiveVolunteers(activeVolunteers.filter(vol => vol.id !== id));
  };

  const handleDeletePost = async (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await postApi.remove(id);
        loadPosts();
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : "Couldn't delete post.");
      }
    }
  };

  const handleViewPost = (id: number) => {
    setSelectedPost(id);
    setShowViewPost(true);
  };

  const handleFollowNPO = async (id: number) => {
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

  const handleDonateToNPO = (id: number) => {
    setSelectedNPO(id);
    setShowDonateModal(true);
    if (user) walletApi.getBalance(user.userId).then((res) => setWalletBalance(res.balance)).catch(() => {});
  };

  const [donateAmount, setDonateAmount] = useState("");
  const [isDonating, setIsDonating] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isToppingUp, setIsToppingUp] = useState(false);

  // Top up wallet — POST /api/wallet/deposit. Simulates a real payment
  // gateway crediting the wallet before it can donate to a fellow NPO.
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

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNPO) return;
    const amount = Number(donateAmount);
    if (!amount || amount <= 0) return;
    setActionError(null);
    setIsDonating(true);
    try {
      await individualApi.donate(selectedNPO, amount);
      setShowDonateModal(false);
      setSelectedNPO(null);
      setDonateAmount("");
      if (user) walletApi.getBalance(user.userId).then((res) => setWalletBalance(res.balance)).catch(() => {});
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Donation failed. Please try again.");
    } finally {
      setIsDonating(false);
    }
  };

  // Filter posts for community updates
  const filteredPosts = posts.filter(post => {
    const matchesSearch = postSearchQuery === "" ||
      post.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.npoName.toLowerCase().includes(postSearchQuery.toLowerCase());

    const matchesCategory = postCategoryFilter === "All" || post.category === postCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="text-xl text-neutral-900">
            UbuntuConnect
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-neutral-600">{npoProfile?.organizationName || user?.email}</span>
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
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "overview"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("discover")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "discover"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Users className="w-5 h-5" />
              Discover NPOs
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
              Organization Profile
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "projects"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FileText className="w-5 h-5" />
              Projects & Initiatives
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
              Impact Tracking
            </button>
            <button
              onClick={() => setActiveTab("supporters")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "supporters"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Users className="w-5 h-5" />
              Supporters
            </button>
            <button
              onClick={() => setActiveTab("funding")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "funding"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Funding Requests
            </button>
            <button
              onClick={() => setActiveTab("partnerships")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "partnerships"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Target className="w-5 h-5" />
              Partnership Campaigns
            </button>
            <button
              onClick={() => setActiveTab("volunteers")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "volunteers"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Volunteers
            </button>
            <button
              onClick={() => setActiveTab("finances")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "finances"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Wallet className="w-5 h-5" />
              Finances & Wallet
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "posts"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Posts & Updates
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
                  <p className="text-neutral-600">Support other NPOs in your community (Ubuntu spirit!)</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {allNPOs.map((npo) => (
                    <Card key={npo.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3>{npo.name}</h3>
                            {npo.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <span>{npo.location}</span>
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
                          onClick={() => handleFollowNPO(npo.id)}
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
                          onClick={() => handleDonateToNPO(npo.id)}
                        >
                          Donate
                        </Button>
                      </div>
                    </Card>
                  ))}
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
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {post.image && (
                        <div className="relative h-48">
                          <img
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

                {filteredPosts.length === 0 && (
                  <Card className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No posts found</h3>
                    <p className="text-neutral-600">Try adjusting your search or filters</p>
                  </Card>
                )}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">Dashboard Overview</h1>
                    <p className="text-neutral-600">Welcome back{npoProfile?.organizationName ? `, ${npoProfile.organizationName}` : ""}</p>
                  </div>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Update
                  </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("finances")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Wallet Balance</span>
                      <Wallet className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">R {walletBalance.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Available to withdraw</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Total Supporters</span>
                      <Users className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">248</div>
                    <div className="text-sm text-green-600">+12 this month</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Active Volunteers</span>
                      <UserPlus className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">{activeVolunteers.length}</div>
                    <div className="text-sm text-amber-600">{volunteerApplications.length} pending</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Active Projects</span>
                      <FileText className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">6</div>
                    <div className="text-sm text-neutral-600">2 completed</div>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="p-6">
                  <h3 className="mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 pb-4 border-b border-neutral-200">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">New volunteer application</p>
                        <p className="text-xs text-neutral-600">Themba K. applied for Youth Mentorship • 1 hour ago</p>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab("volunteers")}>
                        Review
                      </Button>
                    </div>
                    <div className="flex items-start gap-4 pb-4 border-b border-neutral-200">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">New donation received</p>
                        <p className="text-xs text-neutral-600">R 500 from Sarah M. • 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 pb-4 border-b border-neutral-200">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">5 new followers</p>
                        <p className="text-xs text-neutral-600">Your profile is gaining traction • 5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">Project update published</p>
                        <p className="text-xs text-neutral-600">"Youth Mentorship Program" milestone reached • Yesterday</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Organization Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <h1 className="mb-8">Organization Profile</h1>

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
                        await npoApi.updateMyProfile({
                          organizationName: npoProfileForm.organizationName,
                          NPOFocusArea: npoProfileForm.focusArea,
                          NPOMission: npoProfileForm.mission,
                        });
                        setProfileMessage("Profile updated successfully!");
                        npoApi.getMyProfile().then((p: any) => setNpoProfile(p)).catch(() => {});
                      } catch (err) {
                        setActionError(err instanceof ApiError ? err.message : "Couldn't update profile.");
                      }
                    }}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input
                          id="org-name"
                          value={npoProfileForm.organizationName}
                          onChange={(e) => setNpoProfileForm({ ...npoProfileForm, organizationName: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="registration">NPO Registration Number</Label>
                        <Input
                          id="registration"
                          value={npoProfile?.nporegNum || ""}
                          className="mt-2"
                          disabled
                        />
                        <p className="text-xs text-neutral-500 mt-1">Read-only — not editable via the update-profile endpoint.</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mission">Mission Statement</Label>
                      <Textarea
                        id="mission"
                        value={npoProfileForm.mission}
                        onChange={(e) => setNpoProfileForm({ ...npoProfileForm, mission: e.target.value })}
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="focus-area">Focus Area</Label>
                      <Input
                        id="focus-area"
                        value={npoProfileForm.focusArea}
                        onChange={(e) => setNpoProfileForm({ ...npoProfileForm, focusArea: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    {/* NOTE: email, phone, physical address, year founded, website, and
                        logo upload have no backing columns on the Npo entity /
                        UpdateNPORequest DTO — the backend only supports
                        organizationName, focus area, and mission. Those fields have been
                        removed from this form rather than left as fake no-op inputs. Add
                        the corresponding backend columns + DTO fields first if you want
                        them editable here. */}

                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      Save Changes
                    </Button>
                  </form>
                </Card>

                <Card className="p-8 mt-8">
                  <h3 className="mb-2">Account Verification</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    Submit your NPO registration and tax certificates for admin review. Once
                    approved, your organization shows a verified badge across the platform.
                  </p>

                  {verificationMessage && (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">
                      {verificationMessage}
                    </div>
                  )}

                  {npoProfile && myVerifications !== null && (
                    <>
                      {latestVerification ? (
                        <div className="mb-6">
                          <Badge
                            className={
                              latestVerification.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : latestVerification.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {latestVerification.status}
                          </Badge>
                          <p className="text-sm text-neutral-600 mt-2">
                            Submitted {new Date(latestVerification.submittedDate).toLocaleDateString("en-ZA")}
                          </p>
                        </div>
                      ) : null}

                      {(!latestVerification || latestVerification.status === "Rejected") && (
                        <form className="space-y-6" onSubmit={handleSubmitVerification}>
                          <div>
                            <Label htmlFor="npo-cert">NPO Registration Certificate (URL)</Label>
                            {/* No file-upload pipeline exists in this API — same
                                pattern as Post.MediaUrl / VolunteerApplication images —
                                so this stores a link/reference rather than raw bytes. */}
                            <Input
                              id="npo-cert"
                              placeholder="https://..."
                              className="mt-2"
                              value={verificationForm.npoCertificate}
                              onChange={(e) => setVerificationForm({ ...verificationForm, npoCertificate: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="npo-tax-cert">Tax Exemption Certificate (URL)</Label>
                            <Input
                              id="npo-tax-cert"
                              placeholder="https://..."
                              className="mt-2"
                              value={verificationForm.npoTaxCertificate}
                              onChange={(e) => setVerificationForm({ ...verificationForm, npoTaxCertificate: e.target.value })}
                            />
                          </div>
                          <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                            Submit for Verification
                          </Button>
                        </form>
                      )}
                    </>
                  )}
                </Card>

                <Card className="p-8 mt-8 bg-neutral-50">
                  <h3 className="mb-2">Change Password</h3>
                  <p className="text-sm text-neutral-600">
                    NOTE: NPOController has no change-password endpoint (unlike
                    IndividualController, which does) — this can't be wired up without a
                    backend addition, so it's been removed from this form rather than kept
                    as a non-functional stub.
                  </p>
                </Card>

                <Card className="p-8 mt-8 border-red-200 bg-red-50">
                  <h3 className="mb-2 text-red-700">Delete / Deactivate Account</h3>
                  <p className="text-neutral-600">
                    NOTE: NPOController intentionally has no delete/deactivate endpoint
                    (see the comment at the bottom of NPOController.cs — cascading deletes
                    across opportunities/applications/follows were the concern). There's
                    nothing to wire this up to yet.
                  </p>
                </Card>
              </div>
            )}

            {/* Projects Tab — real CRUD backed by ProjectController */}
            {activeTab === "projects" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h1>Projects & Initiatives</h1>
                  <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowCreateProject(!showCreateProject)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </div>

                {actionError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-6">
                    {actionError}
                  </div>
                )}

                {showCreateProject && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Card className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3>Create Project</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowCreateProject(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <form className="space-y-6" onSubmit={handleCreateProject}>
                        <div>
                          <Label htmlFor="project-name">Project Name</Label>
                          <Input
                            id="project-name"
                            className="mt-2"
                            value={projectForm.projectName}
                            onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="project-desc">Description</Label>
                          <Textarea
                            id="project-desc"
                            className="mt-2"
                            rows={3}
                            value={projectForm.projectDesc}
                            onChange={(e) => setProjectForm({ ...projectForm, projectDesc: e.target.value })}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="project-status">Status</Label>
                            <select
                              id="project-status"
                              className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                              value={projectForm.projectStatus}
                              onChange={(e) => setProjectForm({ ...projectForm, projectStatus: e.target.value })}
                            >
                              <option value="Planning">Planning</option>
                              <option value="Active">Active</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="project-progress">Progress (%)</Label>
                            <Input
                              id="project-progress"
                              type="number"
                              min="0"
                              max="100"
                              className="mt-2"
                              value={projectForm.projectProgress}
                              onChange={(e) => setProjectForm({ ...projectForm, projectProgress: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                          Create Project
                        </Button>
                      </form>
                    </Card>
                  </motion.div>
                )}

                {myProjects.length === 0 ? (
                  <Card className="p-12 text-center">
                    <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No projects yet</h3>
                    <p className="text-neutral-600">Create your first project to showcase your organization's work</p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {myProjects.map((project) => (
                      <Card key={project.projectId} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="mb-1">{project.projectName}</h3>
                            <p className="text-sm text-neutral-600">{project.projectDesc}</p>
                          </div>
                          <Badge
                            className={
                              project.projectStatus === "Active"
                                ? "bg-green-100 text-green-700"
                                : project.projectStatus === "Completed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {project.projectStatus}
                          </Badge>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-neutral-600">Progress</span>
                            <span>{project.projectProgress}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${project.projectStatus === "Completed" ? "bg-green-600" : "bg-orange-600"}`}
                              style={{ width: `${Math.min(project.projectProgress, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteProject(project.projectId)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Impact Tracking Tab — real CRUD backed by ImpactTrackController */}
            {activeTab === "impact" && (
              <div>
                <h1 className="mb-8">Impact Tracking</h1>

                {actionError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-6">
                    {actionError}
                  </div>
                )}

                {myImpactTracks.length === 0 ? (
                  <Card className="p-8 text-center mb-8">
                    <p className="text-neutral-600">No impact recorded yet. Use the form below to add your first metric.</p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {myImpactTracks.map((impact) => (
                      <Card key={impact.impactId} className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-neutral-600 text-sm mb-2">{impact.impactMetric}</div>
                          <button
                            onClick={async () => {
                              try {
                                await impactTrackApi.remove(impact.impactId);
                                loadMyImpactTracks();
                              } catch (err) {
                                setActionError(err instanceof ApiError ? err.message : "Couldn't delete impact record.");
                              }
                            }}
                          >
                            <X className="w-4 h-4 text-neutral-400 hover:text-red-600" />
                          </button>
                        </div>
                        <div className="text-4xl mb-1">{impact.value.toLocaleString()}</div>
                        <div className="text-sm text-neutral-600">{impact.period}</div>
                        {impact.description && <p className="text-sm text-neutral-600 mt-2">{impact.description}</p>}
                      </Card>
                    ))}
                  </div>
                )}

                <Card className="p-8">
                  <h3 className="mb-6">Record New Impact</h3>
                  <form className="space-y-6" onSubmit={handleRecordImpact}>
                    <div>
                      <Label htmlFor="metric">Impact Metric</Label>
                      <Input
                        id="metric"
                        placeholder="e.g., Students enrolled, Meals served, Books distributed"
                        className="mt-2"
                        value={impactForm.impactMetric}
                        onChange={(e) => setImpactForm({ ...impactForm, impactMetric: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="value">Value</Label>
                        <Input
                          id="value"
                          type="number"
                          placeholder="e.g., 25"
                          className="mt-2"
                          value={impactForm.value}
                          onChange={(e) => setImpactForm({ ...impactForm, value: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="period">Period</Label>
                        <Input
                          id="period"
                          placeholder="e.g., March 2026, Q1 2026"
                          className="mt-2"
                          value={impactForm.period}
                          onChange={(e) => setImpactForm({ ...impactForm, period: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide context about this impact..."
                        className="mt-2"
                        rows={4}
                        value={impactForm.description}
                        onChange={(e) => setImpactForm({ ...impactForm, description: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      Record Impact
                    </Button>
                  </form>
                </Card>
              </div>
            )}

            {/* Supporters Tab — real data backed by NPOController.GetMySupporters,
                joining Follow + Transaction + Profile (all pre-existing tables). */}
            {activeTab === "supporters" && (
              <div>
                <h1 className="mb-8">Supporters & Donors</h1>

                {mySupporters.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Users className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No supporters yet</h3>
                    <p className="text-neutral-600">Followers and donors will show up here once people start following your organization</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {mySupporters.map((supporter) => (
                      <Card key={supporter.userId} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-lg">{supporter.name.slice(0, 2).toUpperCase()}</span>
                            </div>
                            <div>
                              <h3 className="mb-1">{supporter.name}</h3>
                              <p className="text-sm text-neutral-600">
                                {supporter.userType === "Business" ? "Business Partner" : "Individual Donor"} • Following since{" "}
                                {new Date(supporter.followDate).toLocaleDateString("en-ZA", { year: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-neutral-600 mb-1">Total Contributed</div>
                            <div className="text-lg">R {supporter.totalContributed.toLocaleString()}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Partnership Campaigns Tab — Business-initiated CSR campaigns
                (CampaignController) that this NPO can apply to. */}
            {activeTab === "partnerships" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Partnership Campaigns</h1>
                  <p className="text-neutral-600">Apply to CSR/B-BBEE partnership campaigns posted by businesses</p>
                </div>

                {actionError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-6">
                    {actionError}
                  </div>
                )}

                {availableCampaigns.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Target className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No campaigns available yet</h3>
                    <p className="text-neutral-600">Check back later for new business partnership opportunities</p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {availableCampaigns.map((campaign) => {
                      const applicationStatus = myCampaignApplications[campaign.id];
                      return (
                        <Card key={campaign.id} className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="mb-1">{campaign.title}</h3>
                              <Badge variant="outline">{campaign.category}</Badge>
                            </div>
                          </div>
                          <p className="text-neutral-600 text-sm mb-4">{campaign.description}</p>
                          <div className="flex items-center justify-between text-sm mb-4">
                            <span className="text-neutral-600">
                              <DollarSign className="w-4 h-4 inline mr-1" />
                              R {campaign.budgetPerPartner.toLocaleString()} budget per partner
                            </span>
                          </div>
                          {applicationStatus ? (
                            <Badge className="bg-amber-100 text-amber-700">Application {applicationStatus}</Badge>
                          ) : (
                            <Button
                              className="w-full bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleApplyToCampaign(campaign.id)}
                            >
                              Apply to Partner
                            </Button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Funding Requests Tab */}
            {activeTab === "funding" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h1>Funding Requests</h1>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCreateCampaign(!showCreateCampaign)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Funding Request
                  </Button>
                </div>

                {/* Create Campaign Form */}
                {showCreateCampaign && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <Card className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3>Create Funding Request</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateCampaign(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
                          setActionError(null);
                          try {
                            await fundingRequestApi.create({
                              title: campaignFormData.name,
                              purpose: campaignFormData.purpose,
                              targetAmount: parseFloat(campaignFormData.targetAmount),
                              budgetBreakdown: campaignFormData.budget,
                              startDate: new Date().toISOString().slice(0, 10),
                              endDate: campaignFormData.deadline || null,
                            });
                            loadMyCampaigns();
                            setCampaignFormData({
                              name: "",
                              targetAmount: "",
                              deadline: "",
                              purpose: "",
                              budget: ""
                            });
                            setShowCreateCampaign(false);
                          } catch (err) {
                            setActionError(err instanceof ApiError ? err.message : "Couldn't create funding request.");
                          }
                        }}
                      >
                        <div>
                          <Label htmlFor="campaign-name">Campaign Name</Label>
                          <Input
                            id="campaign-name"
                            placeholder="e.g., Build Community Library"
                            className="mt-2"
                            value={campaignFormData.name}
                            onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
                            required
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="target-amount">Target Amount (R)</Label>
                            <Input
                              id="target-amount"
                              type="number"
                              placeholder="100000"
                              className="mt-2"
                              value={campaignFormData.targetAmount}
                              onChange={(e) => setCampaignFormData({...campaignFormData, targetAmount: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="deadline">Deadline</Label>
                            <Input
                              id="deadline"
                              type="date"
                              className="mt-2"
                              value={campaignFormData.deadline}
                              onChange={(e) => setCampaignFormData({...campaignFormData, deadline: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="purpose">Purpose & Goals</Label>
                          <Textarea
                            id="purpose"
                            placeholder="Explain what this funding will be used for and the impact it will create..."
                            className="mt-2"
                            rows={4}
                            value={campaignFormData.purpose}
                            onChange={(e) => setCampaignFormData({...campaignFormData, purpose: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="budget">Budget Breakdown</Label>
                          <Textarea
                            id="budget"
                            placeholder="Provide a detailed breakdown of how funds will be allocated..."
                            className="mt-2"
                            rows={4}
                            value={campaignFormData.budget}
                            onChange={(e) => setCampaignFormData({...campaignFormData, budget: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <Label>Campaign Images</Label>
                          <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
                            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                            <p className="text-sm text-neutral-600 mb-2">Upload images to showcase your campaign</p>
                            <p className="text-xs text-neutral-500">PNG, JPG up to 5MB each</p>
                          </div>
                        </div>

                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                          Create Campaign
                        </Button>
                      </form>
                    </Card>
                  </motion.div>
                )}

                <h2 className="mt-12 mb-6">Active Campaigns</h2>
                {myCampaigns.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-neutral-600">No campaigns yet. Create your first funding request above!</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {myCampaigns.map((campaign) => {
                      const daysRemaining = campaign.endDate
                        ? Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      const percent = campaign.targetAmount > 0 ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100) : 0;
                      return (
                        <Card key={campaign.requestId} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="mb-1">{campaign.title}</h3>
                              <p className="text-sm text-neutral-600 line-clamp-2">{campaign.purpose}</p>
                            </div>
                            <Badge className={daysRemaining !== null && daysRemaining < 0 ? "bg-neutral-100 text-neutral-700" : "bg-green-100 text-green-700"}>
                              {daysRemaining !== null && daysRemaining < 0 ? "Closed" : "Active"}
                            </Badge>
                          </div>
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-neutral-600">Raised</span>
                              <span>
                                R {campaign.raisedAmount.toLocaleString()} of R {campaign.targetAmount.toLocaleString()} ({percent}%)
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-4">
                            {/* NOTE: FundingRequest doesn't track a contributor count —
                                that would require joining donation transactions filtered
                                by fundingRequestId, which the Transaction table doesn't
                                currently store a link to. Omitted rather than faked. */}
                            <span className="text-neutral-600">
                              {daysRemaining !== null ? `${daysRemaining} days remaining` : "No deadline set"}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setSelectedCampaign(campaign.requestId);
                                setShowViewCampaign(true);
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`)) {
                                  try {
                                    await fundingRequestApi.remove(campaign.requestId);
                                    loadMyCampaigns();
                                  } catch (err) {
                                    setActionError(err instanceof ApiError ? err.message : "Couldn't delete campaign.");
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Volunteers Tab */}
            {activeTab === "volunteers" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">Volunteer Management</h1>
                    <p className="text-neutral-600">Manage volunteer opportunities and applications</p>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCreateOpportunity(!showCreateOpportunity)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Opportunity
                  </Button>
                </div>

                {/* Create Volunteer Opportunity Form */}
                {showCreateOpportunity && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <Card className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3>Create Volunteer Opportunity</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateOpportunity(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
                          if (!npoProfile?.npoId) return;
                          setActionError(null);
                          try {
                            await volunteerOpportunityApi.create({
                              npoId: npoProfile.npoId,
                              roleTitle: oppForm.title,
                              category: oppForm.category,
                              numOfPositions: Number(oppForm.positions) || 1,
                              description: oppForm.description,
                              skillsRequired: oppForm.skillsRequired,
                              timeCommitment: oppForm.timeCommitment,
                              duration: oppForm.duration,
                            });
                            setOppForm({ title: "", category: "", positions: "", description: "", timeCommitment: "", duration: "", skillsRequired: "" });
                            setShowCreateOpportunity(false);
                            loadOpportunities();
                          } catch (err) {
                            setActionError(err instanceof ApiError ? err.message : "Couldn't create opportunity.");
                          }
                        }}
                      >
                        <div>
                          <Label htmlFor="opportunity-title">Opportunity Title</Label>
                          <Input
                            id="opportunity-title"
                            placeholder="e.g., Youth Mentor, Library Assistant"
                            value={oppForm.title}
                            onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                            className="mt-2"
                            required
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Input
                              id="category"
                              placeholder="e.g., Education, Community Service"
                              value={oppForm.category}
                              onChange={(e) => setOppForm({ ...oppForm, category: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="positions">Number of Positions</Label>
                            <Input
                              id="positions"
                              type="number"
                              placeholder="5"
                              value={oppForm.positions}
                              onChange={(e) => setOppForm({ ...oppForm, positions: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Describe the volunteer role, responsibilities, and requirements..."
                            value={oppForm.description}
                            onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })}
                            className="mt-2"
                            rows={4}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="time-commitment">Time Commitment</Label>
                            <Input
                              id="time-commitment"
                              placeholder="e.g., 4 hours/week, Weekends only"
                              value={oppForm.timeCommitment}
                              onChange={(e) => setOppForm({ ...oppForm, timeCommitment: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="duration">Duration</Label>
                            <Input
                              id="duration"
                              placeholder="e.g., 3 months, Ongoing"
                              value={oppForm.duration}
                              onChange={(e) => setOppForm({ ...oppForm, duration: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="skills-required">Skills Required</Label>
                          <Input
                            id="skills-required"
                            placeholder="e.g., Teaching, First Aid, Computer Literacy"
                            value={oppForm.skillsRequired}
                            onChange={(e) => setOppForm({ ...oppForm, skillsRequired: e.target.value })}
                            className="mt-2"
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                            Create Opportunity
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCreateOpportunity(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </motion.div>
                )}

                {/* Tabs for Applications and Active Volunteers */}
                <Tabs defaultValue="applications" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="applications" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending Applications ({volunteerApplications.length})
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Active Volunteers ({activeVolunteers.length})
                    </TabsTrigger>
                    <TabsTrigger value="opportunities" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      All Opportunities
                    </TabsTrigger>
                  </TabsList>

                  {/* Pending Applications */}
                  <TabsContent value="applications">
                    <div className="space-y-4">
                      {volunteerApplications.length === 0 ? (
                        <Card className="p-12 text-center">
                          <UserPlus className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                          <p className="text-neutral-600">No pending applications</p>
                        </Card>
                      ) : (
                        volunteerApplications.map((application) => (
                          <Card key={application.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-start gap-4">
                                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">
                                      {application.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <h3 className="mb-1">{application.name}</h3>
                                        <p className="text-sm text-neutral-600">Applied for: {application.opportunity}</p>
                                      </div>
                                      <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                                      <div>
                                        <span className="text-neutral-600">Email:</span> {application.email}
                                      </div>
                                      <div>
                                        <span className="text-neutral-600">Phone:</span> {application.phone}
                                      </div>
                                      <div>
                                        <span className="text-neutral-600">Skills:</span> {application.skills}
                                      </div>
                                      <div>
                                        <span className="text-neutral-600">Availability:</span> {application.availability}
                                      </div>
                                      <div className="md:col-span-2">
                                        <span className="text-neutral-600">Applied:</span> {new Date(application.appliedDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleAcceptVolunteer(application.id)}
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => handleRejectVolunteer(application.id)}
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                      <Button size="sm" variant="outline">
                                        View Full Application
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Active Volunteers */}
                  <TabsContent value="active">
                    <div className="space-y-4">
                      {activeVolunteers.length === 0 ? (
                        <Card className="p-12 text-center">
                          <Users className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                          <p className="text-neutral-600">No active volunteers yet</p>
                        </Card>
                      ) : (
                        activeVolunteers.map((volunteer) => (
                          <Card key={volunteer.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg">
                                    {volunteer.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="mb-1">{volunteer.name}</h3>
                                      <p className="text-sm text-neutral-600">{volunteer.opportunity}</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                                  </div>
                                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                                    <div>
                                      <span className="text-neutral-600">Email:</span> {volunteer.email}
                                    </div>
                                    <div>
                                      <span className="text-neutral-600">Joined:</span> {new Date(volunteer.joinedDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' })}
                                    </div>
                                    <div>
                                      <span className="text-neutral-600">Hours:</span> {volunteer.hoursContributed}h
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Schedule
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      Log Hours
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      Send Message
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() => handleRemoveVolunteer(volunteer.id)}
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* All Opportunities */}
                  <TabsContent value="opportunities">
                    {myOpportunities.length === 0 ? (
                      <Card className="p-12 text-center">
                        <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <p className="text-neutral-600">No volunteer opportunities yet. Create one above.</p>
                      </Card>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {myOpportunities.map((opp) => {
                          const pendingCount = volunteerApplications.filter(
                            (a) => a.opportunity === opp.title
                          ).length;
                          return (
                            <Card key={opp.id} className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="mb-1">{opp.title}</h3>
                                  <p className="text-sm text-neutral-600">{opp.description}</p>
                                </div>
                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                              </div>
                              <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between">
                                  <span className="text-neutral-600">Positions:</span>
                                  <span>{opp.positions} available</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-600">Time:</span>
                                  <span>{opp.timeCommitment || "Flexible"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-600">Applications:</span>
                                  <span>{pendingCount} pending</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-red-600 hover:bg-red-50"
                                  onClick={async () => {
                                    if (!confirm("Delete this opportunity?")) return;
                                    try {
                                      await volunteerOpportunityApi.remove(opp.id);
                                      loadOpportunities();
                                    } catch (err) {
                                      setActionError(err instanceof ApiError ? err.message : "Couldn't delete opportunity.");
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Finances & Wallet Tab */}
            {activeTab === "finances" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">Finances & Wallet</h1>
                    <p className="text-neutral-600">Manage your funds, transactions, and withdrawals</p>
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowWithdrawModal(!showWithdrawModal)}
                  >
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </div>

                {/* Wallet Balance Card */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-white/80 text-sm">Available Balance</p>
                        <h2 className="text-white">R {walletBalance.toLocaleString()}</h2>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => setShowWithdrawModal(true)}
                    >
                      Withdraw Now
                    </Button>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">This Month</div>
                    <div className="text-3xl mb-1">R 8,550</div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUpRight className="w-4 h-4" />
                      +18% from last month
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Year to Date</div>
                    <div className="text-3xl mb-1">R 67,780</div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUpRight className="w-4 h-4" />
                      Total received in 2026
                    </div>
                  </Card>
                </div>

                {/* Withdraw Funds Form */}
                {showWithdrawModal && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <Card className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3>Withdraw Funds</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowWithdrawModal(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
                          if (!user) return;
                          const amount = Number(withdrawAmount);
                          if (!amount || amount <= 0 || amount > walletBalance) {
                            setActionError("Enter a valid amount within your available balance.");
                            return;
                          }
                          setActionError(null);
                          setIsWithdrawing(true);
                          try {
                            const res = await transactionApi.withdraw(user.userId, amount);
                            if (typeof res.newBalance === "number") setWalletBalance(res.newBalance);
                            else walletApi.getBalance(user.userId).then((r) => setWalletBalance(r.balance)).catch(() => {});
                            setWithdrawAmount("");
                            setShowWithdrawModal(false);
                            loadTransactions();
                          } catch (err) {
                            setActionError(err instanceof ApiError ? err.message : "Withdrawal failed.");
                          } finally {
                            setIsWithdrawing(false);
                          }
                        }}
                      >
                        <div className="bg-neutral-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-600">Available Balance</span>
                            <span className="text-xl">R {walletBalance.toLocaleString()}</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="withdraw-amount">Withdrawal Amount (R)</Label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="mt-2"
                            max={walletBalance}
                          />
                          <p className="text-xs text-neutral-500 mt-1">
                            Minimum withdrawal: R 100 | Maximum: R {walletBalance.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="bank-account">Bank Account</Label>
                          <select
                            id="bank-account"
                            className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                          >
                            <option value="">Select bank account</option>
                            <option value="1">FNB - Account ending in 4532</option>
                            <option value="2">Standard Bank - Account ending in 7821</option>
                            <option value="3">Add new bank account</option>
                          </select>
                          <p className="text-xs text-neutral-500 mt-1">
                            NOTE: no backend concept of saved bank accounts exists yet
                            (TransactionController.Withdraw just takes userId + amount) —
                            this selector isn't sent anywhere.
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="withdrawal-reason">Purpose/Reason (Optional)</Label>
                          <Textarea
                            id="withdrawal-reason"
                            placeholder="e.g., Project expenses, Salaries, Equipment purchase"
                            className="mt-2"
                            rows={3}
                          />
                          <p className="text-xs text-neutral-500 mt-1">Also not sent — no backend field for it.</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                              <p className="mb-1">Processing time: 1-3 business days</p>
                              <p>No withdrawal fees applied</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isWithdrawing}>
                            <ArrowDownToLine className="w-4 h-4 mr-2" />
                            {isWithdrawing ? "Processing..." : "Request Withdrawal"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowWithdrawModal(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </motion.div>
                )}

                {/* Transaction History */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3>Transaction History</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "withdrawal"
                                ? "bg-orange-100"
                                : "bg-green-100"
                            }`}
                          >
                            {transaction.type === "withdrawal" ? (
                              <ArrowDownToLine className="w-5 h-5 text-orange-600" />
                            ) : (
                              <Heart className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm mb-1">
                              {transaction.type === "withdrawal"
                                ? `Withdrawal to ${transaction.to}`
                                : transaction.type === "deposit"
                                ? "Wallet top-up"
                                : `Donation from ${transaction.from}`}
                            </p>
                            <p className="text-xs text-neutral-600">
                              {new Date(transaction.date).toLocaleDateString("en-ZA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg mb-1 ${
                              transaction.amount > 0 ? "text-green-600" : "text-neutral-900"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}R{" "}
                            {Math.abs(transaction.amount).toLocaleString()}
                          </p>
                          <Badge
                            className={`${
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <Button variant="outline">Load More Transactions</Button>
                  </div>
                </Card>

                {/* Financial Summary */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <Card className="p-6">
                    <h3 className="mb-4">Income Breakdown (2026)</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Individual Donations</span>
                        <span>R 32,500</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Corporate Partnerships</span>
                        <span>R 25,000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Grants</span>
                        <span>R 10,280</span>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span>Total Income</span>
                          <span>R 67,780</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Withdrawal History (2026)</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Total Withdrawn</span>
                        <span>R 25,000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Pending Withdrawals</span>
                        <span>R 0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Average Processing Time</span>
                        <span>2 days</span>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span>Available Balance</span>
                          <span className="text-green-600">R {walletBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Posts & Updates Tab */}
            {activeTab === "posts" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">Posts & Updates</h1>
                    <p className="text-neutral-600">Share your impact and updates with supporters</p>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </div>

                {/* Posts Grid - Only show posts from this NPO (npoId: 1) */}
                <div className="grid md:grid-cols-2 gap-6">
                  {posts.filter(p => p.npoId === 1).map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {post.image && (
                        <div className="relative h-48">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="flex-1">{post.title}</h3>
                          <div className="flex gap-2 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPost(post.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                          onClick={() => handleViewPost(post.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {posts.filter(p => p.npoId === 1).length === 0 && (
                  <Card className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No posts yet</h3>
                    <p className="text-neutral-600 mb-4">Share your impact and updates with your supporters</p>
                    <Button onClick={() => setShowCreatePost(true)}>Create Your First Post</Button>
                  </Card>
                )}
              </div>
            )}

          </motion.div>
        </main>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Create New Post</h3>
              <button onClick={() => setShowCreatePost(false)}>
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
                if (!user) return;
                const formData = new FormData(e.currentTarget);
                setActionError(null);
                try {
                  await postApi.create({
                    userId: user.userId,
                    postTitle: formData.get("title") as string,
                    content: formData.get("description") as string,
                    mediaUrl: (formData.get("image") as string) || undefined,
                  });
                  setShowCreatePost(false);
                  loadPosts();
                } catch (err) {
                  setActionError(err instanceof ApiError ? err.message : "Couldn't create post.");
                }
              }}
            >
              <div>
                <Label htmlFor="post-title">Post Title</Label>
                <Input
                  id="post-title"
                  name="title"
                  placeholder="e.g., Community Library Opening Success!"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="post-description">Description</Label>
                <Textarea
                  id="post-description"
                  name="description"
                  placeholder="Share your impact, achievements, or updates with supporters..."
                  className="mt-2"
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="post-image">Image URL (Optional)</Label>
                <Input
                  id="post-image"
                  name="image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter a URL to an image (JPG, PNG, etc.)
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreatePost(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View/Edit Post Modal */}
      {showViewPost && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            {(() => {
              const post = posts.find(p => p.id === selectedPost);
              if (!post) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3>Post Details</h3>
                    <button onClick={() => { setShowViewPost(false); setSelectedPost(null); }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {editingPost === selectedPost ? (
                    <form
                      className="space-y-6"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        try {
                          await postApi.update(selectedPost, {
                            postTitle: formData.get("title") as string,
                            content: formData.get("description") as string,
                          });
                          setEditingPost(null);
                          setShowViewPost(false);
                          setSelectedPost(null);
                          loadPosts();
                        } catch (err) {
                          setActionError(err instanceof ApiError ? err.message : "Couldn't update post.");
                        }
                      }}
                    >
                      <div>
                        <Label htmlFor="edit-title">Post Title</Label>
                        <Input
                          id="edit-title"
                          name="title"
                          defaultValue={post.title}
                          className="mt-2"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          name="description"
                          defaultValue={post.description}
                          className="mt-2"
                          rows={8}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-image">Image URL</Label>
                        <Input
                          id="edit-image"
                          name="image"
                          type="url"
                          defaultValue={post.image}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingPost(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {post.image && (
                        <div className="mb-6">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="mb-6">
                        <h2 className="mb-3">{post.title}</h2>
                        <p className="text-neutral-600 whitespace-pre-wrap">{post.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-6 pb-6 border-b">
                        <div className="flex items-center gap-6">
                          <span className="flex items-center gap-2 text-neutral-600">
                            <Heart className="w-5 h-5" />
                            {post.likes} likes
                          </span>
                          <span className="flex items-center gap-2 text-neutral-600">
                            <MessageSquare className="w-5 h-5" />
                            {post.comments} comments
                          </span>
                        </div>
                        <span className="text-neutral-600">
                          Posted on {new Date(post.date).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditingPost(selectedPost)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Post
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            handleDeletePost(selectedPost);
                            setShowViewPost(false);
                            setSelectedPost(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </motion.div>
        </div>
      )}

      {/* Apply to Partnership Campaign Modal */}
      {showApplyCampaignModal && selectedCampaignToApply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Apply to Partner</h3>
              <button onClick={() => { setShowApplyCampaignModal(false); setSelectedCampaignToApply(null); }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {actionError}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmitCampaignApplication}>
              <div>
                <Label htmlFor="motivation">Why should this business partner with your NPO?</Label>
                <Textarea
                  id="motivation"
                  placeholder="Tell them about your organization's impact and fit for this campaign..."
                  className="mt-2"
                  rows={4}
                  value={campaignMotivation}
                  onChange={(e) => setCampaignMotivation(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={isApplyingToCampaign}>
                  {isApplyingToCampaign ? "Submitting..." : "Submit Application"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowApplyCampaignModal(false); setSelectedCampaignToApply(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Donate to NPO Modal */}
      {showDonateModal && selectedNPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Support Fellow NPO</h3>
              <button onClick={() => { setShowDonateModal(false); setSelectedNPO(null); }}>
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
                  see WalletController.Deposit. Without this, donations
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
                <Label htmlFor="donate-amount">Donation Amount (R)</Label>
                <Input
                  id="donate-amount"
                  type="number"
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

              <div>
                <Label htmlFor="donate-message">Message (Optional)</Label>
                <Textarea
                  id="donate-message"
                  placeholder="Send words of encouragement..."
                  className="mt-2"
                  rows={3}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Not sent — TransactionController's donate endpoint only accepts an amount, no message field.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={isDonating}>
                  {isDonating ? "Processing..." : "Donate Now"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowDonateModal(false); setSelectedNPO(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Campaign Details Modal */}
      {showViewCampaign && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            {(() => {
              const campaign = myCampaigns.find(c => c.requestId === selectedCampaign);
              if (!campaign) return null;

              const daysRemaining = campaign.endDate
                ? Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;
              const percent = campaign.targetAmount > 0 ? Math.round((campaign.raisedAmount / campaign.targetAmount) * 100) : 0;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3>{campaign.title}</h3>
                    <button onClick={() => { setShowViewCampaign(false); setSelectedCampaign(null); }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Badge className={daysRemaining !== null && daysRemaining < 0 ? "bg-neutral-100 text-neutral-700 mb-4" : "bg-green-100 text-green-700 mb-4"}>
                        {daysRemaining !== null && daysRemaining < 0 ? "Closed" : "Active"}
                      </Badge>
                    </div>

                    <div className="bg-neutral-50 p-6 rounded-lg">
                      <h4 className="mb-4">Funding Progress</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-neutral-600">Raised</span>
                            <span className="font-semibold">
                              R {campaign.raisedAmount.toLocaleString()} of R {campaign.targetAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-3">
                            <div
                              className="bg-orange-600 h-3 rounded-full transition-all"
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <div className="text-sm text-neutral-600">Progress</div>
                            <div className="text-lg font-semibold text-orange-600">{percent}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600">Days Left</div>
                            <div className="text-lg font-semibold">{daysRemaining !== null ? daysRemaining : "—"}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3">Purpose & Goals</h4>
                      <p className="text-neutral-600 whitespace-pre-wrap">{campaign.purpose}</p>
                    </div>

                    <div>
                      <h4 className="mb-3">Budget Breakdown</h4>
                      <p className="text-neutral-600 whitespace-pre-wrap">{campaign.budgetBreakdown || "—"}</p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setShowViewCampaign(false); setSelectedCampaign(null); }}
                      >
                        Close
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`)) {
                            try {
                              await fundingRequestApi.remove(campaign.requestId);
                              loadMyCampaigns();
                              setShowViewCampaign(false);
                              setSelectedCampaign(null);
                            } catch (err) {
                              setActionError(err instanceof ApiError ? err.message : "Couldn't delete campaign.");
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Campaign
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
}
