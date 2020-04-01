import { defineSchema, ValidationError, assertValid } from "@japan-d2/schema"
import { SQL, SQLStatement } from "sql-template-strings"
import * as Express from "express";
import { UserNotFoundError } from "../error"

type Token = string

export const issueAuthorizedTokenHandler:(deps: {
  executeQuery: Promise<(sql: string | SQLStatement) => Promise<any>>,
  sign: (obj: { discordId: string }) => Token,
  generateRandomString: () => string
}) => (req: Express.Request, res: Express.Response) => Promise<void> = (deps) => async (req, res) => {
  const executeQuery = await deps.executeQuery
  const inputSchema = defineSchema().number("discordId")
  const payload = req.body
  try {
    assertValid(payload, inputSchema)
    const refreshToken = await executeQuery(SQL`SELECT * FROM refresh_tokens WHERE discord_id = ${payload.discordId} AND enabled = 1;`)
    const user = await executeQuery(SQL`SELECT * FROM users WHERE discord_id = ${payload.discordId};`)

    if(!user) {
      throw new UserNotFoundError(`${payload.discordId} is not found`)
    }
    if(refreshToken.length === 0) {
      const refreshToken = deps.generateRandomString()
      await executeQuery(SQL`INSERT INTO refresh_tokens (discord_id, token, activated, created_at) VALUES (${payload.discordId}, ${refreshToken}, 1, strftime('%s', 'now'));`)
      res.status(201).json({
        refreshToken: refreshToken,
        accessToken: deps.sign({discordId: payload.discordId.toString()})
      })
    } else {
      res.status(401).json({})
    }
  } catch (err) {
    if(err instanceof ValidationError) {
      res.status(400).json({ error: err })
    } else if(err instanceof UserNotFoundError) {
      res.status(401).json({ error: err })
    }  else {
      res.status(500).json({
        error: err
      })
    }
  }
}
