import {
  all,
  take,
  put,
  call,
  select,
  takeEvery,
} from 'redux-saga/effects';
import { eventChannel, END } from 'redux-saga';
import { networkActions } from '../actions/Network';
import { tokenizeActions } from '../actions/Tokenize';
import { withdrawActions } from '../actions/Withdraw';
import { approveActions } from '../actions/Approve';
import { finalizeActions } from '../actions/Finalize';
import { toTokenAmount } from '../utils';

const contracts = (db, web3) => {
  function* handleTokenize(action) {
    const { operationsContract } = yield select(state => state.network);
    const { currentDefaultAccount } = yield select(state => state.wallet);

    const {
      type,
      amount,
      gasLimit,
      gasPrice,
    } = action;

    const tx = operationsContract.methods.requestMint(toTokenAmount(amount)).send({
      from: currentDefaultAccount,
      gas: gasLimit,
      gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
    });

    const chan = yield call(handleContractCall, tx, type);
    try {
      while (true) {
        const nextAction = yield take(chan);
        yield put(nextAction);
      }
    } finally {
      chan.close();
    }
  }

  function* handleWithdraw(action) {
    const { operationsContract } = yield select(state => state.network);
    const { currentDefaultAccount } = yield select(state => state.wallet);

    const {
      type,
      amount,
      gasLimit,
      gasPrice,
    } = action;

    const tx = operationsContract.methods.requestBurn(toTokenAmount(amount)).send({
      from: currentDefaultAccount,
      gas: gasLimit,
      gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
    });

    const chan = yield call(handleContractCall, tx, type);
    try {
      while (true) {
        const nextAction = yield take(chan);
        yield put(nextAction);
      }
    } finally {
      chan.close();
    }
  }

  function* handleApprove(action) {
    const { operationsContract } = yield select(state => state.network);
    const { currentDefaultAccount } = yield select(state => state.wallet);

    const {
      type,
      requestId,
      requesterAddr,
      gasLimit,
      gasPrice,
    } = action;

    const tx = operationsContract.methods.approveMint(requesterAddr, requestId)
      .send({
        from: currentDefaultAccount,
        gas: gasLimit,
        gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
      });

    const chan = yield call(handleContractCall, tx, type);
    try {
      while (true) {
        const nextAction = yield take(chan);
        yield put(nextAction);
      }
    } finally {
      chan.close();
    }
  }

  function* handleFinalizeOrRevoke(action) {
    const { operationsContract } = yield select(state => state.network);
    const { currentDefaultAccount } = yield select(state => state.wallet);
    const { toRevoke } = yield select(state => state.finalize);

    const {
      type,
      requestId,
      requesterAddr,
      gasLimit,
      gasPrice,
    } = action;

    const tx = toRevoke
      ? operationsContract.methods.revokeMint(requesterAddr, requestId)
        .send({
          from: currentDefaultAccount,
          gas: gasLimit,
          gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
        })
      : operationsContract.methods.finalizeMint(requesterAddr, requestId)
        .send({
          from: currentDefaultAccount,
          gas: gasLimit,
          gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
        });

    const chan = yield call(handleContractCall, tx, type);
    try {
      while (true) {
        const nextAction = yield take(chan);
        yield put(nextAction);
      }
    } finally {
      chan.close();
    }
  }

  function handleContractCall(transaction, type, data) {
    return eventChannel((emitter) => {
      transaction
        .once('error', (error) => {
          emitter({
            type: `${type}_ERROR`,
            error: error.message,
          });
          emitter(END);
        })
        .once('transactionHash', (hash) => {
          emitter({ type: `${type}_HASH`, hash });
        })
        .once('receipt', (receipt) => {
          emitter({ type: `${type}_RECEIPT`, receipt, ...data });
        })
        .on('confirmation', (num, receipt) => {
          if (num >= 2) {
            emitter({
              type: `${type}_CONFIRMATION`,
              receipt,
              num,
              ...data,
            });
            emitter({
              type: networkActions.NEW_BLOCK,
              toBlock: receipt.blockNumber,
            });
            emitter(END);
          }
        })
        .then((receipt) => {
          emitter({ type: `${type}_SUCCESS`, receipt, ...data });
        })
        .catch((err) => {
          emitter({
            type: `${type}_ERROR`,
            error: err.message,
          });
          emitter(END);
        });

      return () => {};
    });
  }

  return function* watchContracts() {
    yield all([
      takeEvery(tokenizeActions.SUBMIT_TOKENIZE_REQUEST, handleTokenize),
      takeEvery(withdrawActions.SUBMIT_WITHDRAW_REQUEST, handleWithdraw),
      takeEvery(approveActions.SUBMIT_APPROVE_REQUEST, handleApprove),
      takeEvery(finalizeActions.SUBMIT_REQUEST, handleFinalizeOrRevoke),
    ]);
  };
};

export default contracts;
