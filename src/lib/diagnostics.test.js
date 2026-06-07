import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getConsoleLogs, generateDiagnosticReport } from './diagnostics';

describe('diagnostics', () => {
  beforeEach(() => {
    // Clear logs buffer
    getConsoleLogs().length = 0;
  });

  it('should capture console errors and warnings in the buffer', () => {
    console.error('Test Error Log');
    console.warn('Test Warning Log');

    const logs = getConsoleLogs();
    expect(logs.length).toBe(2);
    
    expect(logs[0].type).toBe('ERROR');
    expect(logs[0].message).toContain('Test Error Log');

    expect(logs[1].type).toBe('WARN');
    expect(logs[1].message).toContain('Test Warning Log');
  });

  it('should format diagnostic report with state and logs correctly', () => {
    console.error('Crash warning');

    const mockState = {
      profiles: [{ id: 'p1', name: 'Rowan' }],
      activeProfileId: 'p1',
      books: [{ id: 'b1', title: 'The Hobbit' }],
      downloadedBooks: { 'b1': true },
      isDarkMode: true,
      sessionLimits: { 'p1': 30 }
    };

    const report = generateDiagnosticReport(mockState, 'Testing manual report message');

    expect(report).toContain('StorySprout Diagnostic Report');
    expect(report).toContain('User Agent:');
    expect(report).toContain('Profiles Count: 1');
    expect(report).toContain('Active Profile ID: p1');
    expect(report).toContain('Total Books Synced: 1');
    expect(report).toContain('Downloaded Books Count: 1');
    expect(report).toContain('Dark Mode Active: YES');
    expect(report).toContain('Testing manual report message');
    expect(report).toContain('Crash warning');
  });
});
