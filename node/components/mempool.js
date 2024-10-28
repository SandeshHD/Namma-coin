export class MemPool{
    pool=[]

    getMemPool(){
        return this.pool;
    }

    setMemPool(pool){
        this.pool=pool;
    }

    addToMemPool(transaction){
        this.pool = [...this.pool,transaction];
    }

    removeFromMemPool(transactions){
        transactions.forEach(transaction=>{
            this.pool = this.pool.filter(txn=>txn.hash!=transaction.hash)
        })
    }
}