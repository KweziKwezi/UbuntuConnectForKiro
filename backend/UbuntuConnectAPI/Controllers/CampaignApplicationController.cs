using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/campaignapplications")]
public class CampaignApplicationController : ControllerBase
{
    private readonly AppDbContext _context;

    public CampaignApplicationController(AppDbContext context)
    {
        _context = context;
    }

    // NPO applies to a campaign
    [Authorize(Roles = "NPO")]
    [HttpPost("apply/{campaignId}")]
    public async Task<IActionResult> Apply(int campaignId, [FromBody] CampaignApplicationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var campaign = await _context.PartnershipCampaigns.FindAsync(campaignId);
        if (campaign == null) return NotFound("Campaign not found.");

        var already = await _context.CampaignApplications
            .AnyAsync(a => a.CampaignId == campaignId && a.NpoId == npo.NpoId);
        if (already) return BadRequest("You have already applied to this campaign.");

        var app = new CampaignApplication
        {
            CampaignId = campaignId,
            NpoId = npo.NpoId,
            Motivation = dto.Motivation,
            ApplicationDate = DateTime.UtcNow,
            Status = "Pending"
        };

        _context.CampaignApplications.Add(app);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Application submitted.", applicationId = app.ApplicationId });
    }

    // Business views applications for their campaign
    [Authorize(Roles = "Business")]
    [HttpGet("campaign/{campaignId}")]
    public async Task<IActionResult> GetByCampaign(int campaignId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var campaign = await _context.PartnershipCampaigns
            .Include(c => c.Business)
            .FirstOrDefaultAsync(c => c.CampaignId == campaignId);
        if (campaign == null) return NotFound();

        if (campaign.Business.UserId != userId) return Forbid();

        var list = await _context.CampaignApplications
            .Where(a => a.CampaignId == campaignId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                npoId = a.NpoId,
                motivation = a.Motivation,
                status = a.Status,
                applicationDate = a.ApplicationDate
            })
            .ToListAsync();

        return Ok(list);
    }

    [Authorize(Roles = "Business")]
    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.CampaignApplications
            .Include(a => a.Campaign)
                .ThenInclude(c => c.Business)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Campaign.Business.UserId != userId) return Forbid();

        app.Status = "Approved";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Business")]
    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.CampaignApplications
            .Include(a => a.Campaign)
                .ThenInclude(c => c.Business)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Campaign.Business.UserId != userId) return Forbid();

        app.Status = "Rejected";
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
