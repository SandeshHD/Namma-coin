import { Block } from "./components/block.js";
import { BlockChain } from "./components/blockchain.js";
import { MemPool } from "./components/mempool.js";
import crypto from "node:crypto";
import { MerkleTree } from "./components/merkle.js";
import { Wallet } from "./components/wallet.js";
import { StorageEngine } from "./components/storageEngine.js";
import sizeof from "object-sizeof";
export class Node {
  blockChain;
  #mempool;
  storageEngine;
  peerDB;
  wallet;

  constructor() {
    this.#mempool = new MemPool();
    this.blockChain = new BlockChain("00", 10000000);
    this.storageEngine = new StorageEngine();
    this.wallet = new Wallet();
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
    this.addBlock([initialTransaction], true);
    console.log("Blockchain Ready!!");
  }

  getMemPool() {
    return this.#mempool;
  }

  addToMempool(transaction) {
    if (this.validateTransaction(transaction)) {
      this.#mempool.addToMemPool(transaction);
      return true;
    }
    return false;
  }

  removeFromMempool(transactions) {
    this.#mempool.removeFromMemPool(transactions);
  }

  async addBlock(transactions, isGenesis = false) {
    if (this.blockChain.getChain().length <= this.blockChain.getMaxBlocks()) {
      const block = new Block(this.blockChain.getLastBlockHash(), transactions);
      const [hash, nonce] = this.mining(
        block.getHeader(),
        BlockChain.difficulty
      );
      block.setHash(hash);
      block.setNonce(nonce);
      let isValid = true;
      if (!isGenesis) {
        isValid = this.validateBlock(block, this.blockChain.getChain().length);
      }
      if (isValid) {
        this.blockChain.addToChain(block);
        this.removeFromMempool(transactions);
        this.finalizeTransactions(transactions);
        BlockChain.blockCount++;
        return true;
      }
      return false;
    }
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
        return true;
      }
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

  validateTransaction(transaction) {
    let txn = { ...transaction };
    delete txn["hash"];

    // check the hash
    if (this.hash(txn) !== transaction.hash) return false;

    // sumup inputs and check if it is <= output
    let inputSum = 0;
    let transactionOutputs = [];
    txn.inputs.forEach((input) => {
      let transactionOutput = this.fetchTransactionOutput(
        input.prev_out.hash,
        input.prev_out.n
      );
      inputSum += transactionOutput.value;
      transactionOutputs.push(transactionOutput);
    });

    let outputSum = 0;
    txn.outputs.forEach((output) => {
      outputSum += output.value;
    });

    if (inputSum < outputSum) {
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
    const transaction = await this.storageEngine.getTransaction(hash);
    return transaction["outputs"][index];
  }

  validateBlock(block, index) {
    // verifyHash
    let blockHash = block.getHash();
    let blockHeader = {
      ...block.getHeader(),
      nonce: block.getNonce(),
    };
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
    block.getTransactions().forEach((transaction) => {
      verified = verified && this.validateTransaction(transaction);
    });
    if (!verified) return false;

    return true;
  }

  sendMoney(transaction,wallet){
    return this.wallet.sendMoney(transaction,wallet);
  }
}
