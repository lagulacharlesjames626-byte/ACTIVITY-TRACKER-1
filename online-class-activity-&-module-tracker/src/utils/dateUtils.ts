/**
 * Date formatting and calculation utilities for module deadlines
 */

export function formatDeadline(isoString: string): string {
  if (!isoString) return 'No deadline set';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  // Formatting like: "Sept 20, 2026 at 8:00 AM"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${month} ${day}, ${year} at ${hours}:${formattedMinutes} ${ampm}`;
}

export function getDeadlineInfo(isoString: string, isSubmitted: boolean = false) {
  if (!isoString) {
    return {
      statusText: 'No deadline',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      isOverdue: false,
      isDueSoon: false,
      diffHours: 0,
    };
  }

  if (isSubmitted) {
    return {
      statusText: 'Completed',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      isOverdue: false,
      isDueSoon: false,
      diffHours: 0,
    };
  }

  const deadline = new Date(isoString).getTime();
  const now = new Date().getTime();
  const diffMs = deadline - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    const overdueHours = Math.abs(diffHours);
    const text = overdueDays === 0 ? `Overdue by ${overdueHours}h` : `Overdue by ${overdueDays}d`;
    return {
      statusText: text,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      isOverdue: true,
      isDueSoon: false,
      diffHours,
    };
  }

  if (diffHours <= 24) {
    return {
      statusText: diffHours <= 1 ? 'Due within 1 hour!' : `Due in ${diffHours} hours`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold animate-pulse',
      isOverdue: false,
      isDueSoon: true,
      diffHours,
    };
  }

  if (diffDays <= 3) {
    return {
      statusText: `Due in ${diffDays} days`,
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      isOverdue: false,
      isDueSoon: true,
      diffHours,
    };
  }

  return {
    statusText: `Due in ${diffDays} days`,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    isOverdue: false,
    isDueSoon: false,
    diffHours,
  };
}

export function toInputDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now = new Date().getTime();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 15) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
