using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/VolunteerApplication")]
public class VolunteerApplicationController : ControllerBase
{
    private readonly AppDbContext _context;

    public VolunteerApplicationController(AppDbContext context)
    {
        _context = context;
    }

    // NOTE: This "get all across the whole platform" endpoint is really an
    // admin/NPO-management view, not something an Individual should be able
    // to call. Locking it to NPO role — an NPO managing applicants across
    // opportunities. If you want a true cross-platform admin view later,
    // that belongs in an AdminController instead.
    
    [Authorize(Roles = "NPO")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        // Scoped to applications for THIS NPO's own opportunities only —
        // previously this returned every applicant on the platform (PII leak).
        var list = await _context.VolunteerApplications
            .Where(a => a.Opportunity.NpoId == npo.NpoId)
            .OrderByDescending(v => v.ApplicationDate)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                userId = a.UserId,
                opportunityId = a.OpportunityId,
                firstName = a.FirstName,
                lastName = a.LastName,
                email = a.Email,
                status = a.Status,
                applicationDate = a.ApplicationDate
            })
            .ToListAsync();
        return Ok(list);
    }

    [Authorize(Roles = "NPO")]
    [HttpGet("opportunity/{opportunityId}")]
    public async Task<IActionResult> GetByOpportunity(int opportunityId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var opportunity = await _context.VolunteerOpportunities
            .Include(o => o.Npo)
            .FirstOrDefaultAsync(o => o.OpportunityId == opportunityId);
        if (opportunity == null) return NotFound("Opportunity not found.");

        if (opportunity.Npo.UserId != userId) return Forbid();

        var list = await _context.VolunteerApplications
            .Where(v => v.OpportunityId == opportunityId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                userId = a.UserId,
                firstName = a.FirstName,
                lastName = a.LastName,
                email = a.Email,
                phoneNum = a.PhoneNum,
                skills = a.Skills,
                availability = a.Availability,
                whyVolunteer = a.WhyVolunteer,
                status = a.Status,
                applicationDate = a.ApplicationDate
            })
            .ToListAsync();
        return Ok(list);
    }

    // Individual viewing their own applications — this duplicates
    // IndividualController.GetMyVolunteering in spirit, so it's restricted
    // to the caller's own UserId rather than any arbitrary userId in the URL.
    [Authorize]
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var callerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var callerId = int.Parse(callerIdClaim!);

        if (callerId != userId) return Forbid();

        var list = await _context.VolunteerApplications
            .Where(v => v.UserId == userId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                opportunityId = a.OpportunityId,
                status = a.Status,
                applicationDate = a.ApplicationDate
            })
            .ToListAsync();
        return Ok(list);
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}/accept")]
    public async Task<IActionResult> Accept(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        app.Status = "Accepted";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        app.Status = "Rejected";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}/pending")]
    public async Task<IActionResult> Pending(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        app.Status = "Pending";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // NOTE: Delete endpoint removed. Your IndividualController already has
    // CancelVolunteerApplication, which soft-cancels (Status = "Cancelled")
    // rather than deleting the row. Keeping one path for this avoids two
    // different "remove an application" behaviors existing side by side.
}