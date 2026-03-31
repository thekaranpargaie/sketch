using System.Text;
using System.Text.Json;
using Sketch.Application.Interfaces;
using Sketch.Domain.Enums;
using Sketch.Domain.Models;

namespace Sketch.Application.Services;

public sealed class ResolutionEngineService : IResolutionEngine
{
    private static readonly FieldDefinition[] IdentityFields =
    [
        new FieldDefinition("Id", FieldType.Guid),
        new FieldDefinition("Email", FieldType.String),
        new FieldDefinition("Role", FieldType.Enum)
    ];

    public GenerationPlan Resolve(Blueprint blueprint)
    {
        var projectName = SanitizeProjectName(blueprint.Project);

        var nodeMap = blueprint.Nodes.ToDictionary(n => n.Id, n => n);

        var entityTasks = new List<EntityTask>();
        foreach (var node in blueprint.Nodes)
        {
            if (node.Type is NodeType.Entity)
            {
                entityTasks.Add(new EntityTask(
                    ToPascalCase(node.Data.Name),
                    node.Data.Fields ?? Array.Empty<FieldDefinition>()));
            }
            else if (node.Type is NodeType.Identity)
            {
                entityTasks.Add(new EntityTask(
                    ToPascalCase(node.Data.Name.Length > 0 ? node.Data.Name : "User"),
                    IdentityFields));
            }
        }

        var persistenceTasks = new List<PersistenceTask>();
        var crudTasks = new List<CrudTask>();

        if (blueprint.Edges != null)
        {
            foreach (var edge in blueprint.Edges)
            {
                if (!nodeMap.TryGetValue(edge.Source, out var sourceNode)) continue;
                if (!nodeMap.TryGetValue(edge.Target, out var targetNode)) continue;

                if (edge.Action == EdgeAction.GeneratePersistence && sourceNode.Type == NodeType.Storage)
                {
                    var engine = sourceNode.Data.Engine ?? StorageEngine.SqlServer;
                    var entityName = ToPascalCase(targetNode.Data.Name);
                    if (!persistenceTasks.Any(pt => pt.EntityName == entityName))
                    {
                        persistenceTasks.Add(new PersistenceTask(entityName, engine));
                    }
                }
                else if (edge.Action == EdgeAction.GenerateCRUD && sourceNode.Type == NodeType.Protocol)
                {
                    var style = sourceNode.Data.Style ?? ProtocolStyle.REST;
                    var auth = sourceNode.Data.Auth ?? AuthStyle.None;
                    var entityName = ToPascalCase(targetNode.Data.Name);
                    if (!crudTasks.Any(ct => ct.EntityName == entityName))
                    {
                        crudTasks.Add(new CrudTask(entityName, style, auth));
                    }
                }
            }
        }

        var includeJwtAuth = crudTasks.Any(ct => ct.Auth == AuthStyle.JWT);

        var storageEngine = persistenceTasks.Count > 0
            ? persistenceTasks[0].Engine
            : StorageEngine.SqlServer;

        var blueprintJson = JsonSerializer.Serialize(blueprint, new JsonSerializerOptions
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return new GenerationPlan(
            projectName,
            "net10.0",
            storageEngine,
            includeJwtAuth,
            entityTasks,
            persistenceTasks,
            crudTasks,
            blueprintJson);
    }

    private static string SanitizeProjectName(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "MyProject";

        var words = raw.Split([' ', '-', '_', '.', '/', '\\'], StringSplitOptions.RemoveEmptyEntries);
        var result = ToPascalCaseFromWords(words);
        return result.Length == 0 ? "MyProject" : result;
    }

    private static string ToPascalCaseFromWords(string[] words)
    {
        var sb = new StringBuilder();
        foreach (var word in words)
        {
            var clean = new string(word.Where(char.IsLetterOrDigit).ToArray());
            if (clean.Length == 0) continue;
            sb.Append(char.ToUpperInvariant(clean[0]));
            sb.Append(clean[1..]);
        }
        return sb.Length > 0 ? sb.ToString() : "MyProject";
    }

    private static string ToPascalCase(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Unknown";
        var clean = new string(name.Where(char.IsLetterOrDigit).ToArray());
        if (clean.Length == 0) return "Unknown";
        return char.ToUpperInvariant(clean[0]) + clean[1..];
    }
}
