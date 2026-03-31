using Sketch.Domain.Enums;
using Sketch.Infrastructure.Scaffolding.TemplateModels;

namespace Sketch.Infrastructure.Scaffolding;

/// <summary>
/// Renders C# source files from in-memory template models.
/// Templates are expressed as C# string interpolation to keep the implementation
/// self-contained — no external .sbn files or embedded assembly resources required.
/// </summary>
public static class ScribanRenderer
{
    public static string RenderEntity(EntityTemplateModel model)
    {
        var fields = string.Join("\n    ", model.FieldLines.Select(l =>
        {
            var line = l.Replace("{ get; init; }", "{ get; set; }");
            // CS8618: non-nullable string/enum properties must be initialised
            if (line.Contains(" string ") && !line.Contains("?"))
                return line + " = string.Empty;";
            return line;
        }));
        return $$"""
namespace {{model.ProjectName}}.Domain.Entities;

public class {{model.EntityName}}
{
    {{fields}}
}
""";
    }

    public static string RenderDto(DtoTemplateModel model)
    {
        var fields = string.Join("\n    ", model.FieldLines);
        return $$"""
namespace {{model.ProjectName}}.Application.DTOs;

public record {{model.EntityName}}Dto(
    {{string.Join(",\n    ", model.FieldLines.Select(f => f.Replace("public ", string.Empty).Replace(" { get; set; }", string.Empty)))}});

public record Create{{model.EntityName}}Request(
    {{string.Join(",\n    ", model.FieldLines
        .Where(f => !f.Contains("Guid Id"))
        .Select(f => f.Replace("public ", string.Empty).Replace(" { get; set; }", string.Empty)))}});

public record Update{{model.EntityName}}Request(
    {{string.Join(",\n    ", model.FieldLines
        .Where(f => !f.Contains("Guid Id"))
        .Select(f => f.Replace("public ", string.Empty).Replace(" { get; set; }", string.Empty)))}});
""";
    }

    public static string RenderServiceInterface(ServiceInterfaceTemplateModel model)
    {
        return $$"""
using {{model.ProjectName}}.Application.DTOs;

namespace {{model.ProjectName}}.Application.Interfaces;

public interface I{{model.EntityName}}Service
{
    Task<IReadOnlyList<{{model.EntityName}}Dto>> GetAllAsync(CancellationToken ct = default);
    Task<{{model.EntityName}}Dto?> GetByIdAsync({{model.IdType}} id, CancellationToken ct = default);
    Task<{{model.EntityName}}Dto> CreateAsync(Create{{model.EntityName}}Request request, CancellationToken ct = default);
    Task<{{model.EntityName}}Dto?> UpdateAsync({{model.IdType}} id, Update{{model.EntityName}}Request request, CancellationToken ct = default);
    Task<bool> DeleteAsync({{model.IdType}} id, CancellationToken ct = default);
}
""";
    }

