package model

import "gorm.io/gorm"

const (
	RoleGuest = "guest"
	RoleHost  = "host"
)

type User struct {
	gorm.Model
	FirebaseUID string `gorm:"uniqueIndex;size:128;not null" json:"firebase_uid"`
	Email       string `gorm:"uniqueIndex;size:255;not null" json:"email"`
	Name        string `gorm:"size:100;not null" json:"name"`
	Phone       string `gorm:"size:32" json:"phone"`
	Role        string `gorm:"size:16;not null;default:guest" json:"role"`
	Avatar      string `gorm:"size:500" json:"avatar"`
	IsVerified  bool   `gorm:"not null;default:false" json:"is_verified"`

	// 공간 매칭/추천을 위한 사용자 프로필 (모두 옵션)
	CreatorType         string `gorm:"size:32" json:"creator_type"`           // emerging_artist / small_brand / performer / content_creator
	PreferredCategories string `gorm:"size:255" json:"preferred_categories"`  // 콤마 구분: "공연장,전시·관람"
	PreferredCapacity   string `gorm:"size:32" json:"preferred_capacity"`     // "10명 이하" / "10~30명" / "30~100명" / "100명 이상"
	PreferredDistricts  string `gorm:"size:255" json:"preferred_districts"`   // 콤마 구분: "종로구,중구"
	Bio                 string `gorm:"size:500" json:"bio"`                   // 한 줄 소개
}
