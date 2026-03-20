using MailKit.Net.Smtp;
using MimeKit;
using MailKit.Security;

namespace SecureExam.API.Services
{
    public interface IEmailService
    {
        // For Admins: Sending login credentials
        Task SendCredentialsEmailAsync(string toEmail, string plainTextPassword, string role, string cohort);
        
        // For Professors: Notifying students about new exams
        Task SendExamNotificationEmailAsync(string toEmail, string courseName, DateTime startTime, string professorEmail);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        public EmailService(IConfiguration config) => _config = config;

        // --- 1. SEND CREDENTIALS ---
        public async Task SendCredentialsEmailAsync(string toEmail, string plainTextPassword, string role, string cohort)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress("SecureExam System", _config["EmailSettings:SenderEmail"]));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = "🔐 Your SecureExam Access Credentials";

            string cohortHtml = string.IsNullOrEmpty(cohort) ? "" : $"<p><strong>Assigned Cohort:</strong> {cohort}</p>";

            var body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                    <h2 style='color: #2b6cb0;'>Welcome to SecureExam</h2>
                    <p>Your <strong>{role}</strong> account has been provisioned.</p>
                    <hr/>
                    <p><strong>Login:</strong> {toEmail}</p>
                    <p><strong>Password:</strong> <span style='background: #eee; padding: 4px; font-family: monospace;'>{plainTextPassword}</span></p>
                    {cohortHtml}
                    <hr/>
                    <p style='color: red; font-size: 12px;'>Please log in and change your password immediately.</p>
                </div>";

            await SendEmailAsync(email, body);
        }

        // --- 2. SEND EXAM NOTIFICATION ---
        public async Task SendExamNotificationEmailAsync(string toEmail, string courseName, DateTime startTime, string professorEmail)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress("SecureExam Notifications", _config["EmailSettings:SenderEmail"]));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = $"📅 New Exam Scheduled: {courseName}";

            var body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #2b6cb0; border-radius: 8px;'>
                    <h2 style='color: #2b6cb0;'>Exam Announcement</h2>
                    <p>A new exam has been scheduled for your cohort.</p>
                    <hr/>
                    <p><strong>Course:</strong> {courseName}</p>
                    <p><strong>Date & Time:</strong> {startTime:f}</p>
                    <p><strong>Proctor:</strong> {professorEmail}</p>
                    <hr/>
                    <p style='font-size: 12px; color: #666;'>Log in to the portal to ensure your baseline signature is active before the start time.</p>
                </div>";

            await SendEmailAsync(email, body);
        }

        // --- PRIVATE HELPER: THE MAIL ENGINE ---
        private async Task SendEmailAsync(MimeMessage email, string htmlContent)
        {
            try
            {
                var builder = new BodyBuilder { HtmlBody = htmlContent };
                email.Body = builder.ToMessageBody();

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(_config["EmailSettings:SmtpServer"], int.Parse(_config["EmailSettings:Port"]!), SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(_config["EmailSettings:Username"], _config["EmailSettings:Password"]);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                Console.WriteLine($"[EMAIL SUCCESS]: Sent to {email.To}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR]: Failed to send. Error: {ex.Message}");
            }
        }
    }
}