import { createDfuseClient, DfuseClient,StateResponse } from "@dfuse/client"

;(global as any).fetch = require("node-fetch")
;(global as any).WebSocket = require("ws")

const inquirer = require('inquirer');
var blockNum: number; 
var account: string;

const tokenMap: any = { "EOS": "eosio.token", "IQ": "everipediaiq", "MAIL": "d.mail", "FAST": "fastecoadmin", "PEOS": "thepeostoken", 
"DICE": "betdicetoken", "ZKS": "zkstokensr4u", "FISH": "fishjoytoken","HVT": "hirevibeshvt","JKR": "eosjackscoin","TRYBE": "trybetoken","PKE": "pokereotoken"}

async function askAnswers(): Promise<any> {

    const answers = await inquirer
    .prompt([
      {
        name: 'account',
        message: 'What is your account name?', 
        default: "testkauffman",
      },
      {
        type: 'checkbox',
        name: 'tokens',
        pageSize: Object.keys(tokenMap).length,
        message: 'Which tokens would you like to query?',
        choices: Object.keys(tokenMap)
      },
      {
        name: 'method',
        type: 'list',
        message: 'Would you like to specify a timestamp or a block number?',
        choices: ['block number','timestamp'],
      },
      {
        name: 'blocknumber',
        type: 'input',
        when: (answers: any) => { return answers.method === "block number"},
        message: 'Enter the block number:',
        default: 60000000
      },
      {
        name: 'timestamp',
        type: 'input',
        when: (answers: any) => { return answers.method === "timestamp"},
        message: 'Enter the timestamp:',
        default: "2019-01-01T00:00:00.0Z"
      },
    ])   
    return answers
}

async function main() {
    const client = createDfuseClient({
      apiKey: "mobile_a3ebdd87f063944c54df0ef8638a6401",
      network: "mainnet"
    })
    const answers = await askAnswers()
    let blockNum = 1
  if(answers.method === "timestamp") {  
  try {  
    let block = await client.fetchBlockIdByTime(answers.timestamp, "gte")
    if(block){
      blockNum = block.block.num
    }
    console.log("Block id by time response", prettifyJson(blockNum))
  } catch (error) {
    console.log("An error occurred", error)
  }
}
else {
  blockNum = answers.blocknumber
}
  
  answers.tokens.map(async (token: string) => {
    try { 
      const results = await fetchBalance(client, blockNum, answers.account, token)
      if (results.balances.length > 0) {
      console.log(`Your ${token} balance at block ${results.blockNum} was ${results.balances}`)
      }
      else {
        console.log(`                                                                               The account ${answers.account} held no ${token} tokens at block ${results.blockNum}`)
      }

    } catch (error) {
      console.log("An error occurred", JSON.stringify(error))
    }
  
    client.release()
  })
  
  }

  async function fetchBalance(
    client: DfuseClient,
    atBlock: number,
    account: string,
    token: string
  ): Promise<{ balances: string[]; blockNum: number; }> {
    const options = { blockNum: atBlock === undefined ? undefined : atBlock }
    let response: StateResponse | undefined
    try {
     response = await client.stateTable<any>(
      tokenMap[token],
      account,
      "accounts",
      options
    )
    }catch {
       response = undefined
    }
    if(response && response.rows){
      const rows = (response as StateResponse).rows
      const balances = rows.filter((row: any) => {
        return row.payer === account
      }).map((row: any) => row.json.balance)
      
      return { balances, blockNum: atBlock }
    }
    
    return { balances: [], blockNum: atBlock }
  }

  main().then(() => {
    console.log("Completed")
  }).catch((error) => console.log(error))

  export function prettifyJson(input: unknown): string {
    return JSON.stringify(input, undefined, 2)
  }
  
