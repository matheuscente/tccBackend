import { isCelebrateError } from "celebrate";
import { ValidationError } from "./validation-error";
import type { HttpItemResponseError } from "./interfaces/http-item-response-error.dto";

class CelebrateValidationError extends ValidationError {
  constructor(err: Error) {
    if (!isCelebrateError(err)) {
      super("Erro de validação");
      return;
    }

    const details: HttpItemResponseError[] = Array.from(err.details.values())
      .flatMap((joiError) => joiError.details)
      .map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

    super(details);
  }
}

export default CelebrateValidationError;
