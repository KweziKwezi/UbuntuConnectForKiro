using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/business")]
public class BusinessController : ControllerBase
{
    private readonly AppDbContext _context;

    public BusinessController(AppDbContext context)
    {
        _context = context;
    }

    // Public — anyone can browse businesses (e.g. NPOs looking for partnership campaigns)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.Businesses
            .Select(b => new
            {
                businessId = b.BusinessId,
                userId = b.UserId,
                businessRegNum = b.BusinessRegNum,
                industry = b.Industry,
                contactPersonName = b.ContactPersonName,
                contactPersonTitle = b.ContactPersonTitle,
                businessEmail = b.BusinessEmail,
                csrGoal = b.CsrGoal
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var business = await _context.Businesses
            .Where(b => b.BusinessId == id)
            .Select(b => new
            {
                businessId = b.BusinessId,
                userId = b.UserId,
                businessRegNum = b.BusinessRegNum,
                industry = b.Industry,
                contactPersonName = b.ContactPersonName,
                contactPersonTitle = b.ContactPersonTitle,
                businessEmail = b.BusinessEmail,
                csrGoal = b.CsrGoal
            })
            .FirstOrDefaultAsync();

        if (business == null) return NotFound();
        return Ok(business);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var business = await _context.Businesses
            .Where(b => b.UserId == userId)
            .Select(b => new
            {
                businessId = b.BusinessId,
                userId = b.UserId,
                businessRegNum = b.BusinessRegNum,
                industry = b.Industry,
                contactPersonName = b.ContactPersonName,
                contactPersonTitle = b.ContactPersonTitle,
                businessEmail = b.BusinessEmail,
                csrGoal = b.CsrGoal
            })
            .FirstOrDefaultAsync();

        if (business == null) return NotFound();
        return Ok(business);
    }

    [Authorize(Roles = "Business")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var business = await _context.Businesses
            .Where(b => b.UserId == userId)
            .Select(b => new
            {
                businessId = b.BusinessId,
                userId = b.UserId,
                businessRegNum = b.BusinessRegNum,
                industry = b.Industry,
                contactPersonName = b.ContactPersonName,
                contactPersonTitle = b.ContactPersonTitle,
                businessEmail = b.BusinessEmail,
                csrGoal = b.CsrGoal
            })
            .FirstOrDefaultAsync();

        if (business == null) return NotFound("Business profile not found.");
        return Ok(business);
    }

    [Authorize(Roles = "Business")]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateBusinessRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.UserId == userId);
        if (business == null) return NotFound("Business profile not found.");

        if (req.Industry != null) business.Industry = req.Industry;
        if (req.ContactPersonName != null) business.ContactPersonName = req.ContactPersonName;
        if (req.ContactPersonTitle != null) business.ContactPersonTitle = req.ContactPersonTitle;
        if (req.BusinessEmail != null) business.BusinessEmail = req.BusinessEmail;
        if (req.CsrGoal != null) business.CsrGoal = req.CsrGoal;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Business profile updated successfully." });
    }

    // NOTE: No delete endpoint, same reasoning as NPOController — deleting a
    // Business would cascade into PartnershipCampaigns and their applications.
    // Use the deactivate-account pattern (AuthController-adjacent) instead.
}
