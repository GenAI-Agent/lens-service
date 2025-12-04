/**
 * Combined styles for Agent Panel
 */

import { panelStyles } from './panel';
import { chatStyles } from './chat';
import { fabStyles } from './fab';
import { formStyles } from './form';
import { promptStyles } from './prompt';

export const getAllStyles = (): string => {
  return `
    ${panelStyles}
    ${chatStyles}
    ${fabStyles}
    ${formStyles}
    ${promptStyles}
  `;
};

export { panelStyles, chatStyles, fabStyles, formStyles, promptStyles };
