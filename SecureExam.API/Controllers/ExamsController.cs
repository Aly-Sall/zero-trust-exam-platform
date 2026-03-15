using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;   // <--- This "invites" your AppDbContext
using SecureExam.API.Models; // <--- This "invites" your Exam model

namespace SecureExam.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExamsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExamsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateExam([FromBody] Exam exam)
        {
            // Simple validation for security
            if (exam == null) return BadRequest("Exam data is null");

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Exam saved successfully!", exam });
        }
        [HttpGet]
        public async Task<IActionResult> GetAllExams()
        {
            var exams = await _context.Exams.ToListAsync();
            return Ok(exams);
        }
        // Bonus: A way to see all exams in the database
        [HttpGet]
        public async Task<IActionResult> GetExams()
        {
            var exams = await _context.Exams.ToListAsync();
            return Ok(exams);
        }
    }
}