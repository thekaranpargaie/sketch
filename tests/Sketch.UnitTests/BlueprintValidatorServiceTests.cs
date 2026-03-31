using Sketch.Application.Services;
using Sketch.Domain.Enums;
using Sketch.Domain.Models;

namespace Sketch.UnitTests;

public sealed class BlueprintValidatorServiceTests
{
    private readonly BlueprintValidatorService _sut = new();

    private static Blueprint ValidBlueprint(string project = "MyProject") => new(
        "1.0",
        project,
        [new BlueprintNode("n1", NodeType.Entity, new NodeData("Order",
            [new FieldDefinition("Id", FieldType.Guid), new FieldDefinition("Total", FieldType.Decimal)]),
            new Position(0, 0))],
        []);

    [Fact]
    public void Validate_ValidBlueprint_ReturnsIsValid()
    {
        var result = _sut.Validate(ValidBlueprint());
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Validate_UnsupportedVersion_ReturnsError()
    {
        var bp = ValidBlueprint() with { Version = "2.0" };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "UNSUPPORTED_VERSION");
    }

    [Fact]
    public void Validate_EmptyProject_ReturnsError()
    {
        var bp = ValidBlueprint() with { Project = "   " };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "MISSING_PROJECT");
    }

    [Fact]
    public void Validate_NoNodes_ReturnsError()
    {
        var bp = ValidBlueprint() with { Nodes = [] };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "MISSING_NODES");
    }

    [Fact]
    public void Validate_DuplicateNodeIds_ReturnsError()
    {
        var node = new BlueprintNode("n1", NodeType.Entity, new NodeData("Order",
            [new FieldDefinition("Id", FieldType.Guid)]), new Position(0, 0));
        var bp = ValidBlueprint() with { Nodes = [node, node] };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "DUPLICATE_NODE_ID");
    }

    [Fact]
    public void Validate_EntityWithNoFields_ReturnsError()
    {
        var bp = ValidBlueprint() with
        {
            Nodes = [new BlueprintNode("n1", NodeType.Entity,
                new NodeData("Order", []), new Position(0, 0))]
        };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "ENTITY_NO_FIELDS");
    }

    [Fact]
    public void Validate_ReservedKeywordFieldName_ReturnsError()
    {
        var bp = ValidBlueprint() with
        {
            Nodes = [new BlueprintNode("n1", NodeType.Entity,
                new NodeData("Order", [new FieldDefinition("class", FieldType.String)]),
                new Position(0, 0))]
        };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "RESERVED_FIELD_NAME");
    }

    [Fact]
    public void Validate_InvalidFieldNameStartsWithDigit_ReturnsError()
    {
        var bp = ValidBlueprint() with
        {
            Nodes = [new BlueprintNode("n1", NodeType.Entity,
                new NodeData("Order", [new FieldDefinition("1Invalid", FieldType.String)]),
                new Position(0, 0))]
        };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "INVALID_FIELD_NAME");
    }

    [Fact]
    public void Validate_TooManyNodes_ReturnsError()
    {
        var nodes = Enumerable.Range(1, 21)
            .Select(i => new BlueprintNode($"n{i}", NodeType.Entity,
                new NodeData($"Entity{i}", [new FieldDefinition("Id", FieldType.Guid)]),
                new Position(i * 10, 0)))
            .ToList();
        var bp = ValidBlueprint() with { Nodes = nodes };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "TOO_MANY_NODES");
    }

    [Fact]
    public void Validate_InvalidEdgeRefMissingSource_ReturnsError()
    {
        var bp = ValidBlueprint() with
        {
            Edges = [new BlueprintEdge("e1", "nonexistent", "n1", EdgeAction.GenerateCRUD)]
        };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "INVALID_EDGE_REF");
    }

    [Fact]
    public void Validate_IllegalEdge_EntityToEntityCrud_ReturnsError()
    {
        var entity1 = new BlueprintNode("n1", NodeType.Entity,
            new NodeData("Order", [new FieldDefinition("Id", FieldType.Guid)]), new Position(0, 0));
        var entity2 = new BlueprintNode("n2", NodeType.Entity,
            new NodeData("Product", [new FieldDefinition("Id", FieldType.Guid)]), new Position(100, 0));
        var bp = ValidBlueprint() with
        {
            Nodes = [entity1, entity2],
            Edges = [new BlueprintEdge("e1", "n1", "n2", EdgeAction.GenerateCRUD)]
        };
        var result = _sut.Validate(bp);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "ILLEGAL_EDGE");
    }
}
