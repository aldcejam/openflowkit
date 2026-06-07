import { DEFAULT_AI_SETTINGS } from '@/store';
import { captureAnalyticsEvent } from '@/services/analytics/analytics';
import { sanitizeAISettings } from '@/store/aiSettings';
import { clearPersistedAISettings, loadPersistedAISettings } from '@/store/aiSettingsPersistence';
import { sanitizePersistedTab } from '@/store/persistence';
import { syncWorkspaceDocuments } from '@/store/documentStateSync';
import { getEditorPagesForDocument } from '@/store/workspaceDocumentModel';
import type { FlowStoreState } from '@/store';
import { useFlowStore } from '@/store';
import { createPersistedDocumentsFromTabs, createPersistedDocumentsFromFlowDocuments } from './persistedDocumentAdapters';
import {
  createLoadedFlowWorkspace,
  localFirstRepository,
  type PersistedChatMessage,
} from './localFirstRepository';
import {
  parseLegacyChatMessagesJson,
  parsePersistentAISettingsJson,
} from './storageSchemas';

const STORE_SUBSCRIPTION_DEBOUNCE_MS = 250;

type StoreWithPersist = typeof useFlowStore & {
  persist?: {
    hasHydrated: () => boolean;
    rehydrate: () => Promise<void>;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

async function waitForStoreHydration(): Promise<void> {
  const persistedStore = useFlowStore as StoreWithPersist;
  const persistApi = persistedStore.persist;

  if (!persistApi) {
    return;
  }

  await persistApi.rehydrate();
  if (persistApi.hasHydrated()) {
    return;
  }

  await new Promise<void>((resolve) => {
    const unsubscribe = persistApi.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

function buildChatMessageId(documentId: string, index: number): string {
  return `${documentId}:${index}`;
}

function toPersistedChatMessages(documentId: string, serialized: string | null): PersistedChatMessage[] {
  const parsed = parseLegacyChatMessagesJson(serialized);
  if (parsed.length === 0) {
    return [];
  }

  const startedAt = Date.now();
  return parsed.map((message, index) => ({
    id: buildChatMessageId(documentId, index),
    documentId,
    role: message.role,
    parts: message.parts,
    createdAt: new Date(startedAt + index).toISOString(),
  }));
}

async function migrateLegacyStoreIntoRepositoryIfNeeded(): Promise<void> {
  const currentState = useFlowStore.getState();
  const loaded = await localFirstRepository.loadWorkspaceSnapshot();
  if (loaded.documents.length > 0) {
    return;
  }

  const tabs = currentState.tabs.map(sanitizePersistedTab);
  if (tabs.length === 0) {
    return;
  }

  await localFirstRepository.saveDocuments(
    createPersistedDocumentsFromTabs(tabs),
    currentState.activeTabId,
  );

  await Promise.all(
    tabs.map(async (tab) => {
      const legacyChatRaw = localStorage.getItem(`ofk_chat_history_${tab.id}`);
      const persistedMessages = toPersistedChatMessages(tab.id, legacyChatRaw);
      if (persistedMessages.length > 0) {
        await localFirstRepository.replaceChatThread(tab.id, persistedMessages);
      }
    })
  );

  const persistedAiSettings = loadPersistedAISettings();
  if (persistedAiSettings.storageMode === 'local') {
    await localFirstRepository.savePersistentAISettings(JSON.stringify(persistedAiSettings));
    clearPersistedAISettings();
  }
}

async function hydrateStoreFromRepository(): Promise<void> {
  let loaded = await localFirstRepository.loadWorkspaceSnapshot();
  
  try {
    const keyToLoad = 'workspace';
    const res = await fetch(`/api/load?key=${keyToLoad}`);
    const json = await res.json();
    if (json.success && json.data) {
      let apiDocuments: typeof loaded.documents | null = null;
      let apiActiveDocumentId: string | null = null;

      if (Array.isArray(json.data)) {
        // Fallback for older simple array format
        apiDocuments = json.data;
      } else if (json.data.documents && Array.isArray(json.data.documents)) {
        // New structure containing both documents and activeDocumentId
        apiDocuments = json.data.documents;
        apiActiveDocumentId = json.data.activeDocumentId || null;
      }

      if (apiDocuments && apiDocuments.length > 0) {
        const resolvedActiveId = apiActiveDocumentId || loaded.workspaceMeta.activeDocumentId || apiDocuments[0]?.id || null;
        const activeDoc = apiDocuments.find((d: { id: string }) => d.id === resolvedActiveId) || apiDocuments[0] || null;

        loaded = {
          document: activeDoc,
          documents: apiDocuments,
          workspaceMeta: {
            ...loaded.workspaceMeta,
            activeDocumentId: resolvedActiveId,
            documentOrder: apiDocuments.map((d: { id: string }) => d.id),
          }
        };

        // Proactively save to local IndexedDB to keep the local repository in sync
        await localFirstRepository.saveDocuments(
          loaded.documents,
          loaded.workspaceMeta.activeDocumentId
        );
      }
    }
  } catch (err) {
    console.warn('Failed to load from file system backend, using local storage fallback.', err);
  }

  const workspace = createLoadedFlowWorkspace(loaded);
  const activeDocument = getEditorPagesForDocument(workspace.documents, workspace.activeDocumentId);

  const persistentAiSettings = await localFirstRepository.loadPersistentAISettings();
  const parsedPersistentAiSettings = parsePersistentAISettingsJson(
    persistentAiSettings
  ) as Partial<FlowStoreState['aiSettings']> | undefined;
  const aiSettings = parsedPersistentAiSettings
    ? sanitizeAISettings(parsedPersistentAiSettings, DEFAULT_AI_SETTINGS)
    : loadPersistedAISettings();

  useFlowStore.setState((currentState) => ({
    ...currentState,
    documents: workspace.documents,
    activeDocumentId: activeDocument?.activeDocumentId ?? workspace.activeDocumentId ?? '',
    tabs: activeDocument?.pages ?? [],
    activeTabId: activeDocument?.activePageId ?? '',
    nodes: activeDocument ? (activeDocument.pages.find((page) => page.id === activeDocument.activePageId)?.nodes ?? []) : [],
    edges: activeDocument ? (activeDocument.pages.find((page) => page.id === activeDocument.activePageId)?.edges ?? []) : [],
    aiSettings,
  }));

  captureAnalyticsEvent('workspace_restored', {
    document_count: workspace.documents.length,
    has_active_document: Boolean(activeDocument),
  });
}

function persistStoreSnapshot(): void {
  const nextState = useFlowStore.getState();
  const documents = syncWorkspaceDocuments({
    documents: nextState.documents,
    activeDocumentId: nextState.activeDocumentId,
    tabs: nextState.tabs.map(sanitizePersistedTab),
    activeTabId: nextState.activeTabId,
    nodes: nextState.nodes,
    edges: nextState.edges,
  });

  void localFirstRepository.saveFlowDocuments(
    documents,
    nextState.activeDocumentId,
  );

  if (nextState.aiSettings.storageMode === 'local') {
    void localFirstRepository.savePersistentAISettings(JSON.stringify(nextState.aiSettings));
  }
}

export async function forceSyncFromServer(): Promise<void> {
  try {
    const res = await fetch(`/api/load?key=workspace`);
    const json = await res.json();
    if (json.success && json.data && Array.isArray(json.data.documents)) {
      const apiDocs = json.data.documents;
      if (apiDocs.length > 0) {
        let resolvedActiveId = json.data.activeDocumentId;
        const activeDoc = apiDocs.find((d: { id: string }) => d.id === resolvedActiveId) ?? apiDocs[0] ?? null;
        if (activeDoc) {
          resolvedActiveId = activeDoc.id;
        }

        const loaded = {
          document: activeDoc,
          documents: apiDocs,
          workspaceMeta: {
            id: 'workspace' as const,
            activeDocumentId: resolvedActiveId,
            documentOrder: apiDocs.map((d: { id: string }) => d.id),
            lastOpenedAt: new Date().toISOString()
          }
        };

        const workspace = createLoadedFlowWorkspace(loaded);
        
        useFlowStore.setState((currentState) => ({
          ...currentState,
          documents: workspace.documents,
          activeDocumentId: workspace.activeDocumentId,
        }));
        
        console.log('[forceSyncFromServer] Synced', workspace.documents.length, 'documents from server');
      }
    }
  } catch (err) {
    console.error('Failed to force sync', err);
  }
}

export function persistToFileSystem(): void {
  const nextState = useFlowStore.getState();
  const documents = syncWorkspaceDocuments({
    documents: nextState.documents,
    activeDocumentId: nextState.activeDocumentId,
    tabs: nextState.tabs.map(sanitizePersistedTab),
    activeTabId: nextState.activeTabId,
    nodes: nextState.nodes,
    edges: nextState.edges,
  });

  const persistedDocuments = createPersistedDocumentsFromFlowDocuments(documents);

  const key = 'workspace';
  const payload = {
    documents: persistedDocuments,
    activeDocumentId: nextState.activeDocumentId,
  };

  console.log('[persistToFileSystem] Sending payload with', persistedDocuments.length, 'documents');
  console.log('[persistToFileSystem] Document names:', persistedDocuments.map(d => d.name));

  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, data: payload }),
    keepalive: true,
  }).catch((err) => {
    console.error('Failed to save to file system', err);
  });
}

let syncStopper: (() => void) | null = null;
let initializationPromise: Promise<void> | null = null;

export async function initializeLocalFirstPersistence(): Promise<void> {
  await waitForStoreHydration();
  await migrateLegacyStoreIntoRepositoryIfNeeded();
  await hydrateStoreFromRepository();

  if (syncStopper) {
    return;
  }

  let hasPendingChanges = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let fileSystemTimer: ReturnType<typeof setTimeout> | null = null;

  window.addEventListener('beforeunload', () => {
    if (hasPendingChanges) {
      persistToFileSystem();
    }
  });

  syncStopper = useFlowStore.subscribe((state, previousState) => {
    const documentsChanged = state.documents !== previousState.documents;
    const tabsChanged = state.tabs !== previousState.tabs;
    const activeDocumentChanged = state.activeDocumentId !== previousState.activeDocumentId;
    const activePageChanged = state.activeTabId !== previousState.activeTabId;
    const aiSettingsChanged = state.aiSettings !== previousState.aiSettings;

    if (!documentsChanged && !tabsChanged && !activeDocumentChanged && !activePageChanged && !aiSettingsChanged) {
      return;
    }

    hasPendingChanges = true;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    if (fileSystemTimer) {
      clearTimeout(fileSystemTimer);
    }

    debounceTimer = setTimeout(() => {
      persistStoreSnapshot();
    }, STORE_SUBSCRIPTION_DEBOUNCE_MS);

    fileSystemTimer = setTimeout(() => {
      persistToFileSystem();
      hasPendingChanges = false;
      fileSystemTimer = null;
    }, 3000);
  });
}

export function ensureLocalFirstPersistenceReady(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeLocalFirstPersistence().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}
