using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class ImpactTrack
{
    public int ImpactId { get; set; }

    public int NpoId { get; set; }

    public string ImpactMetric { get; set; } = null!;

    public decimal Value { get; set; }

    public string Period { get; set; } = null!;

    public string? Description { get; set; }

    public virtual Npo Npo { get; set; } = null!;
}
