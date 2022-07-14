const Caver = require('caver-js');
const env = require('dotenv').config({path: 'configs/.env'});

async function main(){
    try{
        await run()
    } catch (err){
        console.error(err)
    }
}

main();

async function run(){
    const caver = new Caver(new Caver.providers.HttpProvider('https://public-node-api.klaytnapi.com/v1/baobab'))
    const senderKeyring = caver.wallet.keyring.create(env.parsed.ACCOUNT_ADDRESS, env.parsed.PRIVATE_KEY)
    caver.wallet.add(senderKeyring)
    const newKeys = [env.parsed.PRIVATE_KEY, env.parsed.PRIVATE_KEY_1, env.parsed.PRIVATE_KEY_2]    
    const newKeyring = caver.wallet.keyring.create(senderKeyring.address, newKeys)

    const account = newKeyring.toAccount({threshold: 2, weights:[1,1,1]})

    console.log(account)
    const accountUpdate = caver.transaction.accountUpdate.create({
        from: senderKeyring.address,
        account: account,
        gas: 100000,
    })

    await caver.wallet.sign(senderKeyring.address, accountUpdate)

    const receipt = await caver.rpc.klay.sendRawTransaction(accountUpdate)
    console.log(`Account Update Transaction receipt => `)
    console.log(receipt)

    // Get accountKey from network
    const accountKey = await caver.rpc.klay.getAccountKey(senderKeyring.address)
    console.log(`Result of account key update to AccountKeyWeightedMultiSig`)
    console.log(`Account address: ${senderKeyring.address}`)
    console.log(`accountKey =>`)
    console.log(accountKey)

    // caver.wallet.updateKeyring()
    caver.wallet.updateKeyring(newKeyring)

    const vt = caver.transaction.valueTransfer.create({
        from: senderKeyring.address,
        to: senderKeyring.address,
        value: 1,
        gas: 100000,
    })

    // Sign the transaction with updated keyring
    // This sign function will sign the transaction with all private keys in the keyring
    await caver.wallet.sign(senderKeyring.address, vt)
    // Send transaction
    const vtReceipt = await caver.rpc.klay.sendRawTransaction(vt)
    console.log(`Receipt of value transfer transaction after account update => `)
    console.log(vtReceipt)

}