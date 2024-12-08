import { Block } from "./block.js";

export class BlockChain{
    static difficulty;
    #maxBlocks;
    static blockCount;
    #chain = [];
    constructor(difficulty,maxBlocks){
        BlockChain.difficulty = difficulty;
        this.#maxBlocks = maxBlocks;
    }

    getMaxBlocks(){
        return this.#maxBlocks;
    }

    getChain(){
        return this.#chain;
    }

    addToChain(block){
        this.#chain.push(block);
    }

    setBlockChain(chain){
        this.#chain = chain;
    }

    getLastBlockHash(){
        if(this.#chain.length===0){
            return "";
        }
        return this.#chain[this.#chain.length-1]?.getHash();
    }

    serializeBlockChain(){
        return this.#chain.map(block=> block.toJSON())
    }

    deserializeBlockChain(blockchain){
        return blockchain.map((blockData) =>
            Block.fromJSON(blockData)
        );
    }
}

// const chain = new BlockChain(2,500);
