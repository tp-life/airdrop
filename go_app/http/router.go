package http

import (
	"net/http"
	"time"

	"github.com/gin-contrib/timeout"

	"github.com/gin-gonic/gin"
)

func testResponse(c *gin.Context) {
	c.JSON(http.StatusGatewayTimeout, gin.H{
		"code": http.StatusGatewayTimeout,
		"msg":  "timeout",
		"data": nil,
	})
}

func timeoutMiddleware() gin.HandlerFunc {
	return timeout.New(
		timeout.WithTimeout(240*time.Second),
		timeout.WithHandler(func(c *gin.Context) {
			c.Next()
		}),
		timeout.WithResponse(testResponse),
	)
}

func Register(r *gin.Engine) {

	r.Use(timeoutMiddleware())

}
