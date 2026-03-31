using Sketch.Domain.Models;

namespace Sketch.Application.Interfaces;

public interface IScaffoldingEngine
{
    Task<Dictionary<string, string>> ScaffoldAsync(GenerationPlan plan, CancellationToken ct = default);
}
