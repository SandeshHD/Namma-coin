import express from 'express'
import { Node } from './node/node.js';
const app = express()
const port = process.env.PORT || 3005
app.use(express.json())
const node = new Node();

app.get('/api/mempool',(req,res)=>{
    res.send(node.getMemPool())
})

app.get('/api/utxo/:key',async (req,res)=>{
    const publicKey = req.params.key
    const response = await node.storageEngine.getWalletUTXOs(publicKey)
    res.send(response)
})

app.get('/api/balance/:key',async (req,res)=>{
    const publicKey = req.params.key
    const response = await node.storageEngine.getBalance(publicKey)
    res.send({balance:response})
})

app.post('/api/transactions',(req,res)=>{
  if(node.addToMempool(req.body)){
    return res.send("Transaction Sent Successfully.")
  }
  res.status(400).send("Invalid transaction")
})

app.post('/api/transfer',async (req,res)=>{
  const {transaction,wallet} = req.body;
  const response = await node.sendMoney(transaction,wallet);
  if(response)
    return res.send(response)
  return res.status(400).send("Transaction Failed!")
})

app.post('/api/mining',(req,res)=>{
    if(node.addBlock(req.body)){
      return res.send(node.blockChain)
    }
    res.status(400).send("Invalid transaction")
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})