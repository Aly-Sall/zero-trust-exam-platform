using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.Models;
using SecureExam.API.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SecureExam.API.Controllers
{
    // --- 1. DATA TRANSFER OBJECTS (DTOs) ---

    public class QuestionBankPayload
    {
        public int Id { get; set; }
        public string FolderName { get; set; } = string.Empty;
        public string Course { get; set; } = string.Empty;
        public List<QuestionPayload> Questions { get; set; } = new();
    }

    public class QuestionPayload
    {
        public string Text { get; set; } = string.Empty;
        public List<string> Options { get; set; } = new();
        public int CorrectAnswerIndex { get; set; }
    }

    public class ScheduleExamPayload
    {
        public string Title { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string Cohort { get; set; } = string.Empty; 
        public DateTime StartTime { get; set; }
        public int DurationMinutes { get; set; }
        public int SourceBankId { get; set; }
        public int QuestionsToPull { get; set; }
        public string ProfessorEmail { get; set; } = string.Empty;
    }

    public class StudentQuestionDto
    {
        public int QuestionId { get; set; }
        public int OrderNumber { get; set; }
        public string Text { get; set; } = string.Empty;
        public List<string> Options { get; set; } = new();
    }

    // --- 2. THE EXAMS CONTROLLER ---

    [ApiController]
    [Route("api/[controller]")]
    public class ExamsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public ExamsController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // --- A. QUESTION BANK MANAGEMENT ---

        [HttpPost("banks")]
        public async Task<IActionResult> SaveQuestionBank([FromBody] QuestionBankPayload payload)
        {
            if (payload == null || !payload.Questions.Any()) 
                return BadRequest(new { message = "Bank must contain questions." });

            var bank = new QuestionBank
            {
                FolderName = payload.FolderName,
                Course = payload.Course,
                Questions = payload.Questions.Select(q => new Question
                {
                    Text = q.Text,
                    Options = q.Options,
                    CorrectAnswerIndex = q.CorrectAnswerIndex
                }).ToList()
            };

            _context.QuestionBanks.Add(bank);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Question Bank saved to database!", id = bank.Id });
        }

        [HttpGet("banks")]
        public async Task<IActionResult> GetAllBanks()
        {
            var banks = await _context.QuestionBanks
                .Select(b => new {
                    id = b.Id,
                    course = b.Course,
                    folderName = b.FolderName,
                    totalQuestions = b.Questions.Count
                }).ToListAsync();

            return Ok(banks);
        }

        [HttpDelete("banks/{id}")]
        public async Task<IActionResult> DeleteBank(int id)
        {
            var bank = await _context.QuestionBanks.FindAsync(id);
            if (bank == null) return NotFound();

            _context.QuestionBanks.Remove(bank);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Bank deleted successfully." });
        }

        // --- B. EXAM CALENDAR DATA ---
        
        [HttpGet]
        public async Task<IActionResult> GetAllScheduledExams()
        {
            var exams = await _context.Exams
                .Select(e => new {
                    id = e.Id,
                    title = e.Title,
                    courseName = e.CourseName,
                    cohort = e.Cohort,
                    startTime = e.StartTime,
                    durationMinutes = e.DurationMinutes,
                    professorEmail = e.ProfessorEmail
                })
                .ToListAsync();

            return Ok(exams);
        }

        // --- C. EXAM SCHEDULING & NOTIFICATION ---

        [HttpPost("schedule")]
        public async Task<IActionResult> ScheduleExam([FromBody] ScheduleExamPayload payload)
        {
            if (payload == null) return BadRequest(new { message = "Invalid schedule data." });

            try
            {
                var newExam = new Exam
                {
                    Title = payload.Title,
                    CourseName = payload.CourseName,
                    Cohort = payload.Cohort,
                    StartTime = payload.StartTime,
                    DurationMinutes = payload.DurationMinutes,
                    QuestionBankId = payload.SourceBankId,
                    QuestionsToPull = payload.QuestionsToPull,
                    ProfessorEmail = payload.ProfessorEmail
                };

                _context.Exams.Add(newExam);
                await _context.SaveChangesAsync();

                var students = await _context.Users
                    .Where(u => u.Cohort == payload.Cohort && u.Role == "Student")
                    .ToListAsync();

                var emailTasks = students.Select(s => 
                    _emailService.SendExamNotificationEmailAsync(
                        s.Email, 
                        newExam.CourseName, 
                        newExam.StartTime, 
                        newExam.ProfessorEmail
                    )
                );

                await Task.WhenAll(emailTasks);

                return Ok(new { message = $"Exam scheduled and {students.Count} students notified!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Scheduling Error: " + ex.Message });
            }
        }

        // --- D. THE SHUFFLER ENGINE (Zero-Trust Logic) ---

        [HttpGet("generate/{examId}/student/{studentId}")]
        public async Task<IActionResult> GenerateStudentExam(int examId, int studentId)
        {
            var exam = await _context.Exams
                .Include(e => e.QuestionBank)
                .ThenInclude(b => b.Questions)
                .FirstOrDefaultAsync(e => e.Id == examId);

            if (exam == null || exam.QuestionBank == null) 
                return NotFound(new { message = "Exam session or Question Bank not found." });

            var randomizedQuestions = exam.QuestionBank.Questions
                .OrderBy(q => Guid.NewGuid()) 
                .Take(exam.QuestionsToPull)
                .ToList();

            var secureQuestions = randomizedQuestions.Select((q, index) => new StudentQuestionDto
            {
                QuestionId = q.Id,
                OrderNumber = index + 1,
                Text = q.Text,
                Options = q.Options
            }).ToList();

            return Ok(new {
                ExamTitle = exam.Title,
                Course = exam.CourseName,
                Duration = exam.DurationMinutes,
                Questions = secureQuestions,
                StartTime = exam.StartTime
            });
        }
    }
}