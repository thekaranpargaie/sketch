import { useState, useEffect, useCallback } from 'react';
import { EntityIcon, ProtocolIcon, StorageIcon, IdentityIcon, PencilIcon, ZapIcon, InfoIcon } from '../Icons/Icons';

type Tab = 'start' | 'rules' | 'sample';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

interface StepProps {
  n: number;
  title: string;
  body: string;
  icon: React.ReactNode;
}

const STEPS: Omit<StepProps, 'n'>[] = [
  {
    icon: <PencilIcon size={14} color="white" />,
    title: 'Name your project',
    body: 'Click the project name in the header to edit it. This becomes the C# root namespace.',
  },
  {
    icon: <EntityIcon size={14} color="white" />,
    title: 'Drag nodes onto the canvas',
    body: 'From the left palette drag Entity, Protocol, Storage, or Identity nodes to model your system.',
  },
  {
    icon: <InfoIcon size={14} color="white" />,
    title: 'Connect nodes with edges',
    body: 'Drag from a node\'s right handle to another node\'s left handle to create a typed connection.',
  },
  {
    icon: <IdentityIcon size={14} color="white" />,
    title: 'Edit node properties',
    body: 'Click any node to open the Properties panel. Add fields, set auth type, choose storage engine.',
  },
  {
    icon: <ZapIcon size={14} color="white" />,
    title: 'Provision your project',
    body: 'Click "Provision" to validate, generate a full .NET 10 solution, and download a .zip archive.',
  },
];

const RULES = [
  { sourceLabel: 'Protocol', sourceColor: '#7c3aed', sourceIcon: <ProtocolIcon size={11} color="white" />, targetLabel: 'Entity', targetColor: '#2563eb', targetIcon: <EntityIcon size={11} color="white" />, action: 'GenerateCRUD', generates: 'Controller + Service + DTOs' },
  { sourceLabel: 'Protocol', sourceColor: '#7c3aed', sourceIcon: <ProtocolIcon size={11} color="white" />, targetLabel: 'Identity', targetColor: '#047857', targetIcon: <IdentityIcon size={11} color="white" />, action: 'GenerateCRUD', generates: 'Auth Controller + DTOs' },
  { sourceLabel: 'Storage', sourceColor: '#b45309', sourceIcon: <StorageIcon size={11} color="white" />, targetLabel: 'Entity', targetColor: '#2563eb', targetIcon: <EntityIcon size={11} color="white" />, action: 'GeneratePersistence', generates: 'DbContext + EF Entity' },
  { sourceLabel: 'Storage', sourceColor: '#b45309', sourceIcon: <StorageIcon size={11} color="white" />, targetLabel: 'Identity', targetColor: '#047857', targetIcon: <IdentityIcon size={11} color="white" />, action: 'GeneratePersistence', generates: 'DbContext + Identity entity' },
];

const INVALID_RULES = [
  'Entity → Entity (direct): not supported — use a shared Storage node',
  'Protocol → Storage: not supported — Protocol connects to Entity/Identity only',
  'Identity as source: Identity is target-only',
];

const SAMPLE_NODES = [
  { label: 'REST API', sublabel: 'Protocol · Auth: None', color: '#7c3aed', icon: <ProtocolIcon size={13} color="white" /> },
  { label: 'PostgreSQL DB', sublabel: 'Storage · PostgreSQL', color: '#b45309', icon: <StorageIcon size={13} color="white" /> },
  { label: 'Employee', sublabel: 'Id · Name · Email · DepartmentId', color: '#2563eb', icon: <EntityIcon size={13} color="white" /> },
  { label: 'Department', sublabel: 'Id · Name', color: '#2563eb', icon: <EntityIcon size={13} color="white" /> },
  { label: 'Role', sublabel: 'Id · RoleName', color: '#2563eb', icon: <EntityIcon size={13} color="white" /> },
];

const GENERATED_FILES = `src/HrApp.Domain/Entities/
  Employee.cs  Department.cs  Role.cs

src/HrApp.Application/
  DTOs/        EmployeeDto.cs  DepartmentDto.cs  RoleDto.cs
  Interfaces/  IEmployeeService.cs  ...
  Validators/  EmployeeValidators.cs  ...

src/HrApp.Infrastructure/
  Data/         AppDbContext.cs
  Services/     EmployeeService.cs  DepartmentService.cs  RoleService.cs

src/HrApp.API/
  Controllers/  EmployeeController.cs  DepartmentController.cs  RoleController.cs
  Program.cs    (DI wiring + Swagger + Rate limiting)`;

