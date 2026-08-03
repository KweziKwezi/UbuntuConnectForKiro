using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class UpdateNPORequest
{
    public string? OrganizationName { get; set; }
    public string? NPOFocusArea { get; set; }
    public string? NPOMission { get; set; }
}
