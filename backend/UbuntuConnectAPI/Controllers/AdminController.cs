using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .OrderByDescending(u => u.UserId)
            .Select(u => new
            {
                userId = u.UserId,
                email = u.UserEmail,
                userType = u.UserType,
                isActive = u.IsActive,
                isVerified = u.IsVerified
            })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .Where(u => u.UserId == id)
            .Select(u => new
            {
                userId = u.UserId,
                email = u.UserEmail,
                contact = u.UserContact,
                location = u.Location,
                userType = u.UserType,
                isActive = u.IsActive,
                isVerified = u.IsVerified
            })
            .FirstOrDefaultAsync();
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPut("users/{id}/activate")]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("users/{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("verifications")]
    public async Task<IActionResult> GetVerifications([FromQuery] string? status)
    {
        var q = _context.Verifications.AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(v => v.Status == status);

        var list = await q
            .OrderByDescending(v => v.SubmittedDate)
            .Select(v => new
            {
                verificationId = v.VerificationId,
                npoId = v.NpoId,
                status = v.Status,
                submittedDate = v.SubmittedDate,
                reviewedByUserId = v.ReviewedByUserId,
                reviewedDate = v.ReviewedDate
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPut("verifications/{id}/approve")]
    public async Task<IActionResult> ApproveVerification(int id)
    {
        var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var adminId = int.Parse(adminIdClaim!);

        var v = await _context.Verifications.FindAsync(id);
        if (v == null) return NotFound();

        v.Status = "Approved";
        v.ReviewedByUserId = adminId;
        v.ReviewedDate = DateTime.UtcNow;

        // mark related NPO's user as verified
        var npo = await _context.Npos.FindAsync(v.NpoId);
        if (npo != null)
        {
            var user = await _context.Users.FindAsync(npo.UserId);
            if (user != null) user.IsVerified = true;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("verifications/{id}/reject")]
    public async Task<IActionResult> RejectVerification(int id)
    {
        var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var adminId = int.Parse(adminIdClaim!);

        var v = await _context.Verifications.FindAsync(id);
        if (v == null) return NotFound();

        v.Status = "Rejected";
        v.ReviewedByUserId = adminId;
        v.ReviewedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int? userId)
    {
        var q = _context.Transactions.AsQueryable();
        if (userId.HasValue)
            q = q.Where(t => t.SenderUserId == userId.Value || t.ReceiverUserId == userId.Value);

        var txs = await q.OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                senderUserId = t.SenderUserId,
                receiverUserId = t.ReceiverUserId,
                amount = t.Amount,
                transactionType = t.TransactionType,
                status = t.Status,
                timestamp = t.Timestamp
            })
            .ToListAsync();

        return Ok(txs);
    }
}
