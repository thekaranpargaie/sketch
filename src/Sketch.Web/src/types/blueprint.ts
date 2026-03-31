export type FieldType = 'Guid' | 'string' | 'int' | 'decimal' | 'bool' | 'DateTime' | 'enum';
export type NodeType = 'entity' | 'protocol' | 'storage' | 'identity';
export type ProtocolStyle = 'REST' | 'gRPC' | 'GraphQL';
export type AuthType = 'JWT' | 'None';
export type StorageEngine = 'SqlServer' | 'PostgreSQL' | 'Redis';
export type EdgeAction = 'GenerateCRUD' | 'GeneratePersistence';
export type ProvisionStatus = 'idle' | 'provisioning' | 'success' | 'error';

export interface FieldDefinition {
  name: string;
  type: FieldType;
}

export interface NodeData {
  name: string;
  fields?: FieldDefinition[];       // entity / identity only
  style?: ProtocolStyle;            // protocol only
  auth?: AuthType;                  // protocol only
  engine?: StorageEngine;           // storage only
}

export interface BlueprintNode {
  id: string;
  type: NodeType;
  data: NodeData;
  position: { x: number; y: number };
}

export interface BlueprintEdge {
  id: string;
  source: string;
  target: string;
  action: EdgeAction;
}

export interface Blueprint {
  version: '1.0';
  project: string;
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
}