function NodeBadge({ label, color, icon }: { label: string; color: string; icon: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: color,
      color: 'white',
      borderRadius: 4,
      padding: '2px 7px',
      fontSize: 11,
      fontWeight: 600,
    }}>
      {icon}{label}
    </span>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#0ea5e9' : 'transparent',
        color: active ? 'white' : '#64748b',
        border: 'none',
        borderRadius: 5,
        padding: '5px 12px',
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export function TutorialModal({ open, onClose }: TutorialModalProps) {
  const [tab, setTab] = useState<Tab>('start');

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [open, handleKeydown]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          borderRadius: 12,
          border: '1px solid #334155',
          width: '100%',
          maxWidth: 620,
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px 10px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: '#162032',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PencilIcon size={16} color="#0ea5e9" />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>Sketch — How to use</span>
            <span style={{ color: '#334155', margin: '0 4px' }}>|</span>
            <span style={{ color: '#475569', fontSize: 11 }}>Visual blueprint → .NET 10 code</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#334155',
              border: 'none',
              color: '#94a3b8',
              borderRadius: 6,
              width: 28,
              height: 28,
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          padding: '8px 18px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          gap: 4,
          flexShrink: 0,
          background: '#111827',
        }}>
          <TabBtn active={tab === 'start'} onClick={() => setTab('start')}>Getting Started</TabBtn>
          <TabBtn active={tab === 'rules'} onClick={() => setTab('rules')}>Connection Rules</TabBtn>
          <TabBtn active={tab === 'sample'} onClick={() => setTab('sample')}>Sample App</TabBtn>
        </div>

        {/* Content */}
        <div style={{ overflow: 'auto', padding: '16px 18px', flex: 1 }}>

          {tab === 'start' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 12px',
                  background: '#0f172a',
                  borderRadius: 8,
                  border: '1px solid #1e293b',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: '#0ea5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>{step.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 12, marginBottom: 2 }}>
                      {i + 1}. {step.title}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.55 }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'rules' && (
            <div>
              <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 12px', lineHeight: 1.6 }}>
                The edge you draw determines what code is generated. Only valid source→target combos are accepted.
              </p>
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      {['Source', 'Target', 'Generates', 'Action'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RULES.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? '#0f172a' : 'transparent' }}>
                        <td style={{ padding: '7px 8px' }}>
                          <NodeBadge label={r.sourceLabel} color={r.sourceColor} icon={r.sourceIcon} />
                        </td>
                        <td style={{ padding: '7px 8px' }}>
                          <NodeBadge label={r.targetLabel} color={r.targetColor} icon={r.targetIcon} />
                        </td>
                        <td style={{ padding: '7px 8px', color: '#94a3b8' }}>{r.generates}</td>
                        <td style={{ padding: '7px 8px' }}>
                          <span style={{
                            background: r.action === 'GenerateCRUD' ? '#4c1d95' : '#78350f',
                            color: r.action === 'GenerateCRUD' ? '#c4b5fd' : '#fbbf24',
                            borderRadius: 4,
                            padding: '1px 6px',
                            fontSize: 10,
                            fontWeight: 700,
                          }}>{r.action}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e3a5f', padding: '10px 12px' }}>
                <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>INVALID CONNECTIONS</div>
                {INVALID_RULES.map((r, i) => (
                  <div key={i} style={{ color: '#64748b', fontSize: 11, lineHeight: 1.7 }}>&#10005; {r}</div>
                ))}
              </div>

              <div style={{ marginTop: 12, background: '#0f172a', borderRadius: 8, border: '1px solid #1e3a5f', padding: '10px 12px' }}>
                <div style={{ color: '#0ea5e9', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Full stack in 3 nodes</div>
                <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6 }}>
                  Drop a <NodeBadge label="Protocol" color="#7c3aed" icon={<ProtocolIcon size={10} color="white" />} /> and a <NodeBadge label="Storage" color="#b45309" icon={<StorageIcon size={10} color="white" />} /> node, then connect both to the same <NodeBadge label="Entity" color="#2563eb" icon={<EntityIcon size={10} color="white" />} />. You get a complete REST API + EF Core persistence layer.
                </div>
              </div>
            </div>
          )}

          {tab === 'sample' && (
            <div>
              <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 12px', lineHeight: 1.6 }}>
                Click <strong style={{ color: '#60a5fa' }}>Load Sample</strong> in the header toolbar to load this HR system blueprint instantly.
              </p>

              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>NODES</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {SAMPLE_NODES.map((n) => (
                    <div key={n.label} style={{ background: '#0f172a', borderRadius: 7, overflow: 'hidden', border: '1px solid #334155' }}>
                      <div style={{ background: n.color, padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {n.icon}
                        <span style={{ fontWeight: 700, fontSize: 11, color: 'white' }}>{n.label}</span>
                      </div>
                      <div style={{ padding: '4px 9px', color: '#64748b', fontSize: 10, lineHeight: 1.6 }}>{n.sublabel}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>CONNECTIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { from: 'REST API', fromColor: '#7c3aed', fromIcon: <ProtocolIcon size={10} color="white" />, to: 'Employee / Department / Role', toColor: '#2563eb', toIcon: <EntityIcon size={10} color="white" />, action: 'GenerateCRUD', actionColor: '#4c1d95', actionText: '#c4b5fd' },
                    { from: 'PostgreSQL DB', fromColor: '#b45309', fromIcon: <StorageIcon size={10} color="white" />, to: 'Employee / Department / Role', toColor: '#2563eb', toIcon: <EntityIcon size={10} color="white" />, action: 'GeneratePersistence', actionColor: '#78350f', actionText: '#fbbf24' },
                  ].map((conn, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#0f172a', borderRadius: 7, border: '1px solid #1e293b', fontSize: 11 }}>
                      <NodeBadge label={conn.from} color={conn.fromColor} icon={conn.fromIcon} />
                      <span style={{ color: '#475569' }}>→</span>
                      <NodeBadge label={conn.to} color={conn.toColor} icon={conn.toIcon} />
                      <span style={{ marginLeft: 'auto', background: conn.actionColor, color: conn.actionText, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{conn.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>GENERATED FILES (project: HrApp)</div>
                <pre style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 7,
                  padding: '10px 12px',
                  fontSize: 10,
                  color: '#64748b',
                  overflowX: 'auto',
                  margin: 0,
                  lineHeight: 1.7,
                  fontFamily: 'monospace',
                }}>{GENERATED_FILES}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
          background: '#111827',
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '7px 18px',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function TutorialFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open tutorial"
        title="How to use Sketch"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          fontWeight: 800,
          boxShadow: '0 4px 16px rgba(139,92,246,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          letterSpacing: '-0.02em',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        ?
      </button>
      <TutorialModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
