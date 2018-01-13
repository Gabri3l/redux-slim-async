function reduxSlimAsync({ dispatch, getState }) {
  return next => (action) => {
    const {
      types,
      callAPI,
      formatData = res => res,
      shouldCallAPI = () => true,
      payload = {},
    } = action;

    if (!types) return next(action);
    if (
      !Array.isArray(types) ||
      types.length !== 3 ||
      !types.every(type => typeof type === 'string')
    ) {
      throw new Error('Expected an array of three string types.');
    }
    if (typeof callAPI !== 'function') {
      throw new Error('Expected callAPI to be a function.');
    }
    if (typeof formatData !== 'function') {
      throw new Error('Expected formatData to be a function.');
    }
    if (!shouldCallAPI(getState())) return null;

    const [pendingType, successType, errorType] = types;

    dispatch(Object.assign({}, payload, { type: pendingType }));

    return callAPI()
      .then((response) => {
        const formattedData = formatData(response);
        if (typeof formattedData !== 'object') {
          throw new Error('formatData should return an object.');
        }

        dispatch(Object.assign(
          {},
          payload,
          formattedData,
          { type: successType },
        ));
      })
      .catch(error =>
        dispatch(Object.assign(
          {},
          payload, {
            error,
            type: errorType,
          },
        )));
  };
}

export default reduxSlimAsync;
