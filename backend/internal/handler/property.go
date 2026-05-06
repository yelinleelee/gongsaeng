package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/hierolabs/gongsaeng/backend/internal/auth"
	"github.com/hierolabs/gongsaeng/backend/internal/model"
)

type propertyInput struct {
	Title        string   `json:"title" binding:"required"`
	Description  string   `json:"description"`
	PropertyType string   `json:"property_type" binding:"required"`
	RoomType     string   `json:"room_type" binding:"required"`
	MaxGuests    int      `json:"max_guests" binding:"required,min=1"`
	Bedrooms     int      `json:"bedrooms"`
	Beds         int      `json:"beds"`
	Bathrooms    float32  `json:"bathrooms"`
	Price        float64  `json:"price" binding:"required,min=0"`
	Currency     string   `json:"currency"`
	Address      string   `json:"address" binding:"required"`
	City         string   `json:"city" binding:"required"`
	Country      string   `json:"country" binding:"required"`
	Latitude     float64  `json:"latitude"`
	Longitude    float64  `json:"longitude"`
	Amenities    []string `json:"amenities"`
	Images       []string `json:"images"`
	IsAvailable  *bool    `json:"is_available"`
}

func ListProperties(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		q := db.Model(&model.Property{}).Preload("Host")

		if city := c.Query("city"); city != "" {
			q = q.Where("city LIKE ?", "%"+city+"%")
		}
		if pt := c.Query("property_type"); pt != "" {
			q = q.Where("property_type = ?", pt)
		}
		if v := c.Query("min_price"); v != "" {
			if n, err := strconv.ParseFloat(v, 64); err == nil {
				q = q.Where("price >= ?", n)
			}
		}
		if v := c.Query("max_price"); v != "" {
			if n, err := strconv.ParseFloat(v, 64); err == nil {
				q = q.Where("price <= ?", n)
			}
		}
		if v := c.Query("guests"); v != "" {
			if n, err := strconv.Atoi(v); err == nil {
				q = q.Where("max_guests >= ?", n)
			}
		}
		if c.Query("available") != "false" {
			q = q.Where("is_available = ?", true)
		}

		var properties []model.Property
		if err := q.Order("created_at DESC").Find(&properties).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, properties)
	}
}

func GetProperty(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := parsePropertyID(c)
		if !ok {
			return
		}
		var p model.Property
		if err := db.Preload("Host").First(&p, id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, p)
	}
}

func CreateProperty(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req propertyInput
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		p := model.Property{
			HostID:       auth.UserID(c),
			Title:        req.Title,
			Description:  req.Description,
			PropertyType: req.PropertyType,
			RoomType:     req.RoomType,
			MaxGuests:    req.MaxGuests,
			Bedrooms:     orDefault(req.Bedrooms, 1),
			Beds:         orDefault(req.Beds, 1),
			Bathrooms:    orDefaultF32(req.Bathrooms, 1),
			Price:        req.Price,
			Currency:     orDefaultStr(req.Currency, "KRW"),
			Address:      req.Address,
			City:         req.City,
			Country:      req.Country,
			Latitude:     req.Latitude,
			Longitude:    req.Longitude,
			Amenities:    model.StringSlice(req.Amenities),
			Images:       model.StringSlice(req.Images),
			IsAvailable:  req.IsAvailable == nil || *req.IsAvailable,
		}
		if err := db.Create(&p).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		db.Preload("Host").First(&p, p.ID)
		c.JSON(http.StatusCreated, p)
	}
}

func UpdateProperty(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := parsePropertyID(c)
		if !ok {
			return
		}

		var p model.Property
		if err := db.First(&p, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
			return
		}
		if p.HostID != auth.UserID(c) {
			c.JSON(http.StatusForbidden, gin.H{"error": "not the owner"})
			return
		}

		var req propertyInput
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		updates := map[string]any{
			"title":         req.Title,
			"description":   req.Description,
			"property_type": req.PropertyType,
			"room_type":     req.RoomType,
			"max_guests":    req.MaxGuests,
			"bedrooms":      req.Bedrooms,
			"beds":          req.Beds,
			"bathrooms":     req.Bathrooms,
			"price":         req.Price,
			"currency":      orDefaultStr(req.Currency, "KRW"),
			"address":       req.Address,
			"city":          req.City,
			"country":       req.Country,
			"latitude":      req.Latitude,
			"longitude":     req.Longitude,
			"amenities":     model.StringSlice(req.Amenities),
			"images":        model.StringSlice(req.Images),
		}
		if req.IsAvailable != nil {
			updates["is_available"] = *req.IsAvailable
		}

		if err := db.Model(&p).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		db.Preload("Host").First(&p, p.ID)
		c.JSON(http.StatusOK, p)
	}
}

func DeleteProperty(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := parsePropertyID(c)
		if !ok {
			return
		}
		var p model.Property
		if err := db.First(&p, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
			return
		}
		if p.HostID != auth.UserID(c) {
			c.JSON(http.StatusForbidden, gin.H{"error": "not the owner"})
			return
		}
		if err := db.Delete(&p).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// MyProperties returns the current host's properties.
func MyProperties(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var properties []model.Property
		if err := db.Where("host_id = ?", auth.UserID(c)).
			Order("created_at DESC").Find(&properties).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, properties)
	}
}

func parsePropertyID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return 0, false
	}
	return uint(id), true
}

func orDefault(v, d int) int {
	if v <= 0 {
		return d
	}
	return v
}

func orDefaultF32(v, d float32) float32 {
	if v <= 0 {
		return d
	}
	return v
}

func orDefaultStr(v, d string) string {
	if v == "" {
		return d
	}
	return v
}
