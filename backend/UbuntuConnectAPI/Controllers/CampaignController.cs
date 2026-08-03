using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/campaigns")]
public class CampaignController : ControllerBase
{
    private readonly AppDbContext _context;

    public CampaignController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.PartnershipCampaigns
            .OrderByDescending(c => c.CampaignId)
            .Select(c => new
            {
                campaignId = c.CampaignId,
                businessId = c.BusinessId,
                title = c.Title,
                description = c.Description,
                category = c.Category,
                budgetPerPartner = c.BudgetPerPartner
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var camp = await _context.PartnershipCampaigns
            .Where(c => c.CampaignId == id)
            .Select(c => new
            {
                campaignId = c.CampaignId,
                businessId = c.BusinessId,
                title = c.Title,
                description = c.Description,
                category = c.Category,
                requirements = c.Requirements,
                budgetPerPartner = c.BudgetPerPartner
            })
            .FirstOrDefaultAsync();

        if (camp == null) return NotFound();
        return Ok(camp);
    }

    [Authorize(Roles = "Business")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCampaignRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.UserId == userId);
        if (business == null) return BadRequest("No Business profile linked to this account.");

        var campaign = new PartnershipCampaign
        {
            BusinessId = business.BusinessId,
            Title = req.Title,
            Description = req.Description,
            Category = req.Category,
            Requirements = req.Requirements,
            BudgetPerPartner = req.BudgetPerPartner,
            NumOfPartners = req.NumOfPartners,
            StartDate = req.StartDate == default ? DateOnly.FromDateTime(DateTime.UtcNow) : req.StartDate,
            EndDate = req.EndDate
        };

        _context.PartnershipCampaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = campaign.CampaignId }, new
        {
            campaignId = campaign.CampaignId,
            businessId = campaign.BusinessId,
            title = campaign.Title
        });
    }

    [Authorize(Roles = "Business")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCampaignRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var campaign = await _context.PartnershipCampaigns
            .Include(c => c.Business)
            .FirstOrDefaultAsync(c => c.CampaignId == id);
        if (campaign == null) return NotFound();

        if (campaign.Business.UserId != userId) return Forbid();

        if (req.Title != null) campaign.Title = req.Title;
        if (req.Description != null) campaign.Description = req.Description;
        if (req.Category != null) campaign.Category = req.Category;
        if (req.Requirements != null) campaign.Requirements = req.Requirements;
        if (req.BudgetPerPartner.HasValue) campaign.BudgetPerPartner = req.BudgetPerPartner.Value;
        if (req.NumOfPartners.HasValue) campaign.NumOfPartners = req.NumOfPartners.Value;
        if (req.StartDate.HasValue) campaign.StartDate = req.StartDate.Value;
        if (req.EndDate.HasValue) campaign.EndDate = req.EndDate.Value;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Business")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var campaign = await _context.PartnershipCampaigns
            .Include(c => c.Business)
            .FirstOrDefaultAsync(c => c.CampaignId == id);
        if (campaign == null) return NotFound();

        if (campaign.Business.UserId != userId) return Forbid();

        _context.PartnershipCampaigns.Remove(campaign);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
