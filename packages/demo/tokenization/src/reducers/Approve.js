import { approveActions, approveFields } from '../actions/Approve';


const initialState = {
  step: 0,
  loadingNextStep: false,

  transactionToApprove: null,

  currentTransactionHash: '',
  submissionConfirmed: false,
  networkConfirmed: false,
  timeLockOver: false,
  tokenizationFinalized: false,
  transactionError: false,

  [approveFields.gasLimit]: '150000',
  [approveFields.gasPrice]: '5',
};

/**
 * Reducer for approve state
 *
 * @param {Object} [state=initialState] Previous state
 * @param {Object} [action={}] Current action
 * @returns {Object} Next state
 */
export default function (state = initialState, action = {}) {
  const { type } = action;
  switch (type) {
    case approveActions.SET_FIELD: {
      const { field, value } = action;
      if (approveFields[field] != null) {
        return {
          ...state,
          [field]: value,
        };
      }
      return state;
    }
    case approveActions.SELECT_TRANSACTION_TO_APPROVE: {
      const { transaction } = action;
      return {
        ...state,
        step: state.step + 1,
        transactionToApprove: transaction,
      };
    }
    case approveActions.NEXT_STEP: {
      return {
        ...state,
        step: state.step + 1,
        loadingNextStep: false,
      };
    }
    case approveActions.PREV_STEP: {
      return {
        ...state,
        step: Math.max(state.step - 1, 0),
        transactionToApprove: state.step === 1 ? null : state.transactionToApprove,
        loadingNextStep: false,
      };
    }
    case approveActions.RESET: {
      return initialState;
    }
    case approveActions.SUBMIT_APPROVE_REQUEST: {
      return {
        ...state,
        loadingNextStep: true,
      };
    }
    case `${approveActions.SUBMIT_APPROVE_REQUEST}_HASH`: {
      const { hash } = action;
      return {
        ...state,
        loadingNextStep: false,
        step: state.step + 1,
        currentTransactionHash: hash,
        submissionConfirmed: false,
        networkConfirmed: false,
        timeLockOver: false,
        tokenizationFinalized: false,
        transactionError: false,
      };
    }
    case `${approveActions.SUBMIT_APPROVE_REQUEST}_RECEIPT`: {
      return {
        ...state,
        submissionConfirmed: true,
      };
    }
    case `${approveActions.SUBMIT_APPROVE_REQUEST}_CONFIRMATION`: {
      return {
        ...state,
        submissionConfirmed: true,
        networkConfirmed: true,
      };
    }
    case `${approveActions.SUBMIT_APPROVE_REQUEST}_FINALIZATION`: {
      const { txHash } = action;
      if (state.transactionToApprove == null
        || txHash !== state.transactionToApprove.tx_hash) {
        return state;
      }
      return {
        ...state,
        submissionConfirmed: true,
        networkConfirmed: true,
        timeLockOver: true,
        tokenizationFinalized: true,
      };
    }
    default: {
      return state;
    }
  }
}
