import type { ChangedFileMetadata } from "./context";

export interface VcsProvider {
  listChangedFiles(): Promise<ChangedFileMetadata[]>;
  getPatchForFile(filename: string): Promise<string | null>;
}
