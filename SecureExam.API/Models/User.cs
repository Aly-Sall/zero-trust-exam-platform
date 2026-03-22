using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace SecureExam.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? PasswordHash { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "Student"; // "Student", "Professor", or "Admin"

        // For Students: Which specific class they belong to
        public string? Cohort { get; set; } 

        // 🟢 NEW: For Professors: A list of classes they are authorized to teach
        public List<string> Formations { get; set; } = new List<string>(); 

        // Navigation Properties (Relations)
        public BaselineSignature? BaselineSignature { get; set; }
        public ICollection<ExamSession> ExamSessions { get; set; } = new List<ExamSession>();
    }
}