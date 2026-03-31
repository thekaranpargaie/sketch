using Sketch.Domain.Models;

namespace Sketch.Application.Interfaces;

public interface IBlueprintValidator
{
    ValidationResult Validate(Blueprint blueprint);
}

public record ValidationResult(bool IsValid, IReadOnlyList<ValidationError> Errors);

public record ValidationError(string NodeId, string Code, string Message);
