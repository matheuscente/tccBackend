export abstract class ErrorMessages {
    //string
    static min = (field: string) =>  `O campo ${field} deve conter no mínimo {#limit} digitos.`
    static max = (field: string) =>  `O campo ${field} deve conter no máximo {#limit} digitos.`

    //shared
    static required = (field: string) => `O campo ${field} é obrigatório.`
    static empty = (field: string) => `O campo ${field} é obrigatório.`
    static type = (field: string, type: string) => `O campo ${field} deve ser ${type}`
    static notContain = (field: string, pattern: string) => `O campo ${field} não deve conter ${pattern}`
    static contain = (field: string, pattern: string) => `O campo ${field} deve conter pelo menos ${pattern}`


    //number
    static minNumber = (field: string, qtd: string) => `O campo ${field} deve ter no mínimo ${qtd}`
    static maxNumber = (field: string, qtd: string) => `O campo ${field} deve ter no mínimo ${qtd}`

    //regex
    static regex = (field: string, pattern: string) => `O campo ${field} deve ter o padrão ${pattern}`

    //predefined values
    static predefinedValues = (field: string) => `O campo ${field} deve ser um dos seguintes valores: {#valids}`
        
}