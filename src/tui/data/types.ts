export type NodeKind =
  | 'serverRoot' | 'serverFolder' | 'serverService' | 'serverLayer' | 'serverTable' | 'serverOperation'
  | 'portalRoot' | 'portalUsers' | 'portalUser' | 'portalGroups' | 'portalGroup' | 'portalItems' | 'portalItem' | 'portalOperation';

export type Node = {
  id: string;            // stable, usually the URL
  kind: NodeKind;
  name: string;          // label for row
  url: string;           // canonical REST URL
  meta?: Record<string, unknown>;
  childrenKind?: NodeKind;
  children?: string[];   // child node ids
  childrenLoaded?: boolean;
  childrenCount?: number;
  error?: { message: string; code?: number };
};

export type ColumnState = {
  parentId: string | null;
  nodes: string[];
  selectedIndex: number;
  filter: string;
  loading: boolean;
  error?: string;
};

export type MillerState = {
  scope: 'server' | 'portal';
  activeColumn: number;         // 0..2
  columns: ColumnState[];       // length 2 or 3 depending on visible depth
  path: string[];               // node ids from root → selection
  inspectorVisible: boolean;
};

export type NoticeLevel = 'info' | 'success' | 'warn' | 'error';
export type Notice = { id: string; level: NoticeLevel; text: string; ts: number };