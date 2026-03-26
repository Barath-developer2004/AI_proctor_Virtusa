package database

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

var RDB *redis.Client

func ConnectRedis(redisURL string) error {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return fmt.Errorf("invalid redis URL: %w", err)
	}
	RDB = redis.NewClient(opts)
	return RDB.Ping(context.Background()).Err()
}

func CloseRedis() {
	if RDB != nil {
		RDB.Close()
	}
}
