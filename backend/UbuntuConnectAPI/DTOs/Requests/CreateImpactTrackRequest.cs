namespace UbuntuConnectAPI.DTOs.Requests;

public class CreateImpactTrackRequest
{
    public string ImpactMetric { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Period { get; set; } = string.Empty;
    public string? Description { get; set; }
}
