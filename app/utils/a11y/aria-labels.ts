/**
 * ARIA Label Utilities and Constants
 * Provides comprehensive ARIA labeling utilities for semantic HTML and accessibility
 * WCAG 2.1 Level AAA compliant
 */

/**
 * Standard ARIA label constants for common UI patterns
 */
export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: 'Main navigation',
  SIDEBAR_NAVIGATION: 'Sidebar navigation',
  SKIP_TO_MAIN: 'Skip to main content',
  BREADCRUMB: 'Breadcrumb navigation',

  // Forms
  REQUIRED_FIELD: 'This field is required',
  OPTIONAL_FIELD: 'This field is optional',
  FORM_ERROR: 'Form submission error',
  FORM_SUCCESS: 'Form submitted successfully',
  PASSWORD_VISIBILITY_TOGGLE: 'Toggle password visibility',

  // Modals & Dialogs
  CLOSE_DIALOG: 'Close dialog',
  CLOSE_MODAL: 'Close modal window',
  DIALOG_OVERLAY: 'Modal backdrop',

  // Tables
  SORTABLE_COLUMN: 'Sortable column header',
  SORT_ASCENDING: 'Sort ascending',
  SORT_DESCENDING: 'Sort descending',

  // Buttons
  EXPAND: 'Expand',
  COLLAPSE: 'Collapse',
  MORE_OPTIONS: 'More options',
  MENU: 'Menu',

  // Search & Filters
  SEARCH_INPUT: 'Search input',
  APPLY_FILTERS: 'Apply filters',
  CLEAR_FILTERS: 'Clear all filters',

  // Loading & States
  LOADING: 'Loading',
  LOADING_SPINNER: 'Loading in progress',
  ERROR_ALERT: 'Error notification',
  SUCCESS_ALERT: 'Success notification',
  WARNING_ALERT: 'Warning notification',
  INFO_ALERT: 'Information notification',

  // Authentication
  LOGIN_FORM: 'Login form',
  REGISTER_FORM: 'Registration form',
  FORGOT_PASSWORD_FORM: 'Forgot password form',

  // Pagination
  PREVIOUS_PAGE: 'Previous page',
  NEXT_PAGE: 'Next page',
  PAGE_INDICATOR: 'Current page',

  // Accessibility
  SKIP_LINKS: 'Skip navigation links',
  LANGUAGE_SELECTOR: 'Language selector',
  THEME_TOGGLE: 'Toggle dark/light theme',
  ACCESSIBILITY_SETTINGS: 'Accessibility settings',
} as const;

/**
 * ARIA role constants for semantic HTML enhancement
 */
export const ARIA_ROLES = {
  MAIN: 'main',
  NAVIGATION: 'navigation',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  BANNER: 'banner',
  REGION: 'region',
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  RADIOGROUP: 'radiogroup',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  PROGRESSBAR: 'progressbar',
  SEARCHBOX: 'searchbox',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  STATUS: 'status',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TOOLBAR: 'toolbar',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEGRID: 'treegrid',
  TREEITEM: 'treeitem',
  DIALOG: 'dialog',
  DOCUMENT: 'document',
  PRESENTATION: 'presentation',
  NONE: 'none',
} as const;

/**
 * Generate an accessible label for interactive elements
 * @param labelText - The visible or hidden label text
 * @param isVisible - Whether the label should be visible
 * @returns ARIA label object
 */
export function createAriaLabel(labelText: string, isVisible = true) {
  return {
    'aria-label': labelText,
    ...(isVisible && { role: 'label' }),
  };
}

/**
 * Create ARIA attributes for described-by relationships
 * @param describedById - ID of element containing description
 * @returns ARIA attributes object
 */
export function createAriaDescribedBy(describedById: string) {
  return {
    'aria-describedby': describedById,
  };
}

/**
 * Create ARIA attributes for labeled-by relationships
 * @param labeledById - ID of element containing label
 * @returns ARIA attributes object
 */
export function createAriaLabelledBy(labeledById: string) {
  return {
    'aria-labelledby': labeledById,
  };
}

/**
 * Create ARIA attributes for form field validation
 * @param hasError - Whether field has validation error
 * @param errorId - ID of error message element
 * @returns ARIA attributes object
 */
export function createAriaValidation(hasError: boolean, errorId?: string) {
  return {
    'aria-invalid': hasError,
    ...(hasError && errorId && { 'aria-describedby': errorId }),
  };
}

/**
 * Create ARIA attributes for disabled state
 * @param isDisabled - Whether element is disabled
 * @returns ARIA attributes object
 */
export function createAriaDisabled(isDisabled: boolean) {
  return {
    'aria-disabled': isDisabled,
    ...(isDisabled && { disabled: true }),
  };
}

/**
 * Create ARIA attributes for expandable elements
 * @param isExpanded - Whether element is expanded
 * @param controlsId - ID of controlled element
 * @returns ARIA attributes object
 */
export function createAriaExpanded(isExpanded: boolean, controlsId?: string) {
  return {
    'aria-expanded': isExpanded,
    ...(controlsId && { 'aria-controls': controlsId }),
  };
}

/**
 * Create ARIA attributes for pressed/toggle buttons
 * @param isPressed - Whether button is pressed
 * @returns ARIA attributes object
 */
