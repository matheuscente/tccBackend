function birthDateFormat(date: string): Date {
        const parts = date.split('/')

        if(parts.length !== 3) {
            throw new Error('Data inválida!')
        }
        const day = parseInt(parts[0]!, 10)
        const month = parseInt(parts[1]!, 10) - 1
        const year = parseInt(parts[2]!, 10)

        console.log(`${day}/${month}/${year}`)

        return new Date(Date.UTC(year, month, day, 0, 0, 0))
    }

    console.log(birthDateFormat('31/10/2001'))