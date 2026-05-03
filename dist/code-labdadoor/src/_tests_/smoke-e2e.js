"use strict";
/**
 * End-to-end smoke test for the full review pipeline.
 * Usage:
 *   npm run smoke:e2e
 *   GITHUB_REPO=owner/repo PR_NUMBER=123 npm run smoke:e2e
 *
 * Reads credentials from src/.env if present, then falls back to process.env.
 * Overrides settings.json VCS config with env vars when provided.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const orchestrator_1 = require("../reviewer/orchestrator");
dotenv.config({ path: path.resolve(__dirname, '../.env') });
function loadConfig() {
    const settingsPath = path.resolve(__dirname, '../configs/settings.json');
    const config = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    // Allow env-var overrides so the smoke test works without editing settings.json
    if (process.env.GITHUB_TOKEN)
        config.vcs.token = process.env.GITHUB_TOKEN;
    if (process.env.GITHUB_REPO)
        config.vcs.projectId = process.env.GITHUB_REPO;
    if (process.env.PR_NUMBER)
        config.vcs.mrIid = Number(process.env.PR_NUMBER);
    return config;
}
async function main() {
    const config = loadConfig();
    console.log('--- smoke:e2e ---');
    console.log(`repo : ${config.vcs.projectId}`);
    console.log(`PR   : ${config.vcs.mrIid}`);
    const result = await (0, orchestrator_1.runCodeReview)(config);
    console.log('\n--- Review complete ---');
    console.log(`decision : ${result.decision}`);
    console.log(`summary  : ${result.summary}`);
    console.log(`findings : ${result.findings.length}`);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
