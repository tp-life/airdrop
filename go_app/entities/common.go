package entities

import (
	"time"

	"github.com/tp-life/utils/logx"

	"airdrop/go_app/instance"
)

// GetFirstTask 随机获取一个任务
func GetFirstTask[T any](order, query string, args ...any) (result T, err error) {
	data := new(T)
	sort := "RAND()"
	if order != "" {
		sort = order
	}
	err = instance.DB().Model(data).Where(query, args...).Order(sort).First(data).Error
	if err != nil {
		logx.Error("查询任务错误")
		return *data, err
	}

	if err = instance.DB().Model(data).UpdateColumns(map[string]any{"locked_at": time.Now()}).Error; err != nil {
		logx.Error("更新锁定时间错误")
		return *data, err
	}

	result = *data
	return
}

// GetFirstTask 随机获取一个任务
func GetPreloadTask[T any](preload string, order, query string, args ...any) (result T, err error) {
	data := new(T)

	sort := "RAND()"
	if order != "" {
		sort = order
	}
	err = instance.DB().
		Model(data).
		Where(query, args...).
		Preload(preload).
		Order(sort).
		First(data).
		Error
	if err != nil {
		logx.Error("查询任务错误")
		return *data, err
	}

	if err = instance.DB().Model(data).UpdateColumns(map[string]any{"locked_at": time.Now()}).Error; err != nil {
		logx.Error("更新锁定时间错误")
		return *data, err
	}

	result = *data
	return
}

func GetPreloadTaskV2[T any](
	query string,
	args []any,
	order string,
	preload string,
	preloadArg ...any,
) (result T, err error) {
	data := new(T)

	sort := "RAND()"
	if order != "" {
		sort = order
	}
	err = instance.DB().
		Model(data).
		Where(query, args...).
		Preload(preload, preloadArg...).
		Order(sort).
		First(data).
		Error
	if err != nil {
		logx.Error("查询任务错误")
		return *data, err
	}

	if err = instance.DB().Model(data).UpdateColumns(map[string]any{"locked_at": time.Now()}).Error; err != nil {
		logx.Error("更新锁定时间错误")
		return *data, err
	}

	result = *data
	return
}

type TaskParams struct {
	Order       string
	Preload     string
	PreloadArgs []any
	LockedField string
}

func GetTask[T any](query string, args []any, param ...TaskParams) (result T, err error) {
	data := new(T)

	var p TaskParams
	if len(param) > 0 {
		p = param[0]
	}

	db := instance.DB().Model(data).Where(query, args...)

	sort := "RAND()"
	if p.Order != "" {
		sort = p.Order
	}
	if p.Preload != "" {
		db = db.Preload(p.Preload, p.PreloadArgs...)
	}

	db = db.Order(sort).First(data)
	err = db.Error
	if err != nil {
		logx.Error("查询任务错误")
		return *data, err
	}

	filed := "locked_at"
	if p.LockedField != "" {
		filed = p.LockedField
	}

	if err = instance.DB().Model(data).UpdateColumns(map[string]any{filed: time.Now().UTC()}).Error; err != nil {
		logx.Error("更新锁定时间错误")
		return *data, err
	}

	result = *data
	return
}

type CommonAccount struct {
	ID               uint `gorm:"primary_key,auto_increment"`
	Port             int
	Addr             string
	Pk               string
	Sort             int        // 排序值
	IP               string     `gorm:"-"` // IP
	ReferralCode     string     `gorm:"index"`
	ReferralLocked   *time.Time `gorm:"index"`
	FromReferralCode string
	ReferralTotal    int `gorm:"default:0;index"`
	Email            string
	EmailPass        string
	Completed        int8 `gorm:"default:0"`
	XToken           string
	DcToken          string
	Points           int        `gorm:"default:0"`
	DaliyAt          *time.Time `gorm:"index"`
	CreatedAt        *time.Time
	UpdatedAt        *time.Time
	LockedAt         *time.Time `gorm:"index"`
}

func (c *CommonAccount) SetIP(ip string) {
	c.IP = ip
}

func (c *CommonAccount) GetIP() string {
	return c.IP
}

func (c *CommonAccount) SetPort(port int) {
	c.Port = port
}

func (c *CommonAccount) GetPort() int {
	return c.Port
}

func (c *CommonAccount) SetSort(sort int) {
	c.Sort = sort
}

func (c *CommonAccount) GetSort() int {
	return c.Sort
}

func (c *CommonAccount) SetLockedAt(t *time.Time) {
	c.LockedAt = t
}

func (c *CommonAccount) GetLockedAt() *time.Time {
	return c.LockedAt
}

type ITaskAccount interface {
	SetIP(ip string)
	GetIP() string
	SetPort(port int)
	GetPort() int
	SetSort(sort int)
	GetSort() int
	SetLockedAt(t *time.Time)
	GetLockedAt() *time.Time
}
