export type ErrorContext = 'auth' | 'event' | 'team' | 'score' | 'share' | 'general';

export interface FriendlyError {
  title: string;
  message: string;
  suggestion?: string;
  learnMoreHref?: string;
  type?: 'error' | 'warning' | 'info' | 'success';
}

interface ErrorInput {
  status?: number;
  code?: string;
  message?: string;
  context?: ErrorContext;
  field?: string;
}

const statusMap: Record<number, FriendlyError> = {
  400: {
    title: 'Check your input',
    message: 'A few fields need attention before we can continue.',
    suggestion: 'Review the highlighted fields and try again.',
    type: 'warning',
  },
  401: {
    title: 'Please sign in again',
    message: 'Your session expired or the credentials were incorrect.',
    suggestion: 'Log back in to continue.',
    type: 'error',
    learnMoreHref: '/docs/authentication',
  },
  403: {
    title: 'Permission needed',
    message: "You don't have access to perform this action.",
    suggestion: 'Switch to an authorized account or contact the owner.',
    type: 'error',
  },
  404: {
    title: 'Not found',
    message: "We couldn't find what you were looking for.",
    suggestion: 'Refresh the page or check if the item still exists.',
    type: 'warning',
  },
  409: {
    title: 'Already exists',
    message: 'This item already exists or conflicts with another record.',
    suggestion: 'Try a different name or remove the duplicate first.',
    type: 'warning',
  },
  422: {
    title: 'Validation needed',
    message: 'Some values look incorrect.',
    suggestion: 'Fix the highlighted fields and try again.',
    type: 'warning',
  },
  429: {
    title: 'Slow down a moment',
    message: 'You hit the rate limit.',
    suggestion: 'Wait a few seconds and try again.',
    type: 'warning',
  },
  500: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred on our side.',
    suggestion: 'Please retry in a moment. If it persists, contact support.',
    type: 'error',
    learnMoreHref: '/docs/troubleshooting',
  },
};

const codeMap: Record<string, FriendlyError> = {
  AUTH_INVALID_CREDENTIALS: {
    title: 'Check your email or password',
    message: 'We could not verify those credentials.',
    suggestion: 'Re-enter your email and password, then try again.',
    type: 'error',
  },
  AUTH_RATE_LIMIT: {
    title: 'Too many attempts',
    message: 'We paused login to protect your account.',
    suggestion: 'Wait 30 seconds and try again.',
    type: 'warning',
  },
  TEAM_DUPLICATE: {
    title: 'Team name already used',
    message: 'Each team name must be unique in this event.',
    suggestion: 'Add a differentiator like “Team Alpha 2”.',
    type: 'warning',
  },
  EVENT_NOT_FOUND: {
    title: 'Event not found',
    message: 'The event may have been deleted or moved.',
    suggestion: 'Refresh the dashboard and select another event.',
    type: 'warning',
  },
  SHARE_LINK_NOT_FOUND: {
    title: 'Share link missing',
    message: 'We could not find the share link for this event.',
    suggestion: 'Regenerate a new link from Settings.',
    type: 'warning',
  },
};

function normalizeMessage(raw?: string): string | undefined {
  return raw?.trim() || undefined;
}

export function getFriendlyError(input: ErrorInput): FriendlyError {
  const { status, code, message, context, field } = input;
  const normalizedMessage = normalizeMessage(message);

  if (code && codeMap[code]) {
    return codeMap[code];
  }

  if (status && statusMap[status]) {
    const base = statusMap[status];
    // Context-specific tweaks
    if (status === 401 && context === 'auth') {
      return {
        ...base,
        message: 'Email or password was incorrect.',
        suggestion: 'Check your details and try again. You can reset your password if needed.',
        learnMoreHref: '/docs/authentication',
      };
    }
    if (status === 409 && context === 'team') {
      return {
        ...base,
        title: 'Team name already exists',
        message: 'Each team in this event needs a unique name.',
        suggestion: 'Try a suffix like “(2)” or pick another name.',
      };
    }
    return base;
  }

  // Content-based heuristics
  if (normalizedMessage) {
    const lower = normalizedMessage.toLowerCase();
    if (lower.includes('duplicate') || lower.includes('already exists')) {
      return {
        title: 'Already in use',
        message: normalizedMessage,
        suggestion: 'Use a unique value and try again.',
        type: 'warning',
      };
    }
    if (lower.includes('token') || lower.includes('unauthorized')) {
      return {
        title: 'Please sign in again',
        message: 'Your session may have expired.',
        suggestion: 'Log back in to continue.',
        type: 'error',
      };
    }
  }

  // Field-specific fallback
  if (field) {
    return {
      title: 'Please check this field',
      message: `${field} looks incorrect.`,
      suggestion: 'Update it and try again.',
      type: 'warning',
    };
  }

  return {
    title: 'Something went wrong',
    message: normalizedMessage || 'We hit an unexpected error.',
    suggestion: 'Please retry in a moment.',
    type: 'error',
  };
}
