using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class FundingRequest
{
    public int RequestId { get; set; }

    public int NpoId { get; set; }

    public string Title { get; set; } = null!;

    public string Purpose { get; set; } = null!;

    public decimal TargetAmount { get; set; }

    public decimal RaisedAmount { get; set; }

    public string? BudgetBreakdown { get; set; }

    public string? Images { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public virtual Npo Npo { get; set; } = null!;

    public virtual ICollection<VolunteerOpportunity> VolunteerOpportunities { get; set; } = new List<VolunteerOpportunity>();
}
