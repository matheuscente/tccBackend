import type { Response } from "express";
import type { HttpResponseError } from "./interfaces/http-response-error.dto";
import type { HttpItemResponseError } from "./interfaces/http-item-response-error.dto";

export abstract class ErrorBase extends Error {
    private errors: HttpItemResponseError[]

    constructor(protected status: number, message: string | Array<HttpItemResponseError>) {
        super(Array.isArray(message) ? message.join(', '): message)

        if(Array.isArray(message))  this.errors = message
                   
         else this.errors = [{
            message: message
         }]
    }

    send(res: Response) {


        const response: HttpResponseError = {
            statusCode: this.status,
            state: "error",
            data: this.errors
        }
        res.status(this.status).json({...response})
    }

}