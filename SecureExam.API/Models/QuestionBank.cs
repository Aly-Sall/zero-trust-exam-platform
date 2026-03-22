using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SecureExam.API.Models
{
    public class QuestionBank
    {
        [Key]
        public int Id { get; set; }
        public string FolderName { get; set; } = string.Empty;
        public string Course { get; set; } = string.Empty;
        
        public List<Question> Questions { get; set; } = new();
    }

    public class Question
    {
        [Key]
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        
        public List<string> Options { get; set; } = new(); 
        public int CorrectAnswerIndex { get; set; }

        public int QuestionBankId { get; set; }
        public QuestionBank? QuestionBank { get; set; }
    }
}