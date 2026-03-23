# Color Palette - Air Quality Tracker Project

This document lists all the main colors used throughout the project.

## Air Quality Index (AQI) Colors

These colors are used to represent different air quality levels:

| Color | Hex Code | Usage | Label |
|-------|----------|-------|-------|
| ![#A7E8B1](https://via.placeholder.com/20/A7E8B1/000000?text=+) | `#A7E8B1` | Good | Light Green |
| ![#FFF3B0](https://via.placeholder.com/20/FFF3B0/000000?text=+) | `#FFF3B0` | Moderate | Light Yellow |
| ![#FFD6A5](https://via.placeholder.com/20/FFD6A5/000000?text=+) | `#FFD6A5` | Unhealthy (Sensitive) | Light Orange |
| ![#FFB8B8](https://via.placeholder.com/20/FFB8B8/000000?text=+) | `#FFB8B8` | Unhealthy | Light Red/Pink |
| ![#DDA0DD](https://via.placeholder.com/20/DDA0DD/000000?text=+) | `#DDA0DD` | Very Unhealthy | Light Purple |

## Primary Brand Colors

### Blue (Primary)
- `#3B82F6` - Primary blue (used in charts, buttons, links)
- `blue-50` - Very light blue backgrounds
- `blue-100` - Light blue backgrounds and borders
- `blue-600` - Primary buttons and accents
- `blue-700` - Hover states for blue buttons
- `blue-800` - Dark blue text
- `blue-900` - Very dark blue text

### Indigo (Secondary)
- `indigo-600` - Statistics and accents
- `indigo-700` - Darker indigo accents
- `indigo-800` - Dark indigo (gradient end)

## UI Component Colors

### Gray Scale
- `gray-50` - Very light backgrounds
- `gray-100` - Light backgrounds, borders, inactive states
- `gray-200` - Borders, dividers
- `gray-300` - Input borders
- `gray-400` - Secondary text, icons
- `gray-500` - Muted text
- `gray-600` - Secondary text
- `gray-700` - Body text
- `gray-900` - Primary headings and text
- `#1F2937` - Dark gray text on colored backgrounds
- `#9CA3AF` - Chart axis colors
- `#333` - Dark text on maps
- `#888` - Medium gray (map strokes)
- `#f0f0f0` - Light gray (map background)

### Status Colors

#### Green (Positive/Good)
- `green-50` - Light green backgrounds
- `green-100` - Green borders and backgrounds
- `green-200` - Green borders
- `green-600` - Green text and icons (improving trends, best readings)
- `green-700` - Dark green text
- `green-900` - Very dark green text

#### Orange (Warning/Attention)
- `orange-50` - Light orange backgrounds
- `orange-100` - Orange borders and backgrounds
- `orange-600` - Orange text and icons (worsening trends, worst readings)

#### Purple (Reflection/Educational)
- `purple-50` - Light purple backgrounds
- `purple-100` - Purple borders and backgrounds
- `purple-400` - Purple focus rings
- `purple-600` - Purple text and buttons
- `purple-700` - Purple hover states

#### Teal (Data Visualization)
- `teal-600` - Range statistics

### Neutral Colors
- `white` - Primary background, cards
- `black` - Used with opacity for overlays

## Chart Colors

### Line/Area Charts
- Stroke: `#3B82F6` (blue)
- Fill Gradient Start: `#3B82F6` at 30% opacity
- Fill Gradient End: `#3B82F6` at 0% opacity
- Axis: `#9CA3AF` (gray)
- Dots: `#3B82F6`

## Background Gradients

### Hero Section
- `from-blue-600 via-blue-700 to-indigo-800` - Main hero gradient

### Cards
- `from-gray-50 to-gray-100` - Main page background
- `from-blue-50 to-white` - Blue accent cards
- `from-green-50 to-white` - Green accent cards
- `from-orange-50 to-white` - Orange accent cards
- `from-purple-50 via-white to-white` - Purple reflection cards
- `from-blue-50 via-white to-white` - Blue educational cards

## Legacy Colors (App.css)

These colors are defined in `App.css` but may not be actively used:
- `#282c34` - Dark background (App-header)
- `#61dafb` - Cyan link color (App-link)

## Color Usage by Component

### Dashboard
- **Primary Actions**: Blue (`blue-600`, `blue-700`)
- **Metrics**: Blue for primary, Purple for median, Green for min, Orange for max
- **Status Indicators**: AQI colors based on value ranges
- **Charts**: Blue (`#3B82F6`) with gradient fills

### Landing Page
- **Hero Section**: Blue to indigo gradient (`blue-600` → `blue-700` → `indigo-800`)
- **Feature Cards**: Blue, Purple, and Green gradients
- **CTA Section**: Blue to indigo gradient

### Navigation
- **Brand**: Gray-900 text
- **User Avatar**: Blue-600 background

## Tailwind Color Classes Used

### Backgrounds (bg-*)
- `bg-white`, `bg-gray-50`, `bg-gray-100`, `bg-gray-200`
- `bg-blue-50`, `bg-blue-100`, `bg-blue-600`, `bg-blue-700`
- `bg-green-50`, `bg-green-100`
- `bg-orange-50`, `bg-orange-100`
- `bg-purple-100`, `bg-purple-600`, `bg-purple-700`
- `bg-indigo-600`, `bg-indigo-800`
- `bg-teal-600`

### Text Colors (text-*)
- `text-white`, `text-gray-500`, `text-gray-600`, `text-gray-700`, `text-gray-900`
- `text-blue-600`, `text-blue-700`, `text-blue-800`, `text-blue-900`
- `text-green-600`, `text-green-700`, `text-green-900`
- `text-orange-600`
- `text-purple-600`
- `text-indigo-600`
- `text-teal-600`

### Border Colors (border-*)
- `border-gray-100`, `border-gray-200`, `border-gray-300`
- `border-blue-100`, `border-green-100`, `border-green-200`
- `border-orange-100`, `border-purple-100`

## Summary

**Primary Color Scheme**: Blue-based with supporting colors for status indicators
**Neutral Palette**: Gray scale from 50-900
**Accent Colors**: Green (positive), Orange (warning), Purple (educational), Teal (data)
**Total Unique Colors**: ~40+ distinct color values

