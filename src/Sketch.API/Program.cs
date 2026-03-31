using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Sketch.Application.Interfaces;
using Sketch.Application.Services;
using Sketch.Infrastructure.Scaffolding;
using Sketch.Infrastructure.Zip;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ────────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Sketch API",
        Version = "v1",
        Description = "Stateless .NET 10 scaffolding generation API for Sketch MVP."
    });
});

// ── Application services ───────────────────────────────────────────────────────
builder.Services.AddSingleton<IBlueprintValidator, BlueprintValidatorService>();
builder.Services.AddSingleton<IResolutionEngine, ResolutionEngineService>();
builder.Services.AddSingleton<IScaffoldingEngine, ScaffoldingEngine>();
builder.Services.AddSingleton<IZipAssembler, ZipAssemblerService>();

// ── JWT Authentication (conditionally configured at runtime via appsettings) ──
var jwtSection = builder.Configuration.GetSection("Jwt");
if (jwtSection.Exists() && !string.IsNullOrWhiteSpace(jwtSection["Key"]))
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSection["Issuer"],
                ValidAudience = jwtSection["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    System.Text.Encoding.UTF8.GetBytes(jwtSection["Key"]!))
            };
        });
    builder.Services.AddAuthorization();
}

// ── Rate Limiting: 10 requests / IP / minute ──────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("fixed", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ── Request body size: 1 MB ───────────────────────────────────────────────────
builder.WebHost.ConfigureKestrel(k =>
    k.Limits.MaxRequestBodySize = 1 * 1024 * 1024);

// ── CORS (dev convenience) ────────────────────────────────────────────────────
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p => p
        .WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                     ?? ["http://localhost:5173"])
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

// ── Middleware pipeline ────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sketch API v1"));
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();

if (jwtSection.Exists() && !string.IsNullOrWhiteSpace(jwtSection["Key"]))
{
    app.UseAuthentication();
    app.UseAuthorization();
}

app.MapControllers();
app.MapGet("/health", () => Results.Ok());

app.Run();
