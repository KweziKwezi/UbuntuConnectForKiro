namespace UbuntuConnectAPI.DTOs.Requests;

public class UpdateProjectRequest
{
    public string? ProjectName { get; set; }
    public string? ProjectDesc { get; set; }
    public string? ProjectStatus { get; set; }
    public decimal? ProjectProgress { get; set; }
}
