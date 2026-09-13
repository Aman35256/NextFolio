const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
const googleLoginEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true';
const productionOrigin = 'https://next-folio-silk.vercel.app';

const hasUsableClientId = (
  typeof googleClientId === 'string'
  && googleClientId
  && !googleClientId.startsWith('@')
  && googleClientId !== 'GOOGLE_OAUTH_CLIENT_ID_NOT_CONFIGURED'
  && googleClientId !== 'your_google_oauth_client_id'
);

export const GOOGLE_CLIENT_ID = hasUsableClientId ? googleClientId : '';
export const HAS_GOOGLE_OAUTH = hasUsableClientId && googleLoginEnabled;
export const GOOGLE_PRODUCTION_ORIGIN = productionOrigin;

const getCurrentOrigin = () => (
  typeof window === 'undefined' ? productionOrigin : window.location.origin
);

export const getGoogleLoginPreflightError = () => {
  if (!HAS_GOOGLE_OAUTH) return 'Google sign-in is disabled for this environment.';

  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent.toLowerCase();
  const isVSCodeBrowser = (
    typeof window !== 'undefined'
    && (
      typeof window.acquireVsCodeApi === 'function'
      || userAgent.includes('vscode')
      || userAgent.includes('electron')
    )
  );

  if (isVSCodeBrowser) {
    return `Google sign-in cannot run inside the VS Code browser preview. Open ${getCurrentOrigin()} in Chrome, Edge, or another regular browser and try again.`;
  }

  return '';
};

export const getGoogleAuthErrorMessage = (error) => {
  const reason = error?.error || error?.type || error?.message;
  if (reason === 'popup_closed') return 'Google sign-in was closed before it finished.';
  if (reason === 'popup_failed_to_open') return 'Google sign-in popup was blocked. Allow popups and try again.';

  return `Google sign-in is not configured for this domain yet. In Google Cloud Console, add ${getCurrentOrigin()} to Authorized JavaScript origins for this OAuth client.`;
};
