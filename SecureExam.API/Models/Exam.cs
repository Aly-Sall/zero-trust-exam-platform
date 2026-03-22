using System;
using System.ComponentModel.DataAnnotations;

namespace SecureExam.API.Models
{
    public class Exam
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public DateTime Date { get; set; }
        
        [Required]
        public int Duration { get; set; }
        
        [Required]
        public string AccessCode { get; set; } = string.Empty;

        // The fields the controller is complaining about
        public string CourseName { get; set; } = string.Empty;
        public string Cohort { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public int DurationMinutes { get; set; }
        public int QuestionsToPull { get; set; }
        public string ProfessorEmail { get; set; } = string.Empty;

        public int QuestionBankId { get; set; }
        public QuestionBank? QuestionBank { get; set; }
    }
}