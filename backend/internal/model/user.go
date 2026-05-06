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
}
