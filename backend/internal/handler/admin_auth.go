package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/hierolabs/itda/backend/internal/auth"
	"github.com/hierolabs/itda/backend/internal/model"
)

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type loginResponse struct {
	Token        string `json:"token"`
	Username     string `json:"username"`
	IsSuperAdmin bool   `json:"is_super_admin"`
}

func AdminLogin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
			return
		}

		var admin model.AdminUser
		if err := db.Where("username = ?", req.Username).First(&admin).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if !auth.CheckPassword(admin.PasswordHash, req.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		token, err := auth.IssueAdminToken(admin.ID, admin.Username, admin.IsSuperAdmin)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, loginResponse{Token: token, Username: admin.Username, IsSuperAdmin: admin.IsSuperAdmin})
	}
}

func AdminMe() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"username":      auth.AdminUsername(c),
			"is_super_admin": auth.AdminIsSuperAdmin(c),
		})
	}
}
