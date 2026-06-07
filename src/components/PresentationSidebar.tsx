import React from 'react';
import { Node } from '@/lib/reactflowCompat';
import { NodeData } from '@/lib/types';
import { SidebarBody, SidebarHeader, SidebarShell } from './SidebarShell';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MousePointerClick } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PresentationSidebarProps {
  selectedNode: Node<NodeData> | null;
  onClose: () => void;
}

export const PresentationSidebar: React.FC<PresentationSidebarProps> = ({
  selectedNode,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!selectedNode) {
    return null;
  }

  const title = selectedNode.data?.label || selectedNode.type || t('properties.presentation', 'Detalhes');
  const details = selectedNode.data?.presentationDetails;

  return (
    <SidebarShell>
      <SidebarHeader title={title} onClose={onClose} />
      <SidebarBody className="space-y-5">
        {details ? (
          <div className="prose prose-sm prose-invert max-w-none text-[var(--brand-text)]">
            <MarkdownRenderer content={details} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MousePointerClick className="w-10 h-10 text-[var(--brand-secondary)] mb-3 opacity-50" />
            <p className="text-sm font-medium text-[var(--brand-secondary)] mb-1">
              {t('presentationSidebar.noDetails', 'Nenhum detalhe configurado')}
            </p>
            <p className="text-xs text-[var(--brand-secondary)]">
              Este componente não possui detalhes de exibição configurados.
            </p>
          </div>
        )}
      </SidebarBody>
    </SidebarShell>
  );
};
