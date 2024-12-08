import { BlockChain } from "./blockchain.js";
import { MerkleTree } from "./merkle.js";
export class Block{
    #previousHash;
    #merkleRoot;
    #timeStamp;
    #hash;
    #nonce;
    #difficulty;
    #transactions;
    
    constructor(previousHash,transactions){
        this.#previousHash = previousHash;
        this.#transactions = transactions;
        this.#timeStamp = Date.now();
        this.#difficulty = BlockChain.difficulty;
        this.#merkleRoot = this.generateMerkleTree();
    }
    

    getPreviousHash(){
        return this.#previousHash;
    }

    getTimeStamp(){
        return this.#timeStamp;
    }

    getTransactions(){
        return this.#transactions;
    }

    getHash(){
        return this.#hash;
    }

    getNonce(){
        return this.#nonce;
    }

    getDifficulty(){
        return this.#difficulty;
    }

    getMerkleRoot(){
        return this.#merkleRoot;
    }

    setHash(hash){
        this.#hash=hash;
    }

    setNonce(nonce){
        this.#nonce=nonce
    }

    generateMerkleTree(){
        return new MerkleTree(this.#transactions).getRoot()
    }

    getHeader(){
        return {
            previousHash: this.#previousHash,
            merkleRoot: this.#merkleRoot,
            timeStamp: this.#timeStamp,
            difficulty: this.#difficulty
        }
    }

    toJSON(){
        return {
            previousHash: this.#previousHash,
            merkleRoot: this.#merkleRoot,
            timeStamp: this.#timeStamp,
            hash: this.#hash,
            nonce: this.#nonce,
            difficulty: this.#difficulty,
            transactions: this.#transactions,
        };
    }

    static fromJSON(json) {
        const blockData = typeof json === "string" ? JSON.parse(json) : json;
        const block = new Block(blockData.previousHash, blockData.transactions);
    
        block.setHash(blockData.hash);
        block.setNonce(blockData.nonce);
        block.#merkleRoot = blockData.merkleRoot;
        block.#timeStamp = blockData.timeStamp;
        block.#difficulty = blockData.difficulty;
        return block;
    }
}


// hash params
    // const params = {
    //     previousHash: this.#previousHash,
    //     data: this.#data,
    //     timeStamp: this.#timeStamp,
    //     index: Block.index,
    //     difficulty: this.#difficulty
    // }
    // const [hash,nonce] = mining(params)
    // this.hash = hash;
    // this.nonce = nonce;