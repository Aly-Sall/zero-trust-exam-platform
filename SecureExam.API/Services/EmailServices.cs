using MailKit.Net.Smtp;
using MimeKit;

namespace SecureExam.API.Services
{
    public interface IEmailService
    {
        Task SendCredentialsEmailAsync(string toEmail, string plainTextPassword, string role, string cohort);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        public EmailService(IConfiguration config) => _config = config;

        public async Task SendCredentialsEmailAsync(string toEmail, string plainTextPassword, string role, string cohort)
        {
            var email = new MimeMessage();
           email.From.Add(MailboxAddress.Parse(_config["EmailSettings:SenderEmail"]!));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = "🔐 Your SecureExam Access Credentials";

            string cohortHtml = string.IsNullOrEmpty(cohort) ? "" : $"<p><strong>Assigned Cohort:</strong> {cohort}</p>";

            var builder = new BodyBuilder
            {
                HtmlBody = $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                        <h2 style='color: #2b6cb0;'>Welcome to SecureExam (Zero-Trust Platform)</h2>
                        <p>Your <strong>{role}</strong> account has been successfully provisioned by the System Administrator.</p>
                        <hr/>
                        <p><strong>Login Email:</strong> {toEmail}</p>
                        <p><strong>Temporary Password:</strong> <span style='background: #eee; padding: 4px; font-family: monospace;'>{plainTextPassword}</span></p>
                        {cohortHtml}
                        <hr/>
                        <p style='color: red; font-size: 12px;'>For security reasons, please log in and change your password immediately.</p>
                    </div>"
            };
            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            try 
            {
                await smtp.ConnectAsync(_config["EmailSettings:SmtpServer"], int.Parse(_config["EmailSettings:Port"]!), MailKit.Security.SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(_config["EmailSettings:Username"], _config["EmailSettings:Password"]);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR]: Failed to send email to {toEmail}. Error: {ex.Message}");
            }
        }
    }
}