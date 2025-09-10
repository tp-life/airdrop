package entities

import (
	"airdrop/go_app/instance"
	"errors"
	"time"

	"github.com/tp-life/utils/logx"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type DcToken struct {
	ID        uint
	Account   string
	Token     string
	Projects  string
	IsBlocked bool
	LockedAt  time.Time
	CreatedAt time.Time
}

func (*DcToken) TableName() string {
	return "dc_token"
}

// 获取并锁定一个可用的 Token
func GetDcToken(project string) *DcToken {
	now := time.Now()
	tt := DcToken{}
	if err := instance.DB().Where("is_blocked=0 AND (locked_at IS NULL OR locked_at<?) AND projects NOT LIKE ?", now.Add(-time.Minute*60), "%"+project+"%").Order("RAND()").First(&tt).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			logx.Error("查找 DcToken 失败", zap.Error(err))
		}
		return nil
	}
	if err := instance.DB().Model(&tt).Where("id=?", tt.ID).UpdateColumn("locked_at", now.Format("2006-01-02 15:04:05")).Error; err != nil {
		logx.Error("锁定 DcToken 时间失败", zap.Error(err))
	}
	return &tt
}

// 标记为被某个项目使用
func (tt *DcToken) Use(project string) {
	if tt == nil {
		logx.Error("DcToken.Use() 怎么这里会出现 TwitterToken 为 nul 的情况？！")
		time.Sleep(time.Second * 5)
		return
	}
	if err := instance.DB().Model(tt).Where("id=?", tt.ID).UpdateColumn("projects", tt.Projects+","+project).Error; err != nil {
		logx.Error("更新 DcToken.Projects 失败", zap.Error(err))
	}
}

func MaskDcBlock(project, token string) {
	instance.DB().Model(&DcToken{}).Where("token = ? AND projects Like ?", token, "%"+project+"%").UpdateColumn("is_blocked", 1)
}
