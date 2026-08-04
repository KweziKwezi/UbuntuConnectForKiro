using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Individual
{
    public int IndividualId { get; set; }

    public int UserId { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string? CauseOfCare { get; set; }

    public virtual User User { get; set; } = null!;
}
