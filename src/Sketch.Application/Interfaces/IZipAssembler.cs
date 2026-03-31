namespace Sketch.Application.Interfaces;

public interface IZipAssembler
{
    byte[] Assemble(Dictionary<string, string> files);
}
