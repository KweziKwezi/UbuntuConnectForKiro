namespace UbuntuConnectAPI.DTOs.Requests
{
    public class DonateDto
    {
        public decimal Amount { get; set; }

        // Optional — when the donor is contributing to a specific NPO
        // fundraising campaign (FundingRequest) rather than a general
        // donation, this lets IndividualController.Donate atomically bump
        // FundingRequest.RaisedAmount alongside the wallet transfer.
        public int? FundingRequestId { get; set; }
    }
}
