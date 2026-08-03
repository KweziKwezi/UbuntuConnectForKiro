using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

// NOTE: The frontend previously documented NPO fundraising campaigns
// (goal/raised/deadline progress bars, shown in NPODashboard's "Campaigns"
// tab and IndividualDashboard's "Active Campaigns" section) as having "NO
// backend model" and left them as local-only mock state. That was wrong —
// the FundingRequest entity (Title/Purpose/TargetAmount/RaisedAmount/
// BudgetBreakdown/StartDate/EndDate, all NPO-scoped) already exists on the
// schema and in AppDbContext; it just never had a controller exposing it.
// This controller fills that gap so the existing model can actually be used
// instead of adding a second, redundant concept.
[ApiController]
[Route("api/fundingrequests")]
public class FundingRequestController : ControllerBase
{
    private readonly AppDbContext _context;

    public FundingRequestController(AppDbContext context)
    {
        _context = context;
    }

    // Public — Individuals/Businesses browse active fundraising campaigns
    // across all NPOs (same visibility pattern as discover-NPOs/campaigns).
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.FundingRequests
            .Include(f => f.Npo)
            .OrderByDescending(f => f.RequestId)
            .Select(f => new
            {
                requestId = f.RequestId,
                npoId = f.NpoId,
                npoName = f.Npo.OrganizationName,
                title = f.Title,
                purpose = f.Purpose,
                targetAmount = f.TargetAmount,
                raisedAmount = f.RaisedAmount,
                budgetBreakdown = f.BudgetBreakdown,
                images = f.Images,
                startDate = f.StartDate,
                endDate = f.EndDate
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var f = await _context.FundingRequests
            .Include(fr => fr.Npo)
            .Where(fr => fr.RequestId == id)
            .Select(fr => new
            {
                requestId = fr.RequestId,
                npoId = fr.NpoId,
                npoName = fr.Npo.OrganizationName,
                title = fr.Title,
                purpose = fr.Purpose,
                targetAmount = fr.TargetAmount,
                raisedAmount = fr.RaisedAmount,
                budgetBreakdown = fr.BudgetBreakdown,
                images = fr.Images,
                startDate = fr.StartDate,
                endDate = fr.EndDate
            })
            .FirstOrDefaultAsync();

        if (f == null) return NotFound();
        return Ok(f);
    }

    [HttpGet("npo/{npoId}")]
    public async Task<IActionResult> GetByNpo(int npoId)
    {
        var list = await _context.FundingRequests
            .Where(f => f.NpoId == npoId)
            .OrderByDescending(f => f.RequestId)
            .Select(f => new
            {
                requestId = f.RequestId,
                npoId = f.NpoId,
                title = f.Title,
                purpose = f.Purpose,
                targetAmount = f.TargetAmount,
                raisedAmount = f.RaisedAmount,
                budgetBreakdown = f.BudgetBreakdown,
                images = f.Images,
                startDate = f.StartDate,
                endDate = f.EndDate
            })
            .ToListAsync();
        return Ok(list);
    }

    [Authorize(Roles = "NPO")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFundingRequestRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest("Title is required.");
        if (req.TargetAmount <= 0) return BadRequest("Target amount must be greater than zero.");

        var fundingRequest = new FundingRequest
        {
            NpoId = npo.NpoId,
            Title = req.Title,
            Purpose = req.Purpose,
            TargetAmount = req.TargetAmount,
            RaisedAmount = 0,
            BudgetBreakdown = req.BudgetBreakdown,
            Images = req.Images,
            StartDate = req.StartDate == default ? DateOnly.FromDateTime(DateTime.UtcNow) : req.StartDate,
            EndDate = req.EndDate
        };

        _context.FundingRequests.Add(fundingRequest);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = fundingRequest.RequestId }, new
        {
            requestId = fundingRequest.RequestId,
            npoId = fundingRequest.NpoId,
            title = fundingRequest.Title,
            targetAmount = fundingRequest.TargetAmount,
            raisedAmount = fundingRequest.RaisedAmount
        });
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFundingRequestRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var fundingRequest = await _context.FundingRequests
            .Include(f => f.Npo)
            .FirstOrDefaultAsync(f => f.RequestId == id);
        if (fundingRequest == null) return NotFound();

        if (fundingRequest.Npo.UserId != userId) return Forbid();

        if (req.Title != null) fundingRequest.Title = req.Title;
        if (req.Purpose != null) fundingRequest.Purpose = req.Purpose;
        if (req.TargetAmount.HasValue) fundingRequest.TargetAmount = req.TargetAmount.Value;
        if (req.BudgetBreakdown != null) fundingRequest.BudgetBreakdown = req.BudgetBreakdown;
        if (req.Images != null) fundingRequest.Images = req.Images;
        if (req.StartDate.HasValue) fundingRequest.StartDate = req.StartDate.Value;
        if (req.EndDate.HasValue) fundingRequest.EndDate = req.EndDate.Value;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "NPO")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var fundingRequest = await _context.FundingRequests
            .Include(f => f.Npo)
            .FirstOrDefaultAsync(f => f.RequestId == id);
        if (fundingRequest == null) return NotFound();

        if (fundingRequest.Npo.UserId != userId) return Forbid();

        _context.FundingRequests.Remove(fundingRequest);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
