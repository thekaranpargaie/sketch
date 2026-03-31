import type { Connection } from '@xyflow/react';
import type { BlueprintNode } from '../types/blueprint';

export interface EdgeValidationResult {
  valid: boolean;
  code?: string;
  reason?: string;
}

export function validateConnection(
  connection: Connection,
  nodes: BlueprintNode[]
): EdgeValidationResult {
  const source = nodes.find((n) => n.id === connection.source);
  const target = nodes.find((n) => n.id === connection.target);

  if (!source || !target)
    return { valid: false, code: 'EC-00', reason: 'Unknown node.' };
  if (source.id === target.id)
    return { valid: false, code: 'EC-07', reason: 'Self-connections are not allowed.' };

  const s = source.type;
  const t = target.type;

  if ((s === 'protocol' || s === 'storage') && (t === 'entity' || t === 'identity'))
    return { valid: true };
  if (s === 'entity' && t === 'entity')
    return { valid: false, code: 'EC-01', reason: 'Direct entity-to-entity edges are not supported.' };
  if (s === 'protocol' && t === 'storage')
    return { valid: false, code: 'EC-02', reason: 'Protocol Nodes must connect to Entity or Identity Nodes.' };
  if (s === 'storage' && t === 'protocol')
    return { valid: false, code: 'EC-03', reason: 'Invalid edge direction.' };
  if (s === 'identity')
    return { valid: false, code: 'EC-04', reason: 'Identity is a target-only node; it cannot be a source.' };
  if (t === 'protocol')
    return { valid: false, code: 'EC-05', reason: 'Protocol nodes are sources only.' };
  if (t === 'storage')
    return { valid: false, code: 'EC-06', reason: 'Storage nodes are sources only.' };

  return { valid: false, code: 'EC-99', reason: 'This connection type is not supported.' };
}
