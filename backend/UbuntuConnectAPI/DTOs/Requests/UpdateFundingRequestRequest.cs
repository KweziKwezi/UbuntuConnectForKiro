namespace UbuntuConnectAPI.DTOs.Requests;

public class UpdateFundingRequestRequest
{
    public string? Title { get; set; }
    public string? Purpose { get; set; }
    public decimal? TargetAmount { get; set; }
    public string? BudgetBreakdown { get; set; }
    public string? Images { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
