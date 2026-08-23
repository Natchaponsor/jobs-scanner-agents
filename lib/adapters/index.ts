import type { AdapterType } from "../types";
import type { Adapter } from "./types";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { workdayAdapter } from "./workday";
import { eightfoldAdapter } from "./eightfold";
import { ashbyAdapter } from "./ashby";
import { oracleFusionAdapter } from "./oracle-fusion";
import { smartRecruitersAdapter } from "./smartrecruiters";
import { htmlScrapeAdapter } from "./html";
import { amazonAdapter } from "./amazon";
import { shopeeAdapter } from "./shopee";
import { playwrightGenericAdapter } from "./playwright-generic";

export const ADAPTERS: Record<AdapterType, Adapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  workday: workdayAdapter,
  eightfold: eightfoldAdapter,
  ashby: ashbyAdapter,
  "oracle-fusion": oracleFusionAdapter,
  smartrecruiters: smartRecruitersAdapter,
  "html-scrape": htmlScrapeAdapter,
  "custom-amazon": amazonAdapter,
  "custom-shopee": shopeeAdapter,
  playwright: playwrightGenericAdapter,
  unimplemented: playwrightGenericAdapter,
};
