package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/hierolabs/itda/backend/internal/cloudinary"
)

const maxImageBytes = 10 << 20 // 10 MB per file

func UploadImage(c *cloudinary.Client) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.Request.Body = http.MaxBytesReader(ctx.Writer, ctx.Request.Body, maxImageBytes)
		fh, err := ctx.FormFile("image")
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "이미지를 선택해주세요"})
			return
		}
		f, err := fh.Open()
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer f.Close()

		res, err := c.Upload(ctx.Request.Context(), f)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, res)
	}
}

func UploadImages(c *cloudinary.Client) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Allow up to 10 files × 10MB.
		ctx.Request.Body = http.MaxBytesReader(ctx.Writer, ctx.Request.Body, 10*maxImageBytes)
		form, err := ctx.MultipartForm()
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		files := form.File["images"]
		if len(files) == 0 {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "이미지를 선택해주세요"})
			return
		}
		if len(files) > 10 {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "이미지는 최대 10장까지 업로드할 수 있습니다"})
			return
		}

		results := make([]*cloudinary.UploadResult, 0, len(files))
		for _, fh := range files {
			f, err := fh.Open()
			if err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			res, err := c.Upload(ctx.Request.Context(), f)
			f.Close()
			if err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			results = append(results, res)
		}
		ctx.JSON(http.StatusOK, gin.H{"images": results})
	}
}

type destroyImageRequest struct {
	PublicID string `json:"public_id" binding:"required"`
}

func DestroyImage(c *cloudinary.Client) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req destroyImageRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "public_id is required"})
			return
		}
		if err := c.Destroy(ctx.Request.Context(), req.PublicID); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"ok": true})
	}
}
