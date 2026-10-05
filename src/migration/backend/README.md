# Investo Backend API

## Setup

```bash
cd migration/backend
npm install
cp .env.example .env
# Fill in your MONGO_URI and JWT_SECRET in .env
npm run dev
```

## File Structure

```
migration/backend/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   ├── authController.js        # register, login, getMe
│   ├── companyController.js     # CRUD for companies
│   ├── expenseController.js     # CRUD for expenses
│   ├── invoiceController.js     # CRUD for invoices
│   ├── investorController.js    # CRUD for investors
│   ├── employeeController.js    # CRUD for employees
│   ├── noteController.js        # CRUD for notes
│   ├── ideaController.js        # CRUD for ideas + comments
│   ├── activityController.js    # list + create activities
│   ├── chatController.js        # get/send/delete messages
│   ├── documentController.js    # sections + documents CRUD
│   ├── passwordController.js    # CRUD for passwords
├── middleware/
│   ├── auth.js                  # JWT protect middleware
│   └── errorHandler.js          # Global error handler
├── models/
│   ├── User.js
│   ├── Company.js
│   ├── Expense.js
│   ├── Invoice.js
│   ├── Investor.js
│   ├── Employee.js
│   ├── Note.js
│   ├── Idea.js
│   ├── IdeaComment.js
│   ├── Activity.js
│   ├── ChatMessage.js
│   ├── Document.js
│   ├── DocSection.js
│   └── Password.js
├── routes/
│   ├── authRoutes.js
│   ├── companyRoutes.js
│   ├── expenseRoutes.js
│   ├── invoiceRoutes.js
│   ├── investorRoutes.js
│   ├── employeeRoutes.js
│   ├── noteRoutes.js
│   ├── ideaRoutes.js
│   ├── activityRoutes.js
│   ├── chatRoutes.js
│   ├── documentRoutes.js
│   └── passwordRoutes.js
├── utils/
│   └── generateToken.js         # JWT token generator
├── server.js                    # Express app entry point
├── package.json
└── .env.example
```

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Get current user (protected) |

### Companies
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/companies | List user's companies |
| POST   | /api/companies | Create company |
| GET    | /api/companies/:id | Get company |
| PUT    | /api/companies/:id | Update company |
| DELETE | /api/companies/:id | Delete company |

### Company-scoped (replace :cid with company ID)
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | /api/companies/:cid/expenses | List / Create |
| PUT/DELETE | /api/companies/:cid/expenses/:id | Update / Delete |
| GET/POST | /api/companies/:cid/invoices | List / Create |
| PUT/DELETE | /api/companies/:cid/invoices/:id | Update / Delete |
| GET/POST | /api/companies/:cid/investors | List / Create |
| PUT/DELETE | /api/companies/:cid/investors/:id | Update / Delete |
| GET/POST | /api/companies/:cid/employees | List / Create |
| PUT/DELETE | /api/companies/:cid/employees/:id | Update / Delete |
| GET/POST | /api/companies/:cid/notes | List / Create |
| PUT/DELETE | /api/companies/:cid/notes/:id | Update / Delete |
| GET/POST | /api/companies/:cid/ideas | List / Create |
| PUT/DELETE | /api/companies/:cid/ideas/:id | Update / Delete |
| GET/POST | /api/companies/:cid/ideas/:ideaId/comments | List / Add |
| GET/POST | /api/companies/:cid/activities | List / Create |
| GET/POST | /api/companies/:cid/documents | List / Create |
| GET/POST | /api/companies/:cid/documents/sections | List / Create |
| DELETE | /api/companies/:cid/documents/sections/:id | Delete section |
| PUT/DELETE | /api/companies/:cid/documents/:id | Update / Delete |
| GET/POST | /api/companies/:cid/passwords | List / Create |
| PUT/DELETE | /api/companies/:cid/passwords/:id | Update / Delete |

### Chat
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/chat/:roomId/messages | Get messages |
| POST   | /api/chat/:roomId/messages | Send message |
| DELETE | /api/chat/messages/:id | Delete message |

### Personal Notes
| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/notes | Personal notes list |
| POST   | /api/notes | Create personal note |