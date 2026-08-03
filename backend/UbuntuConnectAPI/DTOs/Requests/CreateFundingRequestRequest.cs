namespace UbuntuConnectAPI.DTOs.Requests;

public class CreateFundingRequestRequest
{
    public string Title { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public string? BudgetBreakdown { get; set; }
    public string? Images { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
