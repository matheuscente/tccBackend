import { prisma } from "../lib/prisma.js"
import { InternalServerError } from "../shared/errors/internal-server-error.js";
import type { bdTest } from "../models/bdTest.model.js";

export async function startBDTest() {

  // Criar um registro na tabela 'test'
  const newRegister: bdTest = await prisma.test.create({
    data: {
      message: "Hello World BD!",
    },
  });
  console.log("Registro criado:", newRegister);

  // Listar todos os registros da tabela 'test'
  let allRegisters: bdTest[] = await prisma.test.findMany();
  console.log("Todos os registros:", allRegisters);


  //desestrutura o primeiro registro para a variável item
  const [item] = allRegisters


  //verifica se item existe e se a quantidade de itens do array é exatamente 1, senão retorna erro
  if(item && allRegisters.length === 1) {
    //deleta registro item
    await prisma.test.delete({where: {id: item.id}})

    //busca itens atualizados no banco
    allRegisters = await prisma.test.findMany();

    //se quantidade maior que 0, retorna
    if(allRegisters.length > 0) {
      throw new InternalServerError("quantidade de registros inválida")
    }
  }
    else {
    throw new InternalServerError("quantidade de registros inválida")
    }

  console.log(`itens apagados, quantidade total: ${allRegisters.length}`)
  console.log("sucesso!")

}
