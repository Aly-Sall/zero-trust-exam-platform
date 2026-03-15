using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.Models;
using SecureExam.API.Services; // Add this!
using System.IO;

namespace SecureExam.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService; // Add the email service

        // Inject the email service into the controller
        public UsersController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users.Select(u => new { u.Id, u.Email, u.Role, u.Cohort }).ToListAsync();
            return Ok(users);
        }

        // 1. MANUAL CREATION UPGRADE
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] User newUser)
        {
            if (await _context.Users.AnyAsync(u => u.Email == newUser.Email))
                return BadRequest(new { message = "User with this email already exists." });

            // Hold onto the plain text password to send in the email
            string plainTextPassword = newUser.PasswordHash;

            // HASH THE PASSWORD before saving to the database
            newUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(plainTextPassword);

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // SEND THE EMAIL
            await _emailService.SendCredentialsEmailAsync(newUser.Email, plainTextPassword, newUser.Role, newUser.Cohort ?? "");

            return Ok(new { message = "User provisioned successfully!" });
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User deleted successfully" });
        }

       [HttpPut("{id}")]
public async Task<IActionResult> UpdateUser(int id, [FromBody] User updatedUser)
{
    // 1. Find the REAL user in the database first
    var existingUser = await _context.Users.FindAsync(id);
    
    if (existingUser == null) return NotFound();

    // 2. Only update the fields the Admin is allowed to change
    existingUser.Email = updatedUser.Email;
    existingUser.Role = updatedUser.Role;
    existingUser.Cohort = updatedUser.Cohort;

    // 3. DO NOT overwrite the PasswordHash if the incoming one is empty
    // This prevents the "Required" error from breaking the update
    if (!string.IsNullOrEmpty(updatedUser.PasswordHash) && updatedUser.PasswordHash != "undefined")
    {
        existingUser.PasswordHash = updatedUser.PasswordHash;
    }

    try
    {
        await _context.SaveChangesAsync();
        return Ok(new { message = "Update successful" });
    }
    catch (DbUpdateException ex)
    {
        return BadRequest(new { message = "Database error: " + ex.Message });
    }
}
        // 2. BULK CSV UPGRADE
        [HttpPost("bulk")]
        public async Task<IActionResult> UploadBulkUsers([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });

            int usersAdded = 0;

            using (var stream = new StreamReader(file.OpenReadStream()))
            {
                await stream.ReadLineAsync(); // Skip header
                while (!stream.EndOfStream)
                {
                    var line = await stream.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var values = line.Split(',');
                    if (values.Length >= 4)
                    {
                        var email = values[0].Trim();
                        var plainTextPassword = values[1].Trim(); // The password from the CSV

                        if (!await _context.Users.AnyAsync(u => u.Email == email))
                        {
                            var newUser = new User
                            {
                                Email = email,
                                // HASH THE CSV PASSWORD instantly
                                PasswordHash = BCrypt.Net.BCrypt.HashPassword(plainTextPassword),
                                Role = values[2].Trim(),
                                Cohort = values[3].Trim()
                            };

                            _context.Users.Add(newUser);

                            // SEND THE EMAIL
                            await _emailService.SendCredentialsEmailAsync(email, plainTextPassword, newUser.Role, newUser.Cohort ?? "");

                            usersAdded++;
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { count = usersAdded, message = "Bulk import successful" });
        }
    }
}