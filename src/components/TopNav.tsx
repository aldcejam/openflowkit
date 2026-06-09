import React, { Suspense, lazy, useCallback, useEffect } from 'react';
import type { EditorPage } from '@/store/editorPageHooks';
import type { CinematicExportRequest } from '@/services/export/cinematicExport';
import { FlowTabs } from './FlowTabs';
import { TopNavMenu } from './top-nav/TopNavMenu';
import { TopNavActions } from './top-nav/TopNavActions';
import { useTopNavState } from './top-nav/useTopNavState';
import { IS_BEVELED } from '@/lib/brand';

const OPEN_AI_SETTINGS_EVENT = 'open-ai-settings';

const LazySettingsModal = lazy(async () => {
    const module = await import('./SettingsModal/SettingsModal');
    return { default: module.SettingsModal };
});

interface TopNavProps {
    pages: EditorPage[];
    activePageId: string;
    onSwitchPage: (pageId: string) => void;
    onAddPage: () => void;
    onClosePage: (pageId: string) => void;
    onRenamePage: (pageId: string, newName: string) => void;
    onReorderPage: (draggedPageId: string, targetPageId: string) => void;

    // Actions
    onExportPNG: (format?: 'png' | 'jpeg', options?: { transparentBackground?: boolean }) => void;
    onCopyImage: (format?: 'png' | 'jpeg', options?: { transparentBackground?: boolean }) => void;
    onExportSVG: () => void;
    onCopySVG: () => void;
    onExportPDF: () => void;
    onExportCinematic: (request: CinematicExportRequest) => void;
    onExportJSON: () => void;
    onCopyJSON: () => void;
    onExportMermaid: () => void;
    onDownloadMermaid: () => void;
    onDownloadPlantUML: () => void;
    onExportOpenFlowDSL: () => void;
    onDownloadOpenFlowDSL: () => void;
    onExportFigma: () => void;
    onDownloadFigma: () => void;
    onImportJSON: () => void;
    onHistory: () => void;
    onGoHome: () => void;
    onPlay: () => void;
    collaboration?: {
        roomId: string;
        inviteUrl: string;
        viewerCount: number;
        status: 'realtime' | 'waiting' | 'fallback';
        cacheState: 'unavailable' | 'syncing' | 'ready' | 'hydrated';
        participants: Array<{
            clientId: string;
            name: string;
            color: string;
            isLocal: boolean;
        }>;
        onCopyShareLink: () => void;
    };
}

export function TopNav({
    pages,
    activePageId,
    onSwitchPage,
    onAddPage,
    onClosePage,
    onRenamePage,
    onReorderPage,
    onExportPNG,
    onCopyImage,
    onExportSVG,
    onCopySVG,
    onExportPDF,
    onExportCinematic,
    onExportJSON,
    onCopyJSON,
    onExportMermaid,
    onDownloadMermaid,
    onDownloadPlantUML,
    onExportOpenFlowDSL,
    onDownloadOpenFlowDSL,
    onExportFigma,
    onDownloadFigma,
    onImportJSON,
    onHistory,
    onGoHome,
    onPlay,
    collaboration,
}: TopNavProps): React.ReactElement {
    const isBeveled = IS_BEVELED;
    const {
        isMenuOpen,
        isSettingsOpen,
        activeSettingsTab,
        toggleMenu,
        closeMenu,
        openSettings,
        closeSettings,
    } = useTopNavState();
    const openCanvasSettings = useCallback(() => {
        openSettings('canvas');
    }, [openSettings]);
    const openAISettings = useCallback(() => {
        openSettings('ai');
    }, [openSettings]);

    useEffect(() => {
        window.addEventListener(OPEN_AI_SETTINGS_EVENT, openAISettings);
        return () => window.removeEventListener(OPEN_AI_SETTINGS_EVENT, openAISettings);
    }, [openAISettings]);

    return (
        <div className="absolute top-4 left-4 z-50 pointer-events-none">
            {/* Left: Menu Only */}
            <div className="flex items-center pointer-events-auto bg-[var(--brand-surface)]/90 backdrop-blur-md shadow-sm border border-[var(--color-brand-border)] rounded-[var(--radius-lg)] p-1">
                <TopNavMenu
                    isOpen={isMenuOpen}
                    isBeveled={isBeveled}
                    onToggle={toggleMenu}
                    onClose={closeMenu}
                    onGoHome={onGoHome}
                    onOpenSettings={openCanvasSettings}
                    onHistory={onHistory}
                    onImportJSON={onImportJSON}
                >
                    <div className="p-2 border-b border-[var(--color-brand-border)]">
                        <FlowTabs
                            pages={pages}
                            activePageId={activePageId}
                            onSwitchPage={onSwitchPage}
                            onAddPage={onAddPage}
                            onClosePage={onClosePage}
                            onRenamePage={onRenamePage}
                            onReorderPage={onReorderPage}
                        />
                    </div>
                    
                    <div className="p-2 border-b border-[var(--color-brand-border)]">
                        <TopNavActions
                            onPlay={onPlay}
                            onExportPNG={onExportPNG}
                            onCopyImage={onCopyImage}
                            onExportSVG={onExportSVG}
                            onCopySVG={onCopySVG}
                            onExportPDF={onExportPDF}
                            onExportCinematic={onExportCinematic}
                            onExportJSON={onExportJSON}
                            onCopyJSON={onCopyJSON}
                            onExportMermaid={onExportMermaid}
                            onDownloadMermaid={onDownloadMermaid}
                            onDownloadPlantUML={onDownloadPlantUML}
                            onExportOpenFlowDSL={onExportOpenFlowDSL}
                            onDownloadOpenFlowDSL={onDownloadOpenFlowDSL}
                            onExportFigma={onExportFigma}
                            onDownloadFigma={onDownloadFigma}
                            collaboration={collaboration}
                            isBeveled={isBeveled}
                        />
                    </div>
                </TopNavMenu>
            </div>

            {isSettingsOpen ? (
                <Suspense fallback={null}>
                    <LazySettingsModal
                        isOpen={isSettingsOpen}
                        onClose={closeSettings}
                        initialTab={activeSettingsTab}
                    />
                </Suspense>
            ) : null}
        </div>
    );
}
