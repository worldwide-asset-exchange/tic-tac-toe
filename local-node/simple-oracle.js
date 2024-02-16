const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');  // development only
const fetch = require('node-fetch');                                // node only
const { TextDecoder, TextEncoder } = require('util');               // node only
const KEY="5JKxAqBoQuAYSh6YMcjxcougPpt1pi9L4PyJHwEQuZgYYgkWpjS"
const privateKeys = [KEY]; // private key of vstrike

const signatureProvider = new JsSignatureProvider(privateKeys);
const rpc = new JsonRpc('http://localhost:8801', { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

let setRand = async (job_id) => {
  let transaction = {
    actions: [
        {
          account: "orng.wax",
          name: "setrand",
          data: {
            job_id: job_id,
            random_value: Math.floor(Math.random() * 100000).toString()
          },
          authorization: [
           {
              actor: "oracle.wax",
              permission: "active"
            }
          ]
        }
      ]
  };
  let tx = await api.transact(transaction, { blocksBehind: 3, expireSeconds: 30 , broadcast: true, sign: true});
}

let main = async () => {
  console.log("Start simple oracle service...")
  while(true) {
    let table = await rpc.get_table_rows({
        code: "orng.wax",
        scope: "orng.wax",
        table: "jobs.a",
    })
    for( row of table.rows){
      let job_id = row.id;
      console.log("Update random job:", job_id);
      await setRand(job_id);
    }
  }
}
main();