namespace UbuntuConnectAPI.DTOs.Requests;

public class SubmitVerificationRequest
{
    // These are stored as plain string URLs/references (no file upload
    // pipeline exists in this API), matching how Post.MediaUrl and
    // VolunteerApplication.FaceImage/IdcardImage are handled elsewhere —
    // the frontend supplies a URL/reference string rather than raw bytes.
    public string? NpoCertificate { get; set; }
    public string? NpoTaxCertificate { get; set; }
}
