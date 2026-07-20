import type React from 'react';

export interface BlogPlugin {
  id: string;
  name: string;
  description?: string;
  version?: string;

  /** Extend toolbar with custom buttons */
  extendToolbar?: () => React.ReactNode;

  /** Override or extend post editor actions */
  extendEditorActions?: () => React.ReactNode;

  /** Content lifecycle hooks */
  onPostRender?: (html: string) => string;
  onPostSave?: (content: { title: string; content: string }) => { title?: string; content?: string };
  onPostDisplay?: (content: { title: string; content: string }) => { title?: string; content?: string };
}

const registry = new Map<string, BlogPlugin>();

export function registerPlugin(plugin: BlogPlugin) {
  registry.set(plugin.id, plugin);
}

export function getPlugin(id: string): BlogPlugin | undefined {
  return registry.get(id);
}

export function getAllPlugins(): BlogPlugin[] {
  return Array.from(registry.values());
}

export function getPluginsForToolbar(): BlogPlugin[] {
  return getAllPlugins().filter(p => p.extendToolbar);
}

export function getPluginsForEditorActions(): BlogPlugin[] {
  return getAllPlugins().filter(p => p.extendEditorActions);
}
