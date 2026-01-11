import type { Response } from "express";

export abstract class ErrorBase extends Error {
    constructor(protected status: number, message: string) {
        super(message)
    }

    send(res: Response) {
        res.status(this.status).json({message: this.message})
    }

}