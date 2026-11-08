import type { Joi } from "celebrate"

// mensagens usadas quando o schema não define uma própria: sem isso o Joi responde em inglês
// ({#label} é o nome do campo; os schemas continuam podendo sobrescrever com .messages())
export const joiDefaultMessages: Joi.LanguageMessages = {
    "any.required": "O campo {#label} é obrigatório.",
    "any.unknown": "O campo {#label} não é permitido.",
    "any.only": "O campo {#label} deve ser um dos seguintes valores: {#valids}",
    "any.invalid": "O campo {#label} contém um valor inválido.",

    "string.base": "O campo {#label} deve ser um texto.",
    "string.empty": "O campo {#label} é obrigatório.",
    "string.min": "O campo {#label} deve conter no mínimo {#limit} caracteres.",
    "string.max": "O campo {#label} deve conter no máximo {#limit} caracteres.",
    "string.length": "O campo {#label} deve conter {#limit} caracteres.",
    "string.email": "O campo {#label} deve ser um e-mail válido.",
    "string.guid": "O campo {#label} deve ser um id válido.",
    "string.pattern.base": "O campo {#label} está em um formato inválido.",

    "number.base": "O campo {#label} deve ser um número.",
    "number.integer": "O campo {#label} deve ser um número inteiro.",
    "number.min": "O campo {#label} deve ser no mínimo {#limit}.",
    "number.max": "O campo {#label} deve ser no máximo {#limit}.",
    "number.positive": "O campo {#label} deve ser um número positivo.",

    "boolean.base": "O campo {#label} deve ser verdadeiro ou falso.",
    "date.base": "O campo {#label} deve ser uma data válida.",

    "array.base": "O campo {#label} deve ser uma lista.",
    "array.min": "O campo {#label} deve ter no mínimo {#limit} item(ns).",
    "array.max": "O campo {#label} deve ter no máximo {#limit} item(ns).",
    "array.unique": "O campo {#label} não pode ter itens repetidos.",

    "object.base": "O campo {#label} deve ser um objeto.",
    "object.unknown": "O campo {#label} não é permitido.",
    "object.min": "Informe pelo menos um campo para atualizar.",
    "object.missing": "Informe pelo menos um dos campos: {#peersWithLabels}.",
    "object.xor": "Informe apenas um dos campos: {#peersWithLabels}.",
    "object.oxor": "Informe apenas um dos campos: {#peersWithLabels}.",
    "object.with": "O campo {#mainWithLabel} exige o campo {#peerWithLabel}.",
    "object.without": "O campo {#mainWithLabel} não pode ser enviado junto com {#peerWithLabel}."
}
