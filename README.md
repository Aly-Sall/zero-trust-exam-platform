🛡️ SecureExam: Zero-Trust Proctoring Platform
SecureExam is a cutting-edge online examination platform designed to solve the "Analog Breach" in remote testing. By leveraging Behavioral Biometrics (Keystroke Dynamics) and Real-time Browser Lockdown, the system ensures continuous candidate authentication and exam integrity without invasive surveillance.

🚀 Key Features
Behavioral Biometrics (Keystroke Dynamics): Uses a Data Science approach to analyze the unique rhythm of a student's typing (Dwell Time and Flight Time). This creates a "biometric signature" that ensures the person taking the exam is the one who enrolled.

Zero-Trust Architecture: Every action is verified. No session is trusted by default.

Intelligent Lockdown: Detects and prevents unauthorized actions such as:

Tab switching or losing focus.

Copy-pasting questions/answers.

Exiting full-screen mode.

Right-click context menu attempts.

Live Monitoring Dashboard: A real-time interface for professors using SignalR (WebSockets) to receive instant alerts when a security anomaly is detected.

Privacy-by-Design: Unlike traditional proctoring, this system focuses on behavioral metadata, respecting user privacy while maintaining high security.

🛠️ Technical Stack
Backend
Framework: .NET 8 (C#)

Real-time Communication: ASP.NET Core SignalR

Database: SQLite with Entity Framework Core

Security: JWT Authentication & Custom Security Filters

Frontend
Library: React 18

Styling: Tailwind CSS

Routing: React Router

Biometrics Engine: Custom React Hooks for high-precision timing capture
