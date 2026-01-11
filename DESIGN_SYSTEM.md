# Electric Blueprint Design System Implementation

## Overview
The SPH Tracker has been redesigned using the **Electric Blueprint** design system - a monochrome light theme with Electric Blue (#0029BF) as the single accent color. This creates a high-contrast, grid-forward, data-first UI.

## Color Palette

### Base Colors
- **Black**: `#000000`
- **White**: `#FFFFFF`
- **Electric Blue**: `#0029BF` (Primary accent)
- **Cool Grey**: `#BCC1C5`

### Derived Colors
- **Paper**: `#EDF1F2` (App background)
- **Ink**: `#0B0F1A` (Primary text)
- **Grey Dark**: `#4D535A` (Secondary text)
- **Grey Mid**: `#8A9096` (Muted text)
- **Grey Light**: `#D7DBDE` (Subtle borders)
- **Blue Tint 10**: `#E6EAFA` (Soft backgrounds)
- **Blue Shade 10**: `#00239F` (Hover state)
- **Blue Shade 20**: `#001B7C` (Active state)

## Typography

### Font Families
- **UI Font**: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif
- **Mono Font**: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Type Scale
- **XS**: 12px / 16px line height
- **SM**: 13px / 18px line height
- **MD**: 14px / 20px line height (base)
- **LG**: 16px / 22px line height
- **XL**: 20px / 28px line height
- **XXL**: 24px / 32px line height

## Spacing System
Uses a 4px base unit scale:
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px

## Border Radius
- **XS**: 6px
- **SM**: 10px
- **MD**: 14px (buttons, inputs)
- **LG**: 18px
- **XL**: 24px (cards)

## Shadows
- **Level 1**: `0 1px 2px rgba(0,0,0,0.10)` (Subtle)
- **Level 2**: `0 6px 18px rgba(0,0,0,0.12)` (Cards)
- **Level 3**: `0 16px 40px rgba(0,0,0,0.16)` (Modals)

## Motion
- **Fast**: 120ms (active states)
- **Base**: 180ms (standard transitions)
- **Slow**: 260ms (complex animations)
- **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)` (Standard)

## Component Styles

### Buttons
- **Height**: 40px
- **Radius**: 14px (--radius-md)
- **Font**: 14px, weight 600
- **Variants**:
  - Primary: Electric Blue background, white text
  - Secondary: White background, black text, border
  - Ghost: Transparent background, subtle hover

### Inputs
- **Height**: 40px
- **Radius**: 12px
- **Number inputs**: Right-aligned with monospace font
- **Focus state**: Electric Blue border with soft shadow
- **Disabled state**: Blue tinted background for calculated fields

### Cards
- **Radius**: 24px (--radius-xl)
- **Padding**: 24px (--space-6)
- **Border**: 1px solid rgba(0,0,0,0.10)
- **Hover**: Stronger border, subtle shadow

### Tabs
- **Active indicator**: 2px Electric Blue underline
- **Text color**: Muted → Primary on hover → Electric Blue when active

### Data Tables
- **Grid lines**: rgba(0,0,0,0.10)
- **Row hover**: rgba(0,41,191,0.06)
- **Monospace font**: Used for all numeric values
- **Right alignment**: All numeric columns

## Key Design Principles

1. **Monochrome Base**: Black, white, and greys provide structure
2. **Single Accent**: Electric Blue (#0029BF) used sparingly for high signal
3. **High Contrast**: Strong readability with clear hierarchy
4. **Data-First**: Monospace numbers, grid structure, clear labeling
5. **Uppercase Labels**: 12px uppercase labels with 1.2px letter spacing
6. **Grid-Forward**: Clear borders, structured layouts, aligned content
7. **Clean Borders**: Subtle 10% black borders throughout
8. **Focused Interactions**: Clear focus rings (2px Electric Blue)

## Changes from Previous Design

### Removed
- ❌ Purple gradient header
- ❌ Multiple accent colors
- ❌ Heavy shadows and elevation
- ❌ Transform hover effects
- ❌ Emoji in header

### Added
- ✅ Flat monochrome header with border
- ✅ Single Electric Blue accent
- ✅ Subtle borders and minimal shadows
- ✅ Monospace fonts for data
- ✅ Uppercase labels with letter spacing
- ✅ Consistent focus states
- ✅ Grid-based structure
- ✅ Higher contrast text
- ✅ Professional, data-focused aesthetic

## Accessibility

- **Contrast ratios**: All text meets WCAG AA standards
- **Focus indicators**: Clear 2px Electric Blue rings
- **Hover states**: Subtle background changes
- **Active states**: Pressed button effects
- **Keyboard navigation**: Full focus-visible support

## Responsive Design

- **Mobile breakpoint**: 768px
- **Flexible grids**: Auto-fit columns with minimums
- **Stack on mobile**: Cards and forms become single column
- **Touch targets**: 40px minimum height for buttons/inputs

---

**Implementation Date**: 2026-01-11  
**Design System**: Electric Blueprint v1.0  
**Platform**: Electron Desktop App

