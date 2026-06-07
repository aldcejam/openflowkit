import React from 'react';
import { Handle, Position } from '@/lib/reactflowCompat';
import {
  getConnectorHandleStyle,
  getHandlePointerEvents,
  getV2HandleVisibilityClass,
} from '@/components/handleInteraction';
import { useViewSettings } from '@/store/viewHooks';

interface StructuredNodeHandlesProps {
  isActiveSelected: boolean;
}

const HANDLE_POSITIONS = [
  { id: 'top', position: Position.Top },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
  { id: 'right', position: Position.Right },
] as const;

export function StructuredNodeHandles({
  isActiveSelected,
}: StructuredNodeHandlesProps): React.ReactElement | null {
  const { presentationMode } = useViewSettings();
  
  if (presentationMode) {
    return null;
  }

  const handlePointerEvents = getHandlePointerEvents(true, isActiveSelected);
  const handleVisibilityClass = getV2HandleVisibilityClass(isActiveSelected);

  return (
    <>
      {HANDLE_POSITIONS.map(({ id, position }) => (
        <Handle
          key={id}
          type="source"
          position={position}
          id={id}
          isConnectableStart
          isConnectableEnd
          className={`!w-3 !h-3 !border-2 !border-white transition-all duration-150 hover:scale-125 ${handleVisibilityClass}`}
          style={getConnectorHandleStyle(id, isActiveSelected, handlePointerEvents)}
        />
      ))}
    </>
  );
}
