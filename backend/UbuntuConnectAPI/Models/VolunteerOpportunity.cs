using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class VolunteerOpportunity
{
    public int OpportunityId { get; set; }

    public int NpoId { get; set; }

    public int? FundingRequestId { get; set; }

    public string RoleTitle { get; set; } = null!;

    public string? Category { get; set; }

    public int NumOfPositions { get; set; }

    public string? Description { get; set; }

    public string? SkillsRequired { get; set; }

    public string? TimeCommitment { get; set; }

    public string? Duration { get; set; }

    public string? MediaUrl { get; set; }

    public virtual FundingRequest? FundingRequest { get; set; }

    public virtual Npo Npo { get; set; } = null!;

    public virtual ICollection<VolunteerApplication> VolunteerApplications { get; set; } = new List<VolunteerApplication>();
}
