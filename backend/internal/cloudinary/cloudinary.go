package cloudinary

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"sync"

	cld "github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type Client struct {
	cld    *cld.Cloudinary
	folder string
}

type UploadResult struct {
	URL      string `json:"url"`
	PublicID string `json:"public_id"`
	Width    int    `json:"width"`
	Height   int    `json:"height"`
}

var (
	once     sync.Once
	instance *Client
	initErr  error
)

// New initializes the Cloudinary client from env. Required:
//   CLOUDINARY_URL  cloudinary://<api_key>:<api_secret>@<cloud_name>
// Optional:
//   CLOUDINARY_FOLDER  default upload folder (defaults to "itda/stays")
func New() (*Client, error) {
	once.Do(func() {
		url := os.Getenv("CLOUDINARY_URL")
		if url == "" {
			initErr = errors.New("CLOUDINARY_URL is not set")
			return
		}
		c, err := cld.NewFromURL(url)
		if err != nil {
			initErr = fmt.Errorf("cloudinary init: %w", err)
			return
		}
		folder := os.Getenv("CLOUDINARY_FOLDER")
		if folder == "" {
			folder = "itda/stays"
		}
		instance = &Client{cld: c, folder: folder}
	})
	return instance, initErr
}

func (c *Client) Upload(ctx context.Context, src io.Reader) (*UploadResult, error) {
	res, err := c.cld.Upload.Upload(ctx, src, uploader.UploadParams{
		Folder: c.folder,
	})
	if err != nil {
		return nil, err
	}
	return &UploadResult{
		URL:      res.SecureURL,
		PublicID: res.PublicID,
		Width:    res.Width,
		Height:   res.Height,
	}, nil
}

func (c *Client) Destroy(ctx context.Context, publicID string) error {
	_, err := c.cld.Upload.Destroy(ctx, uploader.DestroyParams{PublicID: publicID})
	return err
}
