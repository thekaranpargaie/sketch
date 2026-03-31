using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sketch.API.Models.Requests;
using Sketch.Application.Interfaces;
using Sketch.Domain.Enums;
using Sketch.Domain.Models;

namespace Sketch.API.Controllers;

[ApiController]
[Route("api")]
[EnableRateLimiting("fixed")]
public sealed class BlueprintController : ControllerBase
{
    private const long MaxOutputBytes = 50 * 1024 * 1024; // 50 MB

    private readonly IBlueprintValidator _validator;
    private readonly IResolutionEngine _resolutionEngine;
    private readonly IScaffoldingEngine _scaffoldingEngine;
    private readonly IZipAssembler _zipAssembler;

    public BlueprintController(
        IBlueprintValidator validator,
        IResolutionEngine resolutionEngine,
        IScaffoldingEngine scaffoldingEngine,
        IZipAssembler zipAssembler)
    {
        _validator = validator;
        _resolutionEngine = resolutionEngine;
        _scaffoldingEngine = scaffoldingEngine;
        _zipAssembler = zipAssembler;
    }

    /// <summary>
    /// Validates a blueprint without generating scaffolding.
    /// Returns 200 with an empty errors list on success, or 422 with validation errors.
    /// </summary>
    [HttpPost("validate")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(ValidationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationResultDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ValidationResultDto), StatusCodes.Status422UnprocessableEntity)]
    public IActionResult Validate([FromBody] BlueprintRequest request)
    {
        Blueprint blueprint;
        try
        {
            blueprint = MapToDomain(request);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ValidationResultDto(false,
                [new ValidationErrorDto(string.Empty, "PARSE_ERROR", ex.Message)]));
        }

        var result = _validator.Validate(blueprint);
        var dto = new ValidationResultDto(
            result.IsValid,
            result.Errors.Select(e => new ValidationErrorDto(e.NodeId, e.Code, e.Message)).ToList());

        if (!result.IsValid)
        {
            return UnprocessableEntity(dto);
        }

        return Ok(dto);
    }

    /// <summary>
    /// Validates and provisions a scaffold zip for the given blueprint.
    /// Returns 200 with a zip binary stream on success.
    /// </summary>
    [HttpPost("provision")]
    [Consumes("application/json")]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(byte[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationResultDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ValidationResultDto), StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(StatusCodes.Status413RequestEntityTooLarge)]
    public async Task<IActionResult> Provision([FromBody] BlueprintRequest request, CancellationToken ct)
    {
        Blueprint blueprint;
        try
        {
            blueprint = MapToDomain(request);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ValidationResultDto(false,
                [new ValidationErrorDto(string.Empty, "PARSE_ERROR", ex.Message)]));
        }

        var validationResult = _validator.Validate(blueprint);
        if (!validationResult.IsValid)
        {
            var dto = new ValidationResultDto(
                false,
                validationResult.Errors
                    .Select(e => new ValidationErrorDto(e.NodeId, e.Code, e.Message))
                    .ToList());
            return UnprocessableEntity(dto);
        }

        var plan = _resolutionEngine.Resolve(blueprint);
        var files = await _scaffoldingEngine.ScaffoldAsync(plan, ct);
        var zipBytes = _zipAssembler.Assemble(files);

        if (zipBytes.Length > MaxOutputBytes)
        {
            return StatusCode(StatusCodes.Status413RequestEntityTooLarge,
                "Generated zip exceeds the 50 MB size limit.");
        }

        var fileName = $"{plan.ProjectName}.zip";
        return File(zipBytes, "application/zip", fileName);
    }

    // ── Mapping ──────────────────────────────────────────────────────────────────

    private static Blueprint MapToDomain(BlueprintRequest req)
    {
        var nodes = req.Nodes.Select(n => new BlueprintNode(
            n.Id,
            ParseEnum<NodeType>(n.Type, $"Unknown node type '{n.Type}'"),
            new NodeData(
                n.Data.Name,
                n.Data.Fields?.Select(f => new FieldDefinition(
                    f.Name,
                    ParseEnum<FieldType>(f.Type, $"Unknown field type '{f.Type}'"))).ToList(),
                n.Data.Style is not null
                    ? ParseEnum<ProtocolStyle>(n.Data.Style, $"Unknown protocol style '{n.Data.Style}'")
                    : null,
                n.Data.Auth is not null
                    ? ParseEnum<AuthStyle>(n.Data.Auth, $"Unknown auth style '{n.Data.Auth}'")
                    : null,
                n.Data.Engine is not null
                    ? ParseEnum<StorageEngine>(n.Data.Engine, $"Unknown storage engine '{n.Data.Engine}'")
                    : null),
            new Position(n.Position.X, n.Position.Y)
        )).ToList();

        var edges = req.Edges.Select(e => new BlueprintEdge(
            e.Id,
            e.Source,
            e.Target,
            ParseEnum<EdgeAction>(e.Action, $"Unknown edge action '{e.Action}'")
        )).ToList();

        return new Blueprint(req.Version, req.Project, nodes, edges);
    }

    private static T ParseEnum<T>(string value, string errorMessage) where T : struct, Enum
    {
        if (Enum.TryParse<T>(value, ignoreCase: true, out var result))
            return result;
        throw new ArgumentException(errorMessage);
    }
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

public record ValidationResultDto(bool IsValid, IReadOnlyList<ValidationErrorDto> Errors);
public record ValidationErrorDto(string NodeId, string Code, string Message);
