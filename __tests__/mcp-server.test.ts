import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const MCP_SERVER_PATH = path.join(__dirname, '../dist/mcp/server.js');

describe('MCP Server', () => {
  test('MCP server executable exists', () => {
    expect(fs.existsSync(MCP_SERVER_PATH)).toBe(true);
  });

  test('MCP server can be spawned and starts', (done) => {
    const serverProcess = spawn('node', [MCP_SERVER_PATH]);

    let stderrData = '';

    serverProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      
      // The server logs to stderr when it starts
      if (stderrData.includes('pptx-automizer MCP server running')) {
        // Server started successfully
        serverProcess.kill();
        done();
      }
    });

    serverProcess.on('error', (error) => {
      done(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      serverProcess.kill();
      if (!stderrData.includes('pptx-automizer MCP server running')) {
        done(new Error('Server did not start in time'));
      }
    }, 5000);
  }, 10000);

  test('MCP server directory structure exists', () => {
    const mcpDir = path.join(__dirname, '../dist/mcp');
    expect(fs.existsSync(mcpDir)).toBe(true);
    
    const packageJson = path.join(mcpDir, 'package.json');
    expect(fs.existsSync(packageJson)).toBe(true);
    
    const packageData = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
    expect(packageData.type).toBe('module');
  });
});
