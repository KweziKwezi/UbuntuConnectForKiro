using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

// NOTE: The frontend's "Projects & Initiatives" tab (NPODashboard) was
// entirely static/hardcoded mock cards, documented as having no backend to
// hit. The Project entity (ProjectName/ProjectDesc/ProjectStatus/
// ProjectProgress, NPO-scoped) already exists in the schema/AppDbContext —
// it just had no controller. This exposes it.
[ApiController]
[Route("api/projects")]
public class ProjectController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectController(AppDbContext context)
    {
        _context = context;
    }

    // Public — Individuals/Businesses can see an NPO's active projects
    // (same visibility pattern as funding requests/discover-NPOs).
    [HttpGet("npo/{npoId}")]
    public async Task<IActionResult> GetByNpo(int npoId)
    {
        var list = await _context.Projects
            .Where(p => p.NpoId == npoId)
            .OrderByDescending(p => p.ProjectId)
            .Select(p => new
            {
                projectId = p.ProjectId,
                npoId = p.NpoId,
                projectName = p.ProjectName,
                projectDesc = p.ProjectDesc,
                projectStatus = p.ProjectStatus,
                projectProgress = p.ProjectProgress
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _context.Projects
            .Where(pr => pr.ProjectId == id)
            .Select(pr => new
            {
                projectId = pr.ProjectId,
                npoId = pr.NpoId,
                projectName = pr.ProjectName,
                projectDesc = pr.ProjectDesc,
                projectStatus = pr.ProjectStatus,
                projectProgress = pr.ProjectProgress
            })
            .FirstOrDefaultAsync();

        if (p == null) return NotFound();
        return Ok(p);
    }

    // NPO's own projects — mirrors the "me"-scoped pattern used elsewhere
    // (npo/me, business/me) so the dashboard doesn't need to know its own NpoId.
    [Authorize(Roles = "NPO")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var list = await _context.Projects
            .Where(p => p.NpoId == npo.NpoId)
            .OrderByDescending(p => p.ProjectId)
            .Select(p => new
            {
                projectId = p.ProjectId,
                npoId = p.NpoId,
                projectName = p.ProjectName,
                projectDesc = p.ProjectDesc,
                projectStatus = p.ProjectStatus,
                projectProgress = p.ProjectProgress
            })
            .ToListAsync();
        return Ok(list);
    }

    [Authorize(Roles = "NPO")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        if (string.IsNullOrWhiteSpace(req.ProjectName)) return BadRequest("ProjectName is required.");

        var project = new Project
        {
            NpoId = npo.NpoId,
            ProjectName = req.ProjectName,
            ProjectDesc = req.ProjectDesc,
            ProjectStatus = req.ProjectStatus ?? "Planning",
            ProjectProgress = req.ProjectProgress ?? 0
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = project.ProjectId }, new
        {
            projectId = project.ProjectId,
            npoId = project.NpoId,
            projectName = project.ProjectName,
            projectDesc = project.ProjectDesc,
            projectStatus = project.ProjectStatus,
            projectProgress = project.ProjectProgress
        });
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var project = await _context.Projects
            .Include(p => p.Npo)
            .FirstOrDefaultAsync(p => p.ProjectId == id);
        if (project == null) return NotFound();

        if (project.Npo.UserId != userId) return Forbid();

        if (req.ProjectName != null) project.ProjectName = req.ProjectName;
        if (req.ProjectDesc != null) project.ProjectDesc = req.ProjectDesc;
        if (req.ProjectStatus != null) project.ProjectStatus = req.ProjectStatus;
        if (req.ProjectProgress.HasValue) project.ProjectProgress = req.ProjectProgress.Value;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "NPO")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var project = await _context.Projects
            .Include(p => p.Npo)
            .FirstOrDefaultAsync(p => p.ProjectId == id);
        if (project == null) return NotFound();

        if (project.Npo.UserId != userId) return Forbid();

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
