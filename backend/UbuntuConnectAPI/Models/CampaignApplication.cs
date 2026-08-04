using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class CampaignApplication
{
    public int ApplicationId { get; set; }

    public int CampaignId { get; set; }

    public int NpoId { get; set; }

    public DateTime ApplicationDate { get; set; }

    public string Status { get; set; } = null!;

    public string? Motivation { get; set; }

    public virtual PartnershipCampaign Campaign { get; set; } = null!;

    public virtual Npo Npo { get; set; } = null!;
}
