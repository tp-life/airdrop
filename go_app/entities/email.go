package entities

import (
	"airdrop/go_app/instance"
	"errors"
	"time"

	"github.com/tp-life/utils/logx"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type EmailAsset struct {
	ID        uint      `gorm:"primary_key,auto_increment"`
	Email     string    `gorm:"type:varchar(255);not null;unique"`
	Password  string    `gorm:"type:varchar(50);not null"`
	Projects  string    `gorm:"type:varchar(255);not null;default:''"`
	IsBlocked int8      `gorm:"default:0"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	LockAt    int64     `gorm:"default:0"`
}

func (*EmailAsset) TableName() string {
	return "emails"

}

// 获取并锁定一个可用的 Token
func GetEmail(project string) *EmailAsset {
	now := time.Now()
	tt := EmailAsset{}
	if err := instance.DB().Where("is_blocked=0 AND (locked_at IS NULL OR locked_at<?) AND projects NOT LIKE ?", now.Add(-time.Minute*30).Unix(), "%"+project+"%").First(&tt).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			logx.Error("查找 EmailAsset 失败", zap.Error(err))
		}
		return nil
	}
	if err := instance.DB().Model(&tt).Where("id=?", tt.ID).UpdateColumn("locked_at", now.Unix()).Error; err != nil {
		logx.Error("锁定 EmailAsset 时间失败", zap.Error(err))
	}
	return &tt
}

// 标记为被某个项目使用
func (tt *EmailAsset) Use(project string) {
	if tt == nil {
		logx.Error("EmailAsset.Use() 怎么这里会出现 EmailAsset 为 nul 的情况？！")
		time.Sleep(time.Second * 5)
		return
	}
	if err := instance.DB().Model(tt).Where("id=?", tt.ID).UpdateColumn("projects", tt.Projects+","+project).Error; err != nil {
		logx.Error("更新 EmailAsset.Projects 失败", zap.Error(err))
	}
}
