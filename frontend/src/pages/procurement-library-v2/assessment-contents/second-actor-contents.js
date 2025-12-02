import { PRIMARY_PAIR } from "./primary-pair-second-actor-content";
import { TRADER_PAIR } from "./trader-pair-second-actor-content";
import { MANUFACTURER_PAIR } from "./manufacturer-pair-second-actor-content";
import { RETAILER_PAIR } from "./retailer-pair-second-actor-content";

export const SECOND_ACTOR_CONTENT = {
  ...PRIMARY_PAIR,
  ...TRADER_PAIR,
  ...MANUFACTURER_PAIR,
  ...RETAILER_PAIR,
};
