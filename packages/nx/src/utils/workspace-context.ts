import type { NxWorkspaceFilesExternals, WorkspaceContext } from '../native';
import { performance } from 'perf_hooks';
import { ProjectRootMappings } from '../project-graph/utils/find-project-for-path';

let workspaceContext: WorkspaceContext | undefined;

export function setupWorkspaceContext(workspaceRoot: string) {
  const { WorkspaceContext } =
    require('../native') as typeof import('../native');
  performance.mark('workspace-context');
  workspaceContext = new WorkspaceContext(workspaceRoot);
  performance.mark('workspace-context:end');
  performance.measure(
    'workspace context init',
    'workspace-context',
    'workspace-context:end'
  );
}

export function getNxWorkspaceFilesFromContext(
  workspaceRoot: string,
  globs: string[],
  parseConfigurations: (files: string[]) => Promise<Record<string, string>>
) {
  ensureContextAvailable(workspaceRoot);
  return workspaceContext.getWorkspaceFiles(globs, parseConfigurations);
}

export function globWithWorkspaceContext(
  workspaceRoot: string,
  globs: string[],
  exclude?: string[]
) {
  ensureContextAvailable(workspaceRoot);
  return workspaceContext.glob(globs, exclude);
}

export function hashWithWorkspaceContext(
  workspaceRoot: string,
  globs: string[],
  exclude?: string[]
) {
  ensureContextAvailable(workspaceRoot);
  return workspaceContext.hashFilesMatchingGlob(globs, exclude);
}

export function getProjectConfigurationsFromContext(
  workspaceRoot: string,
  globs: string[],
  parseConfigurations: (files: string[]) => Promise<Record<string, string>>
) {
  ensureContextAvailable(workspaceRoot);
  return workspaceContext.getProjectConfigurations(globs, parseConfigurations);
}

export function updateFilesInContext(
  updatedFiles: string[],
  deletedFiles: string[]
) {
  return workspaceContext?.incrementalUpdate(updatedFiles, deletedFiles);
}

export function getAllFileDataInContext(workspaceRoot: string) {
  ensureContextAvailable(workspaceRoot);
  return workspaceContext.allFileData();
}

export function updateProjectFiles(
  projectRootMappings: Record<string, string>,
  rustReferences: NxWorkspaceFilesExternals,
  updatedFiles: Record<string, string>,
  deletedFiles: string[]
) {
  return workspaceContext?.updateProjectFiles(
    projectRootMappings,
    rustReferences.projectFiles,
    rustReferences.globalFiles,
    updatedFiles,
    deletedFiles
  );
}

function ensureContextAvailable(workspaceRoot: string) {
  if (!workspaceContext || workspaceContext?.workspaceRoot !== workspaceRoot) {
    setupWorkspaceContext(workspaceRoot);
  }
}

export function resetWorkspaceContext() {
  workspaceContext = undefined;
}
