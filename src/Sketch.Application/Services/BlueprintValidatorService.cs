using Sketch.Application.Interfaces;
using Sketch.Domain.Enums;
using Sketch.Domain.Models;

namespace Sketch.Application.Services;

public sealed class BlueprintValidatorService : IBlueprintValidator
{
    private static readonly HashSet<string> ReservedKeywords = new(StringComparer.Ordinal)
    {
        "class", "void", "string", "int", "bool", "return", "using", "namespace",
        "public", "private", "protected", "internal", "static", "new", "if", "else",
        "for", "foreach", "while", "do", "switch", "case", "break", "continue",
        "try", "catch", "finally", "throw", "true", "false", "null"
    };

    private static readonly System.Text.RegularExpressions.Regex ValidFieldName =
        new(@"^[A-Za-z][A-Za-z0-9]*$", System.Text.RegularExpressions.RegexOptions.Compiled);

    public ValidationResult Validate(Blueprint blueprint)
    {
        var errors = new List<ValidationError>();

        if (blueprint.Version != "1.0")
        {
            errors.Add(new ValidationError(string.Empty, "UNSUPPORTED_VERSION",
                $"Blueprint version '{blueprint.Version}' is not supported. Expected '1.0'."));
        }

        if (string.IsNullOrWhiteSpace(blueprint.Project))
        {
            errors.Add(new ValidationError(string.Empty, "MISSING_PROJECT",
                "Blueprint must include a non-empty project name."));
        }

        if (blueprint.Nodes == null || blueprint.Nodes.Count == 0)
        {
            errors.Add(new ValidationError(string.Empty, "MISSING_NODES",
                "Blueprint must contain at least one node."));
            return new ValidationResult(false, errors);
        }

        if (blueprint.Nodes.Count > 20)
        {
            errors.Add(new ValidationError(string.Empty, "TOO_MANY_NODES",
                $"Blueprint contains {blueprint.Nodes.Count} nodes; maximum is 20."));
        }

        var seenIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var node in blueprint.Nodes)
        {
            if (!seenIds.Add(node.Id))
            {
                errors.Add(new ValidationError(node.Id, "DUPLICATE_NODE_ID",
                    $"Node id '{node.Id}' is duplicated."));
            }
        }

        if (blueprint.Edges != null)
        {
            // Build a safe node map (first occurrence wins) to avoid throwing on duplicates
            var nodeMap = new Dictionary<string, BlueprintNode>(StringComparer.Ordinal);
            foreach (var node in blueprint.Nodes)
                nodeMap.TryAdd(node.Id, node);

            foreach (var edge in blueprint.Edges)
            {
                if (!seenIds.Contains(edge.Source))
                {
                    errors.Add(new ValidationError(edge.Id, "INVALID_EDGE_REF",
                        $"Edge '{edge.Id}' references non-existent source node '{edge.Source}'."));
                }

                if (!seenIds.Contains(edge.Target))
                {
                    errors.Add(new ValidationError(edge.Id, "INVALID_EDGE_REF",
                        $"Edge '{edge.Id}' references non-existent target node '{edge.Target}'."));
                }

                // Edge legality: GenerateCRUD source must be Protocol, target must be Entity/Identity
                if (edge.Action == EdgeAction.GenerateCRUD)
                {
                    if (nodeMap.TryGetValue(edge.Source, out var src) && src.Type != NodeType.Protocol)
                        errors.Add(new ValidationError(edge.Id, "ILLEGAL_EDGE",
                            $"GenerateCRUD edge '{edge.Id}': source node must be a Protocol node, got {src.Type}."));

                    if (nodeMap.TryGetValue(edge.Target, out var tgt) &&
                        tgt.Type is not NodeType.Entity and not NodeType.Identity)
                        errors.Add(new ValidationError(edge.Id, "ILLEGAL_EDGE",
                            $"GenerateCRUD edge '{edge.Id}': target node must be an Entity or Identity node, got {tgt.Type}."));
                }

                // Edge legality: GeneratePersistence source must be Storage, target must be Entity/Identity
                if (edge.Action == EdgeAction.GeneratePersistence)
                {
                    if (nodeMap.TryGetValue(edge.Source, out var src) && src.Type != NodeType.Storage)
                        errors.Add(new ValidationError(edge.Id, "ILLEGAL_EDGE",
                            $"GeneratePersistence edge '{edge.Id}': source node must be a Storage node, got {src.Type}."));

                    if (nodeMap.TryGetValue(edge.Target, out var tgt) &&
                        tgt.Type is not NodeType.Entity and not NodeType.Identity)
                        errors.Add(new ValidationError(edge.Id, "ILLEGAL_EDGE",
                            $"GeneratePersistence edge '{edge.Id}': target node must be an Entity or Identity node, got {tgt.Type}."));
                }
            }
        }

        foreach (var node in blueprint.Nodes)
        {
            if (node.Type is NodeType.Entity or NodeType.Identity)
            {
                if (node.Data.Fields == null || node.Data.Fields.Count == 0)
                {
                    errors.Add(new ValidationError(node.Id, "ENTITY_NO_FIELDS",
                        $"Node '{node.Id}' of type {node.Type} must have at least one field."));
                    continue;
                }

                foreach (var field in node.Data.Fields)
                {
                    if (!ValidFieldName.IsMatch(field.Name))
                    {
                        errors.Add(new ValidationError(node.Id, "INVALID_FIELD_NAME",
                            $"Field '{field.Name}' on node '{node.Id}' does not match the required pattern ^[A-Za-z][A-Za-z0-9]*$."));
                    }
                    else if (ReservedKeywords.Contains(field.Name))
                    {
                        errors.Add(new ValidationError(node.Id, "RESERVED_FIELD_NAME",
                            $"Field '{field.Name}' on node '{node.Id}' is a C# reserved keyword."));
                    }
                }
            }
        }

        return new ValidationResult(errors.Count == 0, errors);
    }
}
