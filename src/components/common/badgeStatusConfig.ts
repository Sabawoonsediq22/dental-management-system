export const statusConfig: Record<string, { bg: string; text: string }> = {
  Completed: {
    bg: "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50",
    text: "text-green-700 dark:text-green-400",
  },
  Open: {
    bg: "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-400",
  },
  "In Progress": {
    bg: "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-400",
  },
  Cancelled: {
    bg: "bg-gray-100 dark:bg-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-700/50",
    text: "text-gray-700 dark:text-gray-400",
  },
};