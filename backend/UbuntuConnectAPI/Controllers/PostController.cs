using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/post")]
public class PostController : ControllerBase
{
    private readonly AppDbContext _context;

    public PostController(AppDbContext context)
    {
        _context = context;
    }

    // Public — same reasoning as community-updates
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.Posts
            .Where(p => p.ActivityStatus == "Active")
            .OrderByDescending(p => p.Timestamp)
            .Select(p => new
            {
                postId = p.PostId,
                userId = p.UserId,
                postTitle = p.PostTitle,
                content = p.Content,
                mediaUrl = p.MediaUrl,
                likeCount = p.LikeCount,
                activityStatus = p.ActivityStatus,
                timestamp = p.Timestamp
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var post = await _context.Posts
            .Where(p => p.PostId == id)
            .Select(p => new
            {
                postId = p.PostId,
                userId = p.UserId,
                postTitle = p.PostTitle,
                content = p.Content,
                mediaUrl = p.MediaUrl,
                likeCount = p.LikeCount,
                activityStatus = p.ActivityStatus,
                timestamp = p.Timestamp
            })
            .FirstOrDefaultAsync();

        if (post == null) return NotFound();
        return Ok(post);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var posts = await _context.Posts
            .Where(p => p.UserId == userId)
            .Select(p => new
            {
                postId = p.PostId,
                userId = p.UserId,
                postTitle = p.PostTitle,
                content = p.Content,
                mediaUrl = p.MediaUrl,
                likeCount = p.LikeCount,
                activityStatus = p.ActivityStatus,
                timestamp = p.Timestamp
            })
            .ToListAsync();
        return Ok(posts);
    }

    // NPO/Business only — enforced in code, same pattern discussed earlier
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePostRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        if (user.UserType != "NPO" && user.UserType != "Business")
            return Forbid();

        if (string.IsNullOrWhiteSpace(req.PostTitle)) return BadRequest("PostTitle is required");

        var post = new Post
        {
            UserId = userId,
            PostTitle = req.PostTitle,
            Content = req.Content,
            MediaUrl = req.MediaUrl,
            LikeCount = 0,
            ActivityStatus = "Active",
            Timestamp = DateTime.UtcNow
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = post.PostId }, new
        {
            postId = post.PostId,
            userId = post.UserId,
            postTitle = post.PostTitle,
            content = post.Content,
            mediaUrl = post.MediaUrl,
            likeCount = post.LikeCount,
            activityStatus = post.ActivityStatus,
            timestamp = post.Timestamp
        });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePostRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var post = await _context.Posts.FindAsync(id);
        if (post == null) return NotFound();

        // Ownership check — only the author can edit their own post
        if (post.UserId != userId) return Forbid();

        if (string.IsNullOrWhiteSpace(req.PostTitle)) return BadRequest("PostTitle is required");
        if (req.ActivityStatus != null && req.ActivityStatus != "Active" && req.ActivityStatus != "Deleted")
            return BadRequest("ActivityStatus must be 'Active' or 'Deleted'");

        post.PostTitle = req.PostTitle;
        post.Content = req.Content;
        if (req.ActivityStatus != null) post.ActivityStatus = req.ActivityStatus;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var post = await _context.Posts.FindAsync(id);
        if (post == null) return NotFound();

        if (post.UserId != userId) return Forbid();

        post.ActivityStatus = "Deleted"; // soft delete — same pattern as Users
        await _context.SaveChangesAsync();
        return NoContent();
    }
}