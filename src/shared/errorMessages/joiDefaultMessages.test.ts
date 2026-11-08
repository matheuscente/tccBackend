import { Joi } from "celebrate";
import { joiDefaultMessages } from "./joiDefaultMessages";
import { FindByIdSchema } from "../schemas/find-by-id.schema";

describe("joiDefaultMessages", () => {
  const options: Joi.ValidationOptions = { messages: joiDefaultMessages, errors: { wrap: { label: false, array: false } }, abortEarly: false };

  const messagesOf = (schema: Joi.Schema, value: unknown) =>
    (schema.validate(value, options).error?.details ?? []).map((detail) => detail.message);

  it("deve recusar campo desconhecido em português", () => {
    const schema = Joi.object({ title: Joi.string() }).unknown(false);

    expect(messagesOf(schema, { titulo: "x" })).toEqual(["O campo titulo não é permitido."]);
  });

  it("deve usar português nas regras sem mensagem própria", () => {
    const schema = Joi.object({
      id: Joi.string().uuid({ version: "uuidv4" }),
      page: Joi.number().integer(),
      done: Joi.boolean(),
      name: Joi.string().required(),
    }).xor("a", "b").keys({ a: Joi.string(), b: Joi.string() });

    expect(messagesOf(schema, { id: "abc", page: "x", done: "talvez" })).toEqual([
      "O campo id deve ser um id válido.",
      "O campo page deve ser um número.",
      "O campo done deve ser verdadeiro ou falso.",
      "O campo name é obrigatório.",
      "Informe pelo menos um dos campos: a, b.",
    ]);
  });

  it("deve manter a mensagem definida no próprio schema", () => {
    const schema = Joi.object({ title: Joi.string().required().messages({ "any.required": "Informe o título." }) });

    expect(messagesOf(schema, {})).toEqual(["Informe o título."]);
  });

  it("deve explicar id inválido nas rotas /:id", () => {
    expect(messagesOf(FindByIdSchema, { id: "123" })).toEqual(["O campo id deve ser um id válido."]);
  });

  it("não deve sobrar mensagem em inglês", () => {
    const english = /\b(must|is not allowed|is required|valid GUID|at least one of)\b/;

    Object.values(joiDefaultMessages).forEach((message) => expect(String(message)).not.toMatch(english));
  });
});
