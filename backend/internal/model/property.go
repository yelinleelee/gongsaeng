package model

import "gorm.io/gorm"

const (
	PropertyTypeApartment  = "apartment"
	PropertyTypeHouse      = "house"
	PropertyTypeVilla      = "villa"
	PropertyTypeGuesthouse = "guesthouse"
	PropertyTypeHotel      = "hotel"
	PropertyTypeUnique     = "unique"

	RoomTypeEntire  = "entire"
	RoomTypePrivate = "private"
	RoomTypeShared  = "shared"
)

type Property struct {
	gorm.Model
	HostID uint `gorm:"index;not null" json:"host_id"`
	Host   User `gorm:"foreignKey:HostID" json:"host"`

	Title        string  `gorm:"size:255;not null" json:"title"`
	Description  string  `gorm:"type:text" json:"description"`
	PropertyType string  `gorm:"size:32;not null" json:"property_type"`
	RoomType     string  `gorm:"size:32;not null" json:"room_type"`
	MaxGuests    int     `gorm:"not null;default:1" json:"max_guests"`
	Bedrooms     int     `gorm:"not null;default:1" json:"bedrooms"`
	Beds         int     `gorm:"not null;default:1" json:"beds"`
	Bathrooms    float32 `gorm:"type:decimal(3,1);not null;default:1" json:"bathrooms"`

	Price    float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	Currency string  `gorm:"size:3;not null;default:KRW" json:"currency"`

	Address   string  `gorm:"size:500;not null" json:"address"`
	City      string  `gorm:"size:100;not null;index" json:"city"`
	Country   string  `gorm:"size:100;not null" json:"country"`
	Latitude  float64 `gorm:"type:decimal(10,8)" json:"latitude"`
	Longitude float64 `gorm:"type:decimal(11,8)" json:"longitude"`

	Amenities StringSlice `gorm:"type:json" json:"amenities"`
	Images    StringSlice `gorm:"type:json" json:"images"`

	IsAvailable bool    `gorm:"not null;default:true" json:"is_available"`
	Rating      float32 `gorm:"type:decimal(3,2);not null;default:0" json:"rating"`
	ReviewCount int     `gorm:"not null;default:0" json:"review_count"`
}
