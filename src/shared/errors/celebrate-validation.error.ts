import { isCelebrateError } from "celebrate";
import { ValidationError } from "./validation-error";
import type { HttpItemResponseError } from "./interfaces/http-item-response-error.dto";

class CelebrateValidationError extends ValidationError {
  constructor(err: Error) {
    if (!isCelebrateError(err)) {
      super("Erro de validação");
      return;
    }

    // 1. Converte os valores do Map do Celebrate em um array manipulável.
    // O 'err.details' é um Map onde as chaves são as origens (body, query, params)
    // e os valores são os objetos de erro do Joi. Como Maps não aceitam métodos como
    // .map() ou .flatMap(), usamos o Array.from() para transformá-los em um array.
    const details = Array.from(err.details.values())

      // 2. Extrai as listas de erros de cada escopo e as unifica em uma só.
      // Cada erro do Joi possui um array interno chamado 'details'. Se usássemos .map(),
      // teríamos um array de arrays (ex: [[erroDoBody], [erroDaQuery]]).
      // O .flatMap() "achata" a estrutura, combinando tudo em um único array linear.
      .flatMap((joiError) => joiError.details)

      // 3. Transforma cada objeto de erro bruto do Joi no formato esperado pela API.
      // Percorremos o array unificado para mapear apenas as propriedades relevantes.
      .map((detail) => ({
        // O Joi salva o caminho do erro como um array de segmentos (ex: ['items', 0, 'name']).
        // O .join('.') junta esses pedaços usando um ponto, transformando-os em uma string
        // clara e legível que aponta o local exato do erro (ex: 'items.0.name').
        field: detail.path.join("."),

        // Extrai a mensagem explicativa legível do erro gerada pelo próprio Joi
        // (ex: '"username" is required').
        message: detail.message,
      }));

    super(details);
  }
}

export default CelebrateValidationError;
