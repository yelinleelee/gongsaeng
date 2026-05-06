package model

import (
	"time"

	"gorm.io/gorm"
)

const (
	BookingStatusPending   = "pending"
	BookingStatusConfirmed = "confirmed"
	BookingStatusCancelled = "cancelled"
	BookingStatusCompleted = "completed"

	PaymentStatusPending  = "pending"
	PaymentStatusPaid     = "paid"
	PaymentStatusRefunded = "refunded"
	PaymentStatusFailed   = "failed"
)

type Booking struct {
	gorm.Model

	PropertyID uint     `gorm:"index;not null" json:"property_id"`
	Property   Property `gorm:"foreignKey:PropertyID" json:"property"`

	GuestID uint `gorm:"index;not null" json:"guest_id"`
	Guest   User `gorm:"foreignKey:GuestID" json:"guest"`

	CheckIn  time.Time `gorm:"type:date;not null;index" json:"check_in"`
	CheckOut time.Time `gorm:"type:date;not null;index" json:"check_out"`
	Guests   int       `gorm:"not null;default:1" json:"guests"`

	TotalPrice float64 `gorm:"type:decimal(10,2);not null" json:"total_price"`
	Currency   string  `gorm:"size:3;not null;default:KRW" json:"currency"`

	Status        string `gorm:"size:16;not null;default:pending" json:"status"`
	PaymentStatus string `gorm:"size:16;not null;default:pending" json:"payment_status"`

	SpecialRequests    string     `gorm:"type:text" json:"special_requests"`
	CancelledAt        *time.Time `json:"cancelled_at"`
	CancellationReason string     `gorm:"size:500" json:"cancellation_reason"`
}
