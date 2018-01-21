# Redux Slim Async
[![build status](https://circleci.com/gh/Gabri3l/redux-slim-async.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/Gabri3l/redux-slim-async)
[![npm version](https://img.shields.io/npm/v/redux-slim-async.svg?style=flat-square)](https://www.npmjs.com/package/redux-slim-async)
[![npm downloads](https://img.shields.io/npm/dm/redux-slim-async.svg?style=flat-square)](https://www.npmjs.com/package/redux-slim-async)

A [FSA](https://github.com/acdlite/flux-standard-action)-compliant Redux middleware to ease the pain of tracking the status of an async action. While the compliance seems to break for how the middleware is presented (e.g. it requires a field of `types` instead of just `type`), every action that is dispatched with it is fully FSA-compliant. You can think of this middleware as a more succint way to dispatch FSA-compliant actions that track asyn requests.

## Install

To install simply run

`npm install --save redux-slim-async`

or

`yarn add redux-slim-async`

You then need to enable the middleware with the `applyMiddleware()` method as follows:

```js
import { applyMiddleware, createStore, compose } from 'redux';
import slimAsync from 'redux-slim-async';
import rootReducer from '../reducers';

const store = createStore(
  rootReducer,
  compose(applyMiddleware(slimAsync)),
);

export default store;
```

Since version 1.3.0 you will be able to add options, through those you can specify each suffix that defines the state of your async request (read more at the bottom).

## Problem

When handling any kind of asyn requests in Redux most of the time we need to track the state of such request. This means we need to know when the action is pending, completed successfully or completed with errors. A common pattern for it that leverages `redux-thunk` is the following:

```js
import {
  FETCH_DATA_ERROR,
  FETCH_DATA_PENDING,
  FETCH_DATA_SUCCESS,
} from 'constants/actionTypes';

function fetchDataError(error) {
  return {
    type: FETCH_DATA_ERROR,
    payload: error,
  }
}

function fetchMyDataPending() {
  return {
    type: FETCH_DATA_PENDING,
  };
}

function fetchMyDataSuccess(payload) {
  return {
    type: FETCH_DATA_SUCCESS,
    payload,
  }
}

function fetchData() {
  return (dispatch) => {
    dispatch(fetchDataPending());

    fetch('https://myapi.com/mydata')
      .then(res => res.json())
      .then(data => dispatch(fetchMyDataSuccess(data)))
      .catch(err => dispatch(fetchMyDataError(err)));
  }
}

```

All of this boilerplate is required to make sure we track the whole process. On top of that we might want to have more power over such requests, we might want to prevent a call to the API if the data is already available in our state or we might want to format the data that is coming back from the API. This pattern feels quite tedious so I am proposing a middleware that extends what shown in the `redux` docs.

The `redux-slim-async` provides an intuitive and condensed interface with some nice added features.

## Solution

After the middleware has been plugged in you can use it almost like you would normally dispatch an action, to follow our previous example:

```js
function fetchData() {
  return {
    types: [
      FETCH_DATA_PENDING,
      FETCH_DATA_SUCCESS,
      FETCH_DATA_ERROR,
    ],
    callAPI: fetch('https://myapi.com/mydata').then(res => res.json()),
  };
}
```

This handles dispatching all the actions for different statuses: pending, error and success. You can then have your state manager listen to them and update the state accordingly.

There are a few additions on top of what we saw so far. You can define a function that is in charge of preventing the request to be submitted based on your state.

```js
function fetchData() {
  return {
    types: [
      FETCH_DATA_PENDING,
      FETCH_DATA_SUCCESS,
      FETCH_DATA_ERROR,
    ],
    callAPI: fetch('https://myapi.com/mydata').then(res => res.json()),
    shouldCallAPI: (state) => state.myData === null,
  };
}
```

This simply makes sure the request is sent only if the condition returned by the `shouldCallAPI` function is `true`.

Another useful function is the `formatData` one. Given the data returned from the request you can manipulate it or format it before it is sent to the manager.

```js
function fetchData() {
  return {
    types: [
      FETCH_DATA_PENDING,
      FETCH_DATA_SUCCESS,
      FETCH_DATA_ERROR,
    ],
    callAPI: fetch('https://myapi.com/mydata').then(res => res.json()),
    shouldCallAPI: (state) => state.myData === null,
    formatData: (data) => ({
      favorites: data.favorites,
      latestFavorite: data.latest_favorite,
    }),
  };
}
```

At the current state of the middleware these fields are added outside the payload, this does not conform with the Flux Standard Action directive (it is in the roadmap to make it so).


## Concatenate actions with Promises or async/await

When calling an action that uses this middleware, you can now use `.then` or `.catch` to concatenate other actions after the current one has been resolved. You then have access to the updated state after the relative success/fail action has been handled by the manager. In your component you will be able to do something like this:

```js
  import React from 'react';
  ...
    componentDidMount() {
      this.props.actions.fetchMyData()
        .then(managerState => this.doStuff(managerState.someStateField)))
        .catch(managerState => this.doErrorStuff(managerState.someErrorStateField));
    }
  ...

```

## Update v1.3.0

With this updae boilerplate code is reduce even more! Instead of forcing to pass an array of types every time we need to dispatch an aync action, there is now the possibility to define options at initiation time. This means that you can set each suffix you will be using to track `pending`, `success` or `error` status ahead of time. You can do so as follows:

```js
import { applyMiddleware, createStore, compose } from 'redux';
import slimAsync from 'redux-slim-async';
import rootReducer from '../reducers';

const store = createStore(
  rootReducer,
  compose(applyMiddleware(slimAsync.withOptions({
    pendingSuffix: '_PENDING',
    successSuffix: '_SUCCESS',
    errorSuffix: '_ERROR',
  }))),
);

export default store;
```

This will allow you to define only the action prefix that is shared across every action dispatched to track the async request status. You will now be able to write:

```js
function fetchData() {
  return {
    typePrefix: FETCH_DATA,
    callAPI: fetch('https://myapi.com/mydata').then(res => res.json()),
    shouldCallAPI: (state) => state.myData === null,
    formatData: (data) => ({
      favorites: data.favorites,
      latestFavorite: data.latest_favorite,
    }),
  };
}
```

The reason why it's called `typePrefix` instead of `type` is to simply avoid confusion. If the field was named `type` like a normal action, I would expect to be able to update the state manager once an action with that exact type has been dispatched, which would never happen. `typePrefix` makes it more clear that there's something more to it as that string only represent the prefix of the full action `type`. This is also the reason why such behavior is provided only when `options` are provided to the middleware.
## RoadMap

- [x] Add test suite
- [x] Add continuous integration
- [x] Make the middleware compliant to FSA directives
- [x] Use FSA directives to skip action if not FSA compliant
- [x] Allow to dispatch other actions after the current one has succeded or errored out
- [x] Allow setting up a custom suffix for action types at initiation time
- [ ] Allow to use middleware even if not FSA compliant at initation time

## License

MIT
