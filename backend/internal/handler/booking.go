package handler

import (
	"errors"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/hierolabs/gongsaeng/backend/internal/auth"
	"github.com/hierolabs/gongsaeng/backend/internal/model"
)

const dateLayout = "2006-01-02"

type createBookingRequest struct {
	PropertyID      uint   `json:"property_id" binding:"required"`
	CheckIn         string `json:"check_in" binding:"required"`
	CheckOut        string `json:"check_out" binding:"required"`
	Guests          int    `json:"guests"`
	SpecialRequests string `json:"special_requests"`
}

func CreateBooking(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req createBookingRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		checkIn, err := time.Parse(dateLayout, req.CheckIn)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid check_in (YYYY-MM-DD)"})
			return
		}
		checkOut, err := time.Parse(dateLayout, req.CheckOut)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid check_out (YYYY-MM-DD)"})
			return
		}
		if !checkIn.Before(checkOut) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "check_out must be after check_in"})
			return
		}

		var property model.Property
		if err := db.First(&property, req.PropertyID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
			return
		}
		userID := auth.UserID(c)
		if property.HostID == userID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot book your own property"})
			return
		}

		// Half-open overlap: existing.check_in < new.check_out AND existing.check_out > new.check_in
		var conflict model.Booking
		err = db.Where(
			"property_id = ? AND status <> ? AND check_in < ? AND check_out > ?",
			req.PropertyID, model.BookingStatusCancelled, checkOut, checkIn,
		).First(&conflict).Error
		if err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "selected dates are already booked"})
			return
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		nights := int(math.Ceil(checkOut.Sub(checkIn).Hours() / 24))
		guests := req.Guests
		if guests <= 0 {
			guests = 1
		}

		booking := model.Booking{
			PropertyID:      req.PropertyID,
			GuestID:         userID,
			CheckIn:         checkIn,
			CheckOut:        checkOut,
			Guests:          guests,
			TotalPrice:      property.Price * float64(nights),
			Currency:        property.Currency,
			Status:          model.BookingStatusPending,
			PaymentStatus:   model.PaymentStatusPending,
			SpecialRequests: req.SpecialRequests,
		}
		if err := db.Create(&booking).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		preloadBooking(db, &booking)
		c.JSON(http.StatusCreated, booking)
	}
}

func MyBookings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var bookings []model.Booking
		if err := db.Preload("Property").Preload("Property.Host").
			Where("guest_id = ?", auth.UserID(c)).
			Order("created_at DESC").Find(&bookings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, bookings)
	}
}

func HostBookings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var bookings []model.Booking
		err := db.Preload("Property").Preload("Guest").
			Joins("JOIN properties ON properties.id = bookings.property_id").
			Where("properties.host_id = ?", auth.UserID(c)).
			Order("bookings.created_at DESC").
			Find(&bookings).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, bookings)
	}
}

func GetBooking(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := parseBookingID(c)
		if !ok {
			return
		}
		var b model.Booking
		if err := db.Preload("Property").Preload("Property.Host").Preload("Guest").First(&b, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
			return
		}
		uid := auth.UserID(c)
		if b.GuestID != uid && b.Property.HostID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "not allowed"})
			return
		}
		c.JSON(http.StatusOK, b)
	}
}

type cancelRequest struct {
	Reason string `json:"reason"`
}

func CancelBooking(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := parseBookingID(c)
		if !ok {
			return
		}
		var b model.Booking
		if err := db.First(&b, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
			return
		}
		if b.GuestID != auth.UserID(c) {
			c.JSON(http.StatusForbidden, gin.H{"error": "not the guest"})
			return
		}
		if b.Status == model.BookingStatusCancelled {
			c.JSON(http.StatusBadRequest, gin.H{"error": "already cancelled"})
			return
		}

		var req cancelRequest
		_ = c.ShouldBindJSON(&req)

		now := time.Now()
		updates := map[string]any{
			"status":              model.BookingStatusCancelled,
			"cancelled_at":        &now,
			"cancellation_reason": req.Reason,
		}
		if err := db.Model(&b).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		preloadBooking(db, &b)
		c.JSON(http.StatusOK, b)
	}
}

func ApproveBooking(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := parseBookingID(c)
		if !ok {
			return
		}
		var b model.Booking
		if err := db.Preload("Property").First(&b, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
			return
		}
		if b.Property.HostID != auth.UserID(c) {
			c.JSON(http.StatusForbidden, gin.H{"error": "not the host"})
			return
		}
		if b.Status != model.BookingStatusPending {
			c.JSON(http.StatusBadRequest, gin.H{"error": "only pending bookings can be approved"})
			return
		}
		if err := db.Model(&b).Update("status", model.BookingStatusConfirmed).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		preloadBooking(db, &b)
		c.JSON(http.StatusOK, b)
	}
}

type bookedRange struct {
	CheckIn  string `json:"check_in"`
	CheckOut string `json:"check_out"`
}

// PropertyBookedDates returns active (non-cancelled) booked ranges for a property,
// used by the public-facing booking calendar.
func PropertyBookedDates(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}

		var rows []model.Booking
		if err := db.Select("check_in, check_out").
			Where("property_id = ? AND status <> ? AND check_out >= ?",
				uint(id), model.BookingStatusCancelled, time.Now().Truncate(24*time.Hour)).
			Find(&rows).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		out := make([]bookedRange, len(rows))
		for i, r := range rows {
			out[i] = bookedRange{
				CheckIn:  r.CheckIn.Format(dateLayout),
				CheckOut: r.CheckOut.Format(dateLayout),
			}
		}
		c.JSON(http.StatusOK, out)
	}
}

func preloadBooking(db *gorm.DB, b *model.Booking) {
	db.Preload("Property").Preload("Property.Host").Preload("Guest").First(b, b.ID)
}

func parseBookingID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return 0, false
	}
	return uint(id), true
}
