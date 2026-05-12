package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/hierolabs/gongsaeng/backend/internal/auth"
	"github.com/hierolabs/gongsaeng/backend/internal/firebase"
	"github.com/hierolabs/gongsaeng/backend/internal/model"
)

type googleLoginRequest struct {
	IDToken string `json:"id_token" binding:"required"`
}

type userResponse struct {
	ID                  uint   `json:"id"`
	Email               string `json:"email"`
	Name                string `json:"name"`
	Phone               string `json:"phone"`
	Role                string `json:"role"`
	Avatar              string `json:"avatar"`
	IsVerified          bool   `json:"is_verified"`
	CreatorType         string `json:"creator_type"`
	PreferredCategories string `json:"preferred_categories"`
	PreferredCapacity   string `json:"preferred_capacity"`
	PreferredDistricts  string `json:"preferred_districts"`
	Bio                 string `json:"bio"`
}

type loginUserResponse struct {
	Token string       `json:"token"`
	User  userResponse `json:"user"`
}

func toUserResponse(u model.User) userResponse {
	return userResponse{
		ID:                  u.ID,
		Email:               u.Email,
		Name:                u.Name,
		Phone:               u.Phone,
		Role:                u.Role,
		Avatar:              u.Avatar,
		IsVerified:          u.IsVerified,
		CreatorType:         u.CreatorType,
		PreferredCategories: u.PreferredCategories,
		PreferredCapacity:   u.PreferredCapacity,
		PreferredDistricts:  u.PreferredDistricts,
		Bio:                 u.Bio,
	}
}

// GoogleLogin verifies a Firebase ID token, upserts the user, and returns
// our own JWT for subsequent API calls.
func GoogleLogin(db *gorm.DB, verifier *firebase.Verifier) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req googleLoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "id_token is required"})
			return
		}

		identity, err := verifier.Verify(c.Request.Context(), req.IDToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid firebase token"})
			return
		}
		if identity.Email == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "google account has no email"})
			return
		}

		var user model.User
		err = db.Where("firebase_uid = ?", identity.UID).First(&user).Error
		switch {
		case err == nil:
			// existing user — keep profile in sync with Google
			updates := map[string]any{
				"email":       identity.Email,
				"name":        firstNonEmpty(identity.Name, user.Name, identity.Email),
				"avatar":      firstNonEmpty(identity.Picture, user.Avatar),
				"is_verified": true,
			}
			if err := db.Model(&user).Updates(updates).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		case errors.Is(err, gorm.ErrRecordNotFound):
			user = model.User{
				FirebaseUID: identity.UID,
				Email:       identity.Email,
				Name:        firstNonEmpty(identity.Name, identity.Email),
				Avatar:      identity.Picture,
				Role:        model.RoleGuest,
				IsVerified:  true,
			}
			if err := db.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		token, err := auth.IssueUserToken(user.ID, user.Email, user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, loginUserResponse{Token: token, User: toUserResponse(user)})
	}
}

func UserMe(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var user model.User
		if err := db.First(&user, auth.UserID(c)).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusOK, toUserResponse(user))
	}
}

type updateMeRequest struct {
	Name                *string `json:"name"`
	Phone               *string `json:"phone"`
	CreatorType         *string `json:"creator_type"`
	PreferredCategories *string `json:"preferred_categories"`
	PreferredCapacity   *string `json:"preferred_capacity"`
	PreferredDistricts  *string `json:"preferred_districts"`
	Bio                 *string `json:"bio"`
}

func UpdateMe(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req updateMeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		updates := map[string]any{}
		if req.Name != nil {
			updates["name"] = *req.Name
		}
		if req.Phone != nil {
			updates["phone"] = *req.Phone
		}
		if req.CreatorType != nil {
			updates["creator_type"] = *req.CreatorType
		}
		if req.PreferredCategories != nil {
			updates["preferred_categories"] = *req.PreferredCategories
		}
		if req.PreferredCapacity != nil {
			updates["preferred_capacity"] = *req.PreferredCapacity
		}
		if req.PreferredDistricts != nil {
			updates["preferred_districts"] = *req.PreferredDistricts
		}
		if req.Bio != nil {
			updates["bio"] = *req.Bio
		}
		if len(updates) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "nothing to update"})
			return
		}

		if err := db.Model(&model.User{}).Where("id = ?", auth.UserID(c)).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var updated model.User
		db.First(&updated, auth.UserID(c))
		c.JSON(http.StatusOK, toUserResponse(updated))
	}
}

// BecomeHost flips the current user's role to host.
func BecomeHost(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := db.Model(&model.User{}).Where("id = ?", auth.UserID(c)).Update("role", model.RoleHost).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		var updated model.User
		db.First(&updated, auth.UserID(c))
		c.JSON(http.StatusOK, toUserResponse(updated))
	}
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
