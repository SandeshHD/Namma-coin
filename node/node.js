import { Block } from "./components/block.js";
import { BlockChain } from "./components/blockchain.js";
import { MemPool } from "./components/mempool.js";
import crypto from "node:crypto";
import { MerkleTree } from "./components/merkle.js";
import { Wallet } from "./components/wallet.js";
import { StorageEngine } from "./components/storageEngine.js";
import sizeof from "object-sizeof";
import { P2PServer } from "./components/p2pserver.js";
export class Node {
  blockChain;
  #mempool;
  storageEngine;
  wallet;
  p2pServer;
  peers;

  constructor() {
    this.#mempool = new MemPool();
    this.blockChain = new BlockChain("00", 10000000);
    this.storageEngine = new StorageEngine();
    this.wallet = new Wallet();
    
    // configuring according to other nodes ports
    this.peers = [
      // {
      //   ip: '127.0.0.1',
      //   port: 3002
      // },
      // {
      //   ip: '127.0.0.1',
      //   port: 3004
      // },
    ]
    this.p2pServer = new P2PServer(this);
    this.connectToAllPeers();

    // start: only for running first node
    const initialTransaction = {
      time: Date.now(),
      inputs: [],
      outputs: [
        {
          value: 10000,
          addr: this.wallet.getWallet(1)?.publicKey,
        },
      ]
    };
    initialTransaction['size'] = sizeof(initialTransaction);
    initialTransaction['hash'] = this.hash(initialTransaction);
    this.mineAndAddBlock([initialTransaction], true);
    // end: only for running first node
    console.log("Blockchain Ready!!");
  }

  getMemPool() {
    return this.#mempool;
  }

  connectToAllPeers(){
    this.peers.forEach(peer=>{
      this.p2pServer.connectToPeer(peer.ip,peer.port)
    })
  }

  async getBlock(hash){
    try{
      const block = await this.storageEngine.getBlock(hash)
      return block;
    }catch(err){
      return false
    }
  }

  async addToMempool(transaction) {
    const index = this.#mempool.getMemPool().findIndex((txn)=> txn.hash === transaction.hash)
    if(index===-1){
      const validated = await this.validateTransaction(transaction)
      if (validated) {
        this.#mempool.addToMemPool(transaction);
        this.p2pServer.sendTransaction(transaction);
        return true;
      }
      return false;
    }
  }

  removeFromMempool(transactions) {
    this.#mempool.removeFromMemPool(transactions);
  }

  async addTransactionFees(transactions){
    const myWallet = this.wallet.getWallet(1);
    const newTransactions = []
    for(const transaction of transactions){
      if(transaction.inputs.length){
            let inputSum = 0;
            for(const input of transaction.inputs){
                let transactionOutput = await this.fetchTransactionOutput(
                    input.prev_out.hash,
                    input.prev_out.n
                );
                if(transactionOutput)
                    inputSum += (transactionOutput.value??0);
            }
            let outputSum = 0;
            transaction.outputs.forEach((output) => {
              outputSum += output.value;
            });
        
            if(inputSum > outputSum){
                const newTransaction = transaction;
                newTransaction.outputs.push({
                    value: inputSum-outputSum,
                    addr: myWallet.publicKey
                })
                newTransactions.push(newTransaction)
            }else if(inputSum===outputSum){
              newTransactions.push(transaction)
            }
        }else{
            newTransactions.push(transaction)
        }
    }

    return newTransactions;
  }

  async mineAndAddBlock(transactions, isGenesis = false) {
    if (this.blockChain.getChain().length <= this.blockChain.getMaxBlocks()) {
      transactions = await this.addTransactionFees(transactions);
      console.log(transactions)
      if(transactions.length===0)
        return false;
      
      if(!isGenesis){
        const initialTransaction = {
          time: Date.now(),
          inputs: [],
          outputs: [
            {
              value: 50,
              addr: this.wallet.getWallet(1)?.publicKey,
            },
          ]
        };
        initialTransaction['size'] = sizeof(initialTransaction);
        initialTransaction['hash'] = this.hash(initialTransaction);
        transactions = [initialTransaction,...transactions];  
      }
      const block = new Block(this.blockChain.getLastBlockHash(), transactions);
      const [hash, nonce] = this.mining(
        block.getHeader(),
        BlockChain.difficulty
      );
      block.setHash(hash);
      block.setNonce(nonce);
      let isValid = true;
      if (!isGenesis) {
        isValid = await this.validateBlock(block, this.blockChain.getChain().length);
        console.log("Validity"+isValid)
      }
      if (isValid) {
        this.blockChain.addToChain(block);
        let blockJSON = block.toJSON();
        await this.storageEngine.addBlock(blockJSON);
        this.p2pServer.sendBlock(blockJSON);
        this.removeFromMempool(transactions);
        this.finalizeTransactions(transactions);
        BlockChain.blockCount++;
        return true;
      }
      return false;
    }
  }

  getAllPublicKeys(){
    return this.wallet.getAllPublicKeys();
  }

  async addBlock(block){
    block = Block.fromJSON(block);
    const isValid = await this.validateBlock(block,this.blockChain.getChain().length)
    if(isValid){
      this.blockChain.addToChain(block);
      this.removeFromMempool(block.getTransactions());
      this.finalizeTransactions(block.getTransactions());
      BlockChain.blockCount++;
      return true;
    }
    return false;
  }

