using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Profile
{
    public int ProfileId { get; set; }

    public int UserId { get; set; }

    public string ProfileName { get; set; } = null!;

    public string? Bio { get; set; }

    public string? ProfileImage { get; set; }

    public int Following { get; set; }

    public int Followers { get; set; }

    public virtual User User { get; set; } = null!;
}
