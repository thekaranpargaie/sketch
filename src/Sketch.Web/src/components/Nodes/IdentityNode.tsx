import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useBlueprintStore } from '../../store/blueprintStore';
import type { NodeData } from '../../types/blueprint';
import { IdentityIcon } from '../Icons/Icons';

type IdentityNodeProps = NodeProps & { data: NodeData };

const IDENTITY_FIELDS = [
  { name: 'Id', type: 'Guid' as const },
  { name: 'Email', type: 'string' as const },
  { name: 'Role', type: 'enum' as const },
];

export const IdentityNode = memo(({ id, data, selected }: IdentityNodeProps) => {
  const setSelected = useBlueprintStore((s) => s.setSelectedNode);
  const displayName = data?.name || 'User';

  return (
    <div
      onClick={() => setSelected(id)}
      style={{
        background: '#1e293b',
        color: '#f1f5f9',
        borderRadius: 10,
        minWidth: 180,
        border: selected ? '2px solid #10b981' : '2px solid #334155',
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        boxShadow: selected ? '0 0 0 3px rgba(16,185,129,0.25)' : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#10b981', border: '2px solid #1e293b', width: 10, height: 10 }} />
      {/* Header */}
      <div style={{
        background: '#047857',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderBottom: '1px solid #065f46',
      }}>
        <IdentityIcon size={13} color="rgba(255,255,255,0.9)" />
        <span style={{ fontWeight: 700, fontSize: 13 }}>{displayName}</span>
        <span style={{
          marginLeft: 'auto',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>AUTH</span>
      </div>
      {/* Fields */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {IDENTITY_FIELDS.map((f) => (
          <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{f.name}</span>
            <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>{f.type}</span>
          </div>
        ))}
      </div>
      {/* Hint */}
      <div style={{ padding: '5px 12px', borderTop: '1px solid #052e16', background: '#021a0d', fontSize: 10, color: '#34d399' }}>
        ← Protocol / Storage can connect here
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#10b981', border: '2px solid #1e293b', width: 10, height: 10 }} />
    </div>
  );
});

IdentityNode.displayName = 'IdentityNode';
