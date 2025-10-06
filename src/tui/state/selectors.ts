import { useEntitiesStore } from './entities';
import { useNavigationStore } from './navigation';
import { useUiStore } from './ui';

// Breadcrumb selector
export const selectBreadcrumb = () => {
  const path = useNavigationStore((state) => state.path);
  const getNode = useEntitiesStore((state) => state.getNode);
  
  return path.map(id => {
    const node = getNode(id);
    return node?.name || id;
  });
};

// Active column selector
export const selectActiveColumn = () => {
  const activeColumn = useNavigationStore((state) => state.activeColumn);
  const columns = useNavigationStore((state) => state.columns);
  return columns[activeColumn];
};

// Visible columns selector
export const selectVisibleColumns = () => {
  return useNavigationStore((state) => state.columns);
};

// Notice count selector
export const selectNoticeCount = () => {
  return useUiStore((state) => state.notices.length);
};

// Active overlay selector
export const selectActiveOverlay = () => {
  const overlays = useUiStore((state) => state.overlays);
  return Object.entries(overlays).find(([, active]) => active)?.[0] || null;
};

// Current theme selector
export const selectCurrentTheme = () => {
  return useUiStore((state) => state.theme.scheme);
};

// Scope selector
export const selectScope = () => {
  return useNavigationStore((state) => state.scope);
};

// Inspector visibility selector
export const selectInspectorVisible = () => {
  return useNavigationStore((state) => state.inspectorVisible);
};

// Selected node selector
export const selectSelectedNode = () => {
  const activeColumn = useNavigationStore((state) => state.activeColumn);
  const columns = useNavigationStore((state) => state.columns);
  const getNode = useEntitiesStore((state) => state.getNode);
  
  const column = columns[activeColumn];
  if (!column) return null;
  
  const nodeId = column.nodes[column.selectedIndex];
  return getNode(nodeId) || null;
};