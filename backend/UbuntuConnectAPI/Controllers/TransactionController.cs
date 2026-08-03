using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/transaction")]
public class TransactionController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var callerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var callerId = int.Parse(callerIdClaim!);

        if (callerId != userId) return Forbid();

        var txs = await _context.Transactions
            .Where(t => t.SenderUserId == userId || t.ReceiverUserId == userId)
            .OrderByDescending(t => t.Timestamp)
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

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var callerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var callerId = int.Parse(callerIdClaim!);

        var tx = await _context.Transactions.FindAsync(id);
        if (tx == null) return NotFound();

        if (tx.SenderUserId != callerId && tx.ReceiverUserId != callerId) return Forbid();

        return Ok(new
        {
            transactionId = tx.TransactionId,
            senderUserId = tx.SenderUserId,
            receiverUserId = tx.ReceiverUserId,
            amount = tx.Amount,
            transactionType = tx.TransactionType,
            status = tx.Status,
            timestamp = tx.Timestamp
        });
    }

    // Same atomic-transaction pattern as IndividualController.Donate,
    // and same real-world logging convention: failed attempts still get recorded.
    [Authorize]
    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawFundsRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        if (req.Amount <= 0) return BadRequest("Amount must be greater than 0");

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return NotFound("Wallet not found");

        if (wallet.Balance < req.Amount)
        {
            _context.Transactions.Add(new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = null,
                Amount = req.Amount,
                TransactionType = "Withdrawal",
                Status = "Failed",
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return BadRequest("Insufficient balance");
        }

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            wallet.Balance -= req.Amount;

            var tx = new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = null,
                Amount = req.Amount,
                TransactionType = "Withdrawal",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            };

            _context.Transactions.Add(tx);
            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return CreatedAtAction(nameof(GetById), new { id = tx.TransactionId }, new
            {
                transactionId = tx.TransactionId,
                senderUserId = tx.SenderUserId,
                receiverUserId = tx.ReceiverUserId,
                amount = tx.Amount,
                transactionType = tx.TransactionType,
                status = tx.Status,
                timestamp = tx.Timestamp
            });
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, "Withdrawal failed due to a server error. No funds were moved.");
        }
    }
}