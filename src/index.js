
import { isFSA } from 'flux-standard-action';
import errorMessages from './errors';

function validateInput(
  {
    type,
    types,
    callAPI,
    formatData = res => res,
    shouldCallAPI = () => true,
    payload = {},
    meta = {},
  },
  options,
) {
  if (
    options === undefined
    && (
      !Array.isArray(types)
      || types.length !== 3
      || !types.every(type => typeof type === 'string')
    )
  ) {
    throw new Error(errorMessages.types);
  }
  if (
    options !== undefined
    && typeof type !== 'string'
  ) {
    throw new Error(errorMessages.type);
  }
  if (typeof callAPI !== 'function') {
    throw new Error(errorMessages.callAPI);
  }
  if (typeof formatData !== 'function') {
    throw new Error(errorMessages.formatData);
  }
  if (typeof shouldCallAPI !== 'function') {
    throw new Error(errorMessages.shouldCallAPI);
  }
  if (typeof payload !== 'object') {
    throw new Error(errorMessages.payload);
  }
  if (typeof meta !== 'object') {
    throw new Error(errorMessages.meta);
  }
}

function validateOptions({ pendingSuffix, successSuffix, errorSuffix }) {
  if (
    typeof pendingSuffix !== 'string'
    || typeof successSuffix !== 'string'
    || typeof errorSuffix !== 'string'
  ) throw new Error(errorMessages.options)
}

function optionsAreValid(type, types, options) {
  if (options === undefined && !types) return false;
  if (options === undefined && types)  return true;
  if (options !== undefined && !type) return false;
  if (options !== undefined && type) {
    validateOptions(options);
    return true;
  }
  return false;
}

function getActionTypes(type, types, options) {
  if (options === undefined) return types;
  if (options !== undefined) {
    return [
      `${type}${options.pendingSuffix}`,
      `${type}${options.successSuffix}`,
      `${type}${options.errorSuffix}`,
    ];
  }
}

function createSlimAsyncMiddleware(options) {
  return ({ dispatch, getState }) => next => (action) => {
    const {
      type,
      types,
      callAPI,
      formatData = res => res,
      shouldCallAPI = () => true,
      payload = {},
      meta = {},
    } = action;

    if (!optionsAreValid(type, types, options)) return next(action);

    validateInput(action, options);

    if (!shouldCallAPI(getState())) return null;

    const [pendingType, successType, errorType] = getActionTypes(type, types, options);

    const pendingAction = { payload, type: pendingType };

    if (!isFSA(pendingAction)) next(action);
    else dispatch(pendingAction);

    return callAPI()
      .then((response) => {
        const formattedData = formatData(response);
        if (typeof formattedData !== 'object') {
          throw new Error(errorMessages.formatDataReturn);
        }

        const successAction = {
          type: successType,
          payload: {
            ...payload,
            ...formattedData,
          },
          meta,
        };

        if (!isFSA(successAction)) next(action);
        else dispatch(successAction);

        return Promise.resolve(getState());
      })
      .catch(error => {
        const errorAction = {
          payload: error,
          error: true,
          type: errorType,
          meta,
        }

        if (!isFSA(errorAction)) next(action);
        else dispatch(errorAction);

        return Promise.reject(error);
      });
  };
}

const slimAsync = createSlimAsyncMiddleware();
slimAsync.withOptions = createSlimAsyncMiddleware;

export default slimAsync;
