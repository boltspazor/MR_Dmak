// WhatsApp Business Cloud API Error Codes and their descriptions
// Based on official WhatsApp documentation


export function formatErrorMessage(errorMessage?: string, errorCode?: number, errorTitle?: string): string {
  if (!errorMessage && !errorCode) return '';

  const errorInfo = `${errorCode} : ${errorTitle} : ${errorMessage}`;
  
  return errorInfo;
}

export function getErrorTooltip(errorCode?: number): string {
  if (!errorCode) return '';
  
  return `Error Code: ${errorCode} : whatapp Message Sending Failed`;
}