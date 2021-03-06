const getRedisClient = (() => {
  let client;
  return () => {
    if(!client) {
      client = require('redis').createClient();
    }
    return client;
  };
})();

const keyOutputPromises = {};

const redisPromise = (key, valueFn, expireSeconds = null) => {
  return new Promise(function(resolve, reject) {
    getRedisClient().get(key, async(err, value) => {
      if(err) {
        reject(err);
      }

      if(value) {
        resolve(value);
      } else {
        try {
          let outputPromise = keyOutputPromises[key] || (keyOutputPromises[key] = valueFn());
          const output = await outputPromise;
          if(expireSeconds) {
            getRedisClient().setex(key, expireSeconds, output);
          } else {
            getRedisClient().set(key, output);
          }
          resolve(output);
        } catch (error) {
          reject(error);
        }
        keyOutputPromises[key] = null;
      }
    });
  });
};
module.exports = { redisPromise };
