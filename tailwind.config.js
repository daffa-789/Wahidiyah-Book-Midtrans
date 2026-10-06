import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tokens = require('./component.json');

const fontStack = (value) => value.split(',').map((part) => part.trim().replace(/'/g, '"'));

const controlHeights = {
  sm: tokens.sizing.control.heightSm,
  md: tokens.sizing.control.heightMd,
  lg: tokens.sizing.control.heightLg,
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: { ...tokens.breakpoints },
      colors: {
        brand: tokens.colors.brand,
        gold: tokens.colors.gold,
        cream: tokens.colors.cream,
        ink: tokens.colors.ink,
        accent: tokens.colors.accent,
        ui: tokens.colors.ui,
        semantic: tokens.colors.semantic,
        primary: {
          DEFAULT: tokens.colors.primary,
          hover: tokens.colors.primaryHover,
          light: tokens.colors.primaryLight,
        },
      },
      fontFamily: {
        sans: fontStack(tokens.typography.fontFamilySans),
        display: fontStack(tokens.typography.fontFamilyDisplay),
        arabic: fontStack(tokens.typography.fontFamilyArabic),
      },
      fontSize: { ...tokens.typography.scale },
      letterSpacing: { ...tokens.typography.tracking },
      borderRadius: {
        ...tokens.shapes.borderRadius,
        btn: tokens.shapes.componentRadius.button,
        card: tokens.shapes.componentRadius.card,
        modal: tokens.shapes.componentRadius.modal,
        input: tokens.shapes.componentRadius.input,
        badge: tokens.shapes.componentRadius.badge,
        frame: tokens.shapes.componentRadius.deviceFrame,
      },
      borderWidth: { ...tokens.shapes.borderWidth },
      boxShadow: { ...tokens.elevation },
      transitionTimingFunction: {
        'out-quart': tokens.motion.easeOut,
        'in-out-quart': tokens.motion.easeInOut,
      },
      transitionDuration: {
        fast: tokens.motion.durationFast,
        base: tokens.motion.durationBase,
        slow: tokens.motion.durationSlow,
      },
      width: {
        icon: { ...tokens.sizing.icon },
        avatar: { ...tokens.sizing.avatar },
      },
      height: {
        icon: { ...tokens.sizing.icon },
        avatar: { ...tokens.sizing.avatar },
        control: controlHeights,
      },
      minHeight: {
        control: controlHeights,
        touch: tokens.sizing.touchTarget,
      },
      maxWidth: {
        'content-narrow': tokens.layout.contentNarrow,
        content: tokens.layout.contentDefault,
        'content-wide': tokens.layout.contentWide,
      },
      spacing: {
        'page-x': tokens.layout.pagePaddingX,
        'section-gap': tokens.layout.sectionGap,
      },
    },
  },
  plugins: [],
};
