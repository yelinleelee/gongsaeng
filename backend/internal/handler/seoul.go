package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

var seoulHTTPClient = &http.Client{Timeout: 10 * time.Second}

func proxySeoul(c *gin.Context, dataset string) {
	apiKey := os.Getenv("SEOUL_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SEOUL_API_KEY is not set"})
		return
	}

	url := fmt.Sprintf("http://openapi.seoul.go.kr:8088/%s/json/%s/1/100/", apiKey, dataset)
	resp, err := seoulHTTPClient.Get(url)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.Data(resp.StatusCode, "application/json; charset=utf-8", body)
		return
	}

	var parsed any
	if err := json.Unmarshal(body, &parsed); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "invalid upstream JSON"})
		return
	}
	c.JSON(http.StatusOK, parsed)
}

func SeoulSpaces() gin.HandlerFunc {
	return func(c *gin.Context) {
		proxySeoul(c, "ListPublicReservationInstitution")
	}
}

func SeoulCulture() gin.HandlerFunc {
	return func(c *gin.Context) {
		proxySeoul(c, "ListPublicReservationCulture")
	}
}
