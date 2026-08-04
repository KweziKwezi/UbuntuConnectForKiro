namespace UbuntuConnectAPI.DTOs.Requests
{
    public class VolunteerApplicationDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNum { get; set; }
        public string? Skills { get; set; }
        public string? Availability { get; set; }
        public string? WhyVolunteer { get; set; }
        public string? Address { get; set; }
        public string? Idnumber { get; set; }
    }
}
