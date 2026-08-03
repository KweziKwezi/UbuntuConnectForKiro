using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class CreateNPORequest
{
    public int UserId { get; set; }
    public string NPORegNum { get; set; } = null!;
    public string OrganizationName { get; set; } = null!;
    public string? NPOFocusArea { get; set; }
    public string? NPOMission { get; set; }
}
