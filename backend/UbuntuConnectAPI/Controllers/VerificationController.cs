using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

// NOTE: AdminController already has GetVerifications/Approve/Reject, and
// the Verification entity already has NPOCertificate/NPOTaxCertificate
// columns — but nothing anywhere ever created a Verification row, so the
// Admin verification queue was structurally always empty and the "Verify"
// action on an NPO had nothing to act on. This controller adds the missing
// half: letting an NPO submit itself for verification, which is exactly
// what those existing columns were for.
[ApiController]
[Route("api/verifications")]
public class VerificationController : ControllerBase
{
    private readonly AppDbContext _context;

    public VerificationController(AppDbContext context)
    {
        _context = context;
    }

    // NPO submits (or re-submits after a rejection) a verification request.
    [Authorize(Roles = "NPO")]
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitVerificationRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var alreadyPending = await _context.Verifications
            .AnyAsync(v => v.NpoId == npo.NpoId && v.Status == "Pending");
        if (alreadyPending)
            return BadRequest("You already have a pending verification request.");

        var verification = new Verification
        {
            NpoId = npo.NpoId,
            Npocertificate = req.NpoCertificate,
            NpotaxCertificate = req.NpoTaxCertificate,
            Status = "Pending",
            SubmittedDate = DateTime.UtcNow
        };

        _context.Verifications.Add(verification);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Verification request submitted.",
            verificationId = verification.VerificationId,
            status = verification.Status
        });
    }

    // NPO checks the status of its own verification request(s) — lets the
    // dashboard show "Pending review" / "Rejected, please resubmit" instead
    // of just a static submit button.
    [Authorize(Roles = "NPO")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var list = await _context.Verifications
            .Where(v => v.NpoId == npo.NpoId)
            .OrderByDescending(v => v.SubmittedDate)
            .Select(v => new
            {
                verificationId = v.VerificationId,
                status = v.Status,
                submittedDate = v.SubmittedDate,
                reviewedDate = v.ReviewedDate
            })
            .ToListAsync();

        return Ok(list);
    }
}
