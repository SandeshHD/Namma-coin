import express from 'express'
import { Node } from './node/node.js';
const app = express()
const port = process.env.PORT || 3005
app.use(express.json())
const node = new Node();

app.get('/api/mempool',(req,res)=>{
    res.send(node.getMemPool().pool)
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

app.post('/api/transactions',async (req,res)=>{
  const response = await node.addToMempool(req.body);
  if(response){
    return res.send("Transaction Sent Successfully.")
  }
  res.status(400).send("Invalid transaction")
})

app.post('/api/transfer',async (req,res)=>{
  const {transaction,wallet} = req.body;
  const response = await node.sendMoney(transaction,wallet);
  if(response){
    const status = await node.addToMempool(response)
    if(status){
      return res.send(response)
    }
  }
  return res.status(400).send("Transaction Failed!")
})

app.get('/api/block/:block',async (req,res)=>{
  const hash = req.params.block;
  if(hash){
    const block = await node.getBlock(hash);
    if(block){
      return res.send(block)
    }
    return res.status(400).send("Block Not found!")
  }else{
    res.status(400).send("Block Hash is required!")
  }
})

app.get('/api/blocks',(req,res)=>{
  const response = node.blockChain.getChain();
  res.send(response)
})

app.get('/api/wallets',(req,res)=>{
  const response = node.getAllPublicKeys();
  res.send(response)
})


app.post('/api/mining',async (req,res)=>{
  const mineStatus = await node.mineAndAddBlock(req.body);
    if(mineStatus){
      return res.send("Block added successfully")
    }
    res.status(400).send("Invalid transaction")
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})