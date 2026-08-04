using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

// NOTE: NPODashboard's "Impact Tracking" tab had a "Record New Impact" form
// that submitted nowhere, and hardcoded metric cards, documented as having
// no backend model. The ImpactTrack entity (ImpactMetric/Value/Period/
// Description, NPO-scoped) already exists in the schema/AppDbContext with
// no controller exposing it — this fills that gap.
[ApiController]
[Route("api/impacttracks")]
public class ImpactTrackController : ControllerBase
{
    private readonly AppDbContext _context;

    public ImpactTrackController(AppDbContext context)
    {
        _context = context;
    }

    // Public — Individuals/Businesses can see an NPO's reported impact
    // (same visibility pattern as projects/funding requests).
    [HttpGet("npo/{npoId}")]
    public async Task<IActionResult> GetByNpo(int npoId)
    {
        var list = await _context.ImpactTracks
            .Where(i => i.NpoId == npoId)
            .OrderByDescending(i => i.ImpactId)
            .Select(i => new
            {
                impactId = i.ImpactId,
                npoId = i.NpoId,
                impactMetric = i.ImpactMetric,
                value = i.Value,
                period = i.Period,
                description = i.Description
            })
            .ToListAsync();
        return Ok(list);
    }

    [Authorize(Roles = "NPO")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var list = await _context.ImpactTracks
            .Where(i => i.NpoId == npo.NpoId)
            .OrderByDescending(i => i.ImpactId)
            .Select(i => new
            {
                impactId = i.ImpactId,
                npoId = i.NpoId,
                impactMetric = i.ImpactMetric,
                value = i.Value,
                period = i.Period,
                description = i.Description
            })
            .ToListAsync();
        return Ok(list);
    }

    [Authorize(Roles = "NPO")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateImpactTrackRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        if (string.IsNullOrWhiteSpace(req.ImpactMetric)) return BadRequest("ImpactMetric is required.");
        if (string.IsNullOrWhiteSpace(req.Period)) return BadRequest("Period is required.");

        var impact = new ImpactTrack
        {
            NpoId = npo.NpoId,
            ImpactMetric = req.ImpactMetric,
            Value = req.Value,
            Period = req.Period,
            Description = req.Description
        };

        _context.ImpactTracks.Add(impact);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            impactId = impact.ImpactId,
            npoId = impact.NpoId,
            impactMetric = impact.ImpactMetric,
            value = impact.Value,
            period = impact.Period,
            description = impact.Description
        });
    }

    [Authorize(Roles = "NPO")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var impact = await _context.ImpactTracks
            .Include(i => i.Npo)
            .FirstOrDefaultAsync(i => i.ImpactId == id);
        if (impact == null) return NotFound();

        if (impact.Npo.UserId != userId) return Forbid();

        _context.ImpactTracks.Remove(impact);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
