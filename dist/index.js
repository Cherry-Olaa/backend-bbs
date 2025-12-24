"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config/config");
const PORT = process.env.PORT || 4000;
async function start() {
    await (0, config_1.connectDB)();
    app_1.default.listen(PORT, () => {
        console.log(`🚀 BUSYBRAINS backend listening on port ${PORT}`);
    });
}
start().catch((err) => {
    console.error("Failed to start", err);
    process.exit(1);
});
