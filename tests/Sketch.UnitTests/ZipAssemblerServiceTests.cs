using Sketch.Infrastructure.Zip;

namespace Sketch.UnitTests;

public sealed class ZipAssemblerServiceTests
{
    private readonly ZipAssemblerService _sut = new();

    [Fact]
    public void Assemble_ValidFiles_ReturnsNonEmptyByteArray()
    {
        var files = new Dictionary<string, string>
        {
            ["src/Domain/Entities/Order.cs"] = "namespace MyProject.Domain.Entities; public class Order {}",
            ["blueprint.sketch"] = "{\"version\":\"1.0\"}"
        };

        var result = _sut.Assemble(files);

        Assert.NotNull(result);
        Assert.True(result.Length > 0);
    }

    [Fact]
    public void Assemble_PathWithDotDot_ThrowsInvalidOperationException()
    {
        var files = new Dictionary<string, string>
        {
            ["../../../etc/passwd"] = "malicious"
        };

        Assert.Throws<InvalidOperationException>(() => _sut.Assemble(files));
    }

    [Fact]
    public void Assemble_AbsolutePath_ThrowsInvalidOperationException()
    {
        var files = new Dictionary<string, string>
        {
            ["/etc/passwd"] = "malicious"
        };

        Assert.Throws<InvalidOperationException>(() => _sut.Assemble(files));
    }

    [Fact]
    public void Assemble_NestedDotDotSegment_ThrowsInvalidOperationException()
    {
        var files = new Dictionary<string, string>
        {
            ["src/valid/../../../etc/shadow"] = "malicious"
        };

        Assert.Throws<InvalidOperationException>(() => _sut.Assemble(files));
    }

    [Fact]
    public void Assemble_EmptyDictionary_ReturnsValidEmptyZip()
    {
        var result = _sut.Assemble(new Dictionary<string, string>());
        // A valid empty zip has a minimum length (end of central directory record = 22 bytes)
        Assert.True(result.Length >= 22);
    }
}
