import { useState, type DragEvent } from 'react';
import type { NodeType } from '../../types/blueprint';
import { EntityIcon, ProtocolIcon, StorageIcon, IdentityIcon } from '../Icons/Icons';

interface PaletteItem {
  type: NodeType;
  label: string;
  color: string;
  accent: string;
  description: string;
  hint: string;
}

function NodeTypeIcon({ type, size = 16 }: { type: NodeType; size?: number }) {
  const props = { size, color: 'white' };
  switch (type) {
    case 'entity':   return <EntityIcon {...props} />;
    case 'protocol': return <ProtocolIcon {...props} />;
    case 'storage':  return <StorageIcon {...props} />;
    case 'identity': return <IdentityIcon {...props} />;
  }
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'entity',
    label: 'Entity',
    color: '#2563eb',
    accent: '#1d4ed8',
    description: 'Data model with fields',
    hint: '← Protocol / Storage',
  },
  {
    type: 'protocol',
    label: 'Protocol',
    color: '#7c3aed',
    accent: '#6d28d9',
    description: 'API layer (REST / gRPC)',
    hint: '→ Entity / Identity',
  },
  {
    type: 'storage',
    label: 'Storage',
    color: '#b45309',
    accent: '#92400e',
    description: 'Database (SQL / Redis)',
    hint: '→ Entity / Identity',
  },
  {
    type: 'identity',
    label: 'Identity',
    color: '#047857',
    accent: '#065f46',
    description: 'Auth user model',
    hint: '← Protocol / Storage',
  },
];

function onDragStart(event: DragEvent, nodeType: NodeType) {
  event.dataTransfer.setData('application/sketch-node-type', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

export function NodeToolbar() {
  const [hovered, setHovered] = useState<NodeType | null>(null);

  return (
    <aside
      style={{
        width: 180,
        padding: '14px 10px',
        background: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        userSelect: 'none',
        borderRight: '1px solid #334155',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          marginBottom: 6,
          paddingLeft: 4,
        }}
      >
        DRAG TO CANVAS
      </div>

      {PALETTE_ITEMS.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(e) => onDragStart(e, item.type)}
          onMouseEnter={() => setHovered(item.type)}
          onMouseLeave={() => setHovered(null)}
          style={{
            background: hovered === item.type ? item.color : '#0f172a',
            color: 'white',
            borderRadius: 8,
            border: `1px solid ${hovered === item.type ? item.color : '#334155'}`,
            cursor: 'grab',
            fontFamily: 'system-ui, sans-serif',
            overflow: 'hidden',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                background: item.color,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <NodeTypeIcon type={item.type} size={16} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{item.label}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{item.description}</div>
            </div>
          </div>
          <div
            style={{
              background: item.accent,
              padding: '3px 10px',
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              borderTop: 'solid 1px rgba(255,255,255,0.1)',
            }}
          >
            {item.hint}
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: 8,
          padding: '8px 10px',
          background: '#0f172a',
          borderRadius: 8,
          border: '1px solid #1e3a5f',
        }}
      >
        <div style={{ color: '#475569', fontSize: 10, lineHeight: 1.6 }}>
          <strong style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>EDGE TYPES</strong>
          <span style={{ color: '#8b5cf6' }}>◆ CRUD</span> — animated
          <br />
          <span style={{ color: '#f59e0b' }}>◆ Persist</span> — solid
        </div>
      </div>
    </aside>
  );
}
