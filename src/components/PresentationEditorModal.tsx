import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Save } from 'lucide-react';
import { BlockNoteView } from '@blocknote/mantine';
import { BlockNoteEditor, PartialBlock } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { Button } from './ui/Button';
import { useTheme } from '../context/ThemeContext';

interface PresentationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string) => void;
}

export function PresentationEditorModal({
  isOpen,
  onClose,
  initialContent,
  onSave,
}: PresentationEditorModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | 'loading'>('loading');

  // Initialize the editor with parsed markdown blocks
  useEffect(() => {
    if (isOpen) {
      const loadMarkdown = async () => {
        const editor = BlockNoteEditor.create();
        const blocks = await editor.tryParseMarkdownToBlocks(initialContent || '');
        setInitialBlocks(blocks);
      };
      loadMarkdown();
    } else {
      Promise.resolve().then(() => {
        setInitialBlocks('loading');
      });
    }
  }, [isOpen, initialContent]);

  const editor = useMemo(() => {
    if (initialBlocks === 'loading') return undefined;
    return BlockNoteEditor.create({ initialContent: initialBlocks });
  }, [initialBlocks]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (editor) {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      onSave(markdown);
    }
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[16px] border border-[var(--color-brand-border)] bg-[var(--brand-surface)] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-brand-border)] bg-[var(--brand-surface)] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--brand-text)]">
              {t('presentationEditor.title', 'Editor de Documentação do Componente')}
            </h2>
            <p className="text-sm text-[var(--brand-secondary)] mt-1">
              {t('presentationEditor.subtitle', 'Use a barra / para adicionar blocos como Tabelas, Código, e mais.')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--brand-secondary)] hover:bg-[var(--brand-background)] hover:text-[var(--brand-text)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--brand-background)] p-8">
          <div className="mx-auto max-w-3xl rounded-xl border border-[var(--color-brand-border)] bg-[var(--brand-surface)] p-8 shadow-sm min-h-[500px]">
            {editor === undefined ? (
              <div className="flex h-full items-center justify-center text-[var(--brand-secondary)]">
                Carregando editor...
              </div>
            ) : (
              <BlockNoteView editor={editor} theme={resolvedTheme} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--color-brand-border)] bg-[var(--brand-surface)] px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            {t('common.save', 'Salvar Alterações')}
          </Button>
        </div>
        
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
