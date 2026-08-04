using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class CreateVolunteerOpportunityRequest
{
    public int NpoId { get; set; }
    public int? FundingRequestId { get; set; }
    public string RoleTitle { get; set; } = null!;
    public string? Category { get; set; }
    public int NumOfPositions { get; set; }
    public string? Description { get; set; }
    public string? SkillsRequired { get; set; }
    public string? TimeCommitment { get; set; }
    public string? Duration { get; set; }
    public string? MediaURL { get; set; }
}
