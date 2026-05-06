package model

import "gorm.io/gorm"

type Review struct {
	gorm.Model

	PropertyID uint     `gorm:"index;not null" json:"property_id"`
	Property   Property `gorm:"foreignKey:PropertyID" json:"-"`

	BookingID uint    `gorm:"uniqueIndex;not null" json:"booking_id"`
	Booking   Booking `gorm:"foreignKey:BookingID" json:"-"`

	UserID uint `gorm:"index;not null" json:"user_id"`
	User   User `gorm:"foreignKey:UserID" json:"user"`

	Rating  int    `gorm:"not null" json:"rating"`
	Comment string `gorm:"type:text" json:"comment"`

	Cleanliness   int `json:"cleanliness"`
	Accuracy      int `json:"accuracy"`
	Communication int `json:"communication"`
	Location      int `json:"location"`
	CheckIn       int `json:"check_in"`
	Value         int `json:"value"`
}
