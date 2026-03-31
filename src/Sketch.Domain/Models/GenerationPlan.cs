using Sketch.Domain.Enums;

namespace Sketch.Domain.Models;

public record GenerationPlan(
    string ProjectName,
    string DotNetTarget,
    StorageEngine StorageEngine,
    bool IncludeJwtAuth,
    IReadOnlyList<EntityTask> EntityTasks,
    IReadOnlyList<PersistenceTask> PersistenceTasks,
    IReadOnlyList<CrudTask> CrudTasks,
    string BlueprintJson);

public record EntityTask(string EntityName, IReadOnlyList<FieldDefinition> Fields);

public record PersistenceTask(string EntityName, StorageEngine Engine);

public record CrudTask(string EntityName, ProtocolStyle Style, AuthStyle Auth);
