using System.IO.Compression;
using System.Text;
using Sketch.Application.Interfaces;

namespace Sketch.Infrastructure.Zip;

public sealed class ZipAssemblerService : IZipAssembler
{
    public byte[] Assemble(Dictionary<string, string> files)
    {
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var (path, content) in files)
            {
                ValidatePath(path);

                var entry = archive.CreateEntry(path, CompressionLevel.Optimal);
                using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
                writer.Write(content);
            }
        }

        return memoryStream.ToArray();
    }

    /// <summary>
    /// Guards against path traversal attacks by rejecting entries that contain
    /// ".." segments or that start with a root path separator.
    /// </summary>
    private static void ValidatePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new InvalidOperationException("Zip entry path must not be null or empty.");

        // Normalise to forward slashes for uniform comparison
        var normalised = path.Replace('\\', '/');

        if (normalised.StartsWith('/'))
            throw new InvalidOperationException(
                $"Zip entry path '{path}' must not start with a root separator.");

        var segments = normalised.Split('/');
        foreach (var segment in segments)
        {
            if (segment == "..")
                throw new InvalidOperationException(
                    $"Zip entry path '{path}' contains a path traversal segment '..'.");
        }
    }
}
