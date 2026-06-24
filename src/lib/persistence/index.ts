/**
 * Persistence module — public API.
 *
 * Re-exports the port contract, adapter factory, selector, and adapter config.
 * Callers import from `@/lib/persistence` and remain adapter-agnostic.
 */

export type {
  PersistenceAdapter,
  ProfileSaveResult,
  PersistenceResult,
  MaybePromise,
  ProfilesState,
  StudentProfile,
  PracticeProgress,
  DiagnosticResult,
  StudyPlan,
} from "./port";

export { isPersistenceAdapter } from "./port";
export { createLocalStorageAdapter } from "./local-adapter";
export type { LocalStorageOperations } from "./local-adapter";
export { selectPersistenceAdapter, withLocalFallback, createRemoteUnavailableSentinel } from "./selector";
export type { SelectorConfig, SupabaseEnvConfig } from "./selector";
export { createSupabaseAdapter } from "./supabase-adapter";
export { configurePersistenceAdapter, getConfiguredAdapter, resetPersistenceAdapter, initializePersistence, getInitializationPromise, loadProgressWhenReady } from "./adapter-config";
export type { ConfiguredAdapter } from "./adapter-config";
