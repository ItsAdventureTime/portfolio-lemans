package config

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

var cloudflareR2Endpoint = regexp.MustCompile(`^https://[0-9a-fA-F]{32}\.r2\.cloudflarestorage\.com$`)

type Config struct {
	DatabaseURL       string
	ListenAddr        string
	LogLevel          string
	DemoMode          bool
	B2Endpoint        string
	B2Region          string
	B2AccessKeyID     string
	B2SecretAccessKey string
	B2BucketName      string
	B2KeyPrefix       string
}

func Load() (Config, error) {
	var cfg Config
	keys := []struct {
		key, fallback string
		value          *string
	}{
		{"DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lemans_db", &cfg.DatabaseURL},
		{"LISTEN_ADDR", ":8080", &cfg.ListenAddr},
		{"LOG_LEVEL", "info", &cfg.LogLevel},
		{"B2_ENDPOINT", "", &cfg.B2Endpoint},
		{"B2_REGION", "us-west-004", &cfg.B2Region},
		{"B2_ACCESS_KEY_ID", "", &cfg.B2AccessKeyID},
		{"B2_SECRET_ACCESS_KEY", "", &cfg.B2SecretAccessKey},
		{"B2_BUCKET_NAME", "bridge-ph", &cfg.B2BucketName},
		{"B2_KEY_PREFIX", defaultB2KeyPrefix(), &cfg.B2KeyPrefix},
	}
	for _, item := range keys {
		value, err := getEnv(item.key, item.fallback)
		if err != nil {
			return Config{}, err
		}
		*item.value = value
	}
	demoMode, err := getEnv("DEMO_MODE", "false")
	if err != nil {
		return Config{}, err
	}
	cfg.DemoMode = demoMode == "true"
	if cfg.B2Region == "auto" && !cloudflareR2Endpoint.MatchString(cfg.B2Endpoint) {
		return Config{}, fmt.Errorf("B2_ENDPOINT must be an account-specific Cloudflare R2 endpoint when B2_REGION=auto")
	}
	return cfg, nil
}

func defaultB2KeyPrefix() string {
	if os.Getenv("DEMO_MODE") == "true" {
		return "lemans/demo"
	}
	return "lemans"
}

func getEnv(key, fallback string) (string, error) {
	if path := os.Getenv(key + "_FILE"); path != "" {
		contents, err := os.ReadFile(path)
		if err != nil {
			return "", fmt.Errorf("%s_FILE could not be read", key)
		}
		if value := strings.TrimSpace(string(contents)); value != "" {
			return value, nil
		}
		return "", fmt.Errorf("%s_FILE is empty", key)
	}
	if v := os.Getenv(key); v != "" {
		return v, nil
	}
	return fallback, nil
}
