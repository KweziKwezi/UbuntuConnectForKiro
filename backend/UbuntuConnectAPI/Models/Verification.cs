using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Verification
{
    public int VerificationId { get; set; }

    public int NpoId { get; set; }

    public int? ReviewedByUserId { get; set; }

    public string? Npocertificate { get; set; }

    public string? NpotaxCertificate { get; set; }

    public string Status { get; set; } = null!;

    public DateTime SubmittedDate { get; set; }

    public DateTime? ReviewedDate { get; set; }

    public virtual Npo Npo { get; set; } = null!;

    public virtual User? ReviewedByUser { get; set; }
}
