using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Post
{
    public int PostId { get; set; }

    public int UserId { get; set; }

    public string PostTitle { get; set; } = null!;

    public string? Content { get; set; }

    public string? MediaUrl { get; set; }

    public int LikeCount { get; set; }

    public string ActivityStatus { get; set; } = null!;

    public DateTime Timestamp { get; set; }

    public virtual User User { get; set; } = null!;
}
