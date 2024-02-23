import {useState} from 'react'
import './App.css'
import {generateKey, sign} from "@algorandfoundation/webcrypto";
import {KeyPairRecord} from "@algorandfoundation/webcrypto/types";
import algosdk from 'algosdk';
import {algod} from "./algod.ts";
import {useQuery} from "@tanstack/react-query";

type TxnResult = {
    'confirmed-round': number,
    id: string
}
function App() {
  const [isWaiting, setIsWaiting] = useState(false)
  const [kpr, setKeyPairRecord] = useState<KeyPairRecord | null>(null);




  const accountInfo = useQuery({
    refetchInterval: 3000,
    queryKey: ['accountInfo', kpr?.id.toString()],
    queryFn: async () => {
      if(!kpr) throw new Error('No key pair record')
      return await algod.accountInformation(kpr.id.toString()).do()
    },
    enabled: !!kpr
  })

  const [txnResult, setTxnResult] = useState<TxnResult | null>(null);

    async function handleGenerateKey(){
        generateKey().then((_kpr) => {
            setKeyPairRecord(_kpr)
        })
    }
    async function handlePaymentTxn() {
        if(!kpr) return
        setIsWaiting(true)
        const suggestedParams = await algod.getTransactionParams().do();
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: kpr.id.toString(),
            suggestedParams,
            to: kpr.id.toString(),
            amount: 0,
        });
        const signedTxn = await sign(txn, kpr)
        const { txId } = await algod.sendRawTransaction(signedTxn).do();
        const result = (await algosdk.waitForConfirmation(algod, txId, 4) as TxnResult);
        setTxnResult({...result, id: txId})
        setIsWaiting(false)
    }

    function handleOpenDispenser(){
        window.open('https://bank.testnet.algorand.network/', '_blank')?.focus();
    }

  const isFundedAccount = !!kpr && accountInfo.isSuccess && accountInfo.data.amount > 1
  return (
    <>
        <h1>WebCrypto Wallet</h1>
        {kpr && <h2>{kpr.id.toString()}</h2>}
        {txnResult && <h2>Confirmed: {txnResult['confirmed-round']}</h2>}
      {txnResult && <a target="_blank" href={`https://testnet.explorer.perawallet.app/tx/${txnResult.id}`}>View on Pera Explorer</a>}
        {accountInfo.isLoading && <p>Loading...</p>}
        {accountInfo.isError && <p>Error: {accountInfo.error.message}</p>}
        {accountInfo.isSuccess && <p>Balance: {accountInfo.data.amount}</p>}
        <div className="card">
            {!isFundedAccount && !!kpr && <button onClick={() => handleOpenDispenser()}>Open Dispenser</button>}
            <button disabled={!isFundedAccount || isWaiting} onClick={() => handlePaymentTxn()}>Make Payment</button>
            <button disabled={isWaiting} onClick={() => handleGenerateKey()}>Generate Key</button>
        </div>
        <p>
            Generate a wallet, then fund it using the dispenser. Once funded, you can make a payment.
        </p>
    </>
  )
}

export default App
