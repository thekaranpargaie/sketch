using Sketch.Domain.Enums;

namespace Sketch.Domain.Models;

public record Blueprint(
    string Version,
    string Project,
    IReadOnlyList<BlueprintNode> Nodes,
    IReadOnlyList<BlueprintEdge> Edges);

public record BlueprintNode(
    string Id,
    NodeType Type,
    NodeData Data,
    Position Position);

public record BlueprintEdge(
    string Id,
    string Source,
    string Target,
    EdgeAction Action);

public record NodeData(
    string Name,
    IReadOnlyList<FieldDefinition>? Fields = null,
    ProtocolStyle? Style = null,
    AuthStyle? Auth = null,
    StorageEngine? Engine = null);

public record FieldDefinition(string Name, FieldType Type);

public record Position(double X, double Y);
