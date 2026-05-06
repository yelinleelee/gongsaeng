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

type adminUserResponse struct {
	ID           uint   `json:"id"`
	Username     string `json:"username"`
	IsSuperAdmin bool   `json:"is_super_admin"`
	CreatedAt    string `json:"created_at"`
}

func toAdminResponse(a model.AdminUser) adminUserResponse {
	return adminUserResponse{
		ID:           a.ID,
		Username:     a.Username,
		IsSuperAdmin: a.IsSuperAdmin,
		CreatedAt:    a.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func ListAdmins(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var admins []model.AdminUser
		if err := db.Find(&admins).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		resp := make([]adminUserResponse, len(admins))
		for i, a := range admins {
			resp[i] = toAdminResponse(a)
		}
		c.JSON(http.StatusOK, resp)
	}
}

type createAdminRequest struct {
	Username     string `json:"username" binding:"required,min=3,max=64"`
	Password     string `json:"password" binding:"required,min=8"`
	IsSuperAdmin bool   `json:"is_super_admin"`
}

func CreateAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req createAdminRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		hash, err := auth.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		admin := model.AdminUser{
			Username:     req.Username,
			PasswordHash: hash,
			IsSuperAdmin: req.IsSuperAdmin,
		}
		if err := db.Create(&admin).Error; err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				c.JSON(http.StatusConflict, gin.H{"error": "username already exists"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toAdminResponse(admin))
	}
}

type updateAdminRequest struct {
	Username     *string `json:"username"`
	IsSuperAdmin *bool   `json:"is_super_admin"`
}

func UpdateAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		target, ok := parseAdminID(c)
		if !ok {
			return
		}

		var req updateAdminRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		updates := map[string]any{}
		if req.Username != nil {
			updates["username"] = *req.Username
		}
		if req.IsSuperAdmin != nil {
			updates["is_super_admin"] = *req.IsSuperAdmin
		}
		if len(updates) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "nothing to update"})
			return
		}

		if err := db.Model(&model.AdminUser{}).Where("id = ?", target).Updates(updates).Error; err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				c.JSON(http.StatusConflict, gin.H{"error": "username already exists"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var updated model.AdminUser
		db.First(&updated, target)
		c.JSON(http.StatusOK, toAdminResponse(updated))
	}
}

type resetPasswordRequest struct {
	Password string `json:"password" binding:"required,min=8"`
}

func ResetAdminPassword(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		target, ok := parseAdminID(c)
		if !ok {
			return
		}

		var req resetPasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		hash, err := auth.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if err := db.Model(&model.AdminUser{}).Where("id = ?", target).Update("password_hash", hash).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func DeleteAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		target, ok := parseAdminID(c)
		if !ok {
			return
		}
		// Prevent self-deletion
		if auth.AdminID(c) == target {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete your own account"})
			return
		}

		if err := db.Delete(&model.AdminUser{}, target).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func parseAdminID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return 0, false
	}
	return uint(id), true
}
