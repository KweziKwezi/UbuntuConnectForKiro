using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/feed")]
public class FeedController : ControllerBase
{
    private readonly AppDbContext _context;

    public FeedController(AppDbContext context)
    {
        _context = context;
    }

    // Posts from NPOs this user follows
    [Authorize]
    [HttpGet("community-updates")]
    public async Task<IActionResult> CommunityUpdates()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var followedNpoIds = await _context.Follows
            .Where(f => f.UserId == userId)
            .Select(f => f.NpoId)
            .ToListAsync();

        // Map NPO -> their user id (publisher)
        var npoUserIds = await _context.Npos
            .Where(n => followedNpoIds.Contains(n.NpoId))
            .Select(n => n.UserId)
            .ToListAsync();

        var posts = await _context.Posts
            .Where(p => npoUserIds.Contains(p.UserId) && p.ActivityStatus == "Active")
            .OrderByDescending(p => p.Timestamp)
            .Select(p => new
            {
                postId = p.PostId,
                userId = p.UserId,
                postTitle = p.PostTitle,
                content = p.Content,
                mediaUrl = p.MediaUrl,
                likeCount = p.LikeCount,
                timestamp = p.Timestamp
            })
            .ToListAsync();

        return Ok(posts);
    }
}
