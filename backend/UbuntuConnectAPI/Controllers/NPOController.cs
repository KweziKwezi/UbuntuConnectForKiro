using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/npo")]
public class NPOController : ControllerBase
{
    private readonly AppDbContext _context;

    public NPOController(AppDbContext context)
    {
        _context = context;
    }

    // Public — anyone can browse NPOs (same as IndividualController.DiscoverNpos)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.Npos
            .Include(n => n.User)
            .Select(n => new
            {
                npoId = n.NpoId,
                userId = n.UserId,
                nporegNum = n.NporegNum,
                organizationName = n.OrganizationName,
                npofocusArea = n.NpofocusArea,
                npomission = n.Npomission,
                location = n.User.Location,
                followerCount = _context.Follows.Count(f => f.NpoId == n.NpoId)
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNpoById(int id)
    {
        var npo = await _context.Npos
            .Where(n => n.NpoId == id)
            .Select(n => new
            {
                npoId = n.NpoId,
                userId = n.UserId,
                nporegNum = n.NporegNum,
                organizationName = n.OrganizationName,
                npofocusArea = n.NpofocusArea,
                npomission = n.Npomission
            })
            .FirstOrDefaultAsync();

        if (npo == null) return NotFound();
        return Ok(npo);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var npo = await _context.Npos
            .Where(n => n.UserId == userId)
            .Select(n => new
            {
                npoId = n.NpoId,
                userId = n.UserId,
                nporegNum = n.NporegNum,
                organizationName = n.OrganizationName,
                npofocusArea = n.NpofocusArea,
                npomission = n.Npomission
            })
            .FirstOrDefaultAsync();

        if (npo == null) return NotFound();
        return Ok(npo);
    }

    [Authorize(Roles = "NPO")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos
            .Where(n => n.UserId == userId)
            .Select(n => new
            {
                npoId = n.NpoId,
                userId = n.UserId,
                nporegNum = n.NporegNum,
                organizationName = n.OrganizationName,
                npofocusArea = n.NpofocusArea,
                npomission = n.Npomission
            })
            .FirstOrDefaultAsync();

        if (npo == null) return NotFound("NPO profile not found.");
        return Ok(npo);
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateNPORequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return NotFound("NPO profile not found.");

        if (!string.IsNullOrEmpty(req.OrganizationName)) npo.OrganizationName = req.OrganizationName;
        if (req.NPOFocusArea != null) npo.NpofocusArea = req.NPOFocusArea;
        if (req.NPOMission != null) npo.Npomission = req.NPOMission;

        await _context.SaveChangesAsync();
        return Ok(new { message = "NPO profile updated successfully." });
    }

    // Supporters — followers of this NPO plus their total donations to it.
    // Fills the frontend's "Supporters & Donors" tab, which previously
    // showed four fully hardcoded names/amounts and was documented as
    // having no backend model. Follow + Transaction + Profile all already
    // existed; they just weren't joined together anywhere.
    [Authorize(Roles = "NPO")]
    [HttpGet("me/supporters")]
    public async Task<IActionResult> GetMySupporters()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return NotFound("NPO profile not found.");

        var followers = await _context.Follows
            .Include(f => f.User).ThenInclude(u => u.Profile)
            .Where(f => f.NpoId == npo.NpoId)
            .Select(f => new
            {
                userId = f.UserId,
                name = f.User.Profile != null ? f.User.Profile.ProfileName : f.User.UserEmail,
                userType = f.User.UserType,
                followDate = f.FollowDate
            })
            .ToListAsync();

        var donationTotals = await _context.Transactions
            .Where(t => t.ReceiverUserId == npo.UserId && t.TransactionType == "Donation" && t.Status == "Completed")
            .GroupBy(t => t.SenderUserId)
            .Select(g => new { senderUserId = g.Key, total = g.Sum(t => t.Amount) })
            .ToListAsync();

        var totalsBySender = donationTotals
            .Where(d => d.senderUserId.HasValue)
            .ToDictionary(d => d.senderUserId!.Value, d => d.total);

        var supporters = followers.Select(f => new
        {
            userId = f.userId,
            name = f.name,
            userType = f.userType,
            followDate = f.followDate,
            totalContributed = totalsBySender.TryGetValue(f.userId, out var total) ? total : 0m
        });

        return Ok(supporters);
    }

    // NOTE: Delete endpoint removed. Deleting an NPO would cascade-delete
    // volunteer opportunities, applications, follows, etc. Same reasoning as
    // your soft-delete approach for Users — this should go through the
    // deactivate-account pattern instead, not a hard delete. Add later if needed.
}