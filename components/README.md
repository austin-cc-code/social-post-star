# /components Directory

This directory contains all React components for the UI.

## Structure

### /components/ui
- Reusable UI components from Ditto design library
- Buttons, inputs, cards, modals, etc.
- Generic, presentational components
- Should be framework-agnostic where possible

### /components/posts
- Post-related components
- Post card/display components
- Post editor components
- Post review interface components
- Platform-specific post views

### /components/campaigns
- Campaign mode UI components
- Campaign form components
- Campaign type selectors
- Campaign post management

## Guidelines
- Components should be small and focused
- Use TypeScript for all components
- Follow Ditto design library patterns
- Keep business logic in /lib, components should be presentational
- Use proper prop types and interfaces
