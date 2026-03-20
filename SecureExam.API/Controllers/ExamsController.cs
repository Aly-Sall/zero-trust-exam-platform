using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using SecureExam.API.Data; 

namespace SecureExam.API.Controllers
{
    public class QuestionBankPayload
    {
        public int Id { get; set; } // NEW: We added an ID so we can edit it!
        public string FolderName { get; set; }
        public string Course { get; set; }
        public List<QuestionPayload> Questions { get; set; }
    }

    public class QuestionPayload
    {
        public string Text { get; set; }
        public List<string> Options { get; set; }
        public int CorrectAnswerIndex { get; set; }
    }

    public class ScheduleExamPayload
    {
        public string Title { get; set; }
        public string Formation { get; set; }
        public DateTime ScheduledFor { get; set; }
        public int DurationMinutes { get; set; }
        public int SourceBankId { get; set; }
        public int QuestionsToPull { get; set; }
    }

    public class StudentQuestionDto
    {
        public int QuestionId { get; set; }
        public string Text { get; set; }
        public List<string> Options { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ExamsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static List<QuestionBankPayload> _questionBanks = new List<QuestionBankPayload>();
        private static List<ScheduleExamPayload> _scheduledExams = new List<ScheduleExamPayload>();

        public ExamsController(AppDbContext context) { _context = context; }

        // --- 1. CREATE BANK ---
        [HttpPost("banks")]
        public IActionResult SaveQuestionBank([FromBody] QuestionBankPayload payload)
        {
            if (payload == null || !payload.Questions.Any()) return BadRequest(new { message = "Bank must contain questions." });
            
            payload.Id = _questionBanks.Count > 0 ? _questionBanks.Max(b => b.Id) + 1 : 1;
            _questionBanks.Add(payload);
            
            return Ok(new { message = "Question Bank saved!", id = payload.Id });
        }

        // --- 2. GET ALL BANKS (For the React Table) ---
        [HttpGet("banks")]
        public IActionResult GetAllBanks()
        {
            var summaries = _questionBanks.Select(b => new {
                id = b.Id,
                course = b.Course,
                folderName = b.FolderName,
                totalQuestions = b.Questions.Count,
                lastUpdated = DateTime.Now.ToString("yyyy-MM-dd")
            });
            return Ok(summaries);
        }

        // --- 3. GET ONE BANK (For the Edit Button) ---
        [HttpGet("banks/{id}")]
        public IActionResult GetBank(int id)
        {
            var bank = _questionBanks.FirstOrDefault(b => b.Id == id);
            if (bank == null) return NotFound();
            return Ok(bank);
        }

        // --- 4. UPDATE BANK ---
        [HttpPut("banks/{id}")]
        public IActionResult UpdateBank(int id, [FromBody] QuestionBankPayload payload)
        {
            var index = _questionBanks.FindIndex(b => b.Id == id);
            if (index == -1) return NotFound();

            payload.Id = id; 
            _questionBanks[index] = payload;
            return Ok(new { message = "Bank updated successfully!" });
        }

        // --- 5. DELETE BANK ---
        [HttpDelete("banks/{id}")]
        public IActionResult DeleteBank(int id)
        {
            var bank = _questionBanks.FirstOrDefault(b => b.Id == id);
            if (bank != null) _questionBanks.Remove(bank);
            return Ok(new { message = "Bank deleted!" });
        }

        // --- 6. SCHEDULE EXAM ---
        [HttpPost("schedule")]
        public IActionResult ScheduleExam([FromBody] ScheduleExamPayload payload)
        {
            if (payload == null) return BadRequest(new { message = "Invalid schedule data." });
            _scheduledExams.Add(payload);
            return Ok(new { message = "Exam scheduled successfully!" });
        }

        // --- 7. THE SHUFFLER ENGINE ---
        [HttpGet("generate/{examId}/student/{studentId}")]
        public IActionResult GenerateStudentExam(int examId, string studentId)
        {
            if (examId < 0 || examId >= _scheduledExams.Count) return NotFound(new { message = "Exam not found." });
            var scheduledExam = _scheduledExams[examId];

            var bank = _questionBanks.FirstOrDefault(b => b.Id == scheduledExam.SourceBankId);
            if (bank == null) return NotFound(new { message = "Source Question Bank not found." });

            var randomizedQuestions = bank.Questions.OrderBy(q => Guid.NewGuid()).Take(scheduledExam.QuestionsToPull).ToList();
            var safeExamVersion = new List<StudentQuestionDto>();
            
            for (int i = 0; i < randomizedQuestions.Count; i++)
            {
                safeExamVersion.Add(new StudentQuestionDto {
                    QuestionId = i + 1, Text = randomizedQuestions[i].Text, Options = randomizedQuestions[i].Options
                });
            }

            return Ok(new {
                ExamTitle = scheduledExam.Title, StudentId = studentId, Duration = scheduledExam.DurationMinutes, Questions = safeExamVersion
            });
        }
    }
}