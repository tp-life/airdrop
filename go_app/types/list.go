package t

import (
	"database/sql/driver"
	"encoding/json"
	"strings"
)

type UintList []uint

func (v UintList) Contains(val uint) bool {
	for _, _v := range v {
		if _v == val {
			return true
		}
	}
	return false
}
func (v UintList) Value() (driver.Value, error) {
	if len(v) == 0 {
		return "[]", nil
	}
	return json.Marshal(v)
}
func (v *UintList) Scan(data interface{}) error {
	return json.Unmarshal(data.([]byte), &v)
}

type StrList []string

func (v StrList) Value() (driver.Value, error) {
	if len(v) == 0 {
		return "[]", nil
	}
	return json.Marshal(v)
}
func (v *StrList) Scan(data interface{}) error {
	return json.Unmarshal(data.([]byte), &v)
}
func (v StrList) Contains(val string) bool {
	for _, _v := range v {
		if _v == val {
			return true
		}
	}
	return false
}
func (v StrList) String() string {
	return strings.Join(v, ";")
}

type AnyMapList []map[string]any

func (v AnyMapList) Value() (driver.Value, error) {
	if len(v) == 0 {
		return "[]", nil
	}
	return json.Marshal(v)
}
func (v *AnyMapList) Scan(data interface{}) error {
	return json.Unmarshal(data.([]byte), &v)
}
