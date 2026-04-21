"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const db_1 = __importDefault(require("./lib/db"));
const socket_1 = require("./lib/socket");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const listingRoutes_1 = __importDefault(require("./routes/listingRoutes"));
const threadRoutes_1 = __importDefault(require("./routes/threadRoutes"));
const universityRoutes_1 = __importDefault(require("./routes/universityRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true }));
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.send('Server is running');
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/listings', listingRoutes_1.default);
app.use('/api/threads', threadRoutes_1.default);
app.use('/api/universities', universityRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
(0, socket_1.initSocket)(server);
const start = async () => {
    await (0, db_1.default)();
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
};
start();
