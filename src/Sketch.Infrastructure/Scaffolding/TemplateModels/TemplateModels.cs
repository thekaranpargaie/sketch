using Sketch.Domain.Enums;
using Sketch.Domain.Models;

namespace Sketch.Infrastructure.Scaffolding.TemplateModels;

public record EntityTemplateModel(
    string ProjectName,
    string EntityName,
    string[] FieldLines);

public record DtoTemplateModel(
    string ProjectName,
    string EntityName,
    string[] FieldLines);

public record ServiceInterfaceTemplateModel(
    string ProjectName,
    string EntityName,
    string IdType);

public record ServiceTemplateModel(
    string ProjectName,
    string EntityName,
    string IdType,
    StorageEngine StorageEngine,
    IReadOnlyList<FieldDefinition> Fields);

public record ValidatorTemplateModel(
    string ProjectName,
    string EntityName,
    string[] ValidationRules);

public record ControllerTemplateModel(
    string ProjectName,
    string EntityName,
    string IdType,
    bool RequiresAuth,
    ProtocolStyle Style);

public record DbContextTemplateModel(
    string ProjectName,
    string[] EntityNames,
    StorageEngine StorageEngine);

public record ProgramTemplateModel(
    string ProjectName,
    string[] EntityNames,
    bool IncludeJwtAuth,
    StorageEngine StorageEngine,
    bool HasControllers);
