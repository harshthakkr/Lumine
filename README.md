# Luminé - Makeup Artist Booking Platform

_Professional artist booking platform designed for the beauty industry_

## Overview

Luminé is a modern web application that streamlines the process of discovering and booking professional makeup artists. Built with Next.js 15 and TypeScript, it delivers a seamless user experience while maintaining the sophistication expected in the luxury beauty market.

The platform is deployed and fully functional for testing the booking workflow and user interface.
**[View Application](https://makeup-artist-booking-platform.vercel.app/)**

## Tech Stack

- **Frontend Framework:** Next.js 15
- **Language:** TypeScript for type safety and developer experience
- **Styling:** Tailwind CSS 4.0 with custom design system
- **Validation:** Zod schema validation for form handling

## Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/harshthakkr/makeup-artist-booking-platform
   cd makeup-artist-booking-platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture & Design Decisions

### Design System Implementation

**Color Palette Strategy**

- Primary gold (`#d4a574`) establishes luxury positioning
- Neutral cream (`#f5e6d3`) provides sophisticated backdrop
- Accent rose (`#d4707a`) adds warmth without overwhelming
- High contrast text ensures accessibility compliance

**Typography Hierarchy**

- Playfair Display serif for brand elements and headings
- Inter sans-serif for interface text and readability

### Performance & Optimization

**Static Site Generation (SSG)**

The application is configured for static site generation to maximize performance:

- **Pre-rendered Routes**: All category pages are pre-generated at build time
- **CDN Ready**: Static files optimized for global content delivery

**Image & Video Optimization**

- **`OptimizedImage` Component**: Custom image component with lazy loading and async decoding
- **`OptimizedVideo` Component**: Enhanced video component with performance optimizations
- **Static Asset Handling**: All media assets properly configured for static export

## Live Demo
https://github.com/user-attachments/assets/bd30e50e-e512-4a6a-bb48-6f2d1c4000b8

