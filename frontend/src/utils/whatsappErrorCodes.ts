// WhatsApp Business Cloud API Error Codes and their descriptions
// Based on official WhatsApp documentation

export interface WhatsAppErrorInfo {
  code: number;
  title: string;
  description: string;
  corrective_action: string;
}

export const WHATSAPP_ERROR_CODES: Record<number, WhatsAppErrorInfo> = {
  131000: {
    code: 131000,
    title: 'generic_error',
    description: 'An unspecified error has occurred. This is a catch-all and might require further investigation or retrying the message.',
    corrective_action: 'Update MR status to "GenericError" -> Manual verification-> Update Status. Don\'t include for message sending until this is complete.'
  },
  131005: {
    code: 131005,
    title: 'app_not_installed',
    description: 'The recipient does not have WhatsApp installed on their device.',
    corrective_action: 'Update MR status to "AppNotInstalled" -> Manual verification-> Update Status. Don\'t include for message sending until this is complete.'
  },
  131008: {
    code: 131008,
    title: 'invalid_request',
    description: 'The request format was invalid. This could be due to malformed JSON or incorrect parameter structures.',
    corrective_action: 'Let\'s discuss'
  },
  131016: {
    code: 131016,
    title: 'service_unavailable',
    description: 'A temporary issue with the Meta service. You can typically retry sending the message after a short delay.',
    corrective_action: 'Update MR status to "ServiceUnavailable" -> Manual verification-> Update Status. Don\'t include for message sending until this is complete.'
  },
  131021: {
    code: 131021,
    title: 'message_too_long',
    description: 'The message text exceeds the character limit allowed by WhatsApp.',
    corrective_action: 'No corrective action. Simply update the message status to "MessageTooLong". Because I am assuming that all templates will be pre approved and hence this will not happen?'
  },
  131026: {
    code: 131026,
    title: 'message_not_sent',
    description: 'The message failed to send from Meta\'s servers. This can happen for various reasons, including the user not being on WhatsApp. The message field in the error object often provides more context, such as "Recipient is not a valid WhatsApp user."',
    corrective_action: 'Update MR status to "MessageNotSent" -> Manual verification-> Update Status. Don\'t include for message sending until this is complete.'
  },
  131042: {
    code: 131042,
    title: 'rate_limit_hit',
    description: 'You have exceeded the number of messages you\'re allowed to send from your phone number. This is related to your messaging limits (tier) and quality rating.',
    corrective_action: 'Let\'s discuss'
  },
  131045: {
    code: 131045,
    title: 'template_param_count_mismatch',
    description: 'The number of parameters you provided in your API call does not match the number of variables in the registered message template.',
    corrective_action: 'No corrective action. Simply update the message status to "TemplateParamCountMismatch". Because I am assuming that this will not occur as we are doing validation on the recipient list when it gets uploaded?'
  },
  131047: {
    code: 131047,
    title: 'user_not_opted_in',
    description: 'You are attempting to send a template message to a user who has not opted-in to receive messages from your business.',
    corrective_action: 'Update MR status to "UserNotOptedIn" -> Manual verification (asking user to send hello message or get consent from him etc)-> Update Status. Don\'t include for message sending until this is complete.'
  },
  131051: {
    code: 131051,
    title: 'invalid_phone_number',
    description: 'The recipient\'s phone number is invalid or incorrectly formatted. Ensure it includes the country code and follows the correct structure.',
    corrective_action: 'No corrective action. Simply update the message status to "InvalidPhoneNumber". Because I am assuming that this will not occur as we are doing phone number validation?'
  },
  131052: {
    code: 131052,
    title: 'recipient_unreachable',
    description: 'The recipient cannot receive the message at this time, often because their device is offline or has no internet connection. The platform will attempt redelivery for a period (up to 30 days), but if it ultimately fails, this error may be triggered.',
    corrective_action: 'Update MR status to "RecipientUnreachable" -> Manual verification (asking user to send hello message or get consent from him etc)-> Update Status. Don\'t include for message sending until this is complete.'
  },
  131053: {
    code: 131053,
    title: 'recipient_in_violating_country',
    description: 'The message cannot be sent because the recipient is in a country where WhatsApp Business messaging is restricted or not supported.',
    corrective_action: 'No corrective action. Simply update the message status to "RecipientInViolatingCountry". Because I presume this will not occur for us since we are validating?'
  },
  131054: {
    code: 131054,
    title: 'message_undeliverable',
    description: 'A general delivery failure. This can be due to the recipient blocking your business number or other underlying issues preventing delivery.',
    corrective_action: 'Update MR status to "MessageUndeliverable" -> Manual verification-> Update Status. Don\'t include for message sending until this is complete.'
  }
};

export function getErrorInfo(errorCode?: number): WhatsAppErrorInfo | null {
  if (!errorCode) return null;
  return WHATSAPP_ERROR_CODES[errorCode] || null;
}

export function formatErrorMessage(errorMessage?: string, errorCode?: number, errorTitle?: string): string {
  if (!errorMessage && !errorCode) return '';
  
  const errorInfo = getErrorInfo(errorCode);
  
  if (errorInfo) {
    return `[${errorCode}] ${errorInfo.title}: ${errorMessage || errorInfo.description}`;
  }
  
  if (errorCode && errorTitle) {
    return `[${errorCode}] ${errorTitle}: ${errorMessage || 'Unknown error'}`;
  }
  
  if (errorCode) {
    return `[${errorCode}] ${errorMessage || 'Unknown error'}`;
  }
  
  return errorMessage || 'Unknown error';
}

export function getErrorTooltip(errorCode?: number): string {
  if (!errorCode) return '';
  
  const errorInfo = getErrorInfo(errorCode);
  if (!errorInfo) return '';
  
  return `${errorInfo.description}\n\nCorrective Action: ${errorInfo.corrective_action}`;
}