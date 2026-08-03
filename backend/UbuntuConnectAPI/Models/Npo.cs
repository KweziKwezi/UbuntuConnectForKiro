using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Npo
{
    public int NpoId { get; set; }

    public int UserId { get; set; }

    public string NporegNum { get; set; } = null!;

    public string OrganizationName { get; set; } = null!;

    public string? NpofocusArea { get; set; }

    public string? Npomission { get; set; }

    public virtual ICollection<CampaignApplication> CampaignApplications { get; set; } = new List<CampaignApplication>();

    public virtual ICollection<Follow> Follows { get; set; } = new List<Follow>();

    public virtual ICollection<FundingRequest> FundingRequests { get; set; } = new List<FundingRequest>();

    public virtual ICollection<ImpactTrack> ImpactTracks { get; set; } = new List<ImpactTrack>();

    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();

    public virtual User User { get; set; } = null!;

    public virtual ICollection<Verification> Verifications { get; set; } = new List<Verification>();

    public virtual ICollection<VolunteerOpportunity> VolunteerOpportunities { get; set; } = new List<VolunteerOpportunity>();
}