  async finalizeTransactions(transactions) {
    try {
      for (const transaction of transactions) {
        for (const txn_input of transaction?.inputs) {
          const publicKey = txn_input.scriptSig.split(" ")[1];
          await this.storageEngine.removeUTXO(
            publicKey,
            txn_input.prev_out.hash
          );
        }
        for (const txn_out of transaction?.outputs) {
            await this.storageEngine.addUTXO(txn_out.addr, transaction.hash);
        }
        await this.storageEngine.addTransaction(transaction);
      }
      return true;
    } catch (err) {
      console.log(err);
    }
    return false;
  }

  mining(params, difficulty) {
    var nonce = 0;
    var hash = "";
    while (!hash.startsWith(difficulty)) {
      params = {
        ...params,
        nonce: nonce++,
      };
      hash = this.hash(params);
    }
    return [hash, nonce - 1];
  }

  hash(data) {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
  }

  async isValidUTXO(hash,publicKey){
    try{
      const utxos = await this.storageEngine.getWalletUTXOs(publicKey);
      return utxos.find(utxo=> utxo.hash === hash)
    }catch(err){
      return false;
    }
  }

  async validateTransaction(transaction,mempool=true) {
    let txn = structuredClone(transaction)
    let fees;
    if(!mempool && txn.outputs.length > 1)
      fees = txn.outputs.pop()
    delete txn["hash"];

    // check the hash
    if (this.hash(txn) !== transaction.hash) return false;

    if(!mempool&&fees){
      txn.outputs.push(fees)
    }
    // sumup inputs and check if it is >= output
    let inputSum = 0;
    let transactionOutputs = [];
    for(const input of txn.inputs){
        const isValidUTXO = await this.isValidUTXO(input.prev_out.hash,input.scriptSig.split(" ")[1])
        if(isValidUTXO){
            let transactionOutput = await this.fetchTransactionOutput(
              input.prev_out.hash,
              input.prev_out.n
            );
            if(!transactionOutput)
                return false;
            inputSum += transactionOutput.value;
            transactionOutputs.push({...transactionOutput,hash: input.prev_out.hash, n: input.prev_out.n});
        }else{
            return false;
        }
    }

    let outputSum = 0;
    txn.outputs.forEach((output) => {
      outputSum += output.value;
    });

    if (inputSum < outputSum && txn.inputs.length>0) {
      return false;
    }

    // validate the inputs by verifying the digital signatures.
    //  1. fetch transaction out using the hash and n value
    //  2. verify the digital signature against the fetched out using the public key in the digital signature
    let verified = true;
    txn.inputs.forEach((input, i) => {
      const verify = crypto
        .createVerify("SHA256")
        .update(JSON.stringify(transactionOutputs[i]))
        .end();
      verified =
        verified &&
        verify.verify(
          {
            key: Buffer.from(input.scriptSig.split(" ")[1], "hex"),
            format: "der",
            type: "spki",
          },
          input.scriptSig.split(" ")[0],
          "base64"
        );
    });

    if (!verified) return false;

    return true;
  }

  async fetchTransactionOutput(hash, index) {
    try{
      const transaction = await this.storageEngine.getTransaction(hash);
      if(transaction)
          return transaction["outputs"][index];
      return false;
    }catch(err){
      return false;
    }
  }

  async validateBlock(block, index) {
    let blockHash = block.getHash();
    let blockHeader = {
      ...block.getHeader(),
      nonce: block.getNonce(),
    };

    // check if block already exists
    const exists = await this.storageEngine.blockExists(block.getHash());
    console.log(exists)
    if(exists){
      return false;  
    }

    //Check hash
    if (this.hash(blockHeader) !== blockHash) return false;

    // verify proof of work
    let difficulty = block.getDifficulty();
    if (!blockHash.startsWith(difficulty)) return false;

    // verify previousHash
    if (
      block.getPreviousHash() !==
      this.blockChain.getChain()[index - 1].getHash()
    ) {
      return false;
    }

    // verify merkle root
    let merkleTree = new MerkleTree(block.getTransactions());
    if (block.getMerkleRoot() !== merkleTree.getRoot()) return false;

    // verify transactions
    let verified = true;
    let blockTransactions = block.getTransactions().slice(1);
    for(const transaction of blockTransactions){
        let transactionValidated = await this.validateTransaction(transaction,false);
        verified = verified && transactionValidated;
    }
    if (!verified) return false;

    return true;
  }

  sendMoney(transaction,wallet){
    return this.wallet.sendMoney(transaction,wallet);
  }

  serializeBlockChain(){
    return this.blockChain.serializeBlockChain()
  }

  async syncBlockChain(blockchain,difficulty){
    const chain = this.blockChain.deserializeBlockChain(blockchain,difficulty);
    let isValid = true;
    const tempChain = chain.slice(1)
    let currentChainLength = this.blockChain.getChain().length
    if(currentChainLength>0){
      for(const [index,block] of tempChain.entries()){
        isValid = isValid && await this.validateBlock(block,index+1)
      }
    }
    if(isValid && chain.length > currentChainLength){
      this.blockChain.setBlockChain(chain);
      for(const block of chain){
        await this.finalizeTransactions(block.getTransactions())
      }
    }
  }

  async syncMemPool(mempool){
    if(mempool.length>0){
      let isValid = true;
      for(const transaction of mempool){
        isValid = isValid && await this.validateTransaction(transaction)
      }
      if(isValid){
        this.getMemPool().setMemPool(mempool);
      }
    
    }
  }
}
