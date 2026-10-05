import React, { useCallback, useEffect, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

export default function CanvasEditor({ note, onSave }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  // Parse saved canvas data
  const initialData = (() => {
    try {
      if (note?.content && note.content.startsWith('{')) {
        return JSON.parse(note.content);
      }
    } catch {}
    return { elements: [], appState: { viewBackgroundColor: '#ffffff' } };
  })();

  const handleChange = useCallback((elements, appState) => {
    // debounce auto-save
  }, []);

  const handleSave = useCallback(() => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const data = JSON.stringify({
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      },
    });
    onSave(data);
  }, [excalidrawAPI, onSave]);

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(handleSave, 30000);
    return () => clearInterval(interval);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-full">
      {/* Save button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Canvas • Draw, write, connect anything</span>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Save
        </button>
      </div>

      {/* Excalidraw Canvas */}
      <div className="flex-1 relative">
        <Excalidraw
          ref={(api) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={handleChange}
          UIOptions={{
            canvasActions: {
              export: { saveFileToDisk: true },
              loadScene: true,
              clearCanvas: true,
            },
          }}
        />
      </div>
    </div>
  );
}