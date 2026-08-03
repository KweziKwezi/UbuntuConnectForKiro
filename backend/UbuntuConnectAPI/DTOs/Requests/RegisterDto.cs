//Data Transfer Object for Register
//This is what the frontend sends in the request body
namespace UbuntuConnectAPI.DTOs.Requests;

public class RegisterDto
{
    // Shared fields for all user types
    public string UserEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty;
    public string? UserContact { get; set; }
    public string? Location { get; set; }

    // Individual only
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? CauseOfCare { get; set; }

    // NPO only
    public string? NpoRegNum { get; set; }
    public string? OrganizationName { get; set; }
    public string? NpoFocusArea { get; set; }
    public string? NpoMission { get; set; }

    // Business only
    public string? BusinessRegNum { get; set; }
    public string? Industry { get; set; }
    public string? ContactPersonName { get; set; }
    public string? ContactPersonTitle { get; set; }
    public string? BusinessEmail { get; set; }
    public string? CsrGoal { get; set; }
}
public class LoginDto
{
    public string UserEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}