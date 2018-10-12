import { Decimal } from 'decimal.js-light';
import { withdrawActions, withdrawFields } from '../actions/Withdraw';
import { sgdrDecimalPlaces } from '../constants/defaults';


const initialState = {
  step: 0,
  loadingNextStep: false,

  currentTransactionHash: '',
  submissionConfirmed: false,
  networkConfirmed: false,
  wireTransferred: false,
  transactionError: false,

  [withdrawFields.amount]: '',
  [withdrawFields.gasLimit]: '150000',
  [withdrawFields.gasPrice]: '5',
};

/**
 * Reducer for withdraw state
 *
 * @param {Object} [state=initialState] Previous state
 * @param {Object} [action={}] Current action
 * @returns {Object} Next state
 */
export default function (state = initialState, action = {}) {
  const { type } = action;
  switch (type) {
    case withdrawActions.SET_FIELD: {
      const { field, value } = action;
      if (withdrawFields[field] != null) {
        return {
          ...state,
          [field]: value,
        };
      }
      return state;
    }
    case withdrawActions.NEXT_STEP: {
      const sanitation = {};
      if (state.step === 0) {
        sanitation[withdrawFields.amount] = (new Decimal(state[withdrawFields.amount]))
          .todp(sgdrDecimalPlaces, Decimal.ROUND_DOWN)
          .toString();
      }
      return {
        ...state,
        ...sanitation,
        step: state.step + 1,
        loadingNextStep: false,
      };
    }
    case withdrawActions.PREV_STEP: {
      return {
        ...state,
        step: Math.max(state.step - 1, 0),
        loadingNextStep: false,
      };
    }
    case withdrawActions.RESET: {
      return initialState;
    }
    case withdrawActions.SUBMIT_WITHDRAW_REQUEST: {
      return {
        ...state,
        loadingNextStep: true,
      };
    }
    case `${withdrawActions.SUBMIT_WITHDRAW_REQUEST}_HASH`: {
      const { hash } = action;
      return {
        ...state,
        loadingNextStep: false,
        step: state.step + 1,
        currentTransactionHash: hash,
        submissionConfirmed: false,
        networkConfirmed: false,
        wireTransferred: false,
        transactionError: false,
      };
    }
    case `${withdrawActions.SUBMIT_WITHDRAW_REQUEST}_RECEIPT`: {
      return {
        ...state,
        submissionConfirmed: true,
      };
    }
    case `${withdrawActions.SUBMIT_WITHDRAW_REQUEST}_CONFIRMATION`: {
      return {
        ...state,
        submissionConfirmed: true,
        networkConfirmed: true,
        wireTransferred: true,
      };
    }
    default: {
      return state;
    }
  }
}
