package instance

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/spf13/viper"
	"github.com/tp-life/utils/logx"
)

var rdb *redis.Client
var rdbSync sync.Once

func RDB() *redis.Client {
	if rdb != nil {
		return rdb
	}
	defer func() {
		if err := recover(); err != nil {
			logx.Error("rdb error:", err)
		}
	}()
	rdbSync.Do(func() {
		host := viper.GetString("redis.host")
		port := viper.GetInt("redis.port")
		pass := viper.GetString("redis.pass")
		db := viper.GetInt("redis.db")
		rdb = redis.NewClient(&redis.Options{
			Addr:     fmt.Sprintf("%s:%d", host, port),
			Password: pass, // no password set
			DB:       db,   // use default DB
		})
	})
	return rdb
}

func SetKeyNx(key string, value any, timeout time.Duration) error {
	if RDB() == nil {
		logx.Info("redis client is nil")
		return nil
	}
	return RDB().SetNX(context.TODO(), key, value, timeout).Err()
}
