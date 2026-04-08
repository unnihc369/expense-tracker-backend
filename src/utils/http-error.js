/** Structured HTTP error for the global error handler */
export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {{ code?: string; details?: unknown }} [extra]
   */
  constructor(status, message, extra = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = extra.code;
    this.details = extra.details;
  }
}
