
import errorMessages from './errors';

function validateInput({
  types,
  callAPI,
  formatData = res => res,
  shouldCallAPI = () => true,
  payload = {},
  meta = {},
}) {
  if (
    !Array.isArray(types) ||
    types.length !== 3 ||
    !types.every(type => typeof type === 'string')
  ) {
    throw new Error(errorMessages.types);
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

function reduxSlimAsync({ dispatch, getState }) {
  return next => (action) => {
    const {
      types,
      callAPI,
      formatData = res => res,
      shouldCallAPI = () => true,
      payload = {},
      meta = {},
    } = action;

    if (!types) return next(action);
    validateInput(action);
    if (!shouldCallAPI(getState())) return null;

    const [pendingType, successType, errorType] = types;

    dispatch(Object.assign({}, { payload, type: pendingType }));

    return callAPI()
      .then((response) => {
        const formattedData = formatData(response);
        if (typeof formattedData !== 'object') {
          throw new Error(errorMessages.formatDataReturn);
        }

        dispatch(Object.assign(
          {},
          {
            type: successType,
            payload: {
              ...payload,
              ...formattedData,
            },
            meta,
          },
        ));

        return Promise.resolve(getState());
      })
      .catch(error => {
        dispatch(Object.assign(
          {},
          {
            payload: error,
            error: true,
            type: errorType,
          },
          meta,
        ));

        return Promise.reject(error);
      });
  };
}

export default reduxSlimAsync;
