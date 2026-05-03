"use strict";
/**
 * Smoke test for GitHubVcsProvider.
 * Usage:
 *   npm run smoke -- 123
 *   GITHUB_REPO=owner/repo npm run smoke -- 456
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const github_1 = require("../github");
dotenv.config({ path: path_1.default.resolve(__dirname, '../../.env') });
async function main() {
    // Map GITHUB_ACCESS_TOKEN from .env to GITHUB_TOKEN
    if (!process.env.GITHUB_TOKEN && process.env.GITHUB_ACCESS_TOKEN) {
        process.env.GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
    }
    const prArg = process.argv[2];
    if (prArg)
        process.env.PR_NUMBER = prArg;
    if (!process.env.GITHUB_TOKEN)
        throw new Error('GITHUB_TOKEN is not set');
    if (!process.env.GITHUB_REPO)
        throw new Error('GITHUB_REPO is not set (format: owner/repo)');
    if (!process.env.PR_NUMBER)
        throw new Error('PR_NUMBER is not set');
    const vcs = new github_1.GitHubVcsProvider();
    console.log('--- getDiff() ---');
    const diff = await vcs.getDiff();
    console.log(diff);
    console.log('\n--- postComment() ---');
    await vcs.postComment('smoke test comment from ai-reviewer');
    console.log('comment posted');
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
