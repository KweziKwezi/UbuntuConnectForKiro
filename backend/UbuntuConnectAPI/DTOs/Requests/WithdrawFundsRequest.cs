using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class WithdrawFundsRequest
{
    public int UserId { get; set; }
    public decimal Amount { get; set; }
}
