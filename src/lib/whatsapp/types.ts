export class WhatsAppServiceError extends Error {
  code: string;

  constructor(message: string, code = "WHATSAPP_ERROR") {
    super(message);
    this.name = "WhatsAppServiceError";
    this.code = code;
  }
}
