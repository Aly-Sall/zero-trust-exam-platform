using Microsoft.EntityFrameworkCore;
using SecureExam.API.Models;

namespace SecureExam.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<ExamSession> ExamSessions { get; set; }
        public DbSet<BaselineSignature> BaselineSignatures { get; set; }
        
        // 🟢 Your friend's Anti-Cheat Feature:
        public DbSet<IntegrityAlert> IntegrityAlerts { get; set; }

        // --- NEW TABLES WE JUST ADDED ---
        public DbSet<QuestionBank> QuestionBanks { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Exam> Exams { get; set; }
    }
}