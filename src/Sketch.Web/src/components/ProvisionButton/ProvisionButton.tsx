import { useBlueprintStore } from '../../store/blueprintStore';
import { useShallow } from 'zustand/react/shallow';
import { provisionBlueprint } from '../../api/sketchApi';

interface Props {
  onError: (msg: string) => void;
  onSuccess: () => void;
}

export function ProvisionButton({ onError, onSuccess }: Props) {
  const { nodes, toBlueprint, provisionStatus, setProvisionStatus } = useBlueprintStore(useShallow((s) => ({
    nodes: s.nodes,
    toBlueprint: s.toBlueprint,
    provisionStatus: s.provisionStatus,
    setProvisionStatus: s.setProvisionStatus,
  })));

  const isProvisioning = provisionStatus === 'provisioning';

  async function handleProvision() {
    const entityCount = nodes.filter(
      (n) => n.type === 'entity' || n.type === 'identity'
    ).length;

    if (entityCount === 0) {
      onError('Add at least one Entity Node before provisioning.');
      return;
    }

    setProvisionStatus('provisioning');
    try {
      await provisionBlueprint(toBlueprint());
      setProvisionStatus('success');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Provision failed.';
      setProvisionStatus('error', message);
      onError(message);
    }
  }

  return (
    <button
      onClick={handleProvision}
      disabled={isProvisioning}
      style={{
        background: isProvisioning ? '#475569' : '#0ea5e9',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        padding: '10px 20px',
        fontSize: 14,
        fontWeight: 600,
        cursor: isProvisioning ? 'not-allowed' : 'pointer',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: isProvisioning ? 'none' : '0 2px 8px rgba(14,165,233,0.4)',
        transition: 'background 0.2s',
      }}
    >
      {isProvisioning ? (
        <>
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: 'white',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Provisioning…
        </>
      ) : (
        '⚡ Provision'
      )}
    </button>
  );
}
