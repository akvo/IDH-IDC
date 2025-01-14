/**
 * This global state used to save the previous case value
 * to check later in the case data is updated or changed by the user
 *
 * Only updated after endpoint call
 */

import { Store } from "pullstate";

const PrevCaseState = new Store({});

export const resetPrevCaseState = () => {
  PrevCaseState.update(() => ({}));
};

export default PrevCaseState;
