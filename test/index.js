import chai from 'chai';
import slimAsync from '../src/index';


describe('reudx-slim-async middleware', () => {
  const doDispatch = () => {};
  const doGetState = () => {};
  const validActionParams = {
    types: [
      'REQUEST_PENDING',
      'REQUEST_SUCCEDED',
      'REQUEST_FAILED',
    ],
    callAPI: () => Promise.resolve({}),
  };
  const nextHandler = slimAsync({
    dispatch: doDispatch,
    getState: doGetState,
  });

  it('must return a function to handle next', () => {
    chai.assert.isFunction(nextHandler);
    chai.assert.strictEqual(nextHandler.length, 1);
  });

  describe('handle return value', () => {
    it('must return a Promise', () => {
      chai.assert.isFunction(nextHandler()(validActionParams).then);
      chai.assert.isFunction(nextHandler()(validActionParams).catch);
    });
  });

  describe('handle next', () => {
    it('must pass action to next if types is not an array', (done) => {
      const actionObj = {};
      const actionHandler = nextHandler(action => {
        chai.assert.strictEqual(action, actionObj);
        done();
      });

      actionHandler(actionObj);
    });
  });

  describe('handle errors', () => {
    it('must throw if action argument callAPI is not a function', () => {
      try {
        nextHandler()({
          ...validActionParams,
          callAPI: null,
        });
      } catch (err) {
        chai.assert.strictEqual(err.message, 'Expected callAPI to be a function.');
      }
    });

    it('must throw if types is not an array of strings', () => {
      try {
        nextHandler()({
          ...validActionParams,
          types: [
            'REQUEST_PENDING',
            'REQUEST_SUCCEDED',
            true,
          ],
        });
      } catch (err) {
        chai.assert.strictEqual(err.message, 'Expected an array of three string types.');
      }
    });

    it('must throw if types is not an array of fewer than 3 strings', () => {
      try {
        nextHandler()({
          ...validActionParams,
          types: [
            'REQUEST_PENDING',
            'REQUEST_SUCCEDED',
          ],
        });
      } catch (err) {
        chai.assert.strictEqual(err.message, 'Expected an array of three string types.');
      }
    });

    it('must throw if fromatData is not a function', () => {
      try {
        nextHandler()({
          ...validActionParams,
          formatData: null,
        });
      } catch (err) {
        chai.assert.strictEqual(err.message, 'Expected formatData to be a function.');
      }
    });

    it('must throw if fromatData does not return an object', () => {
      try {
        nextHandler()({
          ...validActionParams,
          formatData: () => null,
        });
      } catch (err) {
        chai.assert.strictEqual(err.message, 'Expected formatData to return an object.');
      }
    });
  });
});
