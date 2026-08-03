using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;


namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/individual")]
public class IndividualController : ControllerBase
{
    private readonly AppDbContext _context;

    public IndividualController(AppDbContext context)
    {
        _context = context;
    }

    //DISCOVER NPOs
    [HttpGet("discover-NPOs")]
    public async Task<IActionResult> DiscoverNpos()
    {
        var npos = await _context.Npos
            .Include(n => n.User)   // pulls in Users data (Location, IsVerified)
            .Select(n => new
            {
                npoId = n.NpoId,
                organizationName = n.OrganizationName,
                focusArea = n.NpofocusArea,
                mission = n.Npomission,
                location = n.User.Location,
                isVerified = n.User.IsVerified
            })
            .ToListAsync();

        return Ok(npos);
    }

    //FOLLOW AN NPO
    [Authorize]
    [HttpPost("follow/{npoId}")]
    public async Task<IActionResult> FollowNpo(int npoId)
    {
        //Get the logged in user ID from the token generated
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        //Check the NPO actually exists
        var npoExists = await _context.Npos.AnyAsync(n => n.NpoId == npoId);
        if (!npoExists)
            return NotFound("NPO not found.");

        //Check they aren't already following this NPO
        var alreadyFollowing = await _context.Follows
            .AnyAsync(f => f.UserId == userId && f.NpoId == npoId);

        if (alreadyFollowing)
            return BadRequest("You already follow this NPO.");

        //Create the Follow row
        var follow = new Follow
        {
            UserId = userId,
            NpoId = npoId,
            FollowDate = DateTime.UtcNow
        };

        _context.Follows.Add(follow);
        await _context.SaveChangesAsync();

        return Ok(new { message = "You are now following this NPO." });
    }

    //UNFOLLOW AN NPO
    [Authorize]
    [HttpDelete("unfollow/{npoId}")]
    public async Task<IActionResult> UnfollowNpo(int npoId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.UserId == userId && f.NpoId == npoId);

        if (follow == null)
            return BadRequest("You are not following this NPO.");

        _context.Follows.Remove(follow);
        await _context.SaveChangesAsync();

