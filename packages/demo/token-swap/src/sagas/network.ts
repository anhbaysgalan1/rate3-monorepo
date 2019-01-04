import { all, call, put, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { networkActions, resetSelectedTx } from '../actions/network';
import axios from 'axios';
import extrapolateFromXdr from '../utils/extrapolateFromXdr';
import { base64toHEX, IAction } from '../utils/general';
import localforage from 'localforage'; // tslint:disable-line:import-name
import { ETH_USER } from '../constants/defaults';

const HORIZON = 'https://horizon-testnet.stellar.org';

const STELLAR_USER = 'GAOBZE4CZZOQEB6A43R4L36ESZXCAGDVU7V5ECM5LE4KTLDZ6A4S6CTY';
const STELLAR_USER_SECRET = 'SA5WYQ7EJNPCX5GQHZHGNHE5XZLT42SL6LAEMIVO6WKC6ZR4YENAEZQV';

const STELLAR_ISSUER = 'GAC73JYYYVPAPVCEXDOH7Y2KFT6GUSJWJKKCZM52UMIXTZG2T6D5NRRV';
const STELLAR_ISSUER_SECRET = 'SA6RJV2U5GUK3VYM5CHGATLXEJIDZ37YRF5MJDD5CGKT4LWKMGDDSOOM';

const STELLAR_DISTRIBUTOR = 'GA3V7T4P6KQJEPEZTVRUJWLZ3XB262BIWXYDZJ4SIS6AOPCX4KNIGGDH';
const STELLAR_DISTRIBUTOR_SECRET = 'SD676EDAREHFTLX4MYZCPPZDMV5D44PLP42ORGBHOD5PV5ONXPTIOTLK';
localforage.config({
  driver      : localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
  name        : 'token-swap-demo',
  version     : 1.0,
  size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName   : 'keyvaluepairs', // Should be alphanumeric, with underscores.
  description : 'stores the approval list',
});
function* getBalance() {
  try {
    const getWeb3 = state => state.network.web3Obj;
    const web3 = yield select(getWeb3);
    const address = web3.eth.accounts.wallet[0].address;
    const balance = yield web3.eth.getBalance(address);
    return balance;
  } catch (e) {
    throw e;
  }
}
function* getTokenBalance() {
  try {
    const getWeb3 = state => state.network.web3Obj;
    const web3 = yield select(getWeb3);

    const getTokenContract = state => state.network.tokenContract;
    const tokenContract = yield select(getTokenContract);

    const address = ETH_USER;
    const balance = yield tokenContract.methods.balanceOf(address).call();
    console.log('sgdr balance', balance);
    return balance;
  } catch (e) {
    throw e;
  }
}
function* constructR3() {
  try {
    const getR3Stellar = state => state.network.r3Stellar;
    const r3Stellar = yield select(getR3Stellar);
    const r3 = yield r3Stellar('TESTNET', HORIZON);
    r3.Stellar.Config.setDefault();
    console.log(r3);
    return r3;
  } catch (e) {
    throw e;
  }
}
function* getUserEthBalance(action: any) {
  try {
    const balance = yield getBalance();
    const sgdrBalance = yield getTokenBalance();
    yield put({ type: networkActions.SET_USER_ETH_BALANCE, payload: { balance, sgdrBalance } });
  } catch (e) {
    console.error(e);
  }
}
function* getIssuerEthBalance(action: any) {
  try {
    const balance = yield getBalance();
    yield put({ type: networkActions.SET_ISSUER_ETH_BALANCE, payload: { balance } });
  } catch (e) {
    console.error(e);
  }
}

function* setR3(action: any) {
  // await yield.get(`${HORIZON_TESTNET_URL}/friendbot?addr=${this.issuerKeypair.publicKey()}`);
  try {
    const r3 = yield constructR3();
    (window as any).r3 = r3;
    yield put({ type: networkActions.SET_R3_INSTANCE, payload: { r3 } });
  } catch (e) {
    console.error(e);
  }
}

function* getUserStellarBalance(action: any) {
  try {
    const res = yield axios.get(`${HORIZON}/accounts/${STELLAR_USER}`);
    console.log(res.data.balances);
    const balance = res.data.balances;
    yield put({ type: networkActions.SET_USER_STELLAR_BALANCE, payload: { balance } });
  } catch (e) {
    console.error(e);
  }
}

function* getIssuerStellarBalance(action: any) {
  try {
    const res = yield axios.get(`${HORIZON}/accounts/${STELLAR_ISSUER}`);
    console.log(res.data.balances);
    const balance = res.data.balances;
    yield put({ type: networkActions.SET_ISSUER_STELLAR_BALANCE, payload: { balance } });
  } catch (e) {
    console.error(e);
  }
}

export default function* network() {
  yield takeLatest(networkActions.INIT_USER, getUserEthBalance);
  yield takeLatest(networkActions.INIT_USER, setR3);
  yield takeLatest(networkActions.SET_R3_INSTANCE, getUserStellarBalance);
  yield takeLatest(networkActions.SET_R3_INSTANCE, getIssuerStellarBalance);

  yield takeLatest(networkActions.INIT_ISSUER, getIssuerEthBalance);
  yield takeLatest(networkActions.INIT_ISSUER, setR3);
  // yield takeLatest(networkActions.INIT_ISSUER, setUp);
}
