using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/wallet")]
public class WalletController : ControllerBase
{
    private readonly AppDbContext _context;

    public WalletController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet("user/{userId}/balance")]
    public async Task<IActionResult> GetBalanceByUser(int userId)
    {
        var callerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var callerId = int.Parse(callerIdClaim!);

        // Only view your own balance
        if (callerId != userId) return Forbid();

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return NotFound();
        return Ok(new { wallet.WalletId, wallet.UserId, wallet.Balance });
    }

    // NOTE: In production this would go through a real payment gateway
    // (card/EFT) before crediting the wallet. This endpoint just does the
    // ledger side so donations/withdrawals have funds to move — without it
    // every wallet is permanently stuck at 0 and nothing downstream is testable.
    [Authorize]
    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositFundsRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        if (req.Amount <= 0) return BadRequest("Amount must be greater than 0");

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return NotFound("Wallet not found");

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            wallet.Balance += req.Amount;

            var tx = new Transaction
            {
                SenderUserId = null,
                ReceiverUserId = userId,
                Amount = req.Amount,
                TransactionType = "Deposit",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            };

            _context.Transactions.Add(tx);
            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(new
            {
                message = "Deposit successful.",
                transactionId = tx.TransactionId,
                newBalance = wallet.Balance
            });
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, "Deposit failed due to a server error. No funds were moved.");
        }
    }
}