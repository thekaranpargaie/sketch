using Sketch.Application.Interfaces;
using Sketch.Domain.Enums;
using Sketch.Domain.Models;
using Sketch.Infrastructure.Scaffolding.TemplateModels;

namespace Sketch.Infrastructure.Scaffolding;

public sealed class ScaffoldingEngine : IScaffoldingEngine
{
    public Task<Dictionary<string, string>> ScaffoldAsync(GenerationPlan plan, CancellationToken ct = default)
    {
        var files = new Dictionary<string, string>(StringComparer.Ordinal);
        var p = plan.ProjectName; // shorthand for path building

        // ── Domain entities ────────────────────────────────────────────────────
        foreach (var entityTask in plan.EntityTasks)
        {
            var fieldLines = entityTask.Fields
                .Select(f => $"public {MapToCSharpType(f.Type)} {f.Name} {{ get; set; }}")
                .ToArray();

            var model = new EntityTemplateModel(p, entityTask.EntityName, fieldLines);
            files[$"src/{p}.Domain/Entities/{entityTask.EntityName}.cs"] = ScribanRenderer.RenderEntity(model);
        }

        // ── Infrastructure: DbContext ──────────────────────────────────────────
        if (plan.PersistenceTasks.Count > 0)
        {
            var persistedEntityNames = plan.PersistenceTasks.Select(pt => pt.EntityName).ToArray();
            var dbContextModel = new DbContextTemplateModel(p, persistedEntityNames, plan.StorageEngine);
            files[$"src/{p}.Infrastructure/Data/AppDbContext.cs"] = ScribanRenderer.RenderDbContext(dbContextModel);
        }

        // ── Application + Infrastructure per CRUD task ────────────────────────
        foreach (var crudTask in plan.CrudTasks)
        {
            var entityTask = plan.EntityTasks.FirstOrDefault(et => et.EntityName == crudTask.EntityName);
            var fieldLines = entityTask?.Fields
                .Select(f => $"public {MapToCSharpType(f.Type)} {f.Name} {{ get; set; }}")
                .ToArray() ?? [];

            var dtoModel = new DtoTemplateModel(p, crudTask.EntityName, fieldLines);
            files[$"src/{p}.Application/DTOs/{crudTask.EntityName}Dto.cs"] = ScribanRenderer.RenderDto(dtoModel);

            var idType = ResolveIdType(entityTask);
            var svcIfaceModel = new ServiceInterfaceTemplateModel(p, crudTask.EntityName, idType);
            files[$"src/{p}.Application/Interfaces/I{crudTask.EntityName}Service.cs"] =
                ScribanRenderer.RenderServiceInterface(svcIfaceModel);

            var validationRules = BuildValidationRules(entityTask);
            var validatorModel = new ValidatorTemplateModel(p, crudTask.EntityName, validationRules);
            files[$"src/{p}.Application/Validators/{crudTask.EntityName}Validators.cs"] =
                ScribanRenderer.RenderValidator(validatorModel);

            var fields = entityTask?.Fields ?? [];
            var svcModel = new ServiceTemplateModel(p, crudTask.EntityName, idType, plan.StorageEngine, fields);
            files[$"src/{p}.Infrastructure/Services/{crudTask.EntityName}Service.cs"] =
                ScribanRenderer.RenderService(svcModel);

            var controllerModel = new ControllerTemplateModel(
                p, crudTask.EntityName, idType, crudTask.Auth == AuthStyle.JWT, crudTask.Style);
            files[$"src/{p}.API/Controllers/{crudTask.EntityName}Controller.cs"] =
                ScribanRenderer.RenderController(controllerModel);
        }

        // ── API: Program.cs + appsettings.json ────────────────────────────────
        var programModel = new ProgramTemplateModel(
            p, plan.EntityTasks.Select(et => et.EntityName).ToArray(),
            plan.IncludeJwtAuth, plan.StorageEngine, plan.CrudTasks.Count > 0);

        files[$"src/{p}.API/Program.cs"] = ScribanRenderer.RenderProgram(programModel);
        files[$"src/{p}.API/appsettings.json"] =
            ScribanRenderer.RenderAppSettings(p, plan.StorageEngine, plan.IncludeJwtAuth);

        // ── Project files (.csproj + .slnx) ───────────────────────────────────
        files[$"src/{p}.Domain/{p}.Domain.csproj"] = ScribanRenderer.RenderDomainCsproj();
        files[$"src/{p}.Application/{p}.Application.csproj"] = ScribanRenderer.RenderApplicationCsproj(p);
        files[$"src/{p}.Infrastructure/{p}.Infrastructure.csproj"] =
            ScribanRenderer.RenderInfrastructureCsproj(p, plan.StorageEngine);
        files[$"src/{p}.API/{p}.API.csproj"] = ScribanRenderer.RenderApiCsproj(p, plan.IncludeJwtAuth);
        files[$"{p}.slnx"] = ScribanRenderer.RenderSlnx(p);

        // ── Blueprint source ───────────────────────────────────────────────────
        files["blueprint.sketch"] = plan.BlueprintJson;

        return Task.FromResult(files);
    }

    private static string MapToCSharpType(FieldType type) => type switch
    {
        FieldType.Guid => "Guid",
        FieldType.String => "string",
        FieldType.Int => "int",
        FieldType.Decimal => "decimal",
        FieldType.Bool => "bool",
        FieldType.DateTime => "DateTime",
        FieldType.Enum => "string", // concrete enum generation requires additional metadata
        _ => "object"
    };

    private static string ResolveIdType(EntityTask? entityTask)
    {
        if (entityTask is null) return "Guid";
        var idField = entityTask.Fields.FirstOrDefault(f =>
            string.Equals(f.Name, "Id", StringComparison.OrdinalIgnoreCase));
        return idField is null ? "Guid" : MapToCSharpType(idField.Type);
    }

    private static string[] BuildValidationRules(EntityTask? entityTask)
    {
        if (entityTask is null) return Array.Empty<string>();

        var rules = new List<string>();
        foreach (var field in entityTask.Fields)
        {
            if (string.Equals(field.Name, "Id", StringComparison.OrdinalIgnoreCase)) continue;

            if (field.Type == FieldType.String)
            {
                rules.Add($"RuleFor(x => x.{field.Name}).NotEmpty().MaximumLength(256);");
                if (string.Equals(field.Name, "Email", StringComparison.OrdinalIgnoreCase))
                {
                    rules.Add($"RuleFor(x => x.{field.Name}).EmailAddress();");
                }
            }
            else if (field.Type == FieldType.Int || field.Type == FieldType.Decimal)
            {
                rules.Add($"RuleFor(x => x.{field.Name}).GreaterThanOrEqualTo(0);");
            }
            else if (field.Type == FieldType.Guid)
            {
                rules.Add($"RuleFor(x => x.{field.Name}).NotEmpty();");
            }
        }
        return rules.ToArray();
    }
}
