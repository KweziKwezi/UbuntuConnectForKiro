using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Follow
{
    public int FollowId { get; set; }

    public int UserId { get; set; }

    public int NpoId { get; set; }

    public DateTime FollowDate { get; set; }

    public virtual Npo Npo { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
