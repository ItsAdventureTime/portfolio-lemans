package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/api"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/config"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/db"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/logger"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.LogLevel)

	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Error("database connection failed", slog.Any("error", err))
		os.Exit(1)
	}
	defer pool.Close()

	if err := db.Migrate(pool, cfg.DatabaseURL); err != nil {
		log.Error("migrations failed", slog.Any("error", err))
		os.Exit(1)
	}

	handler := api.NewRouter(pool, cfg, log)

	server := &http.Server{
		Addr:         cfg.ListenAddr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		log.Info("api server listening", slog.String("addr", cfg.ListenAddr))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server error", slog.Any("error", err))
			os.Exit(1)
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("server shutdown error", slog.Any("error", err))
	}
	fmt.Fprintln(os.Stderr, "server stopped")
}
