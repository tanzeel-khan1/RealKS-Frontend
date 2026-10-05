const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const investorRoutes = require('./routes/investorRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const noteRoutes = require('./routes/noteRoutes');
const ideaRoutes = require('./routes/ideaRoutes');
const activityRoutes = require('./routes/activityRoutes');
const chatRoutes = require('./routes/chatRoutes');
const documentRoutes = require('./routes/documentRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth
app.use('/api/auth', authRoutes);

// Companies (top-level)
app.use('/api/companies', companyRoutes);

// Company-scoped resources (nested)
app.use('/api/companies/:companyId/expenses', expenseRoutes);
app.use('/api/companies/:companyId/invoices', invoiceRoutes);
app.use('/api/companies/:companyId/investors', investorRoutes);
app.use('/api/companies/:companyId/employees', employeeRoutes);
app.use('/api/companies/:companyId/notes', noteRoutes);
app.use('/api/companies/:companyId/ideas', ideaRoutes);
app.use('/api/companies/:companyId/activities', activityRoutes);
app.use('/api/companies/:companyId/documents', documentRoutes);
app.use('/api/companies/:companyId/passwords', passwordRoutes);

// Chat (room-based, room = company_id)
app.use('/api/chat', chatRoutes);

// Personal notes (no companyId)
app.use('/api/notes', noteRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));