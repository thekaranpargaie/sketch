import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useBlueprintStore } from '../../store/blueprintStore';
import type { NodeData } from '../../types/blueprint';
import { StorageIcon } from '../Icons/Icons';

type StorageNodeProps = NodeProps & { data: NodeData };

export const StorageNode = memo(({ id, data, selected }: StorageNodeProps) => {
  const setSelected = useBlueprintStore((s) => s.setSelectedNode);

  const engineColor = data.engine === 'PostgreSQL' ? '#38bdf8' : data.engine === 'Redis' ? '#f87171' : '#fbbf24';

  return (
    <div
      onClick={() => setSelected(id)}
      style={{
        background: '#1e293b',
        color: '#f1f5f9',
        borderRadius: 10,
        minWidth: 180,
        border: selected ? '2px solid #f59e0b' : '2px solid #334155',
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        boxShadow: selected ? '0 0 0 3px rgba(245,158,11,0.25)' : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        background: '#b45309',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderBottom: '1px solid #92400e',
      }}>
        <StorageIcon size={13} color="rgba(255,255,255,0.9)" />
        <span style={{ fontWeight: 700, fontSize: 13 }}>{data.name || 'Storage'}</span>
        <span style={{
          marginLeft: 'auto',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>DB</span>
      </div>
      {/* Engine */}
      <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>Engine</span>
        <span style={{
          color: engineColor,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'monospace',
        }}>{data.engine ?? 'SqlServer'}</span>
      </div>
      {/* Hint */}
      <div style={{ padding: '5px 12px', borderTop: '1px solid #3a2000', background: '#1a0f00', fontSize: 10, color: '#fbbf24' }}>
        → Connect to Entity or Identity nodes
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#f59e0b', border: '2px solid #1e293b', width: 10, height: 10 }} />
    </div>
  );
});

StorageNode.displayName = 'StorageNode';
