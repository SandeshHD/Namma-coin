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

    validateBlockChain(){
        // go to each block and verify the chain
    }

}

// const chain = new BlockChain(2,500);