    public static string RenderService(ServiceTemplateModel model)
    {
        var dbContextUsing = model.StorageEngine == StorageEngine.Redis
            ? string.Empty
            : $"using {model.ProjectName}.Infrastructure.Data;";

        // Generate mapping expressions from the field list
        var allFieldNames = model.Fields.Select(f => f.Name).ToArray();
        var nonIdFields = model.Fields
            .Where(f => !string.Equals(f.Name, "Id", StringComparison.OrdinalIgnoreCase))
            .ToArray();

        // MapToDto: new EntityDto(e.Field1, e.Field2, ...)
        var mapToDtoArgs = string.Join(", ", allFieldNames.Select(n => $"e.{n}"));
        var mapToDtoBody = $"new {model.EntityName}Dto({mapToDtoArgs})";

        // MapFromRequest: new Entity { Id = Guid.NewGuid(), Field1 = r.Field1, ... }
        var idInit = model.IdType == "Guid" ? "Id = Guid.NewGuid()," : $"Id = default({model.IdType}),";
        var requestInits = nonIdFields.Select(f => $"        {f.Name} = r.{f.Name},");
        var mapFromRequestBody = $"new {model.EntityName}\n    {{\n        {idInit}\n{string.Join("\n", requestInits)}\n    }}";

        // ApplyUpdate: e.Field1 = r.Field1; ...
        var applyUpdateLines = nonIdFields.Length > 0
            ? string.Join("\n        ", nonIdFields.Select(f => $"e.{f.Name} = r.{f.Name};"))
            : "// no mutable fields";

        return $$"""
using Microsoft.EntityFrameworkCore;
using {{model.ProjectName}}.Application.DTOs;
using {{model.ProjectName}}.Application.Interfaces;
using {{model.ProjectName}}.Domain.Entities;
{{dbContextUsing}}

namespace {{model.ProjectName}}.Infrastructure.Services;

public sealed class {{model.EntityName}}Service : I{{model.EntityName}}Service
{
    private readonly AppDbContext _db;

    public {{model.EntityName}}Service(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<{{model.EntityName}}Dto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Set<{{model.EntityName}}>()
            .AsNoTracking()
            .Select(e => MapToDto(e))
            .ToListAsync(ct);
    }

    public async Task<{{model.EntityName}}Dto?> GetByIdAsync({{model.IdType}} id, CancellationToken ct = default)
    {
        var entity = await _db.Set<{{model.EntityName}}>().FindAsync([id], ct);
        return entity is null ? null : MapToDto(entity);
    }

    public async Task<{{model.EntityName}}Dto> CreateAsync(Create{{model.EntityName}}Request request, CancellationToken ct = default)
    {
        var entity = MapFromRequest(request);
        _db.Set<{{model.EntityName}}>().Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<{{model.EntityName}}Dto?> UpdateAsync({{model.IdType}} id, Update{{model.EntityName}}Request request, CancellationToken ct = default)
    {
        var entity = await _db.Set<{{model.EntityName}}>().FindAsync([id], ct);
        if (entity is null) return null;
        ApplyUpdate(entity, request);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync({{model.IdType}} id, CancellationToken ct = default)
    {
        var entity = await _db.Set<{{model.EntityName}}>().FindAsync([id], ct);
        if (entity is null) return false;
        _db.Set<{{model.EntityName}}>().Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static {{model.EntityName}}Dto MapToDto({{model.EntityName}} e) =>
        {{mapToDtoBody}};

    private static {{model.EntityName}} MapFromRequest(Create{{model.EntityName}}Request r) =>
        {{mapFromRequestBody}};

    private static void ApplyUpdate({{model.EntityName}} e, Update{{model.EntityName}}Request r)
    {
        {{applyUpdateLines}}
    }
}
""";
    }

    public static string RenderValidator(ValidatorTemplateModel model)
    {
        var rules = model.ValidationRules.Length > 0
            ? string.Join("\n        ", model.ValidationRules)
            : "// TODO: add validation rules";

        return $$"""
using FluentValidation;
using {{model.ProjectName}}.Application.DTOs;

namespace {{model.ProjectName}}.Application.Validators;

public sealed class Create{{model.EntityName}}Validator : AbstractValidator<Create{{model.EntityName}}Request>
{
    public Create{{model.EntityName}}Validator()
    {
        {{rules}}
    }
}

public sealed class Update{{model.EntityName}}Validator : AbstractValidator<Update{{model.EntityName}}Request>
{
    public Update{{model.EntityName}}Validator()
    {
        {{rules}}
    }
}
""";
    }

    public static string RenderController(ControllerTemplateModel model)
    {
        var authAttribute = model.RequiresAuth ? "\n    [Authorize]" : string.Empty;
        var authUsing = model.RequiresAuth ? "\nusing Microsoft.AspNetCore.Authorization;" : string.Empty;

        return $$"""
using Microsoft.AspNetCore.Mvc;{{authUsing}}
using {{model.ProjectName}}.Application.DTOs;
using {{model.ProjectName}}.Application.Interfaces;

namespace {{model.ProjectName}}.API.Controllers;

[ApiController]
[Route("api/[controller]")]{{authAttribute}}
public sealed class {{model.EntityName}}Controller : ControllerBase
{
    private readonly I{{model.EntityName}}Service _service;

    public {{model.EntityName}}Controller(I{{model.EntityName}}Service service) => _service = service;

    /// <summary>Gets all {{model.EntityName}} records.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<{{model.EntityName}}Dto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _service.GetAllAsync(ct));

    /// <summary>Gets a single {{model.EntityName}} by id.</summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof({{model.EntityName}}Dto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById({{model.IdType}} id, CancellationToken ct)
    {
        var result = await _service.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Creates a new {{model.EntityName}}.</summary>
    [HttpPost]
    [ProducesResponseType(typeof({{model.EntityName}}Dto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] Create{{model.EntityName}}Request request, CancellationToken ct)
    {
        var created = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.GetType().GetProperty("Id")?.GetValue(created) }, created);
    }

    /// <summary>Updates an existing {{model.EntityName}}.</summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof({{model.EntityName}}Dto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update({{model.IdType}} id, [FromBody] Update{{model.EntityName}}Request request, CancellationToken ct)
    {
        var result = await _service.UpdateAsync(id, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Deletes a {{model.EntityName}} by id.</summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete({{model.IdType}} id, CancellationToken ct)
    {
        var deleted = await _service.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
""";
    }

