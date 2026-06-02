/** Converts WS notification body newlines to HTML line breaks for display. */
export function formatNotificationBodyHtml(body: string): string {
  return body.trim().replace(/\n/g, "<br />");
}
