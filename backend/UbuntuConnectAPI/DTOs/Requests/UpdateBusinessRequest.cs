using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class UpdateBusinessRequest
{
    public string? Industry { get; set; }
    public string? ContactPersonName { get; set; }
    public string? ContactPersonTitle { get; set; }
    public string? BusinessEmail { get; set; }
    public string? CsrGoal { get; set; }
}
