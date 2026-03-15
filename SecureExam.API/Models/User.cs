using System.ComponentModel.DataAnnotations;

namespace SecureExam.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string? PasswordHash { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "Student"; // "Student", "Professor", or "Admin"

        // NEW: The class/group the user belongs to
        // It is nullable (?) because Professors and Admins usually don't belong to a specific student cohort.
        public string? Cohort { get; set; } 

        // Propriétés de navigation (Relations)
        public BaselineSignature? BaselineSignature { get; set; }
        public ICollection<ExamSession> ExamSessions { get; set; } = new List<ExamSession>();
    }
}