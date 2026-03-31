import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useBlueprintStore } from '../../store/blueprintStore';
import type { NodeData } from '../../types/blueprint';
import { ProtocolIcon } from '../Icons/Icons';

type ProtocolNodeProps = NodeProps & { data: NodeData };

export const ProtocolNode = memo(({ id, data, selected }: ProtocolNodeProps) => {
  const setSelected = useBlueprintStore((s) => s.setSelectedNode);

  return (
    <div
      onClick={() => setSelected(id)}
      style={{
        background: '#1e293b',
        color: '#f1f5f9',
        borderRadius: 10,
        minWidth: 180,
        border: selected ? '2px solid #8b5cf6' : '2px solid #334155',
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        boxShadow: selected ? '0 0 0 3px rgba(139,92,246,0.25)' : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        background: '#7c3aed',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderBottom: '1px solid #6d28d9',
      }}>
        <ProtocolIcon size={13} color="rgba(255,255,255,0.9)" />
        <span style={{ fontWeight: 700, fontSize: 13 }}>{data.name || 'Protocol'}</span>
        <span style={{
          marginLeft: 'auto',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>API</span>
      </div>
      {/* Properties */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>Protocol</span>
          <span style={{
            background: '#4c1d95',
            color: '#c4b5fd',
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: 11,
            fontWeight: 600,
          }}>{data.style ?? 'REST'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>Auth</span>
          <span style={{
            background: data.auth === 'JWT' ? '#78350f' : '#1e293b',
            color: data.auth === 'JWT' ? '#fbbf24' : '#64748b',
            border: `1px solid ${data.auth === 'JWT' ? '#d97706' : '#334155'}`,
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: 11,
            fontWeight: 600,
          }}>{data.auth ?? 'None'}</span>
        </div>
      </div>
      {/* Hint */}
      <div style={{ padding: '5px 12px', borderTop: '1px solid #2e1a5e', background: '#130d2a', fontSize: 10, color: '#a78bfa' }}>
        → Connect to Entity or Identity nodes
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#8b5cf6', border: '2px solid #1e293b', width: 10, height: 10 }} />
    </div>
  );
});

ProtocolNode.displayName = 'ProtocolNode';
