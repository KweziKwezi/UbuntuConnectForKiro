using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Project
{
    public int ProjectId { get; set; }

    public int NpoId { get; set; }

    public string ProjectName { get; set; } = null!;

    public string? ProjectDesc { get; set; }

    public string ProjectStatus { get; set; } = null!;

    public decimal ProjectProgress { get; set; }

    public virtual Npo Npo { get; set; } = null!;
}
