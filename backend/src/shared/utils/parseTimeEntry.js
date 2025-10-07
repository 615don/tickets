/**
 * Parses flexible time entry formats into decimal hours
 * @param {string} input - Time string (e.g., "2h", "90m", "1h30m")
 * @returns {{ success: true, hours: number } | { success: false, error: string }}
 */
export function parseTimeEntry(input) {
  // Trim whitespace
  const trimmed = input.trim();

  // Validate not empty
  if (!trimmed) {
    return { success: false, error: "Time entry cannot be empty" };
  }

  // Try combined format (1h30m)
  const combinedMatch = trimmed.match(/^(\d+)h(\d+)m$/);
  if (combinedMatch) {
    const hours = parseInt(combinedMatch[1], 10);
    const minutes = parseInt(combinedMatch[2], 10);
    const total = hours + minutes / 60;
    if (total > 24) {
      return { success: false, error: "Time entry cannot exceed 24 hours" };
    }
    return { success: true, hours: total };
  }

  // Try minute format (45m)
  const minuteMatch = trimmed.match(/^(\d+)m$/);
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1], 10);
    const hours = minutes / 60;
    if (hours > 24) {
      return { success: false, error: "Time entry cannot exceed 24 hours" };
    }
    return { success: true, hours };
  }

  // Try hour format (2h or 2 or 2.5h or 2.5)
  const hourMatch = trimmed.match(/^(\d+(?:\.\d+)?)(h)?$/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    if (hours < 0) {
      return { success: false, error: "Time entry cannot be negative" };
    }
    if (hours > 24) {
      return { success: false, error: "Time entry cannot exceed 24 hours" };
    }
    return { success: true, hours };
  }

  // No match
  return {
    success: false,
    error: "Invalid time format. Use formats like '2h', '90m', or '1h30m'"
  };
}
