package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/hierolabs/gongsaeng/backend/internal/auth"
	"github.com/hierolabs/gongsaeng/backend/internal/model"
)

func ListPropertyReviews(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		propertyID, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var reviews []model.Review
		if err := db.Preload("User").
			Where("property_id = ?", uint(propertyID)).
			Order("created_at DESC").Find(&reviews).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, reviews)
	}
}

type createReviewRequest struct {
	BookingID     uint   `json:"booking_id" binding:"required"`
	Rating        int    `json:"rating" binding:"required,min=1,max=5"`
	Comment       string `json:"comment"`
	Cleanliness   int    `json:"cleanliness" binding:"omitempty,min=1,max=5"`
	Accuracy      int    `json:"accuracy" binding:"omitempty,min=1,max=5"`
	Communication int    `json:"communication" binding:"omitempty,min=1,max=5"`
	Location      int    `json:"location" binding:"omitempty,min=1,max=5"`
	CheckIn       int    `json:"check_in" binding:"omitempty,min=1,max=5"`
	Value         int    `json:"value" binding:"omitempty,min=1,max=5"`
}

func CreateReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req createReviewRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var booking model.Booking
		if err := db.First(&booking, req.BookingID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
			return
		}
		if booking.GuestID != auth.UserID(c) {
			c.JSON(http.StatusForbidden, gin.H{"error": "only the guest can review"})
			return
		}
		if booking.Status == model.BookingStatusCancelled {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cancelled bookings cannot be reviewed"})
			return
		}
		// Allow review when stay has ended (confirmed past checkout) or marked completed.
		stayEnded := !booking.CheckOut.After(time.Now())
		if !(booking.Status == model.BookingStatusCompleted || stayEnded) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "review available after the stay ends"})
			return
		}

		var existing model.Review
		err := db.Where("booking_id = ?", booking.ID).First(&existing).Error
		if err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "already reviewed"})
			return
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		review := model.Review{
			PropertyID:    booking.PropertyID,
			BookingID:     booking.ID,
			UserID:        booking.GuestID,
			Rating:        req.Rating,
			Comment:       req.Comment,
			Cleanliness:   req.Cleanliness,
			Accuracy:      req.Accuracy,
			Communication: req.Communication,
			Location:      req.Location,
			CheckIn:       req.CheckIn,
			Value:         req.Value,
		}
		if err := db.Create(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := recomputePropertyRating(db, booking.PropertyID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		db.Preload("User").First(&review, review.ID)
		c.JSON(http.StatusCreated, review)
	}
}

func recomputePropertyRating(db *gorm.DB, propertyID uint) error {
	type aggResult struct {
		Avg   float64
		Count int64
	}
	var agg aggResult
	if err := db.Model(&model.Review{}).
		Select("COALESCE(AVG(rating), 0) AS avg, COUNT(*) AS count").
		Where("property_id = ?", propertyID).
		Scan(&agg).Error; err != nil {
		return err
	}
	return db.Model(&model.Property{}).
		Where("id = ?", propertyID).
		Updates(map[string]any{
			"rating":       agg.Avg,
			"review_count": agg.Count,
		}).Error
}
