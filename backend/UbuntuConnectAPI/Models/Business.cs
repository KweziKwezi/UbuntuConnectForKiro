using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Business
{
    public int BusinessId { get; set; }

    public int UserId { get; set; }

    public string BusinessRegNum { get; set; } = null!;

    public string? Industry { get; set; }

    public string? ContactPersonName { get; set; }

    public string? ContactPersonTitle { get; set; }

    public string? BusinessEmail { get; set; }

    public string? CsrGoal { get; set; }

    public virtual ICollection<PartnershipCampaign> PartnershipCampaigns { get; set; } = new List<PartnershipCampaign>();

    public virtual User User { get; set; } = null!;
}
