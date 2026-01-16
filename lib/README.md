# /lib Directory

This directory contains all core business logic and utilities.

## Structure

### /lib/db
- Database connection and configuration
- Database schema and migrations
- Query utilities and helpers
- Models and data access layers

### /lib/ai
- AI agent implementations
- Post generation logic
- Brand voice RAG system
- Quality check systems
- Content analysis utilities

### /lib/utils
- General utility functions
- Helper functions
- API client wrappers
- Formatting utilities
- Validation functions

## Guidelines
- Keep business logic separate from UI components
- All database queries should go through /lib/db
- AI-related functions belong in /lib/ai
- Shared utilities go in /lib/utils
