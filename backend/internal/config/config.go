package config

import (
	"os"
)

type Config struct {
	DatabaseURL      string
	ListenAddr       string
	LogLevel         string
	DemoMode         bool
	B2Endpoint       string
	B2Region         string
	B2AccessKeyID    string
	B2SecretAccessKey string
	B2BucketName     string
}

func Load() Config {
	return Config{
		DatabaseURL:       getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lemans_db"),
		ListenAddr:        getEnv("LISTEN_ADDR", ":8080"),
		LogLevel:          getEnv("LOG_LEVEL", "info"),
		DemoMode:          getEnv("DEMO_MODE", "false") == "true",
		B2Endpoint:        getEnv("B2_ENDPOINT", ""),
		B2Region:          getEnv("B2_REGION", "us-west-004"),
		B2AccessKeyID:     getEnv("B2_ACCESS_KEY_ID", ""),
		B2SecretAccessKey: getEnv("B2_SECRET_ACCESS_KEY", ""),
		B2BucketName:      getEnv("B2_BUCKET_NAME", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
