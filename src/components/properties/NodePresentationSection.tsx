import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Maximize2 } from 'lucide-react';
import { Node } from '@/lib/reactflowCompat';
import { NodeData } from '@/lib/types';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { PresentationEditorModal } from '../PresentationEditorModal';
import { useMarkdownEditor } from '@/hooks/useMarkdownEditor';

interface NodePresentationSectionProps {
  selectedNode: Node<NodeData>;
  onChange: (id: string, data: Partial<NodeData>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function NodePresentationSection({
  selectedNode,
  onChange,
  isOpen,
  onToggle,
}: NodePresentationSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const presentationInputRef = useRef<HTMLTextAreaElement>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  const presentationEditor = useMarkdownEditor(
    presentationInputRef,
    (val) => onChange(selectedNode.id, { presentationDetails: val }),
    selectedNode.data?.presentationDetails || ''
  );

  function handleStyleAction(action: 'bold' | 'italic'): void {
    if (action === 'bold') presentationEditor.insert('**', '**');
    else presentationEditor.insert('_', '_');
  }

  return (
    <>
      <CollapsibleSection
        title={t('properties.presentation', 'Detalhes de Exibição')}
        icon={<Star className="w-3.5 h-3.5" />}
        isOpen={isOpen}
        onToggle={onToggle}
      >
        <div className="space-y-3">
          <div className="text-[11px] font-medium text-[var(--brand-secondary)] uppercase tracking-wider mb-2">
            Descrição na Exibição
          </div>
          <div className="relative group">
            <textarea
              ref={presentationInputRef}
              value={selectedNode.data?.presentationDetails || ''}
              onChange={(e) => {
                onChange(selectedNode.id, { presentationDetails: e.target.value });
              }}
              onKeyDown={presentationEditor.handleKeyDown}
              className="w-full resize-none rounded-[var(--brand-radius)] border border-[var(--color-brand-border)] bg-[var(--brand-surface)] p-2.5 text-[13px] text-[var(--brand-text)] shadow-sm placeholder:text-[var(--color-brand-border)] focus:border-[var(--brand-primary,#1e3a8a)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary,#1e3a8a)]"
              placeholder="Descreva este componente para o modo de exibição (suporta Markdown)"
              rows={4}
            />
            <div className="absolute right-2 bottom-2 hidden group-focus-within:flex items-center gap-1 bg-[var(--brand-surface)]/80 p-1 rounded backdrop-blur-sm">
              <button
                type="button"
                onClick={() => handleStyleAction('bold')}
                className="p-1 rounded text-[var(--brand-secondary)] hover:bg-[var(--brand-background)] hover:text-[var(--brand-text)]"
                title="Bold (Ctrl+B)"
              >
                <div className="font-bold font-serif w-3.5 h-3.5 flex items-center justify-center text-xs">B</div>
              </button>
              <button
                type="button"
                onClick={() => handleStyleAction('italic')}
                className="p-1 rounded text-[var(--brand-secondary)] hover:bg-[var(--brand-background)] hover:text-[var(--brand-text)]"
                title="Italic (Ctrl+I)"
              >
                <div className="italic font-serif w-3.5 h-3.5 flex items-center justify-center text-xs">I</div>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditorModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--brand-radius)] border border-[var(--color-brand-border)] bg-[var(--brand-background)] py-2 text-[12px] font-medium text-[var(--brand-secondary)] hover:bg-[var(--brand-surface)] hover:text-[var(--brand-text)] transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Abrir Editor Avançado
          </button>
        </div>
      </CollapsibleSection>

      <PresentationEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        initialContent={selectedNode.data?.presentationDetails || ''}
        onSave={(content) => onChange(selectedNode.id, { presentationDetails: content })}
      />
    </>
  );
}
