using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SecureExam.API.Data;
using SecureExam.API.Hubs;
using SecureExam.API.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Ajout des services au conteneur
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();
builder.Services.AddSignalR(); // NOUVEAU : On active SignalR

// Configuration de DbContext avec SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddScoped<KeystrokeAnalysisService>();

// --- NOUVEAU : Configuration CORS pour autoriser le front-end React ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") 
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // NOUVEAU : Indispensable pour SignalR !
        });
});

// Configuration de l'Authentification JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// Configuration de Swagger pour tester les JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "SecureExam MVP API", Version = "v1" });
    
    // Ajout du bouton "Authorize" dans Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Entrez 'Bearer' [espace] puis votre token JWT. Exemple : 'Bearer eyJhbGci...'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddScoped<SecureExam.API.Services.IEmailService, SecureExam.API.Services.EmailService>();
// 2. Construction de l'application
var app = builder.Build();

// 3. Configuration du pipeline HTTP (Middlewares)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// --- NOUVEAU : Activation du CORS (Doit impérativement être avant Auth) ---
app.UseCors("AllowReactApp");

app.UseAuthentication(); // Vérifie QUI est l'utilisateur
app.UseAuthorization();  // Vérifie les DROITS de l'utilisateur

app.MapControllers();
app.MapHub<MonitoringHub>("/monitoringHub"); // NOUVEAU : L'URL où le front va se connecter
app.Run();