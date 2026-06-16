import { addons } from '@storybook/addons';
import { create } from '@storybook/theming/create';

const theme = create({
  base: 'light',
  brandTitle: 'BlockStop Design System',
  brandUrl: 'https://blockstop.dev',
  brandImage: undefined,
  brandTarget: '_blank',

  // UI Colors
  colorPrimary: '#2563eb',
  colorSecondary: '#9333ea',

  // Typography
  fontBase: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
  fontCode: 'SFMono-Regular, Consolas, "Liberation Mono", monospace',

  // Text Colors
  textColor: '#171717',
  textInverseColor: '#ffffff',

  // Toolbar
  appBg: '#ffffff',
  appContentBg: '#f5f5f5',
  appBorderColor: '#e5e5e5',
  appBorderRadius: 8,

  // Bar
  barTextColor: '#737373',
  barSelectedColor: '#2563eb',
  barBg: '#ffffff',

  // Form
  inputBg: '#ffffff',
  inputBorder: '#d4d4d4',
  inputTextColor: '#171717',
  inputBorderRadius: 6,
});

addons.setConfig({
  theme,
  panelPosition: 'right',
  enableShortcuts: true,
  showToolbar: true,
});
