import React, { useCallback } from 'react';
import { useReactFlow } from '@/lib/reactflowCompat';
import type { EdgeData, FlowEdge } from '@/lib/types';

interface EdgeRoutingHandlesProps {
    edgeId: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    data?: EdgeData;
    color?: string;
}

export function EdgeRoutingHandles({
    edgeId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    color = '#3b82f6',
}: EdgeRoutingHandlesProps): React.ReactElement | null {
    const { setEdges, screenToFlowPosition } = useReactFlow();

    const waypoints = data?.waypoints ?? (data?.waypoint ? [data.waypoint] : []);

    const updateWaypoints = useCallback(
        (newWaypoints: { x: number; y: number }[]) => {
            setEdges((edges) =>
                edges.map((e) => {
                    const edge = e as FlowEdge;
                    if (edge.id === edgeId) {
                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                waypoints: newWaypoints,
                                routingMode: 'manual',
                                waypoint: undefined, // Clear legacy waypoint format
                            },
                        };
                    }
                    return edge;
                })
            );
        },
        [edgeId, setEdges]
    );

    const onPointerDownWaypoint = (event: React.PointerEvent, index: number) => {
        event.stopPropagation();
        event.preventDefault();

        const onPointerMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            const flowPos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
            const newWaypoints = [...waypoints];
            newWaypoints[index] = flowPos;
            updateWaypoints(newWaypoints);
        };

        const onPointerUp = (upEvent: PointerEvent) => {
            upEvent.preventDefault();
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    const onDoubleClickWaypoint = (event: React.MouseEvent, index: number) => {
        event.stopPropagation();
        event.preventDefault();
        const newWaypoints = [...waypoints];
        newWaypoints.splice(index, 1);
        updateWaypoints(newWaypoints);
    };

    const onPointerDownGhost = (event: React.PointerEvent, insertIndex: number) => {
        event.stopPropagation();
        event.preventDefault();

        const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const newWaypoints = [...waypoints];
        newWaypoints.splice(insertIndex, 0, flowPos);
        updateWaypoints(newWaypoints);

        // Immediately start dragging the newly created waypoint
        const onPointerMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            const newFlowPos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
            
            setEdges((edges) =>
                edges.map((e) => {
                    const edge = e as FlowEdge;
                    if (edge.id === edgeId) {
                        const updatedWaypoints = [...(edge.data?.waypoints || [])];
                        updatedWaypoints[insertIndex] = newFlowPos;
                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                waypoints: updatedWaypoints,
                            },
                        };
                    }
                    return edge;
                })
            );
        };

        const onPointerUp = (upEvent: PointerEvent) => {
            upEvent.preventDefault();
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    const pathPoints = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
    const ghosts = [];

    for (let i = 0; i < pathPoints.length - 1; i++) {
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1];
        ghosts.push({
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
            insertIndex: i,
        });
    }

    return (
        <g className="edge-routing-handles z-50">
            {/* Render Ghosts */}
            {ghosts.map((ghost, i) => (
                <circle
                    key={`ghost-${i}`}
                    cx={ghost.x}
                    cy={ghost.y}
                    r={5}
                    fill={color}
                    opacity={0.3}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    onPointerDown={(e) => onPointerDownGhost(e, ghost.insertIndex)}
                    pointerEvents="all"
                />
            ))}

            {/* Render Actual Waypoints */}
            {waypoints.map((wp, i) => (
                <circle
                    key={`wp-${i}`}
                    cx={wp.x}
                    cy={wp.y}
                    r={6}
                    fill="#ffffff"
                    stroke={color}
                    strokeWidth={2}
                    className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                    onPointerDown={(e) => onPointerDownWaypoint(e, i)}
                    onDoubleClick={(e) => onDoubleClickWaypoint(e, i)}
                    pointerEvents="all"
                />
            ))}
        </g>
    );
}