export function createAriaPressed(isPressed: boolean) {
  return {
    'aria-pressed': isPressed,
    role: 'button',
  };
}

/**
 * Create ARIA attributes for live regions
 * @param politeness - 'polite', 'assertive', or 'off'
 * @param atomic - Whether to announce entire region
 * @returns ARIA attributes object
 */
export function createAriaLive(
  politeness: 'polite' | 'assertive' | 'off' = 'polite',
  atomic = true
) {
  return {
    'aria-live': politeness,
    'aria-atomic': atomic,
  };
}

/**
 * Create ARIA attributes for busy/loading state
 * @param isBusy - Whether element is loading
 * @returns ARIA attributes object
 */
export function createAriaBusy(isBusy: boolean) {
  return {
    'aria-busy': isBusy,
  };
}

/**
 * Create ARIA attributes for current page/section
 * @param isCurrent - Whether element represents current context
 * @param type - Type of current indicator ('page', 'step', 'location', 'date', 'time', 'true')
 * @returns ARIA attributes object
 */
export function createAriaCurrent(
  isCurrent: boolean,
  type: 'page' | 'step' | 'location' | 'date' | 'time' = 'page'
) {
  return {
    ...(isCurrent && { 'aria-current': type }),
  };
}

/**
 * Create ARIA attributes for hidden elements
 * @param isHidden - Whether element is hidden from AT
 * @returns ARIA attributes object
 */
export function createAriaHidden(isHidden: boolean) {
  return {
    ...(isHidden && { 'aria-hidden': true }),
  };
}

/**
 * Create ARIA attributes for selected state
 * @param isSelected - Whether element is selected
 * @returns ARIA attributes object
 */
export function createAriaSelected(isSelected: boolean) {
  return {
    'aria-selected': isSelected,
  };
}

/**
 * Create ARIA attributes for popup elements
 * @param hasPopup - Type of popup ('menu', 'listbox', 'tree', 'grid', 'dialog', 'true', or false)
 * @param popupId - ID of popup element
 * @returns ARIA attributes object
 */
export function createAriaPopup(
  hasPopup: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | true | false = false,
  popupId?: string
) {
  return {
    'aria-haspopup': hasPopup,
    ...(hasPopup && popupId && { 'aria-owns': popupId }),
  };
}

/**
 * Create ARIA attributes for sorted column headers
 * @param sortDirection - 'ascending', 'descending', 'other', or 'none'
 * @returns ARIA attributes object
 */
export function createAriaSortOrder(
  sortDirection: 'ascending' | 'descending' | 'other' | 'none' = 'none'
) {
  return {
    'aria-sort': sortDirection,
  };
}

/**
 * Create ARIA attributes for column/row count in tables
 * @param rowCount - Total number of rows
 * @param columnCount - Total number of columns
 * @returns ARIA attributes object
 */
export function createAriaTableDimensions(rowCount?: number, columnCount?: number) {
  return {
    ...(rowCount !== undefined && { 'aria-rowcount': rowCount }),
    ...(columnCount !== undefined && { 'aria-colcount': columnCount }),
  };
}

/**
 * Type-safe ARIA attribute builder for complex components
 */
export class AriaAttributeBuilder {
  private attributes: Record<string, any> = {};

  setLabel(label: string) {
    this.attributes['aria-label'] = label;
    return this;
  }

  setLabelledBy(id: string) {
    this.attributes['aria-labelledby'] = id;
    return this;
  }

  setDescribedBy(id: string) {
    this.attributes['aria-describedby'] = id;
    return this;
  }

  setRole(role: string) {
    this.attributes.role = role;
    return this;
  }

  setExpanded(isExpanded: boolean, controlsId?: string) {
    this.attributes['aria-expanded'] = isExpanded;
    if (controlsId) {
      this.attributes['aria-controls'] = controlsId;
    }
    return this;
  }

  setInvalid(isInvalid: boolean, errorId?: string) {
    this.attributes['aria-invalid'] = isInvalid;
    if (isInvalid && errorId) {
      this.attributes['aria-describedby'] = errorId;
    }
    return this;
  }

  setDisabled(isDisabled: boolean) {
    this.attributes['aria-disabled'] = isDisabled;
    if (isDisabled) {
      this.attributes.disabled = true;
    }
    return this;
  }

  setRequired(isRequired: boolean) {
    this.attributes['aria-required'] = isRequired;
    if (isRequired) {
      this.attributes.required = true;
    }
    return this;
  }

  setLive(politeness: 'polite' | 'assertive' = 'polite', atomic = true) {
    this.attributes['aria-live'] = politeness;
    this.attributes['aria-atomic'] = atomic;
    return this;
  }

  setHidden(isHidden: boolean) {
    if (isHidden) {
      this.attributes['aria-hidden'] = true;
    }
    return this;
  }

  setBusy(isBusy: boolean) {
    this.attributes['aria-busy'] = isBusy;
    return this;
  }

  build(): Record<string, any> {
    return { ...this.attributes };
  }
}

/**
 * Utility to merge multiple ARIA attribute objects
 */
export function mergeAriaAttributes(
  ...attrObjects: (Record<string, any> | undefined)[]
): Record<string, any> {
  return attrObjects.reduce((acc, obj) => {
    if (obj) {
      Object.assign(acc, obj);
    }
    return acc;
  }, {});
}
