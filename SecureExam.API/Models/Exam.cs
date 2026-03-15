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
    }
}