const RedisServer = require('redis-server');

const server = new RedisServer({
  conf: '/etc/redis/redis.conf'
});

server.open((err) => {
  if (err === null) {
    console.log('Redis connected');
  } else {
    console.log('There was error creating server', err);
  }
});

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
        let outputPromise = keyOutputPromises[key] || (keyOutputPromises[key] = valueFn());
        const output = await outputPromise;
        if(expireSeconds) {
          getRedisClient().setex(key, expireSeconds, output);
        } else {
          getRedisClient().set(key, output);
        }
        keyOutputPromises[key] = null;
        resolve(output);
      }
    });
  });
};
module.exports = { redisPromise };