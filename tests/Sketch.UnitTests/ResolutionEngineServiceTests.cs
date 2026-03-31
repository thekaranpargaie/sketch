using Sketch.Application.Services;
using Sketch.Domain.Enums;
using Sketch.Domain.Models;

namespace Sketch.UnitTests;

public sealed class ResolutionEngineServiceTests
{
    private readonly ResolutionEngineService _sut = new();

    [Fact]
    public void Resolve_IdentityNode_ExpandsToUserWithThreeFields()
    {
        var blueprint = new Blueprint("1.0", "TestProject",
            [new BlueprintNode("n1", NodeType.Identity, new NodeData("User", null), new Position(0, 0))],
            []);

        var plan = _sut.Resolve(blueprint);

        var entityTask = Assert.Single(plan.EntityTasks);
        Assert.Equal("User", entityTask.EntityName);
        Assert.Equal(3, entityTask.Fields.Count);
        Assert.Contains(entityTask.Fields, f => f.Name == "Id" && f.Type == FieldType.Guid);
        Assert.Contains(entityTask.Fields, f => f.Name == "Email" && f.Type == FieldType.String);
        Assert.Contains(entityTask.Fields, f => f.Name == "Role" && f.Type == FieldType.Enum);
    }

    [Fact]
    public void Resolve_ProjectNameWithSpaces_SanitisesToPascalCase()
    {
        var blueprint = new Blueprint("1.0", "order management system",
            [new BlueprintNode("n1", NodeType.Entity,
                new NodeData("Order", [new FieldDefinition("Id", FieldType.Guid)]), new Position(0, 0))],
            []);

        var plan = _sut.Resolve(blueprint);

        Assert.Equal("OrderManagementSystem", plan.ProjectName);
    }

    [Fact]
    public void Resolve_CrudEdge_CreatesCrudTask()
    {
        var blueprint = new Blueprint("1.0", "TestProject",
            [
                new BlueprintNode("n1", NodeType.Entity,
                    new NodeData("Order", [new FieldDefinition("Id", FieldType.Guid)]), new Position(0, 0)),
                new BlueprintNode("n2", NodeType.Protocol,
                    new NodeData("REST", null, ProtocolStyle.REST, AuthStyle.JWT), new Position(200, 0))
            ],
            [new BlueprintEdge("e1", "n2", "n1", EdgeAction.GenerateCRUD)]);

        var plan = _sut.Resolve(blueprint);

        var crudTask = Assert.Single(plan.CrudTasks);
        Assert.Equal("Order", crudTask.EntityName);
        Assert.Equal(AuthStyle.JWT, crudTask.Auth);
        Assert.True(plan.IncludeJwtAuth);
    }

    [Fact]
    public void Resolve_PersistenceEdge_CreatesPersistenceTask()
    {
        var blueprint = new Blueprint("1.0", "TestProject",
            [
                new BlueprintNode("n1", NodeType.Entity,
                    new NodeData("Order", [new FieldDefinition("Id", FieldType.Guid)]), new Position(0, 0)),
                new BlueprintNode("n2", NodeType.Storage,
                    new NodeData("SqlServer", null, null, null, StorageEngine.SqlServer), new Position(200, 0))
            ],
            [new BlueprintEdge("e1", "n2", "n1", EdgeAction.GeneratePersistence)]);

        var plan = _sut.Resolve(blueprint);

        var persistenceTask = Assert.Single(plan.PersistenceTasks);
        Assert.Equal("Order", persistenceTask.EntityName);
        Assert.Equal(StorageEngine.SqlServer, persistenceTask.Engine);
    }

    [Fact]
    public void Resolve_EmptyProjectName_DefaultsToMyProject()
    {
        var blueprint = new Blueprint("1.0", "   ",
            [new BlueprintNode("n1", NodeType.Entity,
                new NodeData("Order", [new FieldDefinition("Id", FieldType.Guid)]), new Position(0, 0))],
            []);

        var plan = _sut.Resolve(blueprint);

        Assert.Equal("MyProject", plan.ProjectName);
    }
}
