package model

import "gorm.io/gorm"

// Favorite stores a user's saved space.
// SVCID can refer to a Seoul Open API facility (string) or an internal placeholder.
// We store a full snapshot of facility metadata so the favorite card can render
// even if the upstream API is unavailable.
type Favorite struct {
	gorm.Model
	UserID     uint   `gorm:"uniqueIndex:idx_user_svc;not null" json:"user_id"`
	SvcID      string `gorm:"uniqueIndex:idx_user_svc;size:128;not null" json:"svc_id"`
	SvcNm      string `gorm:"size:255" json:"svc_nm"`
	PlaceNm    string `gorm:"size:255" json:"place_nm"`
	AreaNm     string `gorm:"size:64" json:"area_nm"`
	PayAtNm    string `gorm:"size:32" json:"pay_at_nm"`
	ImgURL     string `gorm:"size:1000" json:"img_url"`
	SvcURL     string `gorm:"size:1000" json:"svc_url"`
	MinClassNm string `gorm:"size:64" json:"min_class_nm"`
	VMax       string `gorm:"size:32" json:"v_max"`
	X          string `gorm:"size:32" json:"x"`
	Y          string `gorm:"size:32" json:"y"`
}