    public static string RenderDbContext(DbContextTemplateModel model)
    {
        // CS8618: DbSet<T> properties need null-forgiving initialiser because EF sets them via reflection
        var dbSets = string.Join("\n    ", model.EntityNames.Select(n =>
            $"public DbSet<{n}> {n}s {{ get; set; }} = null!;"));

        // CS0105: emit the using directive only once regardless of entity count
        var entityImports = $"using {model.ProjectName}.Domain.Entities;";

        var providerConfig = model.StorageEngine switch
        {
            StorageEngine.PostgreSQL =>
                "optionsBuilder.UseNpgsql(connectionString);",
            StorageEngine.SqlServer =>
                "optionsBuilder.UseSqlServer(connectionString);",
            _ =>
                "optionsBuilder.UseSqlServer(connectionString); // Redis: use separate cache layer"
        };

        return $$"""
using Microsoft.EntityFrameworkCore;
{{entityImports}}

namespace {{model.ProjectName}}.Infrastructure.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    {{dbSets}}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
""";
    }

    public static string RenderProgram(ProgramTemplateModel model)
    {
        var entityServiceRegistrations = string.Join("\n", model.EntityNames.Select(n =>
            $"builder.Services.AddScoped<{model.ProjectName}.Application.Interfaces.I{n}Service, " +
            $"{model.ProjectName}.Infrastructure.Services.{n}Service>();"));

        var jwtSection = model.IncludeJwtAuth
            ? """

// JWT Authentication
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
            IssuerSigningKey = new SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
builder.Services.AddAuthorization();
"""
            : string.Empty;

        var jwtUsings = model.IncludeJwtAuth
            ? """
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
"""
            : string.Empty;

        var jwtMiddleware = model.IncludeJwtAuth
            ? """
app.UseAuthentication();
app.UseAuthorization();
"""
            : string.Empty;

        var dbProvider = model.StorageEngine switch
        {
            StorageEngine.PostgreSQL => "UseNpgsql",
            _ => "UseSqlServer"
        };

        return $$"""
{{jwtUsings}}using FluentValidation;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using {{model.ProjectName}}.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ────────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "{{model.ProjectName}} API", Version = "v1" });
});

// ── Database ───────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.{{dbProvider}}(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── FluentValidation ───────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<AppDbContext>();

// ── Application Services ───────────────────────────────────────────────────────
{{entityServiceRegistrations}}
{{jwtSection}}
// ── Rate Limiting ──────────────────────────────────────────────────────────────
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

// ── Request body size limit ────────────────────────────────────────────────────
builder.WebHost.ConfigureKestrel(k =>
    k.Limits.MaxRequestBodySize = 1 * 1024 * 1024); // 1 MB

var app = builder.Build();

// ── Middleware pipeline ────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRateLimiter();
{{jwtMiddleware}}
app.MapControllers();

app.Run();
""";
    }

    // ── Project infrastructure files ──────────────────────────────────────────

    public static string RenderDomainCsproj() => """
        <Project Sdk="Microsoft.NET.Sdk">
          <PropertyGroup>
            <TargetFramework>net10.0</TargetFramework>
            <Nullable>enable</Nullable>
            <ImplicitUsings>enable</ImplicitUsings>
          </PropertyGroup>
        </Project>
        """;

