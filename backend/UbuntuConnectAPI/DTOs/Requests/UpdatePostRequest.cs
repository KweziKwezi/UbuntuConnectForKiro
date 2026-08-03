using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class UpdatePostRequest
{
    public string PostTitle { get; set; } = null!;
    public string? Content { get; set; }
    public string? ActivityStatus { get; set; }
}
