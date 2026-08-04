import type { AdapterType } from "../types";
import type { Adapter } from "./types";
import { greenhouseAdapter } from "./greenhouse";
import { workdayAdapter } from "./workday";
import { eightfoldAdapter } from "./eightfold";
import { ashbyAdapter } from "./ashby";
import { oracleFusionAdapter } from "./oracle-fusion";
import { htmlScrapeAdapter } from "./html";
import { amazonAdapter } from "./amazon";
import { playwrightGenericAdapter } from "./playwright-generic";

export const ADAPTERS: Record<AdapterType, Adapter> = {
  greenhouse: greenhouseAdapter,
  workday: workdayAdapter,
  eightfold: eightfoldAdapter,
  ashby: ashbyAdapter,
  "oracle-fusion": oracleFusionAdapter,
  "html-scrape": htmlScrapeAdapter,
  "custom-amazon": amazonAdapter,
  playwright: playwrightGenericAdapter,
  unimplemented: playwrightGenericAdapter,
};
