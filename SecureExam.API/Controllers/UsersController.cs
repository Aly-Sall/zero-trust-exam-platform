using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.Models;
using SecureExam.API.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SecureExam.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public UsersController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // --- 1. GET USERS (Fixed to include Formations) ---
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            // 🟢 NEW: Added u.Formations to the Select statement!
            var users = await _context.Users.Select(u => new { 
                u.Id, 
                u.Email, 
                u.Role, 
                u.Cohort, 
                u.Formations 
            }).ToListAsync();
            
            return Ok(users);
        }

        // --- 2. BULLETPROOF MANUAL CREATION ---
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] User newUser)
        {
            if (await _context.Users.AnyAsync(u => u.Email == newUser.Email))
                return BadRequest(new { message = "User with this email already exists." });

            try
            {
                string plainTextPassword = string.IsNullOrWhiteSpace(newUser.PasswordHash) 
                    ? Guid.NewGuid().ToString().Substring(0, 8) 
                    : newUser.PasswordHash;

                newUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(plainTextPassword);

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                await _emailService.SendCredentialsEmailAsync(newUser.Email, plainTextPassword, newUser.Role ?? "Student", newUser.Cohort ?? "");

                return Ok(new { message = "User provisioned successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database Error: Could not save the user. " + ex.Message });
            }
        }

        // --- 3. DELETE USER ---
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User deleted successfully" });
        }

        // --- 4. UPDATE USER (Fixed to map Formations) ---
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] User updatedUser)
        {
            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null) return NotFound();

            existingUser.Email = updatedUser.Email;
            existingUser.Role = updatedUser.Role;
            existingUser.Cohort = updatedUser.Cohort;
            
            // 🟢 NEW: Tell the database to actually save the Formations array!
            existingUser.Formations = updatedUser.Formations;

            if (!string.IsNullOrEmpty(updatedUser.PasswordHash) && updatedUser.PasswordHash != "undefined")
            {
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updatedUser.PasswordHash);
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

        // --- 5. BULLETPROOF BULK UPLOAD ---
        [HttpPost("bulk")]
        public async Task<IActionResult> UploadBulkUsers(IFormFile file) 
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });

            var usersToEmail = new List<(string Email, string Password, string Role, string Cohort)>();
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
                        var plainTextPassword = values[1].Trim();

                        if (!await _context.Users.AnyAsync(u => u.Email == email))
                        {
                            var newUser = new User
                            {
                                Email = email,
                                PasswordHash = BCrypt.Net.BCrypt.HashPassword(plainTextPassword),
                                Role = values[2].Trim(),
                                Cohort = values[3].Trim()
                            };

                            _context.Users.Add(newUser);
                            usersToEmail.Add((email, plainTextPassword, newUser.Role, newUser.Cohort));
                            usersAdded++;
                        }
                    }
                }
            }

            try
            {
                await _context.SaveChangesAsync();

                foreach (var user in usersToEmail)
                {
                    await _emailService.SendCredentialsEmailAsync(user.Email, user.Password, user.Role, user.Cohort);
                }

                return Ok(new { count = usersAdded, message = "Bulk import successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database Error during bulk upload: " + ex.Message });
            }
        }
    }
}