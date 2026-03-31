import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type OnConnect,
  type IsValidConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EntityNode } from '../Nodes/EntityNode';
import { ProtocolNode } from '../Nodes/ProtocolNode';
import { StorageNode } from '../Nodes/StorageNode';
import { IdentityNode } from '../Nodes/IdentityNode';
import { useBlueprintStore } from '../../store/blueprintStore';
import { validateConnection } from '../../utils/edgeValidation';
import type { BlueprintNode, EdgeAction, NodeType } from '../../types/blueprint';
import { addToast } from '../Toast/ToastNotifications';

const nodeTypes = {
  entity: EntityNode,
  protocol: ProtocolNode,
  storage: StorageNode,
  identity: IdentityNode,
};

function deriveEdgeAction(sourceType: NodeType, _targetType: NodeType): EdgeAction {
  if (sourceType === 'protocol') return 'GenerateCRUD';
  if (sourceType === 'storage') return 'GeneratePersistence';
  return 'GenerateCRUD';
}

let nodeIdCounter = Date.now();
function genId() {
  return `node-${++nodeIdCounter}`;
}

function getDefaultData(type: NodeType) {
  switch (type) {
    case 'entity':
      return { name: 'NewEntity', fields: [{ name: 'Id', type: 'Guid' as const }] };
    case 'protocol':
      return { name: 'REST API', style: 'REST' as const, auth: 'None' as const };
    case 'storage':
      return { name: 'SqlServer DB', engine: 'SqlServer' as const };
    case 'identity':
      return {
        name: 'User',
        fields: [
          { name: 'Id', type: 'Guid' as const },
          { name: 'Email', type: 'string' as const },
          { name: 'Role', type: 'enum' as const },
        ],
      };
  }
}

export function ReactFlowCanvas() {
  const storeNodes = useBlueprintStore((s) => s.nodes);
  const storeEdges = useBlueprintStore((s) => s.edges);
  const addNode = useBlueprintStore((s) => s.addNode);
  const addEdgeToStore = useBlueprintStore((s) => s.addEdge);
  const storeDeleteEdge = useBlueprintStore((s) => s.deleteEdge);
  const updateNodePosition = useBlueprintStore((s) => s.updateNodePosition);

  // React Flow owns visual state; store is the blueprint source of truth.
  // We sync STORE → RF via effects, and RF → STORE only on drag end.
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setRfNodes(
      storeNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as unknown as Record<string, unknown>,
      }))
    );
  }, [storeNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(
      storeEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.action === 'GenerateCRUD' ? 'CRUD' : 'Persist',
        style: {
          stroke: e.action === 'GenerateCRUD' ? '#8b5cf6' : '#d97706',
          strokeWidth: 2,
        },
        animated: e.action === 'GenerateCRUD',
      }))
    );
  }, [storeEdges, setRfEdges]);

  // Write position back to store only on drag end (not during drag) to avoid loops.
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const isValidConnection = useCallback<IsValidConnection>(
    (connection) => validateConnection(connection as Connection, storeNodes).valid,
    [storeNodes]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const validation = validateConnection(connection, storeNodes);
      if (!validation.valid) {
        addToast(validation.reason ?? 'Invalid connection.', 'error');
        return;
      }

      const sourceNode = storeNodes.find((n) => n.id === connection.source);
      const targetNode = storeNodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      const action = deriveEdgeAction(sourceNode.type, targetNode.type);
      const edgeId = `edge-${sourceNode.id}-${targetNode.id}-${Date.now()}`;

      addEdgeToStore({
        id: edgeId,
        source: connection.source!,
        target: connection.target!,
        action,
      });
    },
    [storeNodes, addEdgeToStore]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/sketch-node-type') as NodeType;
      if (!type) return;

      const wrapper = reactFlowWrapper.current;
      if (!wrapper) return;

      const bounds = wrapper.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 80,
        y: event.clientY - bounds.top - 30,
      };

      const id = genId();
      const newNode: BlueprintNode = {
        id,
        type,
        data: getDefaultData(type),
        position,
      };

      addNode(newNode);
    },
    [addNode]
  );

  const onEdgesDelete = useCallback(
    (edges: Edge[]) => {
      edges.forEach((e) => storeDeleteEdge(e.id));
    },
    [storeDeleteEdge]
  );

  return (
    <div ref={reactFlowWrapper} style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: '#0f172a' }}
      >
        <Background color="#334155" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'entity': return '#2563eb';
              case 'protocol': return '#8b5cf6';
              case 'storage': return '#d97706';
              case 'identity': return '#059669';
              default: return '#64748b';
            }
          }}
          style={{ background: '#1e293b', border: '1px solid #334155' }}
        />
      </ReactFlow>
    </div>
  );
}
