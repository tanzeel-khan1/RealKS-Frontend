# Ranvola Frontend
React + Vite frontend for Ranvola.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Runs on http://localhost:5173. API calls are proxied to http://localhost:5000 (the backend).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Structure

```
frontend/src/
├── api/
│   └── apiClient.js        # REST API client (replaces Base44 SDK)
├── components/             # Shared UI components
│   ├── layout/             # AppLayout, Sidebar, TopBar
│   ├── dashboard/          # Dashboard widgets
│   ├── chat/               # ChatBox
│   ├── ideas/              # IdeaDetailDialog
│   ├── notepad/            # EmployeesTab, NoteEditor
│   ├── personal/           # Personal section components
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── AuthContext.jsx     # JWT-based auth context
│   └── utils.js
├── pages/                  # Route-level page components
│   └── Hpc.jsx             # HPC workspace page with create/edit/delete flow
└── App.jsx                 # Router and auth guard
```

## Company Workspace Modules

The frontend now includes an HPC module in the company workspace:
- Create HPC initiatives for the selected company
- Edit or delete existing HPC records
- View summary cards and initiative details
- Use a responsive layout for desktop, tablet, and mobile screens
