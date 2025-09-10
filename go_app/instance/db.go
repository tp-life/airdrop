package instance

import (
	"airdrop/go_app/utils/encode"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/spf13/viper"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

var db *gorm.DB
var onceDB sync.Once

func DB() *gorm.DB {
	if db != nil {
		return db
	}

	db = &gorm.DB{}

	onceDB.Do(func() {
		aes := encode.NewAesHelper(nil)
		host := viper.GetString("mysql.host")
		user := viper.GetString("mysql.user")
		pwd := viper.GetString("mysql.password")
		dbName := viper.GetString("mysql.db")
		if !viper.GetBool("mysql.is_plaintext") {
			if v, e := aes.DecryptAndBase64(host); e == nil {
				host = string(v)
			}
			if v, e := aes.DecryptAndBase64(user); e == nil {
				user = string(v)
			}
			if v, e := aes.DecryptAndBase64(pwd); e == nil {
				pwd = string(v)
			}
			if v, e := aes.DecryptAndBase64(dbName); e == nil {
				dbName = string(v)
			}
		}
		dsn := fmt.Sprintf(
			`%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local`,
			user,
			pwd,
			host,
			viper.GetInt("mysql.port"),
			dbName,
		)
		fmt.Println("dsn:", dsn)
		newLogger := gormLogger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
			gormLogger.Config{
				SlowThreshold:             time.Second,     // Slow SQL threshold
				LogLevel:                  gormLogger.Info, // Log level
				IgnoreRecordNotFoundError: true,            // Ignore ErrRecordNotFound error for logger
				Colorful:                  true,            // Disable color
			},
		)
		var err error
		cfg := &gorm.Config{
			DisableForeignKeyConstraintWhenMigrating: true, //禁用自动创建外链关联
		}
		if true {
			cfg.Logger = newLogger
		}
		_dialector := mysql.New(mysql.Config{
			DSN:                       dsn,
			DefaultStringSize:         256,   // string 类型字段的默认长度
			DisableDatetimePrecision:  true,  // 禁用 datetime 精度，MySQL 5.6 之前的数据库不支持
			SkipInitializeWithVersion: false, // 根据当前 MySQL 版本自动配置
		})
		db, err = gorm.Open(_dialector, cfg)
		if err != nil {
			log.Println("failed to connect database:", err)
			return
		}
		sqlDB, err := db.DB()
		if err != nil {
			log.Println("failed to db.DB():" + err.Error())
			return
		}

		sqlDB.SetMaxIdleConns(viper.GetInt("mysql.max_idle_conns"))
		sqlDB.SetMaxOpenConns(viper.GetInt("mysql.max_open_conns"))
		sqlDB.SetConnMaxLifetime(viper.GetDuration("mysql.conn_max_lifetime") * time.Minute)
	})

	return db
}
