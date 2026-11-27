/**
 * Two-step destructive-action guard.
 * The application keeps cloud tombstones for synchronization/audit; this confirms
 * the user's intent before a record is hidden and queued for deletion.
 */
export function confirmStrictDeletion(target: string): boolean {
  const phrase = window.prompt(
    'این عملیات سوابق وابسته را نیز از فهرست فعال خارج می‌کند. برای ادامه، دقیقاً عبارت «حذف شود» را بنویس:'
  )
  if (phrase !== 'حذف شود') return false
  return window.confirm(
    'تأیید نهایی حذف: ' + target + '\n\nاین اقدام در رابط عادی قابل لغو نیست. برای ادامه تأیید کنید.'
  )
}
