using Sketch.Domain.Models;

namespace Sketch.Application.Interfaces;

public interface IResolutionEngine
{
    GenerationPlan Resolve(Blueprint blueprint);
}
