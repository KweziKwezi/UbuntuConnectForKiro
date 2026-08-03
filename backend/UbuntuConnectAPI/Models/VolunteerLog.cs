using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class VolunteerLog
{
    public int LogId { get; set; }

    public int ApplicationId { get; set; }

    public decimal LogHours { get; set; }

    public DateOnly LogDate { get; set; }

    public string? Notes { get; set; }

    public virtual VolunteerApplication Application { get; set; } = null!;
}
