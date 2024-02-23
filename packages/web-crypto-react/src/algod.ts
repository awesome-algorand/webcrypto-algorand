import algosdk from "algosdk";

const tokenOrBaseClient = ''
const baseServer = 'https://testnet-api.algonode.cloud'
const port = 443
export const algod = new algosdk.Algodv2(tokenOrBaseClient, baseServer, port);

