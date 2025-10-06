/**
 * Notification hook for easy notification management
 */

import { useUiStore } from '../state/ui';
import type { NoticeLevel } from '../data/types';

export function useNotifications() {
  const { pushNotice, removeNotice, clearNotices } = useUiStore();

  const notify = (
    level: NoticeLevel,
    text: string,
    options?: { title?: string; timeout?: number }
  ) => {
    pushNotice({
      level,
      text,
    });
  };

  return {
    // Convenience methods
    success: (text: string) => notify('success', text),
    error: (text: string) => notify('error', text),
    warning: (text: string) => notify('warn', text),
    info: (text: string) => notify('info', text),
    
    // Generic notify method
    notify,
    
    // Management methods
    remove: removeNotice,
    clear: clearNotices,
  };
}