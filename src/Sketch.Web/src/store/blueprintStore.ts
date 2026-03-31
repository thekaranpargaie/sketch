import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Blueprint, BlueprintEdge, BlueprintNode, NodeData, ProvisionStatus } from '../types/blueprint';
import { scheduleSave } from '../persistence/canvasPersistence';

interface BlueprintState {
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
  projectName: string;
  selectedNodeId: string | null;
  provisionStatus: ProvisionStatus;
  provisionError: string | null;

  toBlueprint: () => Blueprint;
  addNode: (node: BlueprintNode) => void;
  updateNode: (id: string, patch: Partial<NodeData>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: BlueprintEdge) => void;
  deleteEdge: (id: string) => void;
  setProjectName: (name: string) => void;
  setSelectedNode: (id: string | null) => void;
  setProvisionStatus: (status: ProvisionStatus, error?: string) => void;
  loadBlueprint: (blueprint: Blueprint) => void;
  reset: () => void;
}

export const useBlueprintStore = create<BlueprintState>()(
  immer((set, get) => ({
    nodes: [],
    edges: [],
    projectName: 'MyProject',
    selectedNodeId: null,
    provisionStatus: 'idle',
    provisionError: null,

    toBlueprint: (): Blueprint => ({
      version: '1.0',
      project: get().projectName,
      nodes: get().nodes,
      edges: get().edges,
    }),

    addNode: (node) =>
      set((draft) => {
        draft.nodes.push(node);
      }),

    updateNode: (id, patch) =>
      set((draft) => {
        const node = draft.nodes.find((n) => n.id === id);
        if (node) Object.assign(node.data, patch);
      }),

    updateNodePosition: (id, position) =>
      set((draft) => {
        const node = draft.nodes.find((n) => n.id === id);
        if (node) node.position = position;
      }),

    deleteNode: (id) =>
      set((draft) => {
        draft.nodes = draft.nodes.filter((n) => n.id !== id);
        draft.edges = draft.edges.filter((e) => e.source !== id && e.target !== id);
        if (draft.selectedNodeId === id) draft.selectedNodeId = null;
      }),

    addEdge: (edge) =>
      set((draft) => {
        draft.edges.push(edge);
      }),

    deleteEdge: (id) =>
      set((draft) => {
        draft.edges = draft.edges.filter((e) => e.id !== id);
      }),

    setProjectName: (name) =>
      set((draft) => {
        draft.projectName = name;
      }),

    setSelectedNode: (id) =>
      set((draft) => {
        draft.selectedNodeId = id;
      }),

    setProvisionStatus: (status, error) =>
      set((draft) => {
        draft.provisionStatus = status;
        draft.provisionError = error ?? null;
      }),

    loadBlueprint: (blueprint) =>
      set((draft) => {
        draft.nodes = blueprint.nodes;
        draft.edges = blueprint.edges;
        draft.projectName = blueprint.project;
        draft.selectedNodeId = null;
        draft.provisionStatus = 'idle';
        draft.provisionError = null;
      }),

    reset: () =>
      set((draft) => {
        draft.nodes = [];
        draft.edges = [];
        draft.projectName = 'MyProject';
        draft.selectedNodeId = null;
        draft.provisionStatus = 'idle';
        draft.provisionError = null;
      }),
  }))
);

// Auto-save to localStorage on every mutation
useBlueprintStore.subscribe((state) => {
  scheduleSave(state.toBlueprint());
});
