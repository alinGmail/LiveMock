import path from 'path';
import fs from 'fs';

interface Config {
    database: {
        path: string;
    }
}

// Default configuration
const defaultConfig: Config = {
    database: {
        path: 'db'
    }
};

// Ensure directory exists
function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Check if running in test environment
function isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' || 
           process.env.JEST_WORKER_ID !== undefined ||
           process.argv.some(arg => arg.includes('jest'));
}

// Load configuration from environment variables
export function loadConfig(): Config {
    const config = {
        database: {
            path: process.env.LIVEMOCK_DB_PATH || defaultConfig.database.path
        }
    };
    
    // Only create directory in non-test environment
    if (!isTestEnvironment()) {
        ensureDirectoryExists(config.database.path);
    }
    
    return config;
}

// Get current configuration
export function getConfig(): Config {
    return loadConfig();
} 