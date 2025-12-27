-- KEYS:
-- 1 = post:likes:{postId}
-- 2 = user:likes:{userId}
-- 3 = post:likes:init:{postId}

-- ARGV:
-- 1 = userId
-- 2 = postId

if redis.call("EXISTS", KEYS[3]) == 0 then
  redis.call("SET", KEYS[3], "1")
end

local alreadyLiked = redis.call("SISMEMBER", KEYS[1], ARGV[1])

if alreadyLiked == 1 then
  redis.call("SREM", KEYS[1], ARGV[1])
  redis.call("SREM", KEYS[2], ARGV[2])
  return {0, redis.call("SCARD", KEYS[1])}
else
  redis.call("SADD", KEYS[1], ARGV[1])
  redis.call("SADD", KEYS[2], ARGV[2])
  return {1, redis.call("SCARD", KEYS[1])}
end
