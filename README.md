# 🧪 Pokémon Research Lab

The **Pokémon Research Lab** is a high-performance frontend web application built to aggregate, analyze, edit, and export large Pokémon datasets. It fetches the complete Pokédex from the public **PokeAPI**, displays it in a virtualized data table, and provides powerful tools to manipulate the data directly on the client.

This project is built as a **frontend technical assessment**, with a strong focus on performance, code readability, advanced state management, and polished UI/UX.

---

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Table & Virtualization:** TanStack Table + TanStack Virtual
- **CSV Parsing:** PapaParse (streaming)
- **Animations:** Framer Motion
- **Persistence:** IndexedDB

---

## ✨ Features

### Full Pokédex API Fetch
- Fetches all Pokémon (~1300) from the PokeAPI
- Handles API pagination correctly
- Displays a live progress indicator during fetching
- Normalizes and stores data in a global Zustand store

### High-Performance Data Table
- Virtualized table for smooth scrolling
- Supports sorting on all columns
- Sticky first and last columns
- Optimized for large datasets

### Inline Data Editing
- Editable base stats (HP, Attack, Defense, etc.)
- Click-to-edit cells with validation
- Changes update the global store instantly

### Dynamic Columns
- Add custom columns at runtime
- Choose column name and data type
- New columns are fully editable and sortable

### CSV Upload & Schema Mapping
- Upload large CSV files (up to ~100MB)
- Streaming parsing to avoid memory issues
- Map CSV headers to application fields
- Uploaded data replaces the existing dataset

### AI-Style Command Overlay
- Edit data using natural-language-like commands (client-side parser)
- Example:
set hp to 100 for all pokemon of type grass

- Commands directly manipulate the dataset in Zustand

### CSV Export
- Export the current table state as a CSV
- Includes all edits and dynamic columns

### Persistence
- Data and custom columns are persisted using IndexedDB
- Dataset survives page refreshes

---

## 🖥️ UI & UX

- Desktop-first, professional layout
- Light theme with optional dark mode
- Subtle animations using Framer Motion
- Focus on clarity, readability, and performance
- No unnecessary visual noise or heavy animations

---

## 🛠️ Getting Started

### Prerequisites
- Node.js **18+**
- npm / pnpm / yarn

---

### Installation

```bash
git clone https://github.com/your-username/pokemon-research-lab.git
cd pokemon-research-lab
npm install

npm run dev

http://localhost:3000
