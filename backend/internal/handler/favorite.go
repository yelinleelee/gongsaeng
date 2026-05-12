package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/hierolabs/gongsaeng/backend/internal/auth"
	"github.com/hierolabs/gongsaeng/backend/internal/model"
)

type favoriteRequest struct {
	SvcID      string `json:"svc_id" binding:"required"`
	SvcNm      string `json:"svc_nm"`
	PlaceNm    string `json:"place_nm"`
	AreaNm     string `json:"area_nm"`
	PayAtNm    string `json:"pay_at_nm"`
	ImgURL     string `json:"img_url"`
	SvcURL     string `json:"svc_url"`
	MinClassNm string `json:"min_class_nm"`
	VMax       string `json:"v_max"`
	X          string `json:"x"`
	Y          string `json:"y"`
}

// ListFavorites returns all favorites owned by the current user, newest first.
func ListFavorites(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var rows []model.Favorite
		if err := db.Where("user_id = ?", auth.UserID(c)).
			Order("created_at DESC").
			Find(&rows).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, rows)
	}
}

// AddFavorite upserts a favorite for the current user.
// Idempotent: re-adding the same svc_id returns 200 with the existing row.
func AddFavorite(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req favoriteRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "svc_id is required"})
			return
		}

		uid := auth.UserID(c)
		var existing model.Favorite
		err := db.Where("user_id = ? AND svc_id = ?", uid, req.SvcID).First(&existing).Error
		if err == nil {
			c.JSON(http.StatusOK, existing)
			return
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		fav := model.Favorite{
			UserID:     uid,
			SvcID:      req.SvcID,
			SvcNm:      req.SvcNm,
			PlaceNm:    req.PlaceNm,
			AreaNm:     req.AreaNm,
			PayAtNm:    req.PayAtNm,
			ImgURL:     req.ImgURL,
			SvcURL:     req.SvcURL,
			MinClassNm: req.MinClassNm,
			VMax:       req.VMax,
			X:          req.X,
			Y:          req.Y,
		}
		if err := db.Create(&fav).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, fav)
	}
}

// RemoveFavorite deletes by svc_id for the current user.
// 204 even if the favorite did not exist (idempotent).
func RemoveFavorite(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		svcID := c.Param("svcId")
		if svcID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "svc_id is required"})
			return
		}
		if err := db.Where("user_id = ? AND svc_id = ?", auth.UserID(c), svcID).
			Delete(&model.Favorite{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Status(http.StatusNoContent)
	}
}
