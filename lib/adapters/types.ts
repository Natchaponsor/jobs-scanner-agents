import type { ScanSource } from "../types";
import type { RawJob } from "../extract";

export interface Adapter {
  fetch(source: ScanSource, query: { function: string }): Promise<RawJob[]>;
}
