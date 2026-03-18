/* ================================================================
   TrackIt — Vehicle Management
   utils.js  |  Shared utility functions
   ================================================================ */

/**
 * Returns a human-readable "time ago" string from an ISO timestamp.
 * e.g. "Just now", "5m ago", "3h ago", "2d ago"
 */
function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (seconds < 10)    return 'Just now';
  if (seconds < 60)    return `${seconds}s ago`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Displays a toast notification at the bottom of the screen.
 * @param {string} msg   — message to display
 * @param {'success'|'error'} type — controls icon colour
 */
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
