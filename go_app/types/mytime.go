package t

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strings"
	"time"
)

type XTime struct {
	time.Time
}

func NewXTime(t time.Time) *XTime {
	return &XTime{Time: t}
}

func (xt *XTime) Scan(value interface{}) (err error) {
	nullTime := &sql.NullTime{}
	err = nullTime.Scan(value)
	*xt = XTime{nullTime.Time}
	return
}

func (xt XTime) Value() (driver.Value, error) {
	return xt.Format("2006-01-02 15:04:05"), nil
	y, m, d := time.Time(xt.Time).Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.Time(xt.Time).Location()), nil
}

func (xt XTime) MarshalJSON() ([]byte, error) {
	return []byte(fmt.Sprintf("%q", xt.Format("2006-01-02 15:04:05"))), nil
}
func (xt *XTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")
	t, err := time.Parse("2006-01-02 15:04:05", s)
	if err != nil {
		return err
	}
	*xt = XTime{
		Time: t,
	}
	return nil
}
