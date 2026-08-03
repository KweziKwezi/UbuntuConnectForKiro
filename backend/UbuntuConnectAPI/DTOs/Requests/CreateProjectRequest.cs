namespace UbuntuConnectAPI.DTOs.Requests;

public class CreateProjectRequest
{
    public string ProjectName { get; set; } = string.Empty;
    public string? ProjectDesc { get; set; }
    public string? ProjectStatus { get; set; }
    public decimal? ProjectProgress { get; set; }
}
