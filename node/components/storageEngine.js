import { Level } from "level";
export class StorageEngine{
    transactions;
    wallets;
    constructor(){
        this.transactions = new Level('./db/transactions', { valueEncoding: 'json' });
        this.wallets = new Level('./db/wallets',{valueEncoding: 'json' });
        this.blocks = new Level('./db/blocks',{valueEncoding: 'json' });
    }

    async addWallet(publicKey){
        return this.wallets.put(publicKey,[]);
    }

    async getWalletUTXOs(publicKey){
        try{
            const utxos = await this.wallets.get(publicKey);
            const result = []
            for(const utxo of utxos){
                const res = await this.getTransaction(utxo);
                result.push(res)
            }
            return result;
        }catch(err){
            await this.addWallet(publicKey)
        }
        return []
    }
    
    async getAllWalletTransactionHashes(publicKey){
        let wallet = [];
        try{
            wallet = await this.wallets.get(publicKey)
        }catch(err){
            await this.addWallet(publicKey)
        }
        return wallet;
    }

    async addUTXO(publicKey,transactionHash){
        const utxos = await this.getAllWalletTransactionHashes(publicKey);
        const uniqueUTXOs = Array.from(new Set([...utxos,transactionHash]))
        return this.wallets.put(publicKey,uniqueUTXOs);
    }

    async removeUTXO(publicKey,hash){
        const utxos = await this.getAllWalletTransactionHashes(publicKey);
        const newUTXOs = utxos.filter(utxo=> utxo!==hash);
        return this.wallets.put(publicKey,newUTXOs); 
    }

    async getBalance(publicKey){
        const utxos = await this.getWalletUTXOs(publicKey);
        let balance = 0;
        for (const utxo of utxos){
            utxo.outputs.forEach(output=>{
                if(output.addr === publicKey){
                    balance+=output.value;
                }
            })
        }
        return balance;
    }
    
    addTransaction(transaction){
        return this.transactions.put(transaction.hash,transaction);
    }

    getTransaction(hash){
        return this.transactions.get(hash);
    }

    getBlock(blockHash){
        return this.blocks.get(blockHash)
    }

    addBlock(block){
        return this.blocks.put(block.hash,block)
    }

    async blockExists(hash){
        try{
            await this.getBlock(hash);
            return true;
        }catch(err){
            console.log("error")
            console.log(err)
            return false;
        }
    }

}

// const storage = new StorageEngine();
// await storage.addUTXO('123456','1234')

// // console.log(storage.getWalletUTXOs('123455'))

// await storage.addTransaction({inputs: [], outputs: [], hash: '1234'})
// const dat = await storage.getTransaction('1234')
// console.log(dat)
// const data = await storage.getWalletUTXOs('123456')
// console.log(data)