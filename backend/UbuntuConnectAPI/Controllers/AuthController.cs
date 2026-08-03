using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.DTOs.Requests;


namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    //REGISTER
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        //Check if email already exists
        var emailExists = await _context.Users
            .AnyAsync(u => u.UserEmail == dto.UserEmail);

        if (emailExists)
            return BadRequest("An account with this email already exists.");

        //Create the Users row (shared for all types)
        var user = new User
        {
            UserEmail = dto.UserEmail,
            UserContact = dto.UserContact,
            Location = dto.Location,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            UserType = dto.UserType,
            IsVerified = false,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        // After SaveChangesAsync, user.UserId is now assigned by SQL Server
        //Adding the wallet after each registration. 
        var wallet = new Wallet
        {
            UserId = user.UserId,
            Balance = 0
        };
        _context.Wallets.Add(wallet);

        //Create the subtype row based on UserType
        string profileName = dto.UserEmail; // sensible fallback, overridden per user type below
        switch (dto.UserType)
        {
            case "Individual":
                if (string.IsNullOrEmpty(dto.FirstName) || string.IsNullOrEmpty(dto.LastName))
                    return BadRequest("First name and last name are required for Individual registration.");

                var individual = new Individual
                {
                    UserId = user.UserId,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    CauseOfCare = dto.CauseOfCare
                };
                _context.Individuals.Add(individual);
                profileName = $"{dto.FirstName} {dto.LastName}";
                break;

            case "NPO":
                if (string.IsNullOrEmpty(dto.NpoRegNum) || string.IsNullOrEmpty(dto.OrganizationName))
                    return BadRequest("NPO registration number and organisation name are required.");

                var npo = new Npo
                {
                    UserId = user.UserId,
                    NporegNum = dto.NpoRegNum,
                    OrganizationName = dto.OrganizationName,
                    NpofocusArea = dto.NpoFocusArea,
                    Npomission = dto.NpoMission
                };
                _context.Npos.Add(npo);
                profileName = dto.OrganizationName;
                break;

            case "Business":
                if (string.IsNullOrEmpty(dto.BusinessRegNum))
                    return BadRequest("Business registration number is required.");

                var business = new Business
                {
                    UserId = user.UserId,
                    BusinessRegNum = dto.BusinessRegNum,
                    Industry = dto.Industry,
                    ContactPersonName = dto.ContactPersonName,
                    ContactPersonTitle = dto.ContactPersonTitle,
                    BusinessEmail = dto.BusinessEmail,
                    CsrGoal = dto.CsrGoal
                };
                _context.Businesses.Add(business);
                profileName = !string.IsNullOrEmpty(dto.ContactPersonName) ? dto.ContactPersonName : dto.UserEmail;
                break;

            case "Admin":
                // Admin has no subtype table (Individual/NPO/Business) - just a Users row with UserType="Admin".
                break;

            default:
                // If UserType is invalid, remove the user we just created
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                return BadRequest("Invalid UserType. Must be Individual, NPO, Business, or Admin.");
        }

        // Every user type gets exactly one Profile row (per schema design) - same pattern as the Wallet above.
        _context.Profiles.Add(new Profile
        {
            UserId = user.UserId,
            ProfileName = profileName,
            Following = 0,
            Followers = 0
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Registration successful.",
            userId = user.UserId,
            userType = user.UserType
        });
    }
    //LOGIN
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserEmail == dto.UserEmail);

        if (user == null)
            return Unauthorized("Invalid email or password.");
        if (!user.IsActive)
            return Unauthorized("This account has been deactivated.");

        bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);


        if (!passwordValid)
            return Unauthorized("Invalid email or password.");

        // Build the token
        var claims = new[]
        {
        new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
        new Claim(ClaimTypes.Email, user.UserEmail),
        new Claim(ClaimTypes.Role, user.UserType)
    };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:ExpiryMinutes"]!)),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            message = "Login successful.",
            token = tokenString,
            userId = user.UserId,
            userType = user.UserType,
            email = user.UserEmail,
            isVerified = user.IsVerified
        });
    }
    

}