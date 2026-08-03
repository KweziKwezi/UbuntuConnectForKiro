using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class PartnershipCampaign
{
    public int CampaignId { get; set; }

    public int BusinessId { get; set; }

    public string Title { get; set; } = null!;

    public string? Category { get; set; }

    public decimal? BudgetPerPartner { get; set; }

    public int? NumOfPartners { get; set; }

    public string? Requirements { get; set; }

    public string? Description { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public virtual Business Business { get; set; } = null!;

    public virtual ICollection<CampaignApplication> CampaignApplications { get; set; } = new List<CampaignApplication>();
}
