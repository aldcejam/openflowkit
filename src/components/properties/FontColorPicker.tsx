import React, { useMemo, useRef, useState } from 'react';
import { PaintBucket } from 'lucide-react';
import { SwatchPicker, type SwatchPickerItem } from './SwatchPicker';
import { CustomColorPopover } from './CustomColorPopover';
import { DEFAULT_CUSTOM_COLOR, normalizeHex } from './colorPickerUtils';

interface FontColorPickerProps {
    selectedColor?: string;
    onChange: (color: string | undefined) => void;
}

export const FontColorPicker: React.FC<FontColorPickerProps> = ({
    selectedColor,
    onChange,
}) => {
    const [customEditorOpen, setCustomEditorOpen] = useState(false);
    const customTriggerRef = useRef<HTMLButtonElement | null>(null);

    const isPreset = !selectedColor || selectedColor === 'default' || selectedColor === '#ffffff' || selectedColor === '#1e293b';
    const customHex = !isPreset && selectedColor
        ? normalizeHex(selectedColor) || DEFAULT_CUSTOM_COLOR
        : DEFAULT_CUSTOM_COLOR;

    const swatchItems = useMemo<SwatchPickerItem[]>(() => [
        {
            id: 'default',
            label: 'Default',
            backgroundColor: 'transparent',
            accentColor: 'var(--brand-secondary)',
            preview: (
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-[var(--color-brand-border)] bg-[var(--brand-background)] text-[var(--brand-secondary)] font-semibold text-xs">
                    Auto
                </div>
            ),
        },
        {
            id: '#ffffff',
            label: 'White',
            backgroundColor: '#ffffff',
            accentColor: '#cbd5e1',
        },
        {
            id: '#1e293b',
            label: 'Dark',
            backgroundColor: '#1e293b',
            accentColor: '#334155',
        },
    ], []);

    function closeCustomEditor(): void {
        setCustomEditorOpen(false);
    }

    function handleSelect(color: string): void {
        closeCustomEditor();
        onChange(color === 'default' ? undefined : color);
    }

    function handleCustomClick(button?: HTMLButtonElement | null): void {
        customTriggerRef.current = button || customTriggerRef.current;
        setCustomEditorOpen(true);
        onChange(customHex);
    }

    const selectedId = selectedColor
        ? (['#ffffff', '#1e293b'].includes(selectedColor) ? selectedColor : 'custom')
        : 'default';

    return (
        <div className="space-y-3">
            <div className="relative">
                <SwatchPicker
                    items={[
                        ...swatchItems,
                        {
                            id: 'custom',
                            label: 'Custom',
                            backgroundColor: !isPreset && selectedColor ? selectedColor : '#ffffff',
                            accentColor: !isPreset && selectedColor ? selectedColor : '#94a3b8',
                            preview: (
                                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-[var(--color-brand-border)] bg-[var(--brand-background)] text-[var(--brand-secondary)]">
                                    <PaintBucket className="h-3 w-3" />
                                </div>
                            ),
                        },
                    ]}
                    selectedId={selectedId}
                    onSelect={(id, button) => {
                        if (id === 'custom') {
                            handleCustomClick(button);
                            return;
                        }
                        handleSelect(id);
                    }}
                    columns={4}
                    showCaption={true}
                    caption={
                        selectedId === 'default'
                            ? 'Default Color'
                            : selectedId === 'custom'
                                ? 'Custom Font Color'
                                : selectedId === '#ffffff'
                                    ? 'White Text'
                                    : 'Dark Text'
                    }
                />

                <CustomColorPopover
                    isOpen={customEditorOpen}
                    anchorRef={customTriggerRef}
                    currentColor={customHex}
                    onChange={(customColor) => {
                        onChange(customColor);
                    }}
                    onRequestClose={closeCustomEditor}
                    title="Custom Font Color"
                    closeLabel="Close font color picker"
                    hueAriaLabel="Hue"
                    fieldAriaLabel="Custom font color field"
                />
            </div>
        </div>
    );
};