    public static string RenderApplicationCsproj(string projectName) => $"""
        <Project Sdk="Microsoft.NET.Sdk">
          <PropertyGroup>
            <TargetFramework>net10.0</TargetFramework>
            <Nullable>enable</Nullable>
            <ImplicitUsings>enable</ImplicitUsings>
          </PropertyGroup>
          <ItemGroup>
            <ProjectReference Include="../{projectName}.Domain/{projectName}.Domain.csproj" />
          </ItemGroup>
          <ItemGroup>
            <PackageReference Include="FluentValidation" Version="11.*" />
          </ItemGroup>
        </Project>
        """;

    public static string RenderInfrastructureCsproj(string projectName, StorageEngine engine)
    {
        var dbPackage = engine == StorageEngine.PostgreSQL
            ? "Npgsql.EntityFrameworkCore.PostgreSQL"
            : "Microsoft.EntityFrameworkCore.SqlServer";

        return $"""
        <Project Sdk="Microsoft.NET.Sdk">
          <PropertyGroup>
            <TargetFramework>net10.0</TargetFramework>
            <Nullable>enable</Nullable>
            <ImplicitUsings>enable</ImplicitUsings>
          </PropertyGroup>
          <ItemGroup>
            <ProjectReference Include="../{projectName}.Application/{projectName}.Application.csproj" />
          </ItemGroup>
          <ItemGroup>
            <PackageReference Include="{dbPackage}" Version="10.*" />
            <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.*" />
          </ItemGroup>
        </Project>
        """;
    }

    public static string RenderApiCsproj(string projectName, bool includeJwt) =>
        includeJwt
            ? $"""
        <Project Sdk="Microsoft.NET.Sdk.Web">
          <PropertyGroup>
            <TargetFramework>net10.0</TargetFramework>
            <Nullable>enable</Nullable>
            <ImplicitUsings>enable</ImplicitUsings>
          </PropertyGroup>
          <ItemGroup>
            <ProjectReference Include="../{projectName}.Application/{projectName}.Application.csproj" />
            <ProjectReference Include="../{projectName}.Infrastructure/{projectName}.Infrastructure.csproj" />
          </ItemGroup>
          <ItemGroup>
            <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.*" />
            <PackageReference Include="Swashbuckle.AspNetCore" Version="7.*" />
            <PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.*" />
          </ItemGroup>
        </Project>
        """
            : $"""
        <Project Sdk="Microsoft.NET.Sdk.Web">
          <PropertyGroup>
            <TargetFramework>net10.0</TargetFramework>
            <Nullable>enable</Nullable>
            <ImplicitUsings>enable</ImplicitUsings>
          </PropertyGroup>
          <ItemGroup>
            <ProjectReference Include="../{projectName}.Application/{projectName}.Application.csproj" />
            <ProjectReference Include="../{projectName}.Infrastructure/{projectName}.Infrastructure.csproj" />
          </ItemGroup>
          <ItemGroup>
            <PackageReference Include="Swashbuckle.AspNetCore" Version="7.*" />
            <PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.*" />
          </ItemGroup>
        </Project>
        """;

    public static string RenderSlnx(string projectName) => $"""
        <Solution>
          <Project Path="src/{projectName}.Domain/{projectName}.Domain.csproj" />
          <Project Path="src/{projectName}.Application/{projectName}.Application.csproj" />
          <Project Path="src/{projectName}.Infrastructure/{projectName}.Infrastructure.csproj" />
          <Project Path="src/{projectName}.API/{projectName}.API.csproj" />
        </Solution>
        """;

    public static string RenderAppSettings(string projectName, StorageEngine engine, bool includeJwt)
    {
        var dbConn = engine == StorageEngine.PostgreSQL
            ? $"Host=localhost;Database={projectName};Username=postgres;Password=changeme"
            : $"Server=localhost;Database={projectName};Trusted_Connection=True;TrustServerCertificate=True";

        var jwtSection = includeJwt
            ? $",\n  \"Jwt\": {{\n    \"Key\": \"REPLACE_WITH_SECURE_KEY_MINIMUM_32_CHARACTERS\",\n    \"Issuer\": \"{projectName}\",\n    \"Audience\": \"{projectName}\"\n  }}"
            : string.Empty;

        return $$"""
        {
          "Logging": {
            "LogLevel": {
              "Default": "Information",
              "Microsoft.AspNetCore": "Warning"
            }
          },
          "AllowedHosts": "*",
          "ConnectionStrings": {
            "DefaultConnection": "{{dbConn}}"
          }{{jwtSection}}
        }
        """;
    }
}
