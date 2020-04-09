import  * as Express from "express";
import { SQL, SQLStatement } from "sql-template-strings"
import { TokenNotFoundError} from "../error"

export const verifyHandler = (
  deps: {
    executeQuery: Promise<(sql: string | SQLStatement) => Promise<any>>,
    generateRandomString: () => string,
    verify: (token: string) => {discordId: string}
  }
) => async (req: Express.Request, res: Express.Response) => {
  try {
    const executeQuery = await deps.executeQuery
    const tokenWithType = req.get("Authorization")
    if(!tokenWithType) {
      throw new TokenNotFoundError("Token is not found")
    }
    const [,token] = tokenWithType.split(" ")
    const { discordId } = deps.verify(token)
    const profiles = await executeQuery(SQL`SELECT * FROM profiles WHERE discord_id = ${discordId};`)
    res.status(200).json({
      profiles,
      discordId
    })
  } catch(err) {
    res.status(401).json({error: err})
  }
}
