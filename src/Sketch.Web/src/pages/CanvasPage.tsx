import { useEffect, useState, useRef, useCallback } from 'react';
import { NodeToolbar } from '../components/NodeToolbar/NodeToolbar';
import { ReactFlowCanvas } from '../components/Canvas/ReactFlowCanvas';
import { PropertiesPanel } from '../components/PropertiesPanel/PropertiesPanel';
import { ProvisionButton } from '../components/ProvisionButton/ProvisionButton';
import { ToastNotifications, addToast } from '../components/Toast/ToastNotifications';
import { TutorialFAB } from '../components/Tutorial/TutorialModal';
import { PencilIcon, UploadIcon, DownloadIcon, TrashIcon } from '../components/Icons/Icons';
import { useBlueprintStore } from '../store/blueprintStore';
import { useShallow } from 'zustand/react/shallow';
import { loadSaved, clearSaved } from '../persistence/canvasPersistence';
import type { Blueprint } from '../types/blueprint';

const SAMPLE_BLUEPRINT: Blueprint = {
  version: '1.0',
  project: 'HrApp',
  nodes: [
    { id: 'proto-1', type: 'protocol', data: { name: 'REST API', style: 'REST', auth: 'None' }, position: { x: 60, y: 200 } },
    { id: 'storage-1', type: 'storage', data: { name: 'PostgreSQL DB', engine: 'PostgreSQL' }, position: { x: 60, y: 420 } },
    { id: 'emp-1', type: 'entity', data: { name: 'Employee', fields: [{ name: 'Id', type: 'Guid' }, { name: 'Name', type: 'string' }, { name: 'Email', type: 'string' }, { name: 'DepartmentId', type: 'Guid' }] }, position: { x: 380, y: 80 } },
    { id: 'dept-1', type: 'entity', data: { name: 'Department', fields: [{ name: 'Id', type: 'Guid' }, { name: 'Name', type: 'string' }] }, position: { x: 380, y: 310 } },
    { id: 'role-1', type: 'entity', data: { name: 'Role', fields: [{ name: 'Id', type: 'Guid' }, { name: 'RoleName', type: 'string' }] }, position: { x: 380, y: 490 } },
  ],
  edges: [
    { id: 'e1', source: 'proto-1', target: 'emp-1', action: 'GenerateCRUD' },
    { id: 'e2', source: 'proto-1', target: 'dept-1', action: 'GenerateCRUD' },
    { id: 'e3', source: 'proto-1', target: 'role-1', action: 'GenerateCRUD' },
    { id: 'e4', source: 'storage-1', target: 'emp-1', action: 'GeneratePersistence' },
    { id: 'e5', source: 'storage-1', target: 'dept-1', action: 'GeneratePersistence' },
    { id: 'e6', source: 'storage-1', target: 'role-1', action: 'GeneratePersistence' },
  ],
};

export function CanvasPage() {
  const { projectName, setProjectName, loadBlueprint, toBlueprint, reset, selectedNodeId, nodeCount } =
    useBlueprintStore(useShallow((s) => ({
      projectName: s.projectName,
      setProjectName: s.setProjectName,
      loadBlueprint: s.loadBlueprint,
      toBlueprint: s.toBlueprint,
      reset: s.reset,
      selectedNodeId: s.selectedNodeId,
      nodeCount: s.nodes.length,
    })));

  const [editingProjectName, setEditingProjectName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState(projectName);
  const importRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage on first load
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      loadBlueprint(saved);
      setProjectNameInput(saved.project);
    }
  }, []);

  function commitProjectName() {
    const name = projectNameInput.trim() || 'MyProject';
    setProjectName(name);
    setProjectNameInput(name);
    setEditingProjectName(false);
  }

  function handleLoadSample() {
    loadBlueprint(SAMPLE_BLUEPRINT);
    setProjectNameInput(SAMPLE_BLUEPRINT.project);
    addToast('Sample HR project loaded!', 'success');
  }

  function handleExport() {
    const bp = toBlueprint();
    const blob = new Blob([JSON.stringify(bp, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bp.project || 'sketch'}.sketch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Blueprint exported.', 'success');
  }

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bp = JSON.parse(ev.target?.result as string) as Blueprint;
        if (bp.version !== '1.0') throw new Error('Unsupported version.');
        loadBlueprint(bp);
        setProjectNameInput(bp.project);
        addToast(`"${bp.project}" imported.`, 'success');
      } catch {
        addToast('Invalid .sketch file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadBlueprint]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0f172a',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          height: 52,
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          flexShrink: 0,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#0ea5e9', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PencilIcon size={17} color="#0ea5e9" /> Sketch
          </span>
          {nodeCount > 0 && (
            <span style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: '2px 8px',
              fontSize: 11,
              color: '#64748b',
              fontWeight: 600,
            }}>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
          )}
          <span style={{ color: '#475569' }}>|</span>
          {editingProjectName ? (
            <input
              autoFocus
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              onBlur={commitProjectName}
              onKeyDown={(e) => e.key === 'Enter' && commitProjectName()}
              style={{
                background: '#0f172a',
                border: '1px solid #0ea5e9',
                borderRadius: 4,
                color: 'white',
                padding: '4px 8px',
                fontSize: 14,
                fontWeight: 600,
              }}
            />
          ) : (
            <button
              onClick={() => setEditingProjectName(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#e2e8f0',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
              }}
              title="Click to rename project"
            >
              {projectName}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleLoadSample}
            style={{
              background: '#1e3a5f',
              border: '1px solid #2563eb',
              color: '#60a5fa',
              borderRadius: 6,
              padding: '5px 10px',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
            title="Load Employee / Department / Role sample"
          >
            Load Sample
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".sketch,.json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => importRef.current?.click()}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: 6,
              padding: '5px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
            title="Import .sketch file"
          >
            <UploadIcon size={13} color="#94a3b8" /> Import
          </button>
          <button
            onClick={handleExport}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: 6,
              padding: '5px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
            title="Export .sketch file"
          >
            <DownloadIcon size={13} color="#94a3b8" /> Export
          </button>
          <button
            onClick={() => {
              reset();
              clearSaved();
              addToast('Canvas cleared.', 'success');
            }}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: 6,
              padding: '5px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
            title="Clear canvas"
          >
            <TrashIcon size={13} color="#94a3b8" />
          </button>
          <ProvisionButton
            onError={(msg) => addToast(msg, 'error')}
            onSuccess={() => addToast('Provisioned successfully! Download started.', 'success')}
          />
        </div>
      </header>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NodeToolbar />
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ReactFlowCanvas />
        </main>
        {selectedNodeId && <PropertiesPanel />}
      </div>

      <ToastNotifications />
      <TutorialFAB />

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1e293b; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>
    </div>
  );
}
