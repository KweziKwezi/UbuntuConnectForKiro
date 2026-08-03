using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class VolunteerApplication
{
    public int ApplicationId { get; set; }

    public int UserId { get; set; }

    public int OpportunityId { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? PhoneNum { get; set; }

    public string? Skills { get; set; }

    public string? Availability { get; set; }

    public string? WhyVolunteer { get; set; }

    public string? Address { get; set; }

    public string? Idnumber { get; set; }

    public string? IdcardImage { get; set; }

    public string? FaceImage { get; set; }

    public string Status { get; set; } = null!;

    public DateTime ApplicationDate { get; set; }

    public virtual VolunteerOpportunity Opportunity { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual ICollection<VolunteerLog> VolunteerLogs { get; set; } = new List<VolunteerLog>();
}
