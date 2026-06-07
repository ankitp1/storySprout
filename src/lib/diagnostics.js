const logBuffer = [];
const MAX_LOGS = 25;

const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  logBuffer.push({
    type: 'ERROR',
    timestamp: new Date().toISOString(),
    message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
  });
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  originalError.apply(console, args);
};

console.warn = (...args) => {
  logBuffer.push({
    type: 'WARN',
    timestamp: new Date().toISOString(),
    message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
  });
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  originalWarn.apply(console, args);
};

export const getConsoleLogs = () => logBuffer;

const DEVELOPER_EMAIL = import.meta.env.VITE_DEVELOPER_EMAIL || 'ankitp1@gmail.com';

export const generateDiagnosticReport = (state, userDescription = '') => {
  const systemInfo = [
    `StorySprout Diagnostic Report - ${new Date().toISOString()}`,
    `========================================`,
    `User Agent: ${navigator.userAgent}`,
    `OS / Platform: ${navigator.platform || 'Unknown'}`,
    `Online Status: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`,
    `Screen Size: ${window.innerWidth}x${window.innerHeight}`,
    `Local Storage Size: ~${JSON.stringify(localStorage).length} bytes`
  ].join('\n');

  let appStateInfo = 'No store state provided.';
  if (state) {
    appStateInfo = [
      `Application State:`,
      `- Profiles Count: ${state.profiles?.length || 0}`,
      `- Active Profile ID: ${state.activeProfileId || 'None'}`,
      `- Total Books Synced: ${state.books?.length || 0}`,
      `- Downloaded Books Count: ${Object.values(state.downloadedBooks || {}).filter(Boolean).length}`,
      `- Dark Mode Active: ${state.isDarkMode ? 'YES' : 'NO'}`,
      `- Session Limits Active: ${Object.keys(state.sessionLimits || {}).length} profiles configured`
    ].join('\n');
  }

  const userComments = userDescription 
    ? `User Issue Description:\n------------------------\n${userDescription}\n`
    : '';

  const logs = logBuffer.length > 0
    ? `Recent Console Warnings/Errors (Last ${logBuffer.length}):\n------------------------\n` + 
      logBuffer.map(l => `[${l.timestamp}] [${l.type}] ${l.message}`).join('\n')
    : 'No console warnings or errors captured.';

  return [
    systemInfo,
    '',
    appStateInfo,
    '',
    userComments,
    '',
    logs
  ].join('\n');
};

export const triggerDeveloperEmail = (state, userDescription = '') => {
  const report = generateDiagnosticReport(state, userDescription);
  const subject = encodeURIComponent('[StorySprout Support] Bug Report & Diagnostics');
  const body = encodeURIComponent(report);
  window.location.href = `mailto:${DEVELOPER_EMAIL}?subject=${subject}&body=${body}`;
};
