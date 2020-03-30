import { issueLoginUrlHandler } from "./issue-login-url-handler"
import { SQLStatement } from "sql-template-strings"
import { mockRequest, mockResponse } from "mock-req-res"

describe("issueLoginUrlHandler", () => {
  describe("when not exist discordId", () => {
    const executedQuery = []
    const dummyDeps = {
      executeQuery: Promise.resolve((sql: SQLStatement | string) => {
        if(typeof sql === "string") {
          executedQuery.push(sql)
          return Promise.resolve()
        }
        executedQuery.push(sql.sql)
        return Promise.resolve()
      })
    }
    
    it("should be valid", () => {
      const request = mockRequest({ body: { discordId: 2012123123123 } })
      const response = mockResponse()
      issueLoginUrlHandler(dummyDeps)(request, response)
      expect(response.status.getCall(0).args).toEqual([200])
    })
})
})

