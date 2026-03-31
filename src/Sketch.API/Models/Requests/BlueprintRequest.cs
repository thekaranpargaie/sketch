using Sketch.Domain.Enums;

namespace Sketch.API.Models.Requests;

// ── Top-level blueprint DTO ────────────────────────────────────────────────────

/// <summary>
/// HTTP request body for both /api/blueprint/validate and /api/blueprint/provision.
/// Kept as a plain DTO so the domain model (Blueprint record) stays free of
/// serialisation concerns (camelCase JSON, null-tolerant deserialization, etc.).
/// </summary>
public sealed class BlueprintRequest
{
    public string Version { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public List<BlueprintNodeRequest> Nodes { get; set; } = [];
    public List<BlueprintEdgeRequest> Edges { get; set; } = [];
}

public sealed class BlueprintNodeRequest
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public NodeDataRequest Data { get; set; } = new();
    public PositionRequest Position { get; set; } = new();
}

public sealed class BlueprintEdgeRequest
{
    public string Id { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
}

public sealed class NodeDataRequest
{
    public string Name { get; set; } = string.Empty;
    public List<FieldDefinitionRequest>? Fields { get; set; }
    public string? Style { get; set; }
    public string? Auth { get; set; }
    public string? Engine { get; set; }
}

public sealed class FieldDefinitionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public sealed class PositionRequest
{
    public double X { get; set; }
    public double Y { get; set; }
}
