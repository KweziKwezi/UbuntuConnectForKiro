using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class User
{
    public int UserId { get; set; }

    public string UserEmail { get; set; } = null!;

    public string? UserContact { get; set; }

    public string? Location { get; set; }

    public string PasswordHash { get; set; } = null!;

    public string UserType { get; set; } = null!;

    public bool IsVerified { get; set; }

    public DateTime RegistrationDate { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Business> Businesses { get; set; } = new List<Business>();

    public virtual ICollection<Follow> Follows { get; set; } = new List<Follow>();

    public virtual ICollection<Individual> Individuals { get; set; } = new List<Individual>();

    public virtual ICollection<Npo> Npos { get; set; } = new List<Npo>();

    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();

    public virtual Profile? Profile { get; set; }

    public virtual ICollection<Transaction> TransactionReceiverUsers { get; set; } = new List<Transaction>();

    public virtual ICollection<Transaction> TransactionSenderUsers { get; set; } = new List<Transaction>();

    public virtual ICollection<Verification> Verifications { get; set; } = new List<Verification>();

    public virtual ICollection<VolunteerApplication> VolunteerApplications { get; set; } = new List<VolunteerApplication>();

    public virtual Wallet? Wallet { get; set; }
}
