import type { Monaco } from "@monaco-editor/react";

export const LIVEMOCK_DARK_THEME = "livemock-dark";

/**
 * Define the shared dark Monaco theme so every editor in the dashboard (action
 * content, the mock-from-log body, …) uses the same navy surface as the rest of
 * the redesign, instead of Monaco's default `vs-dark`.
 */
export function defineLivemockDarkTheme(monaco: Monaco): void {
  monaco.editor.defineTheme(LIVEMOCK_DARK_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0b1220",
      "editorGutter.background": "#0b1220",
      "editorLineNumber.foreground": "#64748b",
      "editorLineNumber.activeForeground": "#94a3b8",
      "editor.lineHighlightBackground": "#16223a",
      "editorCursor.foreground": "#60a5fa",
      "editor.selectionBackground": "#3b82f655",
      "editorWidget.background": "#1e293b",
      "editorWidget.border": "#26364d",
      "minimap.background": "#0b1220",
      "scrollbarSlider.background": "#2a3b5280",
      "scrollbarSlider.hoverBackground": "#3b4f6b99",
      "scrollbarSlider.activeBackground": "#3b4f6bcc",
    },
  });
}
