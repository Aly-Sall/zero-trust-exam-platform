using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SecureExam.API.Data;
using SecureExam.API.DTOs;
using SecureExam.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SecureExam.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                return Unauthorized(new { message = "Identifiants incorrects." });

            // TEMPORARY FALLBACK: Checks plain text for our CSV imports, but uses BCrypt if it's a real hash
            bool isPasswordValid = false;
            if (user.PasswordHash.StartsWith("$2")) // BCrypt hashes start with $2a$, $2b$, or $2y$
            {
                isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            }
            else
            {
                isPasswordValid = (user.PasswordHash == request.Password); // Plain text check for CSV users
            }

            if (!isPasswordValid)
                return Unauthorized(new { message = "Identifiants incorrects." });

            string token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                role = user.Role,
                email = user.Email,
                cohort = user.Cohort,
                formations = user.Formations // 🟢 CRITICAL: Added this so the Professor gets their dropdown classes
            });
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // NEW: Use a List so we can optionally add the Cohort
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            // Inject the cohort into the token if they belong to a class!
            if (!string.IsNullOrEmpty(user.Cohort))
            {
                claims.Add(new Claim("Cohort", user.Cohort));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2), // Jeton à courte durée de vie
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}