        return Ok(new { message = "You have unfollowed this NPO." });
    }

    //VIEW SINGLE NPO PROFILE
    [HttpGet("npo/{npoId}")]
    public async Task<IActionResult> GetNpoProfile(int npoId)
    {
        var npo = await _context.Npos
            .Include(n => n.User)
            .Where(n => n.NpoId == npoId)
            .Select(n => new
            {
                npoId = n.NpoId,
                organizationName = n.OrganizationName,
                focusArea = n.NpofocusArea,
                mission = n.Npomission,
                location = n.User.Location,
                isVerified = n.User.IsVerified,
                followerCount = _context.Follows.Count(f => f.NpoId == n.NpoId)
            })
            .FirstOrDefaultAsync();

        if (npo == null)
            return NotFound("NPO not found.");

        return Ok(npo);
    }
    //APPLY TO VOLUNTEER OPPORTUNITY
    [Authorize]
    [HttpPost("volunteer/apply/{opportunityId}")]
    public async Task<IActionResult> ApplyToVolunteer(int opportunityId, [FromBody] VolunteerApplicationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var opportunityExists = await _context.VolunteerOpportunities
            .AnyAsync(v => v.OpportunityId == opportunityId);
        if (!opportunityExists)
            return NotFound("Volunteer opportunity not found.");

        var alreadyApplied = await _context.VolunteerApplications
            .AnyAsync(a => a.UserId == userId && a.OpportunityId == opportunityId);
        if (alreadyApplied)
            return BadRequest("You have already applied to this opportunity.");

        var application = new VolunteerApplication
        {
            UserId = userId,
            OpportunityId = opportunityId,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNum = dto.PhoneNum,
            Skills = dto.Skills,
            Availability = dto.Availability,
            WhyVolunteer = dto.WhyVolunteer,
            Address = dto.Address,
            Idnumber = dto.Idnumber,
            Status = "Pending",
            ApplicationDate = DateTime.UtcNow
        };

        _context.VolunteerApplications.Add(application);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Application submitted successfully.", applicationId = application.ApplicationId });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var profile = await _context.Individuals
            .Include(i => i.User)
            .Where(i => i.UserId == userId)
            .Select(i => new
            {
                userId = i.UserId,
                firstName = i.FirstName,
                lastName = i.LastName,
                causeOfCare = i.CauseOfCare,
                email = i.User.UserEmail,
                contact = i.User.UserContact,
                location = i.User.Location
            })
            .FirstOrDefaultAsync();

        if (profile == null)
            return NotFound("Profile not found.");

        return Ok(profile);
    }
    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var individual = await _context.Individuals.FirstOrDefaultAsync(i => i.UserId == userId);
        if (individual == null)
            return NotFound("Profile not found.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

        if (!string.IsNullOrEmpty(dto.FirstName)) individual.FirstName = dto.FirstName;
        if (!string.IsNullOrEmpty(dto.LastName)) individual.LastName = dto.LastName;
        if (dto.CauseOfCare != null) individual.CauseOfCare = dto.CauseOfCare;
        if (!string.IsNullOrEmpty(dto.UserContact)) user!.UserContact = dto.UserContact;
        if (!string.IsNullOrEmpty(dto.Location)) user!.Location = dto.Location;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated successfully." });
    }
    //MY DONATIONS
    [Authorize]
    [HttpGet("my-donations")]
    public async Task<IActionResult> GetMyDonations()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var donations = await _context.Transactions
            .Where(t => t.SenderUserId == userId && t.TransactionType == "Donation")
            .OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                amount = t.Amount,
                status = t.Status,
                timestamp = t.Timestamp,
                receiverUserId = t.ReceiverUserId
            })
            .ToListAsync();

        var totalDonated = donations
            .Where(d => d.status == "Completed")
            .Sum(d => d.amount);

        return Ok(new
        {
            totalDonated = totalDonated,
            count = donations.Count,
            donations = donations
        });
    }

    //MY VOLUNTEERING
    [Authorize]
    [HttpGet("my-volunteering")]
    public async Task<IActionResult> GetMyVolunteering()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var applications = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .Include(a => a.VolunteerLogs)
            .Where(a => a.UserId == userId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                roleTitle = a.Opportunity.RoleTitle,
                npoName = a.Opportunity.Npo.OrganizationName,
                status = a.Status,
                applicationDate = a.ApplicationDate,
                totalHoursLogged = a.VolunteerLogs.Sum(l => l.LogHours)
            })
            .OrderByDescending(a => a.applicationDate)
            .ToListAsync();

        return Ok(applications);
    }

    //MY IMPACT 
    [Authorize]
    [HttpGet("my-impact")]
    public async Task<IActionResult> GetMyImpact()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var totalDonated = await _context.Transactions
            .Where(t => t.SenderUserId == userId && t.TransactionType == "Donation" && t.Status == "Completed")
            .SumAsync(t => t.Amount);

        var totalHoursVolunteered = await _context.VolunteerLogs
            .Where(l => l.Application.UserId == userId)
            .SumAsync(l => l.LogHours);

        var npoCount = await _context.Follows
            .Where(f => f.UserId == userId)
            .CountAsync();

        var completedApplications = await _context.VolunteerApplications
    .Where(a => a.UserId == userId && a.Status == "Accepted")
    .CountAsync();

        return Ok(new
        {
            totalDonated = totalDonated,
            totalHoursVolunteered = totalHoursVolunteered,
            npoFollowing = npoCount,
            volunteerRolesCompleted = completedApplications
        });
    }

    //COMMUNITY UPDATES (posts from NPOs I follow) 
    // ── COMMUNITY UPDATES (all posts, newest first) ───────────
    [HttpGet("community-updates")]
    public async Task<IActionResult> GetCommunityUpdates()
    {
        var posts = await _context.Posts
            .Include(p => p.User)
                .ThenInclude(u => u.Npos)
            .OrderByDescending(p => p.Timestamp)
            .Select(p => new
            {
                postId = p.PostId,
                authorName = p.User.Npos.Any()
                    ? p.User.Npos.First().OrganizationName
                    : p.User.UserEmail,
                postTitle = p.PostTitle,
                content = p.Content,
                mediaUrl = p.MediaUrl,
                likeCount = p.LikeCount,
                timestamp = p.Timestamp
            })
            .ToListAsync();

        return Ok(posts);
    }
    // ── DONATE TO AN NPO ───────────────────────────────────────
    [Authorize]
    [HttpPost("donate/{npoId}")]
    public async Task<IActionResult> Donate(int npoId, [FromBody] DonateDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        if (dto.Amount <= 0)
            return BadRequest("Donation amount must be greater than zero.");

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.NpoId == npoId);
        if (npo == null)
            return NotFound("NPO not found.");

        var senderWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (senderWallet == null)
            return BadRequest("You do not have a wallet set up yet.");

        // Insufficient funds — log the FAILED attempt, still return an error
        if (senderWallet.Balance < dto.Amount)
        {
            _context.Transactions.Add(new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = npo.UserId,
                Amount = dto.Amount,
                TransactionType = "Donation",
                Status = "Failed",
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return BadRequest("Insufficient wallet balance.");
        }

        var receiverWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == npo.UserId);
        if (receiverWallet == null)
            return BadRequest("This NPO does not have a wallet set up yet.");

        // ── Atomic block — all or nothing ──────────────────────
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            senderWallet.Balance -= dto.Amount;
            receiverWallet.Balance += dto.Amount;

            var transaction = new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = npo.UserId,
                Amount = dto.Amount,
                TransactionType = "Donation",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            };
            _context.Transactions.Add(transaction);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(new
            {
                message = "Donation successful.",
                transactionId = transaction.TransactionId,
                newBalance = senderWallet.Balance
            });
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, "Donation failed due to a server error. No funds were moved.");
        }
    }

    [Authorize]
    [HttpGet("volunteer/application/{applicationId}")]
    public async Task<IActionResult> GetVolunteerApplication(int applicationId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var application = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .Include(a => a.VolunteerLogs)
            .Where(a => a.ApplicationId == applicationId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                roleTitle = a.Opportunity.RoleTitle,
                npoName = a.Opportunity.Npo.OrganizationName,
                description = a.Opportunity.Description,
                status = a.Status,
                applicationDate = a.ApplicationDate,
                skills = a.Skills,
                availability = a.Availability,
                whyVolunteer = a.WhyVolunteer,
                totalHoursLogged = a.VolunteerLogs.Sum(l => l.LogHours),
                logs = a.VolunteerLogs.Select(l => new
                {
                    logId = l.LogId,
                    hours = l.LogHours,
                    date = l.LogDate,
                    notes = l.Notes
                })
            })
            .FirstOrDefaultAsync();

        if (application == null)
            return NotFound("Application not found.");

        // security check — make sure this application belongs to the logged-in user
        var ownerId = await _context.VolunteerApplications
            .Where(a => a.ApplicationId == applicationId)
            .Select(a => a.UserId)
            .FirstOrDefaultAsync();

        if (ownerId != userId)
            return Forbid();

        return Ok(application);
    }
    [Authorize]
    [HttpDelete("volunteer/application/{applicationId}")]
    public async Task<IActionResult> CancelVolunteerApplication(int applicationId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var application = await _context.VolunteerApplications
            .FirstOrDefaultAsync(a => a.ApplicationId == applicationId);

        if (application == null)
            return NotFound("Application not found.");

        if (application.UserId != userId)
            return Forbid();

        if (application.Status == "Accepted")
            return BadRequest("You cannot cancel an application that has already been accepted. Contact the NPO directly.");

        application.Status = "Cancelled";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Application cancelled." });
    }
    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
            return NotFound("User not found.");

        bool currentPasswordValid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash);
        if (!currentPasswordValid)
            return BadRequest("Current password is incorrect.");

        if (dto.NewPassword.Length < 8)
            return BadRequest("New password must be at least 8 characters long.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }
    // ── DEACTIVATE MY ACCOUNT ──────────────────────────────────
    [Authorize]
    [HttpPut("deactivate")]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
            return NotFound("User not found.");

        bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!passwordValid)
            return BadRequest("Incorrect password. Account not deactivated.");

        user.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Your account has been deactivated." });
    }
}