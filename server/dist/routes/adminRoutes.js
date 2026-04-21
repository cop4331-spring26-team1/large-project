"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const adminController_1 = require("../controllers/adminController");
router.get('/users', adminController_1.getUsersAdmin);
router.patch('/users/:id', adminController_1.updateUserAdmin);
router.delete('/users/:id', adminController_1.deleteUserAdmin);
router.get('/listings', adminController_1.getListingsAdmin);
router.patch('/listings/:id/reactivate', adminController_1.reactivateListingAdmin);
router.delete('/listings/:id', adminController_1.deleteListingAdmin);
exports.default = router;
