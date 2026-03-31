import { useBlueprintStore } from '../../store/blueprintStore';
import { useShallow } from 'zustand/react/shallow';
import type { FieldDefinition, FieldType, NodeData } from '../../types/blueprint';

const FIELD_TYPES: FieldType[] = ['Guid', 'string', 'int', 'decimal', 'bool', 'DateTime', 'enum'];

export function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNode, deleteNode } = useBlueprintStore(useShallow((s) => ({
    nodes: s.nodes,
    selectedNodeId: s.selectedNodeId,
    updateNode: s.updateNode,
    deleteNode: s.deleteNode,
  })));

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const { data, type } = node;
  const nodeId = node.id;

  function handleNameChange(name: string) {
    updateNode(nodeId, { name });
  }

  function handleFieldChange(index: number, patch: Partial<FieldDefinition>) {
    const fields = [...(data.fields ?? [])];
    fields[index] = { ...fields[index], ...patch };
    updateNode(nodeId, { fields });
  }

  function handleAddField() {
    const fields = [...(data.fields ?? []), { name: 'NewField', type: 'string' as FieldType }];
    updateNode(nodeId, { fields });
  }

  function handleRemoveField(index: number) {
    const fields = (data.fields ?? []).filter((_, i) => i !== index);
    if (fields.length === 0) return; // minimum 1 field
    updateNode(nodeId, { fields });
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    right: 0,
    top: 0,
    bottom: 0,
    width: 280,
    background: '#1e293b',
    color: 'white',
    padding: 20,
    overflowY: 'auto',
    borderLeft: '1px solid #334155',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    zIndex: 10,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 4,
    color: 'white',
    padding: '6px 8px',
    fontSize: 13,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#94a3b8',
    marginBottom: 4,
    marginTop: 12,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.05em',
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Properties</span>
        <button
          onClick={() => deleteNode(nodeId)}
          style={{
            background: '#dc2626',
            border: 'none',
            color: 'white',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Delete
        </button>
      </div>

      <div style={{ marginTop: 16, color: '#64748b', fontSize: 11 }}>
        Type: {type?.toUpperCase()}
      </div>

      {type !== 'identity' && (
        <>
          <label style={labelStyle}>Name</label>
          <input
            style={inputStyle}
            value={data.name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </>
      )}

      {type === 'identity' && (
        <div style={{ marginTop: 12, color: '#94a3b8' }}>
          <strong style={{ color: 'white' }}>User</strong> — Identity node fields are fixed.
        </div>
      )}

      {type === 'protocol' && (
        <>
          <label style={labelStyle}>Style</label>
          <select
            style={inputStyle}
            value={data.style ?? 'REST'}
            onChange={(e) => updateNode(nodeId, { style: e.target.value as NodeData['style'] })}
          >
            <option>REST</option>
            <option>gRPC</option>
            <option>GraphQL</option>
          </select>

          <label style={labelStyle}>Authentication</label>
          <select
            style={inputStyle}
            value={data.auth ?? 'None'}
            onChange={(e) => updateNode(nodeId, { auth: e.target.value as NodeData['auth'] })}
          >
            <option>None</option>
            <option>JWT</option>
          </select>
        </>
      )}

      {type === 'storage' && (
        <>
          <label style={labelStyle}>Engine</label>
          <select
            style={inputStyle}
            value={data.engine ?? 'SqlServer'}
            onChange={(e) => updateNode(nodeId, { engine: e.target.value as NodeData['engine'] })}
          >
            <option>SqlServer</option>
            <option>PostgreSQL</option>
            <option>Redis</option>
          </select>
        </>
      )}

      {(type === 'entity') && (
        <>
          <label style={labelStyle}>Fields</label>
          {(data.fields ?? []).map((field, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <input
                style={{ ...inputStyle, flex: 2 }}
                value={field.name}
                onChange={(e) => handleFieldChange(i, { name: e.target.value })}
                placeholder="name"
              />
              <select
                style={{ ...inputStyle, flex: 1 }}
                value={field.type}
                onChange={(e) => handleFieldChange(i, { type: e.target.value as FieldType })}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={() => handleRemoveField(i)}
                disabled={(data.fields?.length ?? 1) <= 1}
                style={{
                  background: '#475569',
                  border: 'none',
                  color: 'white',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: (data.fields?.length ?? 1) <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  opacity: (data.fields?.length ?? 1) <= 1 ? 0.4 : 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={handleAddField}
            style={{
              marginTop: 4,
              background: '#334155',
              border: '1px solid #475569',
              color: 'white',
              borderRadius: 4,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
              width: '100%',
            }}
          >
            + Add Field
          </button>
        </>
      )}
    </div>
  );
}
