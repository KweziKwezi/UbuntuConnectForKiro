using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class CreatePostRequest
{
    public int UserId { get; set; }
    public string PostTitle { get; set; } = null!;
    public string? Content { get; set; }
    public string? MediaUrl { get; set; }
}
