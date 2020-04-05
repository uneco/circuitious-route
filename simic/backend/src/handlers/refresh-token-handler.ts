import  * as Express from "express";
import { SQL, SQLStatement } from "sql-template-strings"
import { TokenNotFoundError} from "../error"
import { defineSchema, ValidationError, assertValid } from "@japan-d2/schema"

type Token = string
export const refreshTokenHandler = (
  deps: {
    executeQuery: Promise<(sql: string | SQLStatement) => Promise<any>>,
    generateRandomString: () => string,
    sign: (obj: { discordId: string }) => Token,
  }
) => async (req: Express.Request, res: Express.Response) => {
  const schema = defineSchema().string("refreshToken")
  try {
    assertValid(req.body, schema)
    const executeQuery = await deps.executeQuery
    const [token] = await executeQuery(SQL`SELECT * FROM refresh_tokens WHERE token = ${req.body.refreshToken} AND activated = true AND datetime('now', '-6 months') < refresh_tokens.created_at;`)
    if(!token) {
      throw TokenNotFoundError
    }

    try {
      const newToken = deps.generateRandomString()
      await executeQuery(SQL`BEGIN TRANSACTION;`)
      await executeQuery(SQL`UPDATE refresh_tokens SET created_at = datetime('now'), token = ${newToken} WHERE token = ${req.body.refreshToken} AND activated = true AND datetime('now', '-6 months') < refresh_tokens.created_at;`)
      await executeQuery(SQL`COMMIT;`)
      res.status(201).json( {
        token: deps.sign({
          discordId: token.discordId
        }),
        refreshToken: token.token
      })
    } catch (err) {
      await executeQuery(SQL`ROLLBACK;`)
      res.status(500).json({})
    }
  } catch(err) {
    if(err instanceof ValidationError) {
      return res.status(400).json({error: err})
    }
    res.status(401).json({})
  }
}